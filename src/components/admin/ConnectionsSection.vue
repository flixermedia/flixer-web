<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { applyStep, describeFailure, getProgress, testStep, type ConfigField } from '../../setup/setupApi'
import AdminSection from './AdminSection.vue'

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
  { id: 'database', entries: [{ field: 'databaseUrl', label: 'admin.connections.databaseUrl', placeholder: 'postgres://user:password@host:5432/flixer', prefill: false }] },
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

const inputClass = 'mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 font-mono text-sm text-flixer-text disabled:opacity-60'
const button = 'rounded border border-flixer-border px-4 py-1.5 text-xs font-semibold transition hover:border-flixer-accent/60 disabled:opacity-60'
const primary = 'rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60'

async function load() {
  try {
    config.value = (await getProgress()).config
  } catch {
    config.value = {}
  }
  for (const { entries } of targets) {
    for (const entry of entries) {
      if (entry.prefill) values[entry.field] = config.value[entry.field]?.value ?? config.value[entry.field]?.default ?? ''
    }
  }
}

onMounted(load)

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
    const tested = await testStep(target.id, payload)
    if (!tested.ok) {
      results[target.id] = { ok: false, text: tested.message || t('setup.connectionFailed') }
      return
    }
    if (!save) {
      results[target.id] = { ok: true, text: t('setup.connectionOk') }
      return
    }
    const applied = await applyStep(target.id, payload)
    results[target.id] = { ok: true, text: applied.restart?.length ? t('admin.connections.saved', { services: applied.restart.join(', ') }) : t('admin.connections.savedNow') }
    for (const entry of target.entries) if (!entry.prefill) values[entry.field] = ''
    await load()
  } catch (error: unknown) {
    const failure = describeFailure(error, t('admin.connections.failed'))
    results[target.id] = { ok: false, text: target.entries.map((entry) => failure.fields[entry.field]).find(Boolean) || failure.message }
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
          <input v-model.trim="values[entry.field]" type="text" autocomplete="off" spellcheck="false" :placeholder="entry.placeholder" :disabled="locked(target) || busy !== null" :class="inputClass" />
          <span class="mt-1 block">{{ hint(entry) }}</span>
        </label>
        <div class="mt-2 flex flex-wrap items-center gap-2">
          <button type="button" :class="button" :disabled="!ready(target) || locked(target) || busy !== null" @click="run(target, false)">{{ t('admin.connections.test') }}</button>
          <button type="button" :class="primary" :disabled="!ready(target) || locked(target) || busy !== null" @click="run(target, true)">{{ t('admin.connections.save') }}</button>
          <span v-if="results[target.id]" class="text-xs" :class="results[target.id]!.ok ? 'text-emerald-300' : 'text-red-300'">{{ results[target.id]!.text }}</span>
        </div>
      </div>
    </div>
  </AdminSection>
</template>
