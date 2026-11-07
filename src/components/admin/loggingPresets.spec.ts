import { describe, expect, it } from 'vitest'
import { loggingFilterFromHash, loggingFilterLink, parseLoggingFilter, parseSavedLoggingFilters, saveLoggingFilter, type LoggingFilterPreset } from './loggingFilters'

const filters: LoggingFilterPreset = {
  app: 'flixer', level: 'error', source: 'scan', instance: 'node', event: 'scan.failed',
  trace: 'trace-1', request: 'request-1', task: 'task-1', text: 'failed ü', textMode: 'phrase', hours: 168,
}

describe('saved and shared logging filters', () => {
  it('round-trips an explicit fragment link without including unrelated URL data', () => {
    const url = new URL(loggingFilterLink('https://user:password@example.org/admin?tab=settings&token=secret#other', filters))
    expect(url.username).toBe('')
    expect(url.password).toBe('')
    expect(url.search).toBe('?tab=logging')
    expect(url.toString()).not.toContain('secret')
    expect(loggingFilterFromHash(url.hash)).toEqual(filters)
    expect(loggingFilterFromHash('#other')).toBeNull()
  })

  it('rejects invalid and oversized imported data', () => {
    expect(() => loggingFilterFromHash('#logger-filter=%XX')).toThrow()
    expect(() => loggingFilterFromHash(`#logger-filter=${'x'.repeat(40_001)}`)).toThrow()
    expect(() => parseLoggingFilter({ ...filters, hours: 48 })).toThrow()
    expect(() => parseLoggingFilter({ ...filters, level: 'other' })).toThrow()
    expect(() => parseLoggingFilter({ ...filters, app: 'ü'.repeat(513) })).toThrow()
    const escaped = {
      ...filters, app: '\u0000'.repeat(1024), source: '\u0000'.repeat(1024),
      instance: '\u0000'.repeat(1024), event: '\u0000'.repeat(1024), task: '\u0000'.repeat(1024), text: '\u0000'.repeat(1024),
    }
    expect(() => loggingFilterLink('https://example.org/admin', escaped)).toThrow('too large')
    expect(() => parseSavedLoggingFilters('{')).toThrow()
    expect(() => parseSavedLoggingFilters(JSON.stringify([{ name: 'a', filters }, { name: 'a', filters }]))).toThrow()
  })

  it('validates, replaces and limits saved presets', () => {
    expect(parseSavedLoggingFilters(null)).toEqual([])
    const first = saveLoggingFilter([], ' Test ', filters)
    const updated = saveLoggingFilter(first, 'Test', { ...filters, hours: 1 })
    expect(parseSavedLoggingFilters(JSON.stringify(updated))).toEqual([{ name: 'Test', filters: { ...filters, hours: 1 } }])
    let list = updated
    for (let i = 1; i < 20; i++) list = saveLoggingFilter(list, `filter-${i}`, filters)
    expect(() => saveLoggingFilter(list, 'one more', filters)).toThrow()
    expect(() => saveLoggingFilter([], ' ', filters)).toThrow()
  })

  it('round-trips bounded regex filters without trimming patterns', () => {
    const regex = { ...filters, textMode: 'regex' as const, text: ' ^playback\\s+failed ' }
    expect(loggingFilterFromHash(new URL(loggingFilterLink('https://example.org/admin', regex)).hash)).toEqual(regex)
    expect(parseLoggingFilter({ ...regex, text: 'ü'.repeat(128) }).text).toHaveLength(128)
    expect(() => parseLoggingFilter({ ...regex, text: 'ü'.repeat(129) })).toThrow()
  })
})
