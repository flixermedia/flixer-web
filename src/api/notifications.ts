/** Notification and push-subscription operations. */
import { api } from './client'
import type { FlixerApiRouteBody, FlixerApiRouteData, FlixerApiRouteQuery } from 'flixer-api-client'
export type { AppNotification, NotificationConfig } from 'flixer-api-client'

export async function listNotifications(): Promise<FlixerApiRouteData<'get', '/notifications'>> {
  const response = await api.get<FlixerApiRouteData<'get', '/notifications'>>('/notifications')
  return response.data
}

export async function markNotificationsRead(ids?: string[]): Promise<void> {
  const request: FlixerApiRouteBody<'post', '/notifications/read'> = { ids }
  await api.post('/notifications/read', request)
}

export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`/notifications/${encodeURIComponent(id)}`)
}

export async function getPushPublicKey(): Promise<string> {
  const response = await api.get<FlixerApiRouteData<'get', '/notifications/push/key'>>('/notifications/push/key')
  return response.data.publicKey
}

export async function getPushStatus(endpoint: string): Promise<boolean> {
  const params: FlixerApiRouteQuery<'get', '/notifications/push/status'> = { endpoint }
  const response = await api.get<FlixerApiRouteData<'get', '/notifications/push/status'>>('/notifications/push/status', { params })
  return response.data.subscribed
}

export async function savePushSubscription(subscription: FlixerApiRouteBody<'put', '/notifications/push/subscription'>): Promise<void> {
  await api.put('/notifications/push/subscription', subscription)
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  const request: FlixerApiRouteBody<'post', '/notifications/push/unsubscribe'> = { endpoint }
  await api.post('/notifications/push/unsubscribe', request)
}

export async function sendAdminNotification(message: FlixerApiRouteBody<'post', '/admin/notifications'>): Promise<FlixerApiRouteData<'post', '/admin/notifications'>> {
  const response = await api.post<FlixerApiRouteData<'post', '/admin/notifications'>>('/admin/notifications', message)
  return response.data
}

export async function getNotificationConfig(): Promise<FlixerApiRouteData<'get', '/notifications/config'>> {
  const response = await api.get<FlixerApiRouteData<'get', '/notifications/config'>>('/notifications/config')
  return response.data
}
