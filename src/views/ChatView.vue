<script setup lang="ts">
import { openModal } from '@kolirt/vue-modal'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRouter } from 'vue-router'
import { getChatConversation, getChatConversations, getChatMessages, deleteChatConversation, markChatRead, removeChatMember, renameChatGroup, sendChatMessage, type ChatConversation, type ChatMessage } from '../api'
import NewChatModal from '../components/chat/NewChatModal.vue'
import Header from '../components/header/Header.vue'
import MobileTabBar from '../components/home/MobileTabBar.vue'
import Skeleton from '../components/ui/Skeleton.vue'
import UserAvatar from '../components/ui/UserAvatar.vue'
import { getMobileTabs, getNavLinks } from '../composables/homeNav'
import { confirmAction } from '../composables/confirm'
import { conversationTitle, onChatEvent, useChatUnread, viewingChat, type ChatEvent } from '../composables/useChat'
import { describeRequestError, useProfile } from '../composables/useProfile'
import { useSignOut } from '../composables/useSignOut'

const props = defineProps<{ id?: string }>()
const { t } = useI18n()
const router = useRouter()
const { isSigningOut, signOut } = useSignOut()
const navLinks = computed(getNavLinks)
const mobileTabs = computed(getMobileTabs)
const { profile, load: loadProfile } = useProfile()
const unread = useChatUnread()

const conversations = ref<ChatConversation[]>([])
const listLoading = ref(true)
const listFailed = ref(false)
const active = ref<ChatConversation | null>(null)
const messages = ref<ChatMessage[]>([])
const hasMore = ref(false)
const threadLoading = ref(false)
const threadMissing = ref(false)
const draft = ref('')
const sending = ref(false)
const sendError = ref('')
const infoOpen = ref(false)
const renameDraft = ref('')
const scroller = ref<HTMLElement | null>(null)
const composer = ref<HTMLTextAreaElement | null>(null)

// iOS shifts the page when the keyboard opens, so on small screens the open thread is pinned to the visual viewport while typing.
const typing = ref(false)
const viewport = ref({ top: 0, height: 0 })
const pinned = computed(() => typing.value && !!props.id && window.matchMedia('(max-width: 767px)').matches)

function syncViewport() {
  const vv = window.visualViewport
  if (!vv) return
  viewport.value = { top: vv.offsetTop, height: vv.height }
  if (pinned.value) window.scrollTo(0, 0)
}

function onComposerFocus() {
  typing.value = true
  syncViewport()
  setTimeout(syncViewport, 300)
  scrollToEnd()
}

function onComposerBlur() {
  typing.value = false
}

let stopEvents: (() => void) | undefined
let threadToken = 0

const self = computed(() => profile.value?.username)
const title = (conversation: ChatConversation) => conversationTitle(conversation, self.value)
const isOwner = computed(() => active.value?.members.find((member) => member.username === self.value)?.role === 'owner')
const otherMember = (conversation: ChatConversation) => conversation.members.find((member) => member.username !== self.value) ?? conversation.members[0]

function preview(conversation: ChatConversation) {
  const last = conversation.lastMessage
  if (!last) return t('chat.noMessages')
  if (last.kind === 'system') return last.body
  const mine = last.sender?.username === self.value
  const prefix = mine ? `${t('chat.you')}: ` : conversation.kind === 'group' && last.sender ? `${last.sender.displayName}: ` : ''
  return prefix + last.body
}

function shortTime(iso: string) {
  const date = new Date(iso)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  const days = (now.getTime() - date.getTime()) / 86_400_000
  return days < 7 ? date.toLocaleDateString([], { weekday: 'short' }) : date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

const fullTime = (iso: string) => new Date(iso).toLocaleString()

function applyList(next: { conversations: ChatConversation[]; unread: number }) {
  conversations.value = next.conversations.map((conversation) => (conversation.id === props.id ? { ...conversation, unread: 0 } : conversation))
  unread.set(conversations.value.reduce((total, conversation) => total + conversation.unread, 0))
}

async function refreshList(silent = true) {
  if (!silent) listLoading.value = true
  try {
    applyList(await getChatConversations())
    listFailed.value = false
  } catch {
    if (!silent) listFailed.value = true
  } finally {
    listLoading.value = false
  }
}

function nearBottom() {
  const el = scroller.value
  return !el || el.scrollHeight - el.scrollTop - el.clientHeight < 120
}

function scrollToEnd() {
  void nextTick(() => {
    if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight
  })
}

function merge(incoming: ChatMessage[]) {
  const seen = new Set(messages.value.map((message) => message.id))
  const fresh = incoming.filter((message) => !seen.has(message.id))
  if (!fresh.length) return false
  messages.value = [...messages.value, ...fresh].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  return true
}

async function openThread(id: string | undefined) {
  const token = ++threadToken
  active.value = null
  messages.value = []
  hasMore.value = false
  threadMissing.value = false
  infoOpen.value = false
  sendError.value = ''
  if (!id) return
  threadLoading.value = true
  try {
    const [conversation, page] = await Promise.all([getChatConversation(id), getChatMessages(id)])
    if (token !== threadToken) return
    active.value = conversation
    renameDraft.value = conversation.name ?? ''
    messages.value = page.messages
    hasMore.value = page.hasMore
    conversations.value = conversations.value.map((entry) => (entry.id === id ? { ...entry, unread: 0 } : entry))
    unread.set(conversations.value.reduce((total, entry) => total + entry.unread, 0))
    scrollToEnd()
  } catch {
    if (token === threadToken) threadMissing.value = true
  } finally {
    if (token === threadToken) threadLoading.value = false
  }
}

async function pollThread(id: string, token: number) {
  if (token !== threadToken) return
  try {
    const last = messages.value[messages.value.length - 1]
    const stick = nearBottom()
    const page = await getChatMessages(id, last ? { after: last.createdAt } : {})
    if (token !== threadToken) return
    if (merge(page.messages)) {
      if (page.messages.some((message) => message.kind === 'system')) active.value = await getChatConversation(id)
      if (stick) scrollToEnd()
    }
  } catch {
    // The next tick retries.
  }
}

function onEvent(event: ChatEvent) {
  const id = props.id
  if (event.type === 'resync') {
    void refreshList()
    if (id) void pollThread(id, threadToken)
    return
  }
  if (event.type === 'message' && id && event.conversationId === id) {
    const stick = nearBottom()
    if (merge([event.message]) && stick) scrollToEnd()
    if (!document.hidden && event.message.kind === 'text') void markChatRead(id).catch(() => undefined)
    void refreshList()
    return
  }
  void refreshList()
  if (event.type === 'changed' && id && event.conversationId === id) void syncThread(id)
}

async function syncThread(id: string) {
  const token = threadToken
  try {
    const conversation = await getChatConversation(id)
    if (token !== threadToken) return
    active.value = conversation
    renameDraft.value = conversation.name ?? ''
    await pollThread(id, token)
  } catch {
    if (token === threadToken) threadMissing.value = true
  }
}

async function loadEarlier() {
  const first = messages.value[0]
  if (!first || !props.id) return
  const el = scroller.value
  const previous = el?.scrollHeight ?? 0
  const page = await getChatMessages(props.id, { before: first.createdAt })
  merge(page.messages)
  hasMore.value = page.hasMore
  await nextTick()
  if (el) el.scrollTop = el.scrollHeight - previous
}

async function send() {
  const body = draft.value.trim()
  if (!body || !props.id || sending.value) return
  sending.value = true
  sendError.value = ''
  try {
    const message = await sendChatMessage(props.id, body)
    draft.value = ''
    merge([message])
    scrollToEnd()
    void refreshList()
  } catch (error) {
    sendError.value = describeRequestError(error, t('chat.sendError'))
  } finally {
    sending.value = false
    void nextTick(() => composer.value?.focus())
  }
}

function onComposerKey(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault()
    void send()
  }
}

async function newChat() {
  try {
    const conversation = (await openModal(NewChatModal)) as ChatConversation | undefined
    if (conversation) {
      await refreshList()
      void router.push({ name: 'chat', params: { id: conversation.id } })
    }
  } catch {
    // Dismissed.
  }
}

async function addPeople() {
  if (!active.value) return
  try {
    const conversation = (await openModal(NewChatModal, { props: { addTo: { id: active.value.id, usernames: active.value.members.map((member) => member.username) } } })) as ChatConversation | undefined
    if (conversation) {
      active.value = conversation
      void pollThread(conversation.id, threadToken)
      void refreshList()
    }
  } catch {
    // Dismissed.
  }
}

async function rename() {
  const name = renameDraft.value.trim()
  if (!active.value || !name || name === active.value.name) return
  try {
    active.value = await renameChatGroup(active.value.id, name)
    void pollThread(active.value.id, threadToken)
    void refreshList()
  } catch (error) {
    sendError.value = describeRequestError(error, t('chat.createError'))
  }
}

async function leaveOrRemove(username: string) {
  if (!active.value) return
  const leaving = username === self.value
  const ok = await confirmAction(leaving ? t('chat.leaveConfirm') : t('chat.removeConfirm'), { title: leaving ? t('chat.leaveGroup') : t('chat.removePerson'), confirmLabel: leaving ? t('chat.leave') : t('chat.remove'), danger: true })
  if (!ok) return
  try {
    await removeChatMember(active.value.id, username)
    if (leaving) {
      await refreshList()
      void router.push({ name: 'chat' })
    } else {
      active.value = await getChatConversation(active.value.id)
      void pollThread(active.value.id, threadToken)
    }
  } catch (error) {
    sendError.value = describeRequestError(error, t('chat.createError'))
  }
}

async function deleteActive() {
  const conversation = active.value
  if (!conversation) return
  const group = conversation.kind === 'group'
  const ok = await confirmAction(group ? t('chat.deleteGroupConfirm') : t('chat.deleteChatConfirm'), { title: group ? t('chat.deleteGroup') : t('chat.deleteChat'), confirmLabel: t('chat.delete'), danger: true })
  if (!ok) return
  try {
    await deleteChatConversation(conversation.id)
    await refreshList()
    void router.push({ name: 'chat' })
  } catch (error) {
    sendError.value = describeRequestError(error, t('chat.createError'))
  }
}

function onVisible() {
  if (document.hidden) return
  void refreshList()
  if (props.id) void markChatRead(props.id).catch(() => undefined)
}

watch(
  () => props.id,
  (id) => {
    viewingChat.value = id ?? null
    void openThread(id)
  },
  { immediate: true },
)

onMounted(() => {
  void loadProfile()
  void refreshList(false)
  stopEvents = onChatEvent(onEvent)
  window.visualViewport?.addEventListener('resize', syncViewport)
  window.visualViewport?.addEventListener('scroll', syncViewport)
  document.addEventListener('visibilitychange', onVisible)
})

onBeforeUnmount(() => {
  viewingChat.value = null
  threadToken++
  stopEvents?.()
  window.visualViewport?.removeEventListener('resize', syncViewport)
  window.visualViewport?.removeEventListener('scroll', syncViewport)
  document.removeEventListener('visibilitychange', onVisible)
})
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-flixer-background pb-24 font-sans text-flixer-text md:pb-12">
    <Header :links="navLinks" :is-signing-out="isSigningOut" @logout="signOut" />
    <main class="page-gutter pt-28 sm:pt-32">
      <div class="grid overflow-hidden rounded border border-white/10 md:grid-cols-[20rem_minmax(0,1fr)]" :class="pinned ? 'fixed inset-x-0 z-40 bg-flixer-background' : 'h-[calc(100dvh-13rem)] min-h-[28rem] md:h-[calc(100dvh-10rem)]'" :style="pinned ? { top: `${viewport.top}px`, height: `${viewport.height}px` } : undefined">
        <aside class="flex min-h-0 flex-col border-white/10 md:border-r" :class="props.id ? 'hidden md:flex' : 'flex'" :aria-label="t('chat.conversations')">
          <div class="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
            <h1 class="text-lg font-bold text-white">{{ t('chat.title') }}</h1>
            <button type="button" class="flex items-center gap-1.5 rounded bg-white px-3 py-1.5 text-xs font-bold text-flixer-background transition hover:bg-white/85" @click="newChat">
              <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
              {{ t('chat.new') }}
            </button>
          </div>
          <ul v-if="listLoading" class="space-y-1 p-2">
            <li v-for="n in 5" :key="n" class="flex items-center gap-3 p-2"><Skeleton class="size-10 rounded" /><Skeleton class="h-4 w-32" /></li>
          </ul>
          <p v-else-if="listFailed" class="p-4 text-sm text-red-400" role="alert">{{ t('chat.loadError') }}</p>
          <div v-else-if="!conversations.length" class="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <p class="text-sm text-flixer-muted">{{ t('chat.empty') }}</p>
            <button type="button" class="rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20" @click="newChat">{{ t('chat.startChat') }}</button>
          </div>
          <ul v-else class="min-h-0 flex-1 overflow-y-auto p-2">
            <li v-for="conversation in conversations" :key="conversation.id">
              <RouterLink :to="{ name: 'chat', params: { id: conversation.id } }" class="flex items-center gap-3 rounded-lg px-2 py-2.5 transition motion-reduce:transition-none hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="conversation.id === props.id ? 'bg-white/10' : ''">
                <span class="relative block size-11 shrink-0 overflow-hidden rounded">
                  <UserAvatar v-if="conversation.kind === 'direct'" :avatar-url="otherMember(conversation)?.avatarUrl" :name="title(conversation)" />
                  <span v-else class="grid size-full place-items-center bg-gradient-to-br from-flixer-primary to-flixer-secondary text-white" aria-hidden="true">
                    <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="9" cy="8" r="3.5" />
                      <path d="M2.5 20c.6-3.5 3.2-5.5 6.5-5.5s5.9 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c2 .6 3.2 2.4 3.5 5.2" />
                    </svg>
                  </span>
                </span>
                <span class="min-w-0 flex-1">
                  <span class="flex items-baseline justify-between gap-2">
                    <span class="truncate text-sm text-white" :class="conversation.unread ? 'font-bold' : 'font-medium'">{{ title(conversation) }}</span>
                    <span v-if="conversation.lastMessage" class="shrink-0 text-[11px] text-flixer-muted">{{ shortTime(conversation.lastMessage.createdAt) }}</span>
                  </span>
                  <span class="flex items-center justify-between gap-2">
                    <span class="truncate text-xs" :class="conversation.unread ? 'text-white' : 'text-flixer-muted'">{{ preview(conversation) }}</span>
                    <span v-if="conversation.unread" class="grid min-w-4 shrink-0 place-items-center rounded bg-flixer-accent px-1 text-[10px] font-bold leading-4 text-flixer-background">{{ conversation.unread > 99 ? '99+' : conversation.unread }}</span>
                  </span>
                </span>
              </RouterLink>
            </li>
          </ul>
        </aside>

        <section class="min-h-0 min-w-0 flex-col" :class="props.id ? 'flex' : 'hidden md:flex'" :aria-label="t('chat.thread')">
          <div v-if="!props.id" class="m-auto p-6 text-center text-sm text-flixer-muted">{{ t('chat.selectPrompt') }}</div>
          <div v-else-if="threadMissing" class="m-auto p-6 text-center">
            <p class="text-sm text-flixer-muted">{{ t('chat.notFound') }}</p>
            <RouterLink :to="{ name: 'chat' }" class="mt-3 inline-block rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20">{{ t('chat.back') }}</RouterLink>
          </div>
          <template v-else>
            <header class="flex items-center gap-3 border-b border-white/10 px-3 py-3 sm:px-4">
              <RouterLink :to="{ name: 'chat' }" class="grid size-9 shrink-0 place-items-center rounded-lg text-white/80 transition hover:bg-white/10 md:hidden" :aria-label="t('chat.back')">
                <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
              </RouterLink>
              <template v-if="active">
                <span class="block size-9 shrink-0 overflow-hidden rounded">
                  <UserAvatar v-if="active.kind === 'direct'" :avatar-url="otherMember(active)?.avatarUrl" :name="title(active)" />
                  <span v-else class="grid size-full place-items-center bg-gradient-to-br from-flixer-primary to-flixer-secondary text-white" aria-hidden="true">
                    <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="9" cy="8" r="3.5" />
                      <path d="M2.5 20c.6-3.5 3.2-5.5 6.5-5.5s5.9 2 6.5 5.5" />
                    </svg>
                  </span>
                </span>
                <div class="min-w-0 flex-1">
                  <RouterLink v-if="active.kind === 'direct'" :to="{ name: 'profile', params: { username: otherMember(active)?.username } }" class="block truncate text-sm font-semibold text-white hover:underline">{{ title(active) }}</RouterLink>
                  <h2 v-else class="truncate text-sm font-semibold text-white">{{ title(active) }}</h2>
                  <p v-if="active.kind === 'group'" class="truncate text-xs text-flixer-muted">{{ t('chat.memberCount', { count: active.members.length }, active.members.length) }}</p>
                </div>
                <button v-if="active.kind === 'direct' || isOwner" type="button" class="grid size-9 shrink-0 place-items-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-red-400" :aria-label="active.kind === 'group' ? t('chat.deleteGroup') : t('chat.deleteChat')" :title="active.kind === 'group' ? t('chat.deleteGroup') : t('chat.deleteChat')" @click="deleteActive">
                  <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 11v6m4-6v6" /></svg>
                </button>
                <button v-if="active.kind === 'group'" type="button" class="grid size-9 shrink-0 place-items-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white" :class="infoOpen ? 'bg-white/10' : ''" :aria-label="t('chat.groupInfo')" :aria-expanded="infoOpen" @click="infoOpen = !infoOpen">
                  <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 11v5M12 8h.01" />
                  </svg>
                </button>
              </template>
              <Skeleton v-else class="h-5 w-40" />
            </header>

            <div v-if="infoOpen && active?.kind === 'group'" class="max-h-64 shrink-0 space-y-3 overflow-y-auto border-b border-white/10 bg-white/[0.03] p-4">
              <form class="flex gap-2" @submit.prevent="rename">
                <input v-model="renameDraft" maxlength="60" class="min-w-0 flex-1 rounded-lg border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-flixer-accent" :aria-label="t('chat.groupName')" />
                <button type="submit" class="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 disabled:opacity-50" :disabled="!renameDraft.trim() || renameDraft.trim() === active.name">{{ t('chat.rename') }}</button>
              </form>
              <div class="flex items-center justify-between">
                <h3 class="text-xs font-semibold uppercase tracking-wide text-flixer-muted">{{ t('chat.members') }}</h3>
                <button type="button" class="text-xs font-semibold text-flixer-accent hover:underline" @click="addPeople">{{ t('chat.addPeople') }}</button>
              </div>
              <ul class="space-y-1">
                <li v-for="member in active.members" :key="member.username" class="flex items-center gap-3">
                  <span class="block size-7 shrink-0 overflow-hidden rounded"><UserAvatar :avatar-url="member.avatarUrl" :name="member.displayName" class="text-xs" /></span>
                  <RouterLink :to="{ name: 'profile', params: { username: member.username } }" class="min-w-0 flex-1 truncate text-sm text-white hover:underline">{{ member.displayName }}</RouterLink>
                  <span v-if="member.role === 'owner'" class="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-flixer-muted">{{ t('chat.owner') }}</span>
                  <button v-if="isOwner && member.username !== self" type="button" class="text-xs font-semibold text-red-400 hover:underline" @click="leaveOrRemove(member.username)">{{ t('chat.remove') }}</button>
                </li>
              </ul>
              <button v-if="self" type="button" class="text-xs font-semibold text-red-400 hover:underline" @click="leaveOrRemove(self)">{{ t('chat.leaveGroup') }}</button>
            </div>

            <div ref="scroller" class="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4 sm:px-4" role="log" aria-live="polite" :aria-label="t('chat.messages')">
              <p v-if="threadLoading" class="py-8 text-center text-sm text-flixer-muted">{{ t('common.loading') }}</p>
              <template v-else>
                <button v-if="hasMore" type="button" class="mx-auto mb-3 block rounded bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20" @click="loadEarlier">{{ t('chat.loadEarlier') }}</button>
                <p v-if="!messages.length" class="py-8 text-center text-sm text-flixer-muted">{{ t('chat.sayHello') }}</p>
                <template v-for="(message, index) in messages" :key="message.id">
                  <p v-if="message.kind === 'system'" class="py-1 text-center text-xs text-flixer-muted">{{ message.sender ? `${message.sender.displayName} ` : '' }}{{ message.body }}</p>
                  <div v-else class="flex" :class="message.sender?.username === self ? 'justify-end' : 'justify-start'">
                    <div class="max-w-[85%] sm:max-w-[70%]">
                      <p v-if="active?.kind === 'group' && message.sender?.username !== self && messages[index - 1]?.sender?.username !== message.sender?.username" class="mb-0.5 px-1 text-xs font-semibold text-flixer-muted">{{ message.sender?.displayName }}</p>
                      <p class="whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-sm" :class="message.sender?.username === self ? 'bg-flixer-accent text-flixer-background' : 'bg-white/10 text-white'" :title="fullTime(message.createdAt)">{{ message.body }}</p>
                      <p class="mt-0.5 px-1 text-[10px] text-flixer-muted" :class="message.sender?.username === self ? 'text-right' : ''">{{ shortTime(message.createdAt) }}</p>
                    </div>
                  </div>
                </template>
              </template>
            </div>

            <form class="border-t border-white/10 p-3" @submit.prevent="send">
              <p v-if="sendError" class="mb-2 text-xs text-red-400" role="alert">{{ sendError }}</p>
              <div class="flex items-end gap-2">
                <textarea ref="composer" v-model="draft" rows="1" maxlength="2000" class="max-h-32 min-h-10 min-w-0 flex-1 resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-base text-white placeholder:text-flixer-muted focus:outline-none focus:ring-2 focus:ring-flixer-accent" :placeholder="t('chat.writeMessage')" :aria-label="t('chat.writeMessage')" @keydown="onComposerKey" @focus="onComposerFocus" @blur="onComposerBlur"></textarea>
                <button type="submit" class="h-10 shrink-0 rounded-lg bg-white px-4 text-sm font-bold text-flixer-background transition hover:bg-white/85 disabled:opacity-50" :disabled="!draft.trim() || sending">{{ t('chat.send') }}</button>
              </div>
            </form>
          </template>
        </section>
      </div>
    </main>
    <MobileTabBar v-if="!pinned" :tabs="mobileTabs" />
  </div>
</template>
