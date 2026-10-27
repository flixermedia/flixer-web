import { Capacitor } from '@capacitor/core'
import { AccessControl, NativeBiometric } from '@capgo/capacitor-native-biometric'
import { CapacitorPersistentAccount } from '@capgo/capacitor-persistent-account'
import { configureNativeServer } from '../api'
import { getNativeServerUrl, normalizeNativeServerUrl } from './serverConnection'

interface PersistedAccount {
  version: 1
  serverUrl: string
  username: string
}

function isPersistedAccount(data: unknown): data is PersistedAccount {
  if (typeof data !== 'object' || data === null) return false
  const account = data as Partial<PersistedAccount>
  if (account.version !== 1 || typeof account.username !== 'string' || typeof account.serverUrl !== 'string') return false
  try {
    return normalizeNativeServerUrl(account.serverUrl) === account.serverUrl
  } catch {
    return false
  }
}

export async function restoreNativeAccount(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null
  const { data } = await CapacitorPersistentAccount.readAccount()
  if (!isPersistedAccount(data)) return null

  const configuredServer = getNativeServerUrl()
  if (!configuredServer) {
    configureNativeServer(data.serverUrl)
    return data.username
  }
  return configuredServer === data.serverUrl ? data.username : null
}

export async function saveNativeAccount(username: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  const serverUrl = getNativeServerUrl()
  if (!serverUrl) return
  await CapacitorPersistentAccount.saveAccount({
    data: { version: 1, serverUrl, username },
  })
}

export async function getNativeBiometricLoginStatus(): Promise<{ available: boolean; saved: boolean }> {
  if (!Capacitor.isNativePlatform()) return { available: false, saved: false }
  const server = getNativeServerUrl()
  if (!server) return { available: false, saved: false }
  const [availability, credentials] = await Promise.all([NativeBiometric.isAvailable({ useFallback: false }), NativeBiometric.isCredentialsSaved({ server })])
  return { available: availability.isAvailable, saved: credentials.isSaved && availability.isAvailable }
}

export async function saveNativeBiometricCredentials(username: string, password: string): Promise<void> {
  const server = getNativeServerUrl()
  if (!Capacitor.isNativePlatform() || !server) return
  const availability = await NativeBiometric.isAvailable({ useFallback: false })
  if (!availability.isAvailable) throw new Error('Biometric authentication is not available on this device.')
  await NativeBiometric.setCredentials({
    username,
    password,
    server,
    accessControl: AccessControl.BIOMETRY_ANY,
    title: 'Enable biometric sign-in',
    negativeButtonText: 'Cancel',
  })
}

export async function getNativeBiometricCredentials(): Promise<{ username: string; password: string }> {
  const server = getNativeServerUrl()
  if (!Capacitor.isNativePlatform() || !server) throw new Error('No native server is configured.')
  return NativeBiometric.getSecureCredentials({
    server,
    reason: 'Sign in to Flixer',
    title: 'Sign in to Flixer',
    negativeButtonText: 'Cancel',
  })
}

export async function removeNativeBiometricCredentials(): Promise<void> {
  const server = getNativeServerUrl()
  if (!Capacitor.isNativePlatform() || !server) return
  await NativeBiometric.deleteCredentials({ server })
}
