import { computed, ref } from 'vue'
import { fetchHomeImage, getItemPlaybackInfo, getTrackLyrics } from '../api'
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

// One audio element for the whole app, so playback survives page navigation.
const audio = typeof Audio === 'undefined' ? null : new Audio()
if (audio) audio.preload = 'auto'

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

function updateMediaSession(track: QueueTrack | null) {
  if (!('mediaSession' in navigator)) return
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

async function loadCurrent() {
  const track = current.value
  if (!audio || !track) return
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
    audio.src = streamUrl
    const playing = audio.play()
    prefetchNext()
    void loadLyrics(streamUrl, token)
    await playing
  } catch (cause) {
    if (token !== loadToken) return
    // A rejected play() after a user-initiated pause or skip is not an error.
    if ((cause as { name?: string }).name !== 'AbortError') error.value = 'error'
    isPlaying.value = false
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

function playQueue(tracks: QueueTrack[], startIndex = 0) {
  if (tracks.length === 0) return
  queue.value = tracks
  buildOrder(Math.min(Math.max(startIndex, 0), tracks.length - 1))
  void loadCurrent()
}

function skipTo(nextPosition: number) {
  position.value = nextPosition
  void loadCurrent()
}

function next(auto = false) {
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
  if (!audio) return
  if (audio.currentTime > 3 || position.value === 0) {
    audio.currentTime = 0
    return
  }
  skipTo(position.value - 1)
}

function toggle() {
  if (!audio || !current.value) return
  if (audio.paused) void audio.play()
  else audio.pause()
}

function seek(seconds: number) {
  if (!audio || !Number.isFinite(seconds)) return
  audio.currentTime = Math.max(0, Math.min(seconds, duration.value || seconds))
  currentTime.value = audio.currentTime
}

function setVolume(value: number) {
  volume.value = Math.max(0, Math.min(1, value))
  if (audio) audio.volume = volume.value
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
  loadToken++
  audio?.pause()
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
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing'
  })
  audio.addEventListener('pause', () => {
    isPlaying.value = false
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'
  })
  audio.addEventListener('timeupdate', () => (currentTime.value = audio.currentTime))
  audio.addEventListener('durationchange', () => (duration.value = Number.isFinite(audio.duration) ? audio.duration : 0))
  audio.addEventListener('ended', () => next(true))
  audio.addEventListener('error', () => {
    if (audio.getAttribute('src')) error.value = 'error'
  })
  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', toggle)
    navigator.mediaSession.setActionHandler('pause', toggle)
    navigator.mediaSession.setActionHandler('previoustrack', previous)
    navigator.mediaSession.setActionHandler('nexttrack', () => next())
  }
}

export function useAudioPlayer() {
  return { queue, current, position, isPlaying, isLoading, currentTime, duration, volume, shuffle, repeat, error, lyrics, lyricsLoading, lyricsOpen, hasNext, playQueue, next, previous, toggle, seek, setVolume, toggleShuffle, cycleRepeat, stop }
}
