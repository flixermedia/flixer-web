export const WIDGET_CATEGORIES = ['overview', 'streaming', 'libraries', 'system', 'people', 'shortcuts'] as const
export type WidgetCategory = (typeof WIDGET_CATEGORIES)[number]

/** Ids are lower-case letters and hyphens only; the server stores them as the saved layout and checks the same pattern. */
export const WIDGET_CATALOG = [
  { id: 'stats', category: 'overview', w: 3, h: 1, keywords: ['movies', 'series', 'episodes', 'tracks', 'users', 'totals', 'count'] },
  { id: 'server', category: 'overview', w: 1, h: 4, keywords: ['version', 'node', 'os', 'streamer', 'indexer'] },
  { id: 'storage', category: 'overview', w: 1, h: 3, keywords: ['disk', 'space', 'size'] },
  { id: 'activity', category: 'overview', w: 2, h: 3, keywords: ['watched', 'history', 'recent'] },
  { id: 'uptime', category: 'overview', w: 1, h: 2, keywords: ['version', 'running', 'time', 'node'] },
  { id: 'streams', category: 'streaming', w: 3, h: 4, keywords: ['sessions', 'playback', 'cancel', 'transcode'] },
  { id: 'transcoding', category: 'streaming', w: 1, h: 2, keywords: ['ffmpeg', 'slots', 'load', 'encode'] },
  { id: 'libraries', category: 'libraries', w: 1, h: 3, keywords: ['folders', 'items', 'size'] },
  { id: 'content-mix', category: 'libraries', w: 2, h: 3, keywords: ['movies', 'series', 'music', 'distribution', 'chart'] },
  { id: 'queues', category: 'libraries', w: 1, h: 2, keywords: ['indexer', 'workers', 'tasks', 'failed', 'pending'] },
  { id: 'services', category: 'system', w: 1, h: 1, keywords: ['health', 'status', 'streamer', 'indexer', 'online'] },
  { id: 'updates', category: 'system', w: 1, h: 1, keywords: ['version', 'upgrade', 'release'] },
  { id: 'backups', category: 'system', w: 1, h: 2, keywords: ['restore', 'schedule', 'encryption', 'database'] },
  { id: 'logs', category: 'system', w: 3, h: 4, keywords: ['errors', 'warnings', 'output', 'debug'] },
  { id: 'requests', category: 'people', w: 1, h: 1, keywords: ['pending', 'approve', 'media', 'queue'] },
  { id: 'users', category: 'people', w: 1, h: 2, keywords: ['accounts', 'admins', 'sessions', 'sign-in'] },
  { id: 'shortcuts', category: 'shortcuts', w: 3, h: 2, keywords: ['links', 'jump', 'navigate', 'quick'] },
] as const satisfies readonly { id: string; category: WidgetCategory; w: number; h: number; keywords: readonly string[] }[]

export type DashboardWidgetId = (typeof WIDGET_CATALOG)[number]['id']
/** The dashboard is a grid 3 columns wide. Heights are in half-rows, so 2 units is one row and a panel is 1 to 6 units tall. */
export const GRID_COLUMNS = 3
export const MIN_HEIGHT = 1
export const MAX_HEIGHT = 6

export const WIDGET_IDS = WIDGET_CATALOG.map((entry) => entry.id) as DashboardWidgetId[]

export function catalogEntry(id: DashboardWidgetId) {
  return WIDGET_CATALOG.find((entry) => entry.id === id)!
}

export interface SearchablePanel {
  id: DashboardWidgetId
  category: WidgetCategory
  name: string
  description: string
}

/** Panels in `category` (or every category) whose name, description, id or keywords contain every word of `query`. */
export function filterPanels(panels: readonly SearchablePanel[], query: string, category: WidgetCategory | 'all'): SearchablePanel[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  return panels.filter((panel) => {
    if (category !== 'all' && panel.category !== category) return false
    const haystack = `${panel.name} ${panel.description} ${panel.id} ${catalogEntry(panel.id).keywords.join(' ')}`.toLowerCase()
    return words.every((word) => haystack.includes(word))
  })
}
