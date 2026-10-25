<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AdminOverview } from '../../../api'
import AdminSection from '../AdminSection.vue'

const props = defineProps<{ overview: AdminOverview }>()
const { t } = useI18n()
const COLORS = ['bg-flixer-primary', 'bg-flixer-cyan', 'bg-emerald-400', 'bg-amber-400', 'bg-pink-400']
const rows = computed(() => {
  const c = props.overview.counts
  const entries = [
    { key: 'movies', value: c.movies },
    { key: 'series', value: c.series },
    { key: 'episodes', value: c.episodes },
    { key: 'albums', value: c.albums },
    { key: 'tracks', value: c.tracks },
  ]
  const max = Math.max(1, ...entries.map((entry) => entry.value))
  return entries.map((entry, index) => ({ ...entry, width: Math.max(entry.value > 0 ? 2 : 0, Math.round((entry.value / max) * 100)), color: COLORS[index]! }))
})
</script>

<template>
  <AdminSection :title="t('admin.dashboard.widgets.content-mix')" class="h-full">
    <ul class="grid gap-3 text-sm">
      <li v-for="row in rows" :key="row.key">
        <div class="flex justify-between">
          <span class="text-flixer-muted">{{ t(`admin.dashboard.kinds.${row.key}`) }}</span
          ><span class="font-medium">{{ row.value.toLocaleString() }}</span>
        </div>
        <div class="mt-1 h-2 overflow-hidden rounded-full bg-white/10"><div class="h-full rounded-full" :class="row.color" :style="{ width: `${row.width}%` }"></div></div>
      </li>
    </ul>
  </AdminSection>
</template>
