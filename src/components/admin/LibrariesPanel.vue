<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminSection from './AdminSection.vue'
import AdminToggle from './AdminToggle.vue'
import { libraries } from './mock'
import StatusPill from './StatusPill.vue'

const { t } = useI18n()

const expandedId = ref<string | null>(null)
const libraryTypeKeys: Record<string, string> = { Movies: 'admin.libraries.typeMovies', 'TV Shows': 'admin.libraries.typeTvShows', Music: 'admin.libraries.typeMusic', 'Home Videos': 'admin.libraries.typeHomeVideos' }
const metadataLanguageKeys: Record<string, string> = { English: 'admin.libraries.english', Japanese: 'admin.libraries.japanese' }
</script>

<template>
  <AdminSection :title="t('admin.libraries.title')" :description="t('admin.libraries.description')">
    <template #actions>
      <button type="button" class="rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15">{{ t('admin.libraries.scanAll') }}</button>
      <button type="button" class="rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80">{{ t('admin.libraries.addLibrary') }}</button>
    </template>

    <ul class="flex flex-col gap-3">
      <li v-for="lib in libraries" :key="lib.id" class="rounded-lg border border-flixer-border bg-flixer-background/60 p-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-sm font-semibold">
              {{ lib.name }} <StatusPill tone="accent" class="ml-2">{{ t(libraryTypeKeys[lib.type]) }}</StatusPill>
            </p>
            <p class="mt-1 truncate text-xs text-flixer-muted">{{ lib.paths.join(' · ') }}</p>
          </div>
          <div class="flex items-center gap-2">
            <StatusPill v-if="lib.scanning" tone="good">{{ t('admin.libraries.scanning', { progress: lib.scanProgress }) }}</StatusPill>
            <button type="button" class="rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15">{{ t('admin.libraries.scan') }}</button>
            <button type="button" class="rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15" :aria-expanded="expandedId === lib.id" @click="expandedId = expandedId === lib.id ? null : lib.id">
              {{ expandedId === lib.id ? t('admin.libraries.close') : t('admin.libraries.manage') }}
            </button>
          </div>
        </div>

        <div v-if="lib.scanning" class="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div class="h-full rounded-full bg-flixer-primary" :style="{ width: `${lib.scanProgress}%` }"></div>
        </div>

        <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
          <div>
            <dt class="text-flixer-muted">{{ t('admin.libraries.items') }}</dt>
            <dd class="font-medium">{{ lib.items.toLocaleString() }}</dd>
          </div>
          <div>
            <dt class="text-flixer-muted">{{ t('admin.libraries.size') }}</dt>
            <dd class="font-medium">{{ (lib.sizeGb / 1000).toFixed(2) }} TB</dd>
          </div>
          <div>
            <dt class="text-flixer-muted">{{ t('admin.libraries.lastScan') }}</dt>
            <dd class="font-medium">{{ lib.lastScan }}</dd>
          </div>
          <div>
            <dt class="text-flixer-muted">{{ t('admin.libraries.metadata') }}</dt>
            <dd class="font-medium">{{ lib.providers.join(', ') || t('admin.libraries.none') }}</dd>
          </div>
        </dl>

        <div v-if="expandedId === lib.id" class="mt-4 grid gap-4 border-t border-flixer-border pt-4 md:grid-cols-2">
          <div>
            <p class="text-xs font-semibold text-flixer-muted">{{ t('admin.libraries.folders') }}</p>
            <ul class="mt-2 grid gap-2">
              <li v-for="p in lib.paths" :key="p" class="flex items-center justify-between rounded bg-white/5 px-3 py-2 text-xs">
                <span class="font-mono">{{ p }}</span>
                <button type="button" class="text-red-300 hover:underline">{{ t('admin.libraries.remove') }}</button>
              </li>
            </ul>
            <button type="button" class="mt-2 text-xs text-flixer-accent hover:underline">{{ t('admin.libraries.addFolder') }}</button>
          </div>
          <div>
            <AdminToggle :model-value="lib.realtimeMonitor" :label="t('admin.libraries.realtimeMonitoring')" :description="t('admin.libraries.realtimeDescription')" />
            <AdminToggle :model-value="true" :label="t('admin.libraries.downloadArtwork')" :description="t('admin.libraries.artworkDescription')" />
            <AdminToggle :model-value="false" :label="t('admin.libraries.saveArtworkNextToMedia')" />
            <label class="mt-2 block text-xs text-flixer-muted">
              {{ t('admin.libraries.preferredMetadataLanguage') }}
              <select class="mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-flixer-text">
                <option>{{ t(metadataLanguageKeys[lib.metadataLanguage] ?? lib.metadataLanguage) }}</option>
                <option>{{ t('admin.libraries.english') }}</option>
                <option>{{ t('admin.libraries.japanese') }}</option>
              </select>
            </label>
            <div class="mt-4 flex gap-2">
              <button type="button" class="rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15">{{ t('admin.libraries.refreshMetadata') }}</button>
              <button type="button" class="rounded bg-red-500/20 px-4 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/30">{{ t('admin.libraries.deleteLibrary') }}</button>
            </div>
          </div>
        </div>
      </li>
    </ul>
  </AdminSection>
</template>
