import { describe, expect, it } from 'vitest'
import { thumbnailAt } from './trickplay'

const manifest = { intervalMs: 10_000, thumbWidth: 320, thumbHeight: 180, columns: 10, rows: 10, count: 130, sheets: 2 }

describe('thumbnailAt', () => {
  it('uses the first thumbnail at the start', () => {
    expect(thumbnailAt(manifest, 0, 160)).toMatchObject({ sheet: 0, x: 0, y: 0, width: 160, height: 90, sheetWidth: 1600, sheetHeight: 900 })
  })

  it('moves along a row, then down a row', () => {
    expect(thumbnailAt(manifest, 35, 160)).toMatchObject({ sheet: 0, x: 480, y: 0 })
    expect(thumbnailAt(manifest, 120, 160)).toMatchObject({ sheet: 0, x: 320, y: 90 })
  })

  it('continues on the next sheet after a hundred thumbnails', () => {
    expect(thumbnailAt(manifest, 1000, 160)).toMatchObject({ sheet: 1, x: 0, y: 0 })
    expect(thumbnailAt(manifest, 1051, 160)).toMatchObject({ sheet: 1, x: 800, y: 0 })
  })

  it('clamps to the last thumbnail', () => {
    expect(thumbnailAt(manifest, 99_999, 160)).toMatchObject({ sheet: 1, x: 1440, y: 180 })
  })
})
