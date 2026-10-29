import { computed, ref } from 'vue'
import { Capacitor, registerPlugin } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { NativeAudio } from '@capgo/capacitor-native-audio'
import { fetchHomeImage, getItemPlaybackInfo, getTrackLyrics, reportListening } from '../api'
import { parseLrc, type ParsedLyrics } from './lrc'

export interface QueueTrack {
  id: string
  title: string
  artist: string | null
  artistId: string | null
  album: string | null
  albumId: string | null
  /** Artwork of the album (or track) as an item id and image index. */
  art: { itemId: string; index: number; version?: string } | null
}

export type RepeatMode = 'off' | 'all' | 'one'
export type PartyAudioCommand = { action: 'play' | 'pause' } | { action: 'seek'; position: number } | { action: 'change-item'; itemId: string }

// One audio element for the whole app, so playback survives page navigation.
const audio = typeof Audio === 'undefined' ? null : new Audio()
if (audio) audio.preload = 'auto'
const nativePlayback = Capacitor.isNativePlatform()
interface AudioForegroundPlugin {
  start(): Promise<void>
  stop(): Promise<void>
}
const androidAudioForeground = Capacitor.getPlatform() === 'android' ? registerPlugin<AudioForegroundPlugin>('AudioForeground') : null
const NATIVE_NOTIFICATION_ASSET_PREFIX = 'flixer-track-'

function usingNativeAsset() {
  return nativePlayback && nativeAssetId !== null
}

const queue = ref<QueueTrack[]>([])
const order = ref<number[]>([])
const position = ref(-1)
const isPlaying = ref(false)
const isLoading = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(Number(localStorage.getItem('flixer.volume') ?? 1))
const shuffle = ref(false)
const repeat = ref<RepeatMode>('off')
const error = ref('')
const lyrics = ref<ParsedLyrics | null>(null)
const lyricsLoading = ref(false)
const lyricsOpen = ref(false)

let loadToken = 0
let nativeAssetId: string | null = null
let nativeInitialization: Promise<void> | undefined
let listeningTrackId: string | null = null
let listeningInterval: ReturnType<typeof setInterval> | undefined
let partyControlHandler: ((command: PartyAudioCommand) => boolean) | undefined

function requestPartyControl(command: PartyAudioCommand): boolean {
  return partyControlHandler?.(command) === true
}

function reportNativeError(operation: string, cause: unknown) {
  console.error(`Native audio ${operation} failed`, cause)
  error.value = 'error'
}

function startAndroidAudioForegroundService() {
  return (
    androidAudioForeground?.start().catch((cause: unknown) => {
      console.warn('Android audio foreground service is unavailable; background playback may be limited', cause)
    }) ?? Promise.resolve()
  )
}

function stopAndroidAudioForegroundService() {
  return (
    androidAudioForeground?.stop().catch((cause: unknown) => {
      console.warn('Could not stop the Android audio foreground service', cause)
    }) ?? Promise.resolve()
  )
}

async function cacheNativeArtwork(track: QueueTrack): Promise<string | undefined> {
  if (!track.art) return undefined
  const { itemId, index, version } = track.art
  const path = `flixer-art-${encodeURIComponent(itemId)}-${index}-${encodeURIComponent(version ?? 'current')}.jpg`
  const blob = await fetchHomeImage(itemId, index, 512, version)
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Could not encode album artwork'))
        return
      }
      resolve(reader.result.slice(reader.result.indexOf(',') + 1))
    }
    reader.onerror = () => reject(reader.error ?? new Error('Could not read album artwork'))
    reader.readAsDataURL(blob)
  })
  await Filesystem.writeFile({ path, data: base64, directory: Directory.Cache })
  const { uri } = await Filesystem.getUri({ path, directory: Directory.Cache })
  return uri
}

function initializeNativeAudio(): Promise<void> {
  if (!nativePlayback) return Promise.resolve()
  if (!nativeInitialization) {
    nativeInitialization = (async () => {
      await NativeAudio.configure({
        background: true,
        backgroundPlayback: true,
        focus: true,
        ignoreSilent: true,
        showNotification: true,
      })
      await NativeAudio.addListener('currentTime', (event) => {
        if (event.assetId === nativeAssetId && Number.isFinite(event.currentTime)) currentTime.value = event.currentTime
      })
      await NativeAudio.addListener('playbackState', (event) => {
        if (event.assetId !== nativeAssetId) return
        if (typeof event.currentTime === 'number' && Number.isFinite(event.currentTime)) currentTime.value = event.currentTime
        if (typeof event.duration === 'number' && Number.isFinite(event.duration)) duration.value = event.duration
        isPlaying.value = event.isPlaying
        if (event.isPlaying) {
          if (current.value) reportPlaying(current.value.id)
          void startAndroidAudioForegroundService().catch((cause: unknown) => reportNativeError('foreground service start', cause))
        } else {
          reportStopped()
          void stopAndroidAudioForegroundService().catch((cause: unknown) => reportNativeError('foreground service stop', cause))
        }

        if (event.reason === 'remotePlay') requestPartyControl({ action: 'play' })
        else if (event.reason === 'remotePause' || event.reason === 'remoteStop') requestPartyControl({ action: 'pause' })
        else if (event.reason === 'remoteNextTrack') next()
        else if (event.reason === 'remotePreviousTrack') previous()
      })
      await NativeAudio.addListener('complete', (event) => {
        if (event.assetId !== nativeAssetId) return
        isPlaying.value = false
        currentTime.value = duration.value
        reportStopped()
        next(true)
      })
    })().catch((cause: unknown) => {
      nativeInitialization = undefined
      throw cause
    })
  }
  return nativeInitialization
}

async function unloadNativeAsset() {
  const assetId = nativeAssetId
  nativeAssetId = null
  if (!assetId) return
  try {
    await NativeAudio.unload({ assetId })
  } catch (cause) {
    console.warn('Could not unload the previous native audio asset', cause)
  }
}

function playNative() {
  const assetId = nativeAssetId
  if (!assetId) return
  void (async () => {
    await startAndroidAudioForegroundService()
    await NativeAudio.play({ assetId })
    isPlaying.value = true
    if (current.value) reportPlaying(current.value.id)
  })().catch((cause: unknown) => reportNativeError('play', cause))
}

function pauseNative() {
  if (!nativeAssetId) return
  void NativeAudio.pause({ assetId: nativeAssetId })
    .then(async () => {
      isPlaying.value = false
      reportStopped()
      await stopAndroidAudioForegroundService()
    })
    .catch((cause: unknown) => reportNativeError('pause', cause))
}

function seekNative(seconds: number) {
  if (!nativeAssetId || !Number.isFinite(seconds)) return
  const target = Math.max(0, Math.min(seconds, duration.value || seconds))
  void NativeAudio.setCurrentTime({ assetId: nativeAssetId, time: target })
    .then(() => {
      currentTime.value = target
    })
    .catch((cause: unknown) => reportNativeError('seek', cause))
}

function setNativeRate(rate: number) {
  if (!nativeAssetId) return
  void NativeAudio.setRate({ assetId: nativeAssetId, rate }).catch((cause: unknown) => reportNativeError('rate adjustment', cause))
}

async function loadNativeTrack(streamUrl: string, track: QueueTrack, token: number, autoplay: boolean) {
  let assetId: string | null = null
  try {
    await initializeNativeAudio()
    await stopAndroidAudioForegroundService()
    await unloadNativeAsset()
    if (token !== loadToken) return
    assetId = `${NATIVE_NOTIFICATION_ASSET_PREFIX}${token}`
    const artworkUrl = await cacheNativeArtwork(track).catch((cause: unknown) => {
      console.warn('Could not prepare lock-screen album artwork', cause)
      return undefined
    })
    if (token !== loadToken) return
    nativeAssetId = assetId
    await NativeAudio.preload({
      assetId,
      assetPath: streamUrl,
      isUrl: true,
      volume: volume.value,
      notificationMetadata: {
        title: track.title,
        artist: track.artist ?? '',
        album: track.album ?? '',
        ...(artworkUrl ? { artworkUrl } : {}),
      },
    })
    if (token !== loadToken) {
      await unloadNativeAsset()
      return
    }
    const metadata = await NativeAudio.getDuration({ assetId })
    if (Number.isFinite(metadata.duration) && metadata.duration > 0) duration.value = metadata.duration
    prefetchNext()
    void loadLyrics(streamUrl, token)
    if (autoplay) {
      await startAndroidAudioForegroundService()
      await NativeAudio.play({ assetId })
      isPlaying.value = true
      reportPlaying(track.id)
    } else {
      isPlaying.value = false
    }
  } catch (cause) {
    if (token !== loadToken) return
    console.error('Native audio playback failed; falling back to web audio', cause)
    if (assetId) {
      nativeAssetId = null
      await NativeAudio.unload({ assetId }).catch((unloadError: unknown) => {
        console.warn('Could not unload the failed native audio asset', unloadError)
      })
    }
    await stopAndroidAudioForegroundService()
    if (!audio) throw cause
    audio.src = streamUrl
    prefetchNext()
    void loadLyrics(streamUrl, token)
    if (autoplay) await audio.play()
    else audio.pause()
  }
}

async function refreshNativePlayback() {
  if (!nativePlayback || !nativeAssetId) return
  await initializeNativeAudio()
  const [time, length, state] = await Promise.all([NativeAudio.getCurrentTime({ assetId: nativeAssetId }), NativeAudio.getDuration({ assetId: nativeAssetId }), NativeAudio.isPlaying({ assetId: nativeAssetId })])
  if (Number.isFinite(time.currentTime)) currentTime.value = time.currentTime
  if (Number.isFinite(length.duration)) duration.value = length.duration
  isPlaying.value = state.isPlaying
  if (state.isPlaying) await startAndroidAudioForegroundService()
  else await stopAndroidAudioForegroundService()
  if (state.isPlaying && current.value) reportPlaying(current.value.id)
  else reportStopped()
}

function reportPlaying(itemId: string) {
  if (listeningTrackId !== itemId) reportStopped()
  listeningTrackId = itemId
  void reportListening(itemId, 'playing').catch(() => undefined)
  if (listeningInterval) clearInterval(listeningInterval)
  listeningInterval = setInterval(() => {
    if (listeningTrackId === itemId && isPlaying.value) void reportListening(itemId, 'playing').catch(() => undefined)
  }, 60_000)
}

function reportStopped() {
  if (!listeningTrackId) return
  const itemId = listeningTrackId
  listeningTrackId = null
  if (listeningInterval) clearInterval(listeningInterval)
  listeningInterval = undefined
  void reportListening(itemId, 'stopped').catch(() => undefined)
}

const current = computed<QueueTrack | null>(() => {
  const index = order.value[position.value]
  return index === undefined ? null : (queue.value[index] ?? null)
})
const hasNext = computed(() => repeat.value === 'all' || position.value < order.value.length - 1)

function buildOrder(startIndex: number) {
  const indexes = queue.value.map((_, i) => i)
  if (!shuffle.value) {
    order.value = indexes
    position.value = startIndex
    return
  }
  const rest = indexes.filter((i) => i !== startIndex)
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[rest[i], rest[j]] = [rest[j], rest[i]]
  }
  order.value = [startIndex, ...rest]
  position.value = 0
}

let artworkUrl = ''
let artworkToken = 0

function releaseArtwork() {
  if (artworkUrl) URL.revokeObjectURL(artworkUrl)
  artworkUrl = ''
}

type MediaSessionAction = Parameters<MediaSession['setActionHandler']>[0]

function setHandler(action: MediaSessionAction, handler: MediaSessionActionHandler | null) {
  try {
    navigator.mediaSession.setActionHandler(action, handler)
  } catch {
    // The browser does not support this action.
  }
}

// iOS only shows previous/next on the lock screen when those handlers exist while the session is active, and it
// prefers seek buttons whenever seekbackward/seekforward handlers are set, so register again on every track and play.
function registerMediaSessionHandlers() {
  if (nativePlayback || !('mediaSession' in navigator)) return
  setHandler('play', () => {
    if (!audio || !audio.paused) return
    if (requestPartyControl({ action: 'play' })) return
    void audio.play()
  })
  setHandler('pause', () => {
    if (!audio || audio.paused || requestPartyControl({ action: 'pause' })) return
    audio.pause()
  })
  setHandler('previoustrack', () => previous())
  setHandler('nexttrack', () => next())
  setHandler('seekbackward', null)
  setHandler('seekforward', null)
  setHandler('seekto', (details) => {
    if (details.seekTime !== undefined && details.seekTime !== null) seek(details.seekTime)
  })
}

function updatePositionState() {
  if (nativePlayback || !audio || !('mediaSession' in navigator) || !Number.isFinite(audio.duration) || audio.duration <= 0) return
  try {
    navigator.mediaSession.setPositionState({ duration: audio.duration, playbackRate: audio.playbackRate || 1, position: Math.min(audio.currentTime, audio.duration) })
  } catch {
    // Position state is optional.
  }
}

function updateMediaSession(track: QueueTrack | null) {
  if (nativePlayback) return
  if (!('mediaSession' in navigator)) return
  registerMediaSessionHandlers()
  const token = ++artworkToken
  navigator.mediaSession.metadata = track ? new MediaMetadata({ title: track.title, artist: track.artist ?? '', album: track.album ?? '' }) : null
  if (!track?.art) return
  const { itemId, index, version } = track.art
  void fetchHomeImage(itemId, index, 512, version)
    .then((blob) => {
      if (token !== artworkToken) return
      releaseArtwork()
      artworkUrl = URL.createObjectURL(blob)
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist ?? '',
        album: track.album ?? '',
        artwork: [{ src: artworkUrl, sizes: '512x512', type: blob.type || 'image/jpeg' }],
      })
    })
    .catch(() => undefined)
}

// Resolving the next stream URL ahead of time lets the next track start synchronously when the current one ends,
// which mobile browsers require to keep playing while the page is in the background.
const prefetched = new Map<string, Promise<string>>()

function resolveStreamUrl(id: string): Promise<string> {
  let promise = prefetched.get(id)
  if (!promise) {
    promise = getItemPlaybackInfo(id).then((info) => info.mediaSource.streamUrl)
    promise.catch(() => prefetched.delete(id))
    prefetched.set(id, promise)
  }
  return promise
}

function prefetchNext() {
  const nextIndex = order.value[position.value + 1 < order.value.length ? position.value + 1 : repeat.value === 'all' ? 0 : -1]
  const upcoming = nextIndex === undefined ? null : queue.value[nextIndex]
  if (upcoming) void resolveStreamUrl(upcoming.id).catch(() => undefined)
}

async function loadCurrent(autoplay = true) {
  const track = current.value
  if ((!audio && !nativePlayback) || !track) return
  const token = ++loadToken
  isLoading.value = true
  error.value = ''
  lyrics.value = null
  currentTime.value = 0
  duration.value = 0
  updateMediaSession(track)
  try {
    const streamUrl = await resolveStreamUrl(track.id)
    prefetched.delete(track.id)
    if (token !== loadToken) return
    if (nativePlayback) {
      await loadNativeTrack(streamUrl, track, token, autoplay)
    } else if (audio) {
      audio.src = streamUrl
      prefetchNext()
      void loadLyrics(streamUrl, token)
      if (autoplay) await audio.play()
      else audio.pause()
    }
  } catch (cause) {
    if (token !== loadToken) return
    // A rejected play() after a user-initiated pause or skip is not an error.
    if ((cause as { name?: string }).name !== 'AbortError') error.value = 'error'
    isPlaying.value = false
    if (nativePlayback) {
      reportNativeError('load', cause)
      void stopAndroidAudioForegroundService().catch((serviceError: unknown) => reportNativeError('foreground service stop', serviceError))
    }
  } finally {
    if (token === loadToken) isLoading.value = false
  }
}

async function loadLyrics(streamUrl: string, token: number) {
  lyricsLoading.value = true
  try {
    const text = await getTrackLyrics(streamUrl)
    if (token === loadToken) lyrics.value = text ? parseLrc(text) : null
  } catch {
    if (token === loadToken) lyrics.value = null
  } finally {
    if (token === loadToken) lyricsLoading.value = false
  }
}

function loadQueue(tracks: QueueTrack[], startIndex = 0) {
  if (tracks.length === 0) return
  queue.value = tracks
  buildOrder(Math.min(Math.max(startIndex, 0), tracks.length - 1))
  void loadCurrent()
}

function playQueue(tracks: QueueTrack[], startIndex = 0) {
  const track = tracks[Math.min(Math.max(startIndex, 0), tracks.length - 1)]
  if (track && requestPartyControl({ action: 'change-item', itemId: track.id })) return
  loadQueue(tracks, startIndex)
}

async function applyPartyPlayback(track: QueueTrack, targetPosition: number, shouldPlay: boolean) {
  const changed = current.value?.id !== track.id
  if (changed) {
    queue.value = [track]
    order.value = [0]
    position.value = 0
    await loadCurrent(shouldPlay)
  }
  if (current.value?.id !== track.id) return
  const boundedPosition = Math.max(0, Math.min(targetPosition, duration.value || targetPosition))
  if (usingNativeAsset()) {
    if (!nativeAssetId) return
    if (Math.abs(currentTime.value - boundedPosition) > 0.15) {
      await NativeAudio.setCurrentTime({ assetId: nativeAssetId, time: boundedPosition })
      currentTime.value = boundedPosition
    }
    if (shouldPlay && !isPlaying.value && nativeAssetId) {
      await startAndroidAudioForegroundService()
      await NativeAudio.play({ assetId: nativeAssetId })
      isPlaying.value = true
    } else if (!shouldPlay && isPlaying.value && nativeAssetId) {
      await NativeAudio.pause({ assetId: nativeAssetId })
      isPlaying.value = false
      await stopAndroidAudioForegroundService()
    }
    return
  }
  if (!audio) return
  if (Math.abs(audio.currentTime - boundedPosition) > 0.15) {
    audio.currentTime = boundedPosition
    currentTime.value = audio.currentTime
  }
  if (shouldPlay && audio.paused) await audio.play()
  else if (!shouldPlay && !audio.paused) audio.pause()
}

function correctPartyDrift(position: number) {
  if (!Number.isFinite(position)) return
  if (usingNativeAsset()) {
    const drift = position - currentTime.value
    if (Math.abs(drift) >= 1) {
      setNativeRate(1)
      seekNative(position)
    } else if (drift <= -0.15) {
      setNativeRate(Math.max(0.97, 1 + drift * 0.03))
    } else {
      setNativeRate(1)
    }
    return
  }
  if (!audio) return
  const drift = position - audio.currentTime
  if (Math.abs(drift) >= 1) {
    audio.playbackRate = 1
    audio.currentTime = Math.max(0, Math.min(position, duration.value || position))
    currentTime.value = audio.currentTime
  } else if (Math.abs(drift) >= 0.15) {
    audio.playbackRate = Math.max(0.97, Math.min(1.03, 1 + drift * 0.03))
  } else {
    audio.playbackRate = 1
  }
}

function setPartyControlHandler(handler: ((command: PartyAudioCommand) => boolean) | undefined) {
  partyControlHandler = handler
}

function skipTo(nextPosition: number) {
  position.value = nextPosition
  void loadCurrent()
}

function next(auto = false) {
  if (position.value >= 0 && repeat.value === 'one' && auto && current.value) {
    if (requestPartyControl({ action: 'seek', position: 0 })) return
  }
  const nextIndex = position.value + 1 < order.value.length ? position.value + 1 : repeat.value === 'all' ? 0 : -1
  const nextTrack = order.value[nextIndex] === undefined ? null : queue.value[order.value[nextIndex]]
  if (nextTrack && requestPartyControl({ action: 'change-item', itemId: nextTrack.id })) return
  if (auto && !nextTrack && current.value && requestPartyControl({ action: 'pause' })) return
  if (auto && repeat.value === 'one' && usingNativeAsset()) {
    seekNative(0)
    playNative()
    return
  }
  if (auto && repeat.value === 'one' && audio) {
    audio.currentTime = 0
    void audio.play()
    return
  }
  if (position.value < order.value.length - 1) return skipTo(position.value + 1)
  if (repeat.value === 'all' && order.value.length > 0) return skipTo(0)
  if (auto) isPlaying.value = false
}

function previous() {
  if (!audio && !nativePlayback) return
  if ((usingNativeAsset() ? currentTime.value : (audio?.currentTime ?? 0)) > 3 || position.value === 0) {
    if (requestPartyControl({ action: 'seek', position: 0 })) return
    if (usingNativeAsset()) seekNative(0)
    else if (audio) audio.currentTime = 0
    return
  }
  const previousTrack = queue.value[order.value[position.value - 1]]
  if (previousTrack && requestPartyControl({ action: 'change-item', itemId: previousTrack.id })) return
  skipTo(position.value - 1)
}

function toggle() {
  if ((!audio && !nativePlayback) || !current.value) return
  if (requestPartyControl({ action: isPlaying.value ? 'pause' : 'play' })) return
  if (usingNativeAsset()) {
    if (isPlaying.value) pauseNative()
    else playNative()
    return
  }
  if (!audio) return
  if (audio.paused) void audio.play()
  else audio.pause()
}

function seek(seconds: number) {
  if ((!audio && !nativePlayback) || !Number.isFinite(seconds)) return
  const position = Math.max(0, Math.min(seconds, duration.value || seconds))
  if (requestPartyControl({ action: 'seek', position })) return
  if (usingNativeAsset()) {
    seekNative(position)
    return
  }
  if (!audio) return
  audio.currentTime = position
  currentTime.value = audio.currentTime
}

function setVolume(value: number) {
  volume.value = Math.max(0, Math.min(1, value))
  if (audio) audio.volume = volume.value
  if (nativePlayback && nativeAssetId) {
    void NativeAudio.setVolume({ assetId: nativeAssetId, volume: volume.value }).catch((cause: unknown) => reportNativeError('volume', cause))
  }
  localStorage.setItem('flixer.volume', String(volume.value))
}

function toggleShuffle() {
  shuffle.value = !shuffle.value
  const index = order.value[position.value]
  if (index !== undefined) buildOrder(index)
}

function cycleRepeat() {
  repeat.value = repeat.value === 'off' ? 'all' : repeat.value === 'all' ? 'one' : 'off'
}

function stop() {
  if (requestPartyControl({ action: 'pause' })) return
  loadToken++
  reportStopped()
  if (usingNativeAsset()) {
    void (async () => {
      await unloadNativeAsset()
      await stopAndroidAudioForegroundService()
    })().catch((cause: unknown) => reportNativeError('stop', cause))
  } else audio?.pause()
  if (audio) audio.playbackRate = 1
  if (audio) audio.removeAttribute('src')
  queue.value = []
  order.value = []
  position.value = -1
  lyrics.value = null
  lyricsOpen.value = false
  isPlaying.value = false
  isLoading.value = false
  prefetched.clear()
  updateMediaSession(null)
  releaseArtwork()
}

if (audio) {
  audio.volume = Math.max(0, Math.min(1, volume.value))
  audio.addEventListener('play', () => {
    isPlaying.value = true
    const track = current.value
    if (track) reportPlaying(track.id)
    if ('mediaSession' in navigator) {
      registerMediaSessionHandlers()
      navigator.mediaSession.playbackState = 'playing'
    }
  })
  audio.addEventListener('pause', () => {
    isPlaying.value = false
    reportStopped()
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'
  })
  audio.addEventListener('timeupdate', () => (currentTime.value = audio.currentTime))
  audio.addEventListener('durationchange', () => {
    duration.value = Number.isFinite(audio.duration) ? audio.duration : 0
    updatePositionState()
  })
  audio.addEventListener('seeked', updatePositionState)
  audio.addEventListener('ended', () => {
    reportStopped()
    next(true)
  })
  audio.addEventListener('error', () => {
    if (audio.getAttribute('src')) error.value = 'error'
  })
  registerMediaSessionHandlers()
}

export function useAudioPlayer() {
  return { queue, current, position, isPlaying, isLoading, currentTime, duration, volume, shuffle, repeat, error, lyrics, lyricsLoading, lyricsOpen, hasNext, playQueue, next, previous, toggle, seek, setVolume, toggleShuffle, cycleRepeat, stop, applyPartyPlayback, correctPartyDrift, setPartyControlHandler, refreshNativePlayback }
}
