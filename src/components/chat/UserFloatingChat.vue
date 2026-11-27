<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'
import { getUserPresence } from '../../composables/useChat'
import { refreshChatCallAvailability, useChatCall } from '../../composables/useChatCall'
import { useFloatingUserChat } from '../../composables/useFloatingUserChat'
import { usePrioritySupportChat } from '../../composables/usePrioritySupportChat'
import { useProfile } from '../../composables/useProfile'
import FloatingChatWidget, { type FloatingChatMessage } from './FloatingChatWidget.vue'

const route = useRoute()
const { t } = useI18n()
const isOnChatPage = computed(() => route.name === 'chat')
const { profile } = useProfile()
const chatCall = useChatCall()
const { isOpen: priorityOpen } = usePrioritySupportChat()
const {
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
  closeChat,
  toggleMinimize,
  sendMessage,
  loadEarlier,
  restoreOpenChat,
} = useFloatingUserChat()

const widgetMessages = computed<FloatingChatMessage[]>(() =>
  messages.value.map((msg) => ({
    id: msg.id,
    renderKey: msg.renderKey,
    kind: msg.kind,
    senderName: msg.sender?.displayName || msg.sender?.username || (msg.kind === 'system' ? '' : 'System'),
    isSelf: msg.sender?.username === profile.value?.username,
    text: msg.body,
    timestamp: msg.createdAt,
  })),
)

const positionClass = computed(() =>
  priorityOpen.value ? 'right-4 sm:right-[21.5rem]' : 'right-4',
)

const peerStatus = computed(() => {
  const conv = conversation.value
  if (!conv || conv.kind !== 'direct') return undefined
  const other = conv.members.find((m) => m.username !== profile.value?.username) ?? conv.members[0]
  return getUserPresence(other?.username)
})

onMounted(() => {
  void restoreOpenChat(() => isOnChatPage.value)
  void refreshChatCallAvailability()
})
</script>

<template>
  <FloatingChatWidget
    v-model:draft="draft"
    data-user-floating-chat="true"
    :open="isOpen && !isOnChatPage"
    :minimized="isMinimized"
    :title="title"
    :status="peerStatus"
    :active-indicator="true"
    :unread-count="unreadCount"
    :messages="widgetMessages"
    placeholder="Message… (Enter to send)"
    :loading="isLoading"
    :loading-earlier="loadingEarlier"
    :has-more="hasMore"
    :sending="isSending"
    :send-disabled="!draft.trim()"
    :error="error"
    empty-text="Send a message to start chatting."
    loading-text="Loading conversation…"
    :aria-label="title"
    :position-class="positionClass"
    @toggle-minimize="toggleMinimize"
    @close="closeChat"
    @send="sendMessage"
    @load-earlier="loadEarlier"
  >
    <template v-if="conversation" #header-actions>
      <template v-if="conversation.kind === 'direct' && chatCall.available.value">
        <button
          type="button"
          class="rounded p-1 text-flixer-muted transition hover:bg-white/10 hover:text-white disabled:opacity-40"
          :disabled="chatCall.phase.value !== 'idle'"
          :aria-label="t('chat.call.audio')"
          :title="t('chat.call.audio')"
          @click="void chatCall.startCall(conversation.id, false, title)"
        >
          <Icon icon="lucide:phone" class="size-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="rounded p-1 text-flixer-muted transition hover:bg-white/10 hover:text-white disabled:opacity-40"
          :disabled="chatCall.phase.value !== 'idle'"
          :aria-label="t('chat.call.video')"
          :title="t('chat.call.video')"
          @click="void chatCall.startCall(conversation.id, true, title)"
        >
          <Icon icon="lucide:video" class="size-3.5" aria-hidden="true" />
        </button>
      </template>
      <RouterLink
        :to="{ name: 'chat', params: { id: conversation.id } }"
        class="rounded p-1 text-flixer-muted transition hover:bg-white/10 hover:text-white"
        aria-label="Open in Messages"
        title="Open in Messages"
      >
        <Icon icon="lucide:maximize-2" class="size-3.5" aria-hidden="true" />
      </RouterLink>
    </template>
  </FloatingChatWidget>
</template>
