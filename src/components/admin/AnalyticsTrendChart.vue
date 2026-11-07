<script setup lang="ts">
import { computed } from 'vue'
import { LineChart } from 'nuxt-charts/components'
import 'nuxt-charts/theme.css'
import 'nuxt-charts/components.css'
import type { DailyCount } from './analyticsChartData'

const props = defineProps<{ points: DailyCount[]; label: string }>()
const categories = computed(() => ({ value: { name: props.label, color: 'var(--color-flixer-accent)' } }))
const tickStep = computed(() => Math.max(1, Math.ceil(Math.max(0, ...props.points.map((point) => point.value)) / 4)))
const yTicks = computed(() => Array.from({ length: 5 }, (_, index) => index * tickStep.value))
</script>

<template>
  <div class="analytics-chart rounded border border-flixer-border bg-flixer-background/30 p-3">
    <LineChart
      :data="points"
      :categories="categories"
      :height="230"
      x-axis="day"
      :aria-label="label"
      :x-num-ticks="2"
      :padding="{ top: 5, right: 55, bottom: 5, left: 5 }"
      :y-domain="[0, yTicks[4]]"
      :y-explicit-ticks="yTicks"
      :duration="0"
      dot-variant="default"
      hide-legend
      y-grid-line
    />
  </div>
</template>

<style scoped>
.analytics-chart :deep(.vue-chrts) {
  --vc-grid-color: var(--color-flixer-border);
  --vc-axis-line-color: var(--color-flixer-border);
  --vc-surface-bg: var(--color-flixer-surface);
  --vc-tick-color: var(--color-flixer-muted);
  --vc-axis-label-color: var(--color-flixer-text);
  --vc-legend-color: var(--color-flixer-muted);
  --vc-tooltip-bg: var(--color-flixer-surface);
  --vc-tooltip-fg: var(--color-flixer-text);
  --vc-tooltip-muted: var(--color-flixer-muted);
  --vc-tooltip-border: var(--color-flixer-border);
}
</style>
