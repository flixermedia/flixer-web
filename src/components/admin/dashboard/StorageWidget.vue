<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AdminOverview } from '../../../api'
import AdminSection from '../AdminSection.vue'
import { formatBytes } from './dashboardFormat'

const props = defineProps<{ overview: AdminOverview }>()
const { t } = useI18n()

const totalDisk = computed(() => props.overview.storage.disks.reduce((sum, disk) => sum + disk.totalBytes, 0))
const freeDisk = computed(() => props.overview.storage.disks.reduce((sum, disk) => sum + disk.freeBytes, 0))
const diskUsedPct = computed(() => (totalDisk.value > 0 ? Math.round(((totalDisk.value - freeDisk.value) / totalDisk.value) * 100) : 0))
</script>

<template>
  <AdminSection :title="t('admin.overview.storageTitle')" :description="t('admin.overview.storageDescription')" class="h-full">
    <p class="text-2xl font-semibold">
      {{ formatBytes(overview.storage.usedBytes) }}
      <span class="text-sm font-normal text-flixer-muted">{{ t('admin.overview.inLibraries') }}</span>
    </p>
    <template v-if="totalDisk > 0">
      <div class="mt-3 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" :aria-valuenow="diskUsedPct" aria-valuemin="0" aria-valuemax="100">
        <div class="h-full rounded-full bg-linear-to-r from-flixer-primary to-flixer-cyan" :style="{ width: `${diskUsedPct}%` }"></div>
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
</template>
