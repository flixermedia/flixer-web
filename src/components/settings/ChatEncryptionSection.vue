<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getChatEncryptionStatus, getChatMlsDevices, revokeChatMlsDevice, type ChatMlsDeviceSummary } from '../../api'
import { exportChatMlsHistory, importChatMlsHistory, initializeChatMlsDevice, syncChatMlsHistoryBackup } from '../../composables/chatMlsClient'
import { confirmAction } from '../../composables/confirm'
import { describeRequestError, useProfile } from '../../composables/useProfile'

const { t } = useI18n()
const { profile, load: loadProfile } = useProfile()
const enabled = ref(false)
const encryptionRequired = ref(false)
const loading = ref(true)
const devices = ref<ChatMlsDeviceSummary[]>([])
const currentDeviceId = ref('')
const error = ref('')
const notice = ref('')
const busyDeviceId = ref('')
const exportPassphrase = ref('')
const importPassphrase = ref('')
const transferFile = ref<File | null>(null)
const historyPassword = ref('')
const historySyncing = ref(false)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const status = await getChatEncryptionStatus()
    enabled.value = status.supported
    encryptionRequired.value = status.enabled
    if (!status.supported) return
    await loadProfile()
    if (!profile.value?.id) throw new Error(t('settings.chatEncryption.accountUnavailable'))
    const device = await initializeChatMlsDevice(profile.value.id)
    if (!device) throw new Error(t('settings.chatEncryption.deviceUnavailable'))
    currentDeviceId.value = device.deviceId
    devices.value = (await getChatMlsDevices()).devices
  } catch (reason) {
    error.value = describeRequestError(reason, t('settings.chatEncryption.loadFailed'))
  } finally {
    loading.value = false
  }
}

async function syncHistory() {
  if (!profile.value?.id || !historyPassword.value) return
  historySyncing.value = true
  error.value = ''
  notice.value = ''
  try {
    await syncChatMlsHistoryBackup(profile.value.id, historyPassword.value)
    historyPassword.value = ''
    notice.value = t('settings.chatEncryption.historySynced')
  } catch (reason) {
    error.value = describeRequestError(reason, t('settings.chatEncryption.historySyncFailed'))
  } finally {
    historySyncing.value = false
  }
}

async function revoke(device: ChatMlsDeviceSummary) {
  const confirmed = await confirmAction(t('settings.chatEncryption.revokeConfirm', { name: device.name }), {
    title: t('settings.chatEncryption.revokeTitle'),
    confirmLabel: t('settings.chatEncryption.revoke'),
    danger: true,
  })
  if (!confirmed) return
  busyDeviceId.value = device.deviceId
  error.value = ''
  try {
    await revokeChatMlsDevice(device.deviceId)
    devices.value = devices.value.map((item) => item.deviceId === device.deviceId ? { ...item, status: 'revoked' } : item)
  } catch (reason) {
    error.value = describeRequestError(reason, t('settings.chatEncryption.actionFailed'))
  } finally {
    busyDeviceId.value = ''
  }
}

async function exportHistory() {
  if (!profile.value?.id || !currentDeviceId.value) return
  error.value = ''
  notice.value = ''
  try {
    const transfer = await exportChatMlsHistory(profile.value.id, currentDeviceId.value, exportPassphrase.value)
    const url = URL.createObjectURL(new Blob([transfer], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'flixer-chat-history.flixer-chat-history'
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
    setTimeout(() => URL.revokeObjectURL(url), 0)
    exportPassphrase.value = ''
  } catch (reason) {
    error.value = describeRequestError(reason, t('settings.chatEncryption.exportFailed'))
  }
}

function chooseTransfer(event: Event) {
  const input = event.target as HTMLInputElement
  transferFile.value = input.files?.[0] ?? null
}

async function importHistory() {
  if (!profile.value?.id || !currentDeviceId.value || !transferFile.value) return
  error.value = ''
  notice.value = ''
  try {
    if (transferFile.value.size > 40 * 1024 * 1024) throw new Error(t('settings.chatEncryption.transferTooLarge'))
    const count = await importChatMlsHistory(
      profile.value.id,
      currentDeviceId.value,
      await transferFile.value.text(),
      importPassphrase.value,
    )
    notice.value = t('settings.chatEncryption.imported', { count })
    transferFile.value = null
    importPassphrase.value = ''
  } catch (reason) {
    error.value = describeRequestError(reason, t('settings.chatEncryption.importFailed'))
  }
}

onMounted(() => void load())
</script>

<template>
  <section aria-labelledby="chat-encryption-heading">
    <h2 id="chat-encryption-heading" class="text-lg font-semibold">{{ t('settings.chatEncryption.title') }}</h2>
    <p class="mt-1 text-sm text-flixer-muted">{{ t('settings.chatEncryption.description') }}</p>
    <p v-if="loading" class="mt-5 text-sm text-flixer-muted">{{ t('common.loading') }}</p>
    <p v-else-if="!enabled" class="mt-5 rounded border border-white/10 bg-white/5 p-4 text-sm text-flixer-muted">{{ t('settings.chatEncryption.disabled') }}</p>
    <template v-else>
      <p class="mt-5 rounded border border-flixer-accent/20 bg-flixer-accent/5 p-4 text-sm text-flixer-muted">{{ t('settings.chatEncryption.localOnly') }}</p>
      <p v-if="!encryptionRequired" class="mt-3 rounded border border-white/10 bg-white/5 p-4 text-sm text-flixer-muted">{{ t('settings.chatEncryption.defaultDisabled') }}</p>
      <p v-if="error" class="mt-4 text-sm text-red-400" role="alert">{{ error }}</p>
      <p v-if="notice" class="mt-4 text-sm text-green-400" role="status">{{ notice }}</p>

      <section class="mt-6" aria-labelledby="chat-devices-heading">
        <h3 id="chat-devices-heading" class="text-sm font-semibold text-white">{{ t('settings.chatEncryption.devices') }}</h3>
        <ul class="mt-3 divide-y divide-white/5 rounded border border-white/10">
          <li v-for="device in devices" :key="device.deviceId" class="flex flex-wrap items-center justify-between gap-3 p-3">
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-white">{{ device.name }} <span v-if="device.deviceId === currentDeviceId" class="text-flixer-muted">({{ t('settings.chatEncryption.thisDevice') }})</span></p>
              <p class="mt-0.5 text-xs text-flixer-muted">{{ t(`settings.chatEncryption.status.${device.status}`) }} · {{ new Date(device.createdAt).toLocaleDateString() }}</p>
            </div>
            <span class="flex shrink-0 gap-2">
              <button
                v-if="device.status !== 'revoked' && device.deviceId !== currentDeviceId"
                type="button"
                class="rounded bg-white/10 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                :disabled="busyDeviceId !== ''"
                @click="revoke(device)"
              >{{ t('settings.chatEncryption.revoke') }}</button>
            </span>
          </li>
        </ul>
        <p v-if="devices.length === 0" class="mt-3 text-sm text-flixer-muted">{{ t('settings.chatEncryption.noDevices') }}</p>
      </section>

      <section class="mt-8 border-t border-white/10 pt-6" aria-labelledby="chat-history-transfer-heading">
        <h3 id="chat-history-transfer-heading" class="text-sm font-semibold text-white">{{ t('settings.chatEncryption.transferTitle') }}</h3>
        <p class="mt-1 text-sm text-flixer-muted">{{ t('settings.chatEncryption.transferDescription') }}</p>
        <form class="mt-4 flex flex-wrap items-end gap-3" @submit.prevent="syncHistory">
          <label class="min-w-60 flex-1 text-xs font-medium text-flixer-muted">
            {{ t('settings.chatEncryption.accountPassword') }}
            <input v-model="historyPassword" type="password" autocomplete="current-password" required class="mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2.5 text-sm text-white">
          </label>
          <button type="submit" class="rounded bg-white px-4 py-2.5 text-sm font-semibold text-flixer-background disabled:opacity-50" :disabled="historySyncing || !historyPassword">{{ historySyncing ? t('common.loading') : t('settings.chatEncryption.syncHistory') }}</button>
        </form>
        <div class="mt-4 grid gap-5 lg:grid-cols-2">
          <form class="space-y-3" @submit.prevent="exportHistory">
            <label class="block text-xs font-medium text-flixer-muted">
              {{ t('settings.chatEncryption.exportPassphrase') }}
              <input v-model="exportPassphrase" type="password" autocomplete="new-password" minlength="12" required class="mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2.5 text-sm text-white">
            </label>
            <button type="submit" class="rounded bg-white px-4 py-2 text-sm font-semibold text-flixer-background">{{ t('settings.chatEncryption.export') }}</button>
          </form>
          <form class="space-y-3" @submit.prevent="importHistory">
            <label class="block text-xs font-medium text-flixer-muted">
              {{ t('settings.chatEncryption.transferFile') }}
              <input type="file" accept=".flixer-chat-history,application/json" required class="mt-1 block w-full text-sm text-flixer-muted" @change="chooseTransfer">
            </label>
            <label class="block text-xs font-medium text-flixer-muted">
              {{ t('settings.chatEncryption.importPassphrase') }}
              <input v-model="importPassphrase" type="password" autocomplete="off" required class="mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2.5 text-sm text-white">
            </label>
            <button type="submit" class="rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" :disabled="!transferFile">{{ t('settings.chatEncryption.import') }}</button>
          </form>
        </div>
      </section>
    </template>
  </section>
</template>
