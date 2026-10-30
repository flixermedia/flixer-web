/** Playback metadata, stream URL helpers, and streamer-only requests. */
import axios from 'axios'
import { api } from './client'
import { resolveServerResourceUrl } from '../platform/serverConnection'
import { catchError } from '../utils/catchError'
import type { PlaybackInfo, SampleVideo } from '@flixermedia/flixer-api-client'
export type { NextEpisode, PlaybackInfo, PlayerChapter, PlayerSegment, SampleVideo, SegmentType } from '@flixermedia/flixer-api-client'

export type PlayMethod = 'DirectPlay' | 'DirectStream' | 'Transcode'

export interface StreamInfo {
  playMethod: PlayMethod
  source: { videoCodec: string; audioCodec?: string; width: number; height: number; durationSeconds: number }
  availableHeights: number[]
  /** Where a stream-copy stream requested at `start` really begins (the preceding keyframe). */
  keyframeStart?: number
}

export function buildStreamUrl(streamUrl: string, options: { height?: number; start?: number } = {}): string {
  const params = new URLSearchParams()
  if (options.height) params.set('height', String(options.height))
  if (options.start && options.start > 0) params.set('start', options.start.toFixed(2))
  const query = params.toString()
  return query ? `${streamUrl}?${query}` : streamUrl
}

export function buildHlsUrl(streamUrl: string, options: { height?: number } = {}): string {
  const base = `${streamUrl.replace('/streamer/stream/', '/streamer/hls/')}/index.m3u8`
  return options.height ? `${base}?height=${options.height}` : base
}

// Only WebKit plays HLS natively; Chromium browsers fall back to the progressive MP4/WebM stream.
export function supportsNativeHls(): boolean {
  if (typeof document === 'undefined') return false
  const canPlay = document.createElement('video').canPlayType('application/vnd.apple.mpegurl')
  return canPlay !== '' && !/Chrome|Chromium|Edg\//.test(navigator.userAgent)
}

// The streamer is reached through the same-origin proxy (/streamer), not the Flixer API; the token in the URL is the credential.
export async function getStreamInfo(streamUrl: string, options: { height?: number; start?: number } = {}): Promise<StreamInfo> {
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

/** How the streamer's hover-preview sheets are laid out; see `/streamer/trickplay/{token}/index.json`. */
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

/** Hover-preview thumbnails for a video, or null when none have been generated for it yet. */
export async function getTrickplay(streamUrl: string): Promise<Trickplay | null> {
  const base = streamUrl.replace('/streamer/stream/', '/streamer/trickplay/')
  const [error, response] = await catchError(axios.get<TrickplayManifest>(`${base}/index.json`, { timeout: 10_000 }))
  if (error) return null
  const manifest = response.data
  if (!manifest || manifest.count <= 0 || manifest.intervalMs <= 0 || manifest.columns <= 0 || manifest.rows <= 0) return null
  return { manifest, sheetUrl: (sheet) => `${base}/${sheet}.jpg` }
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
