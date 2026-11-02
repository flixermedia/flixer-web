import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
export const NATIVE_NOTIFICATION_CHANNEL_ID = 'flixer-notifications';
export const NATIVE_NOTIFICATIONS_ENABLED_KEY = 'flixer.nativeNotificationsEnabled';
export function supportsNativeLocalNotifications() {
    return Capacitor.isNativePlatform();
}
export async function checkNativeNotificationPermission() {
    return LocalNotifications.checkPermissions();
}
export async function requestNativeNotificationPermission() {
    return LocalNotifications.requestPermissions();
}
export async function prepareNativeNotifications() {
    if (Capacitor.getPlatform() !== 'android')
        return;
    await LocalNotifications.createChannel({
        id: NATIVE_NOTIFICATION_CHANNEL_ID,
        name: 'Flixer',
        description: 'Notifications from Flixer',
        importance: 4,
    });
}
export function newNotificationsSince(previousIds, current) {
    return current.filter((notification) => !previousIds.has(notification.id));
}
export function localNotificationId(id) {
    let hash = 0;
    for (let index = 0; index < id.length; index++) {
        hash = (Math.imul(hash, 31) + id.charCodeAt(index)) | 0;
    }
    return hash & 0x7fffffff || 1;
}
export function toLocalNotification(notification) {
    return {
        id: localNotificationId(notification.id),
        title: notification.title,
        body: notification.body,
        schedule: { at: new Date(Date.now() + 500) },
        extra: { notificationId: notification.id, url: notification.url },
        ...(Capacitor.getPlatform() === 'android' ? { channelId: NATIVE_NOTIFICATION_CHANNEL_ID } : {}),
    };
}
export async function showNativeNotifications(notifications) {
    if (notifications.length === 0)
        return;
    await LocalNotifications.schedule({
        notifications: notifications.map(toLocalNotification),
    });
}
