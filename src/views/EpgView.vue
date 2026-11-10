<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import MobileTabBar from '../components/home/MobileTabBar.vue'
import { getGuide, getGuideChannelPlaybackInfo, GUIDE_CHANNEL_PAGE_SIZE, type EpgChannel, type EpgData, type EpgProgramme } from '../api/guide'
import { programmeProgress, programmesInWindow, visibleGuideTimeChunks } from '../api/epg'
import { getMobileTabs } from '../composables/homeNav'
import { useInfiniteScroll } from '../composables/useInfiniteScroll'
import { useVideoOverlay } from '../composables/useVideoOverlay'
import { catchError } from '../utils/catchError'

const HALF_HOUR = 30 * 60_000
const GUIDE_DAY_COUNT = 7
const WINDOW_LENGTH = GUIDE_DAY_COUNT * 24 * 60 * 60_000
const GUIDE_TIME_CHUNK_MS = 6 * 60 * 60_000
const SLOT_WIDTH = 144
const FAVORITES_KEY = 'flixer.epg.favorites'
const PRIMARY_CHANNELS = ['bbc one london', 'bbc two', 'itv1', 'channel 4', 'channel 5', 'bbc three', 'itv2', 'e4', 'sky news', 'bbc news']

const { t, locale } = useI18n()
const videoOverlay = useVideoOverlay()
const mobileTabs = computed(getMobileTabs)
const data = ref<EpgData | null>(null)
const loading = ref(true)
const loadingMore = ref(false)
const loadingTime = ref(false)
const loadError = ref('')
const loadMoreError = ref('')
const timeLoadError = ref('')
const query = ref('')
const category = ref('')
const favoritesOnly = ref(false)
const favorites = ref(readStoredSet(FAVORITES_KEY))
const selectedProgramme = ref<EpgProgramme | null>(null)
const actionMessage = ref('')
const playbackError = ref('')
const now = ref(Date.now())
const guideStart = ref(roundToGuideStart(new Date()))
const imageFailures = ref(new Set<string>())
const openingChannelId = ref('')
const guideScroller = ref<HTMLDivElement | null>(null)

let controller: AbortController | undefined
let clockTimer: ReturnType<typeof setInterval> | undefined
let guideGeneration = 0
let scrollFrame: number | undefined
const loadedSlices = new Set<string>()
const loadedTimeChunks = new Set<number>()
const loadedChannelOffsets = new Set<number>()
const inFlightSlices = new Map<string, Promise<EpgData>>()

function readStoredSet(key: string): Set<string> {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(stored) ? new Set(stored.filter((value): value is string => typeof value === 'string')) : new Set()
  } catch (error) {
    console.error(`[guide] couldn't read ${key}`, error)
    return new Set()
  }
}

function roundToGuideStart(date: Date): Date {
  const result = new Date(date)
  result.setSeconds(0, 0)
  result.setMinutes(Math.floor(result.getMinutes() / 30) * 30 - 30)
  return result
}

function localDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatTime(timestamp: number, options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' }): string {
  return new Intl.DateTimeFormat(locale.value, options).format(timestamp)
}

function isDayStart(timestamp: number): boolean {
  const date = new Date(timestamp)
  return date.getHours() === 0 && date.getMinutes() === 0
}

function formatDay(timestamp: number): string {
  return formatTime(timestamp, { weekday: 'short', month: 'short', day: 'numeric' })
}

function channelOrder(name: string): number {
  const normalized = name.toLowerCase()
  const index = PRIMARY_CHANNELS.findIndex((entry) => normalized === entry || normalized.startsWith(`${entry} `))
  return index < 0 ? PRIMARY_CHANNELS.length : index
}

const channels = computed(() => {
  if (!data.value) return []
  return [...data.value.channels].sort((a, b) => a.sortOrder - b.sortOrder || channelOrder(a.name) - channelOrder(b.name) || a.name.localeCompare(b.name, locale.value))
})
const programmesByChannel = computed(() => {
  const index = new Map<string, EpgProgramme[]>()
  for (const programme of data.value?.programmes ?? []) {
    const entries = index.get(programme.channelId) ?? []
    entries.push(programme)
    index.set(programme.channelId, entries)
  }
  return index
})
const windowEnd = computed(() => guideStart.value.getTime() + WINDOW_LENGTH)
const windowProgrammes = computed(() => programmesInWindow(data.value?.programmes ?? [], guideStart.value.getTime(), windowEnd.value))
const categories = computed(() => {
  const counts = new Map<string, number>()
  for (const programme of windowProgrammes.value) {
    if (programme.category) counts.set(programme.category, (counts.get(programme.category) ?? 0) + 1)
  }
  return [...counts]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], locale.value))
    .slice(0, 16)
    .map(([name]) => name)
})
const filteredChannels = computed(() => {
  const needle = query.value.trim().toLocaleLowerCase(locale.value)
  return channels.value.filter((channel) => {
    if (favoritesOnly.value && !favorites.value.has(channel.id)) return false
    const listings = programmesInWindow(programmesByChannel.value.get(channel.id) ?? [], guideStart.value.getTime(), windowEnd.value)
    if (category.value && !listings.some((programme) => programme.category === category.value)) return false
    if (needle && !`${channel.name} ${channel.alternateNames.join(' ')}`.toLocaleLowerCase(locale.value).includes(needle) && !listings.some((programme) => `${programme.title} ${programme.subtitle ?? ''}`.toLocaleLowerCase(locale.value).includes(needle))) {
      return false
    }
    return true
  })
})
const visibleChannels = computed(() => filteredChannels.value)
const guideDays = computed(() => {
  const today = new Date(now.value)
  today.setHours(0, 0, 0, 0)
  return Array.from({ length: GUIDE_DAY_COUNT }, (_, index) => {
    const date = new Date(today)
    date.setDate(date.getDate() + index)
    return date
  })
})
const isToday = computed(() => localDayKey(guideStart.value) === localDayKey(new Date(now.value)))
const timeSlots = computed(() => Array.from({ length: WINDOW_LENGTH / HALF_HOUR }, (_, index) => guideStart.value.getTime() + index * HALF_HOUR))
const nowPosition = computed(() => {
  if (!isToday.value || now.value < guideStart.value.getTime() || now.value > windowEnd.value) return undefined
  return ((now.value - guideStart.value.getTime()) / WINDOW_LENGTH) * 100
})
const featuredProgramme = computed(() => {
  const active = data.value?.programmes.filter((programme) => programme.start <= now.value && programme.stop > now.value) ?? []
  return active.sort((a, b) => channelOrder(data.value?.channels.find((channel) => channel.id === a.channelId)?.name ?? '') - channelOrder(data.value?.channels.find((channel) => channel.id === b.channelId)?.name ?? ''))[0]
})
const featuredChannel = computed(() => data.value?.channels.find((channel) => channel.id === featuredProgramme.value?.channelId))
const showingChannels = computed(() => filteredChannels.value.length)
const canLoadMoreChannels = computed(() => Boolean(data.value && data.value.channels.length < data.value.totalChannels && !loading.value && !loadingMore.value && !loadError.value && !loadMoreError.value))
const { setSentinel, recheck } = useInfiniteScroll(() => void loadNextPage(), canLoadMoreChannels)
const channelPageOffsets = computed(() => (data.value ? Array.from({ length: Math.ceil(data.value.channels.length / GUIDE_CHANNEL_PAGE_SIZE) }, (_, index) => index * GUIDE_CHANNEL_PAGE_SIZE) : []))

function programmesFor(channel: EpgChannel): EpgProgramme[] {
  return programmesInWindow(programmesByChannel.value.get(channel.id) ?? [], guideStart.value.getTime(), windowEnd.value)
}

function programmeStyle(programme: EpgProgramme) {
  const left = Math.max(programme.start, guideStart.value.getTime())
  const right = Math.min(programme.stop, windowEnd.value)
  return {
    left: `${((left - guideStart.value.getTime()) / WINDOW_LENGTH) * 100}%`,
    width: `${((right - left) / WINDOW_LENGTH) * 100}%`,
  }
}

function isOnNow(programme: EpgProgramme): boolean {
  return programme.start <= now.value && programme.stop > now.value
}

function programmeHoverStyle(programme: EpgProgramme) {
  const visibleStart = Math.max(programme.start, guideStart.value.getTime())
  const visibleStop = Math.min(programme.stop, windowEnd.value)
  const visibleDuration = visibleStop - visibleStart
  const elapsed = Math.max(0, Math.min(now.value - visibleStart, visibleDuration))
  const progress = isOnNow(programme) && visibleDuration > 0 ? (elapsed / visibleDuration) * 100 : 100
  return { '--hover-progress': `${progress}%` }
}

function dayName(date: Date, index: number): string {
  if (index === 0) return t('epg.today')
  if (index === 1) return t('epg.tomorrow')
  return new Intl.DateTimeFormat(locale.value, { weekday: 'short' }).format(date)
}

function selectDay(date: Date) {
  const next = new Date(date)
  next.setHours(guideStart.value.getHours(), guideStart.value.getMinutes(), 0, 0)
  guideStart.value = next
}

function shiftWindow(minutes: number) {
  guideStart.value = new Date(guideStart.value.getTime() + minutes * 60_000)
}

function jumpToNow() {
  now.value = Date.now()
  guideStart.value = roundToGuideStart(new Date(now.value))
}

function toggleFavorite(channel: EpgChannel) {
  const next = new Set(favorites.value)
  if (next.has(channel.id)) next.delete(channel.id)
  else next.add(channel.id)
  favorites.value = next
  actionMessage.value = t(next.has(channel.id) ? 'epg.favoriteAdded' : 'epg.favoriteRemoved', { channel: channel.name })
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...next]))
  } catch (error) {
    console.error('[guide] couldn’t save favourite channels', error)
    actionMessage.value = t('epg.preferenceSaveError')
  }
}

function programmeKey(programme: EpgProgramme): string {
  return `${programme.channelId}:${programme.start}`
}

function markImageFailed(channelId: string) {
  imageFailures.value = new Set(imageFailures.value).add(channelId)
}

async function watchChannel(channel: EpgChannel) {
  if (!channel.watchable || openingChannelId.value) return
  playbackError.value = ''
  openingChannelId.value = channel.id
  const [error, playback] = await catchError(getGuideChannelPlaybackInfo(channel.id))
  if (error) {
    console.error('[guide] failed to start live playback', error)
    playbackError.value = t('epg.playbackError')
    openingChannelId.value = ''
    return
  }
  videoOverlay.play({ id: channel.id, title: channel.name, livePlayback: playback })
  openingChannelId.value = ''
}

async function load() {
  controller?.abort()
  controller = new AbortController()
  const activeController = controller
  const generation = ++guideGeneration
  loading.value = true
  loadingMore.value = false
  loadingTime.value = false
  loadError.value = ''
  loadMoreError.value = ''
  timeLoadError.value = ''
  loadedSlices.clear()
  loadedTimeChunks.clear()
  loadedChannelOffsets.clear()
  data.value = null
  try {
    const page = await requestGuideSlice(0, 0, activeController, generation)
    if (activeController.signal.aborted || controller !== activeController) return
    data.value = page
    loadedSlices.add('0:0')
    loadedTimeChunks.add(0)
    loadedChannelOffsets.add(0)
  } catch (error) {
    if (activeController.signal.aborted) return
    console.error('[guide] failed to load programme guide', error)
    loadError.value = t('epg.loadError')
  } finally {
    if (!activeController.signal.aborted) {
      loading.value = false
      void nextTick(loadVisibleTimeChunks)
    }
  }
}

function requestGuideSlice(chunkIndex: number, offset: number, activeController: AbortController, generation: number): Promise<EpgData> {
  const sliceKey = `${chunkIndex}:${offset}`
  const requestKey = `${generation}:${sliceKey}`
  const existing = inFlightSlices.get(requestKey)
  if (existing) return existing
  const from = guideStart.value.getTime() + chunkIndex * GUIDE_TIME_CHUNK_MS
  const to = Math.min(from + GUIDE_TIME_CHUNK_MS, windowEnd.value)
  const request = getGuide(new Date(from), new Date(to), offset, activeController.signal).finally(() => {
    if (inFlightSlices.get(requestKey) === request) inFlightSlices.delete(requestKey)
    if (generation === guideGeneration) {
      loadingTime.value = [...inFlightSlices.keys()].some((key) => key.startsWith(`${generation}:`))
    }
  })
  inFlightSlices.set(requestKey, request)
  if (generation === guideGeneration) loadingTime.value = true
  return request
}

async function loadSlices(slices: Array<{ chunkIndex: number; offset: number }>, activeController: AbortController, generation: number) {
  const pending = slices.filter(({ chunkIndex, offset }) => !loadedSlices.has(`${chunkIndex}:${offset}`))
  if (pending.length === 0) return
  const pages = await Promise.all(
    pending.map(async ({ chunkIndex, offset }) => ({
      chunkIndex,
      offset,
      page: await requestGuideSlice(chunkIndex, offset, activeController, generation),
    })),
  )
  if (activeController.signal.aborted || controller !== activeController || generation !== guideGeneration) return

  const current = data.value
  if (!current) {
    const initial = pages.find(({ chunkIndex, offset }) => chunkIndex === 0 && offset === 0)
    if (!initial) return
    data.value = initial.page
    loadedChannelOffsets.add(0)
    loadedTimeChunks.add(0)
    loadedSlices.add('0:0')
    return
  }

  const channels = [...current.channels]
  const programmes = new Map(current.programmes.map((programme) => [programmeKey(programme), programme]))
  for (const { chunkIndex, offset, page } of pages) {
    const key = `${chunkIndex}:${offset}`
    if (loadedSlices.has(key)) continue
    if (!loadedChannelOffsets.has(offset)) {
      channels.push(...page.channels)
      loadedChannelOffsets.add(offset)
    }
    for (const programme of page.programmes) programmes.set(programmeKey(programme), programme)
    loadedSlices.add(key)
    if (offset === 0) loadedTimeChunks.add(chunkIndex)
  }
  data.value = { ...current, channels, programmes: [...programmes.values()] }
  recheck()
}

async function loadVisibleTimeChunks() {
  const element = guideScroller.value
  const activeController = controller
  if (!element || !activeController || !data.value || loading.value) return
  const generation = guideGeneration
  const timelineWidth = timeSlots.value.length * SLOT_WIDTH
  const chunks = visibleGuideTimeChunks(element.scrollLeft, element.clientWidth, timelineWidth, WINDOW_LENGTH, GUIDE_TIME_CHUNK_MS)
  const slices = chunks.flatMap((chunkIndex) => channelPageOffsets.value.map((offset) => ({ chunkIndex, offset })))
  if (!slices.some(({ chunkIndex, offset }) => !loadedSlices.has(`${chunkIndex}:${offset}`))) return
  timeLoadError.value = ''
  try {
    await loadSlices(slices, activeController, generation)
  } catch (error) {
    if (activeController.signal.aborted) return
    console.error('[guide] failed to load programmes for the visible time range', error)
    timeLoadError.value = t('epg.loadError')
  }
}

function onGuideScroll() {
  if (scrollFrame !== undefined) return
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = undefined
    void loadVisibleTimeChunks()
  })
}

async function loadNextPage() {
  if (!data.value || !controller || loadingMore.value || data.value.channels.length >= data.value.totalChannels) return
  const activeController = controller
  const generation = guideGeneration
  const offset = data.value.channels.length
  loadingMore.value = true
  loadMoreError.value = ''
  try {
    const slices = [...loadedTimeChunks].sort((a, b) => a - b).map((chunkIndex) => ({ chunkIndex, offset }))
    await loadSlices(slices, activeController, generation)
    if (!activeController.signal.aborted) void loadVisibleTimeChunks()
  } catch (error) {
    if (activeController.signal.aborted) return
    console.error('[guide] failed to load the next channel page', error)
    loadMoreError.value = t('epg.loadError')
  } finally {
    if (!activeController.signal.aborted) loadingMore.value = false
    recheck()
  }
}

function retryVisibleTimeChunks() {
  timeLoadError.value = ''
  void loadVisibleTimeChunks()
}

async function scanFilteredChannels() {
  while ((query.value.trim() || category.value || favoritesOnly.value) && canLoadMoreChannels.value) {
    await loadNextPage()
  }
}

watch(guideStart, () => {
  selectedProgramme.value = null
  void load()
})
watch([query, category, favoritesOnly], () => {
  recheck()
  void scanFilteredChannels()
})
watch(
  [data, loadingMore],
  () => {
    recheck()
    if (query.value.trim() || category.value || favoritesOnly.value) void scanFilteredChannels()
  },
  { flush: 'post' },
)

onMounted(() => {
  void load()
  clockTimer = setInterval(() => {
    now.value = Date.now()
  }, 30_000)
})

onBeforeUnmount(() => {
  controller?.abort()
  if (scrollFrame !== undefined) cancelAnimationFrame(scrollFrame)
  if (clockTimer) clearInterval(clockTimer)
})
</script>

<template>
  <div class="min-h-screen overflow-x-clip bg-flixer-background pb-24 font-sans text-flixer-text md:pb-12">

    <main class="page-gutter pt-20 sm:pt-24">
      <p class="sr-only" role="status" aria-live="polite">{{ actionMessage }}</p>
      <p v-if="playbackError" role="alert"
        class="mb-4 rounded border border-red-400/20 bg-red-500/5 p-3 text-sm text-red-200">{{ playbackError }}</p>
      <section class="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div class="min-w-0">
          <p class="text-[10px] font-semibold tracking-[0.18em] text-flixer-accent">{{ t('epg.eyebrow') }}</p>
          <h1 class="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">{{ t('epg.title') }}</h1>
          <p class="mt-1 text-xs text-flixer-muted">
            {{ t('epg.feed')
            }}<span v-if="data">
              · <template v-if="data.sources.length">{{data.sources.map((source) => source.name).join(', ')}} ·
              </template>{{
                t('epg.channels', { count: data.channels.length }) }}</span>
          </p>
        </div>

        <div
          class="flex min-w-0 flex-1 items-center gap-3 rounded border border-white/10 bg-flixer-surface/60 px-3 py-2 sm:max-w-lg">
          <span
            class="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-flixer-accent/10 px-2 py-1 text-[10px] font-bold tracking-wider text-flixer-accent">
            <span class="size-1.5 rounded-full bg-flixer-accent"></span>{{ t('epg.onNow') }} </span>
          <div v-if="featuredProgramme" class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold text-white">{{ featuredProgramme.title }}</p>
            <p class="truncate text-xs text-flixer-muted">{{ featuredChannel?.name }} · {{
              formatTime(featuredProgramme.start)
              }}–{{ formatTime(featuredProgramme.stop) }}</p>
            <div class="mt-1.5 h-0.5 overflow-hidden rounded-full bg-white/10">
              <div class="h-full rounded-full bg-flixer-accent transition-[width]"
                :style="{ width: `${programmeProgress(featuredProgramme, now)}%` }"></div>
            </div>
          </div>
          <p v-else class="min-w-0 flex-1 truncate text-xs text-flixer-muted">{{ loading ? t('epg.loading') :
            t('epg.noLiveProgramme') }}</p>
          <button type="button"
            class="grid size-9 shrink-0 place-items-center rounded bg-white/5 text-flixer-muted transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent"
            :aria-label="t('epg.now')" :title="t('epg.now')" @click="jumpToNow">
            <Icon icon="lucide:radio" class="size-4 text-flixer-accent" aria-hidden="true" />
          </button>
        </div>
      </section>

      <section :aria-label="t('epg.title')">
        <div class="flex flex-col gap-5">
          <div class="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div>
              <p class="text-xs font-semibold tracking-[0.18em] text-flixer-muted">{{ t('epg.scheduleEyebrow') }}</p>
              <div class="mt-3 flex flex-wrap gap-2">
                <button v-for="(day, index) in guideDays" :key="localDayKey(day)" type="button"
                  class="min-w-[5.5rem] rounded border px-3 py-2 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent"
                  :class="localDayKey(day) === localDayKey(guideStart) ? 'border-flixer-accent/70 bg-flixer-accent/15 text-white' : 'border-white/10 bg-white/[0.03] text-flixer-muted hover:border-white/20 hover:text-white'"
                  :aria-pressed="localDayKey(day) === localDayKey(guideStart)" @click="selectDay(day)">
                  <span class="block text-xs font-semibold">{{ dayName(day, index) }}</span>
                  <span class="mt-1 block text-xs opacity-70">{{ new Intl.DateTimeFormat(locale, {
                    month: 'short', day:
                      'numeric' }).format(day) }}</span>
                </button>
              </div>
            </div>

            <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label class="relative min-w-0 flex-1 sm:min-w-64">
                <span class="sr-only">{{ t('epg.searchLabel') }}</span>
                <Icon icon="lucide:search"
                  class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-flixer-muted"
                  aria-hidden="true" />
                <input v-model="query" type="search" :placeholder="t('epg.search')"
                  class="h-11 w-full rounded border border-white/10 bg-flixer-surface pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-flixer-muted focus:border-flixer-accent/70 focus:ring-2 focus:ring-flixer-accent/20" />
              </label>
              <label class="sr-only" for="epg-category">{{ t('epg.categoryLabel') }}</label>
              <select id="epg-category" v-model="category"
                class="h-11 rounded border border-white/10 bg-flixer-surface px-3 text-sm text-white outline-none focus:border-flixer-accent/70 focus:ring-2 focus:ring-flixer-accent/20">
                <option value="">{{ t('epg.allCategories') }}</option>
                <option v-for="option in categories" :key="option" :value="option">{{ option }}</option>
              </select>
              <button type="button"
                class="inline-flex h-11 items-center justify-center gap-2 rounded border px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent"
                :class="favoritesOnly ? 'border-flixer-accent/60 bg-flixer-accent/15 text-white' : 'border-white/10 bg-white/[0.03] text-flixer-muted hover:text-white'"
                :aria-pressed="favoritesOnly" @click="favoritesOnly = !favoritesOnly">
                <Icon icon="lucide:star" class="size-4"
                  :class="favoritesOnly ? 'fill-flixer-accent text-flixer-accent' : ''" aria-hidden="true" />{{
                    t('epg.favorites') }}
              </button>
            </div>
          </div>

          <div
            class="flex flex-wrap items-center justify-between gap-3 rounded border border-white/10 bg-flixer-surface/50 px-3 py-2.5">
            <div class="flex items-center gap-2">
              <button type="button"
                class="grid size-9 place-items-center rounded text-flixer-muted transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent"
                :aria-label="t('epg.previous')" @click="shiftWindow(-30)">
                <Icon icon="lucide:chevron-left" class="size-5" aria-hidden="true" />
              </button>
              <span class="min-w-36 text-center text-sm font-semibold text-white">{{ formatTime(guideStart.getTime(), {
                month:
                  'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) }} – {{ formatTime(windowEnd, {
                  month:
                    'short',
                  day: 'numeric', hour: 'numeric', minute: '2-digit' }) }}</span>
              <button type="button"
                class="grid size-9 place-items-center rounded text-flixer-muted transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent"
                :aria-label="t('epg.next')" @click="shiftWindow(30)">
                <Icon icon="lucide:chevron-right" class="size-5" aria-hidden="true" />
              </button>
              <span class="hidden text-xs text-flixer-muted sm:inline">{{ t('epg.timeZone') }}</span>
            </div>
            <p v-if="data" class="text-xs text-flixer-muted">{{ t('epg.showingChannels', {
              shown:
                showingChannels.toLocaleString(locale), total: data.totalChannels.toLocaleString(locale) }) }}</p>
          </div>
        </div>

        <div v-if="loading && !data"
          class="mt-4 grid min-h-64 place-items-center rounded border border-white/10 bg-flixer-surface/40 p-8 text-center"
          role="status" aria-busy="true">
          <div>
            <Icon icon="lucide:loader-circle"
              class="mx-auto size-8 animate-spin text-flixer-accent motion-reduce:animate-none" aria-hidden="true" />
            <p class="mt-4 text-sm text-flixer-muted">{{ t('epg.loading') }}</p>
            <p class="mt-2 text-xs text-flixer-muted">{{ t('epg.feedNote') }}</p>
          </div>
        </div>

        <div v-else-if="loadError" class="mt-4 rounded border border-red-400/20 bg-red-500/5 p-8 text-center">
          <Icon icon="lucide:cloud-off" class="mx-auto size-8 text-red-300" aria-hidden="true" />
          <p class="mt-3 text-sm text-red-200">{{ loadError }}</p>
          <button type="button"
            class="mt-4 rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent"
            @click="load">{{ t('epg.retry') }}</button>
        </div>

        <template v-else>
          <div v-if="favoritesOnly && filteredChannels.length === 0"
            class="mt-4 rounded border border-white/10 bg-flixer-surface/40 p-10 text-center">
            <Icon icon="lucide:star" class="mx-auto size-8 text-flixer-accent" aria-hidden="true" />
            <p class="mt-3 text-sm text-flixer-muted">{{ t('epg.favoriteEmpty') }}</p>
          </div>
          <div v-else-if="filteredChannels.length === 0"
            class="mt-4 rounded border border-white/10 bg-flixer-surface/40 p-10 text-center text-sm text-flixer-muted">
            {{ t('epg.noResults') }}</div>

          <div v-else
            class="guide-frame mt-4 rounded border border-white/10 bg-flixer-surface/50 shadow-xl shadow-black/10">
            <div ref="guideScroller" class="guide-scroll overflow-x-auto overscroll-x-contain"
              @scroll.passive="onGuideScroll">
              <div class="guide-layout min-w-max"
                :style="{ '--guide-width': `${timeSlots.length * SLOT_WIDTH}px`, '--slot-count': timeSlots.length }">
                <div
                  class="guide-channel-heading sticky left-0 z-20 flex items-end border-b border-r border-white/10 bg-flixer-surface px-4 pb-3 pt-4">
                  <span class="text-xs font-semibold uppercase tracking-wider text-flixer-muted">{{
                    t('epg.channelsHeading') }}</span>
                </div>
                <div
                  class="guide-time-track relative flex border-b border-r border-white/10 bg-flixer-surface text-xs font-medium text-flixer-muted"
                  :style="{ width: `${timeSlots.length * SLOT_WIDTH}px` }">
                  <div v-for="(slot, index) in timeSlots" :key="slot"
                    class="relative flex h-14 shrink-0 flex-col justify-center border-r border-white/[0.07] px-3"
                    :class="isDayStart(slot) ? 'border-l border-l-flixer-accent/40 bg-white/[0.03]' : ''"
                    :style="{ width: `${SLOT_WIDTH}px` }">
                    <span v-if="isDayStart(slot)"
                      class="inline-flex w-fit items-center gap-1 rounded bg-flixer-accent/10 px-1 py-0.5 text-[9px] font-semibold leading-3 text-flixer-accent"><span
                        class="size-1 rounded-full bg-flixer-accent"></span>{{ formatDay(slot) }}</span>
                    <span v-else>{{ formatTime(slot, { hour: 'numeric', minute: '2-digit' }) }}</span>
                    <span v-if="index === 0"
                      class="absolute bottom-1 left-0 text-[9px] uppercase tracking-wider opacity-60">{{
                        t('epg.halfHour') }}</span>
                  </div>
                  <span v-if="nowPosition !== undefined"
                    class="pointer-events-none absolute bottom-0 top-0 z-10 w-px bg-flixer-accent shadow-[0_0_10px_rgba(129,140,248,0.8)]"
                    :style="{ left: `${nowPosition}%` }"></span>
                </div>
                <template v-for="channel in visibleChannels" :key="channel.id">
                  <div
                    class="guide-channel sticky left-0 z-10 flex min-w-0 items-center gap-3 border-b border-r border-white/[0.07] bg-flixer-surface/95 px-3 py-2 backdrop-blur">
                    <div
                      class="grid size-10 shrink-0 place-items-center overflow-hidden rounded border border-white/10 bg-white/5">
                      <img v-if="channel.icon && !imageFailures.has(channel.id)" :src="channel.icon"
                        :alt="t('epg.channelLogo', { channel: channel.name })" class="size-full object-contain p-1"
                        loading="lazy" @error="markImageFailed(channel.id)" />
                      <span v-else class="text-xs font-bold text-white/80">{{ channel.name.slice(0, 2).toUpperCase()
                        }}</span>
                    </div>
                    <span class="min-w-0 flex-1">
                      <span class="block truncate text-xs font-semibold text-white sm:text-sm" :title="channel.name">{{
                        channel.name }}</span>
                      <span v-if="channel.alternateNames.length"
                        class="mt-0.5 block truncate text-[9px] text-flixer-muted"
                        :title="channel.alternateNames.join(' · ')">{{ channel.alternateNames.join(' · ') }}</span>
                    </span>
                    <button type="button"
                      class="grid size-8 shrink-0 place-items-center rounded text-flixer-muted transition hover:bg-white/10 hover:text-flixer-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent"
                      :aria-label="t(favorites.has(channel.id) ? 'epg.unfavorite' : 'epg.favorite', { channel: channel.name })"
                      :aria-pressed="favorites.has(channel.id)" @click="toggleFavorite(channel)">
                      <Icon icon="lucide:star" class="size-4"
                        :class="favorites.has(channel.id) ? 'fill-amber-300 text-amber-300' : ''" aria-hidden="true" />
                    </button>
                  </div>
                  <div
                    class="guide-track relative border-b border-white/[0.07] bg-[linear-gradient(to_right,rgba(255,255,255,.025)_1px,transparent_1px)]"
                    :style="{ backgroundSize: `${100 / timeSlots.length}% 100%` }">
                    <span v-if="nowPosition !== undefined"
                      class="pointer-events-none absolute inset-y-0 z-[1] w-px bg-flixer-accent/50"
                      :style="{ left: `${nowPosition}%` }"></span>
                    <button v-for="programme in programmesFor(channel)" :key="programmeKey(programme)" type="button"
                      class="group absolute inset-y-1 z-[2] overflow-hidden border px-3 py-2 text-left transition hover:z-[3] hover:brightness-110 focus-visible:z-[4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                      :class="isOnNow(programme) ? 'border-flixer-accent/70 bg-flixer-primary/35 shadow-[inset_0_0_0_1px_rgba(129,140,248,.12)]' : 'border-white/10 bg-white/[0.055] hover:border-white/25'"
                      :style="programmeStyle(programme)"
                      :aria-label="`${programme.title}, ${formatTime(programme.start)} to ${formatTime(programme.stop)}${programme.subtitle ? `, ${programme.subtitle}` : ''}`"
                      @click="selectedProgramme = programme">
                      <span v-if="isOnNow(programme)"
                        class="flex items-center gap-1 text-[9px] font-bold tracking-wider text-flixer-accent"><span
                          class="size-1.5 rounded-full bg-flixer-accent"></span>{{ t('epg.live') }}</span>
                      <span class="mt-0.5 block truncate text-xs font-semibold leading-4 text-white">{{ programme.title
                        }}</span>
                      <span v-if="programme.subtitle" class="mt-1 block truncate text-[10px] text-flixer-muted">{{
                        programme.subtitle }}</span>
                      <span
                        class="programme-hover-indicator absolute inset-x-0 bottom-0 h-0.5 origin-left bg-flixer-accent"
                        :style="programmeHoverStyle(programme)"></span>
                    </button>
                  </div>
                  <Transition name="guide-details">
                    <div v-if="selectedProgramme?.channelId === channel.id" :key="channel.id"
                      class="guide-details-row border-b border-white/10" aria-live="polite">
                      <section
                        class="guide-details-content border-l-2 border-flixer-accent bg-linear-to-r from-flixer-primary/15 via-flixer-surface/95 to-flixer-surface px-4 py-4 sm:px-6">
                        <Transition name="guide-details-fade" mode="out-in">
                          <div :key="programmeKey(selectedProgramme)"
                            class="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                            <div class="min-w-0 flex-1">
                              <p class="text-[10px] font-semibold tracking-[0.16em] text-flixer-accent">{{
                                t(isOnNow(selectedProgramme) ? 'epg.onNow' : 'epg.programmeDetails') }}</p>
                              <h2 class="mt-1 text-lg font-bold text-white">{{ selectedProgramme.title }}</h2>
                              <p class="mt-1 text-xs text-flixer-muted">
                                {{ channel.name }} · {{ formatTime(selectedProgramme.start) }}–{{
                                formatTime(selectedProgramme.stop) }}
                                <template v-if="selectedProgramme.category"> · {{ selectedProgramme.category
                                  }}</template>
                              </p>
                            </div>
                            <p class="line-clamp-3 min-w-0 flex-1 text-sm leading-5 text-flixer-muted">{{
                              selectedProgramme.description ||
                              t('epg.noDescription') }}</p>
                            <div class="flex shrink-0 items-center gap-3">
                              <button type="button" :disabled="!channel.watchable || openingChannelId === channel.id"
                                :title="channel.watchable ? t('epg.watchLive') : t('epg.watchUnavailable')"
                                class="inline-flex min-h-9 items-center gap-2 rounded border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent disabled:cursor-not-allowed disabled:opacity-50"
                                @click="watchChannel(channel)">
                                <Icon :icon="openingChannelId === channel.id ? 'lucide:loader-circle' : 'lucide:play'"
                                  class="size-3.5 text-flixer-accent"
                                  :class="openingChannelId === channel.id && 'animate-spin'" aria-hidden="true" />{{
                                    t(openingChannelId === channel.id ? 'epg.openingPlayer' : 'epg.watchLive') }}
                              </button>
                              <button type="button"
                                class="grid size-9 place-items-center rounded text-flixer-muted transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent"
                                :aria-label="t('epg.closeDetails')" @click="selectedProgramme = null">
                                <Icon icon="lucide:x" class="size-4" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        </Transition>
                      </section>
                    </div>
                  </Transition>
                </template>
              </div>
            </div>
          </div>

          <div v-if="loadingTime || timeLoadError"
            class="mt-2 flex min-h-8 items-center justify-center gap-2 text-xs text-flixer-muted" aria-live="polite">
            <Icon v-if="loadingTime" icon="lucide:loader-circle" class="size-3.5 animate-spin text-flixer-accent"
              aria-hidden="true" />
            <span v-if="loadingTime">{{ t('epg.loading') }}</span>
            <template v-if="timeLoadError">
              <span role="alert">{{ timeLoadError }}</span>
              <button type="button" class="font-semibold text-flixer-accent hover:text-white"
                @click="retryVisibleTimeChunks">{{ t('epg.retry') }}</button>
            </template>
          </div>

          <div v-if="canLoadMoreChannels" :ref="setSentinel" class="grid min-h-12 place-items-center"
            aria-live="polite">
            <p v-if="loadingMore" class="text-xs text-flixer-muted">{{ t('epg.loading') }}</p>
            <button v-else-if="loadMoreError" type="button"
              class="text-xs font-semibold text-flixer-accent hover:text-white" @click="loadNextPage">{{ t('epg.retry')
              }}</button>
            <span v-else class="h-px"></span>
          </div>
        </template>
      </section>
    </main>

    <MobileTabBar :tabs="mobileTabs" />
  </div>
</template>

<style scoped>
.guide-frame {
  overflow: clip;
}

.guide-layout {
  display: grid;
  grid-template-columns: 14rem var(--guide-width);
  --channel-width: 14rem;
}

.guide-channel-heading,
.guide-channel,
.guide-time-track {
  min-width: 0;
}

.guide-channel-heading,
.guide-channel {
  grid-column: 1;
}

.guide-time-track,
.guide-track {
  grid-column: 2;
}

.guide-channel-heading {
  height: 3.5rem;
  border-top-left-radius: 1rem;
}

.guide-time-track {
  height: 3.5rem;
  border-top-right-radius: 1rem;
}

.guide-channel {
  grid-column: 1;
  height: 5.25rem;
}

.guide-track {
  grid-column: 2;
  height: 5.25rem;
  background-image: linear-gradient(to right, rgb(255 255 255 / 0.06) 1px, transparent 1px);
}

.guide-details-row {
  grid-column: 1 / -1;
}

.programme-hover-indicator {
  width: 0;
  transition: width 180ms ease-out;
}

.group:hover .programme-hover-indicator,
.group:focus-visible .programme-hover-indicator {
  width: var(--hover-progress);
}

.guide-details-content {
  position: sticky;
  left: 0;
  width: calc(100vw - 3rem);
  max-width: 110rem;
}

.guide-details-enter-active,
.guide-details-leave-active {
  overflow: hidden;
  transition:
    max-height 220ms ease,
    opacity 180ms ease,
    transform 220ms ease;
}

.guide-details-enter-from,
.guide-details-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-0.5rem);
}

.guide-details-enter-to,
.guide-details-leave-from {
  max-height: 14rem;
  opacity: 1;
  transform: translateY(0);
}

.guide-details-fade-enter-active,
.guide-details-fade-leave-active {
  transition: opacity 150ms ease;
}

.guide-details-fade-enter-from,
.guide-details-fade-leave-to {
  opacity: 0;
}

.guide-details-fade-enter-to,
.guide-details-fade-leave-from {
  opacity: 1;
}

@media (max-width: 639px) {
  .guide-layout {
    grid-template-columns: 10rem var(--guide-width);
    --channel-width: 10rem;
  }

  .guide-channel {
    gap: 0.5rem;
    padding-inline: 0.5rem;
  }

  .guide-details-content {
    width: calc(100vw - 1.5rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .programme-hover-indicator {
    transition: none;
  }

  .guide-details-enter-active,
  .guide-details-leave-active {
    transition: none;
  }

  .guide-details-fade-enter-active,
  .guide-details-fade-leave-active {
    transition: none;
  }
}
</style>
