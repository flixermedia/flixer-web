<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { nextTick, ref, watch } from 'vue'
import { presenceDotClass, type PresenceStatus } from '../../composables/useChat'

export interface FloatingChatAttachment {
  name: string
  url: string
}

export interface FloatingChatMessage {
  id: string
  renderKey?: string
  kind?: 'text' | 'system'
  senderName: string
  isSelf: boolean
  text?: string
  timestamp: string
  attachments?: FloatingChatAttachment[]
}

const props = withDefaults(
  defineProps<{
    open: boolean
    minimized: boolean
    title: string
    status?: PresenceStatus
    activeIndicator?: boolean
    unreadCount?: number
    messages: FloatingChatMessage[]
    draft: string
    placeholder?: string
    loading?: boolean
    loadingEarlier?: boolean
    hasMore?: boolean
    sending?: boolean
    sendDisabled?: boolean
    sendLabel?: string
    sendingLabel?: string
    error?: string
    emptyText?: string
    loadingText?: string
    ariaLabel?: string
    hideComposer?: boolean
    positionClass?: string
    resolveAttachmentUrl?: (url: string) => string
    minimizeLabel?: string
    expandLabel?: string
    closeLabel?: string
  }>(),
  {
    activeIndicator: false,
    unreadCount: 0,
    placeholder: 'Type a message… (Enter to send)',
    loading: false,
    loadingEarlier: false,
    hasMore: false,
    sending: false,
    sendDisabled: false,
    sendLabel: 'Send',
    sendingLabel: 'Sending…',
    error: '',
    emptyText: 'No messages yet.',
    loadingText: 'Loading…',
    ariaLabel: 'Chat',
    hideComposer: false,
    positionClass: 'right-4',
    resolveAttachmentUrl: (url: string) => url,
    minimizeLabel: 'Minimize',
    expandLabel: 'Expand',
    closeLabel: 'Close',
  },
)

const emit = defineEmits<{
  'update:draft': [value: string]
  toggleMinimize: []
  close: []
  send: []
  loadEarlier: []
}>()

const messagesContainer = ref<HTMLElement | null>(null)
const isScrolledUp = ref(false)

function formatTime(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

async function scrollToBottom(behavior: ScrollBehavior = 'auto') {
  await nextTick()
  const el = messagesContainer.value
  if (!el) return
  el.scrollTo({ top: el.scrollHeight, behavior })
  isScrolledUp.value = false
  if (behavior === 'auto') {
    requestAnimationFrame(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        isScrolledUp.value = false
      }
    })
  }
}

function onScroll() {
  const el = messagesContainer.value
  if (!el) return
  const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
  isScrolledUp.value = distanceFromBottom > 72
  if (el.scrollTop <= 24 && props.hasMore && !props.loadingEarlier && !props.loading) {
    emit('loadEarlier')
  }
}

watch(
  () => [props.messages.length, props.open, props.minimized, props.loading] as const,
  ([nextLen, isOpen, isMin, isLoading], prev) => {
    if (!isOpen || isMin || isLoading) return
    const [prevLen, wasOpen, wasMin, wasLoading] = prev ?? [0, false, true, true]
    const justOpened = !wasOpen || wasMin || wasLoading
    if (justOpened) {
      isScrolledUp.value = false
      void scrollToBottom('auto')
      return
    }
    if (!isScrolledUp.value && nextLen > prevLen) {
      void scrollToBottom('smooth')
    }
  },
  { immediate: true, flush: 'post' },
)

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault()
    emit('send')
  }
}

function onInput(event: Event) {
  emit('update:draft', (event.target as HTMLTextAreaElement).value)
}
</script>

<template>
  <Transition name="widget-dock">
    <aside
      v-if="open"
      v-bind="$attrs"
      class="fixed bottom-0 z-50 flex w-72 flex-col overflow-hidden rounded-t rounded-b-none border border-b-0 border-flixer-border bg-flixer-surface shadow-2xl shadow-black/50 sm:w-80"
      :class="positionClass"
      :aria-label="ariaLabel"
    >
      <header
        class="flex cursor-pointer items-center justify-between gap-2 border-b border-flixer-border bg-flixer-background/90 px-3.5 py-2.5"
        @click="emit('toggleMinimize')"
      >
        <div class="flex min-w-0 items-center gap-2">
          <span
            class="size-2 shrink-0 rounded-full"
            :class="status ? presenceDotClass(status) : activeIndicator ? 'bg-emerald-400' : 'bg-flixer-primary'"
            aria-hidden="true"
          ></span>
          <span class="truncate text-xs font-semibold text-flixer-text">{{ title }}</span>
          <span
            v-if="minimized && unreadCount > 0"
            class="rounded-full bg-flixer-primary px-1.5 py-0.5 text-[10px] font-bold text-white"
          >
            {{ unreadCount }}
          </span>
        </div>
        <div class="flex items-center gap-1" @click.stop>
          <slot name="header-actions" />
          <button
            type="button"
            class="rounded p-1 text-flixer-muted transition hover:bg-white/10 hover:text-white"
            :aria-label="minimized ? expandLabel : minimizeLabel"
            :title="minimized ? expandLabel : minimizeLabel"
            @click="emit('toggleMinimize')"
          >
            <Icon :icon="minimized ? 'lucide:chevron-up' : 'lucide:minus'" class="size-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="rounded p-1 text-flixer-muted transition hover:bg-white/10 hover:text-white"
            :aria-label="closeLabel"
            :title="closeLabel"
            @click="emit('close')"
          >
            <Icon icon="lucide:x" class="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </header>

      <Transition name="widget-body">
        <div v-if="!minimized" class="flex flex-col">
          <p v-if="error" class="border-b border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[11px] text-red-200">
            {{ error }}
          </p>

          <div class="relative bg-flixer-background/60">
            <div
              ref="messagesContainer"
              class="flex h-72 flex-col gap-2 overflow-y-auto overscroll-contain p-3 text-xs"
              @scroll.passive="onScroll"
            >
              <div v-if="loadingEarlier" class="py-1 text-center text-[11px] text-flixer-muted">
                Loading earlier…
              </div>
              <div v-if="loading" class="my-auto text-center text-flixer-muted">
                {{ loadingText }}
              </div>
              <div v-else-if="messages.length === 0" class="my-auto text-center text-flixer-muted">
                {{ emptyText }}
              </div>
              <TransitionGroup v-else name="widget-msg" tag="div" class="flex flex-col gap-2">
                <template v-for="msg in messages" :key="msg.renderKey ?? msg.id">
                  <p
                    v-if="msg.kind === 'system'"
                    class="widget-msg-item py-1 text-center text-[11px] text-flixer-muted"
                  >
                    {{ msg.senderName ? `${msg.senderName} ` : '' }}{{ msg.text }}
                  </p>
                  <div
                    v-else
                    class="widget-msg-item flex max-w-[85%] flex-col gap-0.5 rounded px-2.5 py-1.5"
                    :class="msg.isSelf
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
                </template>
              </TransitionGroup>
            </div>

            <Transition name="jump-btn">
              <button
                v-if="isScrolledUp"
                type="button"
                class="absolute bottom-3 right-3 z-10 grid size-8 place-items-center rounded border border-flixer-border bg-flixer-surface/95 text-white shadow-lg transition hover:border-flixer-accent hover:bg-flixer-surface"
                aria-label="Jump to most recent messages"
                title="Jump to most recent"
                @click="scrollToBottom('smooth')"
              >
                <Icon icon="lucide:arrow-down" class="size-4 text-flixer-accent" aria-hidden="true" />
              </button>
            </Transition>
          </div>

          <slot name="footer-replace">
            <form
              v-if="!hideComposer"
              class="flex flex-col gap-2 border-t border-flixer-border bg-flixer-surface p-2.5"
              @submit.prevent="emit('send')"
            >
              <slot name="composer-top" />
              <div class="flex items-center gap-1.5 rounded border border-flixer-border bg-flixer-background px-2.5 py-1 focus-within:border-flixer-primary">
                <textarea
                  :value="draft"
                  rows="1"
                  maxlength="4000"
                  :placeholder="placeholder"
                  class="max-h-24 min-h-6 w-full flex-1 resize-none bg-transparent py-1 text-xs text-flixer-text placeholder:text-flixer-muted focus:outline-none"
                  @input="onInput"
                  @keydown="handleKeydown"
                ></textarea>
                <button
                  type="submit"
                  class="grid size-7 shrink-0 place-items-center rounded text-flixer-accent transition hover:bg-white/10 disabled:opacity-35"
                  :aria-label="sending ? sendingLabel : sendLabel"
                  :title="sending ? sendingLabel : sendLabel"
                  :disabled="sendDisabled || sending"
                >
                  <Icon icon="lucide:send-horizontal" class="size-4" aria-hidden="true" />
                </button>
              </div>
              <div v-if="$slots['composer-actions']" class="flex items-center gap-1.5">
                <slot name="composer-actions" />
              </div>
            </form>
          </slot>
        </div>
      </Transition>
    </aside>
  </Transition>
</template>

<style scoped>
.widget-msg-item {
  content-visibility: auto;
  contain-intrinsic-size: auto 44px;
}

.widget-dock-enter-active,
.widget-dock-leave-active {
  transition:
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 180ms ease;
}
.widget-dock-enter-from,
.widget-dock-leave-to {
  opacity: 0;
  transform: translateY(16px);
}

.widget-body-enter-active,
.widget-body-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}
.widget-body-enter-from,
.widget-body-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.widget-msg-enter-active {
  transition:
    opacity 180ms ease-out,
    transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
}
.widget-msg-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

.jump-btn-enter-active,
.jump-btn-leave-active {
  transition:
    opacity 150ms ease,
    transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
}
.jump-btn-enter-from,
.jump-btn-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.9);
}

@media (prefers-reduced-motion: reduce) {
  .widget-dock-enter-active,
  .widget-dock-leave-active,
  .widget-body-enter-active,
  .widget-body-leave-active,
  .widget-msg-enter-active,
  .jump-btn-enter-active,
  .jump-btn-leave-active {
    transition: none;
  }
}
</style>
