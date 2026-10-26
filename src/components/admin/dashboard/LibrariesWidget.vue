<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { AdminOverview } from '../../../api'
import AdminSection from '../AdminSection.vue'
import { formatBytes } from './dashboardFormat'

defineProps<{ overview: AdminOverview }>()
const { t } = useI18n()
</script>

<template>
  <AdminSection :title="t('admin.dashboard.widgets.libraries')" class="h-full">
    <ul class="grid gap-2 text-sm">
      <li v-for="lib in overview.libraries" :key="lib.id" class="flex items-baseline justify-between gap-3">
        <span class="truncate font-medium">{{ lib.name }}</span>
        <span class="shrink-0 text-xs text-flixer-muted">{{ t('admin.dashboard.itemCount', { count: lib.items }) }} · {{ formatBytes(lib.sizeBytes) }}</span>
      </li>
      <li v-if="overview.libraries.length === 0" class="text-flixer-muted">{{ t('admin.overview.noLibraries') }}</li>
    </ul>
  </AdminSection>
</template>
