<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { getChatConversations, type ChatConversation } from '../../api'
import { decryptChatMessages } from '../../composables/chatMlsClient'
import { conversationTitle, getUserPresence, onChatEvent, presenceDotClass, useChatUnread } from '../../composables/useChat'
import { useFloatingUserChat } from '../../composables/useFloatingUserChat'
import { useMailSummary } from '../../composables/useMailSummary'
import { useProfile } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'

defineProps<{ buttonClass: string }>()

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const chat = useChatUnread()
const { info: mailInfo } = useMailSummary()
const { profile, load: loadProfile } = useProfile()
const { openConversation } = useFloatingUserChat()

const open = ref(false)
const loading = ref(false)
const conversations = ref<ChatConversation[]>([])
const decryptedPreviews = ref<Record<string, string>>({})

const total = computed(() => chat.unread.value + (mailInfo.value?.enabled ? mailInfo.value.unread : 0))

async function decryptPreviews(items: ChatConversation[]) {
  const userId = profile.value?.id
  if (!userId) return
  await Promise.all(
    items.map(async (conv) => {
      const last = conv.lastMessage
      if (!last || last.kind !== 'text' || last.encrypted !== true || decryptedPreviews.value[last.id]) return
      try {
        const res = await decryptChatMessages(userId, conv.id, [last], false, false)
        const text = res.messages.get(last.id)
        if (text !== undefined) {
          decryptedPreviews.value = { ...decryptedPreviews.value, [last.id]: text }
        }
      } catch {
        // Ignore preview decryption failure
      }
    }),
  )
}

async function loadConversations() {
  loading.value = true
  try {
    if (!profile.value?.id) await loadProfile()
    const [err, res] = await catchError(getChatConversations())
    if (!err && res) {
      const sorted = [...res.conversations].sort((a, b) => {
        const aTime = a.lastMessage?.createdAt ?? a.updatedAt ?? ''
        const bTime = b.lastMessage?.createdAt ?? b.updatedAt ?? ''
        return bTime.localeCompare(aTime)
      })
      conversations.value = sorted.slice(0, 8)
      void decryptPreviews(conversations.value)
    }
  } finally {
    loading.value = false
  }
}

function toggle() {
  open.value = !open.value
  if (open.value) {
    void loadConversations()
  }
}

function selectConversation(conv: ChatConversation) {
  open.value = false
  if (route.name === 'chat') {
    void router.push({ name: 'chat', params: { id: conv.id } })
    return
  }
  void openConversation(conv.id, false)
}

function directPeerStatus(conv: ChatConversation) {
  if (conv.kind !== 'direct') return null
  const other = conv.members.find((m) => m.username !== profile.value?.username) ?? conv.members[0]
  return getUserPresence(other?.username)
}

function previewText(conv: ChatConversation): string {
  const last = conv.lastMessage
  if (!last) return 'No messages yet'
  if (last.encrypted) return decryptedPreviews.value[last.id] ?? 'Encrypted message'
  return last.body || 'No messages yet'
}

function formatTime(iso?: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

let stopEvents: (() => void) | null = null

onMounted(() => {
  chat.start()
  void loadConversations()
  stopEvents = onChatEvent((event) => {
    if (event.type === 'deleted') {
      conversations.value = conversations.value.filter((c) => c.id !== event.conversationId)
      if (open.value) void loadConversations()
      return
    }
    if (event.type === 'message' || event.type === 'changed' || event.type === 'resync') {
      void loadConversations()
    }
  })
})

onBeforeUnmount(() => {
  chat.stop()
  stopEvents?.()
})
</script>

<template>
  <div class="relative">
    <button
      type="button"
      :class="buttonClass"
      :aria-label="total ? t('chat.unreadLabel', { count: total }) : t('chat.title')"
      :aria-expanded="open"
      :title="t('chat.title')"
      @click="toggle"
    >
      <Icon icon="lucide:message-circle" class="size-5" aria-hidden="true" />
      <span
        v-if="total"
        class="absolute right-1 top-1 grid min-w-4 place-items-center rounded bg-flixer-accent px-1 text-[10px] font-bold leading-4 text-flixer-background"
      >
        {{ total > 99 ? '99+' : total }}
      </span>
    </button>

    <div v-if="open" class="fixed inset-0 z-40" @click="open = false" />

    <div
      v-if="open"
      class="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded border border-flixer-border bg-flixer-surface shadow-2xl shadow-black/50"
      role="menu"
    >
      <div class="flex items-center justify-between border-b border-flixer-border bg-flixer-background/80 px-3.5 py-2.5">
        <span class="text-xs font-semibold text-white">{{ t('chat.title') }}</span>
        <RouterLink
          to="/chat"
          class="text-[11px] font-medium text-flixer-accent hover:underline"
          @click="open = false"
        >
          Open all
        </RouterLink>
      </div>

      <div class="max-h-80 overflow-y-auto p-1.5">
        <p v-if="loading && !conversations.length" class="p-4 text-center text-xs text-flixer-muted">
          Loading…
        </p>
        <p v-else-if="!conversations.length" class="p-4 text-center text-xs text-flixer-muted">
          No conversations yet.
        </p>
        <button
          v-for="conv in conversations"
          :key="conv.id"
          type="button"
          role="menuitem"
          class="flex w-full items-center gap-2.5 rounded p-2 text-left transition hover:bg-white/[0.06]"
          @click="selectConversation(conv)"
        >
          <span class="relative grid size-8 shrink-0 place-items-center rounded bg-flixer-primary/25 text-xs font-bold text-white">
            {{ (conversationTitle(conv, profile?.username) || '?').slice(0, 1).toUpperCase() }}
            <span
              v-if="directPeerStatus(conv)"
              class="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-flixer-surface"
              :class="presenceDotClass(directPeerStatus(conv)!)"
              aria-hidden="true"
            />
          </span>
          <span class="min-w-0 flex-1">
            <span class="flex items-baseline justify-between gap-2">
              <span class="truncate text-xs font-semibold text-white">
                {{ conversationTitle(conv, profile?.username) || 'Conversation' }}
              </span>
              <span class="shrink-0 text-[10px] text-flixer-muted">
                {{ formatTime(conv.lastMessage?.createdAt ?? conv.updatedAt) }}
              </span>
            </span>
            <span class="mt-0.5 flex items-center justify-between gap-2">
              <span class="truncate text-[11px] text-flixer-muted">
                {{ previewText(conv) }}
              </span>
              <span
                v-if="conv.unread"
                class="grid min-w-4 shrink-0 place-items-center rounded-full bg-flixer-accent px-1 text-[10px] font-bold leading-4 text-flixer-background"
              >
                {{ conv.unread > 99 ? '99+' : conv.unread }}
              </span>
            </span>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>
