import { describe, expect, it } from 'vitest'
import { FLOWS } from './registry'

describe('setup flows', () => {
  it('configures Redis before starting the database in advanced setup', () => {
    expect(FLOWS.advanced).toContain('redis')
    expect(FLOWS.advanced).toContain('database')
    expect(FLOWS.advanced.indexOf('redis')).toBeLessThan(FLOWS.advanced.indexOf('database'))
  })
})
