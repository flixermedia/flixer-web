import { apiRequest } from './client'
import { resolveServerResourceUrl } from '../platform/serverConnection'

export const GUIDE_CHANNEL_PAGE_SIZE = 18

export interface GuideChannel {
  id: string
  name: string
  icon: string | null
  alternateNames: string[]
  variantCount: number
  iptvChannelId: string | null
  watchable: boolean
  sortOrder: number
}

export interface GuideProgramme {
  channelExternalId: string
  channelId: string
  start: number | string
  stop: number | string
  title: string
  subtitle?: string
  description?: string
  category?: string
}

export interface GuideData {
  channels: GuideChannel[]
  programmes: GuideProgramme[]
  totalChannels: number
  channelOffset: number
  from: string
  to: string
  regionalMergeThresholdPercent: number
  sources: Pick<GuideSource, 'id' | 'kind' | 'name' | 'lastRefreshedAt' | 'lastError'>[]
}

export interface GuideSource {
  id: string
  kind: 'epg' | 'iptv'
  name: string
  url: string
  enabled: boolean
  isDefault: boolean
  sortOrder: number
  channelCount: number
  programmeCount: number
  lastRefreshedAt: string | null
  lastError: string | null
}

export interface AdminGuideChannel {
  id: string
  sourceId: string
  sourceName: string
  name: string
  icon: string | null
  enabled: boolean
  sortOrder: number
  iptvChannelId: string | null
  automaticIptvChannelId: string | null
}

export interface AdminGuideIptvChannel {
  id: string
  sourceId: string
  sourceName: string
  name: string
  icon: string | null
  group: string | null
  playable: boolean
  sortOrder: number
}

export interface AdminGuideData {
  sources: GuideSource[]
  settings: { regionalMergeThresholdPercent: number }
  channels: AdminGuideChannel[]
  iptvChannels: AdminGuideIptvChannel[]
}

export interface GuidePlaybackInfo {
  playSessionId: string
  mediaSource: {
    id: string
    title: string
    container: 'm3u8' | 'mpd'
    directPlay: true
    mediaSourceId: string
    streamUrl: string
  }
  expiresAt: string
}

export interface EpgChannel extends GuideChannel {}

export interface EpgProgramme extends Omit<GuideProgramme, 'start' | 'stop'> {
  start: number
  stop: number
}

export interface EpgData {
  channels: EpgChannel[]
  programmes: EpgProgramme[]
  totalChannels: number
  channelOffset: number
  sources: GuideData['sources']
}

function timestamp(value: number | string): number {
  return typeof value === 'number' ? value : Date.parse(value)
}

export function toEpgData(data: GuideData): EpgData {
  return {
    channels: data.channels,
    programmes: data.programmes.flatMap((programme) => {
      const start = timestamp(programme.start)
      const stop = timestamp(programme.stop)
      if (!Number.isFinite(start) || !Number.isFinite(stop) || stop <= start) return []
      return [{ ...programme, start, stop }]
    }),
    totalChannels: data.totalChannels,
    channelOffset: data.channelOffset,
    sources: data.sources,
  }
}

export async function getGuide(
  from: Date,
  to: Date,
  channelOffset = 0,
  signal?: AbortSignal,
  channelLimit = GUIDE_CHANNEL_PAGE_SIZE,
): Promise<EpgData> {
  const response = await apiRequest<GuideData>({
    method: 'GET',
    url: '/guide',
    params: {
      from: from.toISOString(),
      to: to.toISOString(),
      channelOffset,
      channelLimit,
    },
    timeout: 60_000,
    signal,
  })
  return toEpgData(response.data)
}

export async function getGuideChannelPlaybackInfo(id: string): Promise<GuidePlaybackInfo> {
  const response = await apiRequest<GuidePlaybackInfo>({
    method: 'POST',
    url: `/playback/guide-channels/${encodeURIComponent(id)}/playback-info`,
  })
  return {
    ...response.data,
    mediaSource: {
      ...response.data.mediaSource,
      streamUrl: resolveServerResourceUrl(response.data.mediaSource.streamUrl),
    },
  }
}

export async function getAdminGuide(): Promise<AdminGuideData> {
  const response = await apiRequest<AdminGuideData>({ method: 'GET', url: '/admin/guide' })
  return response.data
}

export async function createGuideSource(input: Pick<GuideSource, 'kind' | 'name' | 'url'>): Promise<GuideSource> {
  const response = await apiRequest<GuideSource>({ method: 'POST', url: '/admin/guide/sources', data: input })
  return response.data
}

export async function updateGuideSource(id: string, changes: Partial<Pick<GuideSource, 'name' | 'url' | 'enabled' | 'sortOrder'>>): Promise<GuideSource> {
  const response = await apiRequest<GuideSource>({
    method: 'PATCH',
    url: `/admin/guide/sources/${encodeURIComponent(id)}`,
    data: changes,
  })
  return response.data
}

export async function refreshGuideSource(id: string): Promise<GuideSource> {
  const response = await apiRequest<GuideSource>({
    method: 'POST',
    url: `/admin/guide/sources/${encodeURIComponent(id)}/refresh`,
  })
  return response.data
}

export async function deleteGuideSource(id: string): Promise<void> {
  await apiRequest({ method: 'DELETE', url: `/admin/guide/sources/${encodeURIComponent(id)}` })
}

export async function updateGuideChannels(channels: Array<Pick<AdminGuideChannel, 'id'> & Partial<Pick<AdminGuideChannel, 'enabled' | 'sortOrder' | 'iptvChannelId'>>>): Promise<void> {
  await apiRequest({ method: 'PUT', url: '/admin/guide/channels', data: { channels } })
}

export async function updateGuideSettings(regionalMergeThresholdPercent: number): Promise<void> {
  await apiRequest({
    method: 'PUT',
    url: '/admin/guide/settings',
    data: { regionalMergeThresholdPercent },
  })
}
