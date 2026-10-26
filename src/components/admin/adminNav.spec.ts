import { describe, expect, it } from 'vitest'
import { ADMIN_TABS, ADMIN_TAB_IDS, adminQuery, resolveAdminLocation, tabOf } from './adminNav'

describe('admin navigation', () => {
  it('opens the dashboard by default', () => {
    expect(resolveAdminLocation(undefined)).toEqual({ tab: 'dashboard', page: 'overview' })
    expect(resolveAdminLocation('nonsense')).toEqual({ tab: 'dashboard', page: 'overview' })
  })

  it('opens the first page of a tab, or the requested one', () => {
    expect(resolveAdminLocation('library')).toEqual({ tab: 'library', page: 'libraries' })
    expect(resolveAdminLocation('library', 'tasks')).toEqual({ tab: 'library', page: 'tasks' })
    expect(resolveAdminLocation('library', 'themes')).toEqual({ tab: 'library', page: 'libraries' })
    expect(resolveAdminLocation(['providers', 'x'], ['themes'])).toEqual({ tab: 'providers', page: 'themes' })
  })

  it('keeps old links working', () => {
    expect(resolveAdminLocation('indexer')).toEqual({ tab: 'library', page: 'tasks' })
    expect(resolveAdminLocation('tasks')).toEqual({ tab: 'library', page: 'tasks' })
    expect(resolveAdminLocation('media')).toEqual({ tab: 'library', page: 'media' })
    expect(resolveAdminLocation('transcoding')).toEqual({ tab: 'library', page: 'transcoding' })
    expect(resolveAdminLocation('users')).toEqual({ tab: 'settings', page: 'users' })
    expect(resolveAdminLocation('devices')).toEqual({ tab: 'settings', page: 'users' })
    expect(resolveAdminLocation('updates')).toEqual({ tab: 'settings', page: 'updates' })
    expect(resolveAdminLocation('backups')).toEqual({ tab: 'settings', page: 'backups' })
    expect(resolveAdminLocation('settings')).toEqual({ tab: 'settings', page: 'server' })
    expect(resolveAdminLocation('plugins')).toEqual({ tab: 'plugins', page: 'plugins' })
  })

  it('places every page in exactly one tab', () => {
    const all = Object.values(ADMIN_TABS).flat()
    expect(new Set(all).size).toBe(all.length)
    expect(all.every((page) => tabOf(page) !== null)).toBe(true)
    expect(ADMIN_TAB_IDS.every((tab) => ADMIN_TABS[tab].length > 0)).toBe(true)
  })

  it('leaves the default page out of the link', () => {
    expect(adminQuery('library', 'libraries')).toEqual({ tab: 'library' })
    expect(adminQuery('library', 'media')).toEqual({ tab: 'library', page: 'media' })
  })

  it('opens plugin pages only inside the providers tab and only once they are known', () => {
    const page = 'plugin:flixer.skipmedb:skipmedb'
    expect(resolveAdminLocation('providers', page, [page])).toEqual({ tab: 'providers', page })
    expect(resolveAdminLocation('providers', page)).toEqual({ tab: 'providers', page: 'metadata' })
    expect(resolveAdminLocation('library', page, [page])).toEqual({ tab: 'library', page: 'libraries' })
  })
})
