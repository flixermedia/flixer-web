<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ListSkeleton from '../ui/ListSkeleton.vue'
import { listSettings, updateSetting, type ServerSetting, type SettingRequestValue } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'

interface Field {
  key: string
  labelKey: string
  descriptionKey: string
  type: 'boolean' | 'text'
}

const fields: Field[] = [
  { key: 'registration_enabled', labelKey: 'settings.server.registrationEnabled', descriptionKey: 'settings.server.registrationDescription', type: 'boolean' },
  { key: 'server_name', labelKey: 'settings.server.serverName', descriptionKey: 'settings.server.serverNameDescription', type: 'text' },
  { key: 'server_address', labelKey: 'settings.server.serverAddress', descriptionKey: 'settings.server.serverAddressDescription', type: 'text' },
  { key: 'cache_path', labelKey: 'settings.server.cachePath', descriptionKey: 'settings.server.cachePathDescription', type: 'text' },
  { key: 'logs_path', labelKey: 'settings.server.logsPath', descriptionKey: 'settings.server.logsPathDescription', type: 'text' },
  { key: 'metadata_path', labelKey: 'settings.server.metadataPath', descriptionKey: 'settings.server.metadataPathDescription', type: 'text' },
]

const { t } = useI18n()
const values = ref<Record<string, unknown>>({})
const isLoading = ref(true)
const savingKey = ref<string | null>(null)

async function load() {
  try {
    const [error, settings] = await catchError(listSettings())
    if (error) {
      console.error('[settings] failed to load server settings', error)
      notify.error(describeRequestError(error, t('settings.server.loadFailed')))
    } else {
      values.value = Object.fromEntries(settings.map((setting: ServerSetting) => [setting.key, setting.value]))
    }
  } finally {
    isLoading.value = false
  }
}

async function save(field: Field, value: SettingRequestValue) {
  savingKey.value = field.key
  try {
    const [error, saved] = await catchError(updateSetting(field.key, value))
    if (error) {
      console.error('[settings] failed to save setting', field.key, error)
      notify.error(describeRequestError(error, t('settings.server.saveFailed')))
      await load()
    } else {
      values.value = { ...values.value, [field.key]: saved.value }
      notify.success(t('settings.server.saved', { setting: t(field.labelKey) }))
    }
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
    <h2 id="server-heading" class="text-lg font-semibold">{{ t('settings.server.title') }}</h2>
    <p class="mt-1 text-sm text-flixer-muted">{{ t('settings.server.description') }}</p>

    <ListSkeleton v-if="isLoading" class="mt-6" />
    <ul v-else class="mt-6 flex max-w-2xl flex-col gap-3">
      <li v-for="field in fields" :key="field.key" class="rounded-lg border border-flixer-border bg-flixer-surface/50 p-4">
        <div v-if="field.type === 'boolean'" class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-semibold">{{ t(field.labelKey) }}</p>
            <p class="mt-0.5 text-xs text-flixer-muted">{{ t(field.descriptionKey) }}</p>
          </div>
          <button type="button" role="switch" :aria-checked="values[field.key] === true" :aria-label="t(field.labelKey)" class="relative h-6 w-11 shrink-0 rounded-full transition disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="values[field.key] === true ? 'bg-flixer-primary' : 'bg-white/20'" :disabled="savingKey === field.key" @click="save(field, values[field.key] !== true)">
            <span class="absolute left-0.5 top-0.5 size-5 rounded-full bg-white transition-transform" :class="{ 'translate-x-5': values[field.key] === true }"></span>
          </button>
        </div>
        <label v-else class="flex flex-col gap-2">
          <span class="text-sm font-semibold">{{ t(field.labelKey) }}</span>
          <span class="text-xs text-flixer-muted">{{ t(field.descriptionKey) }}</span>
          <input type="text" :value="(values[field.key] as string | null) ?? ''" :disabled="savingKey === field.key" class="h-11 rounded-lg border border-flixer-border bg-flixer-background/60 px-3 text-sm text-flixer-text outline-none focus:border-flixer-accent/60 disabled:opacity-60" @change="saveText(field, $event)" />
        </label>
      </li>
    </ul>
  </section>
</template>
