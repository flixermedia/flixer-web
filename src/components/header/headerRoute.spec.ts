import { describe, expect, it } from 'vitest'
import { getHeaderRoute } from './headerRoute'

describe('getHeaderRoute', () => {
  it('keeps the normal navigation on media pages', () => {
    expect(getHeaderRoute('media-item', false)).toEqual({
      show: true, showLinks: true, docked: false, disableScrollCollapse: false,
    })
  })

  it.each(['admin', 'admin-activity', 'settings'])('keeps %s docked without links', (name) => {
    expect(getHeaderRoute(name, false)).toEqual({
      show: true, showLinks: false, docked: true, disableScrollCollapse: false,
    })
  })

  it('preserves guide and compact chat behavior', () => {
    expect(getHeaderRoute('guide', false).disableScrollCollapse).toBe(true)
    expect(getHeaderRoute('chat', true).docked).toBe(true)
    expect(getHeaderRoute('chat', false).docked).toBe(false)
  })

  it('does not show navigation on routes without a header', () => {
    for (const name of ['login', 'setup', 'connect', 'live-player', 'quick-connect', undefined]) {
      expect(getHeaderRoute(name, false).show).toBe(false)
    }
    expect(getHeaderRoute('player-test', false)).toEqual({
      show: true, showLinks: false, docked: false, disableScrollCollapse: false,
    })
  })
})
