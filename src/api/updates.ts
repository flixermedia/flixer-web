/** Application update status and update actions. */
import { api } from './client'
import type { UpdateComponent as BaseUpdateComponent, UpdateRun, UpdateStatus as BaseUpdateStatus } from 'flixer-api-client'
export type { UpdateRun } from 'flixer-api-client'
export type UpdateComponent = Omit<BaseUpdateComponent, 'id'> & { id: BaseUpdateComponent['id'] | 'ai' | 'logger' }
export type UpdateStatus = Omit<BaseUpdateStatus, 'components'> & {
  components: UpdateComponent[]
  updaterMode?: 'compose' | 'development' | null
}

export async function getUpdateStatus(refresh = false): Promise<UpdateStatus> {
  const response = await api.get<UpdateStatus>('/admin/updates', { params: refresh ? { refresh: true } : undefined })
  return response.data
}

export async function applyUpdates(): Promise<UpdateRun> {
  const response = await api.post<UpdateRun>('/admin/updates/apply')
  return response.data
}
