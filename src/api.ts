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
  serverName: string
  loginBanner: string
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
  /** Order of the admin dashboard panels. */
  adminDashboardGrid?: Array<{ id: string; x: number; y: number; w: number; h: number }>
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

export async function sendTestEmail(): Promise<{ sentTo: string }> {
  const response = await api.post<{ sentTo: string }>('/settings/email/test')
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

export type SegmentType = 'intro' | 'recap' | 'credits' | 'preview' | 'commercial'

export interface PlayerChapter {
  title: string
  startMs: number
  endMs: number
}

export interface PlayerSegment {
  type: SegmentType
  startMs: number
  endMs: number
  source: 'manual' | 'skipme' | 'chapter'
}

export interface NextEpisode {
  id: string
  title: string
  seasonNumber: number | null
  episodeNumber: number | null
}

export interface PlaybackInfo {
  playSessionId: string
  mediaSource: SampleVideo & { mediaSourceId: string; streamUrl: string }
  expiresAt: string
  /** Only present when playing an indexed library item. */
  chapters?: PlayerChapter[]
  segments?: PlayerSegment[]
  /** The episode after this one, across seasons; null for the last episode. */
  nextEpisode?: NextEpisode | null
}

export type PlayMethod = 'DirectPlay' | 'DirectStream' | 'Transcode'

export interface StreamInfo {
  playMethod: PlayMethod
  source: { videoCodec: string; audioCodec?: string; width: number; height: number; durationSeconds: number }
  availableHeights: number[]
  /** Where a stream-copy stream requested at `start` really begins (the preceding keyframe). */
  keyframeStart?: number
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

export async function getItemPlaybackInfo(id: string): Promise<PlaybackInfo> {
  const response = await api.post<PlaybackInfo>(`/playback/items/${encodeURIComponent(id)}/playback-info`)
  return response.data
}

export interface PlayerSubtitle {
  id: string
  language: string
  label?: string
}

/** Subtitle files beside the video, listed by the streamer for a stream token. Empty when there are none. */
export async function getSubtitleTracks(streamUrl: string): Promise<PlayerSubtitle[]> {
  try {
    const response = await axios.get<{ tracks: PlayerSubtitle[] }>(streamUrl.replace('/stream/', '/subtitles/'), { timeout: 20_000 })
    return response.data.tracks ?? []
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return []
    throw error
  }
}

/** How the streamer's hover-preview sheets are laid out; see `/trickplay/{token}/index.json`. */
export interface TrickplayManifest {
  intervalMs: number
  thumbWidth: number
  thumbHeight: number
  columns: number
  rows: number
  count: number
  sheets: number
}

export interface Trickplay {
  manifest: TrickplayManifest
  sheetUrl: (sheet: number) => string
}

/** Hover-preview thumbnails for a video, or null when none have been generated for it yet. */
export async function getTrickplay(streamUrl: string): Promise<Trickplay | null> {
  const base = streamUrl.replace('/stream/', '/trickplay/')
  try {
    const response = await axios.get<TrickplayManifest>(`${base}/index.json`, { timeout: 10_000 })
    const manifest = response.data
    if (!manifest || manifest.count <= 0 || manifest.intervalMs <= 0 || manifest.columns <= 0 || manifest.rows <= 0) return null
    return { manifest, sheetUrl: (sheet) => `${base}/${sheet}.jpg` }
  } catch {
    return null
  }
}

/** WebVTT text for one subtitle file. */
export async function getSubtitleText(streamUrl: string, id: string): Promise<string> {
  const response = await axios.get<string>(streamUrl.replace('/stream/', '/subtitles/'), {
    params: { file: id },
    responseType: 'text',
    transformResponse: (data: string) => data,
    timeout: 20_000,
  })
  return response.data
}

/** Raw LRC text for a track's stream token, or null when the track has no lyrics file. */
export async function getTrackLyrics(streamUrl: string): Promise<string | null> {
  try {
    const response = await axios.get<string>(streamUrl.replace('/stream/', '/lyrics/'), { responseType: 'text', transformResponse: (data: string) => data, timeout: 20_000 })
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null
    throw error
  }
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

export interface AdminOverview {
  counts: { movies: number; series: number; episodes: number; albums: number; tracks: number; users: number }
  libraries: Array<{ id: string; name: string; type: string; items: number; sizeBytes: number }>
  storage: { usedBytes: number; disks: Array<{ totalBytes: number; freeBytes: number; roots: string[] }> }
  activity: AdminActivityEntry[]
  server: {
    name: string
    version: string
    node: string
    os: string
    uptimeSeconds: number
    streamer: { reachable: boolean; transcodingAvailable: boolean; activeTranscodes: number; maxTranscodes: number; sessions: number }
    indexer: { reachable: boolean; activeScans: number; providers: string[] }
  }
}

export interface AdminActivityEntry {
  user: string
  title: string
  type: string
  showTitle: string | null
  seasonNumber: number | null
  episodeNumber: number | null
  positionSeconds: number
  durationSeconds: number
  completed: boolean
  at: string
}

export interface AdminActivityFilters {
  search?: string
  user?: string
  type?: string
  status?: string
  from?: string
  to?: string
  sort?: string
  page?: number
  pageSize?: number
}

export interface AdminActivityPage {
  items: AdminActivityEntry[]
  page: number
  pageSize: number
  total: number
  summary: { total: number; finished: number; inProgress: number; users: number }
  users: Array<{ id: string; name: string }>
}

export async function getAdminActivity(filters: AdminActivityFilters): Promise<AdminActivityPage> {
  const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== undefined && value !== ''))
  const response = await api.get<AdminActivityPage>('/admin/overview/activity', { params })
  return response.data
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const response = await api.get<AdminOverview>('/admin/overview')
  return response.data
}

export interface AdminDevice {
  id: string
  device: string
  app: string
  user: { id: string; username: string; displayName: string }
  ipAddress: string | null
  createdAt: string
  lastSeenAt: string
  current: boolean
}

export async function listDevices(): Promise<AdminDevice[]> {
  const response = await api.get<AdminDevice[]>('/admin/devices')
  return response.data
}

export async function signOutDevice(id: string): Promise<void> {
  await api.delete(`/admin/devices/${encodeURIComponent(id)}`)
}

export interface AdminUser {
  id: string
  username: string
  displayName: string
  email: string | null
  emailVerified: boolean
  role: 'admin' | 'user'
  disabled: boolean
  passkeys: number
  activeSessions: number
  lastActiveAt: string | null
  createdAt: string
  avatarUrl: string | null
  current: boolean
}

export interface NewAdminUser {
  username: string
  displayName?: string
  email: string
  password: string
  role: 'admin' | 'user'
}

export interface AdminUserChanges {
  displayName?: string
  email?: string
  role?: 'admin' | 'user'
  disabled?: boolean
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  const response = await api.get<AdminUser[]>('/admin/users')
  return response.data
}

export async function createAdminUser(user: NewAdminUser): Promise<AdminUser> {
  const response = await api.post<AdminUser>('/admin/users', user)
  return response.data
}

export async function updateAdminUser(id: string, changes: AdminUserChanges): Promise<AdminUser> {
  const response = await api.patch<AdminUser>(`/admin/users/${encodeURIComponent(id)}`, changes)
  return response.data
}

export async function setAdminUserAvatar(id: string, file: File): Promise<AdminUser> {
  const body = new FormData()
  body.append('avatar', file)
  const response = await api.post<AdminUser>(`/admin/users/${encodeURIComponent(id)}/avatar`, body, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export async function removeAdminUserAvatar(id: string): Promise<AdminUser> {
  const response = await api.delete<AdminUser>(`/admin/users/${encodeURIComponent(id)}/avatar`)
  return response.data
}

export async function setAdminUserPassword(id: string, password: string): Promise<void> {
  await api.put(`/admin/users/${encodeURIComponent(id)}/password`, { password })
}

export async function revokeAdminUserSessions(id: string): Promise<{ revoked: number }> {
  const response = await api.delete<{ revoked: number }>(`/admin/users/${encodeURIComponent(id)}/sessions`)
  return response.data
}

export async function deleteAdminUser(id: string): Promise<void> {
  await api.delete(`/admin/users/${encodeURIComponent(id)}`)
}

export interface ApiKeyInfo {
  id: string
  name: string
  prefix: string
  owner: { id: string; username: string; displayName: string }
  createdAt: string
  lastUsedAt: string | null
}

export interface CreatedApiKey extends ApiKeyInfo {
  secret: string
}

export async function listApiKeys(): Promise<ApiKeyInfo[]> {
  const response = await api.get<ApiKeyInfo[]>('/admin/api-keys')
  return response.data
}

export async function createApiKey(name: string): Promise<CreatedApiKey> {
  const response = await api.post<CreatedApiKey>('/admin/api-keys', { name })
  return response.data
}

export async function revokeApiKey(id: string): Promise<void> {
  await api.delete(`/admin/api-keys/${encodeURIComponent(id)}`)
}

export type MediaLibraryType = 'movies' | 'tvshows' | 'music' | 'homevideos' | 'mixed'

export interface MediaLibraryFolderInput {
  rootId: string
  path: string
}

export interface MediaLibraryFolder extends MediaLibraryFolderInput {
  rootName: string
  location: string
  available: boolean
}

export type MediaImageStorage = 'cache' | 'alongside'

export interface MediaLibrary {
  id: string
  name: string
  type: MediaLibraryType
  imageStorage: MediaImageStorage
  folders: MediaLibraryFolder[]
  createdAt: string
}

export interface MediaLibraryInput {
  name: string
  type: MediaLibraryType
  imageStorage?: MediaImageStorage
  folders: MediaLibraryFolderInput[]
}

export type IndexerScanState = 'scanning' | 'indexing' | 'complete' | 'failed'

export const INDEXER_QUEUES = ['scan', 'identify', 'metadata', 'images', 'probe', 'refresh', 'trickplay', 'themes', 'lyrics'] as const
export type IndexerQueueName = (typeof INDEXER_QUEUES)[number]
export const INDEXER_TASK_STATES = ['pending', 'active', 'scheduled', 'retry', 'archived', 'completed'] as const
export type IndexerTaskState = (typeof INDEXER_TASK_STATES)[number]

export interface IndexerQueueStats {
  queue: IndexerQueueName
  pending: number
  active: number
  scheduled: number
  retry: number
  archived: number
  completed: number
  processed: number
  failed: number
  paused: boolean
}

export interface IndexerTask {
  id: string
  queue: IndexerQueueName
  type: string
  state: IndexerTaskState
  retried: number
  maxRetry: number
  lastError?: string
  lastFailedAt?: string
  libraryId?: string
  libraryName?: string
  itemType?: string
  path?: string
}

export interface IndexerScan {
  libraryId: string
  state: IndexerScanState
  discovered: number
  done: number
  failed: number
  startedAt?: string
  finishedAt?: string
  error?: string
}

export interface IndexerStatus {
  reachable: boolean
  scans: IndexerScan[]
  queues: IndexerQueueStats[]
  concurrency: Record<string, number>
  maxConcurrency: number | null
  enabledProviders: string[]
}

export async function getIndexerStatus(): Promise<IndexerStatus> {
  const response = await api.get<IndexerStatus>('/admin/indexer/status')
  return response.data
}

export async function scanMediaLibrary(id: string, force = false, trickplayOnly = false): Promise<void> {
  await api.post(`/admin/indexer/libraries/${encodeURIComponent(id)}/scan`, { force, trickplayOnly })
}

export async function listIndexerTasks(queue: IndexerQueueName, state: IndexerTaskState, page = 1, size = 20): Promise<IndexerTask[]> {
  const response = await api.get<{ tasks: IndexerTask[] }>('/admin/indexer/tasks', { params: { queue, state, page, size } })
  return response.data.tasks ?? []
}

export interface IndexerTaskLogEntry {
  time: string
  level: string
  message: string
}

export interface IndexerTaskLogs {
  state: IndexerTaskState | ''
  total: number
  entries: IndexerTaskLogEntry[]
}

export async function getIndexerTaskLogs(queue: IndexerQueueName, id: string, offset = 0): Promise<IndexerTaskLogs> {
  const response = await api.get<IndexerTaskLogs>(`/admin/indexer/tasks/${queue}/${encodeURIComponent(id)}/logs`, { params: { offset } })
  return response.data
}

export async function cancelIndexerTask(queue: IndexerQueueName, id: string): Promise<void> {
  await api.post(`/admin/indexer/tasks/${queue}/${encodeURIComponent(id)}/cancel`)
}

export async function retryIndexerTask(queue: IndexerQueueName, id: string): Promise<void> {
  await api.post(`/admin/indexer/tasks/${queue}/${encodeURIComponent(id)}/retry`)
}

export async function clearFailedIndexerTasks(queue: IndexerQueueName): Promise<number> {
  const response = await api.post<{ cleared: number }>(`/admin/indexer/queues/${queue}/clear-failed`)
  return response.data.cleared ?? 0
}

export async function cancelActiveIndexerTasks(queue: IndexerQueueName): Promise<number> {
  const response = await api.post<{ cancelled: number }>(`/admin/indexer/queues/${queue}/cancel-active`)
  return response.data.cancelled ?? 0
}

export async function setIndexerQueuePaused(queue: IndexerQueueName, paused: boolean): Promise<void> {
  await api.post(`/admin/indexer/queues/${queue}/${paused ? 'pause' : 'resume'}`)
}

export async function setIndexerConcurrency(concurrency: Partial<Record<IndexerQueueName, number>>): Promise<IndexerStatus> {
  const response = await api.put<IndexerStatus>('/admin/indexer/concurrency', concurrency)
  return response.data
}

export type MediaItemType = 'movie' | 'series' | 'season' | 'episode' | 'album' | 'track' | 'video'
export const MEDIA_ITEM_TYPES: MediaItemType[] = ['movie', 'series', 'season', 'episode', 'album', 'track', 'video']

export interface MediaItemSummary {
  id: string
  libraryId: string
  parentId: string | null
  parentTitle: string | null
  type: MediaItemType
  title: string
  year: number | null
  seasonNumber: number | null
  episodeNumber: number | null
  path: string
  providerIds: Record<string, string>
  sizeBytes: number | null
  edited: boolean
  /** Index of the item's poster image, or null when it has none. */
  poster: number | null
  updatedAt: string
}

export const MEDIA_IMAGE_TYPES = ['poster', 'backdrop', 'logo', 'banner', 'thumb', 'disc'] as const
export type MediaImageType = (typeof MEDIA_IMAGE_TYPES)[number]

export interface MediaItemImage {
  index: number
  type: string
  provider: string
  width: number | null
  height: number | null
  language: string | null
  available: boolean
  manual: boolean
}

export interface MediaItemDetail extends Omit<MediaItemSummary, 'parentTitle' | 'edited' | 'poster'> {
  sortTitle: string | null
  episodeEndNumber: number | null
  metadata: Record<string, unknown>
  technical: Record<string, unknown> | null
  editedFields: string[]
  images: MediaItemImage[]
  parent: { id: string; title: string; type: MediaItemType } | null
  childCount: number
}

export interface MediaItemPage {
  items: MediaItemSummary[]
  total: number
  page: number
  size: number
}

export interface MediaItemQuery {
  libraryId?: string
  type?: MediaItemType
  parentId?: string
  search?: string
  page?: number
  size?: number
}

export interface MediaItemChanges {
  title?: string
  sortTitle?: string | null
  year?: number | null
  seasonNumber?: number | null
  episodeNumber?: number | null
  episodeEndNumber?: number | null
  overview?: string | null
}

export async function listMediaItems(query: MediaItemQuery): Promise<MediaItemPage> {
  const response = await api.get<MediaItemPage>('/admin/media/items', { params: query })
  return response.data
}

export async function getMediaItem(id: string): Promise<MediaItemDetail> {
  const response = await api.get<MediaItemDetail>(`/admin/media/items/${encodeURIComponent(id)}`)
  return response.data
}

export async function updateMediaItem(id: string, changes: MediaItemChanges): Promise<MediaItemDetail> {
  const response = await api.patch<MediaItemDetail>(`/admin/media/items/${encodeURIComponent(id)}`, changes)
  return response.data
}

export async function refreshMediaItem(id: string): Promise<{ queued: boolean; alreadyQueued: boolean }> {
  const response = await api.post<{ queued: boolean; alreadyQueued: boolean }>(`/admin/media/items/${encodeURIComponent(id)}/refresh`)
  return response.data
}

export async function deleteMediaItem(id: string): Promise<void> {
  await api.delete(`/admin/media/items/${encodeURIComponent(id)}`)
}

/** Images need the admin token, so they are fetched as blobs instead of used as plain img sources. */
export async function fetchMediaImage(id: string, index: number, width?: number): Promise<Blob> {
  const response = await api.get<Blob>(`/admin/media/items/${encodeURIComponent(id)}/images/${index}`, { params: width ? { w: width } : undefined, responseType: 'blob' })
  return response.data
}

export async function addMediaItemImage(id: string, type: MediaImageType, file: File): Promise<MediaItemDetail> {
  const body = new FormData()
  body.append('image', file)
  const response = await api.post<MediaItemDetail>(`/admin/media/items/${encodeURIComponent(id)}/images`, body, {
    params: { type },
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export async function removeMediaItemImage(id: string, index: number): Promise<MediaItemDetail> {
  const response = await api.delete<MediaItemDetail>(`/admin/media/items/${encodeURIComponent(id)}/images/${index}`)
  return response.data
}

export interface SubtitleFile {
  file: string
  language: string
  label?: string
  format: string
}

export interface SubtitleSearchResult {
  fileId: number
  language: string
  release: string
  fileName: string
  downloads: number
  hearingImpaired: boolean
  hashMatch: boolean
  rating: number
  uploader?: string
}

export async function listItemSubtitles(id: string): Promise<{ tracks: SubtitleFile[]; configured: boolean }> {
  const response = await api.get<{ tracks: SubtitleFile[]; configured: boolean }>(`/admin/media/items/${encodeURIComponent(id)}/subtitles`)
  return response.data
}

export async function searchItemSubtitles(id: string, options: { query?: string; languages?: string[] } = {}): Promise<SubtitleSearchResult[]> {
  const response = await api.post<{ results: SubtitleSearchResult[] }>(`/admin/media/items/${encodeURIComponent(id)}/subtitles/search`, options, { timeout: 70_000 })
  return response.data.results
}

export async function downloadItemSubtitle(id: string, fileId: number, language: string): Promise<void> {
  await api.post(`/admin/media/items/${encodeURIComponent(id)}/subtitles/download`, { fileId, language }, { timeout: 70_000 })
}

export async function deleteItemSubtitle(id: string, file: string): Promise<void> {
  await api.delete(`/admin/media/items/${encodeURIComponent(id)}/subtitles`, { params: { file } })
}

export interface HomeCard {
  id: string
  type: MediaItemType
  title: string
  year: number | null
  poster: number | null
  backdrop: number | null
  updatedAt: string
}

export interface HomeFeatured extends HomeCard {
  tagline: string | null
  overview: string | null
  rating: string | null
  runtimeMinutes: number | null
}

export interface HomeLibrary {
  id: string
  name: string
  type: string
  itemCount: number
  cover: { itemId: string; index: number; updatedAt: string } | null
}

export interface ContinueCard {
  id: string
  type: MediaItemType
  title: string
  subtitle: string | null
  imageItemId: string
  imageIndex: number | null
  imageUpdatedAt: string
  positionSeconds: number
  progress: number
  updatedAt: string
}

export interface HomeContent {
  libraries: HomeLibrary[]
  featured: HomeFeatured[]
  continueWatching: ContinueCard[]
  recentMovies: HomeCard[]
  recentShows: HomeCard[]
  recentAlbums: HomeCard[]
}

export async function getHomeContent(): Promise<HomeContent> {
  const response = await api.get<HomeContent>('/media/home')
  return response.data
}

export async function getWatchProgress(itemId: string): Promise<{ positionSeconds: number; completed: boolean }> {
  const response = await api.get<{ positionSeconds: number; completed: boolean }>(`/media/items/${encodeURIComponent(itemId)}/progress`)
  return response.data
}

export async function setItemWatched(itemId: string, watched: boolean): Promise<void> {
  await api.put(`/media/items/${encodeURIComponent(itemId)}/watched`, { watched })
}

export async function saveWatchProgress(itemId: string, positionSeconds: number, durationSeconds: number): Promise<void> {
  await api.put(`/media/items/${encodeURIComponent(itemId)}/progress`, { positionSeconds: Math.floor(positionSeconds), durationSeconds: Math.floor(durationSeconds) })
}

export interface SearchFilters {
  type?: string
  genre?: string
  yearFrom?: number
  yearTo?: number
  sort?: 'relevance' | 'title' | 'year' | 'added'
  unwatched?: boolean
}

export async function searchMedia(query: string, filters: SearchFilters = {}, signal?: AbortSignal): Promise<HomeCard[]> {
  const response = await api.get<HomeCard[]>('/media/search', { params: { q: query, ...filters, unwatched: filters.unwatched ? 'true' : undefined }, signal })
  return response.data
}

export async function getSearchGenres(): Promise<string[]> {
  const response = await api.get<string[]>('/media/search/genres')
  return response.data
}

export type BrowseKind = 'movies' | 'tv' | 'music'
export type BrowseSort = 'added' | 'title' | 'year'

export async function browseMedia(kind: BrowseKind, sort: BrowseSort, offset: number, signal?: AbortSignal): Promise<{ total: number; items: HomeCard[] }> {
  const response = await api.get<{ total: number; items: HomeCard[] }>(`/media/browse/${kind}`, { params: { sort, offset, limit: 48 }, signal })
  return response.data
}

export interface PersonCredits {
  id: string
  name: string
  hasImage: boolean
  profile: { description: string | null; biography: string | null; source: string | null; sourceUrl: string | null } | null
  groups: Array<{ role: string; items: Array<HomeCard & { detail: string | null }> }>
}

export async function fetchPersonImage(id: string, width?: number): Promise<Blob> {
  const response = await api.get<Blob>(`/media/people/${encodeURIComponent(id)}/image`, { params: width ? { w: width } : undefined, responseType: 'blob' })
  return response.data
}

export async function getPerson(id: string, signal?: AbortSignal): Promise<PersonCredits> {
  const response = await api.get<PersonCredits>(`/media/people/${encodeURIComponent(id)}`, { signal })
  return response.data
}

export interface ItemSummary {
  id: string
  watched: boolean
  type: MediaItemType
  title: string
  year: number | null
  seasonNumber: number | null
  episodeNumber: number | null
  overview: string | null
  runtimeMinutes: number | null
  poster: number | null
  thumb: number | null
  updatedAt: string
}

export interface ItemDetail {
  id: string
  watched: boolean
  type: MediaItemType
  title: string
  year: number | null
  seasonNumber: number | null
  episodeNumber: number | null
  tagline: string | null
  overview: string | null
  rating: string | null
  runtimeMinutes: number | null
  genres: string[]
  studios: string[]
  cast: Array<{ id: string; name: string; role: string | null; hasImage: boolean }>
  crew: Array<{ id: string; name: string; role: string; hasImage: boolean }>
  ratings: Record<string, number>
  status: string | null
  artist: string | null
  artistId: string | null
  technical: { container: string | null; videoCodec: string | null; audioCodec: string | null; width: number | null; height: number | null; hdr: string | null } | null
  chapters: PlayerChapter[]
  poster: number | null
  backdrop: number | null
  logo: number | null
  updatedAt: string
  parent: { id: string; type: MediaItemType; title: string } | null
  series: { id: string; title: string } | null
  children: Array<ItemSummary & { episodes: ItemSummary[] }>
}

export async function getItemDetail(id: string): Promise<ItemDetail> {
  const response = await api.get<ItemDetail>(`/media/items/${encodeURIComponent(id)}`)
  return response.data
}

/** Artwork for any signed-in user, fetched as a blob because it needs the Bearer token. */
/** `version` only busts the browser's cache when an item changes; the server ignores it. */
export async function fetchHomeImage(id: string, index: number, width?: number, version?: string): Promise<Blob> {
  const response = await api.get<Blob>(`/media/items/${encodeURIComponent(id)}/images/${index}`, { params: { ...(width ? { w: width } : {}), ...(version ? { v: version } : {}) }, responseType: 'blob' })
  return response.data
}

export const INDEXER_PROVIDERS = [
  { id: 'tmdb', keyed: true },
  { id: 'tvdb', keyed: true },
  { id: 'omdb', keyed: true },
  { id: 'fanart', keyed: true },
  { id: 'audiodb', keyed: true },
  { id: 'discogs', keyed: true },
  { id: 'anidb', keyed: true },
  { id: 'musicbrainz', keyed: false },
  { id: 'anilist', keyed: false },
] as const

export interface IndexerProviderSetting {
  enabled: boolean
  apiKey?: string
}

export interface IndexerSubtitleSetting {
  apiKey: string
  username: string
  password: string
  languages: string[]
  autoFetch: boolean
}

export interface MediaRoot {
  id: string
  name: string
  path: string
}

export interface MediaBrowseResult {
  rootId: string
  path: string
  directories: string[]
}

export async function listMediaLibraries(): Promise<MediaLibrary[]> {
  const response = await api.get<MediaLibrary[]>('/admin/media-libraries')
  return response.data
}

export async function listMediaRoots(): Promise<MediaRoot[]> {
  const response = await api.get<MediaRoot[]>('/admin/media-libraries/roots')
  return response.data
}

export async function browseMediaFolders(rootId: string, path: string): Promise<MediaBrowseResult> {
  const response = await api.get<MediaBrowseResult>('/admin/media-libraries/browse', { params: { rootId, path } })
  return response.data
}

export async function createMediaLibrary(library: MediaLibraryInput): Promise<MediaLibrary> {
  const response = await api.post<MediaLibrary>('/admin/media-libraries', library)
  return response.data
}

export async function updateMediaLibrary(id: string, changes: Partial<MediaLibraryInput>): Promise<MediaLibrary> {
  const response = await api.patch<MediaLibrary>(`/admin/media-libraries/${encodeURIComponent(id)}`, changes)
  return response.data
}

export async function deleteMediaLibrary(id: string): Promise<void> {
  await api.delete(`/admin/media-libraries/${encodeURIComponent(id)}`)
}

export interface NetworkShare {
  id: string
  name: string
  protocol: 'smb'
  host: string
  share: string
  username: string | null
  domain: string | null
  hasPassword: boolean
  readOnly: boolean
  rootId: string
  location: string
  status: 'connecting' | 'connected' | 'error'
  error: string | null
}

export interface NetworkShareInput {
  name: string
  host: string
  share: string
  username?: string
  domain?: string
  /** Omit when editing to keep the saved password. */
  password?: string
  readOnly?: boolean
}

export async function getNetworkShareSupport(): Promise<{ supported: boolean }> {
  const response = await api.get<{ supported: boolean }>('/admin/network-shares/support')
  return response.data
}

export async function listNetworkShares(): Promise<NetworkShare[]> {
  const response = await api.get<NetworkShare[]>('/admin/network-shares')
  return response.data
}

export async function createNetworkShare(share: NetworkShareInput): Promise<NetworkShare> {
  const response = await api.post<NetworkShare>('/admin/network-shares', share)
  return response.data
}

export async function updateNetworkShare(id: string, changes: Partial<NetworkShareInput>): Promise<NetworkShare> {
  const response = await api.patch<NetworkShare>(`/admin/network-shares/${encodeURIComponent(id)}`, changes)
  return response.data
}

export async function reconnectNetworkShare(id: string): Promise<NetworkShare> {
  const response = await api.post<NetworkShare>(`/admin/network-shares/${encodeURIComponent(id)}/reconnect`)
  return response.data
}

export async function deleteNetworkShare(id: string): Promise<void> {
  await api.delete(`/admin/network-shares/${encodeURIComponent(id)}`)
}
export interface AppNotification {
  id: string
  kind: 'new_media' | 'admin' | 'request'
  title: string
  body: string
  url: string | null
  read: boolean
  createdAt: string
}

export async function listNotifications(): Promise<{ unread: number; items: AppNotification[] }> {
  const response = await api.get<{ unread: number; items: AppNotification[] }>('/notifications')
  return response.data
}

export async function markNotificationsRead(ids?: string[]): Promise<void> {
  await api.post('/notifications/read', { ids })
}

export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`/notifications/${encodeURIComponent(id)}`)
}

export async function getPushPublicKey(): Promise<string> {
  const response = await api.get<{ publicKey: string }>('/notifications/push/key')
  return response.data.publicKey
}

export async function getPushStatus(endpoint: string): Promise<boolean> {
  const response = await api.get<{ subscribed: boolean }>('/notifications/push/status', { params: { endpoint } })
  return response.data.subscribed
}

export async function savePushSubscription(subscription: { endpoint: string; keys: { p256dh: string; auth: string } }): Promise<void> {
  await api.put('/notifications/push/subscription', subscription)
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  await api.post('/notifications/push/unsubscribe', { endpoint })
}

export async function sendAdminNotification(message: { title: string; body: string; url?: string | null; userIds?: string[] }): Promise<{ recipients: number; pushed: number }> {
  const response = await api.post<{ recipients: number; pushed: number }>('/admin/notifications', message)
  return response.data
}

export async function getNotificationConfig(): Promise<{ enabled: boolean; permissionPrompt: 'button' | 'load' }> {
  const response = await api.get<{ enabled: boolean; permissionPrompt: 'button' | 'load' }>('/notifications/config')
  return response.data
}

export interface UpdateComponent {
  id: 'flixer' | 'web' | 'streamer' | 'indexer'
  label: string
  installed: string | null
  latest: string | null
  reachable: boolean
  updateAvailable: boolean
}

export interface UpdateRun {
  id: string
  startedAt: string
  finishedAt: string | null
  status: 'running' | 'succeeded' | 'failed' | 'rolled_back' | 'rollback_failed'
  step: string
  targets: Partial<Record<UpdateComponent['id'], string>>
  previous: Partial<Record<UpdateComponent['id'], string>>
  backup: string | null
  error: string | null
  log: string[]
}

export interface UpdateStatus {
  components: UpdateComponent[]
  updatesAvailable: number
  lastCheckedAt: string | null
  canApply: boolean
  updaterReachable: boolean
  run: UpdateRun | null
  backups: Array<{ name: string; sizeBytes: number; createdAt: string }>
}

export async function getUpdateStatus(refresh = false): Promise<UpdateStatus> {
  const response = await api.get<UpdateStatus>('/admin/updates', { params: refresh ? { refresh: true } : undefined })
  return response.data
}

export async function applyUpdates(): Promise<UpdateRun> {
  const response = await api.post<UpdateRun>('/admin/updates/apply')
  return response.data
}

export interface BackupEntry {
  name: string
  size: number
  createdAt: string
  encrypted: boolean
  components: string[]
  versions: Record<string, string>
}

export interface BackupRun {
  id: string
  kind: 'backup' | 'restore'
  startedAt: string
  finishedAt: string | null
  status: 'running' | 'succeeded' | 'failed' | string
  step: string
  error: string | null
  log: string[]
}

export interface BackupStatus {
  updaterReachable: boolean
  canRestore: boolean
  passphraseSet: boolean
  schedule: 'off' | 'daily' | 'weekly'
  keep: number
  lastScheduledAt: string | null
  run: BackupRun | null
  backups: BackupEntry[]
}

export async function getBackupStatus(): Promise<BackupStatus> {
  const response = await api.get<BackupStatus>('/admin/backups')
  return response.data
}

export async function createBackup(): Promise<BackupRun> {
  const response = await api.post<BackupRun>('/admin/backups')
  return response.data
}

export async function restoreBackup(name: string, passphrase?: string): Promise<BackupRun> {
  const response = await api.post<BackupRun>(`/admin/backups/${encodeURIComponent(name)}/restore`, { passphrase: passphrase || undefined })
  return response.data
}

export async function deleteBackup(name: string): Promise<void> {
  await api.delete(`/admin/backups/${encodeURIComponent(name)}`)
}

export interface PluginInstallation {
  id: string
  version: string
  status: string
  enabled: boolean
  approvedPermissions: string[]
  activationSupported: boolean
  activationReason: string | null
  repository: { id: string; name: string; isOfficial: boolean } | null
  availableUpdate: { version: string; permissions: string[] } | null
  targetStatus: Record<string, string>
  lastError: string | null
  manifest: {
    name: string
    description: string
    author: string
    targets: Record<string, { entry: string }>
    settingsSchema?: string
  }
  installedAt: string
  updatedAt: string
}

export interface PluginUpdateHistoryEntry {
  id: string
  pluginId: string
  action: 'install' | 'update'
  fromVersion: string | null
  toVersion: string
  outcome: 'succeeded' | 'failed'
  errorMessage: string | null
  createdAt: string
}

export interface PluginRepository {
  id: string
  name: string
  url: string
  isOfficial: boolean
  enabled: boolean
  lastCheckedAt: string | null
  lastError: string | null
  manifest: {
    plugins: PluginCatalogEntry[]
  } | null
  createdAt: string
  updatedAt: string
}

export interface PluginCatalogEntry {
  id: string
  name: string
  description: string
  author: string
  capabilities?: string[]
  permissions: string[]
  targets: string[]
  versions: Array<{ version: string; manifest: string; package: string; sha256: string; size?: number }>
  repository?: { id: string; name: string; url: string; isOfficial: boolean }
}

export async function listPluginInstallations(): Promise<PluginInstallation[]> {
  const response = await api.get<PluginInstallation[]>('/admin/plugins')
  return response.data
}

export async function listPluginUpdateHistory(id: string): Promise<PluginUpdateHistoryEntry[]> {
  const response = await api.get<PluginUpdateHistoryEntry[]>(`/admin/plugins/${encodeURIComponent(id)}/history`)
  return response.data
}

export async function listPluginRepositories(): Promise<PluginRepository[]> {
  const response = await api.get<PluginRepository[]>('/admin/plugins/repositories')
  return response.data
}

export async function discoverPlugins(filters: { q?: string; target?: string; capability?: string } = {}): Promise<PluginCatalogEntry[]> {
  const response = await api.get<PluginCatalogEntry[]>('/admin/plugins/catalog', { params: filters })
  return response.data
}

export async function addPluginRepository(name: string, url: string): Promise<PluginRepository> {
  const response = await api.post<PluginRepository>('/admin/plugins/repositories', { name, url })
  return response.data
}

export async function refreshPluginRepository(id: string): Promise<PluginRepository> {
  const response = await api.post<PluginRepository>(`/admin/plugins/repositories/${encodeURIComponent(id)}/refresh`)
  return response.data
}

export async function installPlugin(id: string, request: { repositoryId: string; version: string; approvedPermissions: string[] }): Promise<PluginInstallation> {
  const response = await api.post<PluginInstallation>(`/admin/plugins/${encodeURIComponent(id)}/install`, request)
  return response.data
}

export async function enablePlugin(id: string): Promise<PluginInstallation> {
  const response = await api.post<PluginInstallation>(`/admin/plugins/${encodeURIComponent(id)}/enable`)
  return response.data
}

export async function disablePlugin(id: string): Promise<PluginInstallation> {
  const response = await api.post<PluginInstallation>(`/admin/plugins/${encodeURIComponent(id)}/disable`)
  return response.data
}

export async function uninstallPlugin(id: string): Promise<void> {
  await api.delete(`/admin/plugins/${encodeURIComponent(id)}`)
}

export interface PluginSettingsSchema {
  properties: Record<
    string,
    {
      title?: string
      description?: string
      type?: string
      format?: string
      enum?: unknown[]
      default?: unknown
      writeOnly?: boolean
      'x-flixer-secret'?: boolean
      items?: { type?: string }
    }
  >
}

export interface PluginSettingsView {
  schema: PluginSettingsSchema | null
  values: Record<string, unknown>
  secretFields: string[]
}

export async function getPluginSettings(id: string): Promise<PluginSettingsView> {
  const response = await api.get<PluginSettingsView>(`/admin/plugins/${encodeURIComponent(id)}/settings`)
  return response.data
}

export async function updatePluginSettings(id: string, settings: { values: Record<string, unknown>; secrets: Record<string, string> }): Promise<PluginSettingsView> {
  const response = await api.put<PluginSettingsView>(`/admin/plugins/${encodeURIComponent(id)}/settings`, settings)
  return response.data
}

export async function removePluginRepository(id: string): Promise<void> {
  await api.delete(`/admin/plugins/repositories/${encodeURIComponent(id)}`)
}

export interface PluginPageEntry {
  pluginId: string
  pluginName: string
  id: string
  title: string
  nav?: string | null
  adminOnly: boolean
}

/** Calls a plugin's API route; the plugin enforces its own authorization. */
export async function callPluginOperation<T = unknown>(pluginId: string, operation: string, body: Record<string, unknown> = {}): Promise<T> {
  return (await api.post<T>(`/plugins/${encodeURIComponent(pluginId)}/${encodeURIComponent(operation)}`, body)).data
}

/** Extra search results contributed by plugins; the shape is validated by `sanitizeSearchSections`. */
export async function searchPluginSections(q: string, type?: string, signal?: AbortSignal): Promise<unknown> {
  return (await api.get<unknown>('/plugins/search', { params: { q, type }, signal })).data
}

export async function listPluginPages(): Promise<PluginPageEntry[]> {
  return (await api.get<PluginPageEntry[]>('/plugins/pages')).data
}

export async function uploadBackup(file: File, onProgress?: (fraction: number) => void): Promise<BackupEntry> {
  const body = new FormData()
  body.append('backup', file)
  const response = await api.post<BackupEntry>('/admin/backups/upload', body, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 0,
    onUploadProgress: (event) => onProgress?.(event.total ? event.loaded / event.total : 0),
  })
  return response.data
}

export async function setBackupPassphrase(passphrase: string): Promise<void> {
  await api.put('/admin/backups/passphrase', { passphrase })
}

export async function clearBackupPassphrase(): Promise<void> {
  await api.delete('/admin/backups/passphrase')
}

/** A short-lived signed URL, so the browser streams the file to disk instead of holding it in memory. */
export async function getBackupDownloadUrl(name: string): Promise<string> {
  const response = await api.post<{ path: string }>(`/admin/backups/${encodeURIComponent(name)}/download-link`)
  return `${api.defaults.baseURL ?? ''}${response.data.path}`
}

export type RequestMediaType = 'movie' | 'tv' | 'music'
export type RequestSource = 'tmdb' | 'discogs'
export type RequestStatus = 'pending' | 'approved' | 'declined' | 'failed' | 'available'
export type ExternalRequestStatus = RequestStatus | 'none'

export interface ExternalMediaCard {
  source: RequestSource
  type: RequestMediaType
  id: string
  title: string
  year: number | null
  poster: string | null
  overview: string | null
  status: ExternalRequestStatus
  requestId: string | null
}

export interface MediaRequestView {
  id: string
  type: RequestMediaType
  source: RequestSource
  externalId: string
  title: string
  year: number | null
  poster: string | null
  seasons: number[] | null
  status: RequestStatus
  requestedBy: { id: string; username: string; displayName: string | null }
  serviceName: string | null
  declineReason: string | null
  error: string | null
  createdAt: string
  updatedAt: string
}

export interface ExternalMediaDetail extends ExternalMediaCard {
  backdrop: string | null
  tagline: string | null
  genres: string[]
  runtimeMinutes: number | null
  rating: number | null
  cast: string[]
  artist: string | null
  seasons: { number: number; name: string; episodeCount: number; status: ExternalRequestStatus }[] | null
  tracklist: string[] | null
  libraryItemId: string | null
  requests: MediaRequestView[]
}

export interface RequestsConfig {
  enabled: boolean
  movies: boolean
  tv: boolean
  music: boolean
  canRequest: boolean
  autoApprove: boolean
  isAdmin: boolean
  quota: { limit: number | null; days: number; used: number; remaining: number | null }
  tmdbConfigured: boolean
  discogsConfigured: boolean
}

export interface RequestServiceView {
  id: string
  libraryId: string | null
  libraryName: string | null
  kind: 'sonarr' | 'radarr' | 'lidarr'
  name: string
  url: string
  hasKey: boolean
  isDefault: boolean
  enabled: boolean
  rootFolder: string
  qualityProfileId: number
  metadataProfileId: number | null
  languageProfileId?: number | null
  minimumAvailability: 'announced' | 'inCinemas' | 'released' | null
  seasonFolders: boolean
  tags: number[]
}

export type RequestServiceInput = Omit<RequestServiceView, 'id' | 'hasKey' | 'libraryName'> & { libraryId: string; apiKey?: string }
export interface RequestServiceTest {
  ok: boolean
  version: string | null
  error: string | null
  qualityProfiles: { id: number; name: string }[]
  rootFolders: { path: string; freeSpace: number | null }[]
  metadataProfiles: { id: number; name: string }[]
  languageProfiles: { id: number; name: string }[]
}
export interface RequestUserView {
  id: string
  username: string
  displayName: string | null
  role: 'admin' | 'user'
  canRequest: boolean | null
  autoApprove: boolean | null
  quotaLimit: number | null
  quotaDays: number | null
}

/** Cached TMDB images are served by the API as relative paths; other (absolute) URLs pass through. */
function withApiBase(url: string | null): string | null {
  return url?.startsWith('/') ? `${api.defaults.baseURL ?? ''}${url}` : url
}
function withPoster<T extends { poster: string | null }>(entry: T): T {
  return { ...entry, poster: withApiBase(entry.poster) }
}

export async function getRequestsConfig(): Promise<RequestsConfig> {
  return (await api.get<RequestsConfig>('/requests/config')).data
}
export async function searchRequests(query: string, type?: RequestMediaType, signal?: AbortSignal): Promise<ExternalMediaCard[]> {
  return (await api.get<ExternalMediaCard[]>('/requests/search', { params: { q: query, type }, signal })).data.map(withPoster)
}
export async function discoverRequests(section: 'trending' | 'movies' | 'tv' | 'upcoming' | 'music', signal?: AbortSignal): Promise<ExternalMediaCard[]> {
  return (await api.get<ExternalMediaCard[]>('/requests/discover', { params: { section }, signal })).data.map(withPoster)
}
export async function getExternalMediaDetail(type: RequestMediaType, id: string): Promise<ExternalMediaDetail> {
  const detail = (await api.get<ExternalMediaDetail>(`/requests/details/${type}/${encodeURIComponent(id)}`)).data
  return { ...withPoster(detail), backdrop: withApiBase(detail.backdrop), requests: detail.requests.map(withPoster) }
}
export async function createMediaRequest(input: { type: RequestMediaType; externalId: string; seasons?: number[]; serviceId?: string; qualityProfileId?: number; rootFolder?: string }): Promise<MediaRequestView> {
  return (await api.post<MediaRequestView>('/requests', input)).data
}
export async function listMediaRequests(params: { scope?: 'mine' | 'all'; status?: RequestStatus; type?: RequestMediaType; offset?: number; limit?: number } = {}): Promise<{ total: number; counts: Record<RequestStatus, number>; items: MediaRequestView[] }> {
  const data = (await api.get<{ total: number; counts: Record<RequestStatus, number>; items: MediaRequestView[] }>('/requests', { params })).data
  return { ...data, items: data.items.map(withPoster) }
}
export async function approveMediaRequest(id: string, input: { serviceId?: string; qualityProfileId?: number; rootFolder?: string } = {}): Promise<MediaRequestView> {
  return (await api.post<MediaRequestView>(`/requests/${encodeURIComponent(id)}/approve`, input)).data
}
export async function declineMediaRequest(id: string, reason?: string): Promise<MediaRequestView> {
  return (await api.post<MediaRequestView>(`/requests/${encodeURIComponent(id)}/decline`, { reason })).data
}
export async function retryMediaRequest(id: string): Promise<MediaRequestView> {
  return (await api.post<MediaRequestView>(`/requests/${encodeURIComponent(id)}/retry`)).data
}
export async function deleteMediaRequest(id: string): Promise<void> {
  await api.delete(`/requests/${encodeURIComponent(id)}`)
}
export async function listRequestServices(): Promise<RequestServiceView[]> {
  return (await api.get<RequestServiceView[]>('/admin/requests/services')).data
}
export async function saveRequestService(input: RequestServiceInput, id?: string): Promise<RequestServiceView> {
  return (await (id ? api.put<RequestServiceView>(`/admin/requests/services/${encodeURIComponent(id)}`, input) : api.post<RequestServiceView>('/admin/requests/services', input))).data
}
export async function deleteRequestService(id: string): Promise<void> {
  await api.delete(`/admin/requests/services/${encodeURIComponent(id)}`)
}
export async function testRequestService(input: { kind: RequestServiceInput['kind']; url: string; apiKey: string; serviceId?: string }): Promise<RequestServiceTest> {
  return (await api.post<RequestServiceTest>('/admin/requests/services/test', input)).data
}
export async function listRequestUsers(): Promise<RequestUserView[]> {
  return (await api.get<RequestUserView[]>('/admin/requests/users')).data
}
export async function updateRequestUser(id: string, patch: Pick<RequestUserView, 'canRequest' | 'autoApprove' | 'quotaLimit' | 'quotaDays'>): Promise<RequestUserView> {
  return (await api.put<RequestUserView>(`/admin/requests/users/${encodeURIComponent(id)}`, patch)).data
}

export async function getItemTheme(id: string): Promise<Blob | null> {
  try {
    const response = await api.get<Blob>(`/themes/items/${encodeURIComponent(id)}`, { responseType: 'blob' })
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null
    throw error
  }
}

export async function syncThemes(): Promise<{ eligible: number; queued: number }> {
  return (await api.post<{ eligible: number; queued: number }>('/themes/sync')).data
}

export type SocialItemType = 'movie' | 'series' | 'album' | 'track' | 'video' | 'episode'

export interface SocialItem {
  id: string
  type: SocialItemType
  title: string
  subtitle: string | null
  year: number | null
  imageItemId: string
  imageIndex: number | null
  imageUpdatedAt: string
  updatedAt: string
  at?: string
}

export interface PlaylistSummary {
  id: string
  name: string
  description: string | null
  isPublic: boolean
  trackCount: number
  durationSeconds: number
  cover: { itemId: string; index: number; updatedAt: string } | null
  owner: { username: string; displayName: string; avatarUrl: string | null }
  updatedAt: string
}

export interface PlaylistTrack extends SocialItem {
  type: 'track'
  artist: string | null
  album: string | null
  albumId: string | null
  durationSeconds: number | null
  position: number
}

export interface Profile {
  username: string
  displayName: string
  avatarUrl: string | null
  joinedAt: string
  isSelf: boolean
  hidden: boolean
  nowPlaying: { kind: 'watching' | 'listening'; item: SocialItem; positionSeconds: number; durationSeconds: number | null } | null
  recentlyWatched: SocialItem[]
  recentlyListened: SocialItem[]
  favorites: SocialItem[]
  playlists: PlaylistSummary[]
}

export interface PublicProfileSummary {
  username: string
  displayName: string
  avatarUrl: string | null
  joinedAt: string
  favoriteCount: number
  playlistCount: number
  playCount: number
  nowPlaying: Profile['nowPlaying']
}

export async function getFavorites(): Promise<{ items: SocialItem[] }> {
  return (await api.get<{ items: SocialItem[] }>('/favorites')).data
}

export async function getFavoriteIds(): Promise<{ ids: string[] }> {
  return (await api.get<{ ids: string[] }>('/favorites/ids')).data
}

export async function addFavorite(itemId: string): Promise<void> {
  await api.put(`/favorites/${encodeURIComponent(itemId)}`)
}

export async function removeFavorite(itemId: string): Promise<void> {
  await api.delete(`/favorites/${encodeURIComponent(itemId)}`)
}

export async function getPlaylists(): Promise<{ playlists: PlaylistSummary[] }> {
  return (await api.get<{ playlists: PlaylistSummary[] }>('/playlists')).data
}

export async function createPlaylist(input: { name: string; description?: string; isPublic?: boolean }): Promise<PlaylistSummary> {
  return (await api.post<PlaylistSummary>('/playlists', input)).data
}

export async function getPlaylist(id: string): Promise<PlaylistSummary & { isOwner: boolean; tracks: PlaylistTrack[] }> {
  return (await api.get<PlaylistSummary & { isOwner: boolean; tracks: PlaylistTrack[] }>(`/playlists/${encodeURIComponent(id)}`)).data
}

export async function updatePlaylist(id: string, changes: { name?: string; description?: string; isPublic?: boolean }): Promise<PlaylistSummary> {
  return (await api.patch<PlaylistSummary>(`/playlists/${encodeURIComponent(id)}`, changes)).data
}

export async function deletePlaylist(id: string): Promise<void> {
  await api.delete(`/playlists/${encodeURIComponent(id)}`)
}

export async function addPlaylistItem(id: string, itemId: string): Promise<void> {
  await api.post(`/playlists/${encodeURIComponent(id)}/items`, { itemId })
}

export async function removePlaylistItem(id: string, itemId: string): Promise<void> {
  await api.delete(`/playlists/${encodeURIComponent(id)}/items/${encodeURIComponent(itemId)}`)
}

export async function reorderPlaylist(id: string, itemIds: string[]): Promise<void> {
  await api.put(`/playlists/${encodeURIComponent(id)}/order`, { itemIds })
}

export async function getPlaylistsContaining(itemId: string): Promise<{ playlistIds: string[] }> {
  return (await api.get<{ playlistIds: string[] }>(`/playlists/containing/${encodeURIComponent(itemId)}`)).data
}

export async function getProfiles(q?: string): Promise<{ profiles: PublicProfileSummary[] }> {
  return (await api.get<{ profiles: PublicProfileSummary[] }>('/profiles', { params: q ? { q } : undefined })).data
}

export async function getMySocialProfile(): Promise<Profile> {
  return (await api.get<Profile>('/profiles/me')).data
}

export async function getSocialProfile(username: string): Promise<Profile> {
  return (await api.get<Profile>(`/profiles/${encodeURIComponent(username)}`)).data
}

export async function updateMySocialProfile(changes: { hidden: boolean }): Promise<{ hidden: boolean }> {
  return (await api.put<{ hidden: boolean }>('/profiles/me', changes)).data
}

export async function reportListening(itemId: string, state: 'playing' | 'stopped'): Promise<void> {
  await api.post('/profiles/me/listening', { itemId, state })
}
