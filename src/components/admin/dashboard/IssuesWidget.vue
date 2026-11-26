<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { listAdminIssueReports } from '../../../api'
import AdminSection from '../AdminSection.vue'
import { useWidgetData } from './useWidgetData'

const { t } = useI18n()
const { data, failed } = useWidgetData(listAdminIssueReports, 30_000)

const openReports = computed(() => (data.value ?? []).filter((item) => item.status === 'open' || item.status === 'in_progress'))
const counts = computed(() => {
  const list = data.value ?? []
  return {
    open: list.filter((item) => item.status === 'open').length,
    inProgress: list.filter((item) => item.status === 'in_progress').length,
    resolved: list.filter((item) => item.status === 'resolved').length,
  }
})
</script>

<template>
  <AdminSection :title="t('admin.dashboard.widgets.issues')" compact class="h-full">
    <template #actions>
      <router-link :to="{ name: 'admin', query: { tab: 'issues', page: 'tickets' } }" class="text-xs font-medium text-flixer-accent hover:underline">
        {{ t('admin.dashboard.viewAll') }}
      </router-link>
    </template>

    <p v-if="failed && !data" class="text-sm text-red-200">{{ t('admin.dashboard.loadError') }}</p>
    <template v-else-if="data">
      <p class="text-2xl font-semibold leading-8">
        {{ openReports.length }} <span class="text-sm font-normal text-flixer-muted">{{ t('admin.dashboard.openTickets') }}</span>
      </p>
      <p class="text-xs leading-4 text-flixer-muted">
        {{ t('admin.dashboard.issueTotals', { open: counts.open, inProgress: counts.inProgress, resolved: counts.resolved }) }}
      </p>
      <ul v-if="openReports.length > 0" class="mt-3 space-y-1.5">
        <li v-for="report in openReports.slice(0, 3)" :key="report.id" class="flex items-center justify-between gap-2 text-xs">
          <span class="min-w-0 truncate text-flixer-text">{{ report.title }}</span>
          <span class="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase text-flixer-muted">{{ report.status.replace('_', ' ') }}</span>
        </li>
      </ul>
    </template>
    <p v-else class="text-sm text-flixer-muted">{{ t('common.loading') }}</p>
  </AdminSection>
</template>
