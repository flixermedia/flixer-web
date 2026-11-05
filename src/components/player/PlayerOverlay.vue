<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getItemPlaybackInfo, getPreferences, getStreamInfo, getWatchProgress, saveWatchProgress, updatePreferences, type PlaybackInfo, type StreamInfo } from '../../api'
import { expectedPosition, useParty } from '../../composables/useParty'
import { notify } from '../../composables/notify'
import { handlePaymentRequired } from '../../composables/usePayments'
import { useVideoOverlay } from '../../composables/useVideoOverlay'
import VideoPlayer from './VideoPlayer.vue'
import PlayerSkeleton from './PlayerSkeleton.vue'
import { isNativeApp } from '../../platform/serverConnection'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import { getGuideChannelPlaybackInfo, type EpgChannel, type GuidePlaybackInfo } from '../../api/guide'
import LiveGuidePanel from './LiveGuidePanel.vue'

const NativeVideoPlayer = defineAsyncComponent(() => import('./NativeVideoPlayer.vue'))

const props = withDefaults(defineProps<{ itemId: string; title: string; startAtSeconds?: number; autoplay?: boolean; livePlayback?: GuidePlaybackInfo; startMini?: boolean }>(), { autoplay: true, startMini: false })
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const playback = ref<PlaybackInfo | GuidePlaybackInfo | null>(null)
const info = ref<StreamInfo | null>(null)
const autoSkipIntroCredits = ref(true)
const defaultAudioLanguage = ref('')
const error = ref('')
const liveTitle = ref(props.title)
const liveGuideOpen = ref(false)
const switchingChannelId = ref('')
const liveGuideError = ref('')
const startAt = ref(0)
const mini = ref(props.startMini)
const party = useParty()
const nativePlayback = isNativeApp()
const videoPlayer = ref<{ getState: () => { playing: boolean; position: number }; applyRemote: (state: { playing: boolean; position: number }) => void }>()
const videoParty = computed(() => party.party.value?.kind === 'video')
// Guests follow the host, so their own controls are disabled.
const locked = computed(() => videoParty.value && party.isGuest.value)
const { play } = useVideoOverlay()

function isGuidePlayback(value: PlaybackInfo | GuidePlaybackInfo | null): value is GuidePlaybackInfo {
  return Boolean(value && 'playSessionId' in value)
}

// Movie playback responses also have a playSessionId; only the explicit guide prop marks live playback.
const livePlayback = computed(() => (props.livePlayback && isGuidePlayback(playback.value) ? playback.value : null))
const isLive = computed(() => Boolean(livePlayback.value))
const currentTitle = computed(() => (isLive.value ? liveTitle.value : props.title))

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
  const next = nextEpisode.value
  if (!next) return undefined
  const code = next.seasonNumber != null && next.episodeNumber != null ? `S${next.seasonNumber}:E${next.episodeNumber} ` : ''
  return `${code}${next.title}`
})

// Swapping the playing item reloads in place, so a corner player stays in the corner.
function playNext() {
  const next = nextEpisode.value
  if (next) play({ id: next.id, title: next.title })
}

function onControl(state: { action: 'play' | 'pause' | 'seek'; playing: boolean; position: number }) {
  if (videoParty.value && party.isHost.value) {
    if (!party.sendVideoCommand({ action: state.action, position: state.position }, props.itemId)) syncVideo()
  }
}

function syncVideo() {
  const state = party.latest.value
  if (!videoParty.value || !state || !videoPlayer.value) return
  videoPlayer.value.applyRemote({ playing: state.party.playing, position: expectedPosition(state) })
}

watch([() => party.latest.value, videoPlayer], syncVideo)

let partyBeat: ReturnType<typeof setInterval> | undefined

function onProgress(position: number, duration: number) {
  if (isLive.value) return
  void saveWatchProgress(props.itemId, position, duration).catch(() => {})
}

// Explicit geometry in both states so the move to the corner can animate.
const frameStyle = computed(() => {
  if (!mini.value) return { top: '0px', left: '0px', width: '100vw', height: '100dvh' }
  const width = 'min(24rem, 70vw)'
  const height = `calc(${width} * 9 / 16)`
  return { width, height, top: `calc(100dvh - ${height} - 1rem)`, left: `calc(100vw - ${width} - 1rem)` }
})

function setMini(value: boolean) {
  if (value && document.fullscreenElement) void document.exitFullscreen().catch(() => {})
  mini.value = value
  if (value) liveGuideOpen.value = false
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
  if (nativePlayback || event.key !== 'Escape' || document.fullscreenElement) return
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
  if (props.livePlayback) {
    playback.value = props.livePlayback
    info.value = {
      playMethod: 'DirectPlay',
      source: { videoCodec: 'h264', audioCodec: 'aac', width: 0, height: 0, durationSeconds: 0 },
      availableHeights: [],
    }
    return
  }
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
  const resume =
    props.startAtSeconds ??
    (await getWatchProgress(itemId)
      .then((progress) => progress.positionSeconds)
      .catch(() => 0))
  if (itemId !== props.itemId) return
  startAt.value = resume
  info.value = streamInfo
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
  document.body.style.overflow = mini.value ? '' : 'hidden'
  window.addEventListener('keydown', onKeydown)
  void loadPlaybackPreferences().then(() => load(props.itemId))
  partyBeat = setInterval(syncVideo, 5_000)
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  clearInterval(partyBeat)
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="theme-dark fixed z-[100] overflow-hidden bg-black transition-[top,left,width,height,border-radius,box-shadow] duration-300 ease-in-out motion-reduce:transition-none" :class="mini ? 'rounded shadow-2xl shadow-black/70 ring-1 ring-white/15' : ''" :style="frameStyle" role="dialog" :aria-modal="!mini" :aria-label="currentTitle">
    <NativeVideoPlayer v-if="playback && info && nativePlayback && !isLive" ref="videoPlayer" :locked="locked" :stream-url="playback.mediaSource.streamUrl" :container="playback.mediaSource.container" :info="info" :default-audio-language="defaultAudioLanguage" :title="currentTitle" :start-at="startAt" :autoplay="props.autoplay" :next-label="nextLabel" @back="closeOverlay()" @error="error = $event" @progress="onProgress" @control="onControl" @next="playNext" />
    <VideoPlayer v-else-if="playback && info" ref="videoPlayer" :live="isLive" :live-guide-open="liveGuideOpen" :container="container" :locked="locked" :stream-url="playback.mediaSource.streamUrl" :info="info" :default-audio-language="defaultAudioLanguage" :title="currentTitle" :start-at="startAt" :autoplay="props.autoplay" :chapters="chapters" :segments="segments" :auto-skip-intro-credits="autoSkipIntroCredits" :next-label="nextLabel" show-back allow-mini :mini="mini" @toggle-mini="setMini(!mini)" @toggle-live-guide="liveGuideOpen = !liveGuideOpen" @auto-skip-intro-credits-change="updateAutoSkipIntroCredits" @back="closeOverlay()" @error="error = $event" @progress="onProgress" @control="onControl" @next="playNext" />
    <LiveGuidePanel v-if="livePlayback && liveGuideOpen && !mini" :current-channel-id="livePlayback.mediaSource.id" :switching-channel-id="switchingChannelId" :switch-error="liveGuideError" @close="liveGuideOpen = false" @select-channel="switchLiveChannel" />
    <div v-else class="relative size-full">
      <p v-if="error" class="absolute inset-0 grid place-items-center p-6 text-center text-sm text-red-400" role="alert">{{ error }}</p>
      <PlayerSkeleton v-else />
    </div>
    <p v-if="error && playback && info && nativePlayback && !isLive" class="absolute inset-x-4 bottom-4 rounded bg-red-950/90 p-3 text-center text-sm text-red-100" role="alert">{{ error }}</p>
    <button v-if="(!(playback && info) || (error && nativePlayback && !isLive)) && !mini" type="button" class="absolute left-4 top-4 rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20" @click="closeOverlay()">{{ t('mediaItem.close') }}</button>
  </div>
</template>
