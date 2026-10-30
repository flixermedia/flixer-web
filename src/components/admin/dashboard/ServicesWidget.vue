<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AdminOverview } from '../../../api'
import StatusPill from '../StatusPill.vue'
import AdminSection from '../AdminSection.vue'

const props = defineProps<{ overview: AdminOverview }>()
const { t } = useI18n()
const services = computed(() => [
  { key: 'streamer', ok: props.overview.server.streamer.reachable },
  { key: 'indexer', ok: props.overview.server.indexer.reachable },
])
</script>

<template>
  <AdminSection :title="t('admin.dashboard.widgets.services')" compact class="h-full">
    <ul class="flex flex-wrap gap-x-4 gap-y-2 text-sm">
      <li v-for="service in services" :key="service.key" class="flex items-center gap-2">
        <span class="font-medium">{{ t(`admin.dashboard.serviceNames.${service.key}`) }}</span>
        <StatusPill :tone="service.ok ? 'good' : 'bad'">{{ service.ok ? t('admin.dashboard.online') : t('admin.dashboard.offline') }}</StatusPill>
      </li>
    </ul>
  </AdminSection>
</template>
