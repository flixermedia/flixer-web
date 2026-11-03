<script setup lang="ts">
import { openModal } from '@kolirt/vue-modal'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRouter } from 'vue-router'
import { getChatConversation, getChatConversations, getChatMessages, getChatEncryptionStatus, downgradeChatToPlaintext, upgradeChatToEncrypted, deleteChatConversation, markChatRead, removeChatMember, renameChatGroup, sendChatMessage, type ChatConversation, type ChatMessageWithSequence } from '../api'
import NewChatModal from '../components/chat/NewChatModal.vue'
import Header from '../components/header/Header.vue'
import Skeleton from '../components/ui/Skeleton.vue'
import UserAvatar from '../components/ui/UserAvatar.vue'
import { getNavLinks } from '../composables/homeNav'
import { confirmAction } from '../composables/confirm'
import { decryptChatMessages, initializeChatMlsDevice, sendEncryptedChatMessage } from '../composables/chatMlsClient'
import { conversationTitle, onChatEvent, useChatUnread, viewingChat, type ChatEvent } from '../composables/useChat'
import { describeRequestError, useProfile } from '../composables/useProfile'
import { useSignOut } from '../composables/useSignOut.ts'
import { catchError } from '../utils/catchError'

const props = defineProps<{ id?: string }>()
type ChatPreviewMessage = NonNullable<ChatConversation['lastMessage']> & { encrypted?: boolean }
type SupportChatConversation = Omit<ChatConversation, 'lastMessage'> & { lastMessage: ChatPreviewMessage | null; supportChatOpen?: boolean | null }
const { t } = useI18n()
const router = useRouter()
const { isSigningOut, signOut } = useSignOut()
const navLinks = computed(getNavLinks)
const { profile, load: loadProfile } = useProfile()
const unread = useChatUnread()

const conversations = ref<SupportChatConversation[]>([])
const listLoading = ref(true)
const listFailed = ref(false)
const active = ref<SupportChatConversation | null>(null)
const messages = ref<ChatMessageWithSequence[]>([])
const decryptedBodies = ref(new Map<string, string>())
const previewBodies = ref(new Map<string, string>())
const decryptingPreviewIds = new Set<string>()
const unavailableMessageIds = ref(new Set<string>())
const encryptionMode = ref<'unknown' | 'plain' | 'encrypted' | 'error'>('unknown')
const encryptionError = ref('')
const allowUserDowngrade = ref(false)
const canUseEncryptedChat = ref(false)
const downgrading = ref(false)
const historyWarning = ref('')
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

// On phones the chat is locked below the header (the tab bar is hidden on this page) and the page itself never scrolls.
// While typing it follows the visual viewport so the iOS keyboard can't shift the page.
const typing = ref(false)
const frame = ref({ top: 0, height: 0 })
const headerShift = ref(0)
let headerHeight = 64
const phone = window.matchMedia('(max-width: 767px)')
const isPhone = ref(phone.matches)
const locked = computed(() => isPhone.value)

function onPhoneChange() {
  isPhone.value = phone.matches
  syncViewport()
}

function syncViewport() {
  // The chat scrolls inside its own panes, so the page itself never scrolls at any size.
  document.documentElement.style.overflow = 'hidden'
  if (!isPhone.value) return
  const vv = window.visualViewport
  const headerEl = document.querySelector('header.fixed')
  if (headerEl && !typing.value) headerHeight = headerEl.getBoundingClientRect().height
  const viewTop = vv?.offsetTop ?? 0
  const viewBottom = viewTop + (vv?.height ?? window.innerHeight)
  // iOS scrolls the visual viewport when the keyboard opens, so the navbar rides along with it.
  headerShift.value = typing.value ? viewTop : 0
  const top = viewTop + headerHeight
  const bottom = typing.value ? viewBottom : window.innerHeight
  frame.value = { top, height: Math.max(0, bottom - top) }
  if (typing.value) window.scrollTo(0, 0)
}

function onComposerFocus() {
  typing.value = isPhone.value
  syncViewport()
  setTimeout(syncViewport, 300)
  scrollToEnd()
}

function onComposerBlur() {
  typing.value = false
  syncViewport()
  setTimeout(syncViewport, 300)
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
  if (last.kind === 'text' && 'encrypted' in last && last.encrypted === true) {
    const text = previewBodies.value.get(last.id)
    if (text === undefined) return t('chat.encryptedMessage')
    const mine = last.sender?.username === self.value
    const prefix = mine ? `${t('chat.you')}: ` : conversation.kind === 'group' && last.sender ? `${last.sender.displayName}: ` : ''
    return prefix + text
  }
  if (last.kind === 'system') return last.body
  const mine = last.sender?.username === self.value
  const prefix = mine ? `${t('chat.you')}: ` : conversation.kind === 'group' && last.sender ? `${last.sender.displayName}: ` : ''
  return prefix + last.body
}

function messageBody(message: ChatMessageWithSequence) {
  if (message.encrypted !== true) return message.body
  if (decryptedBodies.value.has(message.id)) return decryptedBodies.value.get(message.id) ?? ''
  return unavailableMessageIds.value.has(message.id) ? t('chat.encryptedMessageUnavailable') : t('chat.encryptedMessage')
}

function mergeDecrypted(incoming: Map<string, string>) {
  if (incoming.size === 0) return
  decryptedBodies.value = new Map([...decryptedBodies.value, ...incoming])
}

async function configureEncryption() {
  try {
    await loadProfile()
    const userId = profile.value?.id
    if (!userId) throw new Error('Your account profile is unavailable.')
    const status = await getChatEncryptionStatus()
    allowUserDowngrade.value = status.allowUserDowngrade
    const device = status.supported ? await initializeChatMlsDevice(userId) : null
    canUseEncryptedChat.value = device?.status === 'active'
    const conversationIsEncrypted = active.value?.encryptionMode === 'encrypted'
    encryptionMode.value = conversationIsEncrypted ? 'encrypted' : 'plain'
    if (conversationIsEncrypted && !device) {
      throw new Error(t('chat.encryptionUnavailable'))
    }
    if (conversationIsEncrypted && device?.status === 'pending') {
      encryptionError.value = t('chat.deviceApprovalRequired')
    } else {
      encryptionError.value = ''
    }
    return device
  } catch (error) {
    canUseEncryptedChat.value = false
    encryptionMode.value = 'error'
    encryptionError.value = describeRequestError(error, t('chat.encryptionUnavailable'))
    console.error('[chat encryption] initialization failed', error)
    return null
  }
}

async function decryptForDisplay(incoming: ChatMessageWithSequence[], userId: string) {
  if (!incoming.some((message) => message.encrypted === true)) return
  try {
    const result = await decryptChatMessages(userId, active.value?.id ?? props.id ?? '', incoming)
    mergeDecrypted(result.messages)
    const unavailable = new Set(unavailableMessageIds.value)
    for (const id of result.unavailableMessageIds) unavailable.add(id)
    for (const id of result.messages.keys()) unavailable.delete(id)
    unavailableMessageIds.value = unavailable
    historyWarning.value = unavailable.size > 0 ? t('chat.encryptedHistoryUnavailable') : ''
    encryptionError.value = ''
  } catch (error) {
    encryptionError.value = describeRequestError(error, t('chat.encryptionUnavailable'))
    console.error('[chat encryption] message decryption failed', error)
  }
}

async function decryptConversationPreviews(items: SupportChatConversation[]) {
  try {
    if (!profile.value?.id) await loadProfile()
    const userId = profile.value?.id
    if (!userId) return
    await Promise.all(items.map(async (conversation) => {
      const last = conversation.lastMessage
      if (!last || last.kind !== 'text' || last.encrypted !== true || previewBodies.value.has(last.id) || decryptingPreviewIds.has(last.id)) return
      decryptingPreviewIds.add(last.id)
      try {
        const result = await decryptChatMessages(userId, conversation.id, [last], false, false)
        const text = result.messages.get(last.id)
        if (text !== undefined) previewBodies.value = new Map(previewBodies.value).set(last.id, text)
      } catch (error) {
        console.error('[chat encryption] conversation preview could not be decrypted', { conversationId: conversation.id, messageId: last.id, error })
      } finally {
        decryptingPreviewIds.delete(last.id)
      }
    }))
  } catch (error) {
    console.error('[chat encryption] conversation previews could not be loaded', error)
  }
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
  void decryptConversationPreviews(conversations.value)
}

async function refreshList(silent = true) {
  if (!silent) listLoading.value = true
  try {
    const [error, result] = await catchError(getChatConversations())
    if (error) {
      if (!silent) listFailed.value = true
      return
    }
    applyList(result)
    listFailed.value = false
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

function merge(incoming: ChatMessageWithSequence[]) {
  const seen = new Set(messages.value.map((message) => message.id))
  const fresh = incoming.filter((message) => !seen.has(message.id))
  if (!fresh.length) return false
  messages.value = [...messages.value, ...fresh].sort((a, b) => {
    const left = BigInt(a.sequence)
    const right = BigInt(b.sequence)
    return left < right ? -1 : left > right ? 1 : 0
  })
  return true
}

async function openThread(id: string | undefined) {
  const token = ++threadToken
  active.value = null
  messages.value = []
  decryptedBodies.value = new Map()
  unavailableMessageIds.value = new Set()
  historyWarning.value = ''
  encryptionMode.value = 'unknown'
  encryptionError.value = ''
  hasMore.value = false
  threadMissing.value = false
  infoOpen.value = false
  sendError.value = ''
  if (!id) return
  threadLoading.value = true
  try {
    const [error, result] = await catchError(Promise.all([getChatConversation(id), getChatMessages(id)]))
    if (error) {
      if (token === threadToken) threadMissing.value = true
      return
    }
    if (token !== threadToken) return
    const [conversation, page] = result
    active.value = conversation
    renameDraft.value = conversation.name ?? ''
    messages.value = page.messages
    hasMore.value = page.hasMore
    const device = await configureEncryption()
    if (token !== threadToken) return
    if (device?.status === 'active' && profile.value?.id) {
      await decryptForDisplay(page.messages, profile.value.id)
    }
    conversations.value = conversations.value.map((entry) => (entry.id === id ? { ...entry, unread: 0 } : entry))
    unread.set(conversations.value.reduce((total, entry) => total + entry.unread, 0))
    scrollToEnd()
  } finally {
    if (token === threadToken) threadLoading.value = false
  }
}

async function pollThread(id: string, token: number) {
  if (token !== threadToken) return
  const last = messages.value[messages.value.length - 1]
  const stick = nearBottom()
  const [pageError, page] = await catchError(getChatMessages(id, last ? { afterSequence: last.sequence } : {}))
  if (pageError) return // The next tick retries.
  if (token !== threadToken) return
  if (profile.value?.id) {
    await decryptForDisplay(page.messages, profile.value.id)
    if (token !== threadToken) return
  }
  if (merge(page.messages)) {
    if (page.messages.some((message) => message.kind === 'system')) {
      const [conversationError, conversation] = await catchError(getChatConversation(id))
      if (conversationError) return // The next tick retries.
      active.value = conversation
    }
    if (stick) scrollToEnd()
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
    if (encryptionMode.value === 'encrypted') {
      void pollThread(id, threadToken)
      void refreshList()
      return
    }
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
  const [error, conversation] = await catchError(getChatConversation(id))
  if (error) {
    if (token === threadToken) threadMissing.value = true
    return
  }
  if (token !== threadToken) return
  threadMissing.value = false
  active.value = conversation
  encryptionMode.value = conversation.encryptionMode === 'encrypted' ? 'encrypted' : 'plain'
  renameDraft.value = conversation.name ?? ''
  await pollThread(id, token)
}

async function loadEarlier() {
  const first = messages.value[0]
  if (!first || !props.id) return
  const el = scroller.value
  const previous = el?.scrollHeight ?? 0
  try {
    const page = await getChatMessages(props.id, { beforeSequence: first.sequence })
    if (profile.value?.id) {
      await decryptForDisplay(page.messages, profile.value.id)
    }
    merge(page.messages)
    hasMore.value = page.hasMore
    await nextTick()
    if (el) el.scrollTop = el.scrollHeight - previous
  } catch (error) {
    encryptionError.value = describeRequestError(error, t('chat.loadError'))
  }
}

async function downgradeActiveToPlaintext() {
  const conversation = active.value
  if (!conversation || conversation.encryptionMode !== 'encrypted' || !allowUserDowngrade.value || downgrading.value) return
  const ok = await confirmAction(t('chat.downgradeConfirmMessage'), {
    title: t('chat.downgradeConfirmTitle'),
    confirmLabel: t('chat.downgradeConfirm'),
    danger: true,
  })
  if (!ok) return

  downgrading.value = true
  const [error, downgraded] = await catchError(downgradeChatToPlaintext(conversation.id))
  downgrading.value = false
  if (error) {
    sendError.value = describeRequestError(error, t('chat.downgradeError'))
    return
  }
  active.value = downgraded
  encryptionMode.value = 'plain'
  encryptionError.value = ''
  void refreshList()
}

async function upgradeActiveToEncrypted() {
  const conversation = active.value
  if (!conversation || conversation.encryptionMode !== 'plaintext' || !canUseEncryptedChat.value || downgrading.value) return
  const ok = await confirmAction(t('chat.upgradeConfirmMessage'), {
    title: t('chat.upgradeConfirmTitle'),
    confirmLabel: t('chat.upgradeConfirm'),
  })
  if (!ok) return

  downgrading.value = true
  const [error, upgraded] = await catchError(upgradeChatToEncrypted(conversation.id))
  downgrading.value = false
  if (error) {
    sendError.value = describeRequestError(error, t('chat.upgradeError'))
    return
  }
  active.value = upgraded
  encryptionMode.value = 'encrypted'
  encryptionError.value = ''
  void pollThread(upgraded.id, threadToken)
  void refreshList()
}

async function send() {
  const body = draft.value.trim()
  if (!body || !props.id || sending.value) return
  sending.value = true
  sendError.value = ''
  try {
    if (encryptionMode.value === 'unknown' || encryptionMode.value === 'error') {
      sendError.value = encryptionError.value || t('chat.encryptionUnavailable')
      return
    }
    let message: ChatMessageWithSequence
    if (encryptionMode.value === 'encrypted') {
      const userId = profile.value?.id
      if (!userId) throw new Error(t('chat.encryptionUnavailable'))
      const result = await sendEncryptedChatMessage(userId, props.id, body)
      message = result.message
      decryptedBodies.value = new Map(decryptedBodies.value).set(message.id, result.plaintext)
    } else {
      const [error, sent] = await catchError(sendChatMessage(props.id, body))
      if (error) {
        sendError.value = describeRequestError(error, t('chat.sendError'))
        return
      }
      message = sent
    }
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
  const [error, result] = await catchError(openModal(NewChatModal))
  if (error) return // Dismissed.
  const conversation = result as ChatConversation | undefined
  if (conversation) {
    await refreshList()
    void router.push({ name: 'chat', params: { id: conversation.id } })
  }
}

async function addPeople() {
  if (!active.value) return
  const [error, result] = await catchError(openModal(NewChatModal, { props: { addTo: { id: active.value.id, usernames: active.value.members.map((member) => member.username) } } }))
  if (error) return // Dismissed.
  const conversation = result as ChatConversation | undefined
  if (conversation) {
    active.value = conversation
    void pollThread(conversation.id, threadToken)
    void refreshList()
  }
}

async function rename() {
  const name = renameDraft.value.trim()
  if (!active.value || !name || name === active.value.name) return
  const [error, conversation] = await catchError(renameChatGroup(active.value.id, name))
  if (error) {
    sendError.value = describeRequestError(error, t('chat.createError'))
    return
  }
  active.value = conversation
  void pollThread(active.value.id, threadToken)
  void refreshList()
}

async function leaveOrRemove(username: string) {
  if (!active.value) return
  const leaving = username === self.value
  const ok = await confirmAction(leaving ? t('chat.leaveConfirm') : t('chat.removeConfirm'), { title: leaving ? t('chat.leaveGroup') : t('chat.removePerson'), confirmLabel: leaving ? t('chat.leave') : t('chat.remove'), danger: true })
  if (!ok) return
  const [removeError] = await catchError(removeChatMember(active.value.id, username))
  if (removeError) {
    sendError.value = describeRequestError(removeError, t('chat.createError'))
    return
  }
  if (leaving) {
    await refreshList()
    void router.push({ name: 'chat' })
  } else {
    const [conversationError, conversation] = await catchError(getChatConversation(active.value.id))
    if (conversationError) {
      sendError.value = describeRequestError(conversationError, t('chat.createError'))
      return
    }
    active.value = conversation
    void pollThread(conversation.id, threadToken)
  }
}

async function deleteActive() {
  const conversation = active.value
  if (!conversation) return
  const group = conversation.kind === 'group'
  const ok = await confirmAction(group ? t('chat.deleteGroupConfirm') : t('chat.deleteChatConfirm'), { title: group ? t('chat.deleteGroup') : t('chat.deleteChat'), confirmLabel: t('chat.delete'), danger: true })
  if (!ok) return
  const [error] = await catchError(deleteChatConversation(conversation.id))
  if (error) {
    sendError.value = describeRequestError(error, t('chat.createError'))
    return
  }
  await refreshList()
  void router.push({ name: 'chat' })
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
  phone.addEventListener('change', onPhoneChange)
  window.addEventListener('resize', syncViewport)
  syncViewport()
  setTimeout(syncViewport, 300)
  window.visualViewport?.addEventListener('resize', syncViewport)
  window.visualViewport?.addEventListener('scroll', syncViewport)
  document.addEventListener('visibilitychange', onVisible)
})

onBeforeUnmount(() => {
  viewingChat.value = null
  threadToken++
  stopEvents?.()
  phone.removeEventListener('change', onPhoneChange)
  window.removeEventListener('resize', syncViewport)
  document.documentElement.style.overflow = ''
  window.visualViewport?.removeEventListener('resize', syncViewport)
  window.visualViewport?.removeEventListener('scroll', syncViewport)
  document.removeEventListener('visibilitychange', onVisible)
})
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-flixer-background font-sans text-flixer-text md:pb-0">
    <Header :docked="isPhone" :style="headerShift ? { transform: `translateY(${headerShift}px)` } : undefined" :links="navLinks" :is-signing-out="isSigningOut" @logout="signOut" />
    <main class="page-gutter pt-28 sm:pt-32">
      <div class="chat-grid grid grid-rows-[minmax(0,1fr)] overflow-hidden border-white/10 md:h-[calc(100dvh-11rem)] md:grid-cols-[20rem_minmax(0,1fr)] md:rounded md:border" :class="locked ? 'fixed inset-x-0 z-30 bg-flixer-background' : ''" :style="locked ? { top: `${frame.top}px`, height: `${frame.height}px` } : undefined">
        <aside class="chat-pane flex min-h-0 flex-col border-white/10 bg-flixer-background max-md:absolute max-md:inset-0 md:border-r" :class="props.id ? 'max-md:-translate-x-1/4 max-md:opacity-0 max-md:pointer-events-none' : ''" :inert="isPhone && !!props.id" :aria-label="t('chat.conversations')">
          <div class="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
            <h1 class="text-lg font-bold text-white">{{ t('chat.title') }}</h1>
            <button type="button" class="flex items-center gap-1.5 rounded bg-white px-3 py-1.5 text-xs font-bold text-flixer-background transition hover:bg-white/85" @click="newChat">
              <Icon icon="lucide:plus" class="size-3.5" aria-hidden="true" />
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
              <RouterLink :to="{ name: 'chat', params: { id: conversation.id } }" class="flex items-center gap-3 rounded px-2 py-2.5 transition motion-reduce:transition-none hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="conversation.id === props.id ? 'bg-white/10' : ''">
                <span class="relative block size-11 shrink-0 overflow-hidden rounded">
                  <UserAvatar v-if="conversation.kind === 'direct'" :avatar-url="otherMember(conversation)?.avatarUrl" :name="title(conversation)" />
                  <span v-else class="grid size-full place-items-center bg-gradient-to-br from-flixer-primary to-flixer-secondary text-white" aria-hidden="true">
                    <Icon icon="lucide:users-round" class="size-5" aria-hidden="true" />
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

        <section class="chat-pane flex min-h-0 min-w-0 flex-col bg-flixer-background max-md:absolute max-md:inset-0" :class="props.id ? '' : 'max-md:translate-x-full max-md:pointer-events-none'" :inert="isPhone && !props.id" :aria-label="t('chat.thread')">
          <div :key="props.id ?? 'none'" class="chat-fade flex min-h-0 flex-1 flex-col">
            <div v-if="!props.id" class="m-auto p-6 text-center text-sm text-flixer-muted">{{ t('chat.selectPrompt') }}</div>
            <div v-else-if="threadMissing" class="m-auto p-6 text-center">
              <p class="text-sm text-flixer-muted">{{ t('chat.notFound') }}</p>
              <RouterLink :to="{ name: 'chat' }" class="mt-3 inline-block rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20">{{ t('chat.back') }}</RouterLink>
            </div>
            <template v-else>
              <header class="flex items-center gap-3 border-b border-white/10 px-3 py-3 sm:px-4">
                <RouterLink :to="{ name: 'chat' }" class="grid size-9 shrink-0 place-items-center rounded text-white/80 transition hover:bg-white/10 md:hidden" :aria-label="t('chat.back')">
                  <Icon icon="lucide:chevron-left" class="size-5" aria-hidden="true" />
                </RouterLink>
                <template v-if="active">
                  <span class="block size-9 shrink-0 overflow-hidden rounded">
                    <UserAvatar v-if="active.kind === 'direct'" :avatar-url="otherMember(active)?.avatarUrl" :name="title(active)" />
                    <span v-else class="grid size-full place-items-center bg-gradient-to-br from-flixer-primary to-flixer-secondary text-white" aria-hidden="true">
                      <Icon icon="lucide:users-round" class="size-4" aria-hidden="true" />
                    </span>
                  </span>
                  <div class="min-w-0 flex-1">
                    <RouterLink v-if="active.kind === 'direct'" :to="{ name: 'profile', params: { username: otherMember(active)?.username } }" class="block truncate text-sm font-semibold text-white hover:underline">{{ title(active) }}</RouterLink>
                    <h2 v-else class="truncate text-sm font-semibold text-white">{{ title(active) }}</h2>
                    <p v-if="active.kind === 'group'" class="truncate text-xs text-flixer-muted">{{ t('chat.memberCount', { count: active.members.length }, active.members.length) }}</p>
                  </div>
                  <button v-if="active.encryptionMode === 'encrypted' && allowUserDowngrade" type="button" class="flex shrink-0 items-center gap-1 rounded px-2 py-1 text-xs font-medium text-amber-200 transition hover:bg-white/10 disabled:opacity-50" :disabled="downgrading" @click="downgradeActiveToPlaintext">
                    <Icon icon="lucide:lock-open" class="size-3.5" aria-hidden="true" />
                    {{ t('chat.downgradeToPlaintext') }}
                  </button>
                  <button v-if="active.encryptionMode === 'plaintext' && canUseEncryptedChat" type="button" class="flex shrink-0 items-center gap-1 rounded px-2 py-1 text-xs font-medium text-emerald-200 transition hover:bg-white/10 disabled:opacity-50" :disabled="downgrading" @click="upgradeActiveToEncrypted">
                    <Icon icon="lucide:lock-keyhole" class="size-3.5" aria-hidden="true" />
                    {{ t('chat.upgradeToEncrypted') }}
                  </button>
                  <span v-if="encryptionMode === 'encrypted' && !encryptionError" class="hidden shrink-0 items-center gap-1 text-[10px] font-medium text-emerald-300 sm:flex" :aria-label="t('chat.encrypted')">
                    <Icon icon="lucide:lock-keyhole" class="size-3.5" aria-hidden="true" />
                    {{ t('chat.encrypted') }}
                  </span>
                  <button v-if="active.kind === 'direct' || isOwner || typeof active.supportChatOpen === 'boolean'" type="button" class="grid size-9 shrink-0 place-items-center rounded text-white/80 transition hover:bg-white/10 hover:text-red-400" :aria-label="active.kind === 'group' ? t('chat.deleteGroup') : t('chat.deleteChat')" :title="active.kind === 'group' ? t('chat.deleteGroup') : t('chat.deleteChat')" @click="deleteActive">
                    <Icon icon="lucide:trash" class="size-5" aria-hidden="true" />
                  </button>
                  <button v-if="active.kind === 'group'" type="button" class="grid size-9 shrink-0 place-items-center rounded text-white/80 transition hover:bg-white/10 hover:text-white" :class="infoOpen ? 'bg-white/10' : ''" :aria-label="t('chat.groupInfo')" :aria-expanded="infoOpen" @click="infoOpen = !infoOpen">
                    <Icon icon="lucide:circle-question-mark" class="size-5" aria-hidden="true" />
                  </button>
                </template>
                <Skeleton v-else class="h-5 w-40" />
              </header>

              <div v-if="infoOpen && active?.kind === 'group'" class="max-h-64 shrink-0 space-y-3 overflow-y-auto border-b border-white/10 bg-white/[0.03] p-4">
                <form class="flex gap-2" @submit.prevent="rename">
                  <input v-model="renameDraft" maxlength="60" class="min-w-0 flex-1 rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-flixer-accent" :aria-label="t('chat.groupName')" />
                  <button type="submit" class="rounded bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 disabled:opacity-50" :disabled="!renameDraft.trim() || renameDraft.trim() === active.name">{{ t('chat.rename') }}</button>
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
                <p v-if="encryptionError" class="mx-auto mb-3 max-w-lg rounded border border-amber-300/30 bg-amber-400/10 p-3 text-center text-xs text-amber-100" role="status">{{ encryptionError }}</p>
                <p v-if="historyWarning" class="mx-auto mb-3 max-w-lg rounded border border-amber-300/30 bg-amber-400/10 p-3 text-center text-xs text-amber-100" role="status">{{ historyWarning }}</p>
                <p v-if="threadLoading" class="py-8 text-center text-sm text-flixer-muted">{{ t('common.loading') }}</p>
                <template v-else>
                  <button v-if="hasMore" type="button" class="mx-auto mb-3 block rounded bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20" @click="loadEarlier">{{ t('chat.loadEarlier') }}</button>
                  <p v-if="!messages.length" class="py-8 text-center text-sm text-flixer-muted">{{ t('chat.sayHello') }}</p>
                  <template v-for="(message, index) in messages" :key="message.id">
                    <p v-if="message.kind === 'system'" class="py-1 text-center text-xs text-flixer-muted">{{ message.sender ? `${message.sender.displayName} ` : '' }}{{ message.body }}</p>
                    <div v-else class="flex" :class="message.sender?.username === self ? 'justify-end' : 'justify-start'">
                      <div class="max-w-[85%] sm:max-w-[70%]">
                        <p v-if="active?.kind === 'group' && message.sender?.username !== self && messages[index - 1]?.sender?.username !== message.sender?.username" class="mb-0.5 px-1 text-xs font-semibold text-flixer-muted">{{ message.sender?.displayName }}</p>
                        <p class="whitespace-pre-wrap break-words rounded px-3 py-2 text-sm" :class="message.sender?.username === self ? 'bg-flixer-accent text-flixer-background' : 'bg-white/10 text-white'" :title="fullTime(message.createdAt)">{{ messageBody(message) }}</p>
                        <p class="mt-0.5 px-1 text-[10px] text-flixer-muted" :class="message.sender?.username === self ? 'text-right' : ''">{{ shortTime(message.createdAt) }}</p>
                      </div>
                    </div>
                  </template>
                </template>
              </div>

              <form class="border-t border-white/10 p-3" @submit.prevent="send">
                <div v-if="active?.supportChatOpen === false" class="rounded border border-amber-300/30 bg-amber-400/10 p-3" role="status">
                  <p class="text-sm font-semibold text-amber-100">{{ t('chat.issueChatClosedTitle') }}</p>
                  <p class="mt-1 text-sm leading-5 text-amber-100/80">{{ t('chat.issueChatClosedDescription') }}</p>
                </div>
                <template v-else>
                  <p v-if="sendError" class="mb-2 text-xs text-red-400" role="alert">{{ sendError }}</p>
                  <div class="flex items-end gap-2">
                    <textarea ref="composer" v-model="draft" rows="1" maxlength="2000" class="max-h-32 min-h-10 min-w-0 flex-1 resize-none rounded border border-white/10 bg-white/5 px-3 py-2 text-base text-white placeholder:text-flixer-muted focus:outline-none focus:ring-2 focus:ring-flixer-accent" :placeholder="t('chat.writeMessage')" :aria-label="t('chat.writeMessage')" @keydown="onComposerKey" @focus="onComposerFocus" @blur="onComposerBlur"></textarea>
                    <button type="submit" class="h-10 shrink-0 rounded bg-white px-4 text-sm font-bold text-flixer-background transition hover:bg-white/85 disabled:opacity-50" :disabled="!draft.trim() || sending || encryptionMode === 'unknown' || encryptionMode === 'error' || (encryptionMode === 'encrypted' && !!encryptionError)">{{ t('chat.send') }}</button>
                  </div>
                </template>
              </form>
            </template>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>
.chat-pane {
  transition:
    transform 300ms cubic-bezier(0.32, 0.72, 0, 1),
    opacity 300ms ease;
}

.chat-fade {
  animation: chat-fade-in 220ms ease-out;
}

@keyframes chat-fade-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}

@media (min-width: 768px) {
  :global(html.has-mini-player) .chat-grid {
    height: calc(100dvh - 11rem - 3rem);
  }

  .chat-pane {
    transition: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .chat-pane,
  .chat-fade {
    transition: none;
    animation: none;
  }
}
</style>
