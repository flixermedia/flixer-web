import { computed, ref } from 'vue'
import { AUTH_TOKEN_CHANGED_EVENT, getAccessToken, getChatUnread, postChatCallSignal, postChatPresence, type ChatConversation, type ChatMessageWithSequence } from '../api'
import { buildApiWebSocketUrl } from '../platform/serverConnection'
import { catchError } from '../utils/catchError'
import { useNotificationPreferences } from './useNotificationPreferences'
import { useNotifications } from './useNotifications.ts'
import { useProfile } from './useProfile'

export type ChatEvent =
  | { type: 'message'; conversationId: string; message: ChatMessageWithSequence }
  | { type: 'changed'; conversationId: string }
  | { type: 'deleted'; conversationId: string }
  | { type: 'resync' }

export interface ChatCallSignal {
  type: 'call-signal'
  conversationId: string
  callId: string
  from: string
  payload: string
}
export interface ChatCallError {
  type: 'call-error'
  callId?: string
  reason: 'rate-limited' | 'invalid' | 'unavailable'
}

export type PresenceStatus = 'online' | 'away' | 'offline'

const unread = ref(0)
const presenceByUsername = ref<Record<string, PresenceStatus>>({})
const chimedMessageIds = new Set<string>()
/** Conversation currently open and visible in the chat page; its messages don't alert. */
export const viewingChat = ref<string | null>(null)
const MAX_BACKOFF_MS = 15_000
const CLOSE_UNAUTHORIZED = 4401
const handlers = new Set<(event: ChatEvent) => void>()
const callHandlers = new Set<(event: ChatCallSignal | ChatCallError) => void>()
let users = 0
let socket: WebSocket | null = null
let socketReady = false
let retryTimer: ReturnType<typeof setTimeout> | undefined
let pollTimer: ReturnType<typeof setInterval> | undefined
let attempts = 0
let connectedBefore = false
const readyWaiters = new Set<() => void>()
let audioContext: AudioContext | null = null
const fallbackChime = typeof Audio === 'undefined' ? null : new Audio('/chat-chime.mp3')
let fallbackUnlocked = false
let fallbackUnlocking = false

if (fallbackChime) fallbackChime.preload = 'auto'

/** Subscribes to realtime chat events; returns an unsubscribe function. */
export function onChatEvent(handler: (event: ChatEvent) => void): () => void {
  handlers.add(handler)
  return () => handlers.delete(handler)
}

/** Subscribes to relayed call signalling; returns an unsubscribe function. */
export function onChatCallEvent(handler: (event: ChatCallSignal | ChatCallError) => void): () => void {
  callHandlers.add(handler)
  return () => callHandlers.delete(handler)
}

/** Ensures the realtime chat socket is open and authenticated, waiting up to `timeoutMs` if still connecting. */
export async function waitForChatSocket(timeoutMs = 3000): Promise<boolean> {
  if (socket?.readyState === WebSocket.OPEN && socketReady) return true
  if (users > 0 && (!socket || socket.readyState >= WebSocket.CLOSING)) {
    socket = null
    connect()
  }
  if (!socket) return false
  return await new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => {
      readyWaiters.delete(onReady)
      resolve(socket?.readyState === WebSocket.OPEN)
    }, timeoutMs)
    const onReady = () => {
      clearTimeout(timer)
      readyWaiters.delete(onReady)
      resolve(true)
    }
    readyWaiters.add(onReady)
  })
}
export function isChatSocketOpen(): boolean {
  return socket?.readyState === WebSocket.OPEN && socketReady
}

export function emitChatCallSignals(signals: ChatCallSignal[]): void {
  for (const signal of signals) {
    for (const handler of callHandlers) handler(signal)
  }
}

export function sendChatCallSignal(conversationId: string, callId: string, payload: string): boolean {
  if (!socket || socket.readyState !== WebSocket.OPEN) return false
  socket.send(JSON.stringify({ type: 'call-signal', conversationId, callId, payload }))
  return true
}

export async function sendChatCallSignalAsync(conversationId: string, callId: string, payload: string): Promise<boolean> {
  if (sendChatCallSignal(conversationId, callId, payload)) return true
  const [err] = await catchError(postChatCallSignal({ conversationId, callId, payload }))
  return !err
}

function buildUrl(): string {
  return buildApiWebSocketUrl('/chat/live')
}

export function getChatAudioContext(): AudioContext | null {
  try {
    if (typeof AudioContext !== 'undefined') {
      audioContext ??= new AudioContext()
      if (audioContext.state === 'suspended') void audioContext.resume().catch(() => undefined)
      return audioContext
    }
  } catch {
    return null
  }
  return null
}

export function unlockAudio() {
  try {
    if (typeof AudioContext !== 'undefined') {
      audioContext ??= new AudioContext()
      if (audioContext.state === 'suspended') void audioContext.resume().catch(unlockFallbackAudio)
    }
  } catch {
    unlockFallbackAudio()
  }
  if (!audioContext || audioContext.state !== 'running') unlockFallbackAudio()
}

function unlockFallbackAudio() {
  if (!fallbackChime || fallbackUnlocked || fallbackUnlocking) return
  fallbackUnlocking = true
  fallbackChime.muted = true
  void fallbackChime.play().then(() => {
    fallbackChime.pause()
    fallbackChime.currentTime = 0
    fallbackChime.muted = false
    fallbackUnlocked = true
  }).catch(() => {
    fallbackChime.muted = false
  }).finally(() => {
    fallbackUnlocking = false
  })
}

function playChimeNotes(ctx: AudioContext) {
  const start = ctx.currentTime
  for (const [offset, freq] of [
    [0, 880],
    [0.12, 1318.5],
  ] as const) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, start + offset)
    gain.gain.exponentialRampToValueAtTime(0.18, start + offset + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.35)
    osc.connect(gain).connect(ctx.destination)
    osc.start(start + offset)
    osc.stop(start + offset + 0.4)
  }
}

export function playChime() {
  const ctx = getChatAudioContext()
  if (ctx?.state === 'running') {
    playChimeNotes(ctx)
    return
  }
  if (ctx?.state === 'suspended') {
    void ctx.resume().then(() => {
      if (ctx.state === 'running') playChimeNotes(ctx)
    }).catch(() => {
      if (!fallbackChime) return
      fallbackChime.currentTime = 0
      void fallbackChime.play().catch(() => undefined)
    })
    return
  }
  if (!fallbackChime) return
  fallbackChime.currentTime = 0
  void fallbackChime.play().catch(() => undefined)
}

async function refreshUnread(notifyOnIncrease = false) {
  const [error, count] = await catchError(getChatUnread())
  if (error) return // Keep the last known count; the next event or reconnect refreshes it.
  const prev = unread.value
  unread.value = count
  if (notifyOnIncrease && count > prev && !document.hidden) {
    const { preferences } = useNotificationPreferences()
    if (preferences.value.chatChime) playChime()
    void useNotifications().refresh()
    for (const handler of handlers) handler({ type: 'resync' })
  }
}

/** Plays the incoming message chime once per message ID when allowed by the user's notification preferences. */
export function maybeChimeForMessage(message: { id: string; kind?: string; sender?: { username?: string | null } | null }, isWatchingOpenChat: boolean): void {
  if (message.kind && message.kind !== 'text') return
  const self = useProfile().profile.value?.username
  if (self && message.sender?.username === self) return
  if (chimedMessageIds.has(message.id)) return
  const { preferences } = useNotificationPreferences()
  const shouldChime = preferences.value.chatChime && (!isWatchingOpenChat || preferences.value.chatChimeWhileOpen)
  if (!shouldChime) return
  chimedMessageIds.add(message.id)
  if (chimedMessageIds.size > 500) {
    const oldest = chimedMessageIds.values().next().value
    if (oldest) chimedMessageIds.delete(oldest)
  }
  playChime()
}

function handle(event: ChatEvent) {
  const self = useProfile().profile.value?.username
  if (event.type === 'message') {
    const mine = event.message.sender?.username === self
    const watching = viewingChat.value === event.conversationId && !document.hidden
    if (!mine && event.message.kind === 'text') {
      maybeChimeForMessage(event.message, watching)
      if (!watching) {
        unread.value += 1
        void useNotifications().refresh()
        void refreshUnread()
      }
    }
  } else {
    void refreshUnread()
  }
  for (const handler of handlers) handler(event)
}

async function syncPresenceHttp(offline = false) {
  if (!getAccessToken()) return
  const [err, map] = await catchError(postChatPresence(offline ? { offline: true } : { active: !document.hidden }))
  if (!err && map) {
    presenceByUsername.value = map
  }
}

function sendPresence() {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'presence', active: !document.hidden }))
  }
  void syncPresenceHttp(false)
}

function connect() {
  const token = getAccessToken()
  if (!token || users === 0 || socket) return
  const ws = new WebSocket(buildUrl())
  socket = ws
  ws.onopen = () => ws.send(JSON.stringify({ type: 'auth', token, active: !document.hidden }))
  ws.onmessage = (raw) => {
    let message: { type?: string; presence?: Record<string, PresenceStatus>; username?: string; status?: PresenceStatus }
    try {
      message = JSON.parse(String(raw.data))
    } catch {
      return
    }
    if (message.type === 'ready') {
      attempts = 0
      socketReady = true
      for (const resolve of readyWaiters) resolve()
      readyWaiters.clear()
      if (message.presence) presenceByUsername.value = message.presence
      void refreshUnread()
      if (connectedBefore) for (const handler of handlers) handler({ type: 'resync' })
      connectedBefore = true
    } else if (message.type === 'presence' && message.username && message.status) {
      presenceByUsername.value = { ...presenceByUsername.value, [message.username]: message.status }
    } else if (message.type === 'message' || message.type === 'changed' || message.type === 'deleted') {
      handle(message as ChatEvent)
    } else if (message.type === 'call-signal' || message.type === 'call-error') {
      for (const handler of callHandlers) handler(message as ChatCallSignal | ChatCallError)
    }
  }
  ws.onclose = (event) => {
    if (socket !== ws) return
    socket = null
    socketReady = false
    if (users === 0) return
    if (event.code === CLOSE_UNAUTHORIZED) {
      // Access token may have expired; refreshUnread triggers the HTTP refresh interceptor.
      retryTimer = setTimeout(async () => {
        await refreshUnread()
        if (users > 0 && getAccessToken() && !socket) connect()
      }, 2_000)
      return
    }
    retryTimer = setTimeout(connect, Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attempts++))
  }
}

function disconnect() {
  clearTimeout(retryTimer)
  const ws = socket
  socket = null
  socketReady = false
  ws?.close()
  connectedBefore = false
  attempts = 0
}

function onTokenChanged() {
  if (users === 0) return
  if (getAccessToken()) {
    if (socket && socket.readyState < WebSocket.CLOSING) {
      socket.close()
    }
    socket = null
    socketReady = false
    connect()
  } else {
    disconnect()
  }
}

/** The title shown for a conversation: the group name, or the other person in a direct chat. */
export function conversationTitle(conversation: ChatConversation, selfUsername: string | undefined): string {
  if (conversation.kind === 'group') return conversation.name ?? ''
  const other = conversation.members.find((member) => member.username !== selfUsername) ?? conversation.members[0]
  return other?.displayName ?? ''
}

/** Returns the live presence status for a username (`online` = green, `away` = yellow, `offline` = red). */
export function getUserPresence(username?: string | null): PresenceStatus {
  if (!username) return 'offline'
  return presenceByUsername.value[username] ?? 'offline'
}

/** Maps a user presence status to its indicator dot color class. */
export function presenceDotClass(status: PresenceStatus): string {
  if (status === 'online') return 'bg-emerald-400'
  if (status === 'away') return 'bg-amber-400'
  return 'bg-red-500'
}

/** Shared unread badge state. The socket stays open while at least one component uses it. */
export function useChatUnread() {
  function start() {
    users++
    if (users === 1) {
      void useNotificationPreferences().load()
      window.addEventListener('pointerdown', unlockAudio, { passive: true })
      window.addEventListener('keydown', unlockAudio)
      window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, onTokenChanged)
      document.addEventListener('visibilitychange', sendPresence)
      connect()
      void syncPresenceHttp(false)
      if (!pollTimer) {
        pollTimer = setInterval(() => {
          if (users === 0) return
          if (!socket && getAccessToken()) connect()
          void syncPresenceHttp(false)
          if (!document.hidden) {
            void refreshUnread(true)
          }
        }, 4_000)
      }
    }
  }
  function stop() {
    users = Math.max(0, users - 1)
    if (users === 0) {
      window.removeEventListener('pointerdown', unlockAudio)
      window.removeEventListener('keydown', unlockAudio)
      window.removeEventListener(AUTH_TOKEN_CHANGED_EVENT, onTokenChanged)
      document.removeEventListener('visibilitychange', sendPresence)
      if (pollTimer) {
        clearInterval(pollTimer)
        pollTimer = undefined
      }
      void syncPresenceHttp(true)
      disconnect()
    }
  }
  function set(count: number) {
    unread.value = Math.max(0, count)
  }
  function ensureConnected() {
    if (users > 0 && (!socket || socket.readyState >= WebSocket.CLOSING)) {
      socket = null
      socketReady = false
      connect()
    }
  }
  return { unread: computed(() => unread.value), start, stop, refresh: refreshUnread, set, ensureConnected }
}
