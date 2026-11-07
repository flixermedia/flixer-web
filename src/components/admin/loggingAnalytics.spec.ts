import { describe, expect, it } from 'vitest'
import { aggregateLoggingAnalytics, hourlyLoggingAnalytics, loggingApplicationCounts } from './loggingAnalytics'

describe('logging analytics', () => {
  const start = Date.parse('2026-01-01T10:30:00Z')
  const end = Date.parse('2026-01-01T13:30:00Z')

  it('sums all sources per application without truncating the breakdown', () => {
    expect(loggingApplicationCounts([
      { app: 'indexer', source: 'a', count: 4 },
      { app: 'flixer', source: 'api', count: 6 },
      { app: 'indexer', source: 'b', count: 3 },
    ])).toEqual([{ app: 'indexer', count: 7 }, { app: 'flixer', count: 6 }])
    expect(() => loggingApplicationCounts([{ app: '', source: 'a', count: 1 }])).toThrow()
    expect(() => loggingApplicationCounts([
      { app: 'a', source: 'one', count: Number.MAX_SAFE_INTEGER },
      { app: 'a', source: 'two', count: 1 },
    ])).toThrow()
  })

  it('groups selected windows into bounded UTC minute and day buckets', () => {
    const minuteStart = Date.parse('2026-01-01T10:00:00Z')
    const minuteEnd = minuteStart + 3 * 60_000
    const minute = aggregateLoggingAnalytics([
      { start: '2026-01-01T10:01:00Z', counts: { error: 2 } },
    ], minuteStart, minuteEnd, 'minute')
    expect(minute.events).toEqual([
      { day: '2026-01-01 10:00 UTC', value: 0 },
      { day: '2026-01-01 10:01 UTC', value: 2 },
      { day: '2026-01-01 10:02 UTC', value: 0 },
    ])
    const days = aggregateLoggingAnalytics([
      { start: '2026-01-02T00:00:00Z', counts: { info: 3 } },
    ], start, Date.parse('2026-01-03T00:00:00Z'), 'day')
    expect(days.events).toEqual([{ day: '2026-01-01 UTC', value: 0 }, { day: '2026-01-02 UTC', value: 3 }])
    expect(() => aggregateLoggingAnalytics([], minuteStart, minuteStart + 30 * 24 * 60 * 60_000, 'minute')).toThrow()
    expect(aggregateLoggingAnalytics([], minuteStart, minuteStart + 30 * 24 * 60 * 60_000, 'hour').events.length).toBeLessThanOrEqual(721)
  })

  it('fills sparse UTC hours and separately counts errors and fatal events', () => {
    const result = hourlyLoggingAnalytics([
      { start: '2026-01-01T10:30:00Z', counts: { info: 3, error: 1 } },
      { start: '2026-01-01T12:05:00Z', counts: { warn: 2, fatal: 4 } },
    ], start, end)
    expect(result.totals).toEqual({ info: 3, error: 1, warn: 2, fatal: 4 })
    expect(result.events).toEqual([
      { day: '2026-01-01 10:00 UTC', value: 4 },
      { day: '2026-01-01 11:00 UTC', value: 0 },
      { day: '2026-01-01 12:00 UTC', value: 6 },
      { day: '2026-01-01 13:00 UTC', value: 0 },
    ])
    expect(result.errors.map((point) => point.value)).toEqual([1, 0, 4, 0])
  })

  it('rejects invalid counts, timestamps and out-of-window buckets', () => {
    expect(() => hourlyLoggingAnalytics([{ start: '2026-01-01T10:30:00Z', counts: { info: -1 } }], start, end)).toThrow()
    expect(() => hourlyLoggingAnalytics([{ start: 'invalid', counts: {} }], start, end)).toThrow()
    expect(() => hourlyLoggingAnalytics([{ start: '2026-01-01T13:30:00Z', counts: {} }], start, end)).toThrow()
    expect(() => hourlyLoggingAnalytics([], start, start + 25 * 60 * 60_000)).toThrow()
  })
})
