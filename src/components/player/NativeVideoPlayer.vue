<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { VideoPlayer, type VideoSubtitle, type capVideoPlayerResult } from '@capgo/capacitor-video-player'
import { buildHlsUrl, buildStreamUrl, getStreamInfo, getSubtitleTracks, type StreamInfo } from '../../api'
import { catchError } from '../../utils/catchError'

const props = withDefaults(
  defineProps<{
    streamUrl: string
    container: string
    info: StreamInfo
    title?: string
    autoplay?: boolean
    startAt?: number
    nextLabel?: string
    locked?: boolean
  }>(),
  { autoplay: true, startAt: 0 },
)

const emit = defineEmits<{
  back: []
  next: []
  error: [message: string]
  progress: [position: number, duration: number]
  control: [state: { action: 'play' | 'pause' | 'seek'; playing: boolean; position: number }]
}>()

const PLAYER_ID = 'flixer-native-video-player'
const REMOTE_DRIFT_SECONDS = 2
const PROGRESS_INTERVAL_MS = 15_000
const PLAYER_ID_OPTIONS = { playerId: PLAYER_ID }
const position = ref(0)
const duration = ref(props.info.source.durationSeconds)
const playing = ref(false)
const ready = ref(false)

let offset = 0
let seekOnReady = 0
let playerOpen = false
let remoteChange = false
let remoteSeekTarget: number | null = null
let remoteSeekUntil = 0
let remotePlaybackTarget: boolean | null = null
let remotePlaybackUntil = 0
let lastPolledPosition: number | null = null
let disposed = false
let exitReason: 'next' | 'unmount' | null = null
let pollTimer: ReturnType<typeof setInterval> | undefined
let progressTimer: ReturnType<typeof setInterval> | undefined
let exitResolver: (() => void) | undefined
let listeners: { remove: () => Promise<void> }[] = []

function absolutePosition() {
  return offset + position.value
}

function getState() {
  return { playing: playing.value && ready.value, position: absolutePosition() }
}

function emitControl(action: 'play' | 'pause' | 'seek') {
  if (remoteChange) return
  const state = getState()
  const now = performance.now()
  if (remotePlaybackTarget !== null && now < remotePlaybackUntil) {
    const matchesRemoteState = remotePlaybackTarget === state.playing
    remotePlaybackTarget = null
    if (matchesRemoteState) return
  }
  if (action === 'seek' && now < remoteSeekUntil && remoteSeekTarget !== null) {
    const matchesRemotePosition = Math.abs(state.position - remoteSeekTarget) < 1
    remoteSeekTarget = null
    if (matchesRemotePosition) return
  }
  emit('control', { ...state, action })
}

function emitProgress() {
  emit('progress', absolutePosition(), props.info.source.durationSeconds)
}

function eventPosition(value?: number | string) {
  if (value === undefined) return
  const parsed = Number(value)
  if (Number.isFinite(parsed) && parsed >= 0) position.value = parsed
}

function isCurrentPlayer(event: { fromPlayerId?: string }) {
  return !event.fromPlayerId || event.fromPlayerId === PLAYER_ID
}

async function requireSuccess(operation: string, result: capVideoPlayerResult) {
  if (result.result !== true) throw new Error(result.message || `Native video player ${operation} failed`)
}

async function runCommand(operation: string, command: () => Promise<capVideoPlayerResult>) {
  const [error, result] = await catchError(Promise.resolve().then(command))
  if (error || result.result !== true) {
    const failure = error ?? new Error(result.message || `Native video player ${operation} failed`)
    console.error(`Native video player ${operation} failed`, failure)
    emit('error', failure instanceof Error ? failure.message : `Native video player ${operation} failed`)
    return false
  }
  return true
}

function subtitleUrl(streamUrl: string, id: string) {
  const url = new URL(streamUrl, window.location.origin)
  url.pathname = url.pathname.replace('/streamer/stream/', '/streamer/subtitles/')
  url.searchParams.set('file', id)
  return url.toString()
}

async function loadSubtitleTracks(streamUrl: string): Promise<VideoSubtitle[]> {
  const [error, tracks] = await catchError(Promise.resolve().then(() => getSubtitleTracks(streamUrl)))
  if (error) {
    console.error('Could not load native video subtitles', error)
    return []
  }
  try {
    return tracks.map((track) => ({ subtitle: subtitleUrl(streamUrl, track.id), language: track.language }))
  } catch (mappingError) {
    console.error('Could not load native video subtitles', mappingError)
    return []
  }
}

async function onReady(event: { currentTime?: number | string; fromPlayerId?: string }) {
  if (!isCurrentPlayer(event)) return
  ready.value = true
  eventPosition(event.currentTime)
  if (seekOnReady > 0) {
    const seek = seekOnReady
    seekOnReady = 0
    if (await runCommand('seek', () => VideoPlayer.setCurrentTime({ ...PLAYER_ID_OPTIONS, seektime: seek }))) position.value = seek
  }
  if (!props.autoplay) await runCommand('pause', () => VideoPlayer.pause(PLAYER_ID_OPTIONS))
  startPolling()
}

function onPlay(event: { currentTime?: number | string; fromPlayerId?: string }) {
  if (!isCurrentPlayer(event)) return
  eventPosition(event.currentTime)
  playing.value = true
  emitControl('play')
}

function onPause(event: { currentTime?: number | string; fromPlayerId?: string }) {
  if (!isCurrentPlayer(event)) return
  eventPosition(event.currentTime)
  playing.value = false
  emitProgress()
  emitControl('pause')
}

async function closeForNext() {
  if (!playerOpen) return
  exitReason = 'next'
  let exitTimeout: number | undefined
  const exited = new Promise<void>((resolve) => {
    exitResolver = () => resolve()
    exitTimeout = window.setTimeout(resolve, 3000)
  })
  try {
    await requireSuccess('exit', await VideoPlayer.exitPlayer())
    await exited
    if (playerOpen) throw new Error('Native video player did not close')
  } finally {
    if (exitTimeout !== undefined) window.clearTimeout(exitTimeout)
    exitResolver = undefined
    if (playerOpen) exitReason = null
  }
  exitReason = null
}

async function onEnded(event: { currentTime?: number | string; fromPlayerId?: string }) {
  if (!isCurrentPlayer(event)) return
  eventPosition(event.currentTime)
  playing.value = false
  emitProgress()
  emitControl('pause')
  if (!props.nextLabel) return
  const [error] = await catchError(closeForNext())
  if (error) {
    console.error('Could not advance the native video player', error)
    emit('error', error instanceof Error ? error.message : 'Could not advance to the next episode')
    return
  }
  emit('next')
}

function onExit(event: { currentTime?: number | string; fromPlayerId?: string }) {
  if (!isCurrentPlayer(event)) return
  eventPosition(event.currentTime)
  playing.value = false
  playerOpen = false
  stopPolling()
  emitProgress()
  exitResolver?.()
  exitResolver = undefined
  if (!exitReason) emit('back')
}

function startPolling() {
  stopPolling()
  pollTimer = setInterval(() => {
    void VideoPlayer.getCurrentTime(PLAYER_ID_OPTIONS)
      .then((result) => {
        if (!result.result) return
        eventPosition(result.value)
        const currentPosition = absolutePosition()
        if (!props.locked && !remoteChange && lastPolledPosition !== null && Math.abs(currentPosition - lastPolledPosition) > REMOTE_DRIFT_SECONDS) {
          emitControl('seek')
        }
        lastPolledPosition = currentPosition
      })
      .catch((error: unknown) => console.error('Could not read native video playback position', error))
  }, 1000)
  progressTimer = setInterval(emitProgress, PROGRESS_INTERVAL_MS)
}

function stopPolling() {
  clearInterval(pollTimer)
  pollTimer = undefined
  clearInterval(progressTimer)
  progressTimer = undefined
}

async function loadPlayer(): Promise<Error | undefined> {
  ready.value = false
  playing.value = false
  position.value = 0
  duration.value = props.info.source.durationSeconds
  offset = 0
  seekOnReady = 0
  const start = props.locked ? 0 : Math.max(0, props.startAt)
  let url: string

  const container = props.container.toLowerCase()
  const videoCodec = props.info.source.videoCodec.toLowerCase()
  const audioCodec = props.info.source.audioCodec?.toLowerCase()
  const isKnownIosCompatibleSource = (container === 'mp4' || container === 'm4v') && videoCodec === 'h264' && (!audioCodec || audioCodec === 'aac')
  const useIosHls = Capacitor.getPlatform() === 'ios' && !isKnownIosCompatibleSource

  if (useIosHls) {
    // Use the streamer's H.264/AAC rendition unless the source is known to be AVPlayer-compatible.
    url = buildHlsUrl(props.streamUrl)
    seekOnReady = start
  } else if (props.info.playMethod === 'DirectPlay') {
    url = props.streamUrl
    seekOnReady = start
  } else {
    let serverStart = start
    if (props.info.playMethod === 'DirectStream' && start > 0) {
      const [error, streamInfo] = await catchError(Promise.resolve().then(() => getStreamInfo(props.streamUrl, { start })))
      if (error) {
        console.error('Could not find a keyframe for native playback resume', error)
      } else {
        if (typeof streamInfo.keyframeStart === 'number' && streamInfo.keyframeStart <= start) {
          serverStart = streamInfo.keyframeStart
        }
      }
    }
    url = buildStreamUrl(props.streamUrl, { start: serverStart })
    offset = serverStart
    if (props.info.playMethod === 'DirectStream') seekOnReady = start - serverStart
  }

  const subtitles = await loadSubtitleTracks(props.streamUrl)
  if (disposed) return
  playerOpen = true
  const [initError, result] = await catchError(Promise.resolve().then(() => VideoPlayer.initPlayer({
    playerId: PLAYER_ID,
    mode: 'fullscreen',
    url,
    title: props.title,
    subtitles,
    exitOnEnd: !props.nextLabel,
    loopOnEnd: false,
    pipEnabled: true,
    bkmodeEnabled: true,
    showControls: true,
  })))
  if (initError) return initError
  const [validationError] = await catchError(requireSuccess('initialize', result))
  return validationError
}

function handleStartError(error: Error) {
  playerOpen = false
  for (const listener of listeners) {
    void listener.remove().catch((removeError) => console.error('Could not remove native video player listener', removeError))
  }
  listeners = []
  console.error('Could not start native video playback', error)
  if (!disposed) emit('error', error.message || 'Could not start native video playback')
}

async function attachListenersAndStart() {
  const [readyError, readyListener] = await catchError(Promise.resolve().then(() => VideoPlayer.addListener('jeepCapVideoPlayerReady', (event) => void onReady(event))))
  if (readyError) return handleStartError(readyError)
  listeners.push(readyListener)
  const [playError, playListener] = await catchError(Promise.resolve().then(() => VideoPlayer.addListener('jeepCapVideoPlayerPlay', onPlay)))
  if (playError) return handleStartError(playError)
  listeners.push(playListener)
  const [pauseError, pauseListener] = await catchError(Promise.resolve().then(() => VideoPlayer.addListener('jeepCapVideoPlayerPause', onPause)))
  if (pauseError) return handleStartError(pauseError)
  listeners.push(pauseListener)
  const [endedError, endedListener] = await catchError(Promise.resolve().then(() => VideoPlayer.addListener('jeepCapVideoPlayerEnded', (event) => void onEnded(event))))
  if (endedError) return handleStartError(endedError)
  listeners.push(endedListener)
  const [exitError, exitListener] = await catchError(Promise.resolve().then(() => VideoPlayer.addListener('jeepCapVideoPlayerExit', onExit)))
  if (exitError) return handleStartError(exitError)
  listeners.push(exitListener)
  if (disposed) return
  const loadError = await loadPlayer()
  if (loadError) handleStartError(loadError)
}

async function runRemoteCommand(operation: string, command: Promise<capVideoPlayerResult>) {
  const [commandError, result] = await catchError(command)
  if (commandError) {
    console.error('Could not sync native video with the watch party', commandError)
    emit('error', commandError.message || 'Could not sync native video with the watch party')
    return false
  }
  const [validationError] = await catchError(requireSuccess(operation, result))
  if (validationError) {
    console.error('Could not sync native video with the watch party', validationError)
    emit('error', validationError.message || 'Could not sync native video with the watch party')
    return false
  }
  return true
}

function applyRemote(state: { playing: boolean; position: number }) {
  if (!ready.value || remoteChange) return
  remoteChange = true
  void (async () => {
    const target = duration.value > 0 ? Math.min(state.position, Math.max(0, duration.value - 0.5)) : state.position
    if (Math.abs(absolutePosition() - target) > REMOTE_DRIFT_SECONDS) {
      remoteSeekTarget = target
      remoteSeekUntil = performance.now() + 10_000
      const localTarget = Math.max(0, target - offset)
      if (!(await runRemoteCommand('remote seek', Promise.resolve().then(() => VideoPlayer.setCurrentTime({ ...PLAYER_ID_OPTIONS, seektime: localTarget }))))) return
      position.value = localTarget
    }
    if (state.playing && !playing.value) {
      remotePlaybackTarget = true
      remotePlaybackUntil = performance.now() + 10_000
      if (!(await runRemoteCommand('remote play', Promise.resolve().then(() => VideoPlayer.play(PLAYER_ID_OPTIONS))))) return
      playing.value = true
    } else if (!state.playing && playing.value) {
      remotePlaybackTarget = false
      remotePlaybackUntil = performance.now() + 10_000
      if (!(await runRemoteCommand('remote pause', Promise.resolve().then(() => VideoPlayer.pause(PLAYER_ID_OPTIONS))))) return
      playing.value = false
    }
    lastPolledPosition = absolutePosition()
  })().finally(() => {
    remoteChange = false
  })
}

defineExpose({ getState, applyRemote })

onMounted(() => void attachListenersAndStart())

onBeforeUnmount(() => {
  disposed = true
  stopPolling()
  if (playerOpen) {
    exitReason = 'unmount'
    void VideoPlayer.exitPlayer().catch((error: unknown) => console.error('Could not close the native video player', error))
  }
  for (const listener of listeners) {
    void listener.remove().catch((error) => console.error('Could not remove native video player listener', error))
  }
})
</script>

<template>
  <div class="size-full bg-black" aria-label="Native video player" />
</template>
