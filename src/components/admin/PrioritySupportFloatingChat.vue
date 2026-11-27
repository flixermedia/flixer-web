<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { usePrioritySupportChat } from '../../composables/usePrioritySupportChat'
import FloatingChatWidget, { type FloatingChatMessage } from '../chat/FloatingChatWidget.vue'

const { t } = useI18n()
const route = useRoute()
const isOnChatPage = computed(() => route.name === 'chat')
const {
  isOpen,
  isMinimized,
  messages,
  roomOpen,
  sessionEnded,
  draft,
  isLoadingChat,
  isSending,
  isEndingChat,
  isAttaching,
  isCapturingScreenshot,
  pendingScreenshot,
  chatError,
  unreadCount,
  closeChat,
  endChat,
  startNewSession,
  downloadTranscript,
  restoreOpenChat,
  toggleMinimize,
  attachDiagnostics,
  captureScreenshot,
  clearScreenshot,
  resolveAttachmentUrl,
  sendMessage,
} = usePrioritySupportChat()

const widgetMessages = computed<FloatingChatMessage[]>(() =>
  messages.value.map((msg) => ({
    id: msg.id,
    senderName: msg.senderName,
    isSelf: msg.sender === 'customer',
    text: msg.text,
    timestamp: msg.timestamp,
    attachments: msg.attachments,
  })),
)

onMounted(() => {
  void restoreOpenChat()
})
</script>

<template>
  <FloatingChatWidget
    v-model:draft="draft"
    data-priority-support-chat="true"
    :open="isOpen && !isOnChatPage"
    :minimized="isMinimized"
    :title="t('admin.prioritySupport.title')"
    :active-indicator="roomOpen"
    :unread-count="unreadCount"
    :messages="widgetMessages"
    :placeholder="t('admin.prioritySupport.placeholder')"
    :loading="isLoadingChat"
    :sending="isSending"
    :send-disabled="!draft.trim() && !pendingScreenshot"
    :send-label="t('admin.prioritySupport.send')"
    :sending-label="t('admin.prioritySupport.sending')"
    :error="chatError"
    :empty-text="t('admin.prioritySupport.emptyConversation')"
    :loading-text="t('admin.prioritySupport.loadingConversation')"
    :aria-label="t('admin.prioritySupport.chatAria')"
    :minimize-label="t('admin.prioritySupport.minimize')"
    :expand-label="t('admin.prioritySupport.expand')"
    :close-label="t('admin.prioritySupport.close')"
    :resolve-attachment-url="resolveAttachmentUrl"
    @toggle-minimize="toggleMinimize"
    @close="closeChat"
    @send="sendMessage"
  >
    <template #header-actions>
      <button
        v-if="roomOpen"
        type="button"
        class="rounded border border-red-500/40 bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-red-200 transition hover:bg-red-500/30 disabled:opacity-60"
        :disabled="isEndingChat"
        :title="t('admin.prioritySupport.endChatTitle')"
        @click="endChat"
      >
        {{ isEndingChat ? t('admin.prioritySupport.endingChat') : t('admin.prioritySupport.endChat') }}
      </button>
    </template>

    <template v-if="sessionEnded" #footer-replace>
      <div class="flex flex-col gap-2 border-t border-flixer-border bg-flixer-surface p-3">
        <p class="text-center text-[11px] font-medium text-flixer-muted">
          {{ t('admin.prioritySupport.sessionEndedBanner') }}
        </p>
        <div class="flex items-center justify-center gap-2">
          <button
            v-if="messages.length > 0"
            type="button"
            class="flex items-center gap-1 rounded border border-flixer-border bg-flixer-background px-2.5 py-1 text-[11px] font-semibold text-flixer-text transition hover:bg-white/10"
            @click="downloadTranscript"
          >
            <Icon icon="lucide:download" class="size-3" aria-hidden="true" />
            <span>{{ t('admin.prioritySupport.downloadTranscript') }}</span>
          </button>
          <button
            type="button"
            class="rounded bg-flixer-primary px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-flixer-primary/80"
            @click="startNewSession"
          >
            {{ t('admin.prioritySupport.startNewSession') }}
          </button>
        </div>
      </div>
    </template>

    <template #composer-top>
      <div
        v-if="pendingScreenshot"
        class="relative flex items-center gap-2 rounded border border-flixer-border bg-flixer-background p-1.5"
      >
        <img
          :src="pendingScreenshot.dataUrl"
          :alt="t('admin.prioritySupport.screenshotAttached')"
          class="h-12 w-20 rounded border border-flixer-border object-cover"
        />
        <span class="min-w-0 flex-1 truncate text-[11px] text-flixer-muted">
          {{ t('admin.prioritySupport.screenshotAttached') }}
        </span>
        <button
          type="button"
          class="rounded p-1 text-flixer-muted transition hover:bg-white/10 hover:text-white"
          :aria-label="t('admin.prioritySupport.removeScreenshot')"
          :title="t('admin.prioritySupport.removeScreenshot')"
          @click="clearScreenshot"
        >
          <Icon icon="lucide:x" class="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </template>

    <template #composer-actions>
      <button
        type="button"
        class="flex items-center gap-1 rounded border border-flixer-border bg-flixer-background px-2 py-1 text-[11px] font-medium text-flixer-muted transition hover:text-flixer-text disabled:opacity-60"
        :disabled="isAttaching || isSending"
        :title="t('admin.prioritySupport.attachDiagnosticsTitle')"
        @click="attachDiagnostics(false)"
      >
        <Icon icon="lucide:file-text" class="size-3" aria-hidden="true" />
        <span>{{ isAttaching ? t('admin.prioritySupport.gathering') : t('admin.prioritySupport.diagnosticsButton') }}</span>
      </button>
      <button
        type="button"
        class="flex items-center gap-1 rounded border border-flixer-border bg-flixer-background px-2 py-1 text-[11px] font-medium text-flixer-muted transition hover:text-flixer-text disabled:opacity-60"
        :disabled="isCapturingScreenshot || isSending"
        :title="t('admin.prioritySupport.screenshotTitle')"
        @click="captureScreenshot"
      >
        <Icon icon="lucide:camera" class="size-3" aria-hidden="true" />
        <span>{{ isCapturingScreenshot ? t('admin.prioritySupport.capturing') : t('admin.prioritySupport.screenshotButton') }}</span>
      </button>
    </template>
  </FloatingChatWidget>
</template>
