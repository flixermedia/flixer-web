import { computed, ref } from 'vue'
import { getChatConversations, type ChatConversation } from '../api'
import { useNotifications } from './useNotifications'

const unread = ref(0)
/** Conversation currently open and visible in the chat page; its messages don't alert. */
export const viewingChat = ref<string | null>(null)
const POLL_MS = 5_000
let timer: ReturnType<typeof setInterval> | undefined
let users = 0
let seen: Map<string, number> | null = null
let audioContext: AudioContext | null = null

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
    const { conversations, unread: total } = await getChatConversations()
    unread.value = total
    const previous = seen
    seen = new Map(conversations.map((conversation) => [conversation.id, conversation.unread]))
    if (!previous) return
    const incoming = conversations.some((conversation) => conversation.unread > (previous.get(conversation.id) ?? 0) && !(viewingChat.value === conversation.id && !document.hidden))
    if (!incoming) return
    playChime()
    void useNotifications().refresh()
  } catch {
    // Keep the last known count; the next poll retries.
  }
}

/** The title shown for a conversation: the group name, or the other person in a direct chat. */
export function conversationTitle(conversation: ChatConversation, selfUsername: string | undefined): string {
  if (conversation.kind === 'group') return conversation.name ?? ''
  const other = conversation.members.find((member) => member.username !== selfUsername) ?? conversation.members[0]
  return other?.displayName ?? ''
}

/** Shared unread badge state. Polling runs while at least one component uses it. */
export function useChatUnread() {
  function start() {
    users++
    if (users === 1) {
      seen = null
      window.addEventListener('pointerdown', unlockAudio, { passive: true })
      window.addEventListener('keydown', unlockAudio)
      void refreshUnread()
      timer = setInterval(() => void refreshUnread(), POLL_MS)
    }
  }
  function stop() {
    users = Math.max(0, users - 1)
    if (users === 0 && timer) {
      clearInterval(timer)
      timer = undefined
      window.removeEventListener('pointerdown', unlockAudio)
      window.removeEventListener('keydown', unlockAudio)
    }
  }
  function set(count: number) {
    unread.value = Math.max(0, count)
  }
  return { unread: computed(() => unread.value), start, stop, refresh: refreshUnread, set }
}
