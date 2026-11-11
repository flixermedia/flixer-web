<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { browseArtists, browseMedia, getPreferences, updatePreferences, type BrowseArtist, type BrowseKind, type BrowseSort, type HomeCard } from '../api'
import MediaCard from '../components/home/MediaCard.vue'
import AuthImage from '../components/ui/AuthImage.vue'
import CardGridSkeleton from '../components/ui/CardGridSkeleton.vue'
import PersonAvatar from '../components/ui/PersonAvatar.vue'
import Skeleton from '../components/ui/Skeleton.vue'
import MobileTabBar from '../components/home/MobileTabBar.vue'
import { getMobileTabs } from '../composables/homeNav'
import { notify } from '../composables/notify'
import { useInfiniteScroll } from '../composables/useInfiniteScroll'
import { describeRequestError } from '../composables/useProfile'
import { catchError } from '../utils/catchError'

const props = defineProps<{ kind: BrowseKind }>()

const SORTS: BrowseSort[] = ['added', 'title', 'year']
const BROWSE_COLUMN_OPTIONS = [2, 3, 4, 5, 6, 7, 8]

const { t } = useI18n()
const mobileTabs = computed(getMobileTabs)

const sort = ref<BrowseSort>('added')
const musicView = ref<'artists' | 'albums'>('artists')
const browseColumns = ref(0)
const items = ref<HomeCard[]>([])
const artists = ref<BrowseArtist[]>([])
const total = ref(0)
const isLoading = ref(false)
const failed = ref(false)

let controller: AbortController | undefined
let savedBrowseColumns = 0
let preferencesChanged = false
let preferenceSaveQueue = Promise.resolve()

const heading = computed(() => t(`browse.${props.kind}`))
const gridStyle = computed(() => (browseColumns.value ? { '--browse-columns': browseColumns.value } : undefined))
const showingArtists = computed(() => props.kind === 'music' && musicView.value === 'artists')
const itemCount = computed(() => showingArtists.value ? artists.value.length : items.value.length)
const hasMore = computed(() => itemCount.value < total.value)
const canLoadMore = computed(() => hasMore.value && !failed.value && !isLoading.value)
const { setSentinel, recheck } = useInfiniteScroll(() => void load(false), canLoadMore)

function subtitleOf(item: HomeCard) {
  return item.year ? String(item.year) : undefined
}

async function loadPreferences() {
  const [error, preferences] = await catchError(getPreferences())
  if (error) {
    notify.error(describeRequestError(error, t('browse.preferenceLoadError')))
    return
  }
  if (!preferencesChanged) {
    browseColumns.value = preferences.browseColumns ?? 0
    savedBrowseColumns = browseColumns.value
  }
}

function saveBrowseColumns() {
  preferencesChanged = true
  const requestedColumns = browseColumns.value
  preferenceSaveQueue = preferenceSaveQueue.then(async () => {
    const [error] = await catchError(updatePreferences({ browseColumns: requestedColumns || null }))
    if (error) {
      notify.error(describeRequestError(error, t('browse.preferenceSaveError')))
      if (browseColumns.value === requestedColumns) browseColumns.value = savedBrowseColumns
      return
    }
    savedBrowseColumns = requestedColumns
  })
}

async function load(reset: boolean) {
  controller?.abort()
  controller = new AbortController()
  const offset = reset ? 0 : itemCount.value
  isLoading.value = true
  failed.value = false
  if (reset) {
    items.value = []
    artists.value = []
    total.value = 0
  }
  const artistView = showingArtists.value
  const request: Promise<{ total: number; items: BrowseArtist[] | HomeCard[] }> = artistView
    ? browseArtists(sort.value, offset, controller.signal)
    : browseMedia(props.kind, sort.value, offset, controller.signal)
  const [error, page] = await catchError(request)
  if (error) {
    if ((error as { code?: string }).code === 'ERR_CANCELED') return
    failed.value = true
  } else {
    if (artistView) artists.value = reset ? page.items as BrowseArtist[] : [...artists.value, ...page.items as BrowseArtist[]]
    else items.value = reset ? page.items as HomeCard[] : [...items.value, ...page.items as HomeCard[]]
    total.value = page.total
  }
  isLoading.value = false
  // The observer only fires on changes, so look again in case the grid still doesn't fill the screen.
  recheck()
}

watch([() => props.kind, sort, musicView], () => void load(true))
onMounted(() => {
  void load(true)
  void loadPreferences()
})
onBeforeUnmount(() => controller?.abort())
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-flixer-background pb-24 font-sans text-flixer-text md:pb-12">

    <main class="page-gutter pt-28 sm:pt-32">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <h1 class="text-3xl font-bold text-white">{{ heading }}</h1>
        <div class="flex flex-wrap gap-3">
          <div v-if="kind === 'music'" class="flex rounded border border-flixer-border bg-flixer-surface p-0.5" role="group" :aria-label="t('browse.musicView')">
            <button v-for="view in (['artists', 'albums'] as const)" :key="view" type="button" class="rounded px-3 py-1.5 text-sm transition" :class="musicView === view ? 'bg-white/15 text-white' : 'text-flixer-muted hover:text-white'" :aria-pressed="musicView === view" @click="musicView = view">{{ t(`browse.${view}`) }}</button>
          </div>
          <label class="flex items-center gap-2 text-sm text-flixer-muted">
            {{ t('browse.sortBy') }}
            <select v-model="sort" class="rounded border border-flixer-border bg-flixer-surface px-3 py-2 text-sm text-white">
              <option v-for="option in SORTS" :key="option" :value="option">{{ t(`browse.sort.${option}`) }}</option>
            </select>
          </label>
          <label class="flex items-center gap-2 text-sm text-flixer-muted">
            {{ t('browse.columns') }}
            <select v-model.number="browseColumns" class="rounded border border-flixer-border bg-flixer-surface px-3 py-2 text-sm text-white" @change="saveBrowseColumns">
              <option :value="0">{{ t('browse.columnsAuto') }}</option>
              <option v-for="columns in BROWSE_COLUMN_OPTIONS" :key="columns" :value="columns">{{ t('browse.columnOption', { count: columns }) }}</option>
            </select>
          </label>
        </div>
      </div>

      <div class="mt-6" aria-live="polite">
        <p v-if="failed" class="text-sm text-red-400" role="alert">{{ t('browse.error') }}</p>
        <CardGridSkeleton v-else-if="isLoading && itemCount === 0" :square="kind === 'music'" />
        <p v-else-if="itemCount === 0" class="text-sm text-flixer-muted">{{ t('browse.empty') }}</p>

        <ul v-else :style="gridStyle" :class="['grid gap-x-4 gap-y-6', browseColumns ? 'browse-grid-preferred' : 'grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]']">
          <template v-if="showingArtists">
            <li v-for="artist in artists" :key="artist.id" class="min-w-0">
              <RouterLink :to="{ name: 'person', params: { id: artist.id } }" class="group block rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent">
                <PersonAvatar :person-id="artist.id" :name="artist.name" :has-image="true" :width="200" class="aspect-square rounded border border-flixer-border transition group-hover:border-white/30">
                  <div v-if="artist.covers.length" class="grid size-full" :class="artist.covers.length === 1 ? 'grid-cols-1' : 'grid-cols-2 grid-rows-2'">
                    <AuthImage v-for="tile in artist.covers.length === 1 ? 1 : 4" :key="tile" scope="library" :item-id="artist.covers[(tile - 1) % artist.covers.length]!.itemId" :index="artist.covers[(tile - 1) % artist.covers.length]!.index" :version="artist.covers[(tile - 1) % artist.covers.length]!.version" :width="artist.covers.length === 1 ? 200 : 100" alt="" />
                  </div>
                  <span v-else class="grid size-full place-items-center p-3 text-center text-sm font-medium text-flixer-muted">{{ artist.name }}</span>
                </PersonAvatar>
                <div class="mt-2 px-0.5"><p class="truncate text-sm font-medium text-flixer-text">{{ artist.name }}</p><p class="truncate text-xs text-flixer-muted">{{ t('browse.albumCount', { count: artist.albumCount }, artist.albumCount) }}</p></div>
              </RouterLink>
            </li>
          </template>
          <template v-else><MediaCard v-for="item in items" :key="item.id" class="!w-auto" :variant="kind === 'music' ? 'square' : 'poster'" :title="item.title" :subtitle="subtitleOf(item)" :item-id="item.id" :image-index="item.poster ?? item.backdrop" :version="item.updatedAt" :locked="item.locked" /></template>
          <li v-for="n in isLoading ? 6 : 0" :key="`more-${n}`" aria-hidden="true">
            <Skeleton :class="kind === 'music' ? 'aspect-square' : 'aspect-[2/3]'" class="w-full rounded" />
          </li>
        </ul>

        <div v-if="hasMore && !failed" :ref="setSentinel" class="h-px" aria-hidden="true"></div>
      </div>
    </main>

    <MobileTabBar :tabs="mobileTabs" />
  </div>
</template>

<style scoped>
.browse-grid-preferred {
  grid-template-columns: repeat(auto-fill, minmax(max(9rem, calc((100% - (var(--browse-columns) - 1) * 1rem) / var(--browse-columns))), 1fr));
}

@media (min-width: 640px) {
  .browse-grid-preferred {
    grid-template-columns: repeat(auto-fill, minmax(max(11rem, calc((100% - (var(--browse-columns) - 1) * 1rem) / var(--browse-columns))), 1fr));
  }
}
</style>
