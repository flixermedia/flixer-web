<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminSkeleton from './AdminSkeleton.vue'
import { getAdminOverview, type AdminOverview } from '../../api'
import { describeRequestError } from '../../composables/useProfile'
import { useLiveTopic } from '../../composables/useLive'
import AdminSection from './AdminSection.vue'
import StatusPill from './StatusPill.vue'

const { t, locale } = useI18n()

const overview = ref<AdminOverview | null>(null)
const isLoading = ref(true)
const loadError = ref('')

const cards = computed(() => {
  const counts = overview.value?.counts
  return [
    { label: t('admin.overview.movies'), value: counts?.movies ?? 0 },
    { label: t('admin.overview.series'), value: counts?.series ?? 0 },
    { label: t('admin.overview.episodes'), value: counts?.episodes ?? 0 },
    { label: t('admin.overview.tracks'), value: counts?.tracks ?? 0 },
    { label: t('admin.overview.users'), value: counts?.users ?? 0 },
  ]
})

const totalDisk = computed(() => overview.value?.storage.disks.reduce((sum, disk) => sum + disk.totalBytes, 0) ?? 0)
const freeDisk = computed(() => overview.value?.storage.disks.reduce((sum, disk) => sum + disk.freeBytes, 0) ?? 0)
const diskUsedPct = computed(() => (totalDisk.value > 0 ? Math.round(((totalDisk.value - freeDisk.value) / totalDisk.value) * 100) : 0))

const info = computed(() => {
  const server = overview.value?.server
  if (!server) return []
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

const services = computed(() => {
  const server = overview.value?.server
  if (!server) return []
  return [
    { name: t('admin.overview.streamer'), ok: server.streamer.reachable },
    { name: t('admin.overview.indexer'), ok: server.indexer.reachable },
  ]
})

function formatBytes(bytes: number) {
  if (bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1000)), units.length - 1)
  const value = bytes / 1000 ** exponent
  return `${value.toFixed(exponent === 0 || value >= 100 ? 0 : 1)} ${units[exponent]}`
}

function formatUptime(seconds: number) {
  const days = Math.floor(seconds / 86_400)
  const hours = Math.floor((seconds % 86_400) / 3_600)
  const minutes = Math.floor((seconds % 3_600) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
]

function relativeTime(iso: string) {
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000
  if (Math.abs(seconds) < 60) return t('admin.overview.justNow')
  const [unit, size] = UNITS.find(([, s]) => Math.abs(seconds) >= s) ?? UNITS[2]
  return new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' }).format(Math.round(seconds / size), unit)
}

type Activity = AdminOverview['activity'][number]

function activityTitle(entry: Activity) {
  if (entry.type === 'episode') {
    const code = entry.seasonNumber != null && entry.episodeNumber != null ? ` S${entry.seasonNumber}E${entry.episodeNumber}` : ''
    return `${entry.showTitle ?? ''}${code} ${entry.title}`.trim()
  }
  return entry.showTitle ? `${entry.showTitle} – ${entry.title}` : entry.title
}

function activityVerb(entry: Activity) {
  if (entry.completed) return t('admin.overview.finished')
  const pct = entry.durationSeconds > 0 ? Math.round((entry.positionSeconds / entry.durationSeconds) * 100) : 0
  return t('admin.overview.watching', { percent: pct })
}

async function load() {
  try {
    overview.value = await getAdminOverview()
    loadError.value = ''
  } catch (error: unknown) {
    console.error('[overview] failed to load', error)
    loadError.value = describeRequestError(error, t('admin.overview.loadError'))
  } finally {
    isLoading.value = false
  }
}

onMounted(() => void load())

const live = useLiveTopic<AdminOverview>('overview')
watch(live.data, (value) => {
  if (!value) return
  overview.value = value
  loadError.value = ''
  isLoading.value = false
})
</script>

<template>
  <p v-if="loadError" role="alert" class="rounded border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{{ loadError }}</p>
  <AdminSkeleton v-else-if="isLoading" variant="stats" />

  <div v-if="overview" class="flex flex-col gap-6">
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <div v-for="card in cards" :key="card.label" class="rounded-lg border border-flixer-border bg-flixer-surface/50 p-5">
        <p class="text-xs text-flixer-muted">{{ card.label }}</p>
        <p class="mt-1 text-3xl font-semibold">{{ card.value.toLocaleString(locale) }}</p>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <AdminSection :title="t('admin.overview.serverTitle')" :description="t('admin.overview.serverDescription')" class="lg:col-span-1">
        <template #actions>
          <div class="flex gap-2">
            <StatusPill v-for="service in services" :key="service.name" :tone="service.ok ? 'good' : 'bad'">{{ service.name }}</StatusPill>
          </div>
        </template>
        <dl class="grid gap-2 text-sm">
          <div v-for="[k, v] in info" :key="k" class="flex justify-between gap-4">
            <dt class="text-flixer-muted">{{ k }}</dt>
            <dd class="truncate text-right font-medium">{{ v }}</dd>
          </div>
        </dl>
      </AdminSection>

      <AdminSection :title="t('admin.overview.storageTitle')" :description="t('admin.overview.storageDescription')" class="lg:col-span-1">
        <p class="text-2xl font-semibold">
          {{ formatBytes(overview.storage.usedBytes) }}
          <span class="text-sm font-normal text-flixer-muted">{{ t('admin.overview.inLibraries') }}</span>
        </p>
        <template v-if="totalDisk > 0">
          <div class="mt-3 h-2 overflow-hidden rounded bg-white/10" role="progressbar" :aria-valuenow="diskUsedPct" aria-valuemin="0" aria-valuemax="100">
            <div class="h-full rounded bg-linear-to-r from-flixer-primary to-flixer-cyan" :style="{ width: `${diskUsedPct}%` }"></div>
          </div>
          <p class="mt-2 text-xs text-flixer-muted">{{ t('admin.overview.diskFree', { free: formatBytes(freeDisk), total: formatBytes(totalDisk) }) }}</p>
        </template>
        <ul class="mt-4 grid gap-2 text-sm">
          <li v-for="lib in overview.libraries" :key="lib.id" class="flex justify-between gap-4">
            <span class="truncate text-flixer-muted">{{ lib.name }}</span>
            <span class="shrink-0 font-medium">{{ formatBytes(lib.sizeBytes) }}</span>
          </li>
          <li v-if="overview.libraries.length === 0" class="text-flixer-muted">{{ t('admin.overview.noLibraries') }}</li>
        </ul>
      </AdminSection>

      <AdminSection :title="t('admin.overview.recentActivityTitle')" :description="t('admin.overview.recentActivityDescription')" class="lg:col-span-1">
        <ul class="grid gap-3 text-sm">
          <li v-for="(a, i) in overview.activity" :key="i">
            <p>
              <span class="font-semibold">{{ a.user }}</span> {{ activityVerb(a) }} <span class="text-flixer-muted">{{ activityTitle(a) }}</span>
            </p>
            <p class="text-xs text-flixer-muted">{{ relativeTime(a.at) }}</p>
          </li>
          <li v-if="overview.activity.length === 0" class="text-flixer-muted">{{ t('admin.overview.noActivity') }}</li>
        </ul>
      </AdminSection>
    </div>
  </div>
</template>
