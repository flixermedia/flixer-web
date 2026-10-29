import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const platform = vi.hoisted(() => ({ native: false, storage: new Map<string, string>() }))

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => platform.native },
}))

describe('native server URL', () => {
  beforeEach(() => {
    platform.native = false
    platform.storage.clear()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => platform.storage.get(key) ?? null,
      setItem: (key: string, value: string) => platform.storage.set(key, value),
      removeItem: (key: string) => platform.storage.delete(key),
      clear: () => platform.storage.clear(),
    })
    vi.stubGlobal('window', { location: { origin: 'https://dev.flixer.test' } })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('normalizes the server address and removes an optional API suffix', async () => {
    const { normalizeNativeServerUrl } = await import('./serverConnection')
    expect(normalizeNativeServerUrl(' https://flixer.example.com/api/ ')).toBe('https://flixer.example.com')
    expect(normalizeNativeServerUrl('https://flixer.example.com/flixer/')).toBe('https://flixer.example.com/flixer')
  })

  it('requires an HTTPS server URL without credentials or query parameters', async () => {
    const { normalizeNativeServerUrl } = await import('./serverConnection')
    for (const value of ['flixer.example.com', 'http://flixer.example.com', 'https://user:pass@flixer.example.com', 'https://flixer.example.com/?token=secret']) {
      expect(() => normalizeNativeServerUrl(value)).toThrow('invalid')
    }
  })

  it('builds a WebSocket URL from the configured API base', async () => {
    vi.stubEnv('DEV', false)
    vi.stubEnv('VITE_API_BASE_URL', 'https://flixer.example.com/custom/api/')
    const { buildApiWebSocketUrl } = await import('./serverConnection')
    expect(buildApiWebSocketUrl('/live')).toBe('wss://flixer.example.com/custom/api/live')
  })

  it('uses the saved server for native API, stream, and WebSocket requests', async () => {
    vi.stubEnv('DEV', false)
    platform.native = true
    const { buildApiWebSocketUrl, getApiBaseUrl, resolveServerResourceUrl, saveNativeServerUrl } = await import('./serverConnection')
    saveNativeServerUrl('https://flixer.example.com')
    expect(getApiBaseUrl()).toBe('https://flixer.example.com/api')
    expect(resolveServerResourceUrl('/stream/token')).toBe('https://flixer.example.com/stream/token')
    expect(buildApiWebSocketUrl('/live')).toBe('wss://flixer.example.com/api/live')
  })

  it('routes native development API and streamer requests through the same-origin Vite proxy', async () => {
    vi.stubEnv('DEV', true)
    platform.native = true
    const { getApiBaseUrl, resolveServerResourceUrl } = await import('./serverConnection')
    expect(getApiBaseUrl()).toBe('/api')
    const streamUrl = new URL(resolveServerResourceUrl('https://flixer.example.com/stream/token?quality=high'))
    expect(streamUrl.origin).toBe(window.location.origin)
    expect(`${streamUrl.pathname}${streamUrl.search}`).toBe('/stream/token?quality=high')
  })

  it('uses relative streamer paths for browser development', async () => {
    vi.stubEnv('DEV', true)
    const { resolveServerResourceUrl } = await import('./serverConnection')
    expect(resolveServerResourceUrl('https://flixer.example.com/stream/token')).toBe('/stream/token')
  })
})
