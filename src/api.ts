import { startAuthentication, startRegistration, type PublicKeyCredentialCreationOptionsJSON, type PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/browser'
import axios from 'axios'

export const ACCESS_TOKEN_KEY = 'flixer.accessToken'
export const AUTH_INVALID_EVENT = 'flixer:auth-invalid'

export interface AuthResult {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  session: {
    id: string
    expiresAt: string
  }
  user: {
    id: string
    username: string
    displayName: string
    email: string | null
    role: string
  }
}

export interface AuthSession {
  id: string
  createdAt: string
  expiresAt: string
  current: boolean
}

export interface RegistrationStatus {
  registrationEnabled: boolean
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
})

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
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
}

export function clearAccessToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
}

api.interceptors.request.use((config) => {
  const accessToken = getAccessToken()
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const url = axios.isAxiosError(error) ? error.config?.url : undefined
    if (axios.isAxiosError(error) && error.response?.status === 401 && !url?.includes('/auth/login') && !url?.includes('/auth/me/password') && !url?.includes('/auth/me/delete') && !url?.includes('/second-factor/') && !/\/passkeys\/[^/]+\/delete$/.test(url ?? '') && !url?.includes('/passkeys/register/options') && !url?.includes('/passkeys/register/verify') && !(url?.includes('/auth/me/passkey-required') && error.config?.method === 'patch')) {
      clearAccessToken()
      if (!error.config?.url?.includes('/auth/sessions')) {
        window.dispatchEvent(new Event(AUTH_INVALID_EVENT))
      }
    }
    return Promise.reject(error)
  },
)

export interface UserPreferences {
  language?: string
}

export async function getPreferences(): Promise<UserPreferences> {
  const response = await api.get<UserPreferences>('/preferences')
  return response.data
}

/** Partial update; a `null` value clears that preference. */
export async function updatePreferences(patch: { [K in keyof UserPreferences]: UserPreferences[K] | null }): Promise<UserPreferences> {
  const response = await api.patch<UserPreferences>('/preferences', patch)
  return response.data
}

export interface PasskeyRequired {
  passkeyRequired: true
  ticket: string
}

export async function login(username: string, password: string): Promise<AuthResult | PasskeyRequired> {
  const response = await api.post<AuthResult | PasskeyRequired>('/auth/login', {
    username,
    password,
  })
  return response.data
}

export async function getRegistrationStatus(): Promise<RegistrationStatus> {
  const response = await api.get<RegistrationStatus>('/settings/registration')
  return response.data
}

export interface VerificationPending {
  verificationRequired: true
  email: string
}

export async function register(username: string, password: string, email: string, displayName?: string): Promise<AuthResult | VerificationPending> {
  const response = await api.post<AuthResult | VerificationPending>('/auth/register', {
    username,
    displayName: displayName || undefined,
    email,
    password,
  })
  return response.data
}

export async function verifyEmail(token: string): Promise<void> {
  await api.post('/auth/verify-email', { token })
}

export async function resendVerification(username: string, password: string): Promise<void> {
  await api.post('/auth/resend-verification', { username, password })
}

export async function validateAccessToken(): Promise<boolean> {
  const response = await api.get<AuthSession[]>('/auth/sessions')
  return response.data.some((session) => session.current)
}

export interface UserProfile {
  id: string
  username: string
  displayName: string
  email: string | null
  emailVerified: boolean
  pendingEmail: string | null
  passkeyRequired: boolean
  avatarUrl: string | null
  role: string
  createdAt: string
}

export interface ServerSetting {
  key: string
  value: unknown
  isPublic: boolean
  updatedAt: string
}

export async function getProfile(): Promise<UserProfile> {
  const response = await api.get<UserProfile>('/auth/me')
  return response.data
}

export const MAX_AVATAR_BYTES = 5 * 1024 * 1024
export const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

export function resolveAvatarUrl(avatarUrl: string | null | undefined): string | null {
  return avatarUrl ? `${api.defaults.baseURL ?? ''}${avatarUrl}` : null
}

export async function uploadAvatar(file: File): Promise<UserProfile> {
  const body = new FormData()
  body.append('avatar', file)
  const response = await api.post<UserProfile>('/auth/me/avatar', body, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export async function removeAvatar(): Promise<UserProfile> {
  const response = await api.delete<UserProfile>('/auth/me/avatar')
  return response.data
}

export async function updateProfile(changes: { displayName?: string; email?: string }): Promise<UserProfile> {
  const response = await api.patch<UserProfile>('/auth/me', changes)
  return response.data
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.post('/auth/me/password', { currentPassword, newPassword })
}

export async function deleteAccount(password: string): Promise<void> {
  await api.post('/auth/me/delete', { password })
}

export async function listSettings(): Promise<ServerSetting[]> {
  const response = await api.get<ServerSetting[]>('/settings')
  return response.data
}

export async function updateSetting(key: string, value: unknown): Promise<ServerSetting> {
  const response = await api.put<ServerSetting>(`/settings/${encodeURIComponent(key)}`, { value })
  return response.data
}

export interface Passkey {
  id: string
  name: string
  deviceType: string
  backedUp: boolean
  transports: string[]
  createdAt: string
  lastUsedAt: string | null
}

export async function listPasskeys(): Promise<Passkey[]> {
  const response = await api.get<Passkey[]>('/auth/passkeys')
  return response.data
}

export async function getPasskeyRegistrationOptions(password: string): Promise<PublicKeyCredentialCreationOptionsJSON> {
  const options = await api.post<PublicKeyCredentialCreationOptionsJSON>('/auth/passkeys/register/options', { password })
  return options.data
}

export async function registerPasskey(options: PublicKeyCredentialCreationOptionsJSON, name?: string): Promise<Passkey> {
  console.info('[passkey] registering', { origin: window.location.origin, secureContext: window.isSecureContext, rpId: options.rp.id })
  let attestation
  try {
    attestation = await startRegistration({ optionsJSON: options })
  } catch (error: unknown) {
    console.error('[passkey] registration failed', error)
    throw error
  }
  const response = await api.post<Passkey>('/auth/passkeys/register/verify', { response: attestation, name: name || undefined })
  return response.data
}

export async function loginWithPasskey(): Promise<AuthResult> {
  const options = await api.post<PublicKeyCredentialRequestOptionsJSON>('/auth/passkeys/login/options')
  console.info('[passkey] authenticating', { origin: window.location.origin, secureContext: window.isSecureContext, rpId: options.data.rpId })
  let assertion
  try {
    assertion = await startAuthentication({ optionsJSON: options.data })
  } catch (error: unknown) {
    console.error('[passkey] authentication failed', error)
    throw error
  }
  const response = await api.post<AuthResult>('/auth/passkeys/login/verify', { response: assertion })
  return response.data
}

export async function loginWithPasskeySecondFactor(ticket: string): Promise<AuthResult> {
  const options = await api.post<PublicKeyCredentialRequestOptionsJSON>('/auth/passkeys/second-factor/options', { ticket })
  const assertion = await startAuthentication({ optionsJSON: options.data })
  const response = await api.post<AuthResult>('/auth/passkeys/second-factor/verify', { ticket, response: assertion })
  return response.data
}

export async function setPasskeyRequired(enabled: boolean, password?: string): Promise<UserProfile> {
  const response = await api.patch<UserProfile>('/auth/me/passkey-required', { enabled, password })
  return response.data
}

export async function deletePasskey(passkeyId: string, password: string): Promise<void> {
  await api.post(`/auth/passkeys/${encodeURIComponent(passkeyId)}/delete`, { password })
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
  clearAccessToken()
}

export interface SampleVideo {
  id: string
  title: string
  container: string
  directPlay: boolean
}

export interface PlaybackInfo {
  playSessionId: string
  mediaSource: SampleVideo & { mediaSourceId: string; streamUrl: string }
  expiresAt: string
}

export type PlayMethod = 'DirectPlay' | 'DirectStream' | 'Transcode'

export interface StreamInfo {
  playMethod: PlayMethod
  source: { videoCodec: string; audioCodec?: string; width: number; height: number; durationSeconds: number }
  availableHeights: number[]
}

export function buildStreamUrl(streamUrl: string, options: { height?: number; start?: number } = {}): string {
  const params = new URLSearchParams()
  if (options.height) params.set('height', String(options.height))
  if (options.start && options.start > 0) params.set('start', options.start.toFixed(2))
  const query = params.toString()
  return query ? `${streamUrl}?${query}` : streamUrl
}

export function buildHlsUrl(streamUrl: string, options: { height?: number } = {}): string {
  const base = `${streamUrl.replace('/stream/', '/hls/')}/index.m3u8`
  return options.height ? `${base}?height=${options.height}` : base
}

// Only WebKit plays HLS natively; Chromium browsers fall back to the progressive MP4/WebM stream.
export function supportsNativeHls(): boolean {
  if (typeof document === 'undefined') return false
  const canPlay = document.createElement('video').canPlayType('application/vnd.apple.mpegurl')
  return canPlay !== '' && !/Chrome|Chromium|Edg\//.test(navigator.userAgent)
}

// The streamer is reached through the same-origin proxy (/stream, /info), not the Flixer API; the token in the URL is the credential.
export async function getStreamInfo(streamUrl: string, options: { height?: number; start?: number } = {}): Promise<StreamInfo> {
  const url = buildStreamUrl(streamUrl.replace('/stream/', '/info/'), options)
  const response = await axios.get<StreamInfo>(url, { timeout: 20_000 })
  return response.data
}

export async function listSampleVideos(): Promise<SampleVideo[]> {
  const response = await api.get<SampleVideo[]>('/playback/samples')
  return response.data
}

export async function getSamplePlaybackInfo(id: string): Promise<PlaybackInfo> {
  const response = await api.post<PlaybackInfo>(`/playback/samples/${encodeURIComponent(id)}/playback-info`)
  return response.data
}

export interface StreamSession {
  id: string
  userId?: string
  user: { username: string; displayName: string } | null
  mediaItemId?: string
  file: string
  delivery: 'progressive' | 'hls'
  remoteAddr?: string
  userAgent?: string
  source: { videoCodec: string; audioCodec?: string; width: number; height: number; durationSeconds: number }
  mode: PlayMethod
  height: number
  positionSeconds: number
  startedAt: string
  lastActivityAt: string
  bytesSent: number
  running: boolean
  pid?: number
}

export interface StreamSessionList {
  transcodingAvailable: boolean
  maxTranscodes: number
  activeTranscodes: number
  sessions: StreamSession[]
}

export async function listStreamSessions(): Promise<StreamSessionList> {
  const response = await api.get<StreamSessionList>('/admin/streams')
  return response.data
}

export async function cancelStreamSession(id: string): Promise<void> {
  await api.delete(`/admin/streams/${encodeURIComponent(id)}`)
}
