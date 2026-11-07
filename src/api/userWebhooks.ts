import { api } from './client'
import type { ViewingTarget } from './analytics'

export type WebhookTarget = ViewingTarget | { kind: 'music'; itemId: string }
export type WebhookEvent = 'playback.started' | 'playback.paused' | 'playback.resumed' | 'playback.stopped'
export interface UserWebhook { id: string; name: string; url: string; enabled: boolean }
export interface WebhookConfig { enabled: boolean; audience: 'admins' | 'everyone'; allowedUrls: string[] }

export async function getWebhookConfig(): Promise<WebhookConfig> {
  return (await api.get<WebhookConfig>('/admin/user-webhooks')).data
}
export async function saveWebhookConfig(config: WebhookConfig): Promise<WebhookConfig> {
  return (await api.put<WebhookConfig>('/admin/user-webhooks', config)).data
}
export async function getUserWebhooks(): Promise<{ available: boolean; hooks: UserWebhook[] }> {
  return (await api.get<{ available: boolean; hooks: UserWebhook[] }>('/user-webhooks')).data
}
export async function saveUserWebhook(hook: Omit<UserWebhook, 'id'>, id?: string): Promise<UserWebhook> {
  return id ? (await api.put<UserWebhook>(`/user-webhooks/${id}`, hook)).data : (await api.post<UserWebhook>('/user-webhooks', hook)).data
}
export async function deleteUserWebhook(id: string): Promise<void> {
  await api.delete(`/user-webhooks/${id}`)
}
export async function reportWebhookPlayback(event: WebhookEvent, target: WebhookTarget, position: number): Promise<void> {
  await api.post('/user-webhooks/playback', { event, target, position })
}
