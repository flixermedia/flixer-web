import { beforeEach, describe, expect, it, vi } from 'vitest'
import { localNotificationId, newNotificationsSince, setNativeAppBadge, toLocalNotification } from './nativeNotifications.ts'
import type { AppNotification } from '../api/notifications'

const badgeMocks = vi.hoisted(() => ({
  isSupported: vi.fn(),
  set: vi.fn(),
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: () => 'ios',
    isNativePlatform: () => true,
  },
}))

vi.mock('@capawesome/capacitor-badge', () => ({
  Badge: {
    isSupported: badgeMocks.isSupported,
    set: badgeMocks.set,
  },
}))

const notification: AppNotification = {
  id: 'notice-1',
  kind: 'new_media',
  title: 'New on Flixer',
  body: 'A new title was added',
  url: '/movies',
  read: false,
  createdAt: '2026-11-01T12:00:00.000Z',
}

describe('native local notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    badgeMocks.isSupported.mockResolvedValue({ isSupported: true })
    badgeMocks.set.mockResolvedValue(undefined)
  })

  it('only treats notification IDs absent from the previous snapshot as new', () => {
    const another = { ...notification, id: 'notice-2' }
    expect(newNotificationsSince(new Set(['notice-1']), [notification, another])).toEqual([another])
  })

  it('creates stable, valid native notification identifiers', () => {
    const id = localNotificationId(notification.id)
    expect(id).toBe(localNotificationId(notification.id))
    expect(id).toBeGreaterThan(0)
    expect(id).toBeLessThanOrEqual(0x7fffffff)
  })

  it('preserves notification content and navigation metadata for the native alert', () => {
    expect(toLocalNotification(notification)).toMatchObject({
      id: localNotificationId(notification.id),
      title: notification.title,
      body: notification.body,
      extra: { notificationId: notification.id, url: notification.url },
    })
  })

  it('sets the supported app badge to the unread count', async () => {
    await setNativeAppBadge(3)

    expect(badgeMocks.set).toHaveBeenCalledWith({ count: 3 })
  })

  it('clears unsupported app badges without attempting a native update', async () => {
    badgeMocks.isSupported.mockResolvedValue({ isSupported: false })

    await setNativeAppBadge(3)

    expect(badgeMocks.set).not.toHaveBeenCalled()
  })
})
