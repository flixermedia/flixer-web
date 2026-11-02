import { describe, expect, it } from 'vitest';
import { localNotificationId, newNotificationsSince, toLocalNotification } from './nativeNotifications';
const notification = {
    id: 'notice-1',
    kind: 'new_media',
    title: 'New on Flixer',
    body: 'A new title was added',
    url: '/movies',
    read: false,
    createdAt: '2026-11-01T12:00:00.000Z',
};
describe('native local notifications', () => {
    it('only treats notification IDs absent from the previous snapshot as new', () => {
        const another = { ...notification, id: 'notice-2' };
        expect(newNotificationsSince(new Set(['notice-1']), [notification, another])).toEqual([another]);
    });
    it('creates stable, valid native notification identifiers', () => {
        const id = localNotificationId(notification.id);
        expect(id).toBe(localNotificationId(notification.id));
        expect(id).toBeGreaterThan(0);
        expect(id).toBeLessThanOrEqual(0x7fffffff);
    });
    it('preserves notification content and navigation metadata for the native alert', () => {
        expect(toLocalNotification(notification)).toMatchObject({
            id: localNotificationId(notification.id),
            title: notification.title,
            body: notification.body,
            extra: { notificationId: notification.id, url: notification.url },
        });
    });
});
