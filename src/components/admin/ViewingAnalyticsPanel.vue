<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getViewingAnalytics, type ViewingAnalytics } from '../../api/analytics'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import AdminSection from './AdminSection.vue'
import AnalyticsTrendChart from './AnalyticsTrendChart.vue'
import { dailyCounts } from './analyticsChartData'

const props = defineProps<{ screen: 'video' | 'guide' | 'history' }>()
const { t, locale } = useI18n()
const days = ref<7 | 30 | 90>(30)
const data = ref<ViewingAnalytics | null>(null)
const loading = ref(true)
const error = ref('')
const chartPoints = computed(() => dailyCounts((data.value?.daily ?? []).map((row) => ({
  day: row.day, value: props.screen === 'video' ? row.video_sessions : row.live_sessions,
}))))
let generation = 0

async function load() {
  const request = ++generation
  loading.value = true
  const [failure, result] = await catchError(getViewingAnalytics(days.value))
  if (request !== generation) return
  if (failure) error.value = describeRequestError(failure, t('analytics.loadError'))
  else { data.value = result; error.value = '' }
  loading.value = false
}
onMounted(load)
onBeforeUnmount(() => { generation++ })
</script>

<template>
  <AdminSection :title="t(`analytics.viewing.${screen}`)" :description="t('analytics.viewing.note')">
    <div class="space-y-4">
      <label class="flex items-center gap-3 text-sm">
        {{ t('analytics.advertising.range') }}
        <select v-model.number="days" class="rounded border border-flixer-border bg-flixer-background px-3 py-2" @change="load">
          <option :value="7">{{ t('analytics.advertising.days', { count: 7 }) }}</option>
          <option :value="30">{{ t('analytics.advertising.days', { count: 30 }) }}</option>
          <option :value="90">{{ t('analytics.advertising.days', { count: 90 }) }}</option>
        </select>
      </label>
      <p class="text-xs text-flixer-muted">{{ t('analytics.viewing.rangeNote') }}</p>
      <p v-if="loading" role="status" class="text-sm text-flixer-muted">{{ t('common.loading') }}</p>
      <p v-else-if="error" role="alert" class="text-sm text-red-200">{{ error }}</p>
      <template v-else-if="data">
        <p v-if="screen === 'history' && !data.recent.length || screen === 'video' && !data.video.length || screen === 'guide' && !data.live.length" class="text-sm text-flixer-muted">{{ t('analytics.empty') }}</p>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="text-flixer-muted">
              <tr v-if="screen === 'history'"><th class="p-3">{{ t('analytics.viewing.started') }}</th><th class="p-3">{{ t('analytics.viewing.viewer') }}</th><th class="p-3">{{ t('analytics.content') }}</th><th class="p-3">{{ t('analytics.type') }}</th><th class="p-3">{{ t('analytics.advertising.seconds') }}</th></tr>
              <tr v-else><th class="p-3">{{ t('analytics.content') }}</th><th class="p-3">{{ t('analytics.viewing.sessions') }}</th><th class="p-3">{{ t('analytics.viewers') }}</th><th class="p-3">{{ t('analytics.advertising.seconds') }}</th></tr>
            </thead>
            <tbody v-if="screen === 'history'">
              <tr v-for="row in data.recent" :key="row.id" class="border-t border-flixer-border"><td class="p-3">{{ new Date(row.created_at).toLocaleString(locale) }}</td><td class="p-3">{{ row.viewer }}</td><td class="p-3">{{ row.title }}</td><td class="p-3">{{ row.type }}</td><td class="p-3">{{ Math.round(row.watched_seconds) }}</td></tr>
            </tbody>
            <tbody v-else-if="screen === 'video'">
              <tr v-for="row in data.video" :key="row.id" class="border-t border-flixer-border"><td class="p-3">{{ row.title }} <span class="text-flixer-muted">({{ row.type }})</span></td><td class="p-3">{{ row.sessions }}</td><td class="p-3">{{ row.viewers }}</td><td class="p-3">{{ Math.round(row.watched_seconds) }}</td></tr>
            </tbody>
            <tbody v-else>
              <tr v-for="row in data.live" :key="row.id" class="border-t border-flixer-border"><td class="p-3">{{ row.name }}</td><td class="p-3">{{ row.sessions }}</td><td class="p-3">{{ row.viewers }}</td><td class="p-3">{{ Math.round(row.watched_seconds) }}</td></tr>
            </tbody>
          </table>
        </div>
        <template v-if="screen !== 'history'">
          <h3 class="font-semibold">{{ t('analytics.viewing.daily') }}</h3>
          <AnalyticsTrendChart v-if="chartPoints.length" :points="chartPoints" :label="t('analytics.charts.viewingSessions')" />
          <div class="max-h-80 overflow-auto rounded border border-flixer-border">
            <table class="w-full text-left text-sm">
              <thead class="text-flixer-muted"><tr><th class="p-3">{{ t('analytics.advertising.day') }}</th><th class="p-3">{{ t('analytics.viewing.sessions') }}</th><th class="p-3">{{ t('analytics.advertising.seconds') }}</th></tr></thead>
              <tbody><tr v-for="row in data.daily" :key="row.day" class="border-t border-flixer-border"><td class="p-3">{{ row.day }}</td><td class="p-3">{{ screen === 'video' ? row.video_sessions : row.live_sessions }}</td><td class="p-3">{{ Math.round(screen === 'video' ? row.video_seconds : row.live_seconds) }}</td></tr></tbody>
            </table>
          </div>
        </template>
      </template>
    </div>
  </AdminSection>
</template>
