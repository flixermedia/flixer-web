import { computed, ref } from 'vue'
import { domToJpeg } from 'modern-screenshot'
import { getAccessToken } from '../api/client'
import { i18n } from '../i18n'
import {
  endSupportSession,
  fetchSupportAttachmentBlobUrl,
  getCloudStatus,
  getSupportDiagnostics,
  getSupportMessages,
  sendSupportMessage,
  syncCloudEntitlements,
  type CloudEntitlementStatus,
  type SupportChatMessage,
} from '../api/cloud'
import { buildApiWebSocketUrl } from '../platform/serverConnection'
import { notify } from './notify'
import { playChime, unlockAudio } from './useChat'
import { describeRequestError } from './useProfile'
import { catchError } from '../utils/catchError'

const RECONNECT_DELAY_MS = 3000
const STORAGE_OPEN_KEY = 'flixer:priority-support-open'
const STORAGE_MINIMIZED_KEY = 'flixer:priority-support-minimized'
const STORAGE_HAD_ROOM_KEY = 'flixer:priority-support-had-room'

function readStorageFlag(key: string): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function writeStorageFlag(key: string, value: boolean): void {
  try {
    if (typeof localStorage === 'undefined') return
    if (value) {
      localStorage.setItem(key, '1')
    } else {
      localStorage.removeItem(key)
    }
  } catch {
    // ignore storage errors
  }
}

const isOpen = ref(false)
const isMinimized = ref(false)
const status = ref<CloudEntitlementStatus | null>(null)
const messages = ref<SupportChatMessage[]>([])
const roomOpen = ref(false)
const sessionEnded = ref(false)
const draft = ref('')
const isLoadingStatus = ref(false)
const isLoadingChat = ref(false)
const isSending = ref(false)
const isEndingChat = ref(false)
const isSyncing = ref(false)
const isAttaching = ref(false)
const isCapturingScreenshot = ref(false)
const pendingScreenshot = ref<{ dataUrl: string; name: string } | null>(null)
const attachmentUrls = ref<Record<string, string>>({})
const pendingAttachmentLoads = new Set<string>()
const chatError = ref('')
const unreadCount = ref(0)
const wsConnected = ref(false)

let socket: WebSocket | null = null
let reconnectTimer: number | null = null
let hasLoadedInitialMessages = false
let hadActiveRoom = readStorageFlag(STORAGE_HAD_ROOM_KEY)

const hasPrioritySupport = computed(() => {
  const s = status.value
  return Boolean(s?.connected && !s.stale && s.features.includes('priority_support'))
})

function clearReconnectTimer() {
  if (reconnectTimer !== null) {
    window.clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
}

function disconnectSocket() {
  clearReconnectTimer()
  wsConnected.value = false
  if (socket) {
    socket.onopen = null
    socket.onmessage = null
    socket.onerror = null
    socket.onclose = null
    socket.close()
    socket = null
  }
}

function handleSessionEnded(byUser = false) {
  if (byUser) {
    if (!isOpen.value && !roomOpen.value && !hadActiveRoom && messages.value.length === 0) {
      return
    }
    hadActiveRoom = false
    hasLoadedInitialMessages = false
    sessionEnded.value = false
    messages.value = []
    roomOpen.value = false
    pendingScreenshot.value = null
    draft.value = ''
    closeChat()
    notify.info(i18n.global.t('admin.prioritySupport.sessionEnded'))
    return
  }

  if (sessionEnded.value) {
    return
  }
  hadActiveRoom = false
  hasLoadedInitialMessages = false
  roomOpen.value = false
  sessionEnded.value = true
  pendingScreenshot.value = null
  writeStorageFlag(STORAGE_HAD_ROOM_KEY, false)
  if (isOpen.value) {
    playChime()
    notify.info(i18n.global.t('admin.prioritySupport.sessionEnded'))
  }
}

function startNewSession() {
  sessionEnded.value = false
  hadActiveRoom = false
  hasLoadedInitialMessages = false
  messages.value = []
  pendingScreenshot.value = null
  draft.value = ''
}

function downloadTranscript() {
  const lines: string[] = [
    i18n.global.t('admin.prioritySupport.transcriptTitle'),
    `Exported: ${new Date().toLocaleString()}`,
    '',
  ]
  for (const msg of messages.value) {
    const time = msg.timestamp ? new Date(msg.timestamp).toLocaleString() : ''
    const header = time ? `[${time}] ${msg.senderName}:` : `${msg.senderName}:`
    lines.push(header)
    if (msg.text) {
      lines.push(msg.text)
    }
    if (msg.attachments?.length) {
      for (const att of msg.attachments) {
        lines.push(`[Attachment: ${att.name}]`)
      }
    }
    lines.push('')
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `flixer-support-transcript-${new Date().toISOString().slice(0, 10)}.txt`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function applyMessagesUpdate(nextRoom: { rid: string; open: boolean } | null, nextMessages: SupportChatMessage[]) {
  const isNowOpen = Boolean(nextRoom?.open)
  if (hadActiveRoom && !isNowOpen) {
    handleSessionEnded(false)
    return
  }
  if (isNowOpen) {
    hadActiveRoom = true
    sessionEnded.value = false
    writeStorageFlag(STORAGE_HAD_ROOM_KEY, true)
  }

  const prevIds = new Set(messages.value.map((m) => m.id))
  const newAgentCount = nextMessages.filter((m) => m.sender === 'agent' && !prevIds.has(m.id)).length
  messages.value = nextMessages
  roomOpen.value = isNowOpen
  if (hasLoadedInitialMessages && newAgentCount > 0) {
    playChime()
    if (isMinimized.value) {
      unreadCount.value += newAgentCount
    }
  }
  hasLoadedInitialMessages = true
}

function connectSocket() {
  if (!isOpen.value || !hasPrioritySupport.value) return
  const token = getAccessToken()
  if (!token) return
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return
  }

  clearReconnectTimer()
  if (messages.value.length === 0) {
    isLoadingChat.value = true
  }

  const ws = new WebSocket(buildApiWebSocketUrl('/cloud/support/live'))
  socket = ws

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'auth', token }))
  }

  ws.onmessage = (event) => {
    let data: {
      type?: string
      reason?: string
      room?: { rid: string; open: boolean } | null
      messages?: SupportChatMessage[]
      message?: SupportChatMessage | string
    }
    try {
      data = JSON.parse(String(event.data))
    } catch {
      return
    }

    if (data.type === 'ready' || data.type === 'state') {
      wsConnected.value = true
      isLoadingChat.value = false
      chatError.value = ''
      if (Array.isArray(data.messages)) {
        applyMessagesUpdate(data.room ?? null, data.messages)
      }
      return
    }

    if (data.type === 'message' && data.message && typeof data.message === 'object') {
      const incoming = data.message as SupportChatMessage
      if (!messages.value.some((m) => m.id === incoming.id)) {
        applyMessagesUpdate(data.room ?? null, [...messages.value, incoming])
      }
      return
    }

    if (data.type === 'closed') {
      handleSessionEnded(data.reason === 'user')
      return
    }

    if (data.type === 'error' && typeof data.message === 'string') {
      if (data.message.includes('Could not reach')) {
        chatError.value = i18n.global.t('admin.prioritySupport.serviceUnavailable')
      } else if (data.message.includes('No support agents')) {
        chatError.value = i18n.global.t('admin.prioritySupport.noAgentsAvailable')
      } else {
        chatError.value = data.message
      }
    }
  }

  ws.onerror = () => {
    wsConnected.value = false
  }

  ws.onclose = () => {
    wsConnected.value = false
    isLoadingChat.value = false
    socket = null
    if (isOpen.value && hasPrioritySupport.value) {
      reconnectTimer = window.setTimeout(() => {
        connectSocket()
      }, RECONNECT_DELAY_MS)
    }
  }
}

async function fetchMessages(silent = false) {
  if (!hasPrioritySupport.value) return
  if (!silent) isLoadingChat.value = true
  try {
    const [error, data] = await catchError(getSupportMessages())
    if (error) {
      chatError.value = describeRequestError(error, i18n.global.t('admin.prioritySupport.loadMessagesFailed'))
      return
    }
    chatError.value = ''
    if (data) {
      applyMessagesUpdate(data.room, data.messages)
    }
  } finally {
    if (!silent) isLoadingChat.value = false
  }
}

async function refreshStatus() {
  isLoadingStatus.value = true
  try {
    const [error, data] = await catchError(getCloudStatus())
    if (error) {
      notify.error(describeRequestError(error, i18n.global.t('admin.cloud.loadFailed')))
      return
    }
    if (data) {
      status.value = data
    }
  } finally {
    isLoadingStatus.value = false
  }
}

async function syncNow() {
  isSyncing.value = true
  try {
    const [error, data] = await catchError(syncCloudEntitlements())
    if (error) {
      notify.error(describeRequestError(error, i18n.global.t('admin.cloud.syncFailed')))
      return
    }
    if (data) {
      status.value = data
      if (hasPrioritySupport.value) {
        notify.success(i18n.global.t('admin.prioritySupport.unlocked'))
      } else {
        notify.info(i18n.global.t('admin.prioritySupport.notActiveOnAccount'))
      }
    }
  } finally {
    isSyncing.value = false
  }
}

async function openChat(minimized = false) {
  const shouldMinimize = minimized === true
  unlockAudio()
  if (!status.value) {
    await refreshStatus()
  }
  if (!hasPrioritySupport.value) {
    writeStorageFlag(STORAGE_OPEN_KEY, false)
    writeStorageFlag(STORAGE_MINIMIZED_KEY, false)
    writeStorageFlag(STORAGE_HAD_ROOM_KEY, false)
    return
  }
  isOpen.value = true
  isMinimized.value = shouldMinimize
  unreadCount.value = 0
  writeStorageFlag(STORAGE_OPEN_KEY, true)
  writeStorageFlag(STORAGE_MINIMIZED_KEY, shouldMinimize)
  connectSocket()
}

async function restoreOpenChat() {
  if (isOpen.value) return
  if (readStorageFlag(STORAGE_OPEN_KEY)) {
    await openChat(readStorageFlag(STORAGE_MINIMIZED_KEY))
    return
  }
  if (!status.value) {
    await refreshStatus()
  }
  if (!hasPrioritySupport.value) return
  const [error, data] = await catchError(getSupportMessages())
  if (error || !data?.room?.open) return
  applyMessagesUpdate(data.room, data.messages)
  await openChat(readStorageFlag(STORAGE_MINIMIZED_KEY))
}

function closeChat() {
  if (sessionEnded.value) {
    sessionEnded.value = false
    messages.value = []
    hasLoadedInitialMessages = false
  }
  isOpen.value = false
  isMinimized.value = false
  unreadCount.value = 0
  hadActiveRoom = false
  writeStorageFlag(STORAGE_OPEN_KEY, false)
  writeStorageFlag(STORAGE_MINIMIZED_KEY, false)
  writeStorageFlag(STORAGE_HAD_ROOM_KEY, false)
  disconnectSocket()
}

async function endChat() {
  if (isEndingChat.value) return
  if (!roomOpen.value) {
    closeChat()
    return
  }
  isEndingChat.value = true
  try {
    const [error] = await catchError(endSupportSession())
    if (error) {
      notify.error(describeRequestError(error, i18n.global.t('admin.prioritySupport.endChatFailed')))
      return
    }
    handleSessionEnded(true)
  } finally {
    isEndingChat.value = false
  }
}

function toggleMinimize() {
  isMinimized.value = !isMinimized.value
  writeStorageFlag(STORAGE_MINIMIZED_KEY, isMinimized.value)
  if (!isMinimized.value) {
    unreadCount.value = 0
  }
}

async function attachDiagnostics(openWindow = false) {
  if (openWindow) {
    await openChat()
  }
  isAttaching.value = true
  try {
    const [error, diag] = await catchError(getSupportDiagnostics())
    if (error) {
      notify.error(describeRequestError(error, i18n.global.t('admin.prioritySupport.diagnosticsFailed')))
      return
    }
    if (diag?.formattedText) {
      draft.value = draft.value.trim()
        ? `${draft.value.trim()}\n\n${diag.formattedText}`
        : diag.formattedText
    }
  } finally {
    isAttaching.value = false
  }
}

function resolveAttachmentUrl(rawUrl: string): string {
  if (!rawUrl || rawUrl.startsWith('data:') || rawUrl.startsWith('blob:')) {
    return rawUrl
  }
  const existing = attachmentUrls.value[rawUrl]
  if (existing) {
    return existing
  }
  if (rawUrl.startsWith('/file-upload/') && !pendingAttachmentLoads.has(rawUrl)) {
    pendingAttachmentLoads.add(rawUrl)
    void fetchSupportAttachmentBlobUrl(rawUrl)
      .then((objectUrl) => {
        attachmentUrls.value = { ...attachmentUrls.value, [rawUrl]: objectUrl }
      })
      .catch(() => {
        pendingAttachmentLoads.delete(rawUrl)
      })
  }
  return ''
}

function clearScreenshot() {
  pendingScreenshot.value = null
}

async function captureScreenshot() {
  if (isCapturingScreenshot.value || isSending.value) return
  isCapturingScreenshot.value = true
  try {
    const bgColor = getComputedStyle(document.body).backgroundColor || '#080811'
    const dataUrl = await domToJpeg(document.documentElement, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: bgColor === 'rgba(0, 0, 0, 0)' ? '#080811' : bgColor,
      quality: 0.85,
      scale: Math.min(window.devicePixelRatio || 1, 1.5),
      style: {
        marginTop: `-${window.scrollY}px`,
        marginLeft: `-${window.scrollX}px`,
      },
      filter: (node) => !(node instanceof HTMLElement && node.dataset.prioritySupportChat === 'true'),
    })
    pendingScreenshot.value = {
      dataUrl,
      name: `flixer-screenshot-${Date.now()}.jpg`,
    }
  } catch (error) {
    notify.error(describeRequestError(error, i18n.global.t('admin.prioritySupport.screenshotFailed')))
  } finally {
    isCapturingScreenshot.value = false
  }
}

async function sendMessage() {
  unlockAudio()
  const text = draft.value.trim()
  const screenshot = pendingScreenshot.value
  if ((!text && !screenshot) || isSending.value) return
  isSending.value = true
  try {
    if (!screenshot && socket && socket.readyState === WebSocket.OPEN && wsConnected.value) {
      socket.send(JSON.stringify({ type: 'send', message: text }))
      draft.value = ''
      return
    }

    const [error, data] = await catchError(sendSupportMessage(text, screenshot ?? undefined))
    if (error) {
      notify.error(describeRequestError(error, i18n.global.t('admin.prioritySupport.sendFailed')))
      return
    }
    draft.value = ''
    pendingScreenshot.value = null
    if (data?.message) {
      if (screenshot && data.message.attachments?.length) {
        for (const att of data.message.attachments) {
          if (att.url.startsWith('/file-upload/') && !attachmentUrls.value[att.url]) {
            attachmentUrls.value = { ...attachmentUrls.value, [att.url]: screenshot.dataUrl }
          }
        }
      }
      if (!messages.value.some((m) => m.id === data.message.id)) {
        applyMessagesUpdate(data.room, [...messages.value, data.message])
      }
    } else {
      await fetchMessages(true)
    }
  } finally {
    isSending.value = false
  }
}

export function usePrioritySupportChat() {
  return {
    isOpen,
    isMinimized,
    status,
    messages,
    roomOpen,
    sessionEnded,
    draft,
    isLoadingStatus,
    isLoadingChat,
    isSending,
    isEndingChat,
    isSyncing,
    isAttaching,
    isCapturingScreenshot,
    pendingScreenshot,
    chatError,
    unreadCount,
    wsConnected,
    hasPrioritySupport,
    refreshStatus,
    syncNow,
    openChat,
    restoreOpenChat,
    closeChat,
    endChat,
    startNewSession,
    downloadTranscript,
    toggleMinimize,
    fetchMessages,
    attachDiagnostics,
    captureScreenshot,
    clearScreenshot,
    resolveAttachmentUrl,
    sendMessage,
  }
}
