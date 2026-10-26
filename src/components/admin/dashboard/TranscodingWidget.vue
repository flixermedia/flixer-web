<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AdminOverview } from '../../../api'
import AdminSection from '../AdminSection.vue'

const props = defineProps<{ overview: AdminOverview }>()
const { t } = useI18n()
const streamer = computed(() => props.overview.server.streamer)
const pct = computed(() => (streamer.value.maxTranscodes > 0 ? Math.min(100, Math.round((streamer.value.activeTranscodes / streamer.value.maxTranscodes) * 100)) : 0))
</script>

<template>
  <AdminSection :title="t('admin.dashboard.widgets.transcoding')" class="h-full">
    <p v-if="!streamer.reachable" class="text-sm text-red-200">{{ t('admin.dashboard.offline') }}</p>
    <p v-else-if="!streamer.transcodingAvailable" class="text-sm text-flixer-muted">{{ t('admin.dashboard.transcodingUnavailable') }}</p>
    <template v-else>
      <p class="text-3xl font-semibold">
        {{ streamer.activeTranscodes }}
        <span class="text-sm font-normal text-flixer-muted">/ {{ streamer.maxTranscodes }}</span>
      </p>
      <div class="mt-3 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" :aria-valuenow="pct" aria-valuemin="0" aria-valuemax="100">
        <div class="h-full rounded-full bg-linear-to-r from-flixer-primary to-flixer-cyan" :style="{ width: `${pct}%` }"></div>
      </div>
      <p class="mt-2 text-xs text-flixer-muted">{{ t('admin.dashboard.streamSessions', { count: streamer.sessions }) }}</p>
    </template>
  </AdminSection>
</template>
