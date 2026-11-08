import type { App } from 'vue'
import { apiRequest, getAccessToken } from './api/client'

type Kind = 'window-error' | 'unhandled-rejection' | 'vue-error'
type ErrorType = 'Error' | 'TypeError' | 'RangeError' | 'ReferenceError' | 'SyntaxError' | 'URIError' | 'Other'
const names = new Set(['Error', 'TypeError', 'RangeError', 'ReferenceError', 'SyntaxError', 'URIError'])

/** Reports only error categories, never exception messages, stack traces or browser data. */
export function initBrowserLogging(app: App): void {
  const lastSent = new Map<string, number>()
  let lastFailure = 0
  const warnUnavailable = () => {
    if (Date.now() - lastFailure >= 60_000) {
      lastFailure = Date.now()
      console.warn('Flixer Web: browser logging is unavailable.')
    }
  }
  const report = (kind: Kind, error: unknown) => {
    try {
      const name = error instanceof Error ? error.name : ''
      const errorType: ErrorType = names.has(name) ? name as ErrorType : 'Other'
      const key = `${kind}:${errorType}`
      const now = Date.now()
      const last = lastSent.get(key)
      if (!getAccessToken() || (last !== undefined && now - last < 10_000)) return
      lastSent.set(key, now)
      void apiRequest({ method: 'POST', url: '/logs/web', data: { kind, errorType }, timeout: 5000 }).catch(warnUnavailable)
    } catch {
      warnUnavailable()
    }
  }
  window.addEventListener('error', (event) => report('window-error', event.error))
  window.addEventListener('unhandledrejection', (event) => report('unhandled-rejection', event.reason))
  const previous = app.config.errorHandler
  app.config.errorHandler = (error, instance, info) => {
    report('vue-error', error)
    if (previous) previous(error, instance, info)
    else console.error(error)
  }
}
