/** Media request workflows and theme-related API operations. */
import { api } from './client'
import axios from 'axios'
import { catchError } from '../utils/catchError'
import type {
  ExternalMediaCard,
  ExternalMediaDetail,
  MediaRequestView,
  RequestMediaType,
  RequestServiceTest,
  RequestServiceView,
  RequestUserView,
  RequestsConfig,
  FlixerApiRouteBody,
  FlixerApiRouteData,
  FlixerApiRouteQuery,
} from '@flixermedia/flixer-api-client'
import type { RequestServiceInput } from '@flixermedia/flixer-api-client'
export type {
  ExternalMediaCard,
  ExternalMediaDetail,
  ExternalRequestStatus,
  MediaRequestView,
  RequestMediaType,
  RequestServiceInput,
  RequestServiceTest,
  RequestServiceView,
  RequestStatus,
  RequestUserView,
  RequestsConfig,
  RequestSource,
} from '@flixermedia/flixer-api-client'

/** Cached TMDB images are served by the API as relative paths; other (absolute) URLs pass through. */
function withApiBase(url: string | null): string | null {
  return url?.startsWith('/') ? `${api.defaults.baseURL ?? ''}${url}` : url
}
function withPoster<T extends { poster: string | null }>(entry: T): T {
  return { ...entry, poster: withApiBase(entry.poster) }
}

export async function getRequestsConfig(): Promise<RequestsConfig> {
  return (await api.get<RequestsConfig>('/requests/config')).data
}
export async function searchRequests(query: string, type?: RequestMediaType, signal?: AbortSignal): Promise<ExternalMediaCard[]> {
  const params: FlixerApiRouteQuery<'get', '/requests/search'> = { q: query, type }
  return (await api.get<ExternalMediaCard[]>('/requests/search', { params, signal })).data.map(withPoster)
}
export async function discoverRequests(section: NonNullable<FlixerApiRouteQuery<'get', '/requests/discover'>['section']>, signal?: AbortSignal): Promise<ExternalMediaCard[]> {
  const params: FlixerApiRouteQuery<'get', '/requests/discover'> = { section }
  return (await api.get<ExternalMediaCard[]>('/requests/discover', { params, signal })).data.map(withPoster)
}
export async function getExternalMediaDetail(type: RequestMediaType, id: string): Promise<ExternalMediaDetail> {
  const detail = (await api.get<ExternalMediaDetail>(`/requests/details/${type}/${encodeURIComponent(id)}`)).data
  return { ...withPoster(detail), backdrop: withApiBase(detail.backdrop), requests: detail.requests.map(withPoster) }
}
export async function createMediaRequest(input: FlixerApiRouteBody<'post', '/requests'>): Promise<MediaRequestView> {
  return (await api.post<MediaRequestView>('/requests', input)).data
}
export async function listMediaRequests(params: FlixerApiRouteQuery<'get', '/requests'> = {}): Promise<FlixerApiRouteData<'get', '/requests'>> {
  const data = (await api.get<FlixerApiRouteData<'get', '/requests'>>('/requests', { params })).data
  return { ...data, items: data.items.map(withPoster) }
}
export async function approveMediaRequest(id: string, input: FlixerApiRouteBody<'post', '/requests/{param}/approve'> = {}): Promise<MediaRequestView> {
  return (await api.post<MediaRequestView>(`/requests/${encodeURIComponent(id)}/approve`, input)).data
}
export async function declineMediaRequest(id: string, reason?: string): Promise<MediaRequestView> {
  const request: FlixerApiRouteBody<'post', '/requests/{param}/decline'> = { reason }
  return (await api.post<MediaRequestView>(`/requests/${encodeURIComponent(id)}/decline`, request)).data
}
export async function retryMediaRequest(id: string): Promise<MediaRequestView> {
  return (await api.post<MediaRequestView>(`/requests/${encodeURIComponent(id)}/retry`)).data
}
export async function deleteMediaRequest(id: string): Promise<void> {
  await api.delete(`/requests/${encodeURIComponent(id)}`)
}
export async function listRequestServices(): Promise<RequestServiceView[]> {
  return (await api.get<RequestServiceView[]>('/admin/requests/services')).data
}
export async function saveRequestService(input: RequestServiceInput, id?: string): Promise<RequestServiceView> {
  return (await (id ? api.put<RequestServiceView>(`/admin/requests/services/${encodeURIComponent(id)}`, input) : api.post<RequestServiceView>('/admin/requests/services', input))).data
}
export async function deleteRequestService(id: string): Promise<void> {
  await api.delete(`/admin/requests/services/${encodeURIComponent(id)}`)
}
export async function testRequestService(input: FlixerApiRouteBody<'post', '/admin/requests/services/test'>): Promise<RequestServiceTest> {
  return (await api.post<RequestServiceTest>('/admin/requests/services/test', input)).data
}
export async function listRequestUsers(): Promise<RequestUserView[]> {
  return (await api.get<RequestUserView[]>('/admin/requests/users')).data
}
export async function updateRequestUser(id: string, patch: FlixerApiRouteBody<'put', '/admin/requests/users/{param}'>): Promise<RequestUserView> {
  return (await api.put<RequestUserView>(`/admin/requests/users/${encodeURIComponent(id)}`, patch)).data
}

export async function getItemTheme(id: string): Promise<Blob | null> {
  const [error, response] = await catchError(api.get<Blob>(`/themes/items/${encodeURIComponent(id)}`, { responseType: 'blob' }))
  if (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null
    throw error
  }
  return response.data
}

export async function syncThemes(): Promise<FlixerApiRouteData<'post', '/themes/sync'>> {
  return (await api.post<FlixerApiRouteData<'post', '/themes/sync'>>('/themes/sync')).data
}
