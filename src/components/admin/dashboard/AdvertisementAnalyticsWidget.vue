<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getAnalyticsSnapshot } from '../../../api/analytics'
import AdminSection from '../AdminSection.vue'
import { useWidgetData } from './useWidgetData'

const { t } = useI18n()
const { data, failed } = useWidgetData(() => getAnalyticsSnapshot(), 300000)
const views = computed(() => data.value?.adViews.reduce((sum, ad) => sum + ad.views, 0) ?? 0)
const watched = computed(() => Math.round(data.value?.adViews.reduce((sum, ad) => sum + ad.watched_seconds, 0) ?? 0))
</script>

<template>
  <AdminSection :title="t('admin.dashboard.widgets.ad-analytics')" compact class="h-full">
    <p v-if="failed && !data" class="text-sm text-red-200">{{ t('admin.dashboard.loadError') }}</p>
    <div v-else-if="data" class="space-y-2 text-sm">
      <p>{{ t('analytics.advertising.views') }}: <strong>{{ views }}</strong></p>
      <p>{{ t('analytics.advertising.seconds') }}: <strong>{{ watched }}</strong></p>
      <router-link :to="{ path: '/admin', query: { tab: 'analytics', page: 'analyticsAdvertising' } }" class="text-flixer-accent hover:underline">{{ t('analytics.openAdvertising') }}</router-link>
    </div>
    <p v-else class="text-sm text-flixer-muted">{{ t('common.loading') }}</p>
  </AdminSection>
</template>
