<script setup lang="ts">
import { openModal } from '@kolirt/vue-modal'
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminSkeleton from './AdminSkeleton.vue'
import { deleteMediaLibrary, getIndexerStatus, listMediaLibraries, scanMediaLibrary, type IndexerScan, type IndexerStatus, type MediaLibrary } from '../../api'
import { confirmAction } from '../../composables/confirm'
import { notify } from '../../composables/notify'
import { useLiveTopic } from '../../composables/useLive'
import { describeRequestError } from '../../composables/useProfile'
import AdminSection from './AdminSection.vue'
import LibraryModal from './LibraryModal.vue'
import NetworkSharesSection from './NetworkSharesSection.vue'
import StatusPill from './StatusPill.vue'

const { t } = useI18n()

const libraries = ref<MediaLibrary[]>([])
const loading = ref(true)
const error = ref('')
const deletingId = ref<string | null>(null)
const scans = ref<Record<string, IndexerScan>>({})
const indexerReachable = ref(true)
const scanningId = ref<string | null>(null)

function isRunning(scan?: IndexerScan) {
  return scan?.state === 'scanning' || scan?.state === 'indexing'
}

function applyStatus(status: IndexerStatus) {
  indexerReachable.value = status.reachable
  scans.value = Object.fromEntries(status.scans.map((scan) => [scan.libraryId, scan]))
}

async function pollScans() {
  try {
    applyStatus(await getIndexerStatus())
  } catch {
    indexerReachable.value = false
  }
}

async function scan(library: MediaLibrary, force: boolean) {
  scanningId.value = library.id
  try {
    await scanMediaLibrary(library.id, force)
    notify.success(t('admin.libraries.scanStarted'))
    await pollScans()
  } catch (err: unknown) {
    notify.error(describeRequestError(err, t('admin.libraries.scanError')))
  } finally {
    scanningId.value = null
  }
}

function scanLabel(scan: IndexerScan) {
  return t(`admin.libraries.scanState.${scan.state}`, { done: scan.done, discovered: scan.discovered })
}

function scanPercent(scan: IndexerScan) {
  if (scan.state === 'complete') return 100
  return scan.discovered > 0 ? Math.min(100, Math.round(((scan.done + scan.failed) / scan.discovered) * 100)) : 0
}

async function load() {
  try {
    libraries.value = await listMediaLibraries()
    error.value = ''
  } catch (err: unknown) {
    error.value = describeRequestError(err, t('admin.libraries.loadError'))
  } finally {
    loading.value = false
  }
}

async function openForm(library: MediaLibrary | null) {
  const saved = await openModal<boolean>(LibraryModal, { props: { library: library ?? undefined } }).catch(() => false)
  if (saved) await load()
}

async function remove(library: MediaLibrary) {
  if (!(await confirmAction(t('admin.libraries.confirmDelete', { name: library.name }), { danger: true }))) return
  deletingId.value = library.id
  try {
    await deleteMediaLibrary(library.id)
    notify.success(t('admin.libraries.deleted'))
  } catch (err: unknown) {
    notify.error(describeRequestError(err, t('admin.libraries.deleteError')))
  } finally {
    deletingId.value = null
    await load()
  }
}

onMounted(() => {
  void load()
  void pollScans()
})

const live = useLiveTopic<IndexerStatus>('indexer')
watch(live.data, (status) => {
  if (status) applyStatus(status)
})
</script>

<template>
  <div class="flex flex-col gap-6">
  <NetworkSharesSection @changed="load" />
  <AdminSection :title="t('admin.libraries.title')" :description="t('admin.libraries.description')">
    <template #actions>
      <button type="button" class="rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80" @click="openForm(null)">{{ t('admin.libraries.addLibrary') }}</button>
    </template>

    <p v-if="error" role="alert" class="mb-3 text-sm text-red-300">{{ error }}</p>
    <p v-if="!indexerReachable" class="mb-3 text-sm text-amber-300">{{ t('admin.libraries.indexerOffline') }}</p>

    <AdminSkeleton v-if="loading && libraries.length === 0" variant="cards" />
    <ul v-else class="flex flex-col gap-3">
      <li v-for="lib in libraries" :key="lib.id" class="rounded-lg border border-flixer-border bg-flixer-background/60 p-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
            <p class="text-sm font-semibold">
              {{ lib.name }} <StatusPill tone="accent" class="ml-2">{{ t(`admin.libraries.types.${lib.type}`) }}</StatusPill>
            </p>
            <div class="flex items-center gap-2">
              <button type="button" :disabled="!indexerReachable || scanningId === lib.id || isRunning(scans[lib.id])" class="rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-50" @click="scan(lib, false)">{{ t('admin.libraries.scan') }}</button>
              <button type="button" :disabled="!indexerReachable || scanningId === lib.id || isRunning(scans[lib.id])" class="rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15 disabled:opacity-50" @click="scan(lib, true)">{{ t('admin.libraries.rescan') }}</button>
              <button type="button" class="rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15" @click="openForm(lib)">{{ t('admin.libraries.manage') }}</button>
              <button type="button" :disabled="deletingId === lib.id" class="rounded bg-red-500/20 px-4 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/30 disabled:opacity-50" @click="remove(lib)">{{ t('admin.libraries.deleteLibrary') }}</button>
            </div>
          </div>
          <div v-if="scans[lib.id]" class="mt-3" role="status">
            <div class="flex items-center justify-between text-xs text-flixer-muted">
              <span :class="scans[lib.id].state === 'failed' ? 'text-red-300' : ''">{{ scanLabel(scans[lib.id]) }}<template v-if="scans[lib.id].failed > 0"> · {{ t('admin.libraries.scanFailedItems', { failed: scans[lib.id].failed }) }}</template></span>
              <span v-if="isRunning(scans[lib.id])">{{ scanPercent(scans[lib.id]) }}%</span>
            </div>
            <div v-if="isRunning(scans[lib.id])" class="mt-1 h-1.5 overflow-hidden rounded bg-white/10">
              <div class="h-full bg-flixer-primary transition-all" :style="{ width: `${scanPercent(scans[lib.id])}%` }"></div>
            </div>
          </div>
          <ul class="mt-3 grid gap-1">
            <li v-for="folder in lib.folders" :key="`${folder.rootId}/${folder.path}`" class="flex items-center gap-2 text-xs">
              <span class="truncate font-mono text-flixer-muted">{{ folder.location }}</span>
              <StatusPill v-if="!folder.available" tone="bad">{{ t('admin.libraries.unavailable') }}</StatusPill>
            </li>
          </ul>
        </li>
      <li v-if="!loading && libraries.length === 0 && !error" class="rounded-lg border border-dashed border-flixer-border p-6 text-center text-sm text-flixer-muted">{{ t('admin.libraries.empty') }}</li>
    </ul>
  </AdminSection>
  </div>
</template>
