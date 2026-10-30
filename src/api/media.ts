/** Media-library browsing, item metadata, artwork, and network-share operations. */
import { api } from './client'
import type { FlixerApiRouteBody, FlixerApiRouteData, FlixerApiRouteQuery } from 'flixer-api-client'
import type { BrowseKind, BrowseSort, HomeCard, HomeContent, ItemDetail, MediaBrowseResult, MediaImageType, MediaItemChanges as ApiMediaItemChanges, MediaItemDetail, MediaItemPage, MediaItemQuery, MediaItemType, MediaLibrary, MediaLibraryInput, MediaRoot, NetworkShare, NetworkShareInput, PersonCredits, SearchFilters as ApiSearchFilters, SubtitleSearchResult } from 'flixer-api-client'
export type { BrowseKind, BrowseSort, ContinueCard, HomeCard, HomeContent, HomeFeatured, HomeLibrary, IndexerProviderSetting, IndexerSubtitleSetting, ItemDetail, ItemSummary, MediaBrowseResult, MediaImageStorage, MediaImageType, MediaItemDetail, MediaItemImage, MediaItemPage, MediaItemQuery, MediaItemSummary, MediaItemType, MediaLibrary, MediaLibraryFolder, MediaLibraryFolderInput, MediaLibraryInput, MediaLibraryType, MediaRoot, NetworkShare, NetworkShareInput, PersonCredits, SubtitleFile, SubtitleSearchResult } from 'flixer-api-client'
export type SearchFilters = ApiSearchFilters & { includeChildren?: boolean }

export type MediaItemChanges = Omit<ApiMediaItemChanges, 'providerIds'> & {
  providerIds?: Record<string, string | null>
}

export const MEDIA_ITEM_TYPES: MediaItemType[] = ['movie', 'series', 'season', 'episode', 'album', 'track', 'video']

export const MEDIA_IMAGE_TYPES = ['poster', 'backdrop', 'logo', 'banner', 'thumb', 'disc'] as const

export type MediaItemCategory = 'movies' | 'tvShows' | 'music'

export async function listMediaItems(query: Omit<MediaItemQuery, 'type'> & { type?: MediaItemType | MediaItemCategory }): Promise<MediaItemPage & { categoryCounts: Record<MediaItemCategory, number> }> {
  const response = await api.get<MediaItemPage & { categoryCounts: Record<MediaItemCategory, number> }>('/admin/media/items', { params: query })
  return response.data
}

export async function getMediaItem(id: string): Promise<MediaItemDetail> {
  const response = await api.get<MediaItemDetail>(`/admin/media/items/${encodeURIComponent(id)}`)
  return response.data
}

export async function updateMediaItem(id: string, changes: MediaItemChanges): Promise<MediaItemDetail> {
  const response = await api.patch<MediaItemDetail>(`/admin/media/items/${encodeURIComponent(id)}`, changes)
  return response.data
}

export async function refreshMediaItem(id: string, priority = false): Promise<FlixerApiRouteData<'post', '/admin/media/items/{param}/refresh'>> {
  const body = { priority }
  const response = await api.post<FlixerApiRouteData<'post', '/admin/media/items/{param}/refresh'>>(`/admin/media/items/${encodeURIComponent(id)}/refresh`, body)
  return response.data
}

export async function deleteMediaItem(id: string): Promise<void> {
  await api.delete(`/admin/media/items/${encodeURIComponent(id)}`)
}

/** Images need the admin token, so they are fetched as blobs instead of used as plain img sources. */
export async function fetchMediaImage(id: string, index: number, width?: number, version?: string): Promise<Blob> {
  const params: FlixerApiRouteQuery<'get', '/admin/media/items/{param}/images/{param}'> & { v?: string } = {
    ...(width ? { w: width } : {}),
    ...(version ? { v: version } : {}),
  }
  const response = await api.get<Blob>(`/admin/media/items/${encodeURIComponent(id)}/images/${index}`, { params, responseType: 'blob' })
  return response.data
}

export async function addMediaItemImage(id: string, type: MediaImageType, file: File): Promise<MediaItemDetail> {
  const body = new FormData()
  body.append('image', file)
  const params: FlixerApiRouteQuery<'post', '/admin/media/items/{param}/images'> = { type }
  const response = await api.post<MediaItemDetail>(`/admin/media/items/${encodeURIComponent(id)}/images`, body, {
    params,
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export async function removeMediaItemImage(id: string, index: number): Promise<MediaItemDetail> {
  const response = await api.delete<MediaItemDetail>(`/admin/media/items/${encodeURIComponent(id)}/images/${index}`)
  return response.data
}

export async function listItemSubtitles(id: string): Promise<FlixerApiRouteData<'get', '/admin/media/items/{param}/subtitles'>> {
  const response = await api.get<FlixerApiRouteData<'get', '/admin/media/items/{param}/subtitles'>>(`/admin/media/items/${encodeURIComponent(id)}/subtitles`)
  return response.data
}

export async function searchItemSubtitles(id: string, options: FlixerApiRouteBody<'post', '/admin/media/items/{param}/subtitles/search'> = {}): Promise<SubtitleSearchResult[]> {
  const response = await api.post<FlixerApiRouteData<'post', '/admin/media/items/{param}/subtitles/search'>>(`/admin/media/items/${encodeURIComponent(id)}/subtitles/search`, options, { timeout: 70_000 })
  return response.data.results
}

export async function downloadItemSubtitle(id: string, fileId: number, language: string): Promise<void> {
  const request: FlixerApiRouteBody<'post', '/admin/media/items/{param}/subtitles/download'> = { fileId, language }
  await api.post(`/admin/media/items/${encodeURIComponent(id)}/subtitles/download`, request, { timeout: 70_000 })
}

export async function deleteItemSubtitle(id: string, file: string): Promise<void> {
  const params: FlixerApiRouteQuery<'delete', '/admin/media/items/{param}/subtitles'> = { file }
  await api.delete(`/admin/media/items/${encodeURIComponent(id)}/subtitles`, { params })
}

export async function getHomeContent(): Promise<HomeContent> {
  const response = await api.get<HomeContent>('/media/home')
  return response.data
}

export async function getWatchProgress(itemId: string): Promise<FlixerApiRouteData<'get', '/media/items/{param}/progress'>> {
  const response = await api.get<FlixerApiRouteData<'get', '/media/items/{param}/progress'>>(`/media/items/${encodeURIComponent(itemId)}/progress`)
  return response.data
}

export async function setItemWatched(itemId: string, watched: boolean): Promise<void> {
  const request: FlixerApiRouteBody<'put', '/media/items/{param}/watched'> = { watched }
  await api.put(`/media/items/${encodeURIComponent(itemId)}/watched`, request)
}

export async function saveWatchProgress(itemId: string, positionSeconds: number, durationSeconds: number): Promise<void> {
  const request: FlixerApiRouteBody<'put', '/media/items/{param}/progress'> = { positionSeconds: Math.floor(positionSeconds), durationSeconds: Math.floor(durationSeconds) }
  await api.put(`/media/items/${encodeURIComponent(itemId)}/progress`, request)
}

export async function searchMedia(query: string, filters: SearchFilters = {}, signal?: AbortSignal): Promise<HomeCard[]> {
  const params: FlixerApiRouteQuery<'get', '/media/search'> & { includeChildren?: boolean } = { q: query, ...filters }
  const response = await api.get<HomeCard[]>('/media/search', { params, signal })
  return response.data
}

export async function getSearchGenres(): Promise<string[]> {
  const response = await api.get<FlixerApiRouteData<'get', '/media/search/genres'>>('/media/search/genres')
  return response.data
}

export async function browseMedia(kind: BrowseKind, sort: BrowseSort, offset: number, signal?: AbortSignal): Promise<FlixerApiRouteData<'get', '/media/browse/{param}'>> {
  const params: FlixerApiRouteQuery<'get', '/media/browse/{param}'> = { sort, offset, limit: 48 }
  const response = await api.get<FlixerApiRouteData<'get', '/media/browse/{param}'>>(`/media/browse/${kind}`, { params, signal })
  return response.data
}

export async function fetchPersonImage(id: string, width?: number): Promise<Blob> {
  const params: FlixerApiRouteQuery<'get', '/media/people/{param}/image'> = width ? { w: width } : {}
  const response = await api.get<Blob>(`/media/people/${encodeURIComponent(id)}/image`, { params, responseType: 'blob' })
  return response.data
}

export async function getPerson(id: string, signal?: AbortSignal): Promise<PersonCredits> {
  const response = await api.get<PersonCredits>(`/media/people/${encodeURIComponent(id)}`, { signal })
  return response.data
}

export async function getItemDetail(id: string): Promise<ItemDetail> {
  const response = await api.get<ItemDetail>(`/media/items/${encodeURIComponent(id)}`)
  return response.data
}

/** Artwork for any signed-in user, fetched as a blob because it needs the Bearer token. */
/** `version` only busts the browser's cache when an item changes; the server ignores it. */
export async function fetchHomeImage(id: string, index: number, width?: number, version?: string): Promise<Blob> {
  const params: FlixerApiRouteQuery<'get', '/media/items/{param}/images/{param}'> & { v?: string } = {
    ...(width ? { w: width } : {}),
    ...(version ? { v: version } : {}),
  }
  const response = await api.get<Blob>(`/media/items/${encodeURIComponent(id)}/images/${index}`, { params, responseType: 'blob' })
  return response.data
}

export const INDEXER_PROVIDERS = [
  { id: 'tmdb', keyed: true, optionalKey: false },
  { id: 'tvdb', keyed: true, optionalKey: false },
  { id: 'omdb', keyed: true, optionalKey: false },
  { id: 'fanart', keyed: true, optionalKey: false },
  { id: 'audiodb', keyed: true, optionalKey: false },
  { id: 'discogs', keyed: true, optionalKey: false },
  { id: 'anidb', keyed: true, optionalKey: false },
  { id: 'musicbrainz', keyed: false, optionalKey: false },
  { id: 'anilist', keyed: false, optionalKey: false },
  { id: 'theintrodb', keyed: false, optionalKey: true },
  { id: 'introdb', keyed: false, optionalKey: false },
] as const

export async function listMediaLibraries(): Promise<MediaLibrary[]> {
  const response = await api.get<MediaLibrary[]>('/admin/media-libraries')
  return response.data
}

export async function listMediaRoots(): Promise<MediaRoot[]> {
  const response = await api.get<MediaRoot[]>('/admin/media-libraries/roots')
  return response.data
}

export async function browseMediaFolders(rootId: string, path: string): Promise<MediaBrowseResult> {
  const params: FlixerApiRouteQuery<'get', '/admin/media-libraries/browse'> = { rootId, path }
  const response = await api.get<MediaBrowseResult>('/admin/media-libraries/browse', { params })
  return response.data
}

export async function createMediaLibrary(library: MediaLibraryInput): Promise<MediaLibrary> {
  const response = await api.post<MediaLibrary>('/admin/media-libraries', library)
  return response.data
}

export async function updateMediaLibrary(id: string, changes: FlixerApiRouteBody<'patch', '/admin/media-libraries/{param}'>): Promise<MediaLibrary> {
  const response = await api.patch<MediaLibrary>(`/admin/media-libraries/${encodeURIComponent(id)}`, changes)
  return response.data
}

export async function deleteMediaLibrary(id: string): Promise<void> {
  await api.delete(`/admin/media-libraries/${encodeURIComponent(id)}`)
}

export async function getNetworkShareSupport(): Promise<FlixerApiRouteData<'get', '/admin/network-shares/support'>> {
  const response = await api.get<FlixerApiRouteData<'get', '/admin/network-shares/support'>>('/admin/network-shares/support')
  return response.data
}

export async function listNetworkShares(): Promise<NetworkShare[]> {
  const response = await api.get<NetworkShare[]>('/admin/network-shares')
  return response.data
}

export async function createNetworkShare(share: NetworkShareInput): Promise<NetworkShare> {
  const response = await api.post<NetworkShare>('/admin/network-shares', share)
  return response.data
}

export async function updateNetworkShare(id: string, changes: Partial<NetworkShareInput>): Promise<NetworkShare> {
  const response = await api.patch<NetworkShare>(`/admin/network-shares/${encodeURIComponent(id)}`, changes)
  return response.data
}

export async function reconnectNetworkShare(id: string): Promise<NetworkShare> {
  const response = await api.post<NetworkShare>(`/admin/network-shares/${encodeURIComponent(id)}/reconnect`)
  return response.data
}

export async function deleteNetworkShare(id: string): Promise<void> {
  await api.delete(`/admin/network-shares/${encodeURIComponent(id)}`)
}
