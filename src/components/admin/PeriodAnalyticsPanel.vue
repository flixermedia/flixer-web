<script setup lang="ts">
import { Field, FieldLabel } from '@ui-sdk/vue/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui-sdk/vue/select'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getMusicAnalytics, getOrderAnalytics, type MusicAnalytics, type OrderAnalytics } from '../../api/analytics'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import AdminSection from './AdminSection.vue'
import AnalyticsTrendChart from './AnalyticsTrendChart.vue'
import { dailyCounts } from './analyticsChartData'

const props = defineProps<{ screen: 'music' | 'orders' }>()
const { t } = useI18n()
const days = ref<7 | 30 | 90>(30)
const music = ref<MusicAnalytics | null>(null)
const orders = ref<OrderAnalytics | null>(null)
const loading = ref(true)
const error = ref('')
const musicPoints = computed(() => dailyCounts((music.value?.daily ?? []).map((row) => ({ day: row.day, value: row.plays }))))
const orderPoints = computed(() => dailyCounts((orders.value?.rows ?? []).map((row) => ({ day: row.day, value: row.orders }))))
let generation = 0

async function load() {
  const request = ++generation
  loading.value = true
  if (props.screen === 'music') {
    const [failure, result] = await catchError(getMusicAnalytics(days.value))
    if (request !== generation) return
    if (failure) error.value = describeRequestError(failure, t('analytics.loadError'))
    else { music.value = result; error.value = '' }
  } else {
    const [failure, result] = await catchError(getOrderAnalytics(days.value))
    if (request !== generation) return
    if (failure) error.value = describeRequestError(failure, t('analytics.loadError'))
    else { orders.value = result; error.value = '' }
  }
  loading.value = false
}
function changeDays(value: string | null) {
  if (value === null) return
  days.value = Number(value) as 7 | 30 | 90
  void load()
}
onMounted(load)
onBeforeUnmount(() => { generation++ })
</script>

<template>
  <AdminSection :title="t(`analytics.period.${screen}`)" :description="t(`analytics.period.${screen}Note`)">
    <div class="space-y-4">
      <Field class="flex items-center gap-3 text-sm">
        <FieldLabel class="font-normal text-inherit">{{ t('analytics.advertising.range') }}</FieldLabel>
        <Select :value="String(days)" @value-change="changeDays">
          <SelectTrigger class="rounded border border-flixer-border bg-flixer-background px-3 py-2 text-left text-sm text-flixer-text focus-visible:outline-2 focus-visible:outline-flixer-accent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent class="rounded border border-flixer-border bg-flixer-surface p-1 text-sm text-flixer-text shadow-xl">
            <SelectItem v-for="period in [7, 30, 90]" :key="period" :value="String(period)" class="cursor-pointer rounded px-3 py-2 outline-none data-highlighted:bg-white/10 data-selected:bg-white/10">
              {{ t('analytics.advertising.days', { count: period }) }}
            </SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <p class="text-xs text-flixer-muted">{{ t('analytics.period.rangeNote') }}</p>
      <p v-if="loading" role="status" class="text-sm text-flixer-muted">{{ t('common.loading') }}</p>
      <p v-else-if="error" role="alert" class="text-sm text-red-200">{{ error }}</p>
      <template v-else-if="screen === 'music' && music">
        <p v-if="!music.tracks.length" class="text-sm text-flixer-muted">{{ t('analytics.empty') }}</p>
        <template v-else>
          <h3 class="font-semibold">{{ t('analytics.period.topTracks') }}</h3>
          <div class="overflow-x-auto"><table class="w-full text-left text-sm"><thead class="text-flixer-muted"><tr><th class="p-3">{{ t('analytics.content') }}</th><th class="p-3">{{ t('analytics.plays') }}</th><th class="p-3">{{ t('analytics.listeners') }}</th></tr></thead><tbody><tr v-for="row in music.tracks" :key="row.id" class="border-t border-flixer-border"><td class="p-3">{{ row.title }}</td><td class="p-3">{{ row.plays }}</td><td class="p-3">{{ row.listeners }}</td></tr></tbody></table></div>
          <h3 class="font-semibold">{{ t('analytics.period.dailyMusic') }}</h3>
          <AnalyticsTrendChart v-if="musicPoints.length" :points="musicPoints" :label="t('analytics.charts.musicPlays')" />
          <div class="max-h-80 overflow-auto"><table class="w-full text-left text-sm"><thead class="text-flixer-muted"><tr><th class="p-3">{{ t('analytics.advertising.day') }}</th><th class="p-3">{{ t('analytics.plays') }}</th></tr></thead><tbody><tr v-for="row in music.daily" :key="row.day" class="border-t border-flixer-border"><td class="p-3">{{ row.day }}</td><td class="p-3">{{ row.plays }}</td></tr></tbody></table></div>
        </template>
      </template>
      <template v-else-if="orders">
        <p v-if="!orders.rows.length" class="text-sm text-flixer-muted">{{ t('analytics.empty') }}</p>
        <template v-else>
          <h3 class="font-semibold">{{ t('analytics.charts.orderCount') }}</h3>
          <p class="text-xs text-flixer-muted">{{ t('analytics.charts.orderCountNote') }}</p>
          <AnalyticsTrendChart :points="orderPoints" :label="t('analytics.charts.orderCount')" />
          <div class="max-h-96 overflow-auto"><table class="w-full text-left text-sm"><thead class="text-flixer-muted"><tr><th class="p-3">{{ t('analytics.advertising.day') }}</th><th class="p-3">{{ t('analytics.type') }}</th><th class="p-3">{{ t('analytics.currency') }}</th><th class="p-3">{{ t('analytics.status') }}</th><th class="p-3">{{ t('analytics.orders') }}</th><th class="p-3">{{ t('analytics.orderValue') }}</th><th class="p-3">{{ t('analytics.refunds') }}</th></tr></thead><tbody><tr v-for="row in orders.rows" :key="`${row.day}:${row.kind}:${row.currency}:${row.status}`" class="border-t border-flixer-border"><td class="p-3">{{ row.day }}</td><td class="p-3">{{ row.kind }}</td><td class="p-3">{{ row.currency }}</td><td class="p-3">{{ row.status }}</td><td class="p-3">{{ row.orders }}</td><td class="p-3">{{ row.total_minor }}</td><td class="p-3">{{ row.refunded_minor }}</td></tr></tbody></table></div>
        </template>
      </template>
    </div>
  </AdminSection>
</template>
