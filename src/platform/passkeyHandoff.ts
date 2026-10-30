import { Browser } from '@capacitor/browser'
import { isNativeApp } from './serverConnection'
import { startNativePasskeyHandoff } from '../api'
import { catchError } from '../utils/catchError'

export const NATIVE_PASSKEY_CALLBACK_SCHEME = 'flixer'
export const NATIVE_PASSKEY_HANDOFF_KEY = 'flixer.nativePasskeyHandoff'
const HANDOFF_LIFETIME_MS = 5 * 60 * 1000

export interface PendingNativePasskeyHandoff {
  codeVerifier: string
  state: string
  expiresAt: number
  redirect?: string
}

function randomBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function createCodeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return randomBase64Url(new Uint8Array(digest))
}

export function getPendingNativePasskeyHandoff(): PendingNativePasskeyHandoff | null {
  const serialized = localStorage.getItem(NATIVE_PASSKEY_HANDOFF_KEY)
  if (!serialized) return null

  try {
    const pending = JSON.parse(serialized) as Record<string, unknown>
    if (typeof pending.codeVerifier !== 'string' || typeof pending.state !== 'string' || typeof pending.expiresAt !== 'number' || pending.expiresAt <= Date.now() || (pending.redirect !== undefined && typeof pending.redirect !== 'string')) {
      localStorage.removeItem(NATIVE_PASSKEY_HANDOFF_KEY)
      return null
    }
    return {
      codeVerifier: pending.codeVerifier,
      state: pending.state,
      expiresAt: pending.expiresAt,
      ...(typeof pending.redirect === 'string' && { redirect: pending.redirect }),
    }
  } catch {
    localStorage.removeItem(NATIVE_PASSKEY_HANDOFF_KEY)
    return null
  }
}

export function clearPendingNativePasskeyHandoff(): void {
  localStorage.removeItem(NATIVE_PASSKEY_HANDOFF_KEY)
}

export async function beginNativePasskeyHandoff(ticket?: string, redirect?: string): Promise<void> {
  if (!isNativeApp()) throw new Error('Native passkey handoff is only available in the Flixer app.')

  const codeVerifier = randomBase64Url(crypto.getRandomValues(new Uint8Array(32)))
  const state = randomBase64Url(crypto.getRandomValues(new Uint8Array(32)))
  const codeChallenge = await createCodeChallenge(codeVerifier)
  const { handoffId, appUrl } = await startNativePasskeyHandoff({ codeChallenge, state, ticket })

  const handoffUrl = new URL(appUrl)
  handoffUrl.pathname = `${handoffUrl.pathname.replace(/\/+$/, '')}/passkey/handoff/${handoffId}`
  handoffUrl.search = ''
  handoffUrl.hash = ''
  handoffUrl.searchParams.set('state', state)

  localStorage.setItem(NATIVE_PASSKEY_HANDOFF_KEY, JSON.stringify({ codeVerifier, state, expiresAt: Date.now() + HANDOFF_LIFETIME_MS, redirect } satisfies PendingNativePasskeyHandoff))

  const [error] = await catchError(Browser.open({ url: handoffUrl.toString() }))
  if (error) {
    clearPendingNativePasskeyHandoff()
    throw error
  }
}
