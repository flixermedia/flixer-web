import axios from 'axios'
import { api } from './client'
import type { ContentScope } from './payments'
import { uploadChunks } from '../utils/chunkUpload'

export interface Advertisement {
  id: string
  name: string
  targetUrl: string
  durationSeconds: number
  enabled: boolean
  scopes: ContentScope[]
  preroll: boolean
  midrollSeconds: number[]
  skipAfterSeconds: number | null
}

export interface AdvertisementSettings {
  enabled: boolean
  minimumIntervalSeconds: number
  maxPerPlayback: number
}

export interface PlaybackAdvertisement {
  id: string
  name: string
  targetUrl: string
  streamUrl: string
  atSeconds: number
  skipAfterSeconds: number | null
}

export const MAX_AD_BYTES = 100 * 1024 * 1024

export async function listAdvertisements() {
  return (await api.get<Advertisement[]>('/admin/advertisements')).data
}

export async function getAdvertisementSettings() {
  return (await api.get<AdvertisementSettings>('/admin/advertisements/settings')).data
}

export async function saveAdvertisementSettings(settings: AdvertisementSettings) {
  return (await api.put<AdvertisementSettings>('/admin/advertisements/settings', settings)).data
}

export async function saveAdvertisement(ad: Advertisement) {
  return (await api.put<Advertisement>(`/admin/advertisements/${encodeURIComponent(ad.id)}`, ad)).data
}

export async function deleteAdvertisement(id: string) {
  await api.delete(`/admin/advertisements/${encodeURIComponent(id)}`)
}

export async function uploadAdvertisement(file: File, name: string, targetUrl: string, onProgress: (done: number, total: number) => void, signal?: AbortSignal) {
  if (!file.size || file.size > MAX_AD_BYTES) throw new Error('The video must be no larger than 100 MiB.')
  const session = (await api.post<{ id: string; chunkSize: number }>('/admin/advertisements/uploads', { size: file.size })).data
  const base = `/admin/advertisements/uploads/${encodeURIComponent(session.id)}`
  try {
    await uploadChunks(file, {
      chunkSize: session.chunkSize, maxBytes: MAX_AD_BYTES, onProgress, signal,
      shouldRetry: (error) => axios.isAxiosError(error) && (!error.response || [408, 429, 502, 503, 504].includes(error.response.status)),
      sendChunk: async (index, chunk, chunkSignal) => {
        const data = new FormData()
        data.append('chunk', chunk, 'chunk')
        await api.put(`${base}/chunks/${index}`, data, { signal: chunkSignal, timeout: 120_000, headers: { 'Content-Type': 'multipart/form-data' } })
      },
    })
    return (await api.post<Advertisement>(`${base}/complete`, { name, targetUrl }, { timeout: 60_000, signal })).data
  } catch (error) {
    try { await api.delete(base) } catch (cleanupError) { console.error('[advertisements] Upload cleanup failed', cleanupError) }
    throw error
  }
}
