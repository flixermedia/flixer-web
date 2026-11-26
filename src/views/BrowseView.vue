<script setup lang="ts">
import { Button } from '@ui-sdk/vue/button'
import { Checkbox, CheckboxIndicator } from '@ui-sdk/vue/checkbox'
import { Input } from '@ui-sdk/vue/input'
import { Select, SelectContent, SelectItem, SelectItemIndicator, SelectLabel, SelectTrigger, SelectValue } from '@ui-sdk/vue/select'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { browseArtists, browseMedia, getPreferences, getSearchGenres, updatePreferences, type BrowseArtist, type BrowseKind, type BrowseSort, type HomeCard, type SearchFilters } from '../api'
import MediaCard from '../components/home/MediaCard.vue'
import HeroCarousel from '../components/home/HeroCarousel.vue'
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
import { isTvMode } from '../platform/tvMode'

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
const isLoading = ref(true)
const failed = ref(false)
const filtersOpen = ref(false)
const genres = ref<string[]>([])
const genre = ref('')
const yearFrom = ref('')
const yearTo = ref('')
const cast = ref('')
const studio = ref('')
const runtimeFrom = ref('')
const runtimeTo = ref('')
const hdr = ref('')
const resolution = ref('')
const audioLanguage = ref('')
const unwatched = ref(false)
const number = (value: string) => value.trim() && Number.isFinite(Number(value)) ? Number(value) : undefined
const filters = computed<SearchFilters>(() => ({
  genre: genre.value || undefined,
  yearFrom: number(yearFrom.value),
  yearTo: number(yearTo.value),
  cast: cast.value.trim() || undefined,
  studio: studio.value.trim() || undefined,
  runtimeFrom: number(runtimeFrom.value),
  runtimeTo: number(runtimeTo.value),
  hdr: hdr.value || undefined,
  resolution: number(resolution.value),
  audioLanguage: audioLanguage.value.trim() || undefined,
  unwatched: unwatched.value ? 'true' : undefined,
}))
const filterCount = computed(() => Object.values(filters.value).filter((value) => value !== undefined).length)
let filterTimer: ReturnType<typeof setTimeout> | undefined

let controller: AbortController | undefined
let savedBrowseColumns = 0
let preferencesChanged = false
let preferenceSaveQueue = Promise.resolve()

const heading = computed(() => t(`browse.${props.kind}`))
const gridStyle = computed(() => (browseColumns.value ? { '--browse-columns': browseColumns.value } : undefined))
const showingArtists = computed(() => props.kind === 'music' && musicView.value === 'artists')
const carouselItems = computed(() => {
  if (showingArtists.value) {
    return artists.value.slice(0, 5).filter((artist) => artist.covers.length > 0).map((artist) => {
      const cover = artist.covers[0]!
      return {
        id: artist.id,
        title: artist.name,
        updatedAt: cover.version,
        label: t('browse.music'),
        detail: t('browse.albumCount', { count: artist.albumCount }, artist.albumCount),
        imageItemId: cover.itemId,
        imageIndex: cover.index,
        squareArtwork: true,
        to: { name: 'person', params: { id: artist.id } },
      }
    })
  }
  return items.value.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.title,
    updatedAt: item.updatedAt,
    type: item.type,
    year: item.year,
    imageIndex: props.kind === 'music' ? (item.poster ?? item.backdrop) : (item.backdrop ?? item.poster),
    logo: item.logo,
    squareArtwork: props.kind === 'music' || item.backdrop === null,
    to: { name: 'media-item', params: { id: item.id } },
  }))
})
const itemCount = computed(() => showingArtists.value ? artists.value.length : items.value.length)
const carouselLoading = computed(() => isLoading.value && itemCount.value === 0)
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

function saveBrowseColumns(value: number | null = browseColumns.value) {
  const requestedColumns = value ?? 0
  preferencesChanged = true
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
    : browseMedia(props.kind, sort.value, offset, controller.signal, props.kind === 'music' ? {} : filters.value)
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
watch(filters, () => {
  clearTimeout(filterTimer)
  filterTimer = setTimeout(() => void load(true), 250)
})
const musicTabList = ref<HTMLElement | null>(null)
const musicTabIndicator = ref<{ left: number; top: number; width: number; height: number } | null>(null)
let musicTabResizeObserver: ResizeObserver | undefined

function updateMusicTabIndicator() {
  const list = musicTabList.value
  const active = list?.querySelector<HTMLElement>('button[aria-pressed="true"]')
  if (!list || !active) {
    musicTabIndicator.value = null
    return
  }
  const listRect = list.getBoundingClientRect()
  const activeRect = active.getBoundingClientRect()
  if (!activeRect.width || !activeRect.height) {
    musicTabIndicator.value = null
    return
  }
  musicTabIndicator.value = {
    left: activeRect.left - listRect.left,
    top: activeRect.top - listRect.top,
    width: activeRect.width,
    height: activeRect.height,
  }
}

async function observeMusicTabs() {
  await nextTick()
  musicTabResizeObserver?.disconnect()
  if (musicTabList.value && musicTabResizeObserver) {
    musicTabResizeObserver.observe(musicTabList.value)
    musicTabList.value.querySelectorAll('button').forEach((button) => musicTabResizeObserver?.observe(button))
  }
  updateMusicTabIndicator()
}

function clearFilters() {
  genre.value = ''
  yearFrom.value = ''
  yearTo.value = ''
  cast.value = ''
  studio.value = ''
  runtimeFrom.value = ''
  runtimeTo.value = ''
  hdr.value = ''
  resolution.value = ''
  audioLanguage.value = ''
  unwatched.value = false
}

watch([() => props.kind, musicView], () => void observeMusicTabs(), { flush: 'post' })
watch(musicTabList, () => void observeMusicTabs(), { flush: 'post' })

onMounted(() => {
  musicTabResizeObserver = new ResizeObserver(updateMusicTabIndicator)
  void observeMusicTabs()
  void load(true)
  void loadPreferences()
  void getSearchGenres().then((items) => { genres.value = items }).catch(() => undefined)
})
onBeforeUnmount(() => {
  musicTabResizeObserver?.disconnect()
  controller?.abort()
  clearTimeout(filterTimer)
})
</script>

<template>
  <div class="min-h-screen bg-flixer-background pb-24 font-sans text-flixer-text md:pb-12"
    :class="{ 'overflow-x-hidden': !isTvMode }">

    <HeroCarousel v-if="isTvMode && (carouselLoading || carouselItems.length)" :items="carouselItems"
      :loading="carouselLoading" :tv="true" />

    <main :class="isTvMode ? 'page-gutter pt-8' : 'page-gutter pt-28 sm:pt-32'">
      <div class="flex flex-col gap-4 border-b border-flixer-border/60 pb-5 md:flex-row md:items-end md:justify-between">
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-semibold tracking-tight text-flixer-text sm:text-3xl">{{ heading }}</h1>
          <span
            v-if="!isLoading && total > 0"
            class="rounded border border-flixer-border/80 bg-flixer-surface px-2 py-0.5 text-xs font-medium tabular-nums text-flixer-muted">
            {{ total.toLocaleString() }}
          </span>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <div
            v-if="kind === 'music'"
            ref="musicTabList"
            class="relative inline-flex h-10 items-center rounded border border-flixer-border bg-flixer-surface/60 p-1"
            role="group"
            :aria-label="t('browse.musicView')">
            <span
              class="music-tab-indicator pointer-events-none absolute left-0 top-0 rounded bg-white/15 shadow-sm"
              :class="{ 'music-tab-indicator-visible': musicTabIndicator }"
              :style="musicTabIndicator ? { transform: `translate(${musicTabIndicator.left}px, ${musicTabIndicator.top}px)`, width: `${musicTabIndicator.width}px`, height: `${musicTabIndicator.height}px` } : undefined"
              aria-hidden="true"></span>
            <button
              v-for="view in (['artists', 'albums'] as const)"
              :key="view"
              type="button"
              class="relative z-10 inline-flex h-8 items-center gap-1.5 rounded px-3 text-xs font-medium transition-colors duration-200"
              :class="musicView === view ? 'text-flixer-text' : 'text-flixer-muted hover:text-flixer-text'"
              :aria-pressed="musicView === view"
              @click="musicView = view">
              <Icon :icon="view === 'artists' ? 'lucide:mic-2' : 'lucide:disc-3'" class="size-3.5 shrink-0" aria-hidden="true" />
              <span>{{ t(`browse.${view}`) }}</span>
            </button>
          </div>

          <Button
            v-if="kind !== 'music'"
            type="button"
            class="inline-flex h-10 items-center gap-2 rounded border px-3.5 text-xs font-medium transition-colors"
            :class="filtersOpen || filterCount ? 'border-flixer-accent/50 bg-flixer-primary/15 text-flixer-text' : 'border-flixer-border bg-flixer-surface/80 text-flixer-text hover:border-flixer-accent/40 hover:bg-flixer-surface'"
            :aria-expanded="filtersOpen"
            aria-controls="browse-filters"
            @click="filtersOpen = !filtersOpen">
            <Icon icon="lucide:sliders-horizontal" class="size-3.5 text-flixer-muted" aria-hidden="true" />
            <span>{{ t('search.filters') }}</span>
            <span
              v-if="filterCount"
              class="rounded bg-flixer-primary/25 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-flixer-accent">
              {{ filterCount }}
            </span>
          </Button>

          <Select v-model:value="sort" virtual-focus class="inline-flex items-center">
            <SelectLabel class="sr-only">{{ t('browse.sortBy') }}</SelectLabel>
            <SelectTrigger
              class="inline-flex h-10 items-center justify-between gap-2 rounded border border-flixer-border bg-flixer-surface/80 px-3 text-xs text-flixer-text shadow-none transition-colors hover:border-flixer-accent/40 hover:bg-flixer-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent">
              <span class="inline-flex items-center gap-1.5">
                <Icon icon="lucide:arrow-up-down" class="size-3.5 shrink-0 text-flixer-muted" aria-hidden="true" />
                <span class="hidden text-flixer-muted sm:inline">{{ t('browse.sortBy') }}:</span>
                <SelectValue class="font-medium text-flixer-text" />
              </span>
              <Icon icon="lucide:chevron-down" class="size-3.5 shrink-0 text-flixer-muted" aria-hidden="true" />
            </SelectTrigger>
            <SelectContent
              class="z-50 max-h-60 min-w-[var(--anchor-width)] overflow-auto rounded border border-flixer-border bg-flixer-surface/95 p-1 text-flixer-text shadow-xl backdrop-blur-md">
              <SelectItem
                v-for="option in SORTS"
                :key="option"
                :value="option"
                class="flex cursor-default items-center justify-between gap-3 rounded px-2.5 py-1.5 text-xs font-medium outline-none transition-colors data-highlighted:bg-flixer-primary/15 data-selected:text-flixer-accent">
                {{ t(`browse.sort.${option}`) }}
                <SelectItemIndicator><Icon icon="lucide:check" class="size-3.5" aria-hidden="true" /></SelectItemIndicator>
              </SelectItem>
            </SelectContent>
          </Select>

          <Select v-model:value="browseColumns" virtual-focus class="inline-flex items-center" @value-change="saveBrowseColumns">
            <SelectLabel class="sr-only">{{ t('browse.columns') }}</SelectLabel>
            <SelectTrigger
              class="inline-flex h-10 items-center justify-between gap-2 rounded border border-flixer-border bg-flixer-surface/80 px-3 text-xs text-flixer-text shadow-none transition-colors hover:border-flixer-accent/40 hover:bg-flixer-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent">
              <span class="inline-flex items-center gap-1.5">
                <Icon icon="lucide:layout-grid" class="size-3.5 shrink-0 text-flixer-muted" aria-hidden="true" />
                <span class="hidden text-flixer-muted sm:inline">{{ t('browse.columns') }}:</span>
                <SelectValue class="font-medium text-flixer-text" />
              </span>
              <Icon icon="lucide:chevron-down" class="size-3.5 shrink-0 text-flixer-muted" aria-hidden="true" />
            </SelectTrigger>
            <SelectContent
              class="z-50 max-h-60 min-w-[var(--anchor-width)] overflow-auto rounded border border-flixer-border bg-flixer-surface/95 p-1 text-flixer-text shadow-xl backdrop-blur-md">
              <SelectItem
                :value="0"
                class="flex cursor-default items-center justify-between gap-3 rounded px-2.5 py-1.5 text-xs font-medium outline-none transition-colors data-highlighted:bg-flixer-primary/15 data-selected:text-flixer-accent">
                {{ t('browse.columnsAuto') }}
                <SelectItemIndicator><Icon icon="lucide:check" class="size-3.5" aria-hidden="true" /></SelectItemIndicator>
              </SelectItem>
              <SelectItem
                v-for="columns in BROWSE_COLUMN_OPTIONS"
                :key="columns"
                :value="columns"
                class="flex cursor-default items-center justify-between gap-3 rounded px-2.5 py-1.5 text-xs font-medium outline-none transition-colors data-highlighted:bg-flixer-primary/15 data-selected:text-flixer-accent">
                {{ t('browse.columnOption', { count: columns }) }}
                <SelectItemIndicator><Icon icon="lucide:check" class="size-3.5" aria-hidden="true" /></SelectItemIndicator>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div v-if="filtersOpen && kind !== 'music'" id="browse-filters"
        class="mt-4 rounded border border-flixer-border/80 bg-flixer-surface/65 p-4 sm:p-5">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-flixer-border/50 pb-3">
          <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-flixer-muted">
            <Icon icon="lucide:sliders-horizontal" class="size-3.5 text-flixer-accent" aria-hidden="true" />
            <span>{{ t('search.filters') }}</span>
            <span
              v-if="filterCount"
              class="rounded bg-flixer-primary/20 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-flixer-accent">
              {{ filterCount }}
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <label class="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-flixer-text">
              <Checkbox :checked="unwatched"
                class="mt-0 size-4 rounded-sm border-flixer-border data-checked:border-flixer-accent data-checked:bg-flixer-accent"
                @update:checked="unwatched = $event === true"><CheckboxIndicator /></Checkbox>
              <span>{{ t('search.unwatched') }}</span>
            </label>
            <button
              v-if="filterCount > 0"
              type="button"
              class="inline-flex h-7 items-center gap-1.5 rounded border border-flixer-border bg-flixer-background/70 px-2.5 text-[11px] font-medium text-flixer-muted transition-colors hover:border-flixer-accent/40 hover:text-flixer-text"
              @click="clearFilters">
              <Icon icon="lucide:rotate-ccw" class="size-3" aria-hidden="true" />
              <span>{{ t('search.clear') }}</span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="min-w-0">
            <Select v-model:value="genre" virtual-focus class="w-full">
              <SelectLabel class="block text-[11px] font-medium text-flixer-muted">{{ t('search.genre') }}</SelectLabel>
              <SelectTrigger
                class="mt-1.5 inline-flex h-9 w-full items-center justify-between gap-2 rounded border border-flixer-border bg-flixer-background/70 px-3 text-xs text-flixer-text shadow-none transition-colors hover:border-flixer-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent">
                <SelectValue />
                <Icon icon="lucide:chevron-down" class="size-3.5 shrink-0 text-flixer-muted" aria-hidden="true" />
              </SelectTrigger>
              <SelectContent
                class="z-50 max-h-60 min-w-[var(--anchor-width)] overflow-auto rounded border border-flixer-border bg-flixer-surface/95 p-1 text-flixer-text shadow-xl backdrop-blur-md">
                <SelectItem value=""
                  class="flex cursor-default items-center justify-between gap-3 rounded px-2.5 py-1.5 text-xs font-medium outline-none transition-colors data-highlighted:bg-flixer-primary/15 data-selected:text-flixer-accent">
                  {{ t('search.anyGenre') }}
                  <SelectItemIndicator><Icon icon="lucide:check" class="size-3.5" aria-hidden="true" /></SelectItemIndicator>
                </SelectItem>
                <SelectItem v-for="entry in genres" :key="entry" :value="entry"
                  class="flex cursor-default items-center justify-between gap-3 rounded px-2.5 py-1.5 text-xs font-medium outline-none transition-colors data-highlighted:bg-flixer-primary/15 data-selected:text-flixer-accent">
                  {{ entry }}
                  <SelectItemIndicator><Icon icon="lucide:check" class="size-3.5" aria-hidden="true" /></SelectItemIndicator>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="grid min-w-0 grid-cols-2 gap-2">
            <label class="block min-w-0 text-[11px] font-medium text-flixer-muted">
              <span class="block truncate">{{ t('search.yearFrom') }}</span>
              <input v-model="yearFrom" type="number" min="1800" max="2200" placeholder="1900"
                class="mt-1.5 h-9 w-full rounded border border-flixer-border bg-flixer-background/70 px-2.5 text-xs tabular-nums text-flixer-text placeholder:text-flixer-muted/50 outline-none transition-colors focus:border-flixer-accent focus:ring-2 focus:ring-flixer-accent/15" />
            </label>
            <label class="block min-w-0 text-[11px] font-medium text-flixer-muted">
              <span class="block truncate">{{ t('search.yearTo') }}</span>
              <input v-model="yearTo" type="number" min="1800" max="2200" placeholder="2026"
                class="mt-1.5 h-9 w-full rounded border border-flixer-border bg-flixer-background/70 px-2.5 text-xs tabular-nums text-flixer-text placeholder:text-flixer-muted/50 outline-none transition-colors focus:border-flixer-accent focus:ring-2 focus:ring-flixer-accent/15" />
            </label>
          </div>

          <label class="block min-w-0 text-[11px] font-medium text-flixer-muted">
            <span class="block truncate">{{ t('browseFilters.cast') }}</span>
            <Input v-model="cast" type="search" maxlength="100"
              class="mt-1.5 h-9 w-full rounded border border-flixer-border bg-flixer-background/70 px-3 text-xs text-flixer-text outline-none transition-colors focus:border-flixer-accent focus:ring-2 focus:ring-flixer-accent/15" />
          </label>

          <label class="block min-w-0 text-[11px] font-medium text-flixer-muted">
            <span class="block truncate">{{ t('browseFilters.studio') }}</span>
            <Input v-model="studio" type="search" maxlength="100"
              class="mt-1.5 h-9 w-full rounded border border-flixer-border bg-flixer-background/70 px-3 text-xs text-flixer-text outline-none transition-colors focus:border-flixer-accent focus:ring-2 focus:ring-flixer-accent/15" />
          </label>

          <div class="grid min-w-0 grid-cols-2 gap-2">
            <label class="block min-w-0 text-[11px] font-medium text-flixer-muted">
              <span class="block truncate" :title="t('browseFilters.runtimeFrom')">{{ t('browseFilters.runtimeFrom') }}</span>
              <input v-model="runtimeFrom" type="number" min="0" placeholder="0 min"
                class="mt-1.5 h-9 w-full rounded border border-flixer-border bg-flixer-background/70 px-2.5 text-xs tabular-nums text-flixer-text placeholder:text-flixer-muted/50 outline-none transition-colors focus:border-flixer-accent focus:ring-2 focus:ring-flixer-accent/15" />
            </label>
            <label class="block min-w-0 text-[11px] font-medium text-flixer-muted">
              <span class="block truncate" :title="t('browseFilters.runtimeTo')">{{ t('browseFilters.runtimeTo') }}</span>
              <input v-model="runtimeTo" type="number" min="0" placeholder="180 min"
                class="mt-1.5 h-9 w-full rounded border border-flixer-border bg-flixer-background/70 px-2.5 text-xs tabular-nums text-flixer-text placeholder:text-flixer-muted/50 outline-none transition-colors focus:border-flixer-accent focus:ring-2 focus:ring-flixer-accent/15" />
            </label>
          </div>

          <div class="min-w-0">
            <Select v-model:value="hdr" virtual-focus class="w-full">
              <SelectLabel class="block text-[11px] font-medium text-flixer-muted">{{ t('browseFilters.hdr') }}</SelectLabel>
              <SelectTrigger
                class="mt-1.5 inline-flex h-9 w-full items-center justify-between gap-2 rounded border border-flixer-border bg-flixer-background/70 px-3 text-xs text-flixer-text shadow-none transition-colors hover:border-flixer-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent">
                <SelectValue />
                <Icon icon="lucide:chevron-down" class="size-3.5 shrink-0 text-flixer-muted" aria-hidden="true" />
              </SelectTrigger>
              <SelectContent
                class="z-50 max-h-60 min-w-[var(--anchor-width)] overflow-auto rounded border border-flixer-border bg-flixer-surface/95 p-1 text-flixer-text shadow-xl backdrop-blur-md">
                <SelectItem value=""
                  class="flex cursor-default items-center justify-between gap-3 rounded px-2.5 py-1.5 text-xs font-medium outline-none transition-colors data-highlighted:bg-flixer-primary/15 data-selected:text-flixer-accent">
                  {{ t('browseFilters.any') }}
                  <SelectItemIndicator><Icon icon="lucide:check" class="size-3.5" aria-hidden="true" /></SelectItemIndicator>
                </SelectItem>
                <SelectItem value="hdr10"
                  class="flex cursor-default items-center justify-between gap-3 rounded px-2.5 py-1.5 text-xs font-medium outline-none transition-colors data-highlighted:bg-flixer-primary/15 data-selected:text-flixer-accent">
                  HDR10
                  <SelectItemIndicator><Icon icon="lucide:check" class="size-3.5" aria-hidden="true" /></SelectItemIndicator>
                </SelectItem>
                <SelectItem value="hdr10plus"
                  class="flex cursor-default items-center justify-between gap-3 rounded px-2.5 py-1.5 text-xs font-medium outline-none transition-colors data-highlighted:bg-flixer-primary/15 data-selected:text-flixer-accent">
                  HDR10+
                  <SelectItemIndicator><Icon icon="lucide:check" class="size-3.5" aria-hidden="true" /></SelectItemIndicator>
                </SelectItem>
                <SelectItem value="dolbyvision"
                  class="flex cursor-default items-center justify-between gap-3 rounded px-2.5 py-1.5 text-xs font-medium outline-none transition-colors data-highlighted:bg-flixer-primary/15 data-selected:text-flixer-accent">
                  Dolby Vision
                  <SelectItemIndicator><Icon icon="lucide:check" class="size-3.5" aria-hidden="true" /></SelectItemIndicator>
                </SelectItem>
                <SelectItem value="hlg"
                  class="flex cursor-default items-center justify-between gap-3 rounded px-2.5 py-1.5 text-xs font-medium outline-none transition-colors data-highlighted:bg-flixer-primary/15 data-selected:text-flixer-accent">
                  HLG
                  <SelectItemIndicator><Icon icon="lucide:check" class="size-3.5" aria-hidden="true" /></SelectItemIndicator>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="min-w-0">
            <Select v-model:value="resolution" virtual-focus class="w-full">
              <SelectLabel class="block text-[11px] font-medium text-flixer-muted">{{ t('browseFilters.resolution') }}</SelectLabel>
              <SelectTrigger
                class="mt-1.5 inline-flex h-9 w-full items-center justify-between gap-2 rounded border border-flixer-border bg-flixer-background/70 px-3 text-xs text-flixer-text shadow-none transition-colors hover:border-flixer-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent">
                <SelectValue />
                <Icon icon="lucide:chevron-down" class="size-3.5 shrink-0 text-flixer-muted" aria-hidden="true" />
              </SelectTrigger>
              <SelectContent
                class="z-50 max-h-60 min-w-[var(--anchor-width)] overflow-auto rounded border border-flixer-border bg-flixer-surface/95 p-1 text-flixer-text shadow-xl backdrop-blur-md">
                <SelectItem value=""
                  class="flex cursor-default items-center justify-between gap-3 rounded px-2.5 py-1.5 text-xs font-medium outline-none transition-colors data-highlighted:bg-flixer-primary/15 data-selected:text-flixer-accent">
                  {{ t('browseFilters.any') }}
                  <SelectItemIndicator><Icon icon="lucide:check" class="size-3.5" aria-hidden="true" /></SelectItemIndicator>
                </SelectItem>
                <SelectItem value="720"
                  class="flex cursor-default items-center justify-between gap-3 rounded px-2.5 py-1.5 text-xs font-medium outline-none transition-colors data-highlighted:bg-flixer-primary/15 data-selected:text-flixer-accent">
                  720p+
                  <SelectItemIndicator><Icon icon="lucide:check" class="size-3.5" aria-hidden="true" /></SelectItemIndicator>
                </SelectItem>
                <SelectItem value="1080"
                  class="flex cursor-default items-center justify-between gap-3 rounded px-2.5 py-1.5 text-xs font-medium outline-none transition-colors data-highlighted:bg-flixer-primary/15 data-selected:text-flixer-accent">
                  1080p+
                  <SelectItemIndicator><Icon icon="lucide:check" class="size-3.5" aria-hidden="true" /></SelectItemIndicator>
                </SelectItem>
                <SelectItem value="2160"
                  class="flex cursor-default items-center justify-between gap-3 rounded px-2.5 py-1.5 text-xs font-medium outline-none transition-colors data-highlighted:bg-flixer-primary/15 data-selected:text-flixer-accent">
                  2160p+
                  <SelectItemIndicator><Icon icon="lucide:check" class="size-3.5" aria-hidden="true" /></SelectItemIndicator>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <label class="block min-w-0 text-[11px] font-medium text-flixer-muted">
            <span class="block truncate">{{ t('browseFilters.audioLanguage') }}</span>
            <Input v-model="audioLanguage" maxlength="30" placeholder="eng, jpn..."
              class="mt-1.5 h-9 w-full rounded border border-flixer-border bg-flixer-background/70 px-3 text-xs text-flixer-text placeholder:text-flixer-muted/50 outline-none transition-colors focus:border-flixer-accent focus:ring-2 focus:ring-flixer-accent/15" />
          </label>
        </div>
      </div>

      <div class="mt-6" aria-live="polite">
        <p v-if="failed" class="text-sm text-red-400" role="alert">{{ t('browse.error') }}</p>
        <CardGridSkeleton v-else-if="isLoading && itemCount === 0" :square="kind === 'music'" />
        <p v-else-if="itemCount === 0" class="text-sm text-flixer-muted">{{ t('browse.empty') }}</p>

        <ul v-else data-tv-row data-tv-grid data-tv-scroll="nearest" :style="gridStyle"
          :class="['grid gap-x-4 gap-y-6', browseColumns ? 'browse-grid-preferred' : 'grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]']">
          <template v-if="showingArtists">
            <li v-for="artist in artists" :key="artist.id" class="min-w-0">
              <RouterLink :to="{ name: 'person', params: { id: artist.id } }"
                class="group block rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent">
                <PersonAvatar :person-id="artist.id" :name="artist.name" :has-image="true" :width="200"
                  class="aspect-square rounded border border-flixer-border transition group-hover:border-white/30">
                  <div v-if="artist.covers.length" class="grid size-full"
                    :class="artist.covers.length === 1 ? 'grid-cols-1' : 'grid-cols-2 grid-rows-2'">
                    <AuthImage v-for="tile in artist.covers.length === 1 ? 1 : 4" :key="tile" scope="library"
                      :item-id="artist.covers[(tile - 1) % artist.covers.length]!.itemId"
                      :index="artist.covers[(tile - 1) % artist.covers.length]!.index"
                      :version="artist.covers[(tile - 1) % artist.covers.length]!.version"
                      :width="artist.covers.length === 1 ? 200 : 100" alt="" />
                  </div>
                  <span v-else
                    class="grid size-full place-items-center p-3 text-center text-sm font-medium text-flixer-muted">{{
                      artist.name }}</span>
                </PersonAvatar>
                <div class="mt-2 px-0.5">
                  <p class="truncate text-sm font-medium text-flixer-text">{{ artist.name }}</p>
                  <p class="truncate text-xs text-flixer-muted">{{ t('browse.albumCount', { count: artist.albumCount },
                    artist.albumCount) }}</p>
                </div>
              </RouterLink>
            </li>
          </template>
          <template v-else>
            <MediaCard v-for="item in items" :key="item.id" class="!w-auto"
              :variant="kind === 'music' ? 'square' : 'poster'" :title="item.title" :subtitle="subtitleOf(item)"
              :item-id="item.id" :image-index="item.poster ?? item.backdrop" :version="item.updatedAt"
              :blurhash="item.poster !== null ? item.posterBlurhash : item.backdropBlurhash"
              :locked="item.locked" />
          </template>
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

.music-tab-indicator {
  opacity: 0;
  transition:
    transform 0.3s cubic-bezier(0.22, 1, 0.36, 1),
    width 0.3s cubic-bezier(0.22, 1, 0.36, 1),
    height 0.3s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.15s ease;
}

.music-tab-indicator-visible {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .music-tab-indicator {
    transition: none;
  }
}
</style>
