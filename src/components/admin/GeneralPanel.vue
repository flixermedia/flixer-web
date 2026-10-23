<script setup lang="ts">
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminSection from './AdminSection.vue'
import AdminToggle from './AdminToggle.vue'
import ConnectionsSection from './ConnectionsSection.vue'
import EmailSettingsSection from './EmailSettingsSection.vue'
import ErrorMonitoringSection from './ErrorMonitoringSection.vue'
import NetworkingSection from './NetworkingSection.vue'
import ServerSettingsSection from './ServerSettingsSection.vue'

const { t } = useI18n()

const form = reactive({
  notifyNewUser: true,
  notifyTaskFail: true,
  quickConnect: true,
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <ServerSettingsSection />

    <NetworkingSection />

    <ConnectionsSection />

    <EmailSettingsSection />

    <AdminSection :title="t('admin.general.notificationsTitle')" :description="t('admin.general.notificationsDescription')">
      <AdminToggle v-model="form.notifyNewUser" :label="t('admin.general.newUserAwaitingApproval')" />
      <AdminToggle v-model="form.notifyTaskFail" :label="t('admin.general.scheduledTaskFailed')" />
      <AdminToggle v-model="form.quickConnect" :label="t('admin.general.allowQuickConnect')" :description="t('admin.general.quickConnectDescription')" />
    </AdminSection>

    <ErrorMonitoringSection />

    <AdminSection :title="t('admin.general.dangerZoneTitle')" :description="t('admin.general.dangerZoneDescription')">
      <div class="flex flex-wrap gap-2">
        <button type="button" class="rounded bg-red-500/20 px-4 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/30">{{ t('admin.general.clearMetadataCache') }}</button>
        <button type="button" class="rounded bg-red-500/20 px-4 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/30">{{ t('admin.general.resetPlaybackHistory') }}</button>
      </div>
    </AdminSection>
  </div>
</template>
