/** Administrative stream, user, API-key, and indexer operations. */
import { api, apiRequest } from './client'
import type { AdminActivityFilters, AdminActivityPage, AdminDevice, AdminOverview, AdminUser, AdminUserChanges, ApiKeyInfo, CreatedApiKey, IndexerStatus, IndexerTask as ApiIndexerTask, IndexerTaskLogs, IndexerTaskState, NewAdminUser, StreamSessionList, FlixerApiRouteBody, FlixerApiRouteData, FlixerApiRouteQuery } from '@flixermedia/flixer-api-client'
export type { AdminActivityEntry, AdminActivityFilters, AdminActivityPage, AdminDevice, AdminOverview, AdminUser, AdminUserChanges, ApiKeyInfo, CreatedApiKey, IndexerQueueStats, IndexerScan, IndexerScanState, IndexerStatus, IndexerTaskLogEntry, IndexerTaskLogs, IndexerTaskState, NewAdminUser, StreamSession, StreamSessionList } from '@flixermedia/flixer-api-client'

export type AdminScheduledTaskState = 'running' | 'queued' | 'completed' | 'failed' | 'cancelled' | 'never'

export interface AdminScheduledTask {
  id: string
  name: string
  category: string
  description: string
  enabled: boolean
  cron: string
  state: AdminScheduledTaskState
  lastRunAt: string | null
  lastError?: string
  progress?: number
}

export async function listAdminScheduledTasks(): Promise<AdminScheduledTask[]> {
  const response = await apiRequest<{ tasks: AdminScheduledTask[] }>({ method: 'GET', url: '/admin/scheduled-tasks' })
  return response.data.tasks
}

export async function saveAdminScheduledTaskSchedule(id: string, schedule: Pick<AdminScheduledTask, 'enabled' | 'cron'>): Promise<void> {
  await apiRequest({ method: 'PUT', url: `/admin/scheduled-tasks/${encodeURIComponent(id)}`, data: schedule })
}

export async function runAdminScheduledTask(id: string): Promise<void> {
  await apiRequest({ method: 'POST', url: `/admin/scheduled-tasks/${encodeURIComponent(id)}/run` })
}

export async function stopAdminScheduledTask(id: string): Promise<void> {
  await apiRequest({ method: 'POST', url: `/admin/scheduled-tasks/${encodeURIComponent(id)}/stop` })
}

export async function listStreamSessions(): Promise<StreamSessionList> {
  const response = await api.get<StreamSessionList>('/admin/streams')
  return response.data
}

export async function cancelStreamSession(id: string): Promise<void> {
  await api.delete(`/admin/streams/${encodeURIComponent(id)}`)
}

export async function getAdminActivity(filters: AdminActivityFilters): Promise<AdminActivityPage> {
  const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== undefined && value !== ''))
  const response = await api.get<AdminActivityPage>('/admin/overview/activity', { params })
  return response.data
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const response = await api.get<AdminOverview>('/admin/overview')
  return response.data
}

export async function listDevices(): Promise<AdminDevice[]> {
  const response = await api.get<AdminDevice[]>('/admin/devices')
  return response.data
}

export async function signOutDevice(id: string): Promise<void> {
  await api.delete(`/admin/devices/${encodeURIComponent(id)}`)
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  const response = await api.get<AdminUser[]>('/admin/users')
  return response.data
}

export async function createAdminUser(user: NewAdminUser): Promise<AdminUser> {
  const response = await api.post<AdminUser>('/admin/users', user)
  return response.data
}

export async function updateAdminUser(id: string, changes: AdminUserChanges): Promise<AdminUser> {
  const response = await api.patch<AdminUser>(`/admin/users/${encodeURIComponent(id)}`, changes)
  return response.data
}

export async function setAdminUserAvatar(id: string, file: File): Promise<AdminUser> {
  const body = new FormData()
  body.append('avatar', file)
  const response = await api.post<AdminUser>(`/admin/users/${encodeURIComponent(id)}/avatar`, body, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export async function removeAdminUserAvatar(id: string): Promise<AdminUser> {
  const response = await api.delete<AdminUser>(`/admin/users/${encodeURIComponent(id)}/avatar`)
  return response.data
}

export async function setAdminUserPassword(id: string, password: string): Promise<void> {
  const request: FlixerApiRouteBody<'put', '/admin/users/{param}/password'> = { password }
  await api.put(`/admin/users/${encodeURIComponent(id)}/password`, request)
}

export async function revokeAdminUserSessions(id: string): Promise<FlixerApiRouteData<'delete', '/admin/users/{param}/sessions'>> {
  const response = await api.delete<FlixerApiRouteData<'delete', '/admin/users/{param}/sessions'>>(`/admin/users/${encodeURIComponent(id)}/sessions`)
  return response.data
}

export async function deleteAdminUser(id: string): Promise<void> {
  await api.delete(`/admin/users/${encodeURIComponent(id)}`)
}

export async function listApiKeys(): Promise<ApiKeyInfo[]> {
  const response = await api.get<ApiKeyInfo[]>('/admin/api-keys')
  return response.data
}

export async function createApiKey(name: string): Promise<CreatedApiKey> {
  const request: FlixerApiRouteBody<'post', '/admin/api-keys'> = { name }
  const response = await api.post<CreatedApiKey>('/admin/api-keys', request)
  return response.data
}

export async function revokeApiKey(id: string): Promise<void> {
  await api.delete(`/admin/api-keys/${encodeURIComponent(id)}`)
}

export async function rebuildMediaSearchIndex(): Promise<{ queued: boolean }> {
  const response = await api.post<{ queued: boolean }>('/admin/search/rebuild')
  return response.data
}

export const INDEXER_QUEUES = ['scan', 'identify', 'metadata', 'images', 'probe', 'refresh', 'trickplay', 'themes', 'lyrics', 'intro-movies', 'intro-episodes'] as const
export type IndexerQueueName = (typeof INDEXER_QUEUES)[number]
export const INDEXER_TASK_QUEUES = [...INDEXER_QUEUES, 'identify-priority', 'metadata-priority', 'images-priority', 'probe-priority', 'refresh-priority'] as const
export type IndexerTaskQueueName = (typeof INDEXER_TASK_QUEUES)[number]
export const INDEXER_TASK_STATES = ['pending', 'active', 'scheduled', 'retry', 'archived', 'completed'] as const
export type IndexerTask = Omit<ApiIndexerTask, 'queue'> & { queue: IndexerTaskQueueName }

function isIndexerTaskQueue(queue: string): queue is IndexerTaskQueueName {
  return INDEXER_TASK_QUEUES.some((knownQueue) => knownQueue === queue)
}

export async function getIndexerStatus(): Promise<IndexerStatus> {
  const response = await api.get<IndexerStatus>('/admin/indexer/status')
  return response.data
}

export async function scanMediaLibrary(id: string, force = false, trickplayOnly = false, jobs: string[] = []): Promise<void> {
  const request = { force, trickplayOnly, ...(jobs.length ? { jobs } : {}) }
  await api.post(`/admin/indexer/libraries/${encodeURIComponent(id)}/scan`, request)
}

export async function queueLibrarySegments(id: string, type: 'movie' | 'episode'): Promise<{ queued: number }> {
  const response = await api.post<{ queued: number }>(`/admin/indexer/libraries/${encodeURIComponent(id)}/segments`, { type })
  return response.data
}

export async function syncLibraryThemes(id: string): Promise<{ eligible: number; queued: number }> {
  const response = await api.post<{ eligible: number; queued: number }>('/themes/sync', { libraryId: id })
  return response.data
}

export async function listIndexerTasks(queue: IndexerTaskQueueName, state: IndexerTaskState, page = 1, size = 20): Promise<IndexerTask[]> {
  const params = { queue, state, page, size }
  const response = await api.get<{ tasks?: Array<Omit<ApiIndexerTask, 'queue'> & { queue: string }> }>('/admin/indexer/tasks', { params })
  return (response.data.tasks ?? []).map((task) => {
    if (!isIndexerTaskQueue(task.queue)) throw new Error(`Unknown indexer task queue "${task.queue}".`)
    return { ...task, queue: task.queue }
  })
}

export async function getIndexerTaskLogs(queue: IndexerTaskQueueName, id: string, offset = 0): Promise<IndexerTaskLogs> {
  const params: FlixerApiRouteQuery<'get', '/admin/indexer/tasks/{param}/{param}/logs'> = { offset }
  const response = await api.get<IndexerTaskLogs>(`/admin/indexer/tasks/${queue}/${encodeURIComponent(id)}/logs`, { params })
  return response.data
}

export async function cancelIndexerTask(queue: IndexerTaskQueueName, id: string): Promise<void> {
  await api.post(`/admin/indexer/tasks/${queue}/${encodeURIComponent(id)}/cancel`)
}

export async function retryIndexerTask(queue: IndexerTaskQueueName, id: string): Promise<void> {
  await api.post(`/admin/indexer/tasks/${queue}/${encodeURIComponent(id)}/retry`)
}

export async function clearFailedIndexerTasks(queue: IndexerTaskQueueName): Promise<number> {
  const response = await api.post<FlixerApiRouteData<'post', '/admin/indexer/queues/{param}/clear-failed'>>(`/admin/indexer/queues/${queue}/clear-failed`)
  return response.data.cleared ?? 0
}

export async function clearAllFailedIndexerTasks(): Promise<number> {
  const cleared = await Promise.all(INDEXER_TASK_QUEUES.map((queue) => clearFailedIndexerTasks(queue)))
  return cleared.reduce((total, count) => total + count, 0)
}

export async function cancelActiveIndexerTasks(queue: IndexerTaskQueueName): Promise<number> {
  const response = await api.post<FlixerApiRouteData<'post', '/admin/indexer/queues/{param}/cancel-active'>>(`/admin/indexer/queues/${queue}/cancel-active`)
  return response.data.cancelled ?? 0
}

export async function setIndexerQueuePaused(queue: IndexerTaskQueueName, paused: boolean): Promise<void> {
  await api.post(`/admin/indexer/queues/${queue}/${paused ? 'pause' : 'resume'}`)
}

export async function setIndexerConcurrency(concurrency: FlixerApiRouteBody<'put', '/admin/indexer/concurrency'>): Promise<IndexerStatus> {
  const response = await api.put<IndexerStatus>('/admin/indexer/concurrency', concurrency)
  return response.data
}
