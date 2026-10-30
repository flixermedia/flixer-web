<script setup lang="ts">
import { openModal } from '@kolirt/vue-modal'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import Skeleton from '../ui/Skeleton.vue'
import { deleteMediaItem, getMediaItem, listMediaItems, listMediaLibraries, MEDIA_ITEM_TYPES, rebuildMediaSearchIndex, refreshMediaItem, type MediaItemCategory, type MediaItemPage, type MediaItemSummary, type MediaItemType, type MediaLibrary } from '../../api'
import { confirmAction } from '../../composables/confirm'
import { notify } from '../../composables/notify'
import { useInfiniteScroll } from '../../composables/useInfiniteScroll'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
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
const albumPosters = ref<Record<string, number | null>>({})
const seriesPosters = ref<Record<string, { itemId: string; index: number } | null>>({})
const result = ref<MediaItemPage & { categoryCounts: Record<MediaItemCategory, number> }>({
  items: [],
  total: 0,
  page: 1,
  size: PAGE_SIZE,
  categoryCounts: { movies: 0, tvShows: 0, music: 0 },
})
const loading = ref(true)
const error = ref('')

function queryText(key: string): string {
  const value = route.query[key]
  return typeof value === 'string' ? value : ''
}

// The browsing position lives in the URL, so a refresh or a shared link returns to the same place.
const libraryId = ref(queryText('mlib'))
const CATEGORY_TYPES: MediaItemCategory[] = ['movies', 'tvShows', 'music']
function mediaTypeFilter(value: string): MediaItemType | MediaItemCategory | '' {
  if (CATEGORY_TYPES.includes(value as MediaItemCategory)) return value as MediaItemCategory
  return MEDIA_ITEM_TYPES.includes(value as MediaItemType) ? value as MediaItemType : ''
}
const type = ref<MediaItemType | MediaItemCategory | ''>(mediaTypeFilter(queryText('mtype')))
const search = ref(queryText('mq'))
const page = ref(1)
const parent = ref<{ id: string; title: string } | null>(queryText('mparent') ? { id: queryText('mparent'), title: queryText('mparentTitle') } : null)
const deletingId = ref<string | null>(null)
const rebuildingSearchIndex = ref(false)
const failedReset = ref(true)
let searchTimer: ReturnType<typeof setTimeout> | undefined
let requestId = 0
let pushNextQuery = false

const hasMore = computed(() => result.value.items.length < result.value.total)
const hasFilters = computed(() => Boolean(libraryId.value || type.value || search.value.trim() || parent.value))
const canLoadMore = computed(() => hasMore.value && hasFilters.value && !loading.value && !error.value)
const inputClass = 'rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm text-flixer-text'

const groups = computed(() => {
  const grouped: Array<{ id: MediaItemCategory; title: string; items: MediaItemSummary[] }> = [
    { id: 'movies', title: t('admin.media.groups.movies'), items: [] as MediaItemSummary[] },
    { id: 'tvShows', title: t('admin.media.groups.tvShows'), items: [] as MediaItemSummary[] },
    { id: 'music', title: t('admin.media.groups.music'), items: [] as MediaItemSummary[] },
  ]

  for (const item of result.value.items) {
    if (item.type === 'movie' || item.type === 'video') grouped[0].items.push(item)
    else if (item.type === 'series' || item.type === 'season' || item.type === 'episode') grouped[1].items.push(item)
    else if (item.type === 'album' || item.type === 'track') grouped[2].items.push(item)
  }

  return grouped.filter((group) => group.items.length > 0)
})

function posterSource(item: MediaItemSummary) {
  if (item.poster !== null) return { itemId: item.id, index: item.poster }
  const albumPoster = item.parentId ? albumPosters.value[item.parentId] : undefined
  if (item.type === 'track' && item.parentId && albumPoster !== null && albumPoster !== undefined) {
    return { itemId: item.parentId, index: albumPoster }
  }
  const seriesPoster = seriesPosters.value[item.id]
  return item.type === 'episode' && seriesPoster !== null && seriesPoster !== undefined
    ? { itemId: seriesPoster.itemId, index: seriesPoster.index }
    : null
}

async function loadRelatedPosters(items: MediaItemSummary[], current: number, reset: boolean) {
  const parentIds = [...new Set(items.flatMap((item) => item.type === 'track' && item.poster === null && item.parentId ? [item.parentId] : []))]
  const episodeIds = items.filter((item) => item.type === 'episode' && item.poster === null).map((item) => item.id)
  const albumCache = reset ? {} : albumPosters.value
  const seriesCache = reset ? {} : seriesPosters.value
  const missingAlbums = parentIds.filter((id) => !Object.hasOwn(albumCache, id))
  const missingEpisodes = episodeIds.filter((id) => !Object.hasOwn(seriesCache, id))
  const seriesLookups = new Map<string, Promise<{ error: Error | null; artwork: { itemId: string; index: number } | null }>>()
  function findSeriesArtwork(id: string, ancestors = new Set<string>()): Promise<{ error: Error | null; artwork: { itemId: string; index: number } | null }> {
    if (ancestors.has(id)) return Promise.resolve({ error: null, artwork: null })
    const cached = seriesLookups.get(id)
    if (cached) return cached
    const nextAncestors = new Set(ancestors).add(id)
    const lookup = (async () => {
      const [error, ancestor] = await catchError(getMediaItem(id))
      if (error) return { error, artwork: null }
      if (ancestor.type === 'series') {
        const poster = ancestor.images.find((image) => image.type === 'poster' && image.available)
        return { error: null, artwork: poster ? { itemId: ancestor.id, index: poster.index } : null }
      }
      return ancestor.parent ? findSeriesArtwork(ancestor.parent.id, nextAncestors) : { error: null, artwork: null }
    })()
    seriesLookups.set(id, lookup)
    return lookup
  }
  const [albumLookups, episodeLookups] = await Promise.all([
    Promise.all(missingAlbums.map(async (id) => {
      const [error, album] = await catchError(getMediaItem(id))
      if (error) return { id, error, index: null }
      const poster = album.type === 'album' ? album.images.find((image) => image.type === 'poster' && image.available) : undefined
      return { id, error: null, index: poster?.index ?? null }
    })),
    Promise.all(missingEpisodes.map(async (id) => {
      const summary = items.find((item) => item.id === id)
      if (!summary?.parentId) return { id, error: null, artwork: null }
      const { error, artwork } = await findSeriesArtwork(summary.parentId)
      return { id, error, artwork }
    })),
  ])

  if (current !== requestId) return
  const nextAlbumPosters = reset ? {} : { ...albumPosters.value }
  for (const { id, index } of albumLookups) nextAlbumPosters[id] = index
  albumPosters.value = nextAlbumPosters

  const nextSeriesPosters = reset ? {} : { ...seriesPosters.value }
  for (const { id, artwork } of episodeLookups) nextSeriesPosters[id] = artwork
  seriesPosters.value = nextSeriesPosters

  const failure = [...albumLookups, ...episodeLookups].find((lookup) => lookup.error)?.error
  if (failure) notify.error(describeRequestError(failure, t('admin.media.posterLoadError')))
}

async function load(reset = true) {
  if (!reset && loading.value) return
  const current = ++requestId
  const nextPage = reset ? 1 : page.value + 1
  failedReset.value = reset
  loading.value = true
  error.value = ''
  try {
    const [requestError, data] = await catchError(listMediaItems({
      libraryId: libraryId.value || undefined,
      type: type.value || undefined,
      parentId: parent.value?.id,
      search: search.value.trim() || undefined,
      page: nextPage,
      size: PAGE_SIZE,
    }))
    if (requestError) {
      if (current === requestId) error.value = describeRequestError(requestError, t('admin.media.loadError'))
    } else if (current === requestId) {
      // Ignore a slow response that a newer filter has already replaced.
      await loadRelatedPosters(data.items, current, reset)
      if (current !== requestId) return
      result.value = reset ? data : { ...data, items: [...result.value.items, ...data.items] }
      page.value = nextPage
    }
  } finally {
    if (current === requestId) {
      loading.value = false
      recheck()
    }
  }
}

const { setSentinel, recheck } = useInfiniteScroll(() => void load(false), canLoadMore)

function openChildren(item: MediaItemSummary) {
  pushNextQuery = true
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
  const [error, refresh] = await catchError(refreshMediaItem(item.id))
  if (error) {
    notify.error(describeRequestError(error, t('admin.media.rescanError')))
  } else {
    notify.success(t(refresh.alreadyQueued ? 'admin.media.rescanAlreadyQueued' : 'admin.media.rescanQueued'))
  }
}

async function remove(item: MediaItemSummary) {
  if (!(await confirmAction(t('admin.media.confirmDelete', { title: item.title }), { danger: true }))) return
  deletingId.value = item.id
  try {
    const [error] = await catchError(deleteMediaItem(item.id))
    if (error) {
      notify.error(describeRequestError(error, t('admin.media.deleteError')))
    } else {
      notify.success(t('admin.media.deleted'))
    }
  } finally {
    deletingId.value = null
    await load()
  }
}

async function rebuildSearchIndex() {
  if (!(await confirmAction(t('admin.media.confirmSearchRebuild')))) return
  rebuildingSearchIndex.value = true
  const [error, result] = await catchError(rebuildMediaSearchIndex())
  rebuildingSearchIndex.value = false
  if (error) {
    notify.error(describeRequestError(error, t('admin.media.searchRebuildError')))
  } else {
    notify.success(t(result.queued ? 'admin.media.searchRebuildQueued' : 'admin.media.searchRebuildAlreadyQueued'))
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

watch(
  () => [queryText('mlib'), queryText('mtype'), queryText('mq'), queryText('mparent'), queryText('mparentTitle')] as const,
  ([nextLibraryId, nextType, nextSearch, nextParentId, nextParentTitle]) => {
    libraryId.value = nextLibraryId
    type.value = mediaTypeFilter(nextType)
    search.value = nextSearch
    parent.value = nextParentId ? { id: nextParentId, title: nextParentTitle } : null
  },
)

function syncQuery() {
  const query = { ...route.query }
  const state: Record<string, string | undefined> = {
    mlib: libraryId.value || undefined,
    mtype: type.value || undefined,
    mq: search.value.trim() || undefined,
    mparent: parent.value?.id,
    mparentTitle: parent.value?.title,
  }
  for (const [key, value] of Object.entries(state)) {
    if (value === undefined) delete query[key]
    else query[key] = value
  }
  if (JSON.stringify(query) !== JSON.stringify(route.query)) {
    if (pushNextQuery) {
      pushNextQuery = false
      void router.push({ query })
    } else {
      void router.replace({ query })
    }
  }
}

watch([libraryId, type, search, parent], syncQuery)

onMounted(async () => {
  syncQuery()
  void load(true)
  const [error, result] = await catchError(listMediaLibraries())
  if (!error) libraries.value = result
})
</script>

<template>
  <AdminSection :title="t('admin.media.title')" :description="t('admin.media.description')">
    <template #actions>
      <button type="button" :disabled="rebuildingSearchIndex" class="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold transition hover:bg-white/15 disabled:opacity-50" @click="rebuildSearchIndex">
        {{ t(rebuildingSearchIndex ? 'admin.media.searchRebuilding' : 'admin.media.searchRebuild') }}
      </button>
    </template>
    <div class="flex flex-wrap items-end gap-3">
      <label class="flex min-w-48 flex-1 flex-col gap-1 text-xs text-flixer-muted">
        {{ t('admin.media.search') }}
        <span class="relative">
          <input v-model="search" type="search" :class="`${inputClass} w-full !pr-28`" />
          <span aria-live="polite" class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded bg-white/10 px-2 py-0.5 text-[11px] text-flixer-muted">
            {{ t('admin.media.total', { count: result.total }) }}
          </span>
        </span>
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
          <option value="movies">{{ t('admin.media.groups.movies') }}</option>
          <option value="tvShows">{{ t('admin.media.groups.tvShows') }}</option>
          <option value="music">{{ t('admin.media.groups.music') }}</option>
          <option v-for="option in MEDIA_ITEM_TYPES" :key="option" :value="option">{{ t(`admin.media.types.${option}`) }}</option>
        </select>
      </label>
    </div>

    <p v-if="parent" class="mt-4 flex items-center gap-3 text-sm">
      <span class="text-flixer-muted">{{ t('admin.media.showingChildren', { title: parent.title }) }}</span>
      <button type="button" class="text-xs text-flixer-accent hover:underline" @click="parent = null">{{ t('admin.media.clearParent') }}</button>
    </p>
  </AdminSection>

  <div class="mx-5 flex flex-col gap-10">
    <p v-if="error" role="alert" class="flex flex-wrap items-center gap-3 text-sm text-red-300">
      {{ error }}
      <button type="button" class="rounded bg-white/10 px-3 py-1 text-xs font-semibold text-flixer-text transition hover:bg-white/15" @click="load(failedReset)">{{ t('admin.media.retry') }}</button>
    </p>

    <div v-if="loading && result.items.length === 0" class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      <div v-for="n in 6" :key="`skeleton-${n}`" class="overflow-hidden rounded-xl border border-flixer-border bg-flixer-background/60" role="status" :aria-label="t('common.loading')" aria-busy="true">
        <Skeleton class="aspect-[2/3] w-full" />
        <div class="space-y-3 p-3">
          <Skeleton class="h-4 w-4/5" />
          <Skeleton class="h-3 w-2/5" />
          <div class="grid grid-cols-2 gap-2">
            <Skeleton class="h-7 rounded" />
            <Skeleton class="h-7 rounded" />
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="result.items.length > 0" :class="loading ? 'opacity-60' : ''" class="flex flex-col gap-10 transition-opacity duration-200" :aria-busy="loading">
      <section v-for="group in groups" :key="group.id" class="space-y-3">
        <div class="flex items-center gap-3 border-b border-flixer-border pb-2">
          <h2 class="text-lg font-semibold tracking-tight">
            <button type="button" class="flex items-center gap-3 rounded-sm text-left transition hover:text-flixer-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" :aria-pressed="type === group.id" @click="type = type === group.id ? '' : group.id">
              {{ group.title }}
              <span class="text-xs text-flixer-muted">{{ result.categoryCounts[group.id] }}</span>
            </button>
          </h2>
        </div>
        <TransitionGroup tag="div" name="media-result" appear class="relative grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          <article v-for="(item, index) in group.items" :key="item.id" :style="{ '--i': Math.min(index, 14) }" class="flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-flixer-border bg-flixer-background/60 transition-colors hover:border-flixer-accent/40 hover:bg-flixer-background">
            <div class="relative overflow-hidden bg-white/5" :class="item.type === 'album' ? 'aspect-square' : 'aspect-[2/3]'">
              <AuthImage v-if="posterSource(item)" :item-id="posterSource(item)?.itemId ?? item.id" :index="posterSource(item)?.index ?? 0" :width="300" :alt="item.title" :version="item.updatedAt" />
              <span v-else class="flex size-full items-center justify-center px-2 text-center text-xs text-flixer-muted">{{ t('admin.media.noPoster') }}</span>
              <StatusPill tone="accent" class="absolute right-2 top-2 !bg-flixer-primary/90 !px-2 !py-0.5 !text-white shadow">{{ t(`admin.media.types.${item.type}`) }}</StatusPill>
              <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent px-3 pb-3 pt-12 text-white">
                <h3 class="truncate text-sm font-semibold" :title="item.title">
                  {{ item.title }}<span v-if="item.year" class="ml-1 font-normal text-white/70">({{ item.year }})</span>
                </h3>
                <p v-if="subtitle(item) || item.edited || Object.keys(item.providerIds).length === 0" class="mt-1 flex min-h-5 flex-wrap items-center gap-1.5 text-xs text-white/75">
                  <span v-if="subtitle(item)">{{ subtitle(item) }}</span>
                  <StatusPill v-if="item.edited" tone="neutral">{{ t('admin.media.edited') }}</StatusPill>
                  <StatusPill v-if="Object.keys(item.providerIds).length === 0" tone="warn">{{ t('admin.media.unidentified') }}</StatusPill>
                </p>
                <p v-if="item.parentTitle" class="mt-1 truncate text-xs text-white/70" :title="item.parentTitle">
                  {{ item.parentTitle }}
                </p>
                <p class="mt-1 truncate font-mono text-[10px] text-white/60" :title="item.path">{{ item.path }}</p>
              </div>
            </div>

            <div class="flex items-center justify-center gap-1 p-1.5">
              <button v-if="CONTAINER_TYPES.includes(item.type)" type="button" :aria-label="t('admin.media.browseChildren')" :title="t('admin.media.browseChildren')" class="flex h-8 min-w-0 flex-1 items-center justify-center rounded bg-white/10 text-flixer-text transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" @click="openChildren(item)">
                <Icon icon="lucide:folder-open" class="size-4" aria-hidden="true" />
              </button>
              <button type="button" :aria-label="t('admin.media.edit')" :title="t('admin.media.edit')" class="flex h-8 min-w-0 flex-1 items-center justify-center rounded bg-white/10 text-flixer-text transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" @click="edit(item)">
                <Icon icon="lucide:pencil" class="size-4" aria-hidden="true" />
              </button>
              <button type="button" :aria-label="t('admin.media.rescan')" :title="t('admin.media.rescan')" class="flex h-8 min-w-0 flex-1 items-center justify-center rounded bg-white/10 text-flixer-text transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" @click="rescan(item)">
                <Icon icon="lucide:refresh-cw" class="size-4" aria-hidden="true" />
              </button>
              <button type="button" :disabled="deletingId === item.id" :aria-label="t('admin.media.delete')" :title="t('admin.media.delete')" class="flex h-8 min-w-0 flex-1 items-center justify-center rounded bg-red-500/20 text-red-200 transition hover:bg-red-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent disabled:opacity-50" @click="remove(item)">
                <Icon icon="lucide:trash-2" class="size-4" aria-hidden="true" />
              </button>
            </div>
          </article>
        </TransitionGroup>
      </section>
    </div>

    <p v-else-if="!error" class="rounded-xl border border-dashed border-flixer-border p-8 text-center text-sm text-flixer-muted">
      {{ hasFilters ? t('admin.media.noResults') : t('admin.media.empty') }}
    </p>

    <div v-if="hasMore && hasFilters" :ref="setSentinel" class="flex min-h-10 items-center justify-center" aria-live="polite">
      <span v-if="loading" role="status" class="flex items-center gap-2 text-xs text-flixer-muted">
        <Icon icon="lucide:loader-circle" class="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        {{ t('common.loading') }}
      </span>
    </div>
  </div>
</template>

<style scoped>
@keyframes media-result-rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.media-result-enter-active,
.media-result-appear-active {
  animation: media-result-rise 0.45s ease-out both;
  animation-delay: calc(var(--i, 0) * 35ms);
}

.media-result-leave-active {
  position: absolute;
  transition: opacity 0.2s ease;
}

.media-result-leave-to {
  opacity: 0;
}

.media-result-move {
  transition: transform 0.35s ease;
}

@media (prefers-reduced-motion: reduce) {
  .media-result-enter-active,
  .media-result-appear-active,
  .media-result-move {
    animation: none;
    transition: none;
  }
}
</style>
