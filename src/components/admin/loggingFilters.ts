import type { LoggerEvent } from '../../api/logger'

export interface LoggingFilters {
  app: string
  level: string
  source: string
  instance: string
  event: string
  trace: string
  request: string
  task: string
}

export interface LoggingFilterPreset extends LoggingFilters {
  text: string
  textMode: 'all' | 'phrase' | 'substring' | 'regex'
  hours: 1 | 24 | 168 | 720
}

export interface NamedLoggingFilter {
  name: string
  filters: LoggingFilterPreset
}

const levels = ['', 'trace', 'debug', 'info', 'warn', 'error', 'fatal']
const maxFilterLength = 1024
const maxSavedFilters = 20

export function parseLoggingFilter(value: unknown): LoggingFilterPreset {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid logging filter')
  const record = value as Record<string, unknown>
  const field = (key: string): string => {
    const item = record[key]
    if (typeof item !== 'string' || new TextEncoder().encode(item).length > maxFilterLength) throw new Error('Invalid logging filter')
    return item
  }
  const level = field('level')
  const textMode = record.textMode
  const hours = record.hours
  if (!levels.includes(level) || (textMode !== 'all' && textMode !== 'phrase' && textMode !== 'substring' && textMode !== 'regex') ||
    (hours !== 1 && hours !== 24 && hours !== 168 && hours !== 720)) throw new Error('Invalid logging filter')
  const text = field('text')
  if (textMode === 'regex' && new TextEncoder().encode(text).length > 256) throw new Error('Invalid logging filter')
  return {
    app: field('app'), level, source: field('source'), instance: field('instance'), event: field('event'),
    trace: field('trace'), request: field('request'), task: field('task'), text, textMode, hours,
  }
}

export function parseSavedLoggingFilters(serialized: string | null): NamedLoggingFilter[] {
  if (serialized === null) return []
  if (serialized.length > 200_000) throw new Error('Saved filters are too large')
  const value: unknown = JSON.parse(serialized)
  if (!Array.isArray(value) || value.length > maxSavedFilters) throw new Error('Invalid saved filters')
  const names = new Set<string>()
  return value.map((entry: unknown) => {
    if (!entry || typeof entry !== 'object' || !('name' in entry) || !('filters' in entry) ||
      typeof entry.name !== 'string' || !entry.name.trim() || entry.name.length > 80 || names.has(entry.name)) {
      throw new Error('Invalid saved filter')
    }
    names.add(entry.name)
    return { name: entry.name, filters: parseLoggingFilter(entry.filters) }
  })
}

export function saveLoggingFilter(saved: NamedLoggingFilter[], name: string, filters: LoggingFilterPreset): NamedLoggingFilter[] {
  const trimmed = name.trim()
  if (!trimmed || trimmed.length > 80) throw new Error('Invalid saved filter name')
  const existing = saved.filter((item) => item.name !== trimmed)
  if (existing.length >= maxSavedFilters) throw new Error('Too many saved filters')
  return [...existing, { name: trimmed, filters: parseLoggingFilter(filters) }]
}

export function loggingFilterLink(currentUrl: string, filters: LoggingFilterPreset): string {
  const url = new URL(currentUrl)
  url.username = ''
  url.password = ''
  url.search = '?tab=logging'
  const hash = `#logger-filter=${encodeURIComponent(JSON.stringify(parseLoggingFilter(filters)))}`
  if (hash.length > 40_000) throw new Error('Shared filter is too large')
  url.hash = hash
  return url.toString()
}

export function loggingFilterFromHash(hash: string): LoggingFilterPreset | null {
  if (!hash.startsWith('#logger-filter=')) return null
  if (hash.length > 40_000) throw new Error('Shared filter is too large')
  return parseLoggingFilter(JSON.parse(decodeURIComponent(hash.slice('#logger-filter='.length))))
}

export function exactLoggingFilters(filters: LoggingFilters): Record<string, string> {
  return Object.fromEntries(
    Object.entries(filters).map(([field, value]) => [field, value.trim()]).filter(([, value]) => value),
  )
}

export const MAX_LOG_EXPORT_EVENTS = 500
export const MAX_LIVE_EVENTS = 500
export const MAX_CORRELATION_EVENTS = 500

export function mergeCorrelationPage(current: LoggerEvent[], newestFirst: LoggerEvent[]): LoggerEvent[] {
  const seen = new Set(current.map((event) => event.event_id))
  const older = newestFirst.filter((event) => !seen.has(event.event_id)).reverse()
  return [...older, ...current].slice(-MAX_CORRELATION_EVENTS)
}

export function mergeLiveEvent(events: LoggerEvent[], event: LoggerEvent): { events: LoggerEvent[]; overflow: boolean } {
  const updated = [event, ...events.filter((existing) => existing.event_id !== event.event_id)]
  return { events: updated.slice(0, MAX_LIVE_EVENTS), overflow: updated.length > MAX_LIVE_EVENTS }
}

export function formatLogTime(value: string, zone: 'local' | 'utc'): string {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return value
  return zone === 'utc' ? date.toISOString() : date.toLocaleString()
}

export function loggingLevelClass(level: string): string {
  switch (level) {
    case 'fatal':
    case 'error':
      return 'text-red-300'
    case 'warn':
      return 'text-amber-300'
    case 'info':
      return 'text-sky-300'
    case 'debug':
    case 'trace':
      return 'text-flixer-muted'
    default:
      return ''
  }
}

export function serializeLoggingExport(events: LoggerEvent[]): string {
  return JSON.stringify(events.slice(0, MAX_LOG_EXPORT_EVENTS), null, 2)
}
