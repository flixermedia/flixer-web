/** Authentication, account, profile, settings, and passkey operations. */
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { api, clearAccessToken } from './client';
import { catchError } from '../utils/catchError';
export async function getPreferences() {
    const response = await api.get('/preferences');
    return response.data;
}
/** Partial update; a `null` value clears that preference. */
export async function updatePreferences(patch) {
    const response = await api.patch('/preferences', patch);
    return response.data;
}
export async function login(username, password) {
    const request = { username, password };
    const response = await api.post('/auth/login', request);
    return response.data;
}
export async function getRegistrationStatus() {
    const response = await api.get('/settings/registration');
    return response.data;
}
export async function register(username, password, email, displayName) {
    const request = {
        username,
        displayName: displayName || undefined,
        email,
        password,
    };
    const response = await api.post('/auth/register', request);
    return response.data;
}
export async function verifyEmail(token) {
    const request = { token };
    await api.post('/auth/verify-email', request);
}
export async function resendVerification(username, password) {
    const request = { username, password };
    await api.post('/auth/resend-verification', request);
}
export async function validateAccessToken() {
    const response = await api.get('/auth/sessions');
    return response.data.some((session) => session.current);
}
export async function getProfile() {
    const response = await api.get('/auth/me');
    return response.data;
}
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
export const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
export function resolveAvatarUrl(avatarUrl) {
    return avatarUrl ? `${api.defaults.baseURL ?? ''}${avatarUrl}` : null;
}
export async function uploadAvatar(file) {
    const body = new FormData();
    body.append('avatar', file);
    const response = await api.post('/auth/me/avatar', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
}
export async function removeAvatar() {
    const response = await api.delete('/auth/me/avatar');
    return response.data;
}
export async function updateProfile(changes) {
    const response = await api.patch('/auth/me', changes);
    return response.data;
}
export async function changePassword(currentPassword, newPassword) {
    const request = { currentPassword, newPassword };
    await api.post('/auth/me/password', request);
}
export async function deleteAccount(password) {
    const request = { password };
    await api.post('/auth/me/delete', request);
}
export async function listSettings() {
    const response = await api.get('/settings');
    return response.data;
}
export async function updateSetting(key, value) {
    const request = { value };
    const response = await api.put(`/settings/${encodeURIComponent(key)}`, request);
    return response.data;
}
export async function sendTestEmail() {
    const response = await api.post('/settings/email/test');
    return response.data;
}
export async function listPasskeys() {
    const response = await api.get('/auth/passkeys');
    return response.data;
}
export async function getPasskeyRegistrationOptions(password) {
    const request = { password };
    const options = await api.post('/auth/passkeys/register/options', request);
    return options.data;
}
export async function registerPasskey(options, name) {
    console.info('[passkey] registering', { origin: window.location.origin, secureContext: window.isSecureContext, rpId: options.rp.id });
    const [error, attestation] = await catchError(startRegistration({ optionsJSON: options }));
    if (error) {
        console.error('[passkey] registration failed', error);
        throw error;
    }
    const request = { response: { ...attestation }, name: name || undefined };
    const response = await api.post('/auth/passkeys/register/verify', request);
    return response.data;
}
export async function loginWithPasskey() {
    const options = await api.post('/auth/passkeys/login/options');
    console.info('[passkey] authenticating', { origin: window.location.origin, secureContext: window.isSecureContext, rpId: options.data.rpId });
    const [error, assertion] = await catchError(startAuthentication({ optionsJSON: options.data }));
    if (error) {
        console.error('[passkey] authentication failed', error);
        throw error;
    }
    const request = { response: { ...assertion } };
    const response = await api.post('/auth/passkeys/login/verify', request);
    return response.data;
}
export async function loginWithPasskeySecondFactor(ticket) {
    const optionsRequest = { ticket };
    const options = await api.post('/auth/passkeys/second-factor/options', optionsRequest);
    const assertion = await startAuthentication({ optionsJSON: options.data });
    const verifyRequest = { ticket, response: { ...assertion } };
    const response = await api.post('/auth/passkeys/second-factor/verify', verifyRequest);
    return response.data;
}
export async function startNativePasskeyHandoff(input) {
    const response = await api.post('/auth/passkeys/native-handoff/start', input);
    return response.data;
}
export async function getNativePasskeyHandoffOptions(handoffId) {
    const request = { handoffId };
    const response = await api.post('/auth/passkeys/native-handoff/options', request);
    return response.data;
}
export async function verifyNativePasskeyHandoff(handoffId, assertion) {
    const request = { handoffId, response: assertion };
    const response = await api.post('/auth/passkeys/native-handoff/verify', request);
    return response.data;
}
export async function exchangeNativePasskeyHandoff(input) {
    const response = await api.post('/auth/passkeys/native-handoff/exchange', input);
    return response.data;
}
export async function setPasskeyRequired(enabled, password) {
    const request = { enabled, password };
    const response = await api.patch('/auth/me/passkey-required', request);
    return response.data;
}
export async function deletePasskey(passkeyId, password) {
    const request = { password };
    await api.post(`/auth/passkeys/${encodeURIComponent(passkeyId)}/delete`, request);
}
export async function logout() {
    await api.post('/auth/logout');
    clearAccessToken();
}
