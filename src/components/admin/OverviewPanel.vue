<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { activity, libraries, serverInfo, stats } from './mock'
import AdminSection from './AdminSection.vue'
import StatusPill from './StatusPill.vue'

const { t } = useI18n()

const storagePct = computed(() => Math.round((stats.storageUsedGb / stats.storageTotalGb) * 100))
const cards = computed(() => [
  { label: t('admin.overview.movies'), value: stats.movies },
  { label: t('admin.overview.series'), value: stats.shows },
  { label: t('admin.overview.episodes'), value: stats.episodes },
  { label: t('admin.overview.users'), value: stats.users },
])
const info = computed(() => [
  [t('admin.overview.serverName'), serverInfo.name],
  [t('admin.overview.flixerVersion'), serverInfo.version],
  [t('admin.overview.streamerVersion'), serverInfo.streamerVersion],
  [t('admin.overview.ffmpeg'), serverInfo.ffmpeg],
  [t('admin.overview.operatingSystem'), serverInfo.os],
  [t('admin.overview.uptime'), serverInfo.uptime],
  [t('admin.overview.address'), serverInfo.address],
])
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div v-for="card in cards" :key="card.label" class="rounded-lg border border-flixer-border bg-flixer-surface/50 p-5">
        <p class="text-xs text-flixer-muted">{{ card.label }}</p>
        <p class="mt-1 text-3xl font-semibold">{{ card.value.toLocaleString() }}</p>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <AdminSection :title="t('admin.overview.serverTitle')" :description="t('admin.overview.serverDescription')" class="lg:col-span-1">
        <template #actions
          ><StatusPill tone="good">{{ t('admin.overview.online') }}</StatusPill></template
        >
        <dl class="grid gap-2 text-sm">
          <div v-for="[k, v] in info" :key="k" class="flex justify-between gap-4">
            <dt class="text-flixer-muted">{{ k }}</dt>
            <dd class="truncate text-right font-medium">{{ v }}</dd>
          </div>
        </dl>
        <div class="mt-5 flex gap-2">
          <button type="button" class="rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15">{{ t('admin.overview.restart') }}</button>
          <button type="button" class="rounded bg-red-500/20 px-4 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/30">{{ t('admin.overview.shutDown') }}</button>
        </div>
      </AdminSection>

      <AdminSection :title="t('admin.overview.storageTitle')" :description="t('admin.overview.storageDescription')" class="lg:col-span-1">
        <p class="text-2xl font-semibold">
          {{ (stats.storageUsedGb / 1000).toFixed(1) }} TB <span class="text-sm font-normal text-flixer-muted">{{ t('admin.overview.of') }} {{ (stats.storageTotalGb / 1000).toFixed(1) }} TB</span>
        </p>
        <div class="mt-3 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" :aria-valuenow="storagePct" aria-valuemin="0" aria-valuemax="100">
          <div class="h-full rounded-full bg-linear-to-r from-flixer-primary to-flixer-cyan" :style="{ width: `${storagePct}%` }"></div>
        </div>
        <ul class="mt-4 grid gap-2 text-sm">
          <li v-for="lib in libraries" :key="lib.id" class="flex justify-between">
            <span class="text-flixer-muted">{{ lib.name }}</span>
            <span class="font-medium">{{ (lib.sizeGb / 1000).toFixed(2) }} TB</span>
          </li>
        </ul>
      </AdminSection>

      <AdminSection :title="t('admin.overview.recentActivityTitle')" :description="t('admin.overview.recentActivityDescription')" class="lg:col-span-1">
        <ul class="grid gap-3 text-sm">
          <li v-for="(a, i) in activity" :key="i">
            <p>
              <span class="font-semibold">{{ a.user }}</span> {{ a.text }}
            </p>
            <p class="text-xs text-flixer-muted">{{ a.time }}</p>
          </li>
        </ul>
      </AdminSection>
    </div>
  </div>
</template>
