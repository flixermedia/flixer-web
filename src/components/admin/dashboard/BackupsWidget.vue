<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { getBackupStatus } from '../../../api'
import AdminSection from '../AdminSection.vue'
import { useWidgetData } from './useWidgetData'

const { t } = useI18n()
const { data, failed } = useWidgetData(getBackupStatus, 60000)
</script>

<template>
  <AdminSection :title="t('admin.dashboard.widgets.backups')" class="h-full">
    <p v-if="failed && !data" class="text-sm text-red-200">{{ t('admin.dashboard.loadError') }}</p>
    <dl v-else-if="data" class="grid gap-2 text-sm">
      <div class="flex justify-between gap-3">
        <dt class="text-flixer-muted">{{ t('admin.dashboard.backupSchedule') }}</dt>
        <dd class="font-medium">{{ t(`admin.dashboard.schedules.${data.schedule}`) }}</dd>
      </div>
      <div class="flex justify-between gap-3">
        <dt class="text-flixer-muted">{{ t('admin.dashboard.backupCount') }}</dt>
        <dd class="font-medium">{{ data.backups.length }}</dd>
      </div>
      <div class="flex justify-between gap-3">
        <dt class="text-flixer-muted">{{ t('admin.dashboard.lastBackup') }}</dt>
        <dd class="font-medium">{{ data.backups[0] ? new Date(data.backups[0].createdAt).toLocaleDateString() : '—' }}</dd>
      </div>
    </dl>
    <p v-else class="text-sm text-flixer-muted">{{ t('common.loading') }}</p>
  </AdminSection>
</template>
