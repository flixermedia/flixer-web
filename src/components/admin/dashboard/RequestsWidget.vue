<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { listMediaRequests } from '../../../api'
import AdminSection from '../AdminSection.vue'
import { useWidgetData } from './useWidgetData'

const { t } = useI18n()
const { data, failed } = useWidgetData(() => listMediaRequests({ scope: 'all', limit: 1 }), 30000)
</script>

<template>
  <AdminSection :title="t('admin.dashboard.widgets.requests')" class="h-full">
    <p v-if="failed && !data" class="text-sm text-red-200">{{ t('admin.dashboard.loadError') }}</p>
    <template v-else-if="data">
      <p class="text-3xl font-semibold">
        {{ data.counts.pending ?? 0 }} <span class="text-sm font-normal text-flixer-muted">{{ t('admin.dashboard.pending') }}</span>
      </p>
      <p class="mt-2 text-xs text-flixer-muted">{{ t('admin.dashboard.requestTotals', { approved: data.counts.approved ?? 0, available: data.counts.available ?? 0, failed: data.counts.failed ?? 0 }) }}</p>
    </template>
    <p v-else class="text-sm text-flixer-muted">{{ t('common.loading') }}</p>
  </AdminSection>
</template>
