import { Capacitor } from '@capacitor/core'
import { LocalNotifications, type LocalNotificationSchema } from '@capacitor/local-notifications'
import { Badge } from '@capawesome/capacitor-badge'
import type { AppNotification } from '../api/notifications'

export const NATIVE_NOTIFICATION_CHANNEL_ID = 'flixer-notifications'
export const NATIVE_NOTIFICATIONS_ENABLED_KEY = 'flixer.nativeNotificationsEnabled'

export function supportsNativeLocalNotifications(): boolean {
  return Capacitor.isNativePlatform()
}

export async function checkNativeNotificationPermission() {
  return LocalNotifications.checkPermissions()
}

export async function requestNativeNotificationPermission() {
  return LocalNotifications.requestPermissions()
}

export async function prepareNativeNotifications() {
  if (Capacitor.getPlatform() !== 'android') return
  await LocalNotifications.createChannel({
    id: NATIVE_NOTIFICATION_CHANNEL_ID,
    name: 'Flixer',
    description: 'Notifications from Flixer',
    importance: 4,
  })
}

export async function setNativeAppBadge(count: number): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  const { isSupported } = await Badge.isSupported()
  if (!isSupported) return
  await Badge.set({ count: Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0 })
}

export function newNotificationsSince(previousIds: ReadonlySet<string>, current: AppNotification[]): AppNotification[] {
  return current.filter((notification) => !previousIds.has(notification.id))
}

export function localNotificationId(id: string): number {
  let hash = 0
  for (let index = 0; index < id.length; index++) {
    hash = (Math.imul(hash, 31) + id.charCodeAt(index)) | 0
  }
  return hash & 0x7fffffff || 1
}

export function toLocalNotification(notification: AppNotification): LocalNotificationSchema {
  return {
    id: localNotificationId(notification.id),
    title: notification.title,
    body: notification.body,
    schedule: { at: new Date(Date.now() + 500) },
    extra: { notificationId: notification.id, url: notification.url },
    ...(Capacitor.getPlatform() === 'android' ? { channelId: NATIVE_NOTIFICATION_CHANNEL_ID } : {}),
  }
}

export async function showNativeNotifications(notifications: AppNotification[]): Promise<void> {
  if (notifications.length === 0) return
  await LocalNotifications.schedule({
    notifications: notifications.map(toLocalNotification),
  })
}
