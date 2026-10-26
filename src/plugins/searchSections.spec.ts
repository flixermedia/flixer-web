import { describe, expect, it } from 'vitest'
import { pluginSearchType, sanitizeSearchSections, searchItemRoute } from './searchSections'

const item = { title: 'Dune', page: 'requests', query: { tab: 'details', id: 438631 } }

describe('sanitizeSearchSections', () => {
  it('keeps valid sections and normalizes items', () => {
    const result = sanitizeSearchSections({
      sections: [{ pluginId: 'flixer.requests', title: 'Not in library', items: [{ ...item, subtitle: 'Movie · 2021', poster: 'https://img.example/p.jpg', shape: 'square', badge: { text: 'Pending', tone: 'warning' } }] }],
    })
    expect(result).toEqual([
      {
        pluginId: 'flixer.requests',
        title: 'Not in library',
        items: [{ title: 'Dune', subtitle: 'Movie · 2021', poster: 'https://img.example/p.jpg', shape: 'square', badge: { text: 'Pending', tone: 'warning' }, page: 'requests', query: { tab: 'details', id: '438631' } }],
      },
    ])
  })

  it('only allows https posters', () => {
    for (const poster of ['http://a/x.jpg', 'javascript:alert(1)', 'data:image/png;base64,AA', '/x.jpg']) {
      const [section] = sanitizeSearchSections({ sections: [{ pluginId: 'p', title: 'T', items: [{ ...item, poster }] }] })
      expect(section.items[0].poster).toBeUndefined()
    }
  })

  it('defaults shape and badge tone, drops unknown tones', () => {
    const [section] = sanitizeSearchSections({ sections: [{ pluginId: 'p', title: 'T', items: [{ ...item, badge: { text: 'x', tone: 'neon' } }] }] })
    expect(section.items[0]).toMatchObject({ shape: 'poster', badge: { text: 'x', tone: 'default' } })
  })

  it('drops malformed items and empty or invalid sections', () => {
    expect(sanitizeSearchSections(null)).toEqual([])
    expect(sanitizeSearchSections({ sections: 'x' })).toEqual([])
    expect(
      sanitizeSearchSections({
        sections: [
          { pluginId: 'bad id!', title: 'T', items: [item] },
          { pluginId: 'p', title: '', items: [item] },
          { pluginId: 'p', title: 'T', items: [{ title: 'x', page: '../x' }, { page: 'ok' }, 'junk'] },
        ],
      }),
    ).toEqual([])
  })
})

describe('search helpers', () => {
  it('maps the type filter', () => {
    expect(pluginSearchType('')).toBeUndefined()
    expect(pluginSearchType('movie')).toBe('movie')
    expect(pluginSearchType('series')).toBe('series')
    expect(pluginSearchType('album')).toBe('album')
    expect(pluginSearchType('video')).toBeNull()
  })

  it('builds the plugin page route', () => {
    expect(searchItemRoute('flixer.requests', { page: 'requests', query: { id: '1' } })).toEqual({ path: '/plugins/flixer.requests/requests', query: { id: '1' } })
  })
})
