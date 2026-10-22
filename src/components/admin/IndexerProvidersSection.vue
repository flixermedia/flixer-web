<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { INDEXER_PROVIDERS, listSettings, updateSetting, type IndexerProviderSetting } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import AdminSection from './AdminSection.vue'
import AdminToggle from './AdminToggle.vue'

const { t } = useI18n()

// The server returns this placeholder for a saved key; sending it back keeps the stored key.
const providers = reactive<Record<string, { enabled: boolean; apiKey: string; hasKey: boolean }>>(
  Object.fromEntries(INDEXER_PROVIDERS.map((provider) => [provider.id, { enabled: false, apiKey: '', hasKey: false }])),
)
const language = ref('en')
const loading = ref(true)
const saving = ref(false)
const error = ref('')

const inputClass = 'mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-flixer-text'

async function load() {
  try {
    const settings = await listSettings()
    const stored = settings.find((setting) => setting.key === 'indexer_providers')?.value as Record<string, IndexerProviderSetting> | undefined
    for (const [id, provider] of Object.entries(stored ?? {})) {
      if (providers[id]) providers[id] = { enabled: provider.enabled, apiKey: '', hasKey: Boolean(provider.apiKey) }
    }
    const lang = settings.find((setting) => setting.key === 'indexer_language')?.value
    if (typeof lang === 'string') language.value = lang
    error.value = ''
  } catch (err: unknown) {
    error.value = describeRequestError(err, t('admin.indexer.providersError'))
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    const value: Record<string, IndexerProviderSetting> = {}
    for (const { id, keyed } of INDEXER_PROVIDERS) {
      const provider = providers[id]
      const entry: IndexerProviderSetting = { enabled: provider.enabled }
      // An empty box leaves a saved key untouched; a typed key replaces it.
      if (keyed && provider.apiKey.trim()) entry.apiKey = provider.apiKey.trim()
      else if (keyed && provider.hasKey) entry.apiKey = '********'
      value[id] = entry
    }
    await updateSetting('indexer_language', language.value.trim())
    await updateSetting('indexer_providers', value)
    notify.success(t('admin.indexer.providersSaved'))
    await load()
  } catch (err: unknown) {
    notify.error(describeRequestError(err, t('admin.indexer.providersError')))
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <AdminSection :title="t('admin.indexer.providersTitle')" :description="t('admin.indexer.providersDescription')">
    <template #actions>
      <button type="button" :disabled="saving || loading" class="rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-50" @click="save">{{ t('admin.indexer.saveProviders') }}</button>
    </template>

    <p v-if="error" role="alert" class="mb-3 text-sm text-red-300">{{ error }}</p>

    <label class="mb-4 block max-w-xs text-xs text-flixer-muted">
      {{ t('admin.indexer.language') }}
      <input v-model="language" type="text" maxlength="10" :class="inputClass" />
      <span class="mt-1 block">{{ t('admin.indexer.languageHint') }}</span>
    </label>

    <ul class="grid gap-3 md:grid-cols-2">
      <li v-for="provider in INDEXER_PROVIDERS" :key="provider.id" class="rounded-lg border border-flixer-border bg-flixer-background/60 p-4">
        <AdminToggle v-model="providers[provider.id].enabled" :label="t(`admin.indexer.providerNames.${provider.id}`)" :description="provider.keyed ? undefined : t('admin.indexer.noKeyNeeded')" />
        <label v-if="provider.keyed" class="mt-2 block text-xs text-flixer-muted">
          {{ t('admin.indexer.apiKey') }}
          <input v-model="providers[provider.id].apiKey" type="password" autocomplete="off" :placeholder="providers[provider.id].hasKey ? '••••••••' : t('admin.indexer.apiKeyPlaceholder')" :class="inputClass" />
          <span v-if="providers[provider.id].hasKey" class="mt-1 block">{{ t('admin.indexer.keyStored') }}</span>
          <span v-else-if="providers[provider.id].enabled" class="mt-1 block text-amber-300">{{ t('admin.indexer.needsKey') }}</span>
        </label>
      </li>
    </ul>
  </AdminSection>
</template>
