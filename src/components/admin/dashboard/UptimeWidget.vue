<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { AdminOverview } from '../../../api'
import AdminSection from '../AdminSection.vue'
import { formatUptime } from './dashboardFormat'

defineProps<{ overview: AdminOverview }>()
const { t } = useI18n()
</script>

<template>
  <AdminSection :title="t('admin.dashboard.widgets.uptime')" class="h-full">
    <p class="text-3xl font-semibold">{{ formatUptime(overview.server.uptimeSeconds) }}</p>
    <p class="mt-2 text-xs text-flixer-muted">{{ overview.server.name }} · v{{ overview.server.version }}</p>
  </AdminSection>
</template>
