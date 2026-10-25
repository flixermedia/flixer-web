<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import type { AdminOverview } from '../../../api'
import { useActivityFormat } from '../../../composables/useActivityFormat'
import AdminSection from '../AdminSection.vue'

const ACTIVITY_PREVIEW = 3

const props = defineProps<{ overview: AdminOverview }>()
const { t } = useI18n()
const { relativeTime, activityTitle, activityVerb } = useActivityFormat()

const rows = computed(() => props.overview.activity.slice(0, ACTIVITY_PREVIEW).map((entry) => ({ user: entry.user, verb: activityVerb(entry), title: activityTitle(entry), time: relativeTime(entry.at) })))
</script>

<template>
  <AdminSection :title="t('admin.overview.recentActivityTitle')" :description="t('admin.overview.recentActivityDescription')" class="h-full">
    <ul class="grid gap-3 text-sm">
      <li v-for="(row, i) in rows" :key="i">
        <p>
          <span class="font-semibold">{{ row.user }}</span> {{ row.verb }} <span class="text-flixer-muted">{{ row.title }}</span>
        </p>
        <p class="text-xs text-flixer-muted">{{ row.time }}</p>
      </li>
      <li v-if="rows.length === 0" class="text-flixer-muted">{{ t('admin.overview.noActivity') }}</li>
    </ul>
    <RouterLink :to="{ name: 'admin-activity' }" class="mt-4 inline-block text-sm font-semibold text-flixer-accent hover:underline focus-visible:outline-2 focus-visible:outline-flixer-accent">{{ t('admin.overview.viewAllActivity') }}</RouterLink>
  </AdminSection>
</template>
