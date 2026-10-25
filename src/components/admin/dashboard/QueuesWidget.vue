<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getIndexerStatus } from '../../../api'
import AdminSection from '../AdminSection.vue'
import { useWidgetData } from './useWidgetData'

const { t } = useI18n()
const { data, failed } = useWidgetData(getIndexerStatus, 5000)
const totals = computed(() => {
  const queues = data.value?.queues ?? []
  const sum = (pick: (q: (typeof queues)[number]) => number) => queues.reduce((total, q) => total + pick(q), 0)
  return { pending: sum((q) => q.pending), active: sum((q) => q.active), retry: sum((q) => q.retry), failed: sum((q) => q.failed) }
})
</script>

<template>
  <AdminSection :title="t('admin.dashboard.widgets.queues')" class="h-full">
    <p v-if="failed && !data" class="text-sm text-red-200">{{ t('admin.dashboard.loadError') }}</p>
    <p v-else-if="data && !data.reachable" class="text-sm text-red-200">{{ t('admin.dashboard.offline') }}</p>
    <dl v-else-if="data" class="grid grid-cols-2 gap-3 text-sm">
      <div v-for="key in ['active', 'pending', 'retry', 'failed'] as const" :key="key">
        <dt class="text-xs text-flixer-muted">{{ t(`admin.dashboard.queueStates.${key}`) }}</dt>
        <dd class="text-2xl font-semibold" :class="key === 'failed' && totals.failed > 0 && 'text-red-300'">{{ totals[key] }}</dd>
      </div>
    </dl>
    <p v-else class="text-sm text-flixer-muted">{{ t('common.loading') }}</p>
  </AdminSection>
</template>
