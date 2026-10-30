<script setup lang="ts">
import { openModal } from '@kolirt/vue-modal'
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { applyStep, describeFailure, getProgress, testStep, type ConfigField } from '../../setup/setupApi'
import { getDatabaseTransferStatus, restoreDatabaseSourceWrites, startDatabaseTransfer, type DatabaseTransferStatus } from '../../api/admin'
import DatabaseTransferConfirmModal from './DatabaseTransferConfirmModal.vue'
import AdminSection from './AdminSection.vue'
import { catchError } from '../../utils/catchError'

type Target = 'database' | 'redis' | 'services'
type Field = 'databaseUrl' | 'redisUrl' | 'indexerUrl' | 'streamerInternalUrl'

interface Entry {
  field: Field
  label: string
  placeholder: string
  /** Plain addresses are shown and edited in place; connection strings can hold a password, so they start empty. */
  prefill: boolean
}

const { t } = useI18n()
const targets: { id: Target; entries: Entry[] }[] = [
  { id: 'database', entries: [{ field: 'databaseUrl', label: 'admin.connections.databaseUrl', placeholder: 'postgres://user@host:5432/flixer', prefill: false }] },
  { id: 'redis', entries: [{ field: 'redisUrl', label: 'admin.connections.redisUrl', placeholder: 'redis://host:6379', prefill: false }] },
  {
    id: 'services',
    entries: [
      { field: 'indexerUrl', label: 'admin.connections.indexerUrl', placeholder: 'http://localhost:8092', prefill: true },
      { field: 'streamerInternalUrl', label: 'admin.connections.streamerInternalUrl', placeholder: 'http://localhost:8091', prefill: true },
    ],
  },
]

const config = ref<Record<string, ConfigField>>({})
const values = reactive<Record<Field, string>>({ databaseUrl: '', redisUrl: '', indexerUrl: '', streamerInternalUrl: '' })
const busy = ref<Target | null>(null)
const results = reactive<Record<Target, { ok: boolean; text: string } | null>>({ database: null, redis: null, services: null })
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
      if (entry.prefill) values[entry.field] = config.value[entry.field]?.value ?? config.value[entry.field]?.default ?? ''
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
  return info?.set ? t('admin.connections.configured') : t('admin.connections.notConfigured')
}

function ready(target: { entries: Entry[] }): boolean {
  return target.entries.every((entry) => values[entry.field].trim() !== '')
}

function body(target: Target, entries: Entry[]): Record<string, string> {
  const fields = Object.fromEntries(entries.map((entry) => [entry.field, values[entry.field].trim()]))
  // The services step saves all three addresses, so the public streamer address is sent back unchanged.
  return target === 'services' ? { ...fields, streamerPublicUrl: config.value.streamerPublicUrl?.value ?? '' } : fields
}

async function run(target: { id: Target; entries: Entry[] }, save: boolean) {
  busy.value = target.id
  results[target.id] = null
  try {
    const payload = body(target.id, target.entries)
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
  if (!values.databaseUrl.trim()) return
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
  <AdminSection :title="t('admin.connections.title')" :description="t('admin.connections.description')">
    <div class="grid gap-6">
      <div v-for="target in targets" :key="target.id">
        <label v-for="entry in target.entries" :key="entry.field" class="mt-2 block text-xs text-flixer-muted first:mt-0">
          {{ t(entry.label) }}
          <input v-model.trim="values[entry.field]" type="text" autocomplete="off" spellcheck="false" :placeholder="entry.field === 'databaseUrl' ? (transfer?.currentDatabaseUrl ?? entry.placeholder) : entry.placeholder" :disabled="locked(target) || busy !== null" :class="inputClass" />
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
          <button type="button" :class="primary" class="mt-3" :disabled="!values.databaseUrl.trim() || locked(target) || busy !== null || transfer?.sourceLocked || ['running', 'interrupted', 'completed'].includes(transfer?.state ?? 'idle')" @click="transferDatabase">{{ transfer?.state === 'running' ? t('admin.connections.transferring') : t('admin.connections.transfer') }}</button>
          <div v-if="transfer && transfer.state !== 'idle'" class="mt-3 rounded bg-white/5 p-3 text-xs" aria-live="polite">
            <p class="font-semibold text-flixer-text">{{ transfer.phase }}</p>
            <p class="mt-1 text-flixer-muted">{{ transfer.message }}</p>
            <button v-if="transfer.sourceLocked && transfer.state !== 'completed'" type="button" :class="button" class="mt-3" :disabled="busy !== null" @click="restoreWrites">{{ t('admin.connections.restoreWrites') }}</button>
          </div>
        </div>
      </div>
    </div>
  </AdminSection>
</template>
