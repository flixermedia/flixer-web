import { describe, expect, it } from 'vitest'
import { WIDGET_CATALOG, WIDGET_IDS, filterPanels, GRID_COLUMNS, MAX_HEIGHT, type SearchablePanel } from './dashboardCatalog'
import { DEFAULT_GRID, addWidget, findFreeSpot, isDefaultGrid, normalizeGrid, overlaps, placeWidget, removeWidget, type GridItem } from './dashboardLayout'

const noOverlaps = (items: GridItem[]) => items.every((a, i) => items.every((b, j) => i === j || !overlaps(a, b)))
const get = (items: GridItem[], id: string) => items.find((item) => item.id === id)!

describe('default grid', () => {
  it('is already settled, so loading it changes nothing', () => {
    expect(normalizeGrid(DEFAULT_GRID.map((item) => ({ ...item })))).toEqual([...DEFAULT_GRID])
  })

  it('fits the grid without overlaps', () => {
    expect(noOverlaps([...DEFAULT_GRID])).toBe(true)
    expect(DEFAULT_GRID.every((i) => i.x + i.w <= GRID_COLUMNS && i.h >= 1 && i.h <= MAX_HEIGHT)).toBe(true)
  })
})

describe('normalizeGrid', () => {
  it('uses the default when nothing is saved and keeps a saved empty list empty', () => {
    expect(isDefaultGrid(normalizeGrid(undefined))).toBe(true)
    expect(normalizeGrid([])).toEqual([])
  })

  it('drops unknown, repeated and malformed entries and clamps sizes', () => {
    const grid = normalizeGrid([{ id: 'stats', x: 4, y: 0, w: 3, h: 99 }, { id: 'stats', x: 0, y: 0, w: 1, h: 1 }, { id: 'nope', x: 0, y: 0, w: 1, h: 1 }, { id: 'logs', x: 'a', y: 0, w: 1, h: 1 }, null])
    expect(grid).toEqual([{ id: 'stats', x: 2, y: 0, w: 3, h: MAX_HEIGHT }])
  })

  it('closes gaps in a saved layout', () => {
    expect(normalizeGrid([{ id: 'stats', x: 0, y: 40, w: 5, h: 2 }])).toEqual([{ id: 'stats', x: 0, y: 0, w: 5, h: 2 }])
  })

  it('settles saved overlaps', () => {
    const grid = normalizeGrid([
      { id: 'stats', x: 0, y: 0, w: 5, h: 2 },
      { id: 'logs', x: 0, y: 0, w: 5, h: 2 },
    ])
    expect(noOverlaps(grid)).toBe(true)
  })
})

describe('placeWidget', () => {
  const base: GridItem[] = [
    { id: 'server', x: 0, y: 0, w: 2, h: 6 },
    { id: 'storage', x: 2, y: 0, w: 3, h: 2 },
    { id: 'activity', x: 2, y: 2, w: 3, h: 2 },
  ]

  it('never leaves a gap: a panel dropped lower floats back up against the one above', () => {
    expect(get(placeWidget(base, 'activity', { y: 5 }), 'activity').y).toBe(2)
  })

  it('pushes panels it lands on down, then closes the space', () => {
    const next = placeWidget(base, 'activity', { y: 0 })
    expect(get(next, 'activity')).toMatchObject({ x: 2, y: 0 })
    expect(get(next, 'storage').y).toBe(2)
    expect(noOverlaps(next)).toBe(true)
  })

  it('closes the hole left when a panel moves away', () => {
    const next = placeWidget(base, 'storage', { x: 0, y: 6, w: 2 })
    expect(get(next, 'activity').y).toBe(0)
    expect(noOverlaps(next)).toBe(true)
  })

  it('brings panels pushed down by a cascade back up once there is room', () => {
    const items: GridItem[] = [
      { id: 'stats', x: 0, y: 0, w: 5, h: 2 },
      { id: 'streams', x: 0, y: 2, w: 5, h: 4 },
      { id: 'logs', x: 0, y: 6, w: 5, h: 6 },
    ]
    const next = placeWidget(items, 'streams', { w: 2, h: 2 })
    expect(get(next, 'logs').y).toBe(4)
  })

  it('keeps panels inside the grid and within the size limits', () => {
    const next = placeWidget(base, 'storage', { x: 4, w: 9, h: 40, y: -3 })
    expect(get(next, 'storage')).toMatchObject({ x: 0, y: 0, w: GRID_COLUMNS, h: MAX_HEIGHT })
    expect(noOverlaps(next)).toBe(true)
  })

  it('pushes panels down when a panel grows over them', () => {
    const next = placeWidget(base, 'storage', { h: 6 })
    expect(get(next, 'activity').y).toBe(6)
    expect(noOverlaps(next)).toBe(true)
  })

  it('ignores an unknown panel', () => {
    expect(placeWidget(base, 'users', { x: 1 })).toEqual(base)
  })
})

describe('adding and removing', () => {
  it('adds in the first free spot at the default size', () => {
    const items: GridItem[] = [{ id: 'stats', x: 0, y: 0, w: 5, h: 2 }]
    const next = addWidget(items, 'server')
    expect(get(next, 'server')).toMatchObject({ x: 0, y: 2, w: 2, h: 4 })
    expect(addWidget(next, 'server')).toEqual(next)
  })

  it('finds a gap beside existing panels', () => {
    expect(findFreeSpot([{ id: 'server', x: 0, y: 0, w: 2, h: 4 }], 3, 2)).toEqual({ x: 2, y: 0 })
  })

  it('removes a panel', () => {
    expect(removeWidget([...DEFAULT_GRID], 'logs').some((item) => item.id === 'logs')).toBe(false)
    expect(get(removeWidget([...DEFAULT_GRID], 'stats'), 'server').y).toBe(0)
  })
})

describe('panel catalog', () => {
  it('uses ids the server accepts, each once, with sizes the grid allows', () => {
    expect(new Set(WIDGET_IDS).size).toBe(WIDGET_IDS.length)
    expect(WIDGET_IDS.every((id) => /^[a-z][a-z-]{0,31}$/.test(id))).toBe(true)
    expect(WIDGET_IDS.length).toBeLessThanOrEqual(40)
    expect(WIDGET_CATALOG.every((entry) => entry.w >= 1 && entry.w <= GRID_COLUMNS && entry.h >= 1 && entry.h <= MAX_HEIGHT)).toBe(true)
    expect(DEFAULT_GRID.every((item) => WIDGET_IDS.includes(item.id))).toBe(true)
  })

  const panels: SearchablePanel[] = [
    { id: 'storage', category: 'overview', name: 'Storage', description: 'Space used by your libraries' },
    { id: 'queues', category: 'libraries', name: 'Indexer queues', description: 'Pending and failed work' },
  ]

  it('filters by category and by every search word, including keywords', () => {
    expect(filterPanels(panels, '', 'all')).toHaveLength(2)
    expect(filterPanels(panels, '', 'libraries').map((p) => p.id)).toEqual(['queues'])
    expect(filterPanels(panels, 'failed work', 'all').map((p) => p.id)).toEqual(['queues'])
    expect(filterPanels(panels, 'disk', 'all').map((p) => p.id)).toEqual(['storage'])
    expect(filterPanels(panels, 'disk failed', 'all')).toEqual([])
  })
})
