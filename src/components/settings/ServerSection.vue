<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { listSettings, updateSetting, type ServerSetting } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'

interface Field {
  key: string
  label: string
  description: string
  type: 'boolean' | 'text'
}

const fields: Field[] = [
  { key: 'registration_enabled', label: 'Allow public registration', description: 'When off, only administrators can create new accounts.', type: 'boolean' },
  { key: 'server_name', label: 'Server name', description: 'Shown to users connecting to this server.', type: 'text' },
  { key: 'server_address', label: 'Server address', description: 'The public address of this server.', type: 'text' },
  { key: 'cache_path', label: 'Cache path', description: 'Where cached files are stored.', type: 'text' },
  { key: 'logs_path', label: 'Logs path', description: 'Where log files are written.', type: 'text' },
  { key: 'metadata_path', label: 'Metadata path', description: 'Where media metadata is stored.', type: 'text' },
]

const values = ref<Record<string, unknown>>({})
const isLoading = ref(true)
const savingKey = ref<string | null>(null)

async function load() {
  try {
    const settings = await listSettings()
    values.value = Object.fromEntries(settings.map((setting: ServerSetting) => [setting.key, setting.value]))
  } catch (error: unknown) {
    console.error('[settings] failed to load server settings', error)
    notify.error(describeRequestError(error, 'We couldn’t load the server settings.'))
  } finally {
    isLoading.value = false
  }
}

async function save(field: Field, value: unknown) {
  savingKey.value = field.key
  try {
    const saved = await updateSetting(field.key, value)
    values.value = { ...values.value, [field.key]: saved.value }
    notify.success(`${field.label} saved.`)
  } catch (error: unknown) {
    console.error('[settings] failed to save setting', field.key, error)
    notify.error(describeRequestError(error, 'We couldn’t save that setting.'))
    await load()
  } finally {
    savingKey.value = null
  }
}

function saveText(field: Field, event: Event) {
  const value = (event.target as HTMLInputElement).value.trim()
  if (value !== ((values.value[field.key] as string | null) ?? '')) {
    void save(field, value || null)
  }
}

onMounted(load)
</script>

<template>
  <section aria-labelledby="server-heading">
    <h2 id="server-heading" class="text-lg font-semibold">Server</h2>
    <p class="mt-1 text-sm text-flixer-muted">Administrator settings for this Flixer server.</p>

    <p v-if="isLoading" class="mt-6 text-sm text-flixer-muted">Loading settings…</p>
    <ul v-else class="mt-6 flex max-w-2xl flex-col gap-3">
      <li v-for="field in fields" :key="field.key" class="rounded-lg border border-flixer-border bg-flixer-surface/50 p-4">
        <div v-if="field.type === 'boolean'" class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-semibold">{{ field.label }}</p>
            <p class="mt-0.5 text-xs text-flixer-muted">{{ field.description }}</p>
          </div>
          <button type="button" role="switch" :aria-checked="values[field.key] === true" :aria-label="field.label" class="relative h-6 w-11 shrink-0 rounded-full transition disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="values[field.key] === true ? 'bg-flixer-primary' : 'bg-white/20'" :disabled="savingKey === field.key" @click="save(field, values[field.key] !== true)">
            <span class="absolute left-0.5 top-0.5 size-5 rounded-full bg-white transition-transform" :class="{ 'translate-x-5': values[field.key] === true }"></span>
          </button>
        </div>
        <label v-else class="flex flex-col gap-2">
          <span class="text-sm font-semibold">{{ field.label }}</span>
          <span class="text-xs text-flixer-muted">{{ field.description }}</span>
          <input type="text" :value="(values[field.key] as string | null) ?? ''" :disabled="savingKey === field.key" class="h-11 rounded-lg border border-flixer-border bg-flixer-background/60 px-3 text-sm text-flixer-text outline-none focus:border-flixer-accent/60 disabled:opacity-60" @change="saveText(field, $event)" />
        </label>
      </li>
    </ul>
  </section>
</template>
