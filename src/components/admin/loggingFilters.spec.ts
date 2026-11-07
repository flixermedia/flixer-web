import { describe, expect, it } from 'vitest'
import type { LoggerEvent } from '../../api/logger'
import { exactLoggingFilters, formatLogTime, loggingLevelClass, MAX_CORRELATION_EVENTS, MAX_LIVE_EVENTS, MAX_LOG_EXPORT_EVENTS, mergeCorrelationPage, mergeLiveEvent, serializeLoggingExport } from './loggingFilters'

describe('logging search filters', () => {
  it('sends exact trimmed correlation fields and omits empty filters', () => {
    expect(exactLoggingFilters({
      app: ' flixer ', level: 'fatal', source: ' ', instance: ' node ',
      event: 'event.name', trace: ' trace-1 ', request: 'request-1', task: 'task-1',
    })).toEqual({
      app: 'flixer', level: 'fatal', instance: 'node', event: 'event.name',
      trace: 'trace-1', request: 'request-1', task: 'task-1',
    })

  })

  it('exports only the first 500 displayed events in their displayed order', () => {
    const events: LoggerEvent[] = Array.from({ length: 501 }, (_, index) => ({
      event_id: String(index), time: '2026-01-01T00:00:00Z', ingested_at: '2026-01-01T00:00:00Z',
      level: 'info', app: 'api', instance_id: 'node', message: `event ${index}`,
    }))
    const exported: LoggerEvent[] = JSON.parse(serializeLoggingExport(events))
    expect(exported).toHaveLength(MAX_LOG_EXPORT_EVENTS)
    expect(exported[0]).toEqual(events[0])
    expect(exported.at(-1)).toEqual(events[499])
    expect(events).toHaveLength(501)
  })

  it('distinguishes known severity levels without styling unknown values', () => {
    expect(loggingLevelClass('error')).toBe('text-red-300')
    expect(loggingLevelClass('fatal')).toBe('text-red-300')
    expect(loggingLevelClass('warn')).toBe('text-amber-300')
    expect(loggingLevelClass('trace')).toBe('text-flixer-muted')
    expect(loggingLevelClass('unrecognized')).toBe('')
  })

  it('formats UTC timestamps unambiguously and retains invalid values', () => {
    expect(formatLogTime('2026-01-01T10:30:00Z', 'utc')).toBe('2026-01-01T10:30:00.000Z')
    expect(formatLogTime('invalid', 'local')).toBe('invalid')
  })

  it('caps live events, signals eviction and deduplicates replayed IDs', () => {
    const events: LoggerEvent[] = Array.from({ length: MAX_LIVE_EVENTS }, (_, index) => ({
      event_id: String(index), time: '2026-01-01T00:00:00Z', ingested_at: '2026-01-01T00:00:00Z',
      level: 'info', app: 'api', instance_id: 'node', message: `event ${index}`,
    }))
    const duplicate = mergeLiveEvent(events, events[5]!)
    expect(duplicate.overflow).toBe(false)
    expect(duplicate.events).toHaveLength(MAX_LIVE_EVENTS)
    expect(duplicate.events[0]).toEqual(events[5])
    const updated = mergeLiveEvent(events, { ...events[0]!, event_id: 'new' })
    expect(updated.overflow).toBe(true)
    expect(updated.events).toHaveLength(MAX_LIVE_EVENTS)
    expect(updated.events[0]?.event_id).toBe('new')
    expect(updated.events.some((event) => event.event_id === String(MAX_LIVE_EVENTS - 1))).toBe(false)
  })

  it('prepends older correlation pages in ingestion order and deduplicates overlap', () => {
    const make = (id: string): LoggerEvent => ({
      event_id: id, time: '2026-01-01T00:00:00Z', ingested_at: '2026-01-01T00:00:00Z',
      level: 'info', app: 'api', instance_id: 'node', message: id,
    })
    expect(mergeCorrelationPage([make('3'), make('4')], [make('3'), make('2'), make('1')]).map((event) => event.event_id))
      .toEqual(['1', '2', '3', '4'])
    expect(mergeCorrelationPage([], Array.from({ length: 600 }, (_, index) => make(String(index))))).toHaveLength(MAX_CORRELATION_EVENTS)
  })
})
