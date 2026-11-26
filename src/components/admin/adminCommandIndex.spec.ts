import { describe, expect, it } from 'vitest'
import en from '../../locales/en.json'
import { ADMIN_TAB_IDS, pagesOf } from './adminNav'
import { WIDGET_CATALOG } from './dashboard/dashboardCatalog'
import { buildStaticAdminCommands, matchesCommandFilter, searchAdminCommands } from './adminCommandIndex'

function resolveEn(key: string): string {
  const value = key.split('.').reduce<unknown>((acc, part) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined), en)
  if (typeof value !== 'string') {
    throw new Error(`Missing English locale string for "${key}"`)
  }
  return value
}

describe('adminCommandIndex', () => {
  const items = buildStaticAdminCommands({ t: resolveEn })

  it('indexes every admin tab and page with valid English labels', () => {
    for (const tab of ADMIN_TAB_IDS) {
      for (const page of pagesOf(tab)) {
        const entry = items.find((item) => item.id === `page:${tab}:${page}`)
        expect(entry, `Missing page index entry for ${tab}:${page}`).toBeDefined()
        expect(entry?.title.length).toBeGreaterThan(0)
        expect(entry?.subtitle?.length).toBeGreaterThan(0)
      }
    }
  })

  it('indexes every dashboard widget with its domId', () => {
    for (const widget of WIDGET_CATALOG) {
      const entry = items.find((item) => item.id === `widget:${widget.id}`)
      expect(entry, `Missing widget index entry for ${widget.id}`).toBeDefined()
      expect(entry?.tab).toBe('dashboard')
      expect(entry?.page).toBe('overview')
      expect(entry?.domId).toBe(`dashboard-widget-${widget.id}`)
    }
  })

  it('resolves every static section and setting title against English locales', () => {
    const sectionsAndSettings = items.filter((item) => item.kind === 'section' || item.kind === 'setting')
    expect(sectionsAndSettings.length).toBeGreaterThan(70)
    for (const entry of sectionsAndSettings) {
      expect(entry.title.length).toBeGreaterThan(0)
      expect(entry.scrollText).toBe(entry.title)
    }
  })

  it('supports multi-word search across title, category, and keywords', () => {
    const proxyResults = searchAdminCommands(items, 'trust proxy')
    expect(proxyResults.some((item) => item.id === 'setting:networking:trustProxies')).toBe(true)

    const ffmpegResults = searchAdminCommands(items, 'ffmpeg')
    expect(ffmpegResults.some((item) => item.page === 'transcoding')).toBe(true)

    const dkimResults = searchAdminCommands(items, 'dkim domain')
    expect(dkimResults.some((item) => item.page === 'mailDomains')).toBe(true)
  })

  it('limits empty-query results to 4 and prioritizes recent items', () => {
    const recent = ['setting:networking:trustProxies', 'widget:logs']
    const defaultResults = searchAdminCommands(items, '', 'all', recent)
    expect(defaultResults).toHaveLength(4)
    expect(defaultResults[0]?.id).toBe('setting:networking:trustProxies')
    expect(defaultResults[1]?.id).toBe('widget:logs')

    const widgetOnly = searchAdminCommands(items, '', 'widgets')
    expect(widgetOnly.every((item) => matchesCommandFilter(item, 'widgets'))).toBe(true)
    expect(widgetOnly).toHaveLength(WIDGET_CATALOG.length)
  })
})
