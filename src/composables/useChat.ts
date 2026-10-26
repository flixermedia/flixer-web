import { computed, ref } from 'vue'
import { getChatUnread, type ChatConversation } from '../api'

const unread = ref(0)
let timer: ReturnType<typeof setInterval> | undefined
let users = 0

async function refreshUnread() {
  if (document.hidden) return
  try {
    unread.value = await getChatUnread()
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
      void refreshUnread()
      timer = setInterval(() => void refreshUnread(), 20_000)
    }
  }
  function stop() {
    users = Math.max(0, users - 1)
    if (users === 0 && timer) {
      clearInterval(timer)
      timer = undefined
    }
  }
  function set(count: number) {
    unread.value = Math.max(0, count)
  }
  return { unread: computed(() => unread.value), start, stop, refresh: refreshUnread, set }
}
