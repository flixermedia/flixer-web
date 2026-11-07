<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { getViewingAnalytics } from '../../../api/analytics'
import AdminSection from '../AdminSection.vue'
import { useWidgetData } from './useWidgetData'

const { t } = useI18n()
const { data, failed } = useWidgetData(() => getViewingAnalytics(7), 300000)
</script>

<template>
  <AdminSection :title="t('admin.dashboard.widgets.viewing-analytics')" compact class="h-full">
    <p v-if="failed && !data" class="text-sm text-red-200">{{ t('admin.dashboard.loadError') }}</p>
    <div v-else-if="data" class="space-y-2 text-sm">
      <p class="text-xs text-flixer-muted">{{ t('analytics.viewing.widgetNote') }}</p>
      <p>{{ t('analytics.video.title') }}: <strong>{{ data.totals.video_sessions }}</strong></p>
      <p>{{ t('analytics.guide.title') }}: <strong>{{ data.totals.live_sessions }}</strong></p>
      <p>{{ t('analytics.advertising.seconds') }}: <strong>{{ Math.round(data.totals.watched_seconds) }}</strong></p>
      <router-link :to="{ path: '/admin', query: { tab: 'analytics', page: 'analyticsHistory' } }" class="text-flixer-accent hover:underline">{{ t('analytics.openHistory') }}</router-link>
    </div>
    <p v-else class="text-sm text-flixer-muted">{{ t('common.loading') }}</p>
  </AdminSection>
</template>
