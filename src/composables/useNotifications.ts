import { computed, ref } from 'vue'
import {
  deleteNotification,
  getAccessToken,
  getNotificationConfig,
  getPushPublicKey,
  getPushStatus,
  listNotifications,
  markNotificationsRead,
  removePushSubscription,
  savePushSubscription,
  type AppNotification,
} from '../api'

const items = ref<AppNotification[]>([])
const unread = ref(0)
const isLoading = ref(false)
const pushEnabled = ref(false)
const pushBusy = ref(false)
const enabled = ref(true)
const promptMode = ref<'button' | 'load'>('button')
let promptedThisSession = false
const permission = ref<NotificationPermission>(typeof Notification === 'undefined' ? 'denied' : Notification.permission)

const pushSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && typeof Notification !== 'undefined'

function keyBytes(base64Url: string): Uint8Array<ArrayBuffer> {
  const padded = base64Url.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(base64Url.length / 4) * 4, '=')
  const raw = atob(padded)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

async function registration() {
  return navigator.serviceWorker.ready
}

async function loadConfig() {
  if (!getAccessToken()) return
  try {
    const config = await getNotificationConfig()
    enabled.value = config.enabled
    promptMode.value = config.permissionPrompt
  } catch {
    // Keep defaults.
  }
}

async function maybePromptOnLoad() {
  if (promptedThisSession || !enabled.value || promptMode.value !== 'load' || !pushSupported) return
  if (Notification.permission !== 'default' || pushEnabled.value) return
  promptedThisSession = true
  await enablePush()
}

async function refresh() {
  if (!getAccessToken()) return
  isLoading.value = true
  try {
    const result = await listNotifications()
    items.value = result.items
    unread.value = result.unread
  } catch {
    // The bell just keeps its last known state.
  } finally {
    isLoading.value = false
  }
}

async function refreshPushState() {
  if (!pushSupported || !getAccessToken()) return
  permission.value = Notification.permission
  try {
    const subscription = await (await registration()).pushManager.getSubscription()
    pushEnabled.value = subscription ? await getPushStatus(subscription.endpoint) : false
  } catch {
    pushEnabled.value = false
  }
}

async function enablePush(): Promise<boolean> {
  if (!pushSupported) return false
  pushBusy.value = true
  try {
    const result = await Notification.requestPermission()
    permission.value = result
    if (result !== 'granted') return false
    const reg = await registration()
    const existing = await reg.pushManager.getSubscription()
    const subscription = existing ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(await getPushPublicKey()) }))
    const json = subscription.toJSON()
    if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) return false
    await savePushSubscription({ endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } })
    pushEnabled.value = true
    return true
  } catch {
    return false
  } finally {
    pushBusy.value = false
  }
}

async function disablePush() {
  if (!pushSupported) return
  pushBusy.value = true
  try {
    const subscription = await (await registration()).pushManager.getSubscription()
    if (subscription) {
      await removePushSubscription(subscription.endpoint)
      await subscription.unsubscribe()
    }
    pushEnabled.value = false
  } catch {
    // Leave the state as it was; the user can retry.
  } finally {
    pushBusy.value = false
  }
}

async function markAllRead() {
  if (unread.value === 0) return
  items.value = items.value.map((item) => ({ ...item, read: true }))
  unread.value = 0
  try {
    await markNotificationsRead()
  } catch {
    await refresh()
  }
}

async function markRead(id: string) {
  const target = items.value.find((item) => item.id === id)
  if (!target || target.read) return
  target.read = true
  unread.value = Math.max(0, unread.value - 1)
  try {
    await markNotificationsRead([id])
  } catch {
    await refresh()
  }
}

async function dismiss(id: string) {
  const target = items.value.find((item) => item.id === id)
  items.value = items.value.filter((item) => item.id !== id)
  if (target && !target.read) unread.value = Math.max(0, unread.value - 1)
  try {
    await deleteNotification(id)
  } catch {
    await refresh()
  }
}

export function useNotifications() {
  return {
    items,
    unread,
    isLoading,
    hasUnread: computed(() => unread.value > 0),
    pushSupported,
    enabled,
    promptMode,
    loadConfig,
    maybePromptOnLoad,
    pushEnabled,
    pushBusy,
    permission,
    refresh,
    refreshPushState,
    enablePush,
    disablePush,
    markAllRead,
    markRead,
    dismiss,
  }
}
