import { apiRequest, getAccessToken } from './client'
import { getApiBaseUrl } from '../platform/serverConnection'

export interface LoggerConfiguration {
  configured: boolean
  endpoint: string | null
  managementExpiresAt?: string
}

export interface LoggerRetention {
  enabled: boolean
  days: number
  severityDays?: Partial<Record<LoggerLevel, number>>
}

export type LoggerLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export interface LoggerIngestionPolicy {
  eventsPerSecond: number
  burst: number
  credentialEventsPerSecond?: number
  credentialBurst?: number
  serviceEventsPerSecond?: number
  serviceBurst?: number
}

export interface LoggerQuota {
  maxBytes: number
  usedBytes: number
}

export interface LoggerCapacity {
  filesystem_total_bytes: number
  filesystem_available_bytes: number
  database_bytes: number
  compaction_debt_bytes: number
  compactions_in_progress: number
}

export interface LoggerCapacityPolicy {
  maxDatabaseBytes: number
  minFreeBytes: number
}

export interface LoggerOwnerPairing {
  id: string
  expiresAt: string
  managementExpiry: string
}
export interface LoggerOwnerCredential {
  id: string
  expiresAt: string
}

export interface LoggerEvent {
  event_id: string
  time: string
  ingested_at: string
  level: string
  app: string
  source?: string
  trace_id?: string
  request_id?: string
  task_id?: string
  message: string
  instance_id: string
  fields?: Record<string, unknown>
  error?: { type?: string; code?: string; stack?: string }
  [key: string]: unknown
}

export interface LoggerSearch {
  start: string
  end: string
  limit: number
  fields?: Record<string, string>
  text?: string
  text_mode?: 'all' | 'phrase' | 'substring' | 'regex'
  cursor?: string
  order?: 'newest' | 'oldest'
  follow?: boolean
}

export class LoggerRequestError extends Error {
  readonly status: number
  constructor(status: number) {
    super(`Logger request failed (${status})`)
    this.status = status
  }
}

export interface LoggerBucket {
  start: string
  counts: Record<string, number>
}

export interface LoggerSourceCount {
  app: string
  source: string
  count: number
}

export interface LoggerErrorGroup {
  fingerprint: string
  app: string
  source?: string
  type?: string
  code?: string
  message: string
  count: number
  last_seen: string
}

export const getLoggerConfiguration = async () => (await apiRequest<LoggerConfiguration>({ method: 'GET', url: '/admin/logger/configuration' })).data
export const configureLogger = async (endpoint: string, manageToken: string) =>
  (await apiRequest<LoggerConfiguration>({ method: 'PUT', url: '/admin/logger/configuration', data: { endpoint, manageToken } })).data
export const getLoggerPairing = async () =>
  (await apiRequest<{ pending: boolean; endpoint: string | null }>({ method: 'GET', url: '/admin/logger/pairing' })).data
export const pairLogger = async (endpoint: string, deploymentId: string, pairingToken: string) =>
  (await apiRequest<LoggerConfiguration>({ method: 'POST', url: '/admin/logger/pairing', data: { endpoint, deploymentId, pairingToken } })).data
export const retryLoggerPairing = async () =>
  (await apiRequest<LoggerConfiguration>({ method: 'POST', url: '/admin/logger/pairing/retry' })).data
export const discardLoggerPairing = async () =>
  (await apiRequest<{ discarded: boolean }>({ method: 'DELETE', url: '/admin/logger/pairing' })).data
export const getLoggerRetention = async () => (await apiRequest<LoggerRetention>({ method: 'GET', url: '/admin/logger/retention' })).data
export interface LoggerExporterStatus {
  enabled: boolean
  queued: number
  sending: boolean
  dropped: number
  lastDeliveredAt: string | null
  lastFailureAt: string | null
  circuitOpenUntil: string | null
}
export interface LoggerDeploymentStatus {
  status: 'ready'
  last_ingested_at: string | null
  live_subscribers: number
  active_ingestions: number
  active_queries: number
  max_ingestions: number
  max_queries: number
  retention: { completed_at: string; deleted: number; batch_full: boolean; failed: boolean } | null
}
export interface LoggerCredential {
  id: string
  scope: 'ingest' | 'query'
  expiresAt: string
  app?: string
}
export const getLoggerHealth = async () => (await apiRequest<{ status: 'ready' | 'unavailable'; exporter: LoggerExporterStatus }>({ method: 'GET', url: '/admin/logger/health' })).data
export const getLoggerStatus = async () => (await apiRequest<LoggerDeploymentStatus>({ method: 'GET', url: '/admin/logger/status' })).data
export const getLoggerCredentials = async () => (await apiRequest<LoggerCredential[]>({ method: 'GET', url: '/admin/logger/credentials' })).data
export const revokeLoggerCredential = async (id: string) =>
  (await apiRequest<{ revoked: boolean }>({ method: 'DELETE', url: `/admin/logger/credentials/${encodeURIComponent(id)}` })).data
export const setLoggerRetention = async (retention: LoggerRetention) =>
  (await apiRequest<LoggerRetention>({ method: 'PUT', url: '/admin/logger/retention', data: retention })).data
export const getLoggerIngestionPolicy = async () => (await apiRequest<LoggerIngestionPolicy>({ method: 'GET', url: '/admin/logger/ingestion-policy' })).data
export const setLoggerIngestionPolicy = async (policy: LoggerIngestionPolicy) =>
  (await apiRequest<LoggerIngestionPolicy>({ method: 'PUT', url: '/admin/logger/ingestion-policy', data: policy })).data
export const getLoggerQuota = async () => (await apiRequest<LoggerQuota>({ method: 'GET', url: '/admin/logger/quota' })).data
export const setLoggerQuota = async (maxBytes: number) =>
  (await apiRequest<LoggerQuota>({ method: 'PUT', url: '/admin/logger/quota', data: { maxBytes } })).data
export const getLoggerOwnerConfiguration = async () =>
  (await apiRequest<{ configured: boolean }>({ method: 'GET', url: '/admin/logger/owner/configuration' })).data
export const configureLoggerOwner = async (ownerToken: string) =>
  (await apiRequest<{ configured: boolean }>({ method: 'PUT', url: '/admin/logger/owner/configuration', data: { ownerToken } })).data
export const getLoggerCapacity = async () =>
  (await apiRequest<LoggerCapacity>({ method: 'GET', url: '/admin/logger/owner/capacity' })).data
export const getLoggerCapacityPolicy = async () =>
  (await apiRequest<LoggerCapacityPolicy>({ method: 'GET', url: '/admin/logger/owner/capacity-policy' })).data
export const setLoggerCapacityPolicy = async (policy: LoggerCapacityPolicy) =>
  (await apiRequest<LoggerCapacityPolicy>({ method: 'PUT', url: '/admin/logger/owner/capacity-policy', data: policy })).data
export const getLoggerOwnerPairings = async (deploymentId: string) =>
  (await apiRequest<LoggerOwnerPairing[]>({ method: 'GET', url: '/admin/logger/owner/pairings', params: { deploymentId } })).data
export const createLoggerOwnerPairing = async (deploymentId: string, minutes: number, managementDays: number) =>
  (await apiRequest<LoggerOwnerPairing & { token: string }>({
    method: 'POST', url: '/admin/logger/owner/pairings', data: { deploymentId, minutes, managementDays },
  })).data
export const revokeLoggerOwnerPairing = async (deploymentId: string, id: string) =>
  (await apiRequest<{ revoked: boolean }>({
    method: 'DELETE', url: `/admin/logger/owner/pairings/${encodeURIComponent(id)}`, params: { deploymentId },
  })).data
export const getLoggerOwnerCredentials = async (deploymentId: string) =>
  (await apiRequest<LoggerOwnerCredential[]>({ method: 'GET', url: '/admin/logger/owner/credentials', params: { deploymentId } })).data
export const revokeLoggerOwnerCredential = async (deploymentId: string, id: string) =>
  (await apiRequest<{ revoked: boolean }>({
    method: 'DELETE', url: `/admin/logger/owner/credentials/${encodeURIComponent(id)}`, params: { deploymentId },
  })).data

/** Queries are authorized and relayed by Flixer; logger credentials stay server-side. */
export class LoggerClient {
  private controller = new AbortController()

  clear() {
    this.controller.abort()
    this.controller = new AbortController()
  }

  private async request(kind: 'recent' | 'search' | 'stats' | 'sources' | 'errors' | 'stream', query = '', options: RequestInit = {}): Promise<Response> {
    const token = getAccessToken()
    if (!token) throw new LoggerRequestError(401)
    const signals = [this.controller.signal]
    if (options.signal) signals.push(options.signal)
    if (kind !== 'stream') signals.push(AbortSignal.timeout(15_000))
    const response = await fetch(`${getApiBaseUrl().replace(/\/+$/, '')}/admin/logger/data/${kind}${query}`, {
      ...options,
      signal: AbortSignal.any(signals),
      headers: { ...options.headers, authorization: `Bearer ${token}` },
      redirect: 'error',
      credentials: 'omit',
      cache: 'no-store',
    })
    if (!response.ok) {
      await response.body?.cancel()
      if (response.status === 401) this.clear()
      throw new LoggerRequestError(response.status)
    }
    return response
  }

  async recent(signal?: AbortSignal): Promise<LoggerEvent[]> {
    const response = await this.request('recent', '?limit=100', { signal })
    return ((await response.json()) as { events: LoggerEvent[] }).events
  }

  async search(search: LoggerSearch, signal?: AbortSignal): Promise<{ events: LoggerEvent[]; next_cursor: string }> {
    const response = await this.request('search', '', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(search), signal,
    })
    return response.json()
  }

  async correlation(field: 'trace' | 'task', value: string, cursor?: string): Promise<{ events: LoggerEvent[]; next_cursor: string }> {
    const query = new URLSearchParams({ field, value, limit: '100' })
    if (cursor) query.set('cursor', cursor)
    const response = await this.request('recent', `?${query}`)
    return response.json()
  }

  async stats(start: string, end: string, signal?: AbortSignal): Promise<LoggerBucket[]> {
    const query = new URLSearchParams({ start, end })
    const response = await this.request('stats', `?${query}`, { signal })
    return ((await response.json()) as { buckets: LoggerBucket[] }).buckets
  }

  async sources(start: string, end: string, signal?: AbortSignal): Promise<LoggerSourceCount[]> {
    const query = new URLSearchParams({ start, end })
    const response = await this.request('sources', `?${query}`, { signal })
    const data: unknown = await response.json()
    if (!data || typeof data !== 'object' || !('sources' in data) || !Array.isArray(data.sources) ||
      data.sources.some((item: unknown) => !item || typeof item !== 'object' || !('app' in item) || typeof item.app !== 'string' ||
        !('source' in item) || typeof item.source !== 'string' || !('count' in item) || typeof item.count !== 'number' ||
        !Number.isSafeInteger(item.count) || item.count < 0)) {
      throw new Error('Invalid logger source statistics')
    }
    return data.sources
  }

  async errorGroups(start: string, end: string, signal?: AbortSignal): Promise<LoggerErrorGroup[]> {
    const query = new URLSearchParams({ start, end })
    const response = await this.request('errors', `?${query}`, { signal })
    return ((await response.json()) as { groups: LoggerErrorGroup[] }).groups
  }

  async stream(signal: AbortSignal, onEvent: (event: LoggerEvent, cursor: string | undefined) => void, onOverflow: () => void, onConnected: () => void, cursor?: string, filters: Record<string, string> = {}): Promise<void> {
    const query = new URLSearchParams(filters).toString()
    const response = await this.request('stream', query ? `?${query}` : '', { signal, headers: cursor ? { 'Last-Event-ID': cursor } : {} })
    if (!response.body) throw new Error('Logger stream is unavailable')
    onConnected()
    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
    let buffer = ''
    try {
      for (;;) {
        const { value, done } = await reader.read()
        if (done) return
        buffer = (buffer + value).replace(/\r\n/g, '\n')
        let boundary = buffer.indexOf('\n\n')
        while (boundary !== -1) {
          if (boundary > 256 * 1024) throw new Error('Logger stream frame exceeds size limit')
          const frame = buffer.slice(0, boundary)
          buffer = buffer.slice(boundary + 2)
          const event = frame.split('\n').find((line) => line.startsWith('event:'))?.slice(6).trim()
          const id = frame.split('\n').find((line) => line.startsWith('id:'))?.slice(3).trim()
          const data = frame.split('\n').filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trimStart()).join('\n')
          if (event === 'overflow') onOverflow()
          if (event === 'log') onEvent(JSON.parse(data) as LoggerEvent, id || undefined)
          boundary = buffer.indexOf('\n\n')
        }
        if (buffer.length > 256 * 1024) throw new Error('Logger stream frame exceeds size limit')
      }
    } finally {
      await reader.cancel()
      reader.releaseLock()
    }
  }
}
