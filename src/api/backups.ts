/** Backup creation, restoration, uploads, downloads, and passphrase operations. */
import { api } from './client'
import type { BackupEntry, BackupRun, BackupStatus, FlixerApiRouteBody, FlixerApiRouteData } from '@flixermedia/flixer-api-client'
export type { BackupEntry, BackupRun, BackupStatus } from '@flixermedia/flixer-api-client'

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
  const request: FlixerApiRouteBody<'put', '/admin/backups/passphrase'> = { passphrase }
  await api.put('/admin/backups/passphrase', request)
}

export async function clearBackupPassphrase(): Promise<void> {
  await api.delete('/admin/backups/passphrase')
}

/** A short-lived signed URL, so the browser streams the file to disk instead of holding it in memory. */
export async function getBackupDownloadUrl(name: string): Promise<string> {
  const response = await api.post<FlixerApiRouteData<'post', '/admin/backups/{param}/download-link'>>(`/admin/backups/${encodeURIComponent(name)}/download-link`)
  return `${api.defaults.baseURL ?? ''}${response.data.path}`
}
