import type {
  AlertTone,
  BadgeTone,
  ButtonVariant,
  FieldOption,
  FieldType,
  ImageAspect,
  PluginAction,
  PluginActionResponse,
  PluginBadge,
  PluginField,
  PluginImage,
  PluginNav,
  PluginPageResponse,
  PluginToast,
  TableCell,
  TableColumn,
  TableRow,
  TabDef,
  Tone,
  ViewNode,
} from './viewTypes'

export const MAX_DEPTH = 12
export const MAX_NODES = 2000
export const MAX_TEXT = 4000
export const MAX_LABEL = 200
export const MAX_URL = 2048
export const MAX_VALUE = 1000
export const MAX_TEXTAREA = 20000

const MAX_CHILDREN = 500
const MAX_ITEMS = 200
const MAX_ROWS = 500
const MAX_COLUMNS = 50
const MAX_QUERY_ENTRIES = 20
const MAX_BODY_DEPTH = 6

const KEY_PATTERN = /^[A-Za-z0-9_.:-]{1,64}$/
const OP_PATTERN = /^[A-Za-z0-9_.:-]{1,128}$/

const TONES: readonly Tone[] = ['default', 'muted', 'danger', 'success', 'warning']
const BADGE_TONES: readonly BadgeTone[] = ['default', 'success', 'warning', 'danger', 'info']
const ALERT_TONES: readonly AlertTone[] = ['info', 'warning', 'danger', 'success']
const ASPECTS: readonly ImageAspect[] = ['poster', 'square', 'wide']
const BUTTON_VARIANTS: readonly ButtonVariant[] = ['primary', 'quiet', 'danger']
const SUBMIT_VARIANTS = ['primary', 'quiet'] as const
const FIELD_TYPES: readonly FieldType[] = ['text', 'password', 'number', 'checkbox', 'select', 'textarea', 'switch', 'hidden']
const ALIGNS = ['start', 'center', 'end', 'between'] as const
const DIRECTIONS = ['column', 'row'] as const
const SIZES = ['sm', 'md'] as const
const LAYOUTS = ['column', 'inline'] as const

interface Budget {
  nodes: number
}

type Obj = Record<string, unknown>

function isObj(value: unknown): value is Obj {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function str(value: unknown, max: number): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value).slice(0, max)
  return typeof value === 'string' ? value.slice(0, max) : undefined
}

function num(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function bool(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : undefined
}

function safeKey(value: unknown): string | undefined {
  return typeof value === 'string' && KEY_PATTERN.test(value) && value !== '__proto__' ? value : undefined
}

function keyList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  return value.slice(0, MAX_ITEMS).flatMap((entry) => safeKey(entry) ?? [])
}

/** Only absolute http(s) URLs are allowed; everything else (javascript:, data:, relative, ...) is rejected. */
export function safeImageSrc(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length > MAX_URL) return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? value : undefined
  } catch {
    return undefined
  }
}

function sanitizeJson(value: unknown, depth = 0): unknown {
  if (value === null || typeof value === 'boolean') return value
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') return value.slice(0, 10000)
  if (depth >= MAX_BODY_DEPTH) return null
  if (Array.isArray(value)) return value.slice(0, MAX_ITEMS).map((entry) => sanitizeJson(entry, depth + 1))
  if (isObj(value)) {
    const result: Obj = {}
    for (const [key, entry] of Object.entries(value).slice(0, MAX_ITEMS)) {
      if (key !== '__proto__' && key.length <= 128) result[key] = sanitizeJson(entry, depth + 1)
    }
    return result
  }
  return null
}

export function sanitizeNav(raw: unknown): PluginNav | undefined {
  if (!isObj(raw) || !isObj(raw.query)) return undefined
  const query: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw.query).slice(0, MAX_QUERY_ENTRIES)) {
    const safe = safeKey(key)
    const text = typeof value === 'boolean' ? String(value) : str(value, MAX_VALUE)
    if (safe && text !== undefined) query[safe] = text
  }
  return { query, merge: raw.merge === true }
}

export function sanitizeAction(raw: unknown): PluginAction | undefined {
  if (!isObj(raw) || typeof raw.op !== 'string' || !OP_PATTERN.test(raw.op)) return undefined
  const action: PluginAction = { op: raw.op }
  if (isObj(raw.body)) action.body = sanitizeJson(raw.body) as Record<string, unknown>
  const navigate = sanitizeNav(raw.navigate)
  if (navigate) action.navigate = navigate
  if (raw.reload === true) action.reload = true
  const confirm = str(raw.confirm, MAX_LABEL * 2)
  if (confirm) action.confirm = confirm
  return action
}

function sanitizeImage(raw: unknown): PluginImage | undefined {
  if (!isObj(raw)) return undefined
  const src = safeImageSrc(raw.src)
  if (!src) return undefined
  return { src, alt: str(raw.alt, MAX_LABEL) ?? '', aspect: oneOf(raw.aspect, ASPECTS) }
}

function sanitizeBadges(raw: unknown): PluginBadge[] | undefined {
  if (!Array.isArray(raw)) return undefined
  return raw.slice(0, 20).flatMap((entry) => {
    const text = isObj(entry) ? str(entry.text, MAX_LABEL) : undefined
    return text === undefined || !isObj(entry) ? [] : [{ text, tone: oneOf(entry.tone, BADGE_TONES) }]
  })
}

function sanitizeOptions(raw: unknown): FieldOption[] {
  if (!Array.isArray(raw)) return []
  return raw.slice(0, MAX_ITEMS).flatMap((entry) => {
    if (!isObj(entry)) return []
    const value = str(entry.value, MAX_VALUE)
    if (value === undefined) return []
    return [{ value, label: str(entry.label, MAX_LABEL) ?? value }]
  })
}

function sanitizeField(raw: unknown): PluginField | undefined {
  if (!isObj(raw)) return undefined
  const name = safeKey(raw.name)
  const type = oneOf(raw.type, FIELD_TYPES)
  if (!name || !type) return undefined
  const field: PluginField = {
    name,
    type,
    label: str(raw.label, MAX_LABEL),
    placeholder: str(raw.placeholder, MAX_LABEL),
    help: str(raw.help, MAX_TEXT),
    required: bool(raw.required),
    disabled: bool(raw.disabled),
    min: num(raw.min),
    max: num(raw.max),
  }
  // Password fields are never prefilled.
  if (type !== 'password') {
    const value = typeof raw.value === 'boolean' ? raw.value : typeof raw.value === 'number' ? num(raw.value) : str(raw.value, type === 'textarea' ? MAX_TEXTAREA : MAX_VALUE)
    if (value !== undefined) field.value = value
  }
  if (type === 'password' && raw.hasValue === true) field.hasValue = true
  if (type === 'select') field.options = sanitizeOptions(raw.options)
  return field
}

function sanitizeChildren(raw: unknown, depth: number, budget: Budget): ViewNode[] {
  if (!Array.isArray(raw)) return []
  const children: ViewNode[] = []
  for (const entry of raw.slice(0, MAX_CHILDREN)) {
    const node = sanitizeNode(entry, depth, budget)
    if (node) children.push(node)
  }
  return children
}

function sanitizeCell(raw: unknown, depth: number, budget: Budget): TableCell | undefined {
  if (raw === null) return null
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null
  if (typeof raw === 'string') return raw.slice(0, MAX_TEXT)
  if (isObj(raw)) return sanitizeNode(raw, depth, budget) ?? undefined
  return undefined
}

function sanitizeRows(raw: unknown, columns: TableColumn[], depth: number, budget: Budget): TableRow[] {
  if (!Array.isArray(raw)) return []
  const known = new Set(columns.map((column) => column.key))
  const rows: TableRow[] = []
  for (const entry of raw.slice(0, MAX_ROWS)) {
    if (!isObj(entry) || !isObj(entry.cells)) continue
    const cells: Record<string, TableCell> = {}
    for (const [key, value] of Object.entries(entry.cells)) {
      if (!known.has(key) || key === '__proto__') continue
      const cell = sanitizeCell(value, depth, budget)
      if (cell !== undefined) cells[key] = cell
    }
    rows.push({ key: str(entry.key, MAX_VALUE), cells })
  }
  return rows
}

function sanitizeNode(raw: unknown, depth: number, budget: Budget): ViewNode | null {
  if (!isObj(raw) || typeof raw.type !== 'string') return null
  if (depth > MAX_DEPTH || budget.nodes >= MAX_NODES) return null
  budget.nodes += 1
  const next = depth + 1

  switch (raw.type) {
    case 'stack': {
      const gap = num(raw.gap)
      return {
        type: 'stack',
        direction: oneOf(raw.direction, DIRECTIONS),
        gap: gap === undefined ? undefined : Math.min(8, Math.max(1, Math.round(gap))),
        wrap: bool(raw.wrap),
        align: oneOf(raw.align, ALIGNS),
        children: sanitizeChildren(raw.children, next, budget),
      }
    }
    case 'heading': {
      const text = str(raw.text, MAX_LABEL * 2)
      if (text === undefined) return null
      const level = num(raw.level)
      return { type: 'heading', text, level: level === 1 || level === 2 || level === 3 ? level : undefined }
    }
    case 'text': {
      const text = str(raw.text, MAX_TEXT)
      return text === undefined ? null : { type: 'text', text, tone: oneOf(raw.tone, TONES), size: oneOf(raw.size, SIZES) }
    }
    case 'badge': {
      const text = str(raw.text, MAX_LABEL)
      return text === undefined ? null : { type: 'badge', text, tone: oneOf(raw.tone, BADGE_TONES) }
    }
    case 'image': {
      const image = sanitizeImage(raw)
      return image ? { type: 'image', ...image } : null
    }
    case 'grid': {
      const minWidth = num(raw.minWidth)
      return { type: 'grid', minWidth: minWidth === undefined ? undefined : Math.min(640, Math.max(80, Math.round(minWidth))), children: sanitizeChildren(raw.children, next, budget) }
    }
    case 'card': {
      return {
        type: 'card',
        title: str(raw.title, MAX_LABEL * 2),
        subtitle: str(raw.subtitle, MAX_TEXT),
        image: sanitizeImage(raw.image),
        badges: sanitizeBadges(raw.badges),
        to: sanitizeNav(raw.to),
        children: sanitizeChildren(raw.children, next, budget),
        actions: sanitizeChildren(raw.actions, next, budget),
      }
    }
    case 'section':
      return {
        type: 'section',
        title: str(raw.title, MAX_LABEL * 2),
        description: str(raw.description, MAX_TEXT),
        actions: sanitizeChildren(raw.actions, next, budget),
        children: sanitizeChildren(raw.children, next, budget),
      }
    case 'tabs': {
      const param = safeKey(raw.param)
      if (!param || !Array.isArray(raw.tabs)) return null
      const tabs: TabDef[] = []
      for (const entry of raw.tabs.slice(0, MAX_ITEMS)) {
        const id = isObj(entry) ? str(entry.id, MAX_VALUE) : undefined
        if (!isObj(entry) || !id) continue
        tabs.push({ id, label: str(entry.label, MAX_LABEL) ?? id, children: sanitizeChildren(entry.children, next, budget) })
      }
      return { type: 'tabs', param, tabs, reset: keyList(raw.reset) }
    }
    case 'table': {
      const columns: TableColumn[] = Array.isArray(raw.columns)
        ? raw.columns.slice(0, MAX_COLUMNS).flatMap((entry) => {
            const key = isObj(entry) ? safeKey(entry.key) : undefined
            return key && isObj(entry) ? [{ key, label: str(entry.label, MAX_LABEL) ?? key }] : []
          })
        : []
      return { type: 'table', columns, rows: sanitizeRows(raw.rows, columns, next, budget), emptyText: str(raw.emptyText, MAX_TEXT) }
    }
    case 'form': {
      const submit = isObj(raw.submit) ? raw.submit : undefined
      const label = submit ? str(submit.label, MAX_LABEL) : undefined
      const action = submit ? sanitizeAction(submit.action) : undefined
      if (!submit || label === undefined || !action) return null
      const fields = Array.isArray(raw.fields) ? raw.fields.slice(0, MAX_ITEMS).flatMap((entry) => sanitizeField(entry) ?? []) : []
      return { type: 'form', fields, submit: { label, action, variant: oneOf(submit.variant, SUBMIT_VARIANTS) }, layout: oneOf(raw.layout, LAYOUTS) }
    }
    case 'button': {
      const label = str(raw.label, MAX_LABEL)
      const action = sanitizeAction(raw.action)
      if (label === undefined || !action) return null
      return { type: 'button', label, action, variant: oneOf(raw.variant, BUTTON_VARIANTS), confirm: str(raw.confirm, MAX_LABEL * 2), disabled: bool(raw.disabled) }
    }
    case 'link': {
      const label = str(raw.label, MAX_LABEL)
      const to = sanitizeNav(raw.to)
      return label === undefined || !to ? null : { type: 'link', label, to }
    }
    case 'divider':
      return { type: 'divider' }
    case 'empty': {
      const text = str(raw.text, MAX_TEXT)
      return text === undefined ? null : { type: 'empty', text }
    }
    case 'alert': {
      const text = str(raw.text, MAX_TEXT)
      return text === undefined ? null : { type: 'alert', text, tone: oneOf(raw.tone, ALERT_TONES) }
    }
    case 'pager': {
      const param = safeKey(raw.param)
      const page = num(raw.page)
      const pageSize = num(raw.pageSize)
      const total = num(raw.total)
      if (!param || page === undefined || pageSize === undefined || total === undefined) return null
      return { type: 'pager', param, page: Math.max(1, Math.floor(page)), pageSize: Math.max(1, Math.floor(pageSize)), total: Math.max(0, Math.floor(total)) }
    }
    case 'searchbox': {
      const param = safeKey(raw.param)
      return param ? { type: 'searchbox', param, value: str(raw.value, MAX_VALUE), placeholder: str(raw.placeholder, MAX_LABEL), reset: keyList(raw.reset) } : null
    }
    case 'chips': {
      const param = safeKey(raw.param)
      return param ? { type: 'chips', param, options: sanitizeOptions(raw.options), value: str(raw.value, MAX_VALUE), reset: keyList(raw.reset) } : null
    }
    default:
      return null
  }
}

/** Validates an untrusted view tree; unknown or malformed nodes are dropped and the depth/node budgets are enforced. */
export function sanitizeView(raw: unknown): ViewNode | null {
  return sanitizeNode(raw, 1, { nodes: 0 })
}

export function sanitizePageResponse(raw: unknown): PluginPageResponse | null {
  if (!isObj(raw)) return null
  const view = sanitizeView(raw.view)
  return view ? { title: str(raw.title, MAX_LABEL * 2), view } : null
}

export function sanitizeActionResponse(raw: unknown): PluginActionResponse {
  if (!isObj(raw)) return {}
  const response: PluginActionResponse = {}
  if (isObj(raw.toast)) {
    const text = str(raw.toast.text, MAX_TEXT)
    if (text) {
      const toast: PluginToast = { text }
      const tone = oneOf(raw.toast.tone, BADGE_TONES)
      if (tone) toast.tone = tone
      response.toast = toast
    }
  }
  const navigate = sanitizeNav(raw.navigate)
  if (navigate) response.navigate = navigate
  if (raw.reload === true) response.reload = true
  const error = str(raw.error, MAX_TEXT)
  if (error) response.error = error
  return response
}
