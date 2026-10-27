<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { VideoPlayer, type VideoSubtitle, type capVideoPlayerResult } from '@capgo/capacitor-video-player'
import { buildHlsUrl, buildStreamUrl, getStreamInfo, getSubtitleTracks, type StreamInfo } from '../../api'

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
  control: [state: { playing: boolean; position: number }]
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

function emitControl() {
  if (!remoteChange) emit('control', getState())
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
  try {
    await requireSuccess(operation, await command())
    return true
  } catch (error) {
    console.error(`Native video player ${operation} failed`, error)
    emit('error', error instanceof Error ? error.message : `Native video player ${operation} failed`)
    return false
  }
}

function subtitleUrl(streamUrl: string, id: string) {
  const url = new URL(streamUrl, window.location.origin)
  url.pathname = url.pathname.replace('/stream/', '/subtitles/')
  url.searchParams.set('file', id)
  return url.toString()
}

async function loadSubtitleTracks(streamUrl: string): Promise<VideoSubtitle[]> {
  try {
    const tracks = await getSubtitleTracks(streamUrl)
    return tracks.map((track) => ({ subtitle: subtitleUrl(streamUrl, track.id), language: track.language }))
  } catch (error) {
    console.error('Could not load native video subtitles', error)
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
  emitControl()
}

function onPause(event: { currentTime?: number | string; fromPlayerId?: string }) {
  if (!isCurrentPlayer(event)) return
  eventPosition(event.currentTime)
  playing.value = false
  emitProgress()
  emitControl()
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
  if (!props.nextLabel) return
  try {
    await closeForNext()
    emit('next')
  } catch (error) {
    console.error('Could not advance the native video player', error)
    emit('error', error instanceof Error ? error.message : 'Could not advance to the next episode')
  }
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
        if (result.result) eventPosition(result.value)
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

async function loadPlayer() {
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
      try {
        const streamInfo = await getStreamInfo(props.streamUrl, { start })
        if (typeof streamInfo.keyframeStart === 'number' && streamInfo.keyframeStart <= start) {
          serverStart = streamInfo.keyframeStart
        }
      } catch (error) {
        console.error('Could not find a keyframe for native playback resume', error)
      }
    }
    url = buildStreamUrl(props.streamUrl, { start: serverStart })
    offset = serverStart
    if (props.info.playMethod === 'DirectStream') seekOnReady = start - serverStart
  }

  const subtitles = await loadSubtitleTracks(props.streamUrl)
  if (disposed) return
  playerOpen = true
  const result = await VideoPlayer.initPlayer({
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
  })
  await requireSuccess('initialize', result)
}

async function attachListenersAndStart() {
  try {
    listeners.push(await VideoPlayer.addListener('jeepCapVideoPlayerReady', (event) => void onReady(event)))
    listeners.push(await VideoPlayer.addListener('jeepCapVideoPlayerPlay', onPlay))
    listeners.push(await VideoPlayer.addListener('jeepCapVideoPlayerPause', onPause))
    listeners.push(await VideoPlayer.addListener('jeepCapVideoPlayerEnded', (event) => void onEnded(event)))
    listeners.push(await VideoPlayer.addListener('jeepCapVideoPlayerExit', onExit))
    if (disposed) return
    await loadPlayer()
  } catch (error) {
    playerOpen = false
    for (const listener of listeners) {
      void listener.remove().catch((removeError) => console.error('Could not remove native video player listener', removeError))
    }
    listeners = []
    console.error('Could not start native video playback', error)
    if (!disposed) emit('error', error instanceof Error ? error.message : 'Could not start native video playback')
  }
}

function applyRemote(state: { playing: boolean; position: number }) {
  if (!ready.value || remoteChange || !props.locked) return
  remoteChange = true
  void (async () => {
    try {
      const target = duration.value > 0 ? Math.min(state.position, Math.max(0, duration.value - 0.5)) : state.position
      if (Math.abs(absolutePosition() - target) > REMOTE_DRIFT_SECONDS) {
        const localTarget = Math.max(0, target - offset)
        await requireSuccess('remote seek', await VideoPlayer.setCurrentTime({ ...PLAYER_ID_OPTIONS, seektime: localTarget }))
        position.value = localTarget
      }
      if (state.playing && !playing.value) {
        await requireSuccess('remote play', await VideoPlayer.play(PLAYER_ID_OPTIONS))
        playing.value = true
      } else if (!state.playing && playing.value) {
        await requireSuccess('remote pause', await VideoPlayer.pause(PLAYER_ID_OPTIONS))
        playing.value = false
      }
    } catch (error) {
      console.error('Could not sync native video with the watch party', error)
      emit('error', error instanceof Error ? error.message : 'Could not sync native video with the watch party')
    } finally {
      remoteChange = false
    }
  })()
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
