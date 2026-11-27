import { computed, ref } from 'vue'
import {
  getChatConversation,
  getChatConversations,
  getChatMessages,
  markChatRead,
  sendChatMessage,
  startDirectChat,
  type ChatConversation,
  type ChatMessage,
  type ChatMessageWithSequence,
} from '../api'
import { decryptChatMessages, sendEncryptedChatMessage } from './chatMlsClient'
import { notify } from './notify'
import { conversationTitle, maybeChimeForMessage, onChatEvent, useChatUnread } from './useChat'
import { useNotificationPreferences } from './useNotificationPreferences'
import { describeRequestError, useProfile } from './useProfile'
import { catchError } from '../utils/catchError'
import { runOptimistic } from '../utils/optimistic'

const STORAGE_CONVERSATION_KEY = 'flixer_floating_user_chat_id'
const STORAGE_MINIMIZED_KEY = 'flixer_floating_user_chat_minimized'

export type FloatingChatItem = ChatMessageWithSequence & { renderKey?: string }

const isOpen = ref(false)
const isMinimized = ref(false)
const conversation = ref<ChatConversation | null>(null)
const messages = ref<FloatingChatItem[]>([])
const draft = ref('')
const isLoading = ref(false)
const loadingEarlier = ref(false)
const hasMore = ref(false)
const isSending = ref(false)
const error = ref('')
const unreadCount = ref(0)
const toastedMessageIds = new Set<string>()

async function showIncomingMessageToast(conversationId: string, msg: ChatMessage): Promise<void> {
  if (msg.kind !== 'text') return
  if (toastedMessageIds.has(msg.id)) return
  if (!useNotificationPreferences().preferences.value.chatToasts) return
  toastedMessageIds.add(msg.id)
  if (toastedMessageIds.size > 500) {
    const oldest = toastedMessageIds.values().next().value
    if (oldest) toastedMessageIds.delete(oldest)
  }
  const { profile } = useProfile()
  const who = msg.sender?.displayName || msg.sender?.username || 'New message'
  let preview = 'Sent you a message'
  if ((msg as ChatMessage & { encrypted?: boolean }).encrypted !== true) {
    preview = msg.body
  } else if (profile.value?.id) {
    try {
      const dec = await decryptChatMessages(profile.value.id, conversationId, [msg], false, false)
      const text = dec.messages.get(msg.id)
      if (text) preview = text
    } catch {
      // Keep safe fallback preview
    }
  }
  notify.message(`${who}: ${preview}`, {
    onClick: () => {
      void openConversation(conversationId, false)
    },
  })
}

let eventUnsubscribe: (() => void) | null = null
let widgetPollTimer: ReturnType<typeof setInterval> | null = null
let restored = false

function writeStorage(key: string, value: string | null) {
  if (typeof window === 'undefined') return
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, value)
  } catch {
    // Ignore storage quota or private browsing errors
  }
}

function readStorage(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

async function resolveMessages(conv: ChatConversation, raw: ChatMessageWithSequence[]): Promise<ChatMessageWithSequence[]> {
  if (!raw.some((m) => m.encrypted === true)) return raw
  const { profile, load: loadProfile } = useProfile()
  if (!profile.value?.id) await loadProfile()
  const userId = profile.value?.id
  if (!userId) {
    return raw.map((m) => (m.encrypted === true ? { ...m, body: 'Encrypted message unavailable on this device.' } : m))
  }
  try {
    const result = await decryptChatMessages(userId, conv.id, raw)
    return raw.map((m) => {
      if (m.encrypted !== true) return m
      const plaintext = result.messages.get(m.id)
      if (plaintext !== undefined) return { ...m, body: plaintext }
      return { ...m, body: 'Encrypted message unavailable on this device.' }
    })
  } catch (err) {
    console.error('[floating chat] failed to decrypt messages', err)
    return raw.map((m) => (m.encrypted === true ? { ...m, body: 'Encrypted message unavailable on this device.' } : m))
  }
}

async function openConversation(conversationId: string, minimized = false, markRead = true) {
  error.value = ''
  isOpen.value = true
  isMinimized.value = minimized
  isLoading.value = true
  if (markRead && !minimized) unreadCount.value = 0
  writeStorage(STORAGE_CONVERSATION_KEY, conversationId)
  writeStorage(STORAGE_MINIMIZED_KEY, minimized ? '1' : '0')

  try {
    const [convErr, conv] = await catchError(getChatConversation(conversationId))
    if (convErr || !conv) {
      error.value = convErr ? describeRequestError(convErr) : 'Unable to load conversation.'
      return
    }
    conversation.value = conv
    const [msgErr, msgRes] = await catchError(getChatMessages(conversationId, { limit: 20 }))
    if (msgErr || !msgRes) {
      error.value = msgErr ? describeRequestError(msgErr) : 'Unable to load messages.'
      return
    }
    messages.value = await resolveMessages(conv, msgRes.messages)
    hasMore.value = msgRes.hasMore
    if (markRead && !minimized) {
      await catchError(markChatRead(conversationId))
      void useChatUnread().refresh()
    }
  } finally {
    isLoading.value = false
  }
}

async function loadEarlier() {
  const conv = conversation.value
  const first = messages.value[0]
  if (!conv || !first || !hasMore.value || loadingEarlier.value) return
  loadingEarlier.value = true
  try {
    const [msgErr, msgRes] = await catchError(
      getChatMessages(conv.id, { beforeSequence: first.sequence, limit: 20 }),
    )
    if (msgErr || !msgRes) return
    const resolved = await resolveMessages(conv, msgRes.messages)
    const seen = new Set(messages.value.map((m) => m.id))
    const older = resolved.filter((m) => !seen.has(m.id))
    messages.value = [...older, ...messages.value]
    hasMore.value = msgRes.hasMore
  } finally {
    loadingEarlier.value = false
  }
}

async function startDirectWith(username: string) {
  const [err, conv] = await catchError(startDirectChat(username))
  if (err || !conv) {
    error.value = err ? describeRequestError(err) : 'Unable to start chat.'
    return
  }
  await openConversation(conv.id, false)
}

function closeChat() {
  isOpen.value = false
  isMinimized.value = false
  unreadCount.value = 0
  conversation.value = null
  messages.value = []
  error.value = ''
  writeStorage(STORAGE_CONVERSATION_KEY, null)
  writeStorage(STORAGE_MINIMIZED_KEY, null)
}

function toggleMinimize() {
  if (!isOpen.value) return
  isMinimized.value = !isMinimized.value
  writeStorage(STORAGE_MINIMIZED_KEY, isMinimized.value ? '1' : '0')
  if (!isMinimized.value && conversation.value) {
    unreadCount.value = 0
    void catchError(markChatRead(conversation.value.id)).then(() => useChatUnread().refresh())
  }
}

async function sendMessage() {
  const conv = conversation.value
  const body = draft.value.trim()
  const { profile } = useProfile()
  const userId = profile.value?.id
  if (!conv || !body || isSending.value) return

  const tempId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const optimisticMsg: FloatingChatItem = {
    id: tempId,
    renderKey: tempId,
    conversationId: conv.id,
    kind: 'text',
    body,
    createdAt: new Date().toISOString(),
    sequence: `${Date.now()}`,
    encrypted: conv.encryptionMode === 'encrypted',
    sender: {
      username: profile.value?.username ?? '',
      displayName: profile.value?.displayName ?? profile.value?.username ?? 'You',
    },
  } as FloatingChatItem

  isSending.value = true
  error.value = ''
  try {
    await runOptimistic({
      key: `floating-chat:send:${conv.id}:${tempId}`,
      apply: () => {
        messages.value = [...messages.value, optimisticMsg]
        draft.value = ''
        return body
      },
      commit: async () => {
        let sent: FloatingChatItem
        if (conv.encryptionMode === 'encrypted') {
          if (!userId) throw new Error('Encryption is unavailable.')
          const result = await sendEncryptedChatMessage(userId, conv.id, body)
          sent = { ...result.message, body: result.plaintext, renderKey: tempId }
        } else {
          sent = { ...(await sendChatMessage(conv.id, body, false)), renderKey: tempId }
        }
        const alreadyHasReal = messages.value.some((m) => m.id === sent.id)
        messages.value = alreadyHasReal
          ? messages.value.filter((m) => m.id !== tempId)
          : messages.value.map((m) => (m.id === tempId ? sent : m))
      },
      rollback: (prevDraft) => {
        messages.value = messages.value.filter((m) => m.id !== tempId)
        if (!draft.value) draft.value = prevDraft
      },
      onError: (err) => {
        error.value = describeRequestError(err)
      },
    })
  } finally {
    isSending.value = false
  }
}

function ensureEvents(isOnChatPage: () => boolean) {
  if (eventUnsubscribe) return
  const chatUnread = useChatUnread()
  chatUnread.start()
  chatUnread.ensureConnected()
  const { profile } = useProfile()
  if (!widgetPollTimer && typeof window !== 'undefined') {
    widgetPollTimer = setInterval(async () => {
      if (isOnChatPage() || !isOpen.value || !conversation.value || document.hidden || isLoading.value || isSending.value) return
      const activeConv = conversation.value
      const last = [...messages.value].reverse().find((m) => !m.id.startsWith('optimistic-'))
      const [msgErr, msgRes] = await catchError(
        getChatMessages(activeConv.id, last ? { afterSequence: last.sequence } : { limit: 20 }),
      )
      if (msgErr || !msgRes || !msgRes.messages.length) return
      const resolved = await resolveMessages(activeConv, msgRes.messages)
      const seen = new Set(messages.value.map((m) => m.id))
      const incoming = resolved.filter((m) => !seen.has(m.id))
      if (!incoming.length) return
      messages.value = [...messages.value, ...incoming]
      if (incoming.some((m) => m.kind === 'system')) {
        const [convErr, updatedConv] = await catchError(getChatConversation(activeConv.id))
        if (!convErr && updatedConv) conversation.value = updatedConv
      }
      const hasFromOther = incoming.some((m) => m.sender?.username !== profile.value?.username)
      if (hasFromOther) {
        const latestOther = [...incoming].reverse().find((m) => m.sender?.username !== profile.value?.username)
        if (latestOther) maybeChimeForMessage(latestOther, !isMinimized.value && !document.hidden)
      }
      if (isMinimized.value && hasFromOther) {
        unreadCount.value += incoming.filter((m) => m.sender?.username !== profile.value?.username).length
      }
    }, 4_000)
  }
  eventUnsubscribe = onChatEvent(async (event) => {
    const activeConv = conversation.value
    if (event.type === 'deleted' && isOpen.value && activeConv && event.conversationId === activeConv.id) {
      closeChat()
      return
    }
    if (isOnChatPage()) return
    if (event.type === 'changed' && isOpen.value && activeConv && event.conversationId === activeConv.id) {
      const [msgErr, msgRes] = await catchError(getChatMessages(activeConv.id, { limit: 20 }))
      if (msgErr) {
        closeChat()
        return
      }
      if (msgRes) {
        messages.value = await resolveMessages(activeConv, msgRes.messages)
      }
      return
    }
    if (event.type === 'resync') {
      if (isOpen.value && !isMinimized.value) return
      const [convErr, convData] = await catchError(getChatConversations())
      if (convErr || !convData) return
      const newest = convData.conversations
        .filter((c) => c.unread > 0 && c.lastMessage && c.lastMessage.kind === 'text' && c.lastMessage.sender?.username !== profile.value?.username)
        .sort((a, b) => new Date(b.lastMessage!.createdAt).getTime() - new Date(a.lastMessage!.createdAt).getTime())[0]
      if (newest?.lastMessage) {
        await showIncomingMessageToast(newest.id, newest.lastMessage)
      }
      return
    }
    if (event.type !== 'message') return
    const isFromOther = event.message.sender?.username !== profile.value?.username
    if (isOpen.value && activeConv && event.conversationId === activeConv.id) {
      if (!isFromOther && messages.value.some((m) => m.id.startsWith('optimistic-'))) {
        return
      }
      if (!messages.value.some((m) => m.id === event.message.id)) {
        const [decrypted] = await resolveMessages(activeConv, [event.message])
        messages.value = [...messages.value, decrypted ?? event.message]
        if (event.message.kind === 'system') {
          const [convErr, updatedConv] = await catchError(getChatConversation(activeConv.id))
          if (!convErr && updatedConv) conversation.value = updatedConv
        }
      }
      if (isMinimized.value && isFromOther) {
        unreadCount.value += 1
        await showIncomingMessageToast(event.conversationId, event.message)
      } else if (!isMinimized.value && !isFromOther) {
        void catchError(markChatRead(activeConv.id)).then(() => useChatUnread().refresh())
      }
      return
    }
    if (isFromOther && event.message.kind === 'text') {
      await showIncomingMessageToast(event.conversationId, event.message)
    }
  })
}

async function restoreOpenChat(isOnChatPage: () => boolean) {
  ensureEvents(isOnChatPage)
  if (restored) return
  restored = true
  const savedId = readStorage(STORAGE_CONVERSATION_KEY)
  if (!savedId) return
  const [err, conv] = await catchError(getChatConversation(savedId))
  if (err || !conv) {
    writeStorage(STORAGE_CONVERSATION_KEY, null)
    writeStorage(STORAGE_MINIMIZED_KEY, null)
    return
  }
  await openConversation(conv.id, readStorage(STORAGE_MINIMIZED_KEY) === '1')
}

export function useFloatingUserChat() {
  const { profile } = useProfile()
  const title = computed(() =>
    conversation.value ? conversationTitle(conversation.value, profile.value?.username) : 'Messages',
  )
  return {
    isOpen,
    isMinimized,
    conversation,
    title,
    messages,
    draft,
    isLoading,
    loadingEarlier,
    hasMore,
    isSending,
    error,
    unreadCount,
    openConversation,
    loadEarlier,
    startDirectWith,
    closeChat,
    toggleMinimize,
    sendMessage,
    restoreOpenChat,
  }
}
