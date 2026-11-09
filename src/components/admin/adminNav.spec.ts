import { describe, expect, it } from 'vitest'
import en from '../../locales/en.json'
import { ADMIN_TABS, ADMIN_TAB_IDS, adminQuery, resolveAdminLocation, tabOf } from './adminNav'

describe('admin navigation', () => {
  it('opens the dashboard by default', () => {
    expect(resolveAdminLocation(undefined)).toEqual({ tab: 'dashboard', page: 'overview' })
    expect(resolveAdminLocation('nonsense')).toEqual({ tab: 'dashboard', page: 'overview' })
  })

  it('opens the first page of a tab, or the requested one', () => {
    expect(resolveAdminLocation('library')).toEqual({ tab: 'library', page: 'libraries' })
    expect(resolveAdminLocation('guide')).toEqual({ tab: 'guide', page: 'guide' })
    expect(resolveAdminLocation('library', 'tasks')).toEqual({ tab: 'library', page: 'tasks' })
    expect(resolveAdminLocation('library', 'themes')).toEqual({ tab: 'library', page: 'libraries' })
    expect(resolveAdminLocation(['providers', 'x'], ['themes'])).toEqual({ tab: 'providers', page: 'themes' })
  })

  it('groups ticket management and issue report settings together', () => {
    expect(ADMIN_TABS.issues).toEqual(['tickets', 'issueReports'])
    expect(ADMIN_TABS.requests).not.toContain('tickets')
    expect(ADMIN_TABS.settings).not.toContain('issueReports')
    expect(resolveAdminLocation('issues', 'tickets')).toEqual({ tab: 'issues', page: 'tickets' })
    expect(resolveAdminLocation('issues', 'issueReports')).toEqual({ tab: 'issues', page: 'issueReports' })
  })

  it('places trailer cache settings under providers', () => {
    expect(ADMIN_TABS.providers).toContain('trailerCache')
    expect(tabOf('trailerCache')).toBe('providers')
    expect(resolveAdminLocation('providers', 'trailerCache')).toEqual({ tab: 'providers', page: 'trailerCache' })
    expect(adminQuery('providers', 'trailerCache')).toEqual({ tab: 'providers', page: 'trailerCache' })
  })

  it('gives advertising and analytics their own categories and preserves old ad links', () => {
    expect(tabOf('advertisements')).toBe('advertising')
    expect(resolveAdminLocation('library', 'advertisements')).toEqual({ tab: 'advertising', page: 'advertisements' })
    expect(ADMIN_TABS.analytics).toContain('analyticsHistory')
  })

  it('opens the dedicated logging page from current and legacy links', () => {
    expect(resolveAdminLocation('logging')).toEqual({ tab: 'logging', page: 'logging' })
    expect(resolveAdminLocation('logs')).toEqual({ tab: 'logging', page: 'logging' })
    expect(adminQuery('logging', 'logging')).toEqual({ tab: 'logging' })
  })

  it('groups Widevine configuration and DRM testing in their own category', () => {
    expect(ADMIN_TABS.drm).toEqual(['widevine', 'drmTesting'])
    expect(tabOf('widevine')).toBe('drm')
    expect(tabOf('drmTesting')).toBe('drm')
    expect(resolveAdminLocation('drm')).toEqual({ tab: 'drm', page: 'widevine' })
    expect(resolveAdminLocation('drm', 'drmTesting')).toEqual({ tab: 'drm', page: 'drmTesting' })
    expect(adminQuery('drm', 'drmTesting')).toEqual({ tab: 'drm', page: 'drmTesting' })
    expect(ADMIN_TABS.settings).not.toContain('widevine')
  })

  it('groups chat and audio/video call settings in Communications', () => {
    expect(ADMIN_TABS.communications).toEqual(['chatSettings', 'callSettings'])
    expect(tabOf('chatSettings')).toBe('communications')
    expect(tabOf('callSettings')).toBe('communications')
    expect(resolveAdminLocation('communications')).toEqual({ tab: 'communications', page: 'chatSettings' })
    expect(resolveAdminLocation('communications', 'callSettings')).toEqual({ tab: 'communications', page: 'callSettings' })
    expect(resolveAdminLocation('settings', 'chatEncryption')).toEqual({ tab: 'communications', page: 'chatSettings' })
    expect(resolveAdminLocation('settings', 'calls')).toEqual({ tab: 'communications', page: 'callSettings' })
    expect(ADMIN_TABS.settings).not.toContain('chatSettings')
    expect(ADMIN_TABS.settings).not.toContain('callSettings')
  })

  it('redirects existing issue-report admin links to the new category', () => {
    expect(resolveAdminLocation('requests', 'tickets')).toEqual({ tab: 'issues', page: 'tickets' })
    expect(resolveAdminLocation('settings', 'issueReports')).toEqual({ tab: 'issues', page: 'issueReports' })
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

  it('provides English labels and subtitles for every admin page', () => {
    for (const page of Object.values(ADMIN_TABS).flat()) {
      expect(en.admin.pages).toHaveProperty(page, expect.any(String))
      expect(en.admin.subtitles).toHaveProperty(page, expect.any(String))
    }
  })

  it('leaves the default page out of the link', () => {
    expect(adminQuery('library', 'libraries')).toEqual({ tab: 'library' })
    expect(adminQuery('library', 'media')).toEqual({ tab: 'library', page: 'media' })
  })
})
