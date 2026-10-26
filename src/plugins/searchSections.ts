import type { LocationQueryRaw } from 'vue-router'
import type { BadgeTone } from './viewTypes'
import { safeImageSrc } from './viewSchema'

export interface PluginSearchItem {
  title: string
  subtitle?: string
  poster?: string
  shape: 'poster' | 'square'
  badge?: { text: string; tone: BadgeTone }
  page: string
  query: Record<string, string>
}

export interface PluginSearchSection {
  pluginId: string
  title: string
  items: PluginSearchItem[]
}

const TONES: readonly BadgeTone[] = ['default', 'success', 'warning', 'danger', 'info']
const ID_PATTERN = /^[A-Za-z0-9_.:-]{1,128}$/
const MAX_SECTIONS = 10
const MAX_ITEMS = 60

type Obj = Record<string, unknown>
const isObj = (value: unknown): value is Obj => typeof value === 'object' && value !== null && !Array.isArray(value)
const text = (value: unknown, max: number) => (typeof value === 'string' && value.trim() ? value.slice(0, max) : undefined)

/** Search type filter ('movie'|'series'|'album'|'video'|'') to the value sent to plugins; null means plugin search is skipped. */
export function pluginSearchType(type: string): string | undefined | null {
  if (type === 'video') return null
  return type === 'movie' || type === 'series' || type === 'album' ? type : undefined
}

function sanitizeItem(raw: unknown): PluginSearchItem | null {
  if (!isObj(raw)) return null
  const title = text(raw.title, 200)
  const page = typeof raw.page === 'string' && ID_PATTERN.test(raw.page) ? raw.page : undefined
  if (!title || !page) return null
  const query: Record<string, string> = {}
  if (isObj(raw.query)) {
    for (const [key, value] of Object.entries(raw.query).slice(0, 20)) {
      if (ID_PATTERN.test(key) && key !== '__proto__' && (typeof value === 'string' || typeof value === 'number')) query[key] = String(value).slice(0, 1000)
    }
  }
  const poster = typeof raw.poster === 'string' && raw.poster.startsWith('https://') ? safeImageSrc(raw.poster) : undefined
  const badgeText = isObj(raw.badge) ? text(raw.badge.text, 40) : undefined
  const badgeTone = isObj(raw.badge) ? TONES.find((tone) => tone === raw.badge.tone) : undefined
  return {
    title,
    subtitle: text(raw.subtitle, 200),
    poster,
    shape: raw.shape === 'square' ? 'square' : 'poster',
    badge: badgeText ? { text: badgeText, tone: badgeTone ?? 'default' } : undefined,
    page,
    query,
  }
}

/** Validates the untrusted `/plugins/search` response; sections without a valid id, title or items are dropped. */
export function sanitizeSearchSections(raw: unknown): PluginSearchSection[] {
  if (!isObj(raw) || !Array.isArray(raw.sections)) return []
  const sections: PluginSearchSection[] = []
  for (const entry of raw.sections.slice(0, MAX_SECTIONS)) {
    if (!isObj(entry) || typeof entry.pluginId !== 'string' || !ID_PATTERN.test(entry.pluginId)) continue
    const title = text(entry.title, 200)
    const items = Array.isArray(entry.items) ? entry.items.slice(0, MAX_ITEMS).flatMap((item) => sanitizeItem(item) ?? []) : []
    if (title && items.length) sections.push({ pluginId: entry.pluginId, title, items })
  }
  return sections
}

export function searchItemRoute(pluginId: string, item: Pick<PluginSearchItem, 'page' | 'query'>) {
  return { path: `/plugins/${encodeURIComponent(pluginId)}/${encodeURIComponent(item.page)}`, query: item.query as LocationQueryRaw }
}
