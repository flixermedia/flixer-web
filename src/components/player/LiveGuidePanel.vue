<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getGuide, type EpgChannel, type EpgData, type EpgProgramme } from '../../api/guide'

const props = defineProps<{
  currentChannelId: string
  switchingChannelId: string
  switchError: string
}>()
const emit = defineEmits<{
  close: []
  'select-channel': [channel: EpgChannel]
}>()

const { t, locale } = useI18n()
const data = ref<EpgData | null>(null)
const now = ref(Date.now())
const loading = ref(false)
const loadingMore = ref(false)
const error = ref('')
const query = ref('')
const failedImages = ref(new Set<string>())
let controller: AbortController | undefined
let clockTimer: ReturnType<typeof setInterval> | undefined

const channels = computed(() => {
  const search = query.value.trim().toLocaleLowerCase(locale.value)
  return (data.value?.channels ?? []).filter((channel) => !search || `${channel.name} ${channel.alternateNames.join(' ')}`.toLocaleLowerCase(locale.value).includes(search))
})
const hasMore = computed(() => Boolean(data.value && data.value.channels.length < data.value.totalChannels))
const programmesByChannel = computed(() => {
  const result = new Map<string, EpgProgramme[]>()
  for (const programme of data.value?.programmes ?? []) {
    const channelProgrammes = result.get(programme.channelId) ?? []
    channelProgrammes.push(programme)
    result.set(programme.channelId, channelProgrammes)
  }
  return result
})
const currentChannel = computed(() => data.value?.channels.find((channel) => channel.id === props.currentChannelId))
const currentProgramme = computed(() => programmeNow(props.currentChannelId))
const nextProgramme = computed(() => programmeNext(props.currentChannelId))

function programmeNow(channelId: string): EpgProgramme | undefined {
  return programmesByChannel.value.get(channelId)?.find((programme) => programme.start <= now.value && programme.stop > now.value)
}

function programmeNext(channelId: string): EpgProgramme | undefined {
  return programmesByChannel.value
    .get(channelId)
    ?.filter((programme) => programme.start > now.value)
    .sort((left, right) => left.start - right.start)[0]
}

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat(locale.value, { hour: 'numeric', minute: '2-digit' }).format(timestamp)
}

function programmeProgress(programme: EpgProgramme): number {
  return Math.max(0, Math.min(100, ((now.value - programme.start) / (programme.stop - programme.start)) * 100))
}

function imageFailed(channelId: string) {
  failedImages.value = new Set(failedImages.value).add(channelId)
}

function guideWindow() {
  const from = now.value - 2 * 60 * 60_000
  return { from: new Date(from), to: new Date(from + 26 * 60 * 60_000) }
}

async function loadFirstPage() {
  controller?.abort()
  controller = new AbortController()
  const activeController = controller
  loading.value = true
  loadingMore.value = false
  error.value = ''
  data.value = null
  try {
    const { from, to } = guideWindow()
    data.value = await getGuide(from, to, 0, activeController.signal, 50)
    if (activeController.signal.aborted) return
    while (data.value.channels.length < data.value.totalChannels && !data.value.channels.some((channel) => channel.id === props.currentChannelId)) {
      const previousChannelCount = data.value.channels.length
      await loadNextPage(activeController)
      if (activeController.signal.aborted || error.value || !data.value || data.value.channels.length <= previousChannelCount) return
    }
  } catch (cause) {
    if (activeController.signal.aborted) return
    console.error('[live-guide] failed to load guide channels', cause)
    error.value = t('player.liveGuideLoadError')
  } finally {
    if (!activeController.signal.aborted) loading.value = false
  }
}

async function loadNextPage(activeController = controller) {
  if (!data.value || !activeController || loadingMore.value || !hasMore.value) return
  const offset = data.value.channels.length
  loadingMore.value = true
  try {
    const { from, to } = guideWindow()
    const page = await getGuide(from, to, offset, activeController.signal, 50)
    if (activeController.signal.aborted || activeController !== controller) return
    const programmes = new Map(data.value.programmes.map((programme) => [`${programme.channelId}:${programme.start}`, programme]))
    for (const programme of page.programmes) programmes.set(`${programme.channelId}:${programme.start}`, programme)
    data.value = {
      ...data.value,
      channels: [...data.value.channels, ...page.channels],
      programmes: [...programmes.values()],
    }
  } catch (cause) {
    if (activeController.signal.aborted) return
    console.error('[live-guide] failed to load more guide channels', cause)
    error.value = t('player.liveGuideLoadError')
  } finally {
    if (!activeController.signal.aborted && activeController === controller) loadingMore.value = false
  }
}

function retry() {
  void loadFirstPage()
}

watch(
  () => props.currentChannelId,
  (channelId) => {
    if (!data.value || data.value.channels.some((channel) => channel.id === channelId)) return
    void loadFirstPage()
  },
)

onMounted(() => {
  void loadFirstPage()
  clockTimer = setInterval(() => {
    now.value = Date.now()
  }, 30_000)
})

onBeforeUnmount(() => {
  controller?.abort()
  if (clockTimer) clearInterval(clockTimer)
})
</script>

<template>
  <aside class="absolute inset-0 z-30 flex flex-col border-l border-white/10 bg-flixer-background/95 text-flixer-text shadow-2xl shadow-black/60 backdrop-blur-xl sm:inset-y-4 sm:left-auto sm:right-4 sm:w-[26rem] sm:rounded sm:border">
    <header class="flex shrink-0 items-center gap-3 border-b border-white/10 px-4 py-3">
      <div class="grid size-9 place-items-center rounded bg-flixer-accent/15 text-flixer-accent">
        <Icon icon="lucide:tv" class="size-5" aria-hidden="true" />
      </div>
      <div class="min-w-0 flex-1">
        <h2 class="truncate text-sm font-semibold text-white">{{ t('player.liveGuide') }}</h2>
        <p class="truncate text-xs text-flixer-muted">{{ t('player.liveGuideChannels', { count: data?.totalChannels ?? 0 }) }}</p>
      </div>
      <button type="button" class="grid size-9 place-items-center rounded text-flixer-muted transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-flixer-accent" :aria-label="t('player.closeLiveGuide')" @click="emit('close')">
        <Icon icon="lucide:x" class="size-5" aria-hidden="true" />
      </button>
    </header>

    <div v-if="currentChannel" class="shrink-0 border-b border-white/10 bg-white/[0.03] p-4">
      <div class="flex items-center gap-3">
        <div class="grid size-11 shrink-0 place-items-center overflow-hidden rounded border border-white/10 bg-white/5">
          <img v-if="currentChannel.icon && !failedImages.has(currentChannel.id)" :src="currentChannel.icon" :alt="t('epg.channelLogo', { channel: currentChannel.name })" class="size-full object-contain p-1" @error="imageFailed(currentChannel.id)" />
          <span v-else class="text-xs font-bold text-white/80">{{ currentChannel.name.slice(0, 2).toUpperCase() }}</span>
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-flixer-accent">{{ t('player.liveGuideNowOn') }}</p>
          <h3 class="truncate text-sm font-semibold text-white">{{ currentChannel.name }}</h3>
        </div>
        <span class="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-200"> <span class="size-1.5 animate-pulse rounded-full bg-red-400"></span>{{ t('epg.live') }} </span>
      </div>
      <div v-if="currentProgramme" class="mt-4">
        <div class="flex items-start justify-between gap-3">
          <h4 class="min-w-0 flex-1 text-base font-semibold leading-5 text-white">{{ currentProgramme.title }}</h4>
          <span class="shrink-0 text-[11px] tabular-nums text-flixer-muted">{{ formatTime(currentProgramme.start) }}–{{ formatTime(currentProgramme.stop) }}</span>
        </div>
        <p v-if="currentProgramme.subtitle" class="mt-1 text-xs text-flixer-muted">{{ currentProgramme.subtitle }}</p>
        <p v-if="currentProgramme.description" class="mt-2 line-clamp-3 text-xs leading-5 text-flixer-muted">{{ currentProgramme.description }}</p>
        <div class="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
          <div class="h-full rounded-full bg-flixer-accent" :style="{ width: `${programmeProgress(currentProgramme)}%` }"></div>
        </div>
        <p v-if="nextProgramme" class="mt-3 truncate text-xs text-flixer-muted">
          <span class="font-semibold text-flixer-accent">{{ t('epg.nextUp') }}</span>
          · {{ formatTime(nextProgramme.start) }} {{ nextProgramme.title }}
        </p>
      </div>
      <p v-else class="mt-3 text-xs text-flixer-muted">{{ t('epg.noLiveProgramme') }}</p>
      <p v-if="!currentProgramme && nextProgramme" class="mt-3 truncate text-xs text-flixer-muted">
        <span class="font-semibold text-flixer-accent">{{ t('epg.nextUp') }}</span>
        · {{ formatTime(nextProgramme.start) }} {{ nextProgramme.title }}
      </p>
    </div>

    <div class="shrink-0 px-4 py-3">
      <label class="relative block">
        <span class="sr-only">{{ t('player.liveGuideSearch') }}</span>
        <Icon icon="lucide:search" class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-flixer-muted" aria-hidden="true" />
        <input v-model="query" type="search" :placeholder="t('player.liveGuideSearch')" class="h-10 w-full rounded border border-white/10 bg-white/[0.04] pl-9 pr-3 text-sm text-white outline-none placeholder:text-flixer-muted focus:border-flixer-accent/70 focus:ring-2 focus:ring-flixer-accent/20" />
      </label>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-3" :aria-label="t('player.liveGuideChannels', { count: data?.totalChannels ?? 0 })">
      <div v-if="loading && !data" class="grid min-h-40 place-items-center text-center text-xs text-flixer-muted" role="status">
        <div>
          <Icon icon="lucide:loader-circle" class="mx-auto size-6 animate-spin text-flixer-accent" aria-hidden="true" />
          <p class="mt-3">{{ t('epg.loading') }}</p>
        </div>
      </div>
      <div v-else-if="error && !data" class="grid min-h-40 place-items-center p-4 text-center">
        <div>
          <p role="alert" class="text-xs text-red-200">{{ error }}</p>
          <button type="button" class="mt-3 rounded bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15" @click="retry">{{ t('epg.retry') }}</button>
        </div>
      </div>
      <div v-else-if="channels.length === 0" class="p-6 text-center text-xs text-flixer-muted">{{ t('epg.noResults') }}</div>
      <div v-else class="space-y-1">
        <button v-for="channel in channels" :key="channel.id" type="button" :disabled="!channel.watchable || Boolean(switchingChannelId)" class="flex w-full items-center gap-3 rounded px-2.5 py-2 text-left transition hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-flixer-accent disabled:cursor-not-allowed disabled:opacity-50" :class="channel.id === currentChannelId ? 'bg-flixer-accent/10 ring-1 ring-flixer-accent/30' : ''" :aria-current="channel.id === currentChannelId ? 'true' : undefined" @click="emit('select-channel', channel)">
          <div class="grid size-10 shrink-0 place-items-center overflow-hidden rounded border border-white/10 bg-white/5">
            <img v-if="channel.icon && !failedImages.has(channel.id)" :src="channel.icon" :alt="t('epg.channelLogo', { channel: channel.name })" class="size-full object-contain p-1" loading="lazy" @error="imageFailed(channel.id)" />
            <span v-else class="text-[10px] font-bold text-white/70">{{ channel.name.slice(0, 2).toUpperCase() }}</span>
          </div>
          <span class="min-w-0 flex-1">
            <span class="flex items-center gap-2">
              <span class="truncate text-xs font-semibold text-white">{{ channel.name }}</span>
              <Icon v-if="channel.id === currentChannelId" icon="lucide:volume-2" class="size-3.5 shrink-0 text-flixer-accent" :aria-label="t('player.liveGuideCurrentlyPlaying')" />
              <Icon v-else-if="switchingChannelId === channel.id" icon="lucide:loader-circle" class="size-3.5 shrink-0 animate-spin text-flixer-accent" :aria-label="t('player.liveGuideSwitching')" />
            </span>
            <span class="mt-0.5 block truncate text-[11px] text-flixer-muted">
              {{ programmeNow(channel.id)?.title ?? t('epg.noLiveProgramme') }}
            </span>
          </span>
          <span class="shrink-0 text-[10px] text-flixer-muted">{{ programmeNow(channel.id) ? t('epg.live') : '' }}</span>
        </button>

        <p v-if="switchError" role="alert" class="mx-2 rounded bg-red-500/10 p-2 text-xs text-red-200">{{ switchError }}</p>
        <p v-if="error && data" role="alert" class="mx-2 rounded bg-red-500/10 p-2 text-xs text-red-200">{{ error }}</p>
        <button v-if="hasMore" type="button" :disabled="loadingMore" class="flex min-h-10 w-full items-center justify-center gap-2 rounded text-xs font-semibold text-flixer-accent transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50" @click="loadNextPage()">
          <Icon v-if="loadingMore" icon="lucide:loader-circle" class="size-3.5 animate-spin" aria-hidden="true" />
          {{ loadingMore ? t('epg.loading') : t('player.liveGuideLoadMore') }}
        </button>
      </div>
    </div>
  </aside>
</template>
