<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { buildHlsUrl, buildStreamUrl, getStreamInfo, getSubtitleText, getSubtitleTracks, getTrickplay, supportsNativeHls, type PlayMethod, type PlayerChapter, type PlayerSegment, type PlayerSubtitle, type StreamInfo, type Trickplay } from '../../api'
import { useParty } from '../../composables/useParty'
import PartyPanel from '../party/PartyPanel.vue'
import { thumbnailAt } from '../../composables/trickplay'
import { cueTextAt, languageName, parseVtt, type SubtitleCue } from '../../composables/subtitles'

const props = withDefaults(
  defineProps<{
    streamUrl: string
    info: StreamInfo
    title?: string
    autoplay?: boolean
    showBack?: boolean
    /** Offers the in-page corner player toggle. */
    allowMini?: boolean
    /** Compact corner layout: only a small control strip is shown. */
    mini?: boolean
    /** Where playback begins, in seconds. */
    startAt?: number
    chapters?: PlayerChapter[]
    /** Skippable spans such as the intro or credits. */
    segments?: PlayerSegment[]
    /** Label of the episode that follows; enables the countdown button and auto-advance. */
    nextLabel?: string
    /** Party guests follow the host, so their own play, pause and seek controls do nothing. */
    locked?: boolean
  }>(),
  { autoplay: true, showBack: false, allowMini: false, mini: false, startAt: 0, chapters: () => [], segments: () => [] },
)

const emit = defineEmits<{
  back: []
  'toggle-mini': []
  next: []
  error: [message: string]
  progress: [position: number, duration: number]
  /** Playback changed (play, pause or seek); used to keep a watch party in sync. */
  control: [state: { playing: boolean; position: number }]
}>()

const METHOD_LABELS: Record<PlayMethod, string> = {
  DirectPlay: 'player.methodDirectPlay',
  DirectStream: 'player.methodDirectStream',
  Transcode: 'player.methodTranscode',
}

const { t, locale } = useI18n()
const SKIP_SECONDS = 10
// A guest further than this from the host is moved back to it.
const REMOTE_DRIFT_S = 2
// A transcoded stream restarts on every seek, so it gets a looser limit and a cooldown to avoid reload loops.
const REMOTE_DRIFT_RELOAD_S = 6
const REMOTE_RELOAD_COOLDOWN_MS = 10_000
let lastRemoteReload = 0
const HIDE_DELAY_MS = 3000
const VOLUME_KEY = 'flixer.player.volume'
const SUBTITLE_KEY = 'flixer.player.subtitles'
const AUTO_SKIP_KEY = 'flixer.player.autoSkip'
// Credits are never skipped on their own: they run to the end, which would close the video.
const AUTO_SKIP_TYPES: PlayerSegment['type'][] = ['intro', 'recap', 'preview', 'commercial']
// Leaves a moment at the end of a segment so the button doesn't flash up as it finishes.
const SEGMENT_END_GUARD_S = 1

const root = ref<HTMLElement>()
const video = ref<HTMLVideoElement>()
const bar = ref<HTMLElement>()

// Quality 0 means the original resolution.
const height = ref(0)
// Remuxed/transcoded streams restart at `offset`, so the element's clock is relative to it.
const offset = ref(0)
const current = ref(0)
const bufferedEnd = ref(0)
const nativeDuration = ref(0)
const paused = ref(true)
const waiting = ref(true)
const ended = ref(false)
const volume = ref(1)
const muted = ref(false)
const controlsVisible = ref(true)
const menuOpen = ref(false)
const partyMenuOpen = ref(false)
const partyState = useParty()
function togglePartyMenu() {
  partyMenuOpen.value = !partyMenuOpen.value
  menuOpen.value = false
}

function toggleSettingsMenu() {
  menuOpen.value = !menuOpen.value
  partyMenuOpen.value = false
}

const inVideoParty = computed(() => partyState.party.value?.kind === 'video')
const isFullscreen = ref(false)
const isPip = ref(false)
const pipSupported = typeof document !== 'undefined' && document.pictureInPictureEnabled === true
const errorMessage = ref('')
const scrubbing = ref(false)
const scrubTime = ref(0)
const hoverTime = ref<number | null>(null)
// Hover previews; null until the streamer has sheets for this video.
const trickplay = shallowRef<Trickplay | null>(null)
const THUMB_WIDTH = 176
let warmedSheets = false

let nativeStart = 0
let hideTimer: ReturnType<typeof setTimeout> | undefined
let progressTimer: ReturnType<typeof setInterval> | undefined
const PROGRESS_INTERVAL_MS = 15000
let frame = 0
let lastPointerType = 'mouse'

const nativeHls = supportsNativeHls()
const directPlay = computed(() => height.value === 0 && props.info.playMethod === 'DirectPlay')
const useHls = computed(() => nativeHls && !directPlay.value)
// Direct play and HLS both use the browser's own clock and seeking.
const isNative = computed(() => directPlay.value || useHls.value)
const mode = computed<PlayMethod>(() => (height.value > 0 ? 'Transcode' : props.info.playMethod))
const duration = computed(() => {
  if (isNative.value && Number.isFinite(nativeDuration.value) && nativeDuration.value > 0) return nativeDuration.value
  return props.info.source.durationSeconds
})
const position = computed(() => {
  if (scrubbing.value) return scrubTime.value
  return isNative.value ? current.value : offset.value + current.value
})
const autoSkip = ref(localStorage.getItem(AUTO_SKIP_KEY) === 'on')
const autoSkipped = new Set<string>()
const activeSegment = computed(() => {
  const time = position.value
  return props.segments.find((segment) => time >= segment.startMs / 1000 && time < segment.endMs / 1000 - SEGMENT_END_GUARD_S) ?? null
})
const segmentKey = (segment: PlayerSegment) => `${segment.type}:${segment.startMs}`
const chapterTicks = computed(() => props.chapters.filter((chapter) => chapter.startMs > 0).map((chapter) => percent(chapter.startMs / 1000)))
const hoverChapter = computed(() => {
  if (hoverTime.value === null) return ''
  const ms = hoverTime.value * 1000
  return props.chapters.find((chapter) => ms >= chapter.startMs && ms < chapter.endMs)?.title ?? ''
})
const qualityOptions = computed(() => [...props.info.availableHeights].sort((a, b) => b - a))

// Subtitles are drawn by the player so they stay in step when a transcode restarts at an offset.
const subtitleTracks = ref<PlayerSubtitle[]>([])
const subtitleId = ref('')
const subtitleCues = ref<SubtitleCue[]>([])
const playhead = computed(() => (isNative.value ? current.value : offset.value + current.value))
const subtitleText = computed(() => (subtitleId.value ? cueTextAt(subtitleCues.value, playhead.value) : ''))

function subtitleLabel(track: PlayerSubtitle) {
  const name = languageName(track.language, locale.value)
  return track.label ? `${name} (${track.label})` : name
}

async function selectSubtitle(id: string) {
  menuOpen.value = false
  subtitleId.value = id
  subtitleCues.value = []
  const track = subtitleTracks.value.find((candidate) => candidate.id === id)
  try {
    localStorage.setItem(SUBTITLE_KEY, track ? track.language : 'off')
  } catch {
    // Remembering the choice is optional.
  }
  if (!track) return
  try {
    const cues = parseVtt(await getSubtitleText(props.streamUrl, id))
    if (subtitleId.value === id) subtitleCues.value = cues
  } catch {
    if (subtitleId.value === id) subtitleId.value = ''
  }
}

async function loadTrickplay() {
  const url = props.streamUrl
  trickplay.value = null
  warmedSheets = false
  const loaded = await getTrickplay(url)
  if (url === props.streamUrl) trickplay.value = loaded
}

// Fetch every sheet once the viewer first points at the bar, so dragging never waits on an image.
function warmTrickplay() {
  if (warmedSheets || !trickplay.value) return
  warmedSheets = true
  for (let sheet = 0; sheet < trickplay.value.manifest.sheets; sheet++) new Image().src = trickplay.value.sheetUrl(sheet)
}

async function loadSubtitleTracks() {
  subtitleTracks.value = []
  subtitleId.value = ''
  subtitleCues.value = []
  try {
    subtitleTracks.value = await getSubtitleTracks(props.streamUrl)
  } catch {
    return
  }
  let preferred: string | null = null
  try {
    preferred = localStorage.getItem(SUBTITLE_KEY)
  } catch {
    // No saved preference.
  }
  if (!preferred || preferred === 'off') return
  const match = subtitleTracks.value.find((track) => track.language === preferred)
  if (match) await selectSubtitle(match.id)
}
const controlsShown = computed(() => !props.mini && (controlsVisible.value || paused.value || menuOpen.value || partyMenuOpen.value || scrubbing.value || !!errorMessage.value))
const showCenterPlay = computed(() => !props.mini && paused.value && !waiting.value && !errorMessage.value)
const hoverPercent = computed(() => (hoverTime.value === null ? 0 : percent(hoverTime.value)))
const hoverThumb = computed(() => {
  if (!trickplay.value || hoverTime.value === null) return null
  const place = thumbnailAt(trickplay.value.manifest, hoverTime.value, THUMB_WIDTH)
  return {
    width: `${place.width}px`,
    height: `${place.height}px`,
    backgroundImage: `url(${trickplay.value.sheetUrl(place.sheet)})`,
    backgroundSize: `${place.sheetWidth}px ${place.sheetHeight}px`,
    backgroundPosition: `-${place.x}px -${place.y}px`,
  }
})

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function percent(seconds: number) {
  return duration.value > 0 ? clamp((seconds / duration.value) * 100, 0, 100) : 0
}

function skipSegment() {
  if (activeSegment.value) seekTo(activeSegment.value.endMs / 1000)
}

function setAutoSkip(value: boolean) {
  autoSkip.value = value
  localStorage.setItem(AUTO_SKIP_KEY, value ? 'on' : 'off')
}

// Each segment auto-skips once, so seeking back into it plays it.
watch(activeSegment, (segment) => {
  if (!segment || !autoSkip.value || props.mini || scrubbing.value || !AUTO_SKIP_TYPES.includes(segment.type)) return
  const key = segmentKey(segment)
  if (autoSkipped.has(key)) return
  autoSkipped.add(key)
  skipSegment()
})

function format(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds))
  const h = Math.floor(whole / 3600)
  const m = Math.floor((whole % 3600) / 60)
  const s = String(whole % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}

function tryPlay() {
  void video.value?.play().catch(() => {})
}

let loadToken = 0

async function loadSource(opts: { start?: number; height?: number; resume?: boolean } = {}) {
  const el = video.value
  if (!el) return
  const token = ++loadToken
  const resume = opts.resume ?? !el.paused
  if (opts.height !== undefined) height.value = opts.height
  let start = Math.max(0, opts.start ?? 0)

  errorMessage.value = ''
  waiting.value = true
  ended.value = false

  // A stream-copy seek starts at the previous keyframe, so use the real start for the clock and subtitles.
  if (!isNative.value && height.value === 0 && start > 0) {
    try {
      const snapped = (await getStreamInfo(props.streamUrl, { start })).keyframeStart
      if (token !== loadToken) return
      if (typeof snapped === 'number' && snapped <= start) start = snapped
    } catch {
      if (token !== loadToken) return
    }
  }
  if (isNative.value) {
    nativeStart = start
    offset.value = 0
    current.value = start
  } else {
    nativeStart = 0
    offset.value = start
    current.value = 0
  }
  bufferedEnd.value = start

  el.src = useHls.value ? buildHlsUrl(props.streamUrl, { height: height.value || undefined }) : buildStreamUrl(props.streamUrl, isNative.value ? {} : { height: height.value || undefined, start })
  if (resume) tryPlay()
}

function isBuffered(el: HTMLVideoElement, time: number) {
  for (let i = 0; i < el.buffered.length; i++) {
    if (time >= el.buffered.start(i) && time <= el.buffered.end(i) - 0.3) return true
  }
  return false
}

let remoteChange = false

function seekTo(target: number) {
  const el = video.value
  if (!el || (props.locked && !remoteChange)) return
  const max = duration.value > 0 ? Math.max(0, duration.value - 0.5) : target
  const time = clamp(target, 0, max)
  const resume = !el.paused || ended.value
  ended.value = false

  if (isNative.value) {
    el.currentTime = time
    current.value = time
    return
  }

  const local = time - offset.value
  if (local >= 0 && isBuffered(el, local)) {
    el.currentTime = local
    current.value = local
    return
  }
  loadSource({ start: time, resume })
}

function skip(seconds: number) {
  seekTo(position.value + seconds)
  showControls()
}

function setQuality(next: number) {
  menuOpen.value = false
  if (next === height.value) return
  loadSource({ height: next, start: position.value, resume: !paused.value })
}

function togglePlay() {
  const el = video.value
  if (!el || (props.locked && !remoteChange)) return
  if (ended.value) {
    seekTo(0)
    tryPlay()
    return
  }
  if (el.paused) tryPlay()
  else el.pause()
}

function setVolume(value: number) {
  const el = video.value
  if (!el) return
  el.volume = clamp(value, 0, 1)
  el.muted = el.volume === 0
}

function toggleMute() {
  const el = video.value
  if (!el) return
  if (el.muted || el.volume === 0) {
    el.muted = false
    if (el.volume === 0) el.volume = 0.5
  } else {
    el.muted = true
  }
}

function onVolumeInput(event: Event) {
  setVolume(Number((event.target as HTMLInputElement).value))
}

type FullscreenVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void }
type LockableOrientation = ScreenOrientation & { lock?: (type: string) => Promise<void> }

async function toggleFullscreen() {
  if (document.fullscreenElement) {
    await document.exitFullscreen().catch(() => {})
    return
  }
  if (root.value?.requestFullscreen) {
    await root.value.requestFullscreen().catch(() => {})
    void (screen.orientation as LockableOrientation | undefined)?.lock?.('landscape').catch(() => {})
  } else {
    // iOS Safari only supports fullscreen on the video element itself.
    ;(video.value as FullscreenVideo | undefined)?.webkitEnterFullscreen?.()
  }
}

async function togglePip() {
  const el = video.value
  if (!el) return
  try {
    if (document.pictureInPictureElement) await document.exitPictureInPicture()
    else await el.requestPictureInPicture()
  } catch {
    // PiP can be refused (no user gesture, disabled by policy); nothing to recover.
  }
}

function onEnterPip() {
  isPip.value = true
}

function onLeavePip() {
  isPip.value = false
}

function onFullscreenChange() {
  isFullscreen.value = document.fullscreenElement === root.value
  if (!isFullscreen.value) screen.orientation?.unlock?.()
}

function updateBuffered() {
  const el = video.value
  if (!el) return
  let end = el.currentTime
  for (let i = 0; i < el.buffered.length; i++) {
    if (el.currentTime >= el.buffered.start(i) - 0.5 && el.currentTime <= el.buffered.end(i) + 0.5) {
      end = el.buffered.end(i)
    }
  }
  bufferedEnd.value = (isNative.value ? 0 : offset.value) + end
}

function sync() {
  const el = video.value
  if (!el) return
  current.value = el.currentTime
  updateBuffered()
}

function loop() {
  sync()
  frame = requestAnimationFrame(loop)
}

function startLoop() {
  if (!frame) frame = requestAnimationFrame(loop)
}

function stopLoop() {
  cancelAnimationFrame(frame)
  frame = 0
}

function emitControl() {
  emit('control', { playing: !paused.value, position: position.value })
}

function getState() {
  return { playing: !paused.value && !ended.value, position: position.value }
}

/** Moves this player to where the host is. Small drifts are left alone so playback doesn't stutter. */
function applyRemote(state: { playing: boolean; position: number }) {
  const el = video.value
  if (!el) return
  remoteChange = true
  try {
    const target = duration.value > 0 ? Math.min(state.position, Math.max(0, duration.value - 0.5)) : state.position
    const drift = Math.abs(position.value - target)
    if (isNative.value) {
      if (drift > REMOTE_DRIFT_S) seekTo(target)
    } else if (!waiting.value && drift > REMOTE_DRIFT_RELOAD_S && Date.now() - lastRemoteReload > REMOTE_RELOAD_COOLDOWN_MS) {
      const local = target - offset.value
      if (!(local >= 0 && isBuffered(el, local))) lastRemoteReload = Date.now()
      seekTo(target)
    } else if (!waiting.value && drift > REMOTE_DRIFT_S && isBuffered(el, target - offset.value)) {
      seekTo(target)
    }
    if (waiting.value) return
    if (state.playing && el.paused) tryPlay()
    else if (!state.playing && !el.paused) el.pause()
  } finally {
    remoteChange = false
  }
}

defineExpose({ getState, applyRemote })

function onPlay() {
  paused.value = false
  ended.value = false
  startLoop()
  scheduleHide()
  progressTimer ??= setInterval(reportProgress, PROGRESS_INTERVAL_MS)
  emitControl()
}

function stopProgressTimer() {
  clearInterval(progressTimer)
  progressTimer = undefined
}

function reportProgress() {
  const total = duration.value
  if (total <= 0) return
  emit('progress', ended.value ? total : isNative.value ? current.value : offset.value + current.value, total)
}

function onPause() {
  paused.value = true
  stopLoop()
  sync()
  showControls()
  stopProgressTimer()
  reportProgress()
  emitControl()
}

const NEXT_COUNTDOWN_SECONDS = 15
const nextCountdown = computed(() => {
  if (!props.nextLabel || duration.value <= 0) return null
  if (ended.value) return 0
  const remaining = duration.value - position.value
  return position.value > 0 && remaining <= NEXT_COUNTDOWN_SECONDS ? Math.max(0, Math.ceil(remaining)) : null
})

function onEnded() {
  ended.value = true
  paused.value = true
  stopLoop()
  sync()
  stopProgressTimer()
  reportProgress()
  if (props.nextLabel) emit('next')
}

function onLoadedMetadata() {
  const el = video.value
  if (!el) return
  nativeDuration.value = el.duration
  if (nativeStart > 0 && isNative.value) {
    el.currentTime = nativeStart
    nativeStart = 0
  }
}

function onVolumeChange() {
  const el = video.value
  if (!el) return
  volume.value = el.volume
  muted.value = el.muted
  try {
    localStorage.setItem(VOLUME_KEY, JSON.stringify({ volume: el.volume, muted: el.muted }))
  } catch {
    // Storage can be unavailable (private mode); volume just won't persist.
  }
}

function onVideoError() {
  const el = video.value
  if (!el || !el.getAttribute('src')) return
  errorMessage.value = mode.value === 'DirectPlay' ? t('player.videoCouldNotPlay') : t('player.streamStoppedUnexpectedly')
  emit('error', errorMessage.value)
}

function retry() {
  loadSource({ start: position.value, resume: true })
}

function showControls() {
  controlsVisible.value = true
  scheduleHide()
}

function scheduleHide() {
  clearTimeout(hideTimer)
  if (paused.value || menuOpen.value || scrubbing.value) return
  hideTimer = setTimeout(() => {
    controlsVisible.value = false
  }, HIDE_DELAY_MS)
}

function onPointerDown(event: PointerEvent) {
  lastPointerType = event.pointerType
}

function onPointerMove(event: PointerEvent) {
  if (event.pointerType === 'mouse') showControls()
}

function onPointerLeave(event: PointerEvent) {
  if (event.pointerType === 'mouse' && !paused.value && !menuOpen.value) controlsVisible.value = false
}

function releaseFocus(event: PointerEvent) {
  ;(event.target as HTMLElement).closest('button')?.blur()
}

function onSurfaceClick() {
  if (menuOpen.value) {
    menuOpen.value = false
    return
  }
  if (lastPointerType === 'touch' && !controlsVisible.value) {
    showControls()
    return
  }
  togglePlay()
  showControls()
}

function timeFromPointer(event: PointerEvent) {
  const rect = bar.value!.getBoundingClientRect()
  return clamp((event.clientX - rect.left) / rect.width, 0, 1) * duration.value
}

function onBarDown(event: PointerEvent) {
  if (duration.value <= 0) return
  bar.value!.setPointerCapture(event.pointerId)
  scrubbing.value = true
  scrubTime.value = timeFromPointer(event)
  hoverTime.value = scrubTime.value
}

function onBarMove(event: PointerEvent) {
  if (duration.value <= 0) return
  const time = timeFromPointer(event)
  hoverTime.value = time
  warmTrickplay()
  if (scrubbing.value) scrubTime.value = time
}

function onBarUp(event: PointerEvent) {
  if (!scrubbing.value) return
  scrubbing.value = false
  seekTo(timeFromPointer(event))
  if (event.pointerType !== 'mouse') hoverTime.value = null
  scheduleHide()
}

function onBarCancel() {
  scrubbing.value = false
  hoverTime.value = null
}

function onBarLeave() {
  if (!scrubbing.value) hoverTime.value = null
}

function onKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null
  if (target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return
  if (target?.tagName === 'BUTTON' && (event.key === ' ' || event.key === 'Enter')) return
  if (event.ctrlKey || event.metaKey || event.altKey) return

  const el = video.value
  if (!el) return
  let handled = true

  switch (event.key) {
    case ' ':
    case 'k':
      togglePlay()
      break
    case 'ArrowLeft':
    case 'j':
      skip(-SKIP_SECONDS)
      break
    case 'ArrowRight':
    case 'l':
      skip(SKIP_SECONDS)
      break
    case 'ArrowUp':
      setVolume(el.volume + 0.05)
      break
    case 'ArrowDown':
      setVolume(el.volume - 0.05)
      break
    case 'm':
      toggleMute()
      break
    case 'f':
      void toggleFullscreen()
      break
    case 'p':
      if (pipSupported) void togglePip()
      break
    case 'Home':
      seekTo(0)
      break
    case 'Escape':
      if (menuOpen.value) menuOpen.value = false
      else handled = false
      break
    default:
      if (/^[0-9]$/.test(event.key)) seekTo((Number(event.key) / 10) * duration.value)
      else handled = false
  }

  if (handled) {
    event.preventDefault()
    showControls()
  }
}

watch(menuOpen, () => {
  if (menuOpen.value) clearTimeout(hideTimer)
  else scheduleHide()
})

watch(
  () => props.streamUrl,
  () => {
    height.value = 0
    loadSource({ start: 0, resume: props.autoplay })
    void loadSubtitleTracks()
    void loadTrickplay()
  },
)

onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(VOLUME_KEY) ?? 'null') as { volume: number; muted: boolean } | null
    if (saved && video.value) {
      video.value.volume = clamp(saved.volume, 0, 1)
      video.value.muted = saved.muted
    }
  } catch {
    // Ignore corrupt saved settings.
  }
  volume.value = video.value?.volume ?? 1
  muted.value = video.value?.muted ?? false

  window.addEventListener('keydown', onKeydown)
  document.addEventListener('fullscreenchange', onFullscreenChange)
  loadSource({ start: props.startAt, resume: props.autoplay })
  void loadSubtitleTracks()
  void loadTrickplay()
})

onBeforeUnmount(() => {
  clearTimeout(hideTimer)
  stopProgressTimer()
  if (!ended.value && !waiting.value) reportProgress()
  stopLoop()
  window.removeEventListener('keydown', onKeydown)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  if (document.fullscreenElement === root.value) void document.exitFullscreen().catch(() => {})
  if (document.pictureInPictureElement === video.value) void document.exitPictureInPicture().catch(() => {})
  // Dropping the source closes the connection so flixer-streamer stops ffmpeg.
  video.value?.removeAttribute('src')
  video.value?.load()
})
</script>

<template>
  <div ref="root" class="relative size-full select-none overflow-hidden bg-black font-sans text-flixer-text" :class="{ 'cursor-none': !controlsShown }" @pointerdown="onPointerDown" @pointermove="onPointerMove" @pointerleave="onPointerLeave">
    <video ref="video" class="size-full bg-black object-contain" preload="auto" playsinline @click="onSurfaceClick" @dblclick="toggleFullscreen" @play="onPlay" @pause="onPause" @seeked="emitControl" @ended="onEnded" @waiting="waiting = true" @playing="waiting = false" @canplay="waiting = false" @timeupdate="sync" @progress="updateBuffered" @loadedmetadata="onLoadedMetadata" @volumechange="onVolumeChange" @enterpictureinpicture="onEnterPip" @leavepictureinpicture="onLeavePip" @error="onVideoError" />

    <div v-if="subtitleText" class="pointer-events-none absolute inset-x-0 flex justify-center px-4 transition-all duration-300" :class="controlsShown ? 'bottom-24' : 'bottom-8'" aria-live="off">
      <p class="theme-dark max-w-3xl whitespace-pre-line rounded bg-black/65 px-3 py-1 text-center text-base font-medium leading-snug text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.9)] sm:text-xl">{{ subtitleText }}</p>
    </div>

    <!-- Centre status: buffering, error, or the big play/replay button -->
    <div class="pointer-events-none absolute inset-0 grid place-items-center">
      <div v-if="waiting && !errorMessage" class="size-14 animate-spin rounded-full border-4 border-white/20 border-t-flixer-accent" role="status" :aria-label="t('player.buffering')"></div>

      <div v-else-if="errorMessage" class="pointer-events-auto max-w-sm px-6 text-center" role="alert">
        <p class="text-sm text-red-300">{{ errorMessage }}</p>
        <button type="button" class="mt-4 rounded bg-flixer-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-flixer-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" @click="retry">{{ t('player.tryAgain') }}</button>
      </div>

      <button v-else-if="showCenterPlay" type="button" class="pointer-events-auto grid size-20 place-items-center rounded bg-flixer-primary/90 text-white shadow-2xl shadow-black/60 transition hover:scale-105 hover:bg-flixer-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" :aria-label="ended ? t('player.replay') : t('player.play')" @click="togglePlay">
        <svg v-if="ended" class="size-9" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 5V1L7 6l5 5V7a6 6 0 11-6 6H4a8 8 0 108-8z" />
        </svg>
        <svg v-else class="ml-1 size-9" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 8-14 8z" /></svg>
      </button>
    </div>

    <!-- Corner player controls -->
    <div v-if="mini" class="absolute inset-0 flex flex-col justify-between bg-black/0 opacity-0 transition-opacity focus-within:bg-black/40 focus-within:opacity-100 hover:bg-black/40 hover:opacity-100" @click.self="togglePlay">
      <div class="flex justify-end gap-1 p-1">
        <button type="button" class="grid size-8 place-items-center rounded text-white hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-flixer-accent" :aria-label="t('player.expand')" @click="emit('toggle-mini')">
          <svg class="size-5" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h6v2H6v4H4zM20 4v6h-2V6h-4V4zM4 20v-6h2v4h4v2zM20 20h-6v-2h4v-4h2z" /></svg>
        </button>
        <button type="button" class="grid size-8 place-items-center rounded text-white hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-flixer-accent" :aria-label="t('player.closePlayer')" @click="emit('back')">
          <svg class="size-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.4L17.6 5 12 10.6 6.4 5 5 6.4l5.6 5.6L5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4-5.6-5.6z" /></svg>
        </button>
      </div>
      <div class="flex justify-center p-2">
        <button type="button" class="grid size-10 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-flixer-accent" :aria-label="paused ? t('player.play') : t('player.pause')" @click="togglePlay">
          <svg v-if="paused" class="ml-0.5 size-5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 8-14 8z" /></svg>
          <svg v-else class="size-5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>
        </button>
      </div>
    </div>

    <!-- Top bar -->
    <div class="absolute inset-x-0 top-0 flex items-center gap-3 bg-gradient-to-b from-black/80 to-transparent px-4 pb-10 pt-4 transition-opacity duration-300 sm:px-6" :class="controlsShown ? 'opacity-100' : 'pointer-events-none opacity-0'" @pointerup="releaseFocus">
      <button v-if="showBack" type="button" class="grid size-10 place-items-center rounded text-white/90 transition hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-flixer-accent" :aria-label="allowMini ? t('player.miniPlayer') : t('player.back')" :title="allowMini ? t('player.miniPlayer') : undefined" @click="allowMini ? emit('toggle-mini') : emit('back')">
        <svg class="size-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z" />
        </svg>
      </button>
      <h2 v-if="title" class="truncate text-base font-semibold tracking-tight sm:text-lg">{{ title }}</h2>
    </div>

    <!-- Settings menu -->
    <button v-if="nextCountdown !== null && !mini" type="button" class="absolute bottom-28 right-4 z-10 max-w-[70%] rounded-lg border border-white/40 bg-black/70 px-5 py-2.5 text-left text-sm font-semibold text-white shadow-lg shadow-black/50 backdrop-blur transition hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-flixer-accent sm:right-8" :class="activeSegment ? 'bottom-44' : ''" @click="emit('next')">
      <span class="block text-xs font-normal opacity-80">{{ t('player.nextEpisodeIn', { seconds: nextCountdown }) }}</span>
      <span class="block truncate">{{ nextLabel }}</span>
    </button>
    <button v-if="activeSegment && !mini" type="button" class="absolute bottom-28 right-4 z-10 rounded-lg border border-white/40 bg-black/70 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/50 backdrop-blur transition hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-flixer-accent sm:right-8" @click="skipSegment">{{ t(`player.skip.${activeSegment.type}`) }}</button>

    <div v-if="partyMenuOpen && inVideoParty && controlsShown" class="absolute bottom-20 right-3 z-20 max-h-[70%] w-64 overflow-y-auto rounded-xl border border-flixer-border bg-flixer-surface/95 p-2 shadow-2xl shadow-black/60 backdrop-blur sm:right-6" role="dialog">
      <PartyPanel @left="partyMenuOpen = false" />
    </div>

    <div v-if="menuOpen && controlsShown" class="absolute bottom-20 right-3 z-20 max-h-[70%] w-64 overflow-y-auto rounded-xl border border-flixer-border bg-flixer-surface/95 p-2 shadow-2xl shadow-black/60 backdrop-blur sm:right-6" role="menu" :aria-label="t('player.playbackSettings')">
      <p class="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-flixer-muted">{{ t('player.subtitles') }}</p>
      <p v-if="subtitleTracks.length === 0" class="px-3 pb-2 text-sm text-flixer-muted">{{ t('player.subtitlesNone') }}</p>
      <template v-else>
        <button type="button" role="menuitemradio" :aria-checked="subtitleId === ''" class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition hover:bg-white/10" :class="subtitleId === '' ? 'text-flixer-accent' : 'text-flixer-text'" @click="selectSubtitle('')">
          <span>{{ t('player.subtitlesOff') }}</span>
          <svg v-if="subtitleId === ''" class="size-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.5-1.5z" />
          </svg>
        </button>
        <button v-for="track in subtitleTracks" :key="track.id" type="button" role="menuitemradio" :aria-checked="subtitleId === track.id" class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition hover:bg-white/10" :class="subtitleId === track.id ? 'text-flixer-accent' : 'text-flixer-text'" @click="selectSubtitle(track.id)">
          <span class="truncate">{{ subtitleLabel(track) }}</span>
          <svg v-if="subtitleId === track.id" class="size-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.5-1.5z" />
          </svg>
        </button>
        <div class="my-2 border-t border-flixer-border"></div>
      </template>
      <div v-if="subtitleTracks.length === 0" class="my-2 border-t border-flixer-border"></div>
      <button v-if="segments.length > 0" type="button" role="menuitemcheckbox" :aria-checked="autoSkip" class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition hover:bg-white/10" :class="autoSkip ? 'text-flixer-accent' : 'text-flixer-text'" @click="setAutoSkip(!autoSkip)">
        <span>{{ t('player.autoSkip') }}</span>
        <svg v-if="autoSkip" class="size-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.5-1.5z" />
        </svg>
      </button>
      <div v-if="segments.length > 0" class="my-2 border-t border-flixer-border"></div>
      <p class="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-flixer-muted">{{ t('player.quality') }}</p>
      <button type="button" role="menuitemradio" :aria-checked="height === 0" class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition hover:bg-white/10" :class="height === 0 ? 'text-flixer-accent' : 'text-flixer-text'" @click="setQuality(0)">
        <span>{{ t('player.originalQuality', { height: info.source.height }) }}</span>
        <svg v-if="height === 0" class="size-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.5-1.5z" />
        </svg>
      </button>
      <button v-for="option in qualityOptions" :key="option" type="button" role="menuitemradio" :aria-checked="height === option" class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition hover:bg-white/10" :class="height === option ? 'text-flixer-accent' : 'text-flixer-text'" @click="setQuality(option)">
        <span>{{ option }}p</span>
        <svg v-if="height === option" class="size-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.5-1.5z" />
        </svg>
      </button>

      <dl class="mt-2 space-y-1 border-t border-flixer-border px-3 pb-2 pt-3 text-xs text-flixer-muted">
        <div class="flex justify-between gap-3">
          <dt>{{ t('player.playback') }}</dt>
          <dd class="text-right text-flixer-text">{{ t(METHOD_LABELS[mode]) }}</dd>
        </div>
        <div class="flex justify-between gap-3">
          <dt>{{ t('player.source') }}</dt>
          <dd class="text-right text-flixer-text">{{ info.source.videoCodec }} {{ info.source.width }}×{{ info.source.height }}</dd>
        </div>
      </dl>
    </div>

    <!-- Bottom controls -->
    <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-3 pb-3 pt-16 transition-opacity duration-300 sm:px-6 sm:pb-4" :class="controlsShown ? 'opacity-100' : 'pointer-events-none opacity-0'" @pointerup="releaseFocus">
      <div ref="bar" class="group/seek relative flex h-6 cursor-pointer touch-none items-center" role="slider" :aria-label="t('player.seek')" :aria-valuemin="0" :aria-valuemax="Math.floor(duration)" :aria-valuenow="Math.floor(position)" :aria-valuetext="t('player.seekValue', { current: format(position), duration: format(duration) })" @pointerdown="onBarDown" @pointermove="onBarMove" @pointerup="onBarUp" @pointercancel="onBarCancel" @pointerleave="onBarLeave">
        <div class="relative h-1 w-full rounded bg-white/20 transition-[height] group-hover/seek:h-1.5" :class="{ 'h-1.5': scrubbing }">
          <div class="absolute inset-y-0 left-0 rounded bg-white/30" :style="{ width: `${percent(bufferedEnd)}%` }"></div>
          <div v-for="segment in segments" :key="segmentKey(segment)" class="absolute inset-y-0 bg-white/40" :style="{ left: `${percent(segment.startMs / 1000)}%`, width: `${percent(segment.endMs / 1000) - percent(segment.startMs / 1000)}%` }"></div>
          <div class="absolute inset-y-0 left-0 rounded bg-flixer-accent" :style="{ width: `${percent(position)}%` }"></div>
          <div v-for="tick in chapterTicks" :key="tick" class="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-black/70" :style="{ left: `${tick}%` }"></div>
          <div class="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-md shadow-black/50 transition-opacity group-hover/seek:opacity-100" :class="scrubbing ? 'opacity-100' : 'opacity-0'" :style="{ left: `${percent(position)}%` }"></div>
        </div>

        <div v-if="hoverTime !== null" class="pointer-events-none absolute bottom-full mb-1 flex -translate-x-1/2 flex-col items-center gap-1" :style="{ left: `clamp(${hoverThumb ? THUMB_WIDTH / 2 : 28}px, ${hoverPercent}%, calc(100% - ${hoverThumb ? THUMB_WIDTH / 2 : 28}px))` }">
          <div v-if="hoverThumb" class="overflow-hidden rounded border border-flixer-border bg-black shadow-lg shadow-black/60" :style="hoverThumb"></div>
          <div v-if="hoverChapter" class="max-w-48 truncate rounded-md bg-black/70 px-2 py-0.5 text-xs text-white/90">{{ hoverChapter }}</div>
          <div class="rounded-md border border-flixer-border bg-flixer-surface px-2 py-1 text-xs font-medium tabular-nums">{{ format(hoverTime) }}</div>
        </div>
      </div>

      <div class="mt-1 flex items-center gap-1 sm:gap-2">
        <button type="button" class="grid size-10 place-items-center rounded text-white transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-flixer-accent" :aria-label="paused ? t('player.play') : t('player.pause')" @click="togglePlay">
          <svg v-if="paused" class="size-6" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 8-14 8z" /></svg>
          <svg v-else class="size-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
          </svg>
        </button>

        <button type="button" class="grid size-10 place-items-center rounded text-white/90 transition hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-flixer-accent" :aria-label="t('player.rewindSeconds', { seconds: SKIP_SECONDS })" @click="skip(-SKIP_SECONDS)">
          <svg class="size-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 5V1L7 6l5 5V7a6 6 0 11-6 6H4a8 8 0 108-8z" />
            <text x="12" y="16.5" font-size="7" font-weight="700" text-anchor="middle" fill="currentColor">10</text>
          </svg>
        </button>
        <button type="button" class="grid size-10 place-items-center rounded text-white/90 transition hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-flixer-accent" :aria-label="t('player.skipForwardSeconds', { seconds: SKIP_SECONDS })" @click="skip(SKIP_SECONDS)">
          <svg class="size-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 5V1l5 5-5 5V7a6 6 0 106 6h2a8 8 0 11-8-8z" />
            <text x="12" y="16.5" font-size="7" font-weight="700" text-anchor="middle" fill="currentColor">10</text>
          </svg>
        </button>

        <div class="group/vol flex items-center">
          <button type="button" class="grid size-10 place-items-center rounded text-white/90 transition hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-flixer-accent" :aria-label="muted || volume === 0 ? t('player.unmute') : t('player.mute')" @click="toggleMute">
            <svg class="size-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9z" />
              <path v-if="muted || volume === 0" d="M16 9.4l1.4-1.4 2.6 2.6L22.6 8 24 9.4 21.4 12l2.6 2.6-1.4 1.4-2.6-2.6-2.6 2.6-1.4-1.4 2.6-2.6z" />
              <path v-else d="M16.5 12a4.5 4.5 0 00-2.5-4v8a4.5 4.5 0 002.5-4z" />
            </svg>
          </button>
          <input type="range" min="0" max="1" step="0.01" :aria-label="t('player.volume')" class="h-1 w-0 cursor-pointer accent-flixer-accent opacity-0 transition-all duration-200 group-focus-within/vol:w-20 group-focus-within/vol:opacity-100 group-hover/vol:w-20 group-hover/vol:opacity-100" :value="muted ? 0 : volume" @input="onVolumeInput" />
        </div>

        <span class="ml-2 text-sm tabular-nums text-white/90">{{ format(position) }} / {{ format(duration) }}</span>

        <span class="flex-1"></span>

        <span v-if="mode !== 'DirectPlay'" class="hidden rounded-md border border-white/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-flixer-muted sm:inline">
          {{ mode === 'Transcode' ? `${height}p` : t('player.remux') }}
        </span>

        <button v-if="inVideoParty" type="button" class="relative grid size-10 place-items-center rounded text-white/90 transition hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="{ 'text-flixer-accent': partyMenuOpen }" :aria-label="t('party.title')" :title="t('party.title')" :aria-expanded="partyMenuOpen" @click="togglePartyMenu">
          <svg class="size-6" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>
          <span class="absolute right-1 top-1 rounded-full bg-flixer-accent px-1 text-[9px] font-bold leading-4 text-black">{{ partyState.party.value?.members.length }}</span>
        </button>

        <button type="button" class="grid size-10 place-items-center rounded text-white/90 transition hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="{ 'text-flixer-accent': menuOpen }" :aria-label="t('player.playbackSettings')" aria-haspopup="menu" :aria-expanded="menuOpen" @click="toggleSettingsMenu">
          <svg class="size-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
          </svg>
        </button>

        <button v-if="pipSupported" type="button" class="grid size-10 place-items-center rounded text-white/90 transition hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="{ 'text-flixer-accent': isPip }" :aria-label="isPip ? t('player.exitPip') : t('player.pip')" :title="t('player.pip') + ' (p)'" @click="togglePip">
          <svg class="size-6" viewBox="0 0 24 24" fill="currentColor"><path d="M19 7h-8v6h8zm4-4H1v18h22zm-2 16.01H3V4.98h18z" /></svg>
        </button>

        <button type="button" class="grid size-10 place-items-center rounded text-white/90 transition hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-flixer-accent" :aria-label="isFullscreen ? t('player.exitFullscreen') : t('player.fullscreen')" @click="toggleFullscreen">
          <svg v-if="!isFullscreen" class="size-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 4h6v2H6v4H4zM20 4v6h-2V6h-4V4zM4 20v-6h2v4h4v2zM20 20h-6v-2h4v-4h2z" />
          </svg>
          <svg v-else class="size-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 4v6H4V8h4V4zM14 4h2v4h4v2h-6zM4 14h6v6H8v-4H4zM14 14h6v2h-4v4h-2z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
