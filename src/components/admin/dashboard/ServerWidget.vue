<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AdminOverview } from '../../../api'
import AdminSection from '../AdminSection.vue'
import StatusPill from '../StatusPill.vue'
import { formatUptime } from './dashboardFormat'

const props = defineProps<{ overview: AdminOverview }>()
const { t } = useI18n()

const info = computed(() => {
  const server = props.overview.server
  const streamer = server.streamer
  const transcodes = !streamer.reachable ? '—' : streamer.transcodingAvailable ? `${streamer.activeTranscodes} / ${streamer.maxTranscodes || '∞'}` : t('admin.overview.unavailable')
  return [
    [t('admin.overview.serverName'), server.name],
    [t('admin.overview.flixerVersion'), server.version],
    [t('admin.overview.operatingSystem'), server.os],
    ['Node.js', server.node],
    [t('admin.overview.uptime'), formatUptime(server.uptimeSeconds)],
    [t('admin.overview.activeStreams'), streamer.reachable ? `${streamer.sessions}` : '—'],
    [t('admin.overview.transcodes'), transcodes],
  ]
})

const services = computed(() => [
  { name: t('admin.overview.streamer'), ok: props.overview.server.streamer.reachable },
  { name: t('admin.overview.indexer'), ok: props.overview.server.indexer.reachable },
])
</script>

<template>
  <AdminSection :title="t('admin.overview.serverTitle')" :description="t('admin.overview.serverDescription')" compact class="h-full">
    <template #actions>
      <div class="flex gap-2">
        <StatusPill v-for="service in services" :key="service.name" :tone="service.ok ? 'good' : 'bad'">{{ service.name }}</StatusPill>
      </div>
    </template>
    <dl class="grid gap-y-1 text-sm">
      <div v-for="[k, v] in info" :key="k" class="flex justify-between gap-4">
        <dt class="text-flixer-muted">{{ k }}</dt>
        <dd class="truncate text-right font-medium">{{ v }}</dd>
      </div>
    </dl>
  </AdminSection>
</template>
