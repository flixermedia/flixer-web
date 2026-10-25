<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AdminOverview } from '../../../api'

const props = defineProps<{ overview: AdminOverview }>()
const { t, locale } = useI18n()

const cards = computed(() => {
  const counts = props.overview.counts
  return [
    { label: t('admin.overview.movies'), value: counts.movies },
    { label: t('admin.overview.series'), value: counts.series },
    { label: t('admin.overview.episodes'), value: counts.episodes },
    { label: t('admin.overview.tracks'), value: counts.tracks },
    { label: t('admin.overview.users'), value: counts.users },
  ]
})
</script>

<template>
  <div class="grid grid-cols-2 gap-3 lg:grid-cols-5">
    <div v-for="card in cards" :key="card.label" class="admin-card admin-stat px-5 py-4">
      <p class="text-xs font-medium uppercase tracking-wider text-flixer-muted">{{ card.label }}</p>
      <p class="mt-2 bg-linear-to-br from-white to-flixer-accent bg-clip-text text-3xl font-semibold tabular-nums text-transparent">{{ card.value.toLocaleString(locale) }}</p>
    </div>
  </div>
</template>
