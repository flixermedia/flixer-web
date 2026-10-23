<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { applyStep, describeFailure, getProgress, testStep, type ConfigField } from '../../setup/setupApi'
import AdminSection from './AdminSection.vue'

type Target = 'database' | 'redis'

const { t } = useI18n()
const targets: { id: Target; field: 'databaseUrl' | 'redisUrl'; label: string; placeholder: string }[] = [
  { id: 'database', field: 'databaseUrl', label: 'admin.connections.databaseUrl', placeholder: 'postgres://user:password@host:5432/flixer' },
  { id: 'redis', field: 'redisUrl', label: 'admin.connections.redisUrl', placeholder: 'redis://host:6379' },
]

const config = ref<Record<string, ConfigField>>({})
const values = reactive<Record<Target, string>>({ database: '', redis: '' })
const busy = ref<Target | null>(null)
const results = reactive<Record<Target, { ok: boolean; text: string } | null>>({ database: null, redis: null })

const inputClass = 'mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 font-mono text-sm text-flixer-text disabled:opacity-60'
const button = 'rounded border border-flixer-border px-4 py-1.5 text-xs font-semibold transition hover:border-flixer-accent/60 disabled:opacity-60'
const primary = 'rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60'

onMounted(async () => {
  try {
    config.value = (await getProgress()).config
  } catch {
    config.value = {}
  }
})

function hint(field: string): string {
  const entry = config.value[field]
  if (entry?.locked) return t('admin.connections.environment')
  return entry?.set ? t('admin.connections.configured') : t('admin.connections.notConfigured')
}

async function run(target: Target, save: boolean) {
  const { field } = targets.find((entry) => entry.id === target)!
  busy.value = target
  results[target] = null
  try {
    const body = { [field]: values[target].trim() }
    const tested = await testStep(target, body)
    if (!tested.ok) {
      results[target] = { ok: false, text: tested.message || t('setup.connectionFailed') }
      return
    }
    if (!save) {
      results[target] = { ok: true, text: t('setup.connectionOk') }
      return
    }
    const applied = await applyStep(target, body)
    results[target] = { ok: true, text: applied.restart?.length ? t('admin.connections.saved', { services: applied.restart.join(', ') }) : t('admin.connections.savedNow') }
    values[target] = ''
    config.value = (await getProgress()).config
  } catch (error: unknown) {
    const failure = describeFailure(error, t('admin.connections.failed'))
    results[target] = { ok: false, text: failure.fields[field] || failure.message }
  } finally {
    busy.value = null
  }
}
</script>

<template>
  <AdminSection :title="t('admin.connections.title')" :description="t('admin.connections.description')">
    <div class="grid gap-6">
      <div v-for="target in targets" :key="target.id">
        <label class="text-xs text-flixer-muted">
          {{ t(target.label) }}
          <input v-model.trim="values[target.id]" type="text" autocomplete="off" spellcheck="false" :placeholder="target.placeholder" :disabled="config[target.field]?.locked || busy !== null" :class="inputClass" />
        </label>
        <p class="mt-1 text-xs text-flixer-muted">{{ hint(target.field) }}</p>
        <div class="mt-2 flex flex-wrap items-center gap-2">
          <button type="button" :class="button" :disabled="!values[target.id] || config[target.field]?.locked || busy !== null" @click="run(target.id, false)">{{ t('admin.connections.test') }}</button>
          <button type="button" :class="primary" :disabled="!values[target.id] || config[target.field]?.locked || busy !== null" @click="run(target.id, true)">{{ t('admin.connections.save') }}</button>
          <span v-if="results[target.id]" class="text-xs" :class="results[target.id]!.ok ? 'text-emerald-300' : 'text-red-300'">{{ results[target.id]!.text }}</span>
        </div>
      </div>
    </div>
  </AdminSection>
</template>
