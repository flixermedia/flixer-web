<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getAnalyticsSnapshot, type AnalyticsSnapshot } from '../../api/analytics'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import AdminSection from './AdminSection.vue'
import AnalyticsTrendChart from './AnalyticsTrendChart.vue'
import { dailyCounts } from './analyticsChartData'

const props = defineProps<{ screen: 'overview' | 'video' | 'music' | 'advertising' | 'guide' | 'payments' }>()
const { t } = useI18n()
const data = ref<AnalyticsSnapshot | null>(null)
const loading = ref(true)
const error = ref('')
const adDays = ref<7 | 30 | 90>(30)
const maxDailyViews = computed(() => Math.max(1, ...(data.value?.adTrend.map((day) => day.views) ?? [])))
const adPoints = computed(() => dailyCounts((data.value?.adTrend ?? []).map((day) => ({ day: day.day, value: day.views }))))
const adTotals = computed(() => (data.value?.adViews ?? []).reduce(
  (sum, ad) => ({ views: sum.views + ad.views, completed: sum.completed + ad.completed, skipped: sum.skipped + ad.skipped, clicked: sum.clicked + ad.clicked, watched: sum.watched + ad.watched_seconds }),
  { views: 0, completed: 0, skipped: 0, clicked: 0, watched: 0 },
))
let generation = 0

async function load() {
  const request = ++generation
  loading.value = true
  const [failure, result] = await catchError(getAnalyticsSnapshot(props.screen === 'advertising' ? adDays.value : undefined))
  if (request !== generation) return
  if (failure) error.value = describeRequestError(failure, t('analytics.loadError'))
  else { data.value = result; error.value = '' }
  loading.value = false
}
onMounted(load)
watch(() => props.screen, load)
onBeforeUnmount(() => { generation++ })

</script>

<template>
  <div class="space-y-5">
    <AdminSection :title="t(`analytics.${screen}.title`)" :description="t(`analytics.${screen}.description`)">
      <template #actions>
        <button type="button" class="rounded border border-flixer-border px-4 py-2 text-sm hover:bg-white/5" :disabled="loading" @click="load">{{ t('analytics.refresh') }}</button>
      </template>
      <p v-if="loading" role="status" class="text-sm text-flixer-muted">{{ t('common.loading') }}</p>
      <div v-else-if="error" role="alert" class="text-sm text-red-200">{{ error }}</div>
      <template v-else-if="data">
        <div v-if="screen === 'overview'" class="grid gap-3 md:grid-cols-3">
          <div class="rounded border border-flixer-border bg-flixer-background/50 p-4"><p class="text-sm text-flixer-muted">{{ t('analytics.video.title') }}</p><p class="mt-2 text-2xl font-semibold">{{ data.video.length }}</p><p class="text-xs text-flixer-muted">{{ t('analytics.topRows') }}</p></div>
          <div class="rounded border border-flixer-border bg-flixer-background/50 p-4"><p class="text-sm text-flixer-muted">{{ t('analytics.music.title') }}</p><p class="mt-2 text-2xl font-semibold">{{ data.music.length }}</p><p class="text-xs text-flixer-muted">{{ t('analytics.topRows') }}</p></div>
          <div class="rounded border border-flixer-border bg-flixer-background/50 p-4"><p class="text-sm text-flixer-muted">{{ t('analytics.enabledAds') }}</p><p class="mt-2 text-2xl font-semibold">{{ data.advertisements.enabled }} / {{ data.advertisements.total }}</p></div>
        </div>
        <div v-else-if="screen === 'video'">
          <p class="mb-4 text-xs text-flixer-muted">{{ t('analytics.video.note') }}</p>
          <p v-if="!data.video.length" class="text-sm text-flixer-muted">{{ t('analytics.empty') }}</p>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-left text-sm"><thead class="text-flixer-muted"><tr><th class="pb-3">{{ t('analytics.content') }}</th><th class="pb-3">{{ t('analytics.type') }}</th><th class="pb-3">{{ t('analytics.viewers') }}</th><th class="pb-3">{{ t('analytics.completed') }}</th></tr></thead>
              <tbody><tr v-for="row in data.video" :key="row.id" class="border-t border-flixer-border"><td class="py-3 pr-4">{{ row.title }}</td><td class="py-3 pr-4">{{ row.type }}</td><td>{{ row.viewers }}</td><td>{{ row.completed }}</td></tr></tbody></table>
          </div>
        </div>
        <div v-else-if="screen === 'music'">
          <p class="mb-4 text-xs text-flixer-muted">{{ t('analytics.music.note') }}</p>
          <p v-if="!data.music.length" class="text-sm text-flixer-muted">{{ t('analytics.empty') }}</p>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-left text-sm"><thead class="text-flixer-muted"><tr><th class="pb-3">{{ t('analytics.content') }}</th><th class="pb-3">{{ t('analytics.plays') }}</th><th class="pb-3">{{ t('analytics.listeners') }}</th></tr></thead>
              <tbody><tr v-for="row in data.music" :key="row.id" class="border-t border-flixer-border"><td class="py-3 pr-4">{{ row.title }}</td><td>{{ row.plays }}</td><td>{{ row.listeners }}</td></tr></tbody></table>
          </div>
        </div>
        <div v-else-if="screen === 'payments'" class="space-y-6">
          <p class="text-xs text-flixer-muted">{{ t('analytics.payments.note') }}</p>
          <p v-if="!data.orders.length" class="text-sm text-flixer-muted">{{ t('analytics.empty') }}</p>
          <div v-else class="overflow-x-auto"><table class="w-full text-left text-sm"><thead class="text-flixer-muted"><tr><th>{{ t('analytics.currency') }}</th><th>{{ t('analytics.status') }}</th><th>{{ t('analytics.orders') }}</th><th>{{ t('analytics.orderValue') }}</th><th>{{ t('analytics.refunds') }}</th></tr></thead><tbody><tr v-for="row in data.orders" :key="`${row.currency}:${row.status}`" class="border-t border-flixer-border"><td class="py-3">{{ row.currency }}</td><td>{{ row.status }}</td><td>{{ row.orders }}</td><td>{{ row.total_minor }}</td><td>{{ row.refunded_minor }}</td></tr></tbody></table></div>
          <div><h3 class="font-semibold">{{ t('analytics.subscriptions') }}</h3><p v-if="!data.subscriptions.length" class="mt-2 text-sm text-flixer-muted">{{ t('analytics.empty') }}</p><p v-for="row in data.subscriptions" :key="row.status" class="mt-2 text-sm">{{ row.status }}: {{ row.count }}</p></div>
        </div>
        <div v-else-if="screen === 'advertising'" class="space-y-3">
          <p class="text-2xl font-semibold">{{ data.advertisements.enabled }} / {{ data.advertisements.total }}</p>
          <p class="text-sm text-flixer-muted">{{ t('analytics.enabledAds') }}</p>
          <p class="rounded border border-flixer-border bg-flixer-background/50 p-4 text-sm text-flixer-muted">{{ t('analytics.advertising.note') }}</p>
          <label class="flex items-center gap-3 text-sm">
            {{ t('analytics.advertising.range') }}
            <select v-model.number="adDays" class="rounded border border-flixer-border bg-flixer-background px-3 py-2" @change="load">
              <option :value="7">{{ t('analytics.advertising.days', { count: 7 }) }}</option>
              <option :value="30">{{ t('analytics.advertising.days', { count: 30 }) }}</option>
              <option :value="90">{{ t('analytics.advertising.days', { count: 90 }) }}</option>
            </select>
          </label>
          <p class="text-xs text-flixer-muted">{{ t('analytics.advertising.rangeNote') }}</p>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div v-for="metric in [
              { label: t('analytics.advertising.views'), value: adTotals.views },
              { label: t('analytics.completed'), value: adTotals.completed },
              { label: t('analytics.advertising.clicked'), value: adTotals.clicked },
              { label: t('analytics.advertising.seconds'), value: Math.round(adTotals.watched) },
            ]" :key="metric.label" class="rounded border border-flixer-border bg-flixer-background/50 p-4">
              <p class="text-sm text-flixer-muted">{{ metric.label }}</p><p class="mt-1 text-xl font-semibold">{{ metric.value }}</p>
            </div>
          </div>
          <h3 class="pt-3 font-semibold">{{ t('analytics.advertising.dailyViews') }}</h3>
          <AnalyticsTrendChart v-if="adPoints.length" :points="adPoints" :label="t('analytics.charts.adViews')" />
          <div class="max-h-80 overflow-auto rounded border border-flixer-border">
            <table class="w-full text-left text-sm">
              <thead class="text-flixer-muted"><tr><th class="p-3">{{ t('analytics.advertising.day') }}</th><th class="p-3">{{ t('analytics.advertising.views') }}</th><th class="p-3">{{ t('analytics.advertising.seconds') }}</th></tr></thead>
              <tbody><tr v-for="day in data.adTrend" :key="day.day" class="border-t border-flixer-border">
                <td class="p-3">{{ day.day }}</td>
                <td class="p-3"><span>{{ day.views }}</span><div class="mt-1 h-1.5 rounded bg-flixer-primary" :style="{ width: `${day.views / maxDailyViews * 100}%` }" aria-hidden="true" /></td>
                <td class="p-3">{{ Math.round(day.watched_seconds) }}</td>
              </tr></tbody>
            </table>
          </div>
          <h3 class="pt-3 font-semibold">{{ t('analytics.advertising.byAdvertisement') }}</h3>
          <div v-if="data.adViews.length" class="overflow-x-auto"><table class="w-full text-left text-sm"><thead class="text-flixer-muted"><tr><th>{{ t('analytics.content') }}</th><th>{{ t('analytics.advertising.views') }}</th><th>{{ t('analytics.completed') }}</th><th>{{ t('analytics.advertising.skipped') }}</th><th>{{ t('analytics.advertising.clicked') }}</th><th>{{ t('analytics.advertising.seconds') }}</th></tr></thead><tbody><tr v-for="row in data.adViews" :key="row.id" class="border-t border-flixer-border"><td class="py-3 pr-4">{{ row.name }}</td><td>{{ row.views }}</td><td>{{ row.completed }}</td><td>{{ row.skipped }}</td><td>{{ row.clicked }}</td><td>{{ Math.round(row.watched_seconds) }}</td></tr></tbody></table></div>
          <p v-else class="text-sm text-flixer-muted">{{ t('analytics.empty') }}</p>
        </div>
        <p v-else class="rounded border border-flixer-border bg-flixer-background/50 p-4 text-sm text-flixer-muted">{{ t('analytics.guide.unavailable') }}</p>
      </template>
    </AdminSection>
  </div>
</template>
