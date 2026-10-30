/** Shared HTTP transport, generated API dispatch, and session handling. */

import axios, { type AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { createFlixerApiClient } from '@flixermedia/flixer-api-client'
import { forgetNativeServerUrl, getApiBaseUrl, saveNativeServerUrl } from '../platform/serverConnection'

export const ACCESS_TOKEN_KEY = 'flixer.accessToken'
export const AUTH_INVALID_EVENT = 'flixer:auth-invalid'
export const AUTH_TOKEN_CHANGED_EVENT = 'flixer:auth-token-changed'

/** These flows can return 401 intentionally without invalidating the signed-in session. */
const AUTH_INVALID_EXEMPT_URLS = ['/auth/login', '/auth/me/password', '/auth/me/delete', '/sentry/config/web', '/second-factor/', '/native-handoff/', '/passkeys/register/options', '/passkeys/register/verify'] as const

const PASSKEY_DELETE_URL = /\/passkeys\/[^/]+\/delete$/

const apiTransport = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
})
const generatedApi = createFlixerApiClient(apiTransport)

/** Sends API calls that may not yet exist in the installed generated client version. */
export function apiRequest<T = unknown>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  return apiTransport.request<T>(config)
}

// Route requests through Orval while preserving the Axios instance's defaults and interceptors.
export const api = new Proxy(apiTransport, {
  get(_target, property) {
    switch (property) {
      case 'get':
        return generatedApi.get
      case 'delete':
        return generatedApi.delete
      case 'head':
        return generatedApi.head
      case 'options':
        return generatedApi.options
      case 'post':
        return generatedApi.post
      case 'put':
        return generatedApi.put
      case 'patch':
        return generatedApi.patch
      case 'request':
        return generatedApi.request
      default:
        return Reflect.get(apiTransport, property, apiTransport)
    }
  },
  set(_target, property, value) {
    return Reflect.set(apiTransport, property, value, apiTransport)
  },
})

export function configureNativeServer(serverUrl: string): boolean {
  const changed = saveNativeServerUrl(serverUrl)
  api.defaults.baseURL = getApiBaseUrl()
  if (changed) clearAccessToken()
  return changed
}

export function disconnectNativeServer(): void {
  forgetNativeServerUrl()
  api.defaults.baseURL = getApiBaseUrl()
  clearAccessToken()
}

export function getAccessToken(): string | null {
  // sessionStorage is wiped when the PWA is force-closed, so the token is persisted in localStorage.
  const stored = localStorage.getItem(ACCESS_TOKEN_KEY)
  if (stored) return stored
  const legacy = sessionStorage.getItem(ACCESS_TOKEN_KEY)
  if (legacy) {
    localStorage.setItem(ACCESS_TOKEN_KEY, legacy)
    sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  }
  return legacy
}

export function saveAccessToken(accessToken: string): void {
  const previous = getAccessToken()
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  if (previous !== accessToken) window.dispatchEvent(new Event(AUTH_TOKEN_CHANGED_EVENT))
}

export function clearAccessToken(): void {
  const hadToken = localStorage.getItem(ACCESS_TOKEN_KEY) !== null || sessionStorage.getItem(ACCESS_TOKEN_KEY) !== null
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  if (hadToken) window.dispatchEvent(new Event(AUTH_TOKEN_CHANGED_EVENT))
}

function shouldInvalidateSession(error: AxiosError): boolean {
  if (error.response?.status !== 401) return false

  const url = error.config?.url ?? ''
  const isExpectedUnauthorized = AUTH_INVALID_EXEMPT_URLS.some((path) => url.includes(path))
  const isPasskeyDelete = PASSKEY_DELETE_URL.test(url)
  const isPasskeyRequirementUpdate = url.includes('/auth/me/passkey-required') && error.config?.method === 'patch'

  return !isExpectedUnauthorized && !isPasskeyDelete && !isPasskeyRequirementUpdate
}

api.interceptors.request.use((config) => {
  const accessToken = getAccessToken()
  if (accessToken && !config.url?.includes('/sentry/config/web')) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && shouldInvalidateSession(error)) {
      clearAccessToken()
      if (!error.config?.url?.includes('/auth/sessions')) {
        window.dispatchEvent(new Event(AUTH_INVALID_EVENT))
      }
    }
    return Promise.reject(error)
  },
)
