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
const providers = reactive<Record<string, { enabled: boolean; apiKey: string; hasKey: boolean }>>(Object.fromEntries(INDEXER_PROVIDERS.map((provider) => [provider.id, { enabled: false, apiKey: '', hasKey: false }])))
const language = ref('en')
const loading = ref(true)
const saving = ref(false)
const error = ref('')

const inputClass = 'mt-1 w-full rounded-lg border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-flixer-text placeholder:text-flixer-muted/60 focus-visible:outline-2 focus-visible:outline-flixer-accent'

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
    <p v-if="error" role="alert" class="mb-4 text-sm text-red-300">{{ error }}</p>

    <ul class="divide-y divide-flixer-border overflow-hidden rounded-xl border border-flixer-border bg-flixer-background/40">
      <li v-for="provider in INDEXER_PROVIDERS" :key="provider.id" class="px-4 py-1">
        <AdminToggle v-model="providers[provider.id].enabled" :label="t(`admin.indexer.providerNames.${provider.id}`)" :description="provider.keyed ? undefined : t('admin.indexer.noKeyNeeded')" :badge="provider.keyed ? t('admin.indexer.keyRequired') : undefined" />
        <div v-if="provider.keyed && providers[provider.id].enabled" class="pb-3">
          <input v-model="providers[provider.id].apiKey" type="password" autocomplete="off" :aria-label="`${t(`admin.indexer.providerNames.${provider.id}`)} ${t('admin.indexer.apiKey')}`" :placeholder="providers[provider.id].hasKey ? '••••••••' : t('admin.indexer.apiKeyPlaceholder')" :class="inputClass" />
          <p v-if="providers[provider.id].hasKey" class="mt-1.5 text-xs text-flixer-muted">{{ t('admin.indexer.keyStored') }}</p>
          <p v-else class="mt-1.5 text-xs text-amber-300">{{ t('admin.indexer.needsKey') }}</p>
        </div>
      </li>
    </ul>

    <div class="mt-5 flex flex-wrap items-end justify-between gap-4">
      <label class="block w-40 text-xs text-flixer-muted">
        {{ t('admin.indexer.language') }}
        <input v-model="language" type="text" maxlength="10" :class="inputClass" />
      </label>
      <button type="button" :disabled="saving || loading" class="rounded-lg bg-flixer-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-50" @click="save">{{ t('admin.indexer.saveProviders') }}</button>
    </div>
    <p class="mt-2 text-xs text-flixer-muted">{{ t('admin.indexer.languageHint') }}</p>
  </AdminSection>
</template>
