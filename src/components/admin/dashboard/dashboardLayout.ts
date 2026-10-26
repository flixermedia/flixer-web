import { GRID_COLUMNS, MAX_HEIGHT, MIN_HEIGHT, WIDGET_IDS, catalogEntry, type DashboardWidgetId } from './dashboardCatalog'

export { WIDGET_CATALOG, WIDGET_IDS, catalogEntry, type DashboardWidgetId } from './dashboardCatalog'

/** A panel's place on the grid: column `x` and row-unit `y` (both from 0), `w` columns wide and `h` row-units tall. */
export interface GridItem {
  id: DashboardWidgetId
  x: number
  y: number
  w: number
  h: number
}

const MAX_ROW = 99

/** What a dashboard that was never customised shows. */
export const DEFAULT_GRID: readonly GridItem[] = [
  { id: 'server', x: 0, y: 0, w: 2, h: 4 },
  { id: 'activity', x: 2, y: 0, w: 2, h: 2 },
  { id: 'updates', x: 4, y: 0, w: 1, h: 2 },
  { id: 'services', x: 2, y: 2, w: 3, h: 2 },
  { id: 'stats', x: 0, y: 4, w: 2, h: 1 },
  { id: 'users', x: 2, y: 4, w: 2, h: 2 },
  { id: 'queues', x: 4, y: 4, w: 1, h: 2 },
  { id: 'logs', x: 0, y: 5, w: 2, h: 5 },
  { id: 'storage', x: 2, y: 6, w: 3, h: 2 },
  { id: 'streams', x: 2, y: 8, w: 3, h: 2 },
]

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export function overlaps(a: GridItem, b: GridItem): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
}

/** Brings a placement inside the grid: 1 to 5 columns wide, half a row to three rows tall, never past the right edge. */
export function clampItem(item: GridItem): GridItem {
  const w = clamp(Math.round(item.w), 1, GRID_COLUMNS)
  const h = clamp(Math.round(item.h), MIN_HEIGHT, MAX_HEIGHT)
  return { id: item.id, w, h, x: clamp(Math.round(item.x), 0, GRID_COLUMNS - w), y: clamp(Math.round(item.y), 0, MAX_ROW) }
}

/** The lowest free row for `item` in its columns, given the panels already placed. */
function floatUp(item: GridItem, placed: readonly GridItem[]): GridItem {
  let y = 0
  for (const other of [...placed].sort((p, q) => p.y + p.h - (q.y + q.h))) {
    if (overlaps({ ...item, y }, other)) y = other.y + other.h
  }
  return { ...item, y }
}

function compact(items: readonly GridItem[]): GridItem[] {
  const placed: GridItem[] = []
  for (const item of [...items].sort((a, b) => a.y - b.y || a.x - b.x)) placed.push(floatUp(item, placed))
  return items.map((item) => placed.find((entry) => entry.id === item.id)!)
}

/**
 * Resolves overlaps and closes gaps. The panel being placed (`fixedId`) is laid out first, so whatever it lands on is pushed
 * below it; then every panel floats up as far as it can, so the dashboard never has empty space above a panel.
 */
function settle(items: readonly GridItem[], fixedId: DashboardWidgetId | null): GridItem[] {
  const fixed = items.filter((item) => item.id === fixedId)
  const rest = items.filter((item) => item.id !== fixedId).sort((a, b) => a.y - b.y || a.x - b.x)
  const placed: GridItem[] = [...fixed]
  for (const item of rest) placed.push(floatUp(item, placed))
  return compact(items.map((item) => placed.find((entry) => entry.id === item.id)!))
}

/** Moves and/or resizes a panel; whatever it lands on is pushed down out of the way. */
export function placeWidget(items: readonly GridItem[], id: DashboardWidgetId, patch: Partial<Omit<GridItem, 'id'>>): GridItem[] {
  const current = items.find((item) => item.id === id)
  if (!current) return [...items]
  const moved = clampItem({ ...current, ...patch })
  return settle(
    items.map((item) => (item.id === id ? moved : item)),
    id,
  )
}

/** The topmost, then leftmost, free spot for a panel of this size. */
export function findFreeSpot(items: readonly GridItem[], w: number, h: number): { x: number; y: number } {
  for (let y = 0; ; y++) {
    for (let x = 0; x + w <= GRID_COLUMNS; x++) {
      if (!items.some((item) => overlaps({ id: 'stats', x, y, w, h }, item))) return { x, y }
    }
  }
}

/** Adds a panel at its default size in the first free spot. A panel already on the dashboard is not added twice. */
export function addWidget(items: readonly GridItem[], id: DashboardWidgetId): GridItem[] {
  if (items.some((item) => item.id === id)) return [...items]
  const { w, h } = catalogEntry(id)
  return [...items, { id, w, h, ...findFreeSpot(items, w, h) }]
}

export function removeWidget(items: readonly GridItem[], id: DashboardWidgetId): GridItem[] {
  return compact(items.filter((item) => item.id !== id))
}

const isInt = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value)

/**
 * The saved placements, repaired: unknown or repeated panels and malformed entries are dropped, sizes are clamped to the grid,
 * and overlaps and gaps are settled. Nothing saved means the default layout; a saved empty list stays empty.
 */
export function normalizeGrid(saved: unknown): GridItem[] {
  if (!Array.isArray(saved)) return DEFAULT_GRID.map((item) => ({ ...item }))
  const known = new Set<string>(WIDGET_IDS)
  const items: GridItem[] = []
  for (const entry of saved as Array<Partial<GridItem> | null>) {
    if (!entry || typeof entry.id !== 'string' || !known.has(entry.id) || items.some((item) => item.id === entry.id)) continue
    if (!isInt(entry.x) || !isInt(entry.y) || !isInt(entry.w) || !isInt(entry.h)) continue
    items.push(clampItem(entry as GridItem))
  }
  return settle(items, null)
}

export function sameGrid(a: readonly GridItem[], b: readonly GridItem[]): boolean {
  if (a.length !== b.length) return false
  return a.every((item) => {
    const other = b.find((entry) => entry.id === item.id)
    return !!other && other.x === item.x && other.y === item.y && other.w === item.w && other.h === item.h
  })
}

export function isDefaultGrid(items: readonly GridItem[]): boolean {
  return sameGrid(items, DEFAULT_GRID)
}

/** Panels in reading order (top to bottom, then left to right), which is the order they stack in on small screens. */
export function readingOrder(items: readonly GridItem[]): GridItem[] {
  return [...items].sort((a, b) => a.y - b.y || a.x - b.x)
}

/** How many row-units the grid needs to show every panel. */
export function rowCount(items: readonly GridItem[]): number {
  return items.reduce((max, item) => Math.max(max, item.y + item.h), 0)
}
