import { describe, expect, it } from 'vitest'
import { ADMIN_GROUPS, groupOf, resolveAdminGroup } from './adminNav'

describe('admin navigation', () => {
  it('opens the dashboard by default', () => {
    expect(resolveAdminGroup(undefined)).toBe('dashboard')
    expect(resolveAdminGroup('nonsense')).toBe('dashboard')
  })

  it('keeps old single-page links working', () => {
    expect(resolveAdminGroup('indexer')).toBe('library')
    expect(resolveAdminGroup('providers')).toBe('providers')
    expect(resolveAdminGroup('tasks')).toBe('settings')
    expect(resolveAdminGroup('devices')).toBe('users')
  })

  it('accepts a group name', () => {
    expect(resolveAdminGroup('library')).toBe('library')
  })

  it('places every section in exactly one group', () => {
    const all = Object.values(ADMIN_GROUPS).flat()
    expect(new Set(all).size).toBe(all.length)
    expect(all.every((id) => groupOf(id) !== null)).toBe(true)
  })
})
