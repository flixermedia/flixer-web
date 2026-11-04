import { api } from './client'
import type { BlockReason, RestrictedDisplay } from './admin'

export interface AccessMe {
  enforced: boolean
  hasPin: boolean
  unlockedUntil: string | null
  displayMode: RestrictedDisplay
  maxAge: number | null
  requireRequestApproval: boolean
  schedule: { allowed: boolean; nextAllowedAt: string | null }
}

export type LockReason = Exclude<BlockReason, 'library'>

export async function getAccessMe(): Promise<AccessMe> {
  return (await api.get<AccessMe>('/access/me')).data
}

export async function unlockAccess(pin: string): Promise<AccessMe> {
  return (await api.post<AccessMe>('/access/unlock', { pin })).data
}

export async function lockAccess(): Promise<AccessMe> {
  return (await api.post<AccessMe>('/access/lock', {})).data
}
