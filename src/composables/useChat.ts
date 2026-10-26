import { computed, ref } from 'vue'
import { getAccessToken, getChatUnread, type ChatConversation, type ChatMessage } from '../api'
import { useNotifications } from './useNotifications'
import { useProfile } from './useProfile'

export type ChatEvent = { type: 'message'; conversationId: string; message: ChatMessage } | { type: 'changed'; conversationId: string } | { type: 'resync' }

const unread = ref(0)
/** Conversation currently open and visible in the chat page; its messages don't alert. */
export const viewingChat = ref<string | null>(null)
const MAX_BACKOFF_MS = 15_000
const CLOSE_UNAUTHORIZED = 4401
const handlers = new Set<(event: ChatEvent) => void>()
let users = 0
let socket: WebSocket | null = null
let retryTimer: ReturnType<typeof setTimeout> | undefined
let attempts = 0
let connectedBefore = false
let audioContext: AudioContext | null = null

/** Subscribes to realtime chat events; returns an unsubscribe function. */
export function onChatEvent(handler: (event: ChatEvent) => void): () => void {
  handlers.add(handler)
  return () => handlers.delete(handler)
}

function buildUrl(): string {
  const base: string = import.meta.env.VITE_API_BASE_URL || '/api'
  const path = `${base.replace(/\/$/, '')}/chat/live`
  if (/^https?:\/\//.test(path)) return path.replace(/^http/, 'ws')
  return `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}${path}`
}

function unlockAudio() {
  try {
    audioContext ??= new AudioContext()
    if (audioContext.state === 'suspended') void audioContext.resume()
  } catch {
    // Audio is unavailable; alerts stay silent.
  }
}

function playChime() {
  if (!audioContext || audioContext.state !== 'running') return
  const start = audioContext.currentTime
  for (const [offset, freq] of [
    [0, 880],
    [0.12, 1318.5],
  ] as const) {
    const osc = audioContext.createOscillator()
    const gain = audioContext.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, start + offset)
    gain.gain.exponentialRampToValueAtTime(0.18, start + offset + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.35)
    osc.connect(gain).connect(audioContext.destination)
    osc.start(start + offset)
    osc.stop(start + offset + 0.4)
  }
}

async function refreshUnread() {
  try {
    unread.value = await getChatUnread()
  } catch {
    // Keep the last known count; the next event or reconnect refreshes it.
  }
}

function handle(event: ChatEvent) {
  const self = useProfile().profile.value?.username
  if (event.type === 'message') {
    const mine = event.message.sender?.username === self
    const watching = viewingChat.value === event.conversationId && !document.hidden
    if (!mine && !watching && event.message.kind === 'text') {
      playChime()
      void useNotifications().refresh()
      void refreshUnread()
    }
  } else {
    void refreshUnread()
  }
  for (const handler of handlers) handler(event)
}

function connect() {
  const token = getAccessToken()
  if (!token || users === 0 || socket) return
  const ws = new WebSocket(buildUrl())
  socket = ws
  ws.onopen = () => ws.send(JSON.stringify({ type: 'auth', token }))
  ws.onmessage = (raw) => {
    let message: { type?: string }
    try {
      message = JSON.parse(String(raw.data))
    } catch {
      return
    }
    if (message.type === 'ready') {
      attempts = 0
      void refreshUnread()
      if (connectedBefore) for (const handler of handlers) handler({ type: 'resync' })
      connectedBefore = true
    } else if (message.type === 'message' || message.type === 'changed') {
      handle(message as ChatEvent)
    }
  }
  ws.onclose = (event) => {
    if (socket !== ws) return
    socket = null
    if (users === 0 || event.code === CLOSE_UNAUTHORIZED) return
    retryTimer = setTimeout(connect, Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attempts++))
  }
}

function disconnect() {
  clearTimeout(retryTimer)
  const ws = socket
  socket = null
  ws?.close()
  connectedBefore = false
  attempts = 0
}

/** The title shown for a conversation: the group name, or the other person in a direct chat. */
export function conversationTitle(conversation: ChatConversation, selfUsername: string | undefined): string {
  if (conversation.kind === 'group') return conversation.name ?? ''
  const other = conversation.members.find((member) => member.username !== selfUsername) ?? conversation.members[0]
  return other?.displayName ?? ''
}

/** Shared unread badge state. The socket stays open while at least one component uses it. */
export function useChatUnread() {
  function start() {
    users++
    if (users === 1) {
      window.addEventListener('pointerdown', unlockAudio, { passive: true })
      window.addEventListener('keydown', unlockAudio)
      connect()
    }
  }
  function stop() {
    users = Math.max(0, users - 1)
    if (users === 0) {
      window.removeEventListener('pointerdown', unlockAudio)
      window.removeEventListener('keydown', unlockAudio)
      disconnect()
    }
  }
  function set(count: number) {
    unread.value = Math.max(0, count)
  }
  return { unread: computed(() => unread.value), start, stop, refresh: refreshUnread, set }
}
