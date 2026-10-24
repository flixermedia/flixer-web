import * as Sentry from '@sentry/vue'
import type { App } from 'vue'

const FETCH_TIMEOUT_MS = 60_000
const RETRY_DELAY_MS = 2_000
const REQUEST_TIMEOUT_MS = 5_000

interface SentryConfig {
  enabled: boolean
  dsn: string | null
}

async function fetchConfig(): Promise<SentryConfig | null> {
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '')
  const deadline = Date.now() + FETCH_TIMEOUT_MS
  const attempt = async (): Promise<SentryConfig | null> => {
    try {
      const response = await fetch(`${baseUrl}/sentry/config/web`, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
      if (response.ok) return (await response.json()) as SentryConfig
    } catch {
      // flixer is unreachable; retry until the deadline.
    }
    if (Date.now() + RETRY_DELAY_MS >= deadline) return null
    return new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS)).then(attempt)
  }
  return attempt()
}

/**
 * Starts Sentry when flixer says it is enabled. Waits up to 60 seconds for flixer in the
 * background, so the app is never blocked from starting; if flixer cannot be reached
 * Sentry simply stays disabled.
 */
export async function initMonitoring(app: App): Promise<void> {
  const config = await fetchConfig()
  if (!config?.enabled || !config.dsn) return
  Sentry.init({
    app,
    dsn: config.dsn,
    environment: import.meta.env.MODE,
    // Errors the app catches and only logs would otherwise never reach Sentry.
    // integrations: [Sentry.captureConsoleIntegration({ levels: ['error'] })],
  })
}
