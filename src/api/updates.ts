/** Application update status and update actions. */
import { api } from './client'
import type { UpdateRun, UpdateStatus } from 'flixer-api-client'
export type { UpdateComponent, UpdateRun, UpdateStatus } from 'flixer-api-client'

export async function getUpdateStatus(refresh = false): Promise<UpdateStatus> {
  const response = await api.get<UpdateStatus>('/admin/updates', { params: refresh ? { refresh: true } : undefined })
  return response.data
}

export async function applyUpdates(): Promise<UpdateRun> {
  const response = await api.post<UpdateRun>('/admin/updates/apply')
  return response.data
}
