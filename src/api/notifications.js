/** Notification and push-subscription operations. */
import { api } from './client';
export async function listNotifications() {
    const response = await api.get('/notifications');
    return response.data;
}
export async function markNotificationsRead(ids) {
    const request = { ids };
    await api.post('/notifications/read', request);
}
export async function deleteNotification(id) {
    await api.delete(`/notifications/${encodeURIComponent(id)}`);
}
export async function getPushPublicKey() {
    const response = await api.get('/notifications/push/key');
    return response.data.publicKey;
}
export async function getPushStatus(endpoint) {
    const params = { endpoint };
    const response = await api.get('/notifications/push/status', { params });
    return response.data.subscribed;
}
export async function savePushSubscription(subscription) {
    await api.put('/notifications/push/subscription', subscription);
}
export async function removePushSubscription(endpoint) {
    const request = { endpoint };
    await api.post('/notifications/push/unsubscribe', request);
}
export async function sendAdminNotification(message) {
    const response = await api.post('/admin/notifications', message);
    return response.data;
}
export async function getNotificationConfig() {
    const response = await api.get('/notifications/config');
    return response.data;
}
