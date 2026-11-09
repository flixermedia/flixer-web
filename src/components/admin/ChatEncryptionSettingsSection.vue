<script setup lang="ts">
import { openModal } from '@kolirt/vue-modal'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { listSettings, updateSetting } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import ConfirmModal from '../ui/ConfirmModal.vue'
import AdminSection from './AdminSection.vue'
import AdminToggle from './AdminToggle.vue'

const { t } = useI18n()
const enabled = ref(false)
const downgradeEnabled = ref(false)
const loading = ref(true)
const saving = ref(false)
const savingDowngrade = ref(false)

onMounted(async () => {
  const [error, settings] = await catchError(listSettings())
  loading.value = false
  if (error) {
    notify.error(describeRequestError(error, t('admin.communications.chatEncryption.loadError')))
    return
  }
  enabled.value = settings.find((setting) => setting.key === 'chat_e2ee_enabled')?.value === true
  downgradeEnabled.value = settings.find((setting) => setting.key === 'chat_user_downgrade_enabled')?.value === true
})

async function setEncryption(value: boolean) {
  if (value === enabled.value || saving.value) return
  const confirmed = await openModal<boolean>(ConfirmModal, {
    props: {
      title: t(value ? 'admin.communications.chatEncryption.enableConfirmTitle' : 'admin.communications.chatEncryption.disableConfirmTitle'),
      message: t(value ? 'admin.communications.chatEncryption.enableConfirmMessage' : 'admin.communications.chatEncryption.disableConfirmMessage'),
      confirmLabel: t(value ? 'admin.communications.chatEncryption.enableConfirm' : 'admin.communications.chatEncryption.disableConfirm'),
      danger: true,
    },
  }).catch(() => false)
  if (!confirmed) return

  saving.value = true
  const [error] = await catchError(updateSetting('chat_e2ee_enabled', value))
  saving.value = false
  if (error) {
    notify.error(describeRequestError(error, t('admin.communications.chatEncryption.saveError')))
    return
  }
  enabled.value = value
  notify.success(t(value ? 'admin.communications.chatEncryption.enabled' : 'admin.communications.chatEncryption.disabled'))
}

async function setDowngradePermission(value: boolean) {
  if (value === downgradeEnabled.value || savingDowngrade.value) return
  const confirmed = await openModal<boolean>(ConfirmModal, {
    props: {
      title: t(value ? 'admin.communications.chatEncryption.allowDowngradeConfirmTitle' : 'admin.communications.chatEncryption.disallowDowngradeConfirmTitle'),
      message: t(value ? 'admin.communications.chatEncryption.allowDowngradeConfirmMessage' : 'admin.communications.chatEncryption.disallowDowngradeConfirmMessage'),
      confirmLabel: t(value ? 'admin.communications.chatEncryption.allowDowngradeConfirm' : 'admin.communications.chatEncryption.disallowDowngradeConfirm'),
      danger: value,
    },
  }).catch(() => false)
  if (!confirmed) return

  savingDowngrade.value = true
  const [error] = await catchError(updateSetting('chat_user_downgrade_enabled', value))
  savingDowngrade.value = false
  if (error) {
    notify.error(describeRequestError(error, t('admin.communications.chatEncryption.saveError')))
    return
  }
  downgradeEnabled.value = value
  notify.success(t(value ? 'admin.communications.chatEncryption.downgradeAllowed' : 'admin.communications.chatEncryption.downgradeDisallowed'))
}
</script>

<template>
  <AdminSection :title="t('admin.communications.chatEncryption.title')" :description="t('admin.communications.chatEncryption.description')">
    <p v-if="loading" class="text-sm text-flixer-muted" role="status">{{ t('common.loading') }}</p>
    <div v-else class="space-y-4">
      <p class="rounded border border-red-300/20 bg-red-300/[0.06] p-3 text-xs leading-5 text-red-100">{{ t('admin.communications.chatEncryption.warning') }}</p>
      <AdminToggle
        :model-value="enabled"
        :disabled="saving"
        :label="t('admin.communications.chatEncryption.enable')"
        :description="enabled ? t('admin.communications.chatEncryption.enabledDescription') : t('admin.communications.chatEncryption.enableDescription')"
        @update:model-value="setEncryption"
      />
      <p v-if="enabled" class="text-xs font-medium text-flixer-accent" role="status">{{ t('admin.communications.chatEncryption.enabledStatus') }}</p>
      <AdminToggle
        :model-value="downgradeEnabled"
        :disabled="savingDowngrade"
        :label="t('admin.communications.chatEncryption.allowDowngrade')"
        :description="t('admin.communications.chatEncryption.allowDowngradeDescription')"
        @update:model-value="setDowngradePermission"
      />
    </div>
  </AdminSection>
</template>
