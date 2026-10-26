import type { LocationQuery } from 'vue-router'
import type { PluginAction, PluginActionResponse, PluginField, PluginNav, PluginToast } from './viewTypes'

export type PageQuery = Record<string, string>

/** Flattens the router query to string:string, taking the first value of repeated params. */
export function queryFromRoute(query: LocationQuery): PageQuery {
  const result: PageQuery = {}
  for (const [key, value] of Object.entries(query)) {
    const first = Array.isArray(value) ? value[0] : value
    if (typeof first === 'string') result[key] = first
  }
  return result
}

/** Overlays `patch` on `current`; empty values and `reset` keys are removed. */
export function applyQuery(current: PageQuery, patch: PageQuery, reset: readonly string[] = []): PageQuery {
  const result: PageQuery = { ...current }
  for (const key of reset) delete result[key]
  for (const [key, value] of Object.entries(patch)) {
    if (value === '') delete result[key]
    else result[key] = value
  }
  return result
}

export function resolveNav(current: PageQuery, nav: PluginNav): PageQuery {
  return applyQuery(nav.merge ? current : {}, nav.query)
}

export function activeTab(tabs: readonly { id: string }[], query: PageQuery, param: string): string | undefined {
  const requested = query[param]
  return tabs.find((tab) => tab.id === requested)?.id ?? tabs[0]?.id
}

export function pagerState(page: number, pageSize: number, total: number) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(page, pages)
  const first = total === 0 ? 0 : (current - 1) * pageSize + 1
  return { pages, current, first, last: Math.min(total, current * pageSize), hasPrev: current > 1, hasNext: current < pages }
}

/** Builds the field values a form submits: numbers are coerced, checkboxes are booleans. */
export function coerceFormValues(fields: readonly PluginField[], raw: Record<string, unknown>): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  for (const field of fields) {
    const value = raw[field.name]
    if (field.type === 'checkbox') {
      values[field.name] = value === true
    } else if (field.type === 'number') {
      const parsed = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN
      values[field.name] = Number.isFinite(parsed) ? parsed : null
    } else {
      values[field.name] = typeof value === 'string' ? value : value == null ? '' : String(value)
    }
  }
  return values
}

export function initialFormValues(fields: readonly PluginField[]): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  for (const field of fields) {
    if (field.type === 'checkbox') values[field.name] = field.value === true
    else if (field.type === 'password') values[field.name] = ''
    else values[field.name] = field.value ?? (field.type === 'select' ? (field.options?.[0]?.value ?? '') : '')
  }
  return values
}

export function buildActionBody(action: PluginAction, values: Record<string, unknown> = {}): Record<string, unknown> {
  return { ...action.body, ...values }
}

export interface ActionOutcome {
  error?: string
  toast?: PluginToast
  navigate?: PluginNav
  reload: boolean
}

/** Decides what happens after a successful action call: response navigate wins over action navigate, which wins over reload. */
export function planActionOutcome(action: PluginAction, response: PluginActionResponse): ActionOutcome {
  if (response.error) return { error: response.error, reload: false }
  const navigate = response.navigate ?? action.navigate
  return { toast: response.toast, navigate, reload: !navigate && (response.reload === true || action.reload === true) }
}

export function toastKind(tone: PluginToast['tone']): 'success' | 'error' | 'info' {
  return tone === 'success' ? 'success' : tone === 'danger' ? 'error' : 'info'
}
