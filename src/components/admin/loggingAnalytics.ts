import type { LoggerBucket, LoggerSourceCount } from '../../api/logger'
import type { DailyCount } from './analyticsChartData'

export interface LoggingAnalytics {
  totals: Record<string, number>
  events: DailyCount[]
  errors: DailyCount[]
}

export function loggingApplicationCounts(sources: LoggerSourceCount[]): { app: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const source of sources) {
    const total = (counts.get(source.app) ?? 0) + source.count
    if (!source.app || !Number.isSafeInteger(source.count) || source.count < 0 || !Number.isSafeInteger(total)) {
      throw new Error('Invalid application count')
    }
    counts.set(source.app, total)
  }
  return [...counts].map(([app, count]) => ({ app, count })).sort((a, b) => b.count - a.count || a.app.localeCompare(b.app))
}

export type LoggingBucketSize = 'minute' | 'hour' | 'day'

/** Summarize sparse UTC minute buckets into a bounded series, including empty buckets. */
export function aggregateLoggingAnalytics(buckets: LoggerBucket[], start: number, end: number, bucketSize: LoggingBucketSize): LoggingAnalytics {
  const bucketMs = { minute: 60_000, hour: 60 * 60_000, day: 24 * 60 * 60_000 }[bucketSize]
  if (!bucketMs || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= end ||
    end - start > 30 * 24 * 60 * 60_000 || Math.ceil((end - Math.floor(start / bucketMs) * bucketMs) / bucketMs) > 1500) {
    throw new Error('Invalid logging analytics window')
  }
  const hours = new Map<number, { events: number; errors: number }>()
  for (let hour = Math.floor(start / bucketMs) * bucketMs; hour < end; hour += bucketMs) {
    hours.set(hour, { events: 0, errors: 0 })
  }
  const totals: Record<string, number> = {}
  for (const bucket of buckets) {
    const time = Date.parse(bucket.start)
    if (!Number.isFinite(time) || time < start || time >= end || time % 60_000 !== 0 ||
      !bucket.counts || typeof bucket.counts !== 'object' || Array.isArray(bucket.counts)) {
      throw new Error('Invalid logging analytics bucket')
    }
    const hour = hours.get(Math.floor(time / bucketMs) * bucketMs)
    if (!hour) throw new Error('Logging analytics bucket outside window')
    for (const [level, count] of Object.entries(bucket.counts)) {
      if (!Number.isSafeInteger(count) || count < 0 ||
        !Number.isSafeInteger((totals[level] ?? 0) + count) ||
        !Number.isSafeInteger(hour.events + count)) {
        throw new Error('Invalid logging analytics count')
      }
      totals[level] = (totals[level] ?? 0) + count
      hour.events += count
      if (level === 'error' || level === 'fatal') {
        if (!Number.isSafeInteger(hour.errors + count)) throw new Error('Invalid logging analytics count')
        hour.errors += count
      }
    }
  }
  const points = [...hours].map(([time, counts]) => ({
    day: bucketSize === 'day' ? `${new Date(time).toISOString().slice(0, 10)} UTC`
      : `${new Date(time).toISOString().slice(0, bucketSize === 'hour' ? 13 : 16).replace('T', ' ')}${bucketSize === 'hour' ? ':00' : ''} UTC`,
    ...counts,
  }))
  return {
    totals,
    events: points.map(({ day, events }) => ({ day, value: events })),
    errors: points.map(({ day, errors }) => ({ day, value: errors })),
  }
}

/** Summarize the default 24-hour view in UTC hours. */
export function hourlyLoggingAnalytics(buckets: LoggerBucket[], start: number, end: number): LoggingAnalytics {
  if (end - start > 24 * 60 * 60_000) throw new Error('Invalid logging analytics window')
  return aggregateLoggingAnalytics(buckets, start, end, 'hour')
}
