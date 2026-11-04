/** Playback metadata, stream URL helpers, and streamer-only requests. */
import axios from 'axios'
import { api } from './client'
import { resolveServerResourceUrl } from '../platform/serverConnection'
import { catchError } from '../utils/catchError'
import type { PlaybackInfo, SampleVideo } from 'flixer-api-client'
export type { NextEpisode, PlaybackInfo, PlayerChapter, PlayerSegment, SampleVideo, SegmentType } from 'flixer-api-client'

export type PlayMethod = 'DirectPlay' | 'DirectStream' | 'Transcode'

export interface AudioTrack {
  /** Absolute stream index reported by ffprobe and accepted by flixer-streamer. */
  index: number
  codec: string
  language?: string
  title?: string
  channels?: number
  default: boolean
}

export interface StreamInfo {
  playMethod: PlayMethod
  source: { videoCodec: string; audioCodec?: string; audioTracks?: AudioTrack[]; width: number; height: number; durationSeconds: number }
  availableHeights: number[]
  /** Set for audio files: the container type the streamer serves them as. */
  mimeType?: string
  directAllowed?: boolean
  /** Where a stream-copy stream requested at `start` really begins (the preceding keyframe). */
  keyframeStart?: number
}

export function buildStreamUrl(streamUrl: string, options: { height?: number; start?: number; audioTrack?: number } = {}): string {
  const params = new URLSearchParams()
  if (options.height) params.set('height', String(options.height))
  if (options.start && options.start > 0) params.set('start', options.start.toFixed(2))
  if (options.audioTrack !== undefined) params.set('audioTrack', String(options.audioTrack))
  const query = params.toString()
  return query ? `${streamUrl}?${query}` : streamUrl
}

export function buildAudioBitrateUrl(streamUrl: string, bitrate: number): string {
  const url = new URL(streamUrl, typeof window === 'undefined' ? 'http://localhost' : window.location.href)
  url.searchParams.set('audioBitrate', String(bitrate))
  if (/^https?:\/\//i.test(streamUrl)) return url.toString()
  return `${url.pathname}${url.search}${url.hash}`
}

export function buildHlsUrl(streamUrl: string, options: { height?: number; audioTrack?: number } = {}): string {
  const base = `${streamUrl.replace('/streamer/stream/', '/streamer/hls/')}/index.m3u8`
  const params = new URLSearchParams()
  if (options.height) params.set('height', String(options.height))
  if (options.audioTrack !== undefined) params.set('audioTrack', String(options.audioTrack))
  const query = params.toString()
  return query ? `${base}?${query}` : base
}

// WebKit can play HLS natively; Chromium browsers use hls.js when available.
export function supportsNativeHls(): boolean {
  if (typeof document === 'undefined') return false
  const canPlay = document.createElement('video').canPlayType('application/vnd.apple.mpegurl')
  return canPlay !== '' && !/Chrome|Chromium|Edg\//.test(navigator.userAgent)
}

// The streamer is reached through the same-origin proxy (/streamer), not the Flixer API; the token in the URL is the credential.
export async function getStreamInfo(streamUrl: string, options: { height?: number; start?: number; audioTrack?: number } = {}): Promise<StreamInfo> {
  const url = buildStreamUrl(streamUrl.replace('/streamer/stream/', '/streamer/info/'), options)
  const response = await axios.get<StreamInfo>(url, { timeout: 20_000 })
  return response.data
}

export async function listSampleVideos(): Promise<SampleVideo[]> {
  const response = await api.get<SampleVideo[]>('/playback/samples')
  return response.data
}

export async function getSamplePlaybackInfo(id: string): Promise<PlaybackInfo> {
  const response = await api.post<PlaybackInfo>(`/playback/samples/${encodeURIComponent(id)}/playback-info`)
  return { ...response.data, mediaSource: { ...response.data.mediaSource, streamUrl: resolveServerResourceUrl(response.data.mediaSource.streamUrl) } }
}

export async function getItemPlaybackInfo(id: string): Promise<PlaybackInfo> {
  const response = await api.post<PlaybackInfo>(`/playback/items/${encodeURIComponent(id)}/playback-info`)
  return { ...response.data, mediaSource: { ...response.data.mediaSource, streamUrl: resolveServerResourceUrl(response.data.mediaSource.streamUrl) } }
}

export interface PlayerSubtitle {
  id: string
  language: string
  label?: string
}

/** Subtitle files beside the video, listed by the streamer for a stream token. Empty when there are none. */
export async function getSubtitleTracks(streamUrl: string): Promise<PlayerSubtitle[]> {
  const [error, response] = await catchError(axios.get<{ tracks: PlayerSubtitle[] }>(streamUrl.replace('/streamer/stream/', '/streamer/subtitles/'), { timeout: 20_000 }))
  if (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return []
    throw error
  }
  return response.data.tracks ?? []
}

/** How the streamer's HLS image-playlist hover previews are laid out. */
export interface TrickplayManifest {
  intervalMs: number
  thumbWidth: number
  thumbHeight: number
  columns: number
  rows: number
  count: number
  sheets: number
}

export interface Trickplay {
  manifest: TrickplayManifest
  sheetUrl: (sheet: number) => string
}

/** Parse an HLS image playlist, resolving its tile-sheet URLs against the playlist URL. */
export function parseTrickplayPlaylist(playlist: string, playlistUrl: string): Trickplay | null {
  const baseUrl = new URL(playlistUrl, typeof window === 'undefined' ? 'http://localhost' : window.location.href)
  const lines = playlist
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  let intervalMs = 0
  let thumbWidth = 0
  let thumbHeight = 0
  let columns = 0
  let rows = 0
  let count = 0
  let pendingDuration = 0
  const sheetUrls: string[] = []

  for (const line of lines) {
    if (line.startsWith('#EXT-X-TILES:')) {
      const attributes = line.slice('#EXT-X-TILES:'.length)
      const resolution = attributes.match(/(?:^|,)RESOLUTION=(\d+)x(\d+)(?:,|$)/)
      const layout = attributes.match(/(?:^|,)LAYOUT=(\d+)x(\d+)(?:,|$)/)
      const duration = attributes.match(/(?:^|,)DURATION=([\d.]+)(?:,|$)/)
      if (!resolution || !layout || !duration) return null
      thumbWidth = Number(resolution[1])
      thumbHeight = Number(resolution[2])
      columns = Number(layout[1])
      rows = Number(layout[2])
      intervalMs = Number(duration[1]) * 1000
    } else if (line.startsWith('#EXTINF:')) {
      pendingDuration = Number(line.slice('#EXTINF:'.length).split(',')[0])
    } else if (!line.startsWith('#')) {
      if (!pendingDuration || !intervalMs) return null
      count += Math.round((pendingDuration * 1000) / intervalMs)
      pendingDuration = 0
      sheetUrls.push(new URL(line, baseUrl).toString())
    }
  }

  if (!intervalMs || !thumbWidth || !thumbHeight || !columns || !rows || !count || !sheetUrls.length) return null
  const manifest: TrickplayManifest = {
    intervalMs,
    thumbWidth,
    thumbHeight,
    columns,
    rows,
    count,
    sheets: sheetUrls.length,
  }
  return { manifest, sheetUrl: (sheet) => sheetUrls[sheet] ?? '' }
}

/** Hover-preview thumbnails for a video, or null when none have been generated for it yet. */
export async function getTrickplay(streamUrl: string): Promise<Trickplay | null> {
  const base = streamUrl.replace('/streamer/stream/', '/streamer/trickplay/')
  const playlistUrl = `${base}/tiles.m3u8`
  const [error, response] = await catchError(
    axios.get<string>(playlistUrl, {
      responseType: 'text',
      transformResponse: (data: string) => data,
      timeout: 10_000,
    }),
  )
  if (error) return null
  return parseTrickplayPlaylist(response.data, playlistUrl)
}

/** WebVTT text for one subtitle file. */
export async function getSubtitleText(streamUrl: string, id: string): Promise<string> {
  const response = await axios.get<string>(streamUrl.replace('/streamer/stream/', '/streamer/subtitles/'), {
    params: { file: id },
    responseType: 'text',
    transformResponse: (data: string) => data,
    timeout: 20_000,
  })
  return response.data
}

/** Raw LRC text for a track's stream token, or null when the track has no lyrics file. */
export async function getTrackLyrics(streamUrl: string): Promise<string | null> {
  const requestUrl = streamUrl.replace('/streamer/stream/', '/streamer/lyrics/')
  const [error, response] = await catchError(axios.get<string>(requestUrl, { responseType: 'text', transformResponse: (data: string) => data, timeout: 20_000 }))
  if (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null
    throw error
  }
  return response.data
}
