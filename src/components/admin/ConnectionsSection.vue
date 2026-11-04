<script setup lang="ts">
import { openModal } from '@kolirt/vue-modal'
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { applyStep, describeFailure, getProgress, testStep, type ConfigField } from '../../setup/setupApi'
import { getDatabaseTransferStatus, restoreDatabaseSourceWrites, startDatabaseTransfer, type DatabaseTransferStatus } from '../../api/admin'
import DatabaseTransferConfirmModal from './DatabaseTransferConfirmModal.vue'
import AdminSection from './AdminSection.vue'
import { catchError } from '../../utils/catchError'

type Target = 'database' | 'redis' | 'indexer' | 'streamer' | 'meilisearch' | 'ai'
type Field = 'databaseUrl' | 'redisUrl' | 'indexerUrl' | 'streamerInternalUrl' | 'streamerPublicUrl' | 'meilisearchUrl' | 'aiUrl'

interface Entry {
  field: Field
  label: string
  placeholder: string
  /** Addresses are shown and edited in place. */
  prefill: boolean
  /** The server hides the password, so the shown address cannot be saved back until it is edited. */
  passwordHidden?: boolean
  /** Optional addresses may be saved empty. */
  optional?: boolean
}

const { t } = useI18n()
const targets: { id: Target; entries: Entry[] }[] = [
  { id: 'database', entries: [{ field: 'databaseUrl', label: 'admin.connections.databaseUrl', placeholder: 'postgres://user@host:5432/flixer', prefill: true, passwordHidden: true }] },
  { id: 'redis', entries: [{ field: 'redisUrl', label: 'admin.connections.redisUrl', placeholder: 'redis://redis:6379', prefill: true, passwordHidden: true }] },
  { id: 'indexer', entries: [{ field: 'indexerUrl', label: 'admin.connections.indexerUrl', placeholder: 'http://localhost:8092', prefill: true }] },
  {
    id: 'streamer',
    entries: [
      { field: 'streamerInternalUrl', label: 'admin.connections.streamerInternalUrl', placeholder: 'http://localhost:8091', prefill: true },
      { field: 'streamerPublicUrl', label: 'admin.connections.streamerPublicUrl', placeholder: 'admin.connections.streamerPublicPlaceholder', prefill: true, optional: true },
    ],
  },
  { id: 'meilisearch', entries: [{ field: 'meilisearchUrl', label: 'admin.connections.meilisearchUrl', placeholder: 'http://meilisearch:7700', prefill: true }] },
  { id: 'ai', entries: [{ field: 'aiUrl', label: 'admin.connections.aiUrl', placeholder: 'http://ai:8094', prefill: true }] },
]

const config = ref<Record<string, ConfigField>>({})
const loaded = reactive<Record<string, string>>({})
const values = reactive<Record<Field, string>>({ databaseUrl: '', redisUrl: '', indexerUrl: '', streamerInternalUrl: '', streamerPublicUrl: '', meilisearchUrl: '', aiUrl: '' })
const busy = ref<Target | null>(null)
const results = reactive<Record<Target, { ok: boolean; text: string } | null>>({ database: null, redis: null, indexer: null, streamer: null, meilisearch: null, ai: null })
const transfer = ref<DatabaseTransferStatus | null>(null)
let transferTimer: ReturnType<typeof setTimeout> | undefined

const inputClass = 'mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 font-mono text-sm text-flixer-text disabled:opacity-60'
const button = 'rounded border border-flixer-border px-4 py-1.5 text-xs font-semibold transition hover:border-flixer-accent/60 disabled:opacity-60'
const primary = 'rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60'

async function load() {
  const [error, progress] = await catchError(getProgress())
  if (error) {
    config.value = {}
  } else {
    config.value = progress.config
  }
  for (const { entries } of targets) {
    for (const entry of entries) {
      if (!entry.prefill) continue
      values[entry.field] = config.value[entry.field]?.value ?? (entry.passwordHidden ? '' : (config.value[entry.field]?.default ?? ''))
      loaded[entry.field] = values[entry.field]
    }
  }
}

onMounted(load)
onMounted(() => void refreshTransfer())
onBeforeUnmount(() => clearTimeout(transferTimer))

async function refreshTransfer() {
  const [error, status] = await catchError(getDatabaseTransferStatus())
  if (error) {
    results.database = { ok: false, text: describeFailure(error, t('admin.connections.transferFailed')).message }
    return
  }
  transfer.value = status
  clearTimeout(transferTimer)
  if (status.state === 'running') transferTimer = setTimeout(() => void refreshTransfer(), 2000)
}

function locked(target: { entries: Entry[] }): boolean {
  return target.entries.some((entry) => config.value[entry.field]?.locked)
}

function hint(entry: Entry): string {
  const info = config.value[entry.field]
  if (info?.locked) return t('admin.connections.environment')
  if (entry.passwordHidden && info?.set) return t('admin.connections.passwordHidden')
  return info?.set ? t('admin.connections.configured') : t('admin.connections.notConfigured')
}

function databaseChanged(): boolean {
  return values.databaseUrl.trim() !== '' && values.databaseUrl.trim() !== loaded.databaseUrl
}

function ready(target: { entries: Entry[] }): boolean {
  return target.entries.every((entry) => entry.optional || values[entry.field].trim() !== '') && target.entries.every((entry) => !entry.passwordHidden || !config.value[entry.field]?.set || values[entry.field].trim() !== loaded[entry.field])
}

function body(entries: Entry[]): Record<string, string> {
  return Object.fromEntries(entries.map((entry) => [entry.field, values[entry.field].trim()]))
}

function placeholder(entry: Entry): string {
  if (entry.field === 'databaseUrl') return transfer.value?.currentDatabaseUrl ?? entry.placeholder
  return entry.placeholder.startsWith('admin.') ? t(entry.placeholder) : entry.placeholder
}

async function run(target: { id: Target; entries: Entry[] }, save: boolean) {
  busy.value = target.id
  results[target.id] = null
  try {
    const payload = body(target.entries)
    const [testError, tested] = await catchError(testStep(target.id, payload))
    if (testError) {
      const failure = describeFailure(testError, t('admin.connections.failed'))
      results[target.id] = { ok: false, text: target.entries.map((entry) => failure.fields[entry.field]).find(Boolean) || failure.message }
      return
    }
    if (!tested.ok) {
      results[target.id] = { ok: false, text: tested.message || t('setup.connectionFailed') }
      return
    }
    if (!save) {
      results[target.id] = { ok: true, text: t('setup.connectionOk') }
      return
    }
    const [applyError, applied] = await catchError(applyStep(target.id, payload))
    if (applyError) {
      const failure = describeFailure(applyError, t('admin.connections.failed'))
      results[target.id] = { ok: false, text: target.entries.map((entry) => failure.fields[entry.field]).find(Boolean) || failure.message }
      return
    }
    results[target.id] = { ok: true, text: applied.restart?.length ? t('admin.connections.saved', { services: applied.restart.join(', ') }) : t('admin.connections.savedNow') }
    for (const entry of target.entries) if (!entry.prefill) values[entry.field] = ''
    await load()
  } finally {
    busy.value = null
  }
}

async function transferDatabase() {
  if (!databaseChanged()) return
  const replaceTarget = await openModal<boolean>(DatabaseTransferConfirmModal).catch(() => null)
  if (replaceTarget === null) return
  busy.value = 'database'
  results.database = null
  try {
    const [error, status] = await catchError(startDatabaseTransfer(values.databaseUrl.trim(), replaceTarget))
    if (error) {
      results.database = { ok: false, text: describeFailure(error, t('admin.connections.transferFailed')).message }
      return
    }
    transfer.value = status
    if (status.state === 'running') transferTimer = setTimeout(() => void refreshTransfer(), 2000)
  } finally {
    busy.value = null
  }
}

async function restoreWrites() {
  busy.value = 'database'
  results.database = null
  try {
    const [error, status] = await catchError(restoreDatabaseSourceWrites())
    if (error) {
      results.database = { ok: false, text: describeFailure(error, t('admin.connections.transferFailed')).message }
      return
    }
    transfer.value = status
  } finally {
    busy.value = null
  }
}
</script>

<template>
  <div class="grid gap-6">
    <AdminSection v-for="target in targets" :key="target.id" :title="t(`admin.connections.panels.${target.id}.title`)" :description="t(`admin.connections.panels.${target.id}.description`)">
      <label v-for="entry in target.entries" :key="entry.field" class="mt-2 block text-xs text-flixer-muted first:mt-0">
        {{ t(entry.label) }}
        <input v-model.trim="values[entry.field]" type="text" autocomplete="off" spellcheck="false" :placeholder="placeholder(entry)" :disabled="locked(target) || busy !== null" :class="inputClass" />
        <span class="mt-1 block">{{ hint(entry) }}</span>
      </label>
      <div class="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" :class="button" :disabled="!ready(target) || locked(target) || busy !== null" @click="run(target, false)">{{ t('admin.connections.test') }}</button>
        <button type="button" :class="primary" :disabled="!ready(target) || locked(target) || busy !== null || (target.id === 'database' && (transfer?.sourceLocked || ['running', 'interrupted', 'completed'].includes(transfer?.state ?? 'idle')))" @click="run(target, true)">{{ t('admin.connections.save') }}</button>
        <span v-if="results[target.id]" class="text-xs" :class="results[target.id]!.ok ? 'text-emerald-300' : 'text-red-300'">{{ results[target.id]!.text }}</span>
      </div>
      <div v-if="target.id === 'database'" class="mt-4 rounded border border-flixer-border bg-flixer-background/60 p-4">
        <p class="text-sm font-semibold text-flixer-text">{{ t('admin.connections.transferTitle') }}</p>
        <p class="mt-1 text-xs leading-5 text-flixer-muted">{{ t('admin.connections.transferDescription') }}</p>
        <button type="button" :class="primary" class="mt-3" :disabled="!databaseChanged() || locked(target) || busy !== null || transfer?.sourceLocked || ['running', 'interrupted', 'completed'].includes(transfer?.state ?? 'idle')" @click="transferDatabase">{{ transfer?.state === 'running' ? t('admin.connections.transferring') : t('admin.connections.transfer') }}</button>
        <div v-if="transfer && transfer.state !== 'idle'" class="mt-3 rounded bg-white/5 p-3 text-xs" aria-live="polite">
          <p class="font-semibold text-flixer-text">{{ transfer.phase }}</p>
          <p class="mt-1 text-flixer-muted">{{ transfer.message }}</p>
          <button v-if="transfer.sourceLocked && transfer.state !== 'completed'" type="button" :class="button" class="mt-3" :disabled="busy !== null" @click="restoreWrites">{{ t('admin.connections.restoreWrites') }}</button>
        </div>
      </div>
    </AdminSection>
  </div>
</template>
