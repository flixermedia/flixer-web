<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePrioritySupportChat } from '../../composables/usePrioritySupportChat'

const { t } = useI18n()
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

const messagesContainer = ref<HTMLElement | null>(null)

function formatTime(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

async function scrollToBottom() {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

onMounted(() => {
  void restoreOpenChat()
})

watch(
  () => [messages.value.length, isOpen.value, isMinimized.value],
  () => {
    if (isOpen.value && !isMinimized.value) {
      void scrollToBottom()
    }
  },
)

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    void sendMessage()
  }
}
</script>

<template>
  <aside
    v-if="isOpen"
    data-priority-support-chat="true"
    class="fixed bottom-4 right-4 z-50 flex w-80 flex-col overflow-hidden rounded-lg border border-flixer-border bg-flixer-surface shadow-2xl shadow-black/50 sm:w-96"
    :aria-label="t('admin.prioritySupport.chatAria')"
  >
    <header
      class="flex cursor-pointer items-center justify-between gap-2 border-b border-flixer-border bg-flixer-background/90 px-3.5 py-2.5"
      @click="toggleMinimize"
    >
      <div class="flex min-w-0 items-center gap-2">
        <span
          class="size-2 shrink-0 rounded-full"
          :class="roomOpen ? 'bg-emerald-400' : 'bg-flixer-primary'"
          aria-hidden="true"
        ></span>
        <span class="truncate text-xs font-semibold text-flixer-text">{{ t('admin.prioritySupport.title') }}</span>
        <span
          v-if="isMinimized && unreadCount > 0"
          class="rounded-full bg-flixer-primary px-1.5 py-0.5 text-[10px] font-bold text-white"
        >
          {{ unreadCount }}
        </span>
      </div>
      <div class="flex items-center gap-1" @click.stop>
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
        <button
          type="button"
          class="rounded p-1 text-flixer-muted transition hover:bg-white/10 hover:text-white"
          :aria-label="isMinimized ? t('admin.prioritySupport.expand') : t('admin.prioritySupport.minimize')"
          :title="isMinimized ? t('admin.prioritySupport.expand') : t('admin.prioritySupport.minimize')"
          @click="toggleMinimize"
        >
          <Icon :icon="isMinimized ? 'lucide:chevron-up' : 'lucide:minus'" class="size-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="rounded p-1 text-flixer-muted transition hover:bg-white/10 hover:text-white"
          :aria-label="t('admin.prioritySupport.close')"
          :title="t('admin.prioritySupport.close')"
          @click="closeChat"
        >
          <Icon icon="lucide:x" class="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </header>

    <template v-if="!isMinimized">
      <p v-if="chatError" class="border-b border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[11px] text-red-200">
        {{ chatError }}
      </p>

      <div
        ref="messagesContainer"
        class="flex h-72 flex-col gap-2 overflow-y-auto bg-flixer-background/60 p-3 text-xs"
      >
        <div v-if="isLoadingChat" class="my-auto text-center text-flixer-muted">
          {{ t('admin.prioritySupport.loadingConversation') }}
        </div>
        <div v-else-if="messages.length === 0" class="my-auto text-center text-flixer-muted">
          {{ t('admin.prioritySupport.emptyConversation') }}
        </div>
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="flex max-w-[85%] flex-col gap-0.5 rounded-lg px-2.5 py-1.5"
          :class="msg.sender === 'customer'
            ? 'self-end border border-flixer-primary/40 bg-flixer-primary/25 text-flixer-text'
            : 'self-start border border-flixer-border bg-flixer-surface text-flixer-text'"
        >
          <div class="flex items-center justify-between gap-2 text-[10px] text-flixer-muted">
            <span class="font-semibold">{{ msg.senderName }}</span>
            <span>{{ formatTime(msg.timestamp) }}</span>
          </div>
          <p v-if="msg.text" class="whitespace-pre-wrap break-words leading-relaxed">{{ msg.text }}</p>
          <div v-if="msg.attachments?.length" class="mt-1 flex flex-col gap-1.5">
            <a
              v-for="att in msg.attachments"
              :key="att.url"
              :href="resolveAttachmentUrl(att.url) || '#'"
              target="_blank"
              rel="noopener noreferrer"
              class="block overflow-hidden rounded border border-flixer-border bg-black/30"
            >
              <img
                v-if="resolveAttachmentUrl(att.url)"
                :src="resolveAttachmentUrl(att.url)"
                :alt="att.name"
                class="max-h-44 w-full object-contain"
                loading="lazy"
              />
            </a>
          </div>
        </div>
      </div>

      <div v-if="sessionEnded" class="flex flex-col gap-2 border-t border-flixer-border bg-flixer-surface p-3">
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

      <form v-else class="flex flex-col gap-2 border-t border-flixer-border bg-flixer-surface p-2.5" @submit.prevent="sendMessage">
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
        <textarea
          v-model="draft"
          rows="2"
          maxlength="4000"
          :placeholder="t('admin.prioritySupport.placeholder')"
          class="w-full resize-none rounded border border-flixer-border bg-flixer-background px-2.5 py-1.5 text-xs text-flixer-text focus:border-flixer-primary focus:outline-none"
          @keydown="handleKeydown"
        ></textarea>
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5">
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
          </div>
          <button
            type="submit"
            class="flex items-center gap-1 rounded bg-flixer-primary px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60"
            :disabled="(!draft.trim() && !pendingScreenshot) || isSending"
          >
            <span>{{ isSending ? t('admin.prioritySupport.sending') : t('admin.prioritySupport.send') }}</span>
            <Icon icon="lucide:send" class="size-3" aria-hidden="true" />
          </button>
        </div>
      </form>
    </template>
  </aside>
</template>
