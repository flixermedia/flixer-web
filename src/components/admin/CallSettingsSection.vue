<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { listSettings, updateSetting } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import AdminSection from './AdminSection.vue'
import AdminToggle from './AdminToggle.vue'

const { t } = useI18n()
const enabled = ref(false)
const relayOnly = ref(false)
const stunUrls = ref('')
const turnUrls = ref('')
const turnSecret = ref('')
const turnUsername = ref('')
const secretStored = ref(false)
const loading = ref(true)
const saving = ref(false)

const toLines = (value: unknown) => (Array.isArray(value) ? value.join('\n') : '')
const fromLines = (value: string) => value.split('\n').map((line) => line.trim()).filter(Boolean)

onMounted(async () => {
  const [error, settings] = await catchError(listSettings())
  loading.value = false
  if (error) {
    notify.error(describeRequestError(error, t('admin.communications.calls.loadError')))
    return
  }
  const value = (key: string) => settings.find((setting) => setting.key === key)?.value
  enabled.value = value('calls_enabled') === true
  relayOnly.value = value('calls_relay_only') === true
  stunUrls.value = toLines(value('calls_stun_urls'))
  turnUrls.value = toLines(value('calls_turn_urls'))
  const username = value('calls_turn_username')
  turnUsername.value = typeof username === 'string' ? username : ''
  secretStored.value = typeof value('calls_turn_secret') === 'string' && value('calls_turn_secret') !== ''
})

async function saveToggle(key: 'calls_enabled' | 'calls_relay_only', current: boolean, apply: (value: boolean) => void, value: boolean) {
  if (value === current || saving.value) return
  saving.value = true
  const [error] = await catchError(updateSetting(key, value))
  saving.value = false
  if (error) {
    notify.error(describeRequestError(error, t('admin.communications.calls.saveError')))
    return
  }
  apply(value)
}

async function saveServers() {
  saving.value = true
  const [error] = await catchError(
    Promise.all([
      updateSetting('calls_stun_urls', fromLines(stunUrls.value)),
      updateSetting('calls_turn_urls', fromLines(turnUrls.value)),
      updateSetting('calls_turn_username', turnUsername.value.trim()),
      ...(turnSecret.value ? [updateSetting('calls_turn_secret', turnSecret.value)] : []),
    ]),
  )
  saving.value = false
  if (error) {
    notify.error(describeRequestError(error, t('admin.communications.calls.saveError')))
    return
  }
  if (turnSecret.value) secretStored.value = true
  turnSecret.value = ''
  notify.success(t('admin.communications.calls.saved'))
}

async function clearSecret() {
  saving.value = true
  const [error] = await catchError(updateSetting('calls_turn_secret', ''))
  saving.value = false
  if (error) {
    notify.error(describeRequestError(error, t('admin.communications.calls.saveError')))
    return
  }
  secretStored.value = false
  notify.success(t('admin.communications.calls.saved'))
}
</script>

<template>
  <AdminSection :title="t('admin.communications.calls.title')" :description="t('admin.communications.calls.description')">
    <p v-if="loading" class="text-sm text-flixer-muted" role="status">{{ t('common.loading') }}</p>
    <div v-else class="space-y-4">
      <AdminToggle :model-value="enabled" :disabled="saving" :label="t('admin.communications.calls.enable')" :description="t('admin.communications.calls.enableDescription')" @update:model-value="saveToggle('calls_enabled', enabled, (value) => (enabled = value), $event)" />
      <label class="block text-sm font-medium">
        {{ t('admin.communications.calls.stunLabel') }}
        <textarea v-model="stunUrls" rows="2" class="mt-1 w-full rounded border border-white/10 bg-white/5 p-2 font-mono text-xs" spellcheck="false" />
      </label>
      <label class="block text-sm font-medium">
        {{ t('admin.communications.calls.turnLabel') }}
        <textarea v-model="turnUrls" rows="2" class="mt-1 w-full rounded border border-white/10 bg-white/5 p-2 font-mono text-xs" spellcheck="false" />
      </label>
      <label class="block text-sm font-medium">
        {{ t('admin.communications.calls.usernameLabel') }}
        <input v-model="turnUsername" type="text" autocomplete="off" class="mt-1 w-full rounded border border-white/10 bg-white/5 p-2 text-xs" :placeholder="t('admin.communications.calls.usernameAuto')" />
      </label>
      <label class="block text-sm font-medium">
        {{ t('admin.communications.calls.secretLabel') }}
        <input v-model="turnSecret" type="password" autocomplete="new-password" class="mt-1 w-full rounded border border-white/10 bg-white/5 p-2 text-xs" :placeholder="secretStored ? t('admin.communications.calls.secretStored') : t('admin.communications.calls.secretAuto')" />
      </label>
      <button v-if="secretStored" type="button" class="text-xs text-flixer-accent underline" :disabled="saving" @click="clearSecret">{{ t('admin.communications.calls.secretClear') }}</button>
      <p class="text-xs text-flixer-muted">{{ t('admin.communications.calls.urlsHint') }} {{ t('admin.communications.calls.turnHint') }}</p>
      <button type="button" class="rounded bg-flixer-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" :disabled="saving" @click="saveServers">{{ t('admin.communications.calls.save') }}</button>
      <AdminToggle :model-value="relayOnly" :disabled="saving" :label="t('admin.communications.calls.relayOnly')" :description="t('admin.communications.calls.relayOnlyDescription')" @update:model-value="saveToggle('calls_relay_only', relayOnly, (value) => (relayOnly = value), $event)" />
    </div>
  </AdminSection>
</template>
