import { Capacitor } from '@capacitor/core'

export const NATIVE_SERVER_URL_KEY = 'flixer.nativeServerUrl'

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform()
}

export function getNativeServerUrl(): string {
  return localStorage.getItem(NATIVE_SERVER_URL_KEY) ?? ''
}

export function normalizeNativeServerUrl(value: string): string {
  let url: URL
  try {
    url = new URL(value.trim())
  } catch {
    throw new Error('invalid')
  }
  if (url.protocol !== 'https:' || !url.hostname || url.username || url.password || url.search || url.hash) {
    throw new Error('invalid')
  }
  let pathname = url.pathname.replace(/\/+$/, '')
  if (pathname.endsWith('/api')) pathname = pathname.slice(0, -4)
  return `${url.origin}${pathname}`
}

export function saveNativeServerUrl(value: string): boolean {
  const normalized = normalizeNativeServerUrl(value)
  const changed = normalized !== getNativeServerUrl()
  localStorage.setItem(NATIVE_SERVER_URL_KEY, normalized)
  return changed
}

export function forgetNativeServerUrl(): void {
  localStorage.removeItem(NATIVE_SERVER_URL_KEY)
}

export function getApiBaseUrl(): string {
  if (isNativeApp()) {
    const serverUrl = getNativeServerUrl()
    return serverUrl ? `${serverUrl}/api` : '/api'
  }
  return import.meta.env.VITE_API_BASE_URL || '/api'
}

export function resolveServerResourceUrl(path: string): string {
  if (!isNativeApp() || /^https?:\/\//i.test(path)) return path
  const serverUrl = getNativeServerUrl()
  if (!serverUrl) return path
  return `${serverUrl}/${path.replace(/^\/+/, '')}`
}

export function buildApiWebSocketUrl(path: string): string {
  const base = getApiBaseUrl()
  const baseUrl = /^https?:\/\//i.test(base) ? new URL(base) : new URL(base, window.location.origin)
  baseUrl.pathname = `${baseUrl.pathname.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
  baseUrl.protocol = baseUrl.protocol === 'https:' ? 'wss:' : 'ws:'
  return baseUrl.toString()
}
