<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getItemPlaybackInfo, getPreferences, getStreamInfo, getWatchProgress, saveWatchProgress, updatePreferences, type PlaybackInfo, type StreamInfo } from '../../api'
import { expectedPosition, useParty } from '../../composables/useParty'
import { notify } from '../../composables/notify'
import { handlePaymentRequired } from '../../composables/usePayments'
import { useVideoOverlay } from '../../composables/useVideoOverlay'
import { useVideoQueue } from '../../composables/useVideoQueue'
import VideoPlayer from './VideoPlayer.vue'
import UserMediaListView from '../../views/UserMediaListView.vue'
import PlayerSkeleton from './PlayerSkeleton.vue'
import { isNativeApp } from '../../platform/serverConnection'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import { getGuideChannelPlaybackInfo, type EpgChannel, type GuidePlaybackInfo } from '../../api/guide'
import LiveGuidePanel from './LiveGuidePanel.vue'
import AdvertisementPlayer from './AdvertisementPlayer.vue'
import type { PlaybackAdvertisement } from '../../api/advertisements'
import type { ViewingTarget } from '../../api/analytics'
import { publishRemotePlayback, registerRemoteCommandHandler, registerRemotePreviewHandler } from '../../composables/useRemotePlayback'
import { isTvMode } from '../../platform/tvMode'

const NativeVideoPlayer = defineAsyncComponent({
  loader: () => import('./NativeVideoPlayer.vue'),
  onError(cause, _retry, fail) {
    console.error('[player] Could not load the native video player', cause)
    error.value = t('player.videoCouldNotPlay')
    fail()
  },
})

const props = withDefaults(defineProps<{ itemId: string; title: string; startAtSeconds?: number; autoplay?: boolean; livePlayback?: GuidePlaybackInfo; startMini?: boolean; page?: boolean }>(), { autoplay: true, startMini: false, page: false })
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const playback = ref<PlaybackInfo | GuidePlaybackInfo | null>(null)
const info = ref<StreamInfo | null>(null)
const autoSkipIntroCredits = ref(true)
const defaultAudioLanguage = ref('')
const error = ref('')
const liveTitle = ref(props.title)
const liveGuideOpen = ref(false)
const videoQueueOpen = ref(false)
const switchingChannelId = ref('')
const liveGuideError = ref('')
const startAt = ref(0)
const mini = ref(props.startMini && !isTvMode.value)
const frame = ref<HTMLElement>()
let previousFocus: HTMLElement | null = null
const activeAd = ref<PlaybackAdvertisement | null>(null)
const adBreaks = ref<PlaybackAdvertisement[]>([])
const consumedBreaks = new Set<number>()
const resumePlaying = ref(props.autoplay)
const party = useParty()
const nativePlayback = computed(() => isNativeApp() && !isTvMode.value)
const videoPlayer = ref<{
  getState: () => { playing: boolean; position: number }
  applyRemote: (state: { playing: boolean; position: number }) => void
  getRemoteControlsState?: () => Record<string, unknown>
  applyRemoteCommand?: (command: import('../../composables/useRemotePlayback').RemotePlaybackCommand) => boolean | Promise<boolean>
  getRemoteTrickplayPreview?: (position: number) => Promise<string | null>
}>()
const videoParty = computed(() => party.party.value?.kind === 'video')
// Guests follow the host, so their own controls are disabled.
const locked = computed(() => videoParty.value && party.isGuest.value)
const { play } = useVideoOverlay()
const videoQueue = useVideoQueue()
onMounted(() => void videoQueue.load().catch(() => undefined))

function isGuidePlayback(value: PlaybackInfo | GuidePlaybackInfo | null): value is GuidePlaybackInfo {
  return Boolean(value && 'playSessionId' in value)
}

// Movie playback responses also have a playSessionId; only the explicit guide prop marks live playback.
const livePlayback = computed(() => (props.livePlayback && isGuidePlayback(playback.value) ? playback.value : null))
const isLive = computed(() => Boolean(livePlayback.value))
const cropCategory = computed(() => !isLive.value && playback.value && 'itemType' in playback.value
  ? playback.value.itemType === 'movie' ? 'movies' : playback.value.itemType === 'episode' ? 'tv' : undefined
  : undefined)
const currentTitle = computed(() => (isLive.value ? liveTitle.value : props.title))
const analyticsTarget = computed<ViewingTarget>(() => livePlayback.value
  ? { kind: 'live', channelId: livePlayback.value.mediaSource.id, channelName: liveTitle.value }
  : { kind: 'video', itemId: props.itemId })

/** Closing the player as host ends the party for everyone. */
function closeOverlay() {
  if (videoParty.value && party.isHost.value) void party.leave()
  emit('close')
}
const chapters = computed(() => (playback.value && 'chapters' in playback.value ? playback.value.chapters : []))
const segments = computed(() => (playback.value && 'segments' in playback.value ? playback.value.segments : []))
const nextEpisode = computed(() => (playback.value && 'nextEpisode' in playback.value ? playback.value.nextEpisode : null))
const container = computed<'m3u8' | 'mpd'>(() => livePlayback.value?.mediaSource.container ?? 'm3u8')
const nextLabel = computed(() => {
  if (!isLive.value && !videoParty.value && videoQueue.items.value[0]) return videoQueue.items.value[0].title
  const next = nextEpisode.value
  if (!next) return undefined
  const code = next.seasonNumber != null && next.episodeNumber != null ? `S${next.seasonNumber}:E${next.episodeNumber} ` : ''
  return `${code}${next.title}`
})

// Swapping the playing item reloads in place, so a corner player stays in the corner.
async function playNext() {
  const queued = !isLive.value && !videoParty.value ? videoQueue.items.value[0] : undefined
  if (queued) {
    try {
      if (await videoQueue.remove(queued.id)) play({ id: queued.id, title: queued.title })
    } catch (error) {
      notify.error(describeRequestError(error, t('userMedia.error')))
    }
    return
  }
  const next = nextEpisode.value
  if (next) play({ id: next.id, title: next.title })
}

function onControl(state: { action: 'play' | 'pause' | 'seek'; playing: boolean; position: number }) {
  if (!activeAd.value && videoParty.value && party.isHost.value) {
    if (!party.sendVideoCommand({ action: state.action, position: state.position }, props.itemId)) syncVideo()
  }
}

function syncVideo() {
  const state = party.latest.value
  if (activeAd.value || !videoParty.value || !state || !videoPlayer.value) return
  videoPlayer.value.applyRemote({ playing: state.party.playing, position: expectedPosition(state) })
}

watch([() => party.latest.value, videoPlayer], syncVideo, { flush: 'post' })

let partyBeat: ReturnType<typeof setInterval> | undefined
let remotePlaybackBeat: ReturnType<typeof setInterval> | undefined

function publishVideoState() {
  const state = videoPlayer.value?.getState()
  if (activeAd.value || !playback.value || !info.value || !state) {
    publishRemotePlayback(null)
    return
  }
  publishRemotePlayback({
    kind: 'video',
    title: currentTitle.value,
    itemId: props.itemId,
    playing: state.playing,
    position: state.position,
    duration: info.value.source.durationSeconds,
    ...videoPlayer.value?.getRemoteControlsState?.(),
  })
}

const unregisterRemoteVideo = registerRemoteCommandHandler(async (command) => {
  const player = videoPlayer.value
  const state = player?.getState()
  if (!player || !state || locked.value) return false
  if (player.applyRemoteCommand) return player.applyRemoteCommand(command)
  if (command.action === 'volume' || command.action === 'audio-track' || command.action === 'subtitle' || command.action === 'skip') return false
  player.applyRemote({
    playing: command.action === 'play' ? true : command.action === 'pause' ? false : state.playing,
    position: command.action === 'seek' ? command.position : state.position,
  })
  publishVideoState()
  return true
})

const unregisterRemotePreview = registerRemotePreviewHandler((position) => videoPlayer.value?.getRemoteTrickplayPreview?.(position) ?? Promise.resolve(null))

function onProgress(position: number, duration: number) {
  if (isLive.value) return
  void saveWatchProgress(props.itemId, position, duration).catch(() => { })
}

function onPosition(position: number) {
  if (activeAd.value || !Number.isFinite(position)) return
  const ad = adBreaks.value.find((entry) => entry.atSeconds > 0 && entry.atSeconds <= position && !consumedBreaks.has(entry.atSeconds))
  if (!ad) return
  consumedBreaks.add(ad.atSeconds)
  const state = videoPlayer.value?.getState()
  startAt.value = state?.position ?? position
  resumePlaying.value = state?.playing ?? true
  if (videoParty.value && party.isHost.value) {
    if (resumePlaying.value) party.sendVideoCommand({ action: 'pause', position: startAt.value }, props.itemId)
    party.sendVideoCommand({ action: 'seek', position: startAt.value }, props.itemId)
  }
  if (mini.value) setMini(false)
  activeAd.value = ad
}

function finishAd() {
  const state = party.latest.value
  if (videoParty.value && party.isGuest.value && state && state.party.item.id === props.itemId) {
    startAt.value = expectedPosition(state)
    resumePlaying.value = state.party.playing
  }
  activeAd.value = null
  if (videoParty.value && party.isHost.value && resumePlaying.value) party.sendVideoCommand({ action: 'play', position: startAt.value }, props.itemId)
}

// Explicit geometry in both states so the move to the corner can animate.
const frameStyle = computed(() => {
  if (props.page) return { top: '0px', left: '0px', width: 'calc(100vw / var(--tv-scale, 1))', height: 'calc(100dvh / var(--tv-scale, 1))' }
  if (!mini.value) return { top: '0px', left: '0px', width: '100vw', height: '100dvh' }
  const width = 'min(24rem, 70vw)'
  const height = `calc(${width} * 9 / 16)`
  return { width, height, top: `calc(100dvh - ${height} - 1rem)`, left: `calc(100vw - ${width} - 1rem)` }
})

function setMini(value: boolean) {
  if (value && document.fullscreenElement) void document.exitFullscreen().catch(() => { })
  mini.value = value
  if (value) liveGuideOpen.value = false
  if (value) videoQueueOpen.value = false
  // The page behind a corner player stays scrollable.
  document.body.style.overflow = value ? '' : 'hidden'
}

async function switchLiveChannel(channel: EpgChannel) {
  if (!channel.watchable || switchingChannelId.value) return
  switchingChannelId.value = channel.id
  liveGuideError.value = ''
  const [playbackError, nextPlayback] = await catchError(Promise.resolve().then(() => getGuideChannelPlaybackInfo(channel.id)))
  if (playbackError) {
    console.error('[player] live channel switch failed', playbackError)
    liveGuideError.value = describeRequestError(playbackError, t('player.liveGuidePlaybackError'))
  } else {
    playback.value = nextPlayback
    liveTitle.value = channel.name
    error.value = ''
  }
  switchingChannelId.value = ''
}

function onKeydown(event: KeyboardEvent) {
  // While in browser fullscreen, Escape only leaves fullscreen.
  if (event.key !== 'Escape' || document.fullscreenElement) return
  if (props.page) {
    event.preventDefault()
    closeOverlay()
    return
  }
  if ((nativePlayback.value && adBreaks.value.length === 0) || activeAd.value) return
  if (mini.value) closeOverlay()
  else setMini(true)
}

/** A 402 from the server means the item is behind a paywall: offer to unlock it, and close the player if the viewer declines. */
async function offerUnlock(failure: unknown, itemId: string): Promise<boolean> {
  const unlocked = await handlePaymentRequired(failure, itemId, props.title)
  if (unlocked === false) closeOverlay()
  return unlocked === true
}

async function load(itemId: string, retryAfterPayment = true) {
  playback.value = null
  info.value = null
  error.value = ''
  startAt.value = 0
  activeAd.value = null
  adBreaks.value = []
  consumedBreaks.clear()
  resumePlaying.value = props.autoplay
  if (props.livePlayback) {
    playback.value = props.livePlayback
    info.value = {
      playMethod: 'DirectPlay',
      source: { videoCodec: 'h264', audioCodec: 'aac', width: 0, height: 0, durationSeconds: 0 },
      availableHeights: [],
    }
    return
  }
  // Resume position is best effort and independent of the stream lookups, so it runs alongside them.
  const resumePromise: Promise<number> = props.startAtSeconds !== undefined && props.startAtSeconds !== null
    ? Promise.resolve(props.startAtSeconds)
    : getWatchProgress(itemId).then((progress) => progress.positionSeconds).catch(() => 0)
  const [playbackError, next] = await catchError(Promise.resolve().then(() => getItemPlaybackInfo(itemId)))
  if (playbackError) {
    if (retryAfterPayment && itemId === props.itemId && (await offerUnlock(playbackError, itemId))) return load(itemId, false)
    if (itemId === props.itemId) error.value = t('player.couldNotGetStreamUrl')
    return
  }
  const [streamError, streamInfo] = await catchError(Promise.resolve().then(() => getStreamInfo(next.mediaSource.streamUrl)))
  if (streamError) {
    if (retryAfterPayment && itemId === props.itemId && (await offerUnlock(streamError, itemId))) return load(itemId, false)
    if (itemId === props.itemId) error.value = t('player.couldNotGetStreamUrl')
    return
  }
  // Resuming is best effort; playback still starts from the beginning if this fails.
  const resume = await resumePromise
  if (itemId !== props.itemId) return
  startAt.value = resume
  info.value = streamInfo
  adBreaks.value = next.advertisements ?? []
  for (const ad of adBreaks.value) if (ad.atSeconds > 0 && ad.atSeconds <= resume) consumedBreaks.add(ad.atSeconds)
  const preroll = adBreaks.value.find((ad) => ad.atSeconds === 0)
  if (preroll) {
    consumedBreaks.add(0)
    if (mini.value) setMini(false)
    if (videoParty.value && party.isHost.value && party.latest.value?.party.playing) {
      resumePlaying.value = true
      party.sendVideoCommand({ action: 'pause', position: startAt.value }, props.itemId)
      party.sendVideoCommand({ action: 'seek', position: startAt.value }, props.itemId)
    }
    activeAd.value = preroll
  }
  playback.value = next
}

async function loadPlaybackPreferences() {
  const [preferenceError, preferences] = await catchError(getPreferences())
  if (preferenceError) {
    console.error('[player] playback preferences load failed', preferenceError)
    notify.error(describeRequestError(preferenceError, t('settings.playback.loadFailed')))
    return
  }
  autoSkipIntroCredits.value = preferences.autoSkipIntroCredits ?? true
  defaultAudioLanguage.value = preferences.audioLanguage ?? ''
}

async function updateAutoSkipIntroCredits(enabled: boolean) {
  const previous = autoSkipIntroCredits.value
  autoSkipIntroCredits.value = enabled
  const [preferenceError] = await catchError(updatePreferences({ autoSkipIntroCredits: enabled }))
  if (preferenceError) {
    console.error('[player] playback preference update failed', preferenceError)
    autoSkipIntroCredits.value = previous
    notify.error(describeRequestError(preferenceError, t('settings.playback.saveFailed')))
  }
}

watch(
  () => [props.itemId, props.startAtSeconds],
  () => void load(props.itemId),
)

onMounted(() => {
  if (isTvMode.value && !mini.value) {
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    frame.value?.focus()
  }
  document.body.style.overflow = mini.value ? '' : 'hidden'
  window.addEventListener('keydown', onKeydown)
  void loadPlaybackPreferences().then(() => load(props.itemId))
  partyBeat = setInterval(syncVideo, 5_000)
  remotePlaybackBeat = setInterval(publishVideoState, 2_000)
})

onBeforeUnmount(() => {
  if (isTvMode.value && frame.value?.contains(document.activeElement) && previousFocus?.isConnected) previousFocus.focus()
  document.body.style.overflow = ''
  clearInterval(partyBeat)
  clearInterval(remotePlaybackBeat)
  unregisterRemoteVideo()
  unregisterRemotePreview()
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <component :is="page ? 'main' : 'div'" ref="frame" tabindex="-1" :data-tv-player="page ? '' : undefined"
    class="theme-dark fixed z-[100] overflow-hidden bg-black transition-[top,left,width,height,border-radius,box-shadow] duration-300 ease-in-out motion-reduce:transition-none"
    :class="mini ? 'rounded shadow-2xl shadow-black/70 ring-1 ring-white/15' : ''" :style="frameStyle"
    :role="page ? undefined : 'dialog'" :aria-modal="page ? undefined : !mini" :aria-label="currentTitle">
    <AdvertisementPlayer v-if="activeAd" :key="`${activeAd.id}-${activeAd.atSeconds}`" :ad="activeAd" :item-id="itemId"
      :autoplay="resumePlaying" @started="resumePlaying = true" @done="finishAd" @close="closeOverlay()" />
    <NativeVideoPlayer v-else-if="playback && info && nativePlayback && !isLive && adBreaks.length === 0"
      ref="videoPlayer" :allow-pip="!page" :analytics-target="analyticsTarget" :locked="locked"
      :stream-url="playback.mediaSource.streamUrl" :container="playback.mediaSource.container" :info="info"
      :default-audio-language="defaultAudioLanguage" :title="currentTitle" :start-at="startAt" :autoplay="resumePlaying"
      :next-label="nextLabel" @back="closeOverlay()" @error="error = $event" @progress="onProgress" @control="onControl"
      @next="playNext" />
    <VideoPlayer v-else-if="playback && info" ref="videoPlayer" :crop-category="cropCategory"
      :analytics-target="analyticsTarget" :live="isLive" :live-guide-open="liveGuideOpen" :show-queue="!isTvMode && !videoParty"
      :queue-open="videoQueueOpen" :container="container" :locked="locked" :stream-url="playback.mediaSource.streamUrl"
      :info="info" :default-audio-language="defaultAudioLanguage" :title="currentTitle" :start-at="startAt"
      :autoplay="resumePlaying" :chapters="chapters" :segments="segments"
      :auto-skip-intro-credits="autoSkipIntroCredits" :next-label="nextLabel" show-back :allow-mini="!page" :mini="mini"
      @ready="syncVideo(); publishVideoState()" @position="onPosition" @toggle-mini="setMini(!mini)"
      @toggle-live-guide="liveGuideOpen = !liveGuideOpen" @toggle-queue="videoQueueOpen = !videoQueueOpen"
      @auto-skip-intro-credits-change="updateAutoSkipIntroCredits" @back="closeOverlay()" @error="error = $event"
      @progress="onProgress" @control="onControl" @next="playNext" />
    <LiveGuidePanel v-if="livePlayback && liveGuideOpen && !mini" :current-channel-id="livePlayback.mediaSource.id"
      :switching-channel-id="switchingChannelId" :switch-error="liveGuideError" @close="liveGuideOpen = false"
      @select-channel="switchLiveChannel" />
    <div v-else-if="!activeAd && !(playback && info)" class="relative size-full">
      <p v-if="error" class="absolute inset-0 grid place-items-center p-6 text-center text-sm text-red-400"
        role="alert">{{ error }}</p>
      <PlayerSkeleton v-else />
    </div>
    <p v-if="error && playback && info && nativePlayback && !isLive && adBreaks.length === 0"
      class="absolute inset-x-4 bottom-4 rounded bg-red-950/90 p-3 text-center text-sm text-red-100" role="alert">{{
        error }}</p>
    <div v-if="!isTvMode && videoQueueOpen && !mini && !isLive && !videoParty"
      class="absolute bottom-20 right-3 top-16 z-30 w-96 max-w-[calc(100%-1.5rem)] overflow-y-auto rounded border border-flixer-border bg-flixer-surface/95 p-4 text-flixer-text shadow-2xl shadow-black/60 backdrop-blur"
      role="region" :aria-label="t('userMedia.queue')">
      <div class="flex justify-end"><button type="button"
          class="grid size-8 place-items-center rounded text-flixer-muted hover:bg-white/10 hover:text-white"
          :aria-label="t('common.close')" :title="t('common.close')" @click="videoQueueOpen = false">
          <Icon icon="lucide:x" class="size-5" aria-hidden="true" />
        </button></div>
      <UserMediaListView kind="queue" embedded />
    </div>
    <button v-if="(!(playback && info) || (error && nativePlayback && !isLive && adBreaks.length === 0)) && !mini"
      type="button"
      class="absolute left-4 top-4 rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
      @click="closeOverlay()">{{ t('mediaItem.close') }}</button>
  </component>
</template>
