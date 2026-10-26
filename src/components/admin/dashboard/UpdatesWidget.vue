<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { getUpdateStatus } from '../../../api'
import AdminSection from '../AdminSection.vue'
import StatusPill from '../StatusPill.vue'
import { useWidgetData } from './useWidgetData'

const { t } = useI18n()
const { data, failed } = useWidgetData(() => getUpdateStatus(), 60000)
</script>

<template>
  <AdminSection :title="t('admin.dashboard.widgets.updates')" class="h-full">
    <p v-if="failed && !data" class="text-sm text-red-200">{{ t('admin.dashboard.loadError') }}</p>
    <template v-else-if="data">
      <StatusPill :tone="data.updatesAvailable > 0 ? 'accent' : 'good'">{{ data.updatesAvailable > 0 ? t('admin.dashboard.updatesAvailable', { count: data.updatesAvailable }) : t('admin.dashboard.upToDate') }}</StatusPill>
      <p v-if="!data.updaterReachable" class="mt-3 text-xs text-amber-300">{{ t('admin.dashboard.updaterOffline') }}</p>
      <p v-else-if="data.lastCheckedAt" class="mt-3 text-xs text-flixer-muted">{{ t('admin.dashboard.checkedAt', { time: new Date(data.lastCheckedAt).toLocaleString() }) }}</p>
    </template>
    <p v-else class="text-sm text-flixer-muted">{{ t('common.loading') }}</p>
  </AdminSection>
</template>
