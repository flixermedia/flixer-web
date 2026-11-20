<script setup lang="ts">
import { Switch, SwitchThumb } from '@ui-sdk/vue/switch'
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
      <li v-for="field in fields" :key="field.key" class="rounded border border-flixer-border bg-flixer-surface/50 p-4">
        <div v-if="field.type === 'boolean'" class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-semibold">{{ t(field.labelKey) }}</p>
            <p class="mt-0.5 text-xs text-flixer-muted">{{ t(field.descriptionKey) }}</p>
          </div>
          <Switch data-agent-hidden :checked="values[field.key] === true" :aria-label="t(field.labelKey)" class="relative mt-0 h-6 w-11 shrink-0 rounded-full border-0 bg-white/20 p-0 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent data-checked:bg-flixer-primary data-disabled:cursor-wait data-disabled:opacity-60" :disabled="savingKey === field.key" @update:checked="save(field, $event)">
            <SwitchThumb class="absolute left-0.5 top-0.5 size-5 rounded-full bg-white transition-transform data-checked:ml-0 data-checked:translate-x-5 data-checked:bg-white" />
          </Switch>
        </div>
        <label v-else class="flex flex-col gap-2">
          <span class="text-sm font-semibold">{{ t(field.labelKey) }}</span>
          <span class="text-xs text-flixer-muted">{{ t(field.descriptionKey) }}</span>
          <input type="text" :value="(values[field.key] as string | null) ?? ''" :disabled="savingKey === field.key" class="h-11 rounded border border-flixer-border bg-flixer-background/60 px-3 text-sm text-flixer-text outline-none focus:border-flixer-accent/60 disabled:opacity-60" @change="saveText(field, $event)" />
        </label>
      </li>
    </ul>
  </section>
</template>
