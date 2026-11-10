/** Authentication, account, profile, settings, and passkey operations. */
import { startAuthentication, startRegistration, type PublicKeyCredentialCreationOptionsJSON, type PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/browser'
import { api, clearAccessToken } from './client'
import { catchError } from '../utils/catchError'
import type { AuthResult, AuthSession, Passkey, PasskeyRequired, RegistrationStatus, ServerSetting, FlixerApiRouteBody, FlixerApiRouteData, UserPreferences, UserPreferencesUpdate, UserProfile, VerificationPending } from 'flixer-api-client'
export type { AuthResult, AuthSession, Passkey, PasskeyRequired, RegistrationStatus, SettingRequestValue, ServerSetting, UserPreferences, UserPreferencesUpdate, UserProfile, VerificationPending } from 'flixer-api-client'

/** The account exists but has to save a card before it can sign in; `token` lets the holder finish paying. */
export interface PaymentPending {
  paymentRequired: true
  token: string
}

export type AppPreferences = UserPreferences & { browseColumns?: number; autoSkipIntroCredits?: boolean; audioLanguage?: string; themeId?: string }
export type AppPreferencesUpdate = UserPreferencesUpdate & { browseColumns?: number | null; autoSkipIntroCredits?: boolean | null; audioLanguage?: string | null; themeId?: string | null }

export async function getPreferences(): Promise<AppPreferences> {
  const response = await api.get<AppPreferences>('/preferences')
  return response.data
}

/** Partial update; a `null` value clears that preference. */
export async function updatePreferences(patch: AppPreferencesUpdate): Promise<AppPreferences> {
  const response = await api.patch<AppPreferences>('/preferences', patch)
  return response.data
}

export async function login(username: string, password: string): Promise<AuthResult | PasskeyRequired | PaymentPending> {
  const request: FlixerApiRouteBody<'post', '/auth/login'> = { username, password }
  const response = await api.post<AuthResult | PasskeyRequired | PaymentPending>('/auth/login', request)
  return response.data
}

export async function getRegistrationStatus(): Promise<RegistrationStatus> {
  const response = await api.get<RegistrationStatus>('/settings/registration')
  return response.data
}

export interface QuickConnectStartResult {
  requestId: string
  userCode: string
  pollToken: string
  expiresAt: string
}

export type QuickConnectPollResult =
  | { status: 'pending' | 'denied' | 'expired' }
  | { status: 'approved'; auth: AuthResult }

export async function getQuickConnectStatus(): Promise<{ enabled: boolean }> {
  const response = await api.get<{ enabled: boolean }>('/auth/quick-connect/status')
  return response.data
}

export async function startQuickConnect(): Promise<QuickConnectStartResult> {
  const response = await api.post<QuickConnectStartResult>('/auth/quick-connect/start')
  return response.data
}

export async function pollQuickConnect(requestId: string, pollToken: string): Promise<QuickConnectPollResult> {
  const response = await api.post<QuickConnectPollResult>('/auth/quick-connect/poll', { requestId, pollToken })
  return response.data
}

export async function decideQuickConnect(userCode: string, decision: 'approve' | 'deny'): Promise<void> {
  await api.post(`/auth/quick-connect/${decision}`, { userCode })
}

export async function register(username: string, password: string, email: string, displayName?: string): Promise<AuthResult | VerificationPending | PaymentPending> {
  const request: FlixerApiRouteBody<'post', '/auth/register'> = {
    username,
    displayName: displayName || undefined,
    email,
    password,
  }
  const response = await api.post<AuthResult | VerificationPending | PaymentPending>('/auth/register', request)
  return response.data
}

export async function verifyEmail(token: string): Promise<void> {
  const request: FlixerApiRouteBody<'post', '/auth/verify-email'> = { token }
  await api.post('/auth/verify-email', request)
}

export async function resendVerification(username: string, password: string): Promise<void> {
  const request: FlixerApiRouteBody<'post', '/auth/resend-verification'> = { username, password }
  await api.post('/auth/resend-verification', request)
}

export async function validateAccessToken(): Promise<boolean> {
  const response = await api.get<AuthSession[]>('/auth/sessions')
  return response.data.some((session) => session.current)
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

export async function updateProfile(changes: FlixerApiRouteBody<'patch', '/auth/me'>): Promise<UserProfile> {
  const response = await api.patch<UserProfile>('/auth/me', changes)
  return response.data
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const request: FlixerApiRouteBody<'post', '/auth/me/password'> = { currentPassword, newPassword }
  await api.post('/auth/me/password', request)
}

export async function deleteAccount(password: string): Promise<void> {
  const request: FlixerApiRouteBody<'post', '/auth/me/delete'> = { password }
  await api.post('/auth/me/delete', request)
}

export async function listSettings(): Promise<ServerSetting[]> {
  const response = await api.get<ServerSetting[]>('/settings')
  return response.data
}

export async function updateSetting(key: string, value: FlixerApiRouteBody<'put', '/settings/{param}'>['value']): Promise<ServerSetting> {
  const request: FlixerApiRouteBody<'put', '/settings/{param}'> = { value }
  const response = await api.put<ServerSetting>(`/settings/${encodeURIComponent(key)}`, request)
  return response.data
}

export async function sendTestEmail(): Promise<FlixerApiRouteData<'post', '/settings/email/test'>> {
  const response = await api.post<FlixerApiRouteData<'post', '/settings/email/test'>>('/settings/email/test')
  return response.data
}

export async function listPasskeys(): Promise<Passkey[]> {
  const response = await api.get<Passkey[]>('/auth/passkeys')
  return response.data
}

export async function getPasskeyRegistrationOptions(password: string): Promise<PublicKeyCredentialCreationOptionsJSON> {
  const request: FlixerApiRouteBody<'post', '/auth/passkeys/register/options'> = { password }
  const options = await api.post<PublicKeyCredentialCreationOptionsJSON>('/auth/passkeys/register/options', request)
  return options.data
}

export async function registerPasskey(options: PublicKeyCredentialCreationOptionsJSON, name?: string): Promise<Passkey> {
  console.info('[passkey] registering', { origin: window.location.origin, secureContext: window.isSecureContext, rpId: options.rp.id })
  const [error, attestation] = await catchError(startRegistration({ optionsJSON: options }))
  if (error) {
    console.error('[passkey] registration failed', error)
    throw error
  }
  const request: FlixerApiRouteBody<'post', '/auth/passkeys/register/verify'> = { response: { ...attestation }, name: name || undefined }
  const response = await api.post<Passkey>('/auth/passkeys/register/verify', request)
  return response.data
}

export async function loginWithPasskey(): Promise<AuthResult> {
  const options = await api.post<PublicKeyCredentialRequestOptionsJSON>('/auth/passkeys/login/options')
  console.info('[passkey] authenticating', { origin: window.location.origin, secureContext: window.isSecureContext, rpId: options.data.rpId })
  const [error, assertion] = await catchError(startAuthentication({ optionsJSON: options.data }))
  if (error) {
    console.error('[passkey] authentication failed', error)
    throw error
  }
  const request: FlixerApiRouteBody<'post', '/auth/passkeys/login/verify'> = { response: { ...assertion } }
  const response = await api.post<AuthResult>('/auth/passkeys/login/verify', request)
  return response.data
}

export async function loginWithPasskeySecondFactor(ticket: string): Promise<AuthResult> {
  const optionsRequest: FlixerApiRouteBody<'post', '/auth/passkeys/second-factor/options'> = { ticket }
  const options = await api.post<PublicKeyCredentialRequestOptionsJSON>('/auth/passkeys/second-factor/options', optionsRequest)
  const assertion = await startAuthentication({ optionsJSON: options.data })
  const verifyRequest: FlixerApiRouteBody<'post', '/auth/passkeys/second-factor/verify'> = { ticket, response: { ...assertion } }
  const response = await api.post<AuthResult>('/auth/passkeys/second-factor/verify', verifyRequest)
  return response.data
}

export async function startNativePasskeyHandoff(input: FlixerApiRouteBody<'post', '/auth/passkeys/native-handoff/start'>): Promise<FlixerApiRouteData<'post', '/auth/passkeys/native-handoff/start'>> {
  const response = await api.post<FlixerApiRouteData<'post', '/auth/passkeys/native-handoff/start'>>('/auth/passkeys/native-handoff/start', input)
  return response.data
}

export async function getNativePasskeyHandoffOptions(handoffId: string): Promise<PublicKeyCredentialRequestOptionsJSON> {
  const request: FlixerApiRouteBody<'post', '/auth/passkeys/native-handoff/options'> = { handoffId }
  const response = await api.post<PublicKeyCredentialRequestOptionsJSON>('/auth/passkeys/native-handoff/options', request)
  return response.data
}

export async function verifyNativePasskeyHandoff(handoffId: string, assertion: FlixerApiRouteBody<'post', '/auth/passkeys/native-handoff/verify'>['response']): Promise<FlixerApiRouteData<'post', '/auth/passkeys/native-handoff/verify'>> {
  const request: FlixerApiRouteBody<'post', '/auth/passkeys/native-handoff/verify'> = { handoffId, response: assertion }
  const response = await api.post<FlixerApiRouteData<'post', '/auth/passkeys/native-handoff/verify'>>('/auth/passkeys/native-handoff/verify', request)
  return response.data
}

export async function exchangeNativePasskeyHandoff(input: FlixerApiRouteBody<'post', '/auth/passkeys/native-handoff/exchange'>): Promise<AuthResult> {
  const response = await api.post<AuthResult>('/auth/passkeys/native-handoff/exchange', input)
  return response.data
}

export async function setPasskeyRequired(enabled: boolean, password?: string): Promise<UserProfile> {
  const request: FlixerApiRouteBody<'patch', '/auth/me/passkey-required'> = { enabled, password }
  const response = await api.patch<UserProfile>('/auth/me/passkey-required', request)
  return response.data
}

export async function deletePasskey(passkeyId: string, password: string): Promise<void> {
  const request: FlixerApiRouteBody<'post', '/auth/passkeys/{param}/delete'> = { password }
  await api.post(`/auth/passkeys/${encodeURIComponent(passkeyId)}/delete`, request)
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
  clearAccessToken()
}
