<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getAdminPaymentConfig, getPaymentStats } from '../../../api'
import AdminSection from '../AdminSection.vue'
import { useWidgetData } from './useWidgetData'

const { t } = useI18n()
const { data, failed } = useWidgetData(
  async () => {
    const [config, stats] = await Promise.all([getAdminPaymentConfig(), getPaymentStats()])
    return { config, stats }
  },
  60_000,
)

const activeSubscriptions = computed(() =>
  (data.value?.stats.subscriptions ?? [])
    .filter((entry) => entry.status === 'active' || entry.status === 'trialing')
    .reduce((sum, entry) => sum + entry.count, 0),
)

const primaryRevenue = computed(() => {
  const first = data.value?.stats.revenue30d[0]
  if (!first) return '0.00'
  return (first.amountMinor / 100).toLocaleString(undefined, { style: 'currency', currency: first.currency || data.value?.config.currency || 'USD' })
})
</script>

<template>
  <AdminSection :title="t('admin.dashboard.widgets.payments')" compact class="h-full">
    <template #actions>
      <router-link :to="{ name: 'admin', query: { tab: 'payments' } }" class="text-xs font-medium text-flixer-accent hover:underline">
        {{ t('admin.dashboard.viewAll') }}
      </router-link>
    </template>

    <p v-if="failed && !data" class="text-sm text-red-200">{{ t('admin.dashboard.loadError') }}</p>
    <template v-else-if="data">
      <p class="text-2xl font-semibold leading-8">{{ primaryRevenue }}</p>
      <p class="text-xs leading-4 text-flixer-muted">
        {{ t('admin.dashboard.paymentsSummary', { subs: activeSubscriptions, failed: data.stats.failed30d }) }}
      </p>
    </template>
    <p v-else class="text-sm text-flixer-muted">{{ t('common.loading') }}</p>
  </AdminSection>
</template>
