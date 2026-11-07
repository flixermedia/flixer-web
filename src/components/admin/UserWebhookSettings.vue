<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getWebhookConfig, saveWebhookConfig, type WebhookConfig } from '../../api/userWebhooks'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import AdminSection from './AdminSection.vue'
import AdminToggle from './AdminToggle.vue'

const { t } = useI18n()
const config = ref<WebhookConfig>({ enabled: false, audience: 'admins', allowedUrls: [] })
const urls = ref('')
const loading = ref(true)
const loadFailed = ref(false)
const saving = ref(false)

async function load() {
  loading.value = true
  const [error, result] = await catchError(getWebhookConfig())
  loadFailed.value = Boolean(error)
  if (error) notify.error(describeRequestError(error, t('webhooks.loadError')))
  else { config.value = result; urls.value = result.allowedUrls.join('\n') }
  loading.value = false
}
onMounted(load)

async function save() {
  saving.value = true
  const [error, result] = await catchError(saveWebhookConfig({ ...config.value, allowedUrls: urls.value.split('\n').map((url) => url.trim()).filter(Boolean) }))
  saving.value = false
  if (error) notify.error(describeRequestError(error, t('webhooks.saveError')))
  else { config.value = result; urls.value = result.allowedUrls.join('\n'); notify.success(t('webhooks.saved')) }
}
</script>

<template>
  <AdminSection :title="t('webhooks.adminTitle')" :description="t('webhooks.adminDescription')">
    <p v-if="loading" role="status" class="text-sm text-flixer-muted">{{ t('common.loading') }}</p>
    <div v-else-if="loadFailed" role="alert" class="space-y-2 text-sm"><p>{{ t('webhooks.loadError') }}</p><button type="button" class="text-flixer-accent underline" @click="load">{{ t('webhooks.retry') }}</button></div>
    <form v-else class="space-y-5" @submit.prevent="save">
      <AdminToggle v-model="config.enabled" :label="t('webhooks.enable')" :description="t('webhooks.enableDescription')" />
      <label class="block max-w-sm text-sm font-medium">
        {{ t('webhooks.audience') }}
        <select v-model="config.audience" class="mt-2 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2">
          <option value="admins">{{ t('webhooks.adminsOnly') }}</option>
          <option value="everyone">{{ t('webhooks.everyone') }}</option>
        </select>
      </label>
      <label class="block text-sm font-medium">
        {{ t('webhooks.allowedUrls') }}
        <textarea v-model="urls" rows="5" spellcheck="false" class="mt-2 w-full rounded border border-flixer-border bg-flixer-background p-3 font-mono text-xs" />
      </label>
      <p class="text-sm text-flixer-muted">{{ t('webhooks.rulesHint') }}</p>
      <p class="text-sm text-flixer-muted">{{ t('webhooks.allowlistWarning') }}</p>
      <button type="submit" class="rounded bg-flixer-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" :disabled="saving">{{ t('webhooks.saveSettings') }}</button>
    </form>
  </AdminSection>
</template>
