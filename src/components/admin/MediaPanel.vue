<script setup lang="ts">
import { openModal } from '@kolirt/vue-modal'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import Skeleton from '../ui/Skeleton.vue'
import { deleteMediaItem, listMediaItems, listMediaLibraries, MEDIA_ITEM_TYPES, refreshMediaItem, type MediaItemPage, type MediaItemSummary, type MediaItemType, type MediaLibrary } from '../../api'
import { confirmAction } from '../../composables/confirm'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import AdminSection from './AdminSection.vue'
import AuthImage from '../ui/AuthImage.vue'
import MediaItemModal from './MediaItemModal.vue'
import StatusPill from './StatusPill.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const PAGE_SIZE = 25
const SEARCH_DEBOUNCE_MS = 300
const CONTAINER_TYPES: MediaItemType[] = ['series', 'season', 'album']

const libraries = ref<MediaLibrary[]>([])
const result = ref<MediaItemPage>({ items: [], total: 0, page: 1, size: PAGE_SIZE })
const loading = ref(true)
const error = ref('')

function queryText(key: string): string {
  const value = route.query[key]
  return typeof value === 'string' ? value : ''
}

// The browsing position lives in the URL, so a refresh or a shared link returns to the same place.
const libraryId = ref(queryText('mlib'))
const type = ref<MediaItemType | ''>(MEDIA_ITEM_TYPES.includes(queryText('mtype') as MediaItemType) ? (queryText('mtype') as MediaItemType) : '')
const search = ref(queryText('mq'))
const page = ref(Math.max(1, Number.parseInt(queryText('mpage'), 10) || 1))
const parent = ref<{ id: string; title: string } | null>(queryText('mparent') ? { id: queryText('mparent'), title: queryText('mparentTitle') } : null)
const deletingId = ref<string | null>(null)
let searchTimer: ReturnType<typeof setTimeout> | undefined
let requestId = 0

const pages = computed(() => Math.max(1, Math.ceil(result.value.total / PAGE_SIZE)))
const hasFilters = computed(() => Boolean(libraryId.value || type.value || search.value.trim() || parent.value))
const inputClass = 'rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm text-flixer-text'

function libraryName(id: string) {
  return libraries.value.find((library) => library.id === id)?.name ?? ''
}

async function load() {
  const current = ++requestId
  loading.value = true
  try {
    const data = await listMediaItems({
      libraryId: libraryId.value || undefined,
      type: type.value || undefined,
      parentId: parent.value?.id,
      search: search.value.trim() || undefined,
      page: page.value,
      size: PAGE_SIZE,
    })
    // Ignore a slow response that a newer filter has already replaced.
    if (current !== requestId) return
    result.value = data
    error.value = ''
  } catch (err: unknown) {
    if (current !== requestId) return
    error.value = describeRequestError(err, t('admin.media.loadError'))
  } finally {
    if (current === requestId) loading.value = false
  }
}

function openChildren(item: MediaItemSummary) {
  parent.value = { id: item.id, title: item.title }
  type.value = ''
  search.value = ''
  page.value = 1
}

async function edit(item: MediaItemSummary) {
  const refresh = await openModal<boolean>(MediaItemModal, { props: { itemId: item.id } }).catch(() => false)
  if (refresh) await load()
}

async function rescan(item: MediaItemSummary) {
  if (CONTAINER_TYPES.includes(item.type) && !(await confirmAction(t('admin.media.confirmRescan', { title: item.title })))) return
  try {
    const result = await refreshMediaItem(item.id)
    notify.success(t(result.alreadyQueued ? 'admin.media.rescanAlreadyQueued' : 'admin.media.rescanQueued'))
  } catch (err: unknown) {
    notify.error(describeRequestError(err, t('admin.media.rescanError')))
  }
}

async function remove(item: MediaItemSummary) {
  if (!(await confirmAction(t('admin.media.confirmDelete', { title: item.title }), { danger: true }))) return
  deletingId.value = item.id
  try {
    await deleteMediaItem(item.id)
    notify.success(t('admin.media.deleted'))
  } catch (err: unknown) {
    notify.error(describeRequestError(err, t('admin.media.deleteError')))
  } finally {
    deletingId.value = null
    await load()
  }
}

function subtitle(item: MediaItemSummary) {
  const parts: string[] = []
  if (item.seasonNumber !== null && item.type !== 'series') parts.push(`S${item.seasonNumber}`)
  if (item.episodeNumber !== null) parts.push(`E${item.episodeNumber}`)
  return parts.join(' ')
}

watch([libraryId, type], () => {
  page.value = 1
  void load()
})
watch(parent, () => void load())
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    void load()
  }, SEARCH_DEBOUNCE_MS)
})

function syncQuery() {
  const query = { ...route.query }
  const state: Record<string, string | undefined> = {
    mlib: libraryId.value || undefined,
    mtype: type.value || undefined,
    mq: search.value.trim() || undefined,
    mpage: page.value > 1 ? String(page.value) : undefined,
    mparent: parent.value?.id,
    mparentTitle: parent.value?.title,
  }
  for (const [key, value] of Object.entries(state)) {
    if (value === undefined) delete query[key]
    else query[key] = value
  }
  if (JSON.stringify(query) !== JSON.stringify(route.query)) void router.replace({ query })
}

watch([libraryId, type, search, page, parent], syncQuery)

onMounted(async () => {
  void load()
  try {
    libraries.value = await listMediaLibraries()
  } catch {
    // The library filter just stays empty; the item list still works.
  }
})
</script>

<template>
  <AdminSection :title="t('admin.media.title')" :description="t('admin.media.description')">
    <div class="mb-4 flex flex-wrap items-end gap-3">
      <label class="flex min-w-48 flex-1 flex-col gap-1 text-xs text-flixer-muted">
        {{ t('admin.media.search') }}
        <input v-model="search" type="search" :class="inputClass" />
      </label>
      <label class="flex flex-col gap-1 text-xs text-flixer-muted">
        {{ t('admin.media.libraryFilter') }}
        <select v-model="libraryId" :class="inputClass">
          <option value="">{{ t('admin.media.allLibraries') }}</option>
          <option v-for="library in libraries" :key="library.id" :value="library.id">{{ library.name }}</option>
        </select>
      </label>
      <label class="flex flex-col gap-1 text-xs text-flixer-muted">
        {{ t('admin.media.typeFilter') }}
        <select v-model="type" :class="inputClass">
          <option value="">{{ t('admin.media.allTypes') }}</option>
          <option v-for="option in MEDIA_ITEM_TYPES" :key="option" :value="option">{{ t(`admin.media.types.${option}`) }}</option>
        </select>
      </label>
    </div>

    <p v-if="parent" class="mb-3 flex items-center gap-3 text-sm">
      <span class="text-flixer-muted">{{ t('admin.media.showingChildren', { title: parent.title }) }}</span>
      <button type="button" class="text-xs text-flixer-accent hover:underline" @click="parent = null">{{ t('admin.media.clearParent') }}</button>
    </p>

    <p v-if="error" role="alert" class="mb-3 text-sm text-red-300">{{ error }}</p>

    <ul class="flex flex-col gap-2">
      <li v-for="item in loading ? [] : result.items" :key="item.id" class="relative rounded-lg border border-flixer-border bg-flixer-background/60 p-3">
        <StatusPill v-if="Object.keys(item.providerIds).length === 0" tone="warn" class="absolute right-3 top-2 !px-2 !py-0.5">{{ t('admin.media.unidentified') }}</StatusPill>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex min-w-0 items-stretch gap-3">
            <div class="min-h-24 w-20 shrink-0 overflow-hidden rounded bg-white/5">
              <AuthImage v-if="item.poster !== null" :item-id="item.id" :index="item.poster" :width="240" :alt="item.title" :version="item.updatedAt" />
            </div>
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold">
                {{ item.title }}<span v-if="item.year" class="ml-1 font-normal text-flixer-muted">({{ item.year }})</span>
                <span v-if="subtitle(item)" class="ml-2 text-xs font-normal text-flixer-muted">{{ subtitle(item) }}</span>
              </p>
              <p class="mt-1 flex flex-wrap items-center gap-2 text-xs text-flixer-muted">
                <StatusPill tone="accent">{{ t(`admin.media.types.${item.type}`) }}</StatusPill>
                <span v-if="item.parentTitle">{{ item.parentTitle }}</span>
                <span v-if="!libraryId && libraryName(item.libraryId)">· {{ libraryName(item.libraryId) }}</span>
                <StatusPill v-if="item.edited" tone="neutral">{{ t('admin.media.edited') }}</StatusPill>
              </p>
              <div class="mt-2 flex flex-wrap items-center gap-2">
                <button v-if="CONTAINER_TYPES.includes(item.type)" type="button" class="rounded bg-white/10 px-3 py-1 text-xs font-semibold transition hover:bg-white/15" @click="openChildren(item)">{{ t('admin.media.browseChildren') }}</button>
                <button type="button" class="rounded bg-white/10 px-3 py-1 text-xs font-semibold transition hover:bg-white/15" @click="edit(item)">{{ t('admin.media.edit') }}</button>
                <button type="button" class="rounded bg-white/10 px-3 py-1 text-xs font-semibold transition hover:bg-white/15" @click="rescan(item)">{{ t('admin.media.rescan') }}</button>
                <button type="button" :disabled="deletingId === item.id" class="rounded bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-200 transition hover:bg-red-500/30 disabled:opacity-50" @click="remove(item)">{{ t('admin.media.delete') }}</button>
              </div>
              <p class="mt-2 truncate font-mono text-xs text-flixer-muted">{{ item.path }}</p>
            </div>
          </div>
        </div>
      </li>
      <template v-if="loading">
        <li v-for="n in 5" :key="`skeleton-${n}`" class="rounded-lg border border-flixer-border bg-flixer-background/60 p-3" role="status" :aria-label="t('common.loading')" aria-busy="true">
          <div class="flex items-stretch gap-3">
            <Skeleton class="min-h-24 w-20 shrink-0 rounded" />
            <div class="min-w-0 flex-1">
              <Skeleton class="h-4 w-1/3" />
              <div class="mt-2 flex items-center gap-2">
                <Skeleton class="h-6 w-16 rounded" />
                <Skeleton class="h-3 w-24" />
              </div>
              <div class="mt-2 flex items-center gap-2">
                <Skeleton class="h-6 w-14 rounded" />
                <Skeleton class="h-6 w-16 rounded" />
              </div>
              <Skeleton class="mt-2 h-3 w-3/5" />
            </div>
          </div>
        </li>
      </template>
      <li v-if="!loading && result.items.length === 0 && !error" class="rounded-lg border border-dashed border-flixer-border p-6 text-center text-sm text-flixer-muted">{{ hasFilters ? t('admin.media.noResults') : t('admin.media.empty') }}</li>
    </ul>

    <div v-if="result.total > 0" class="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-flixer-muted">
      <span>{{ t('admin.media.total', { count: result.total }) }}</span>
      <div class="flex items-center gap-3">
        <button type="button" :disabled="page <= 1 || loading" class="rounded bg-white/10 px-3 py-1 font-semibold text-flixer-text transition hover:bg-white/15 disabled:opacity-50" @click="(page--, load())">{{ t('admin.media.previous') }}</button>
        <span>{{ t('admin.media.pageOf', { page, pages }) }}</span>
        <button type="button" :disabled="page >= pages || loading" class="rounded bg-white/10 px-3 py-1 font-semibold text-flixer-text transition hover:bg-white/15 disabled:opacity-50" @click="(page++, load())">{{ t('admin.media.next') }}</button>
      </div>
    </div>
  </AdminSection>
</template>
