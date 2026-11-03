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
    notify.error(describeRequestError(error, t('admin.general.chatEncryption.loadError')))
    return
  }
  enabled.value = settings.find((setting) => setting.key === 'chat_e2ee_enabled')?.value === true
  downgradeEnabled.value = settings.find((setting) => setting.key === 'chat_user_downgrade_enabled')?.value === true
})

async function setEncryption(value: boolean) {
  if (value === enabled.value || saving.value) return
  const confirmed = await openModal<boolean>(ConfirmModal, {
    props: {
      title: t(value ? 'admin.general.chatEncryption.enableConfirmTitle' : 'admin.general.chatEncryption.disableConfirmTitle'),
      message: t(value ? 'admin.general.chatEncryption.enableConfirmMessage' : 'admin.general.chatEncryption.disableConfirmMessage'),
      confirmLabel: t(value ? 'admin.general.chatEncryption.enableConfirm' : 'admin.general.chatEncryption.disableConfirm'),
      danger: true,
    },
  }).catch(() => false)
  if (!confirmed) return

  saving.value = true
  const [error] = await catchError(updateSetting('chat_e2ee_enabled', value))
  saving.value = false
  if (error) {
    notify.error(describeRequestError(error, t('admin.general.chatEncryption.saveError')))
    return
  }
  enabled.value = value
  notify.success(t(value ? 'admin.general.chatEncryption.enabled' : 'admin.general.chatEncryption.disabled'))
}

async function setDowngradePermission(value: boolean) {
  if (value === downgradeEnabled.value || savingDowngrade.value) return
  const confirmed = await openModal<boolean>(ConfirmModal, {
    props: {
      title: t(value ? 'admin.general.chatEncryption.allowDowngradeConfirmTitle' : 'admin.general.chatEncryption.disallowDowngradeConfirmTitle'),
      message: t(value ? 'admin.general.chatEncryption.allowDowngradeConfirmMessage' : 'admin.general.chatEncryption.disallowDowngradeConfirmMessage'),
      confirmLabel: t(value ? 'admin.general.chatEncryption.allowDowngradeConfirm' : 'admin.general.chatEncryption.disallowDowngradeConfirm'),
      danger: value,
    },
  }).catch(() => false)
  if (!confirmed) return

  savingDowngrade.value = true
  const [error] = await catchError(updateSetting('chat_user_downgrade_enabled', value))
  savingDowngrade.value = false
  if (error) {
    notify.error(describeRequestError(error, t('admin.general.chatEncryption.saveError')))
    return
  }
  downgradeEnabled.value = value
  notify.success(t(value ? 'admin.general.chatEncryption.downgradeAllowed' : 'admin.general.chatEncryption.downgradeDisallowed'))
}
</script>

<template>
  <AdminSection :title="t('admin.general.chatEncryption.title')" :description="t('admin.general.chatEncryption.description')">
    <p v-if="loading" class="text-sm text-flixer-muted" role="status">{{ t('common.loading') }}</p>
    <div v-else class="space-y-4">
      <p class="rounded border border-red-300/20 bg-red-300/[0.06] p-3 text-xs leading-5 text-red-100">{{ t('admin.general.chatEncryption.warning') }}</p>
      <AdminToggle
        :model-value="enabled"
        :disabled="saving"
        :label="t('admin.general.chatEncryption.enable')"
        :description="enabled ? t('admin.general.chatEncryption.enabledDescription') : t('admin.general.chatEncryption.enableDescription')"
        @update:model-value="setEncryption"
      />
      <p v-if="enabled" class="text-xs font-medium text-flixer-accent" role="status">{{ t('admin.general.chatEncryption.enabledStatus') }}</p>
      <AdminToggle
        :model-value="downgradeEnabled"
        :disabled="savingDowngrade"
        :label="t('admin.general.chatEncryption.allowDowngrade')"
        :description="t('admin.general.chatEncryption.allowDowngradeDescription')"
        @update:model-value="setDowngradePermission"
      />
    </div>
  </AdminSection>
</template>
