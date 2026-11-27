<script setup lang="ts">
import { Button } from '@ui-sdk/vue/button'
import { Input } from '@ui-sdk/vue/input'
import { openModal } from '@kolirt/vue-modal'
import { Capacitor, type PluginListenerHandle } from '@capacitor/core'
import { Keyboard } from '@capacitor/keyboard'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { getChatConversation, getChatConversations, getChatMessages, getChatEncryptionStatus, downgradeChatToPlaintext, upgradeChatToEncrypted, deleteChatConversation, markChatRead, removeChatMember, renameChatGroup, sendChatMessage, type ChatConversation, type ChatMessageWithSequence } from '../api'
import MailList from '../components/chat/MailList.vue'
import MailReader from '../components/chat/MailReader.vue'
import PartyChat from '../components/party/PartyChat.vue'
import NewChatModal from '../components/chat/NewChatModal.vue'
import MobileTabBar from '../components/home/MobileTabBar.vue'
import Skeleton from '../components/ui/Skeleton.vue'
import UserAvatar from '../components/ui/UserAvatar.vue'
import { getMobileTabs } from '../composables/homeNav'
import { confirmAction } from '../composables/confirm'
import { refreshChatCallAvailability, useChatCall } from '../composables/useChatCall'
import { decryptChatMessages, initializeChatMlsDevice, sendEncryptedChatMessage } from '../composables/chatMlsClient'
import { conversationTitle, getUserPresence, maybeChimeForMessage, onChatEvent, presenceDotClass, useChatUnread, viewingChat, type ChatEvent } from '../composables/useChat'
import { describeRequestError, useProfile } from '../composables/useProfile'
import { useParty } from '../composables/useParty'
import { useMailbox } from '../composables/useMailbox'
import { usePrioritySupportChat } from '../composables/usePrioritySupportChat'
import { catchError } from '../utils/catchError'
import { runOptimistic } from '../utils/optimistic'

const props = defineProps<{ id?: string }>()
type ChatPreviewMessage = NonNullable<ChatConversation['lastMessage']> & { encrypted?: boolean }
type SupportChatConversation = Omit<ChatConversation, 'lastMessage'> & { lastMessage: ChatPreviewMessage | null; supportChatOpen?: boolean | null }
const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const mail = useMailbox()
const mailEnabled = computed(() => !!mail.mailbox.value?.enabled)
const mailMode = computed(() => mailEnabled.value && route.query.tab === 'mail')
const party = useParty()
const partyMode = computed(() => !!party.party.value && !mailMode.value && route.query.tab === 'party')
const prioritySupport = usePrioritySupportChat()
const priorityMode = computed(() => prioritySupport.hasPrioritySupport.value && !mailMode.value && route.query.tab === 'support')
const priorityScroller = ref<HTMLElement | null>(null)
const hasSelection = computed(() => (partyMode.value || priorityMode.value ? true : mailMode.value ? !!mail.selectedId.value : !!props.id))
const isSupportThread = computed(() => !!active.value && (typeof active.value.supportChatOpen === 'boolean' || Boolean(active.value.name?.startsWith('Ticket: '))))
watch(partyMode, (open) => party.setChatOpen(open), { immediate: true })
watch(
  priorityMode,
  (open) => {
    if (open) {
      void prioritySupport.openChat(false)
      void nextTick(() => {
        if (priorityScroller.value) priorityScroller.value.scrollTop = priorityScroller.value.scrollHeight
      })
    }
  },
  { immediate: true },
)
watch(
  () => prioritySupport.messages.value.length,
  () => {
    if (priorityMode.value) {
      void nextTick(() => {
        if (priorityScroller.value) priorityScroller.value.scrollTop = priorityScroller.value.scrollHeight
      })
    }
  },
)
watch(
  [() => prioritySupport.isOpen.value, () => prioritySupport.hasPrioritySupport.value, () => props.id, () => route.query.tab],
  ([open, entitled, id, tab]) => {
    if (open && entitled && !id && !tab && !isCompact.value) {
      void router.replace({ name: 'chat', query: { tab: 'support' } })
    }
  },
  { immediate: true },
)
function onPriorityKey(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault()
    void prioritySupport.sendMessage()
  }
}
onBeforeUnmount(() => {
  if (partyMode.value) party.setChatOpen(false)
})
const mobileTabs = computed(getMobileTabs)
const { profile, load: loadProfile } = useProfile()
const unread = useChatUnread()

const conversations = ref<SupportChatConversation[]>([])
const searchQuery = ref('')
const chatFilter = ref<'all' | 'unread' | 'groups' | 'support'>('all')
const detailsOpen = ref(true)
const detailsSection = ref<'info' | 'privacy' | null>('info')
const filteredConversations = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return conversations.value.filter((c) => {
    if (chatFilter.value === 'unread' && !c.unread) return false
    if (chatFilter.value === 'groups' && c.kind !== 'group') return false
    if (chatFilter.value === 'support' && typeof c.supportChatOpen !== 'boolean' && !c.name?.startsWith('Ticket: ')) return false
    if (!q) return true
    const name = title(c).toLowerCase()
    const last = preview(c).toLowerCase()
    return name.includes(q) || last.includes(q)
  })
})
const listLoading = ref(true)
const listFailed = ref(false)
const chatCall = useChatCall()
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
const composerInsets = ref<{ paddingLeft?: string; paddingRight?: string }>({})

// Keep the fixed chat frame above the keyboard on platforms where the viewport does not resize.
const composerFocused = ref(false)
const frame = ref({ top: 0, height: 0 })
let headerHeight = 64
let composerBlurTimer: ReturnType<typeof setTimeout> | undefined
let composerAlignmentObserver: ResizeObserver | undefined
let keyboardBottom: number | undefined
let viewportBottomBeforeKeyboard: number | undefined
let keyboardListeners: PluginListenerHandle[] = []
let chatViewUnmounted = false
const compactScreen = window.matchMedia('(max-width: 1023px)')
const isCompact = ref(compactScreen.matches)
const locked = computed(() => isCompact.value)

function onCompactScreenChange() {
  isCompact.value = compactScreen.matches
  if (!isCompact.value) {
    clearTimeout(composerBlurTimer)
    composerFocused.value = false
  }
  syncViewport()
}

function bottomNavigationInset() {
  if (document.documentElement.classList.contains('native-navigation')) {
    const app = document.querySelector<HTMLElement>('#app')
    const rootStyle = getComputedStyle(document.documentElement)
    const appInset = app ? Number.parseFloat(getComputedStyle(app).paddingBottom) || 0 : 0
    const navigationInset = Number.parseFloat(rootStyle.getPropertyValue('--cap-native-navigation-bottom')) || 0
    const systemTabBarInset = Number.parseFloat(rootStyle.getPropertyValue('--cap-native-system-tabbar-height')) || 0
    return Math.max(appInset, navigationInset, systemTabBarInset)
  }
  const tabBar = document.querySelector<HTMLElement>('.mobile-tab-bar')
  if (!tabBar || getComputedStyle(tabBar).display === 'none') return 0
  return Math.max(0, window.innerHeight - tabBar.getBoundingClientRect().top)
}

function syncComposerAlignment() {
  const grid = document.querySelector<HTMLElement>('.chat-grid')
  const nav = document.querySelector<HTMLElement>('.mobile-tab-bar')
  const navSurface = document.querySelector<HTMLElement>('.mobile-tab-bar__surface')
  if (!grid || !nav || !navSurface || getComputedStyle(nav).display === 'none') {
    composerInsets.value = {}
    return
  }
  const gridRect = grid.getBoundingClientRect()
  const navRect = navSurface.getBoundingClientRect()
  if (navRect.width === 0 || navRect.height === 0) {
    composerInsets.value = {}
    return
  }
  composerInsets.value = {
    paddingLeft: `${Math.max(12, navRect.left - gridRect.left)}px`,
    paddingRight: `${Math.max(12, gridRect.right - navRect.right)}px`
  }
}

function syncViewport() {
  // The chat scrolls inside its own panes, so the page itself never scrolls at any size.
  document.documentElement.style.overflow = 'hidden'
  if (!isCompact.value) return
  const headerEl = document.querySelector('header.fixed')
  if (headerEl) headerHeight = headerEl.getBoundingClientRect().bottom
  const top = headerHeight
  const layoutBottom = window.innerHeight - bottomNavigationInset()
  const visualViewport = window.visualViewport
  const visibleBottom = visualViewport ? visualViewport.offsetTop + visualViewport.height : window.innerHeight
  const bottom = Math.min(layoutBottom, visibleBottom, keyboardBottom ?? window.innerHeight)
  frame.value = { top, height: Math.max(0, bottom - top) }
}

function onKeyboardWillShow({ keyboardHeight }: { keyboardHeight: number }) {
  const visualViewport = window.visualViewport
  const visibleBottom = viewportBottomBeforeKeyboard
    ?? (visualViewport ? visualViewport.offsetTop + visualViewport.height : window.innerHeight)
  keyboardBottom = visibleBottom - keyboardHeight
  syncViewport()
}

function onKeyboardWillHide() {
  keyboardBottom = undefined
  viewportBottomBeforeKeyboard = undefined
  syncViewport()
}

function onComposerFocus() {
  clearTimeout(composerBlurTimer)
  if (keyboardBottom === undefined) {
    const visualViewport = window.visualViewport
    viewportBottomBeforeKeyboard = visualViewport ? visualViewport.offsetTop + visualViewport.height : window.innerHeight
  }
  composerFocused.value = isCompact.value
  syncViewport()
  scrollToEnd('smooth')
}

function onComposerBlur() {
  clearTimeout(composerBlurTimer)
  composerBlurTimer = setTimeout(() => {
    composerFocused.value = false
    syncViewport()
  }, 300)
}

let stopEvents: (() => void) | undefined
let activePollTimer: ReturnType<typeof setInterval> | null = null
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
    if (canUseEncryptedChat.value) void refreshChatCallAvailability()
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
    await Promise.all(
      items.map(async (conversation) => {
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
      })
    )
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

const scrolledUp = ref(false)
const loadingEarlier = ref(false)

function nearBottom() {
  const el = scroller.value
  return !el || el.scrollHeight - el.scrollTop - el.clientHeight < 120
}

function onThreadScroll() {
  const el = scroller.value
  if (!el) return
  scrolledUp.value = el.scrollHeight - el.scrollTop - el.clientHeight > 140
  if (el.scrollTop <= 48 && hasMore.value && !loadingEarlier.value && !threadLoading.value) {
    void loadEarlier()
  }
}

function scrollToEnd(behavior: ScrollBehavior = 'instant') {
  void nextTick(() => {
    const element = scroller.value
    if (!element) return
    element.scrollTo({
      top: element.scrollHeight,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : behavior
    })
  })
}

watch(
  () => frame.value.height,
  () => {
    if (composerFocused.value) scrollToEnd()
  }
)

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
    const [error, result] = await catchError(Promise.all([getChatConversation(id), getChatMessages(id, { limit: 20 })]))
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
    if (last) {
      const latest = page.messages[page.messages.length - 1]
      if (latest) maybeChimeForMessage(latest, !document.hidden)
    }
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
  if (event.type === 'deleted') {
    conversations.value = conversations.value.filter((c) => c.id !== event.conversationId)
    if (id && event.conversationId === id) {
      active.value = null
      messages.value = []
      void router.replace({ name: 'chat' })
    }
    void refreshList()
    return
  }
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
  if (!first || !props.id || loadingEarlier.value) return
  const el = scroller.value
  const previous = el?.scrollHeight ?? 0
  loadingEarlier.value = true
  try {
    const page = await getChatMessages(props.id, { beforeSequence: first.sequence, limit: 20 })
    if (profile.value?.id) {
      await decryptForDisplay(page.messages, profile.value.id)
    }
    merge(page.messages)
    hasMore.value = page.hasMore
    await nextTick()
    if (el) el.scrollTop = el.scrollHeight - previous
  } catch (error) {
    encryptionError.value = describeRequestError(error, t('chat.loadError'))
  } finally {
    loadingEarlier.value = false
  }
}

async function downgradeActiveToPlaintext() {
  const conversation = active.value
  if (!conversation || conversation.encryptionMode !== 'encrypted' || !allowUserDowngrade.value || downgrading.value) return
  const ok = await confirmAction(t('chat.downgradeConfirmMessage'), {
    title: t('chat.downgradeConfirmTitle'),
    confirmLabel: t('chat.downgradeConfirm'),
    danger: true
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
    confirmLabel: t('chat.upgradeConfirm')
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
  const conversationId = props.id
  if (!body || !conversationId || sending.value) return
  if (encryptionMode.value === 'unknown' || encryptionMode.value === 'error') {
    sendError.value = encryptionError.value || t('chat.encryptionUnavailable')
    return
  }

  sending.value = true
  sendError.value = ''
  const tempId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const lastSeq = messages.value[messages.value.length - 1]?.sequence
  const nextSeq = lastSeq ? (BigInt(lastSeq) + 1n).toString() : '1'
  const optimisticMessage: ChatMessageWithSequence = {
    id: tempId,
    sequence: nextSeq,
    conversationId,
    kind: 'text',
    encrypted: encryptionMode.value === 'encrypted',
    body,
    sender: profile.value
      ? { username: profile.value.username, displayName: profile.value.displayName, avatarUrl: profile.value.avatarUrl ?? null }
      : null,
    createdAt: new Date().toISOString(),
  }

  draft.value = ''
  if (optimisticMessage.encrypted) {
    decryptedBodies.value = new Map(decryptedBodies.value).set(tempId, body)
  }
  messages.value = [...messages.value, optimisticMessage]
  scrollToEnd()

  try {
    let message: ChatMessageWithSequence
    if (encryptionMode.value === 'encrypted') {
      const userId = profile.value?.id
      if (!userId) throw new Error(t('chat.encryptionUnavailable'))
      const result = await sendEncryptedChatMessage(userId, conversationId, body)
      message = result.message
      const nextDecrypted = new Map(decryptedBodies.value)
      nextDecrypted.delete(tempId)
      nextDecrypted.set(message.id, result.plaintext)
      decryptedBodies.value = nextDecrypted
    } else {
      const [error, sent] = await catchError(sendChatMessage(conversationId, body))
      if (error) {
        throw error
      }
      message = sent
    }
    messages.value = messages.value.filter((m) => m.id !== tempId)
    merge([message])
    scrollToEnd()
    void refreshList()
  } catch (error) {
    messages.value = messages.value.filter((m) => m.id !== tempId)
    if (!draft.value) draft.value = body
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
  const target = active.value
  if (!target || !name || name === target.name) return
  const res = await runOptimistic({
    key: `chat:rename:${target.id}`,
    apply: () => {
      const prevName = target.name
      const prevConversations = [...conversations.value]
      if (active.value?.id === target.id) active.value = { ...active.value, name }
      conversations.value = conversations.value.map((c) => (c.id === target.id ? { ...c, name } : c))
      return { prevName, prevConversations }
    },
    commit: () => renameChatGroup(target.id, name),
    rollback: ({ prevName, prevConversations }) => {
      if (active.value?.id === target.id) active.value = { ...active.value, name: prevName }
      conversations.value = prevConversations
      renameDraft.value = prevName ?? ''
    },
    onError: (error) => {
      sendError.value = describeRequestError(error, t('chat.createError'))
    },
  })
  if (res.ok) {
    active.value = res.result
    void pollThread(target.id, threadToken)
    void refreshList()
  }
}

async function leaveOrRemove(username: string) {
  const target = active.value
  if (!target) return
  const leaving = username === self.value
  const ok = await confirmAction(leaving ? t('chat.leaveConfirm') : t('chat.removeConfirm'), { title: leaving ? t('chat.leaveGroup') : t('chat.removePerson'), confirmLabel: leaving ? t('chat.leave') : t('chat.remove'), danger: true })
  if (!ok) return
  const res = await runOptimistic({
    key: `chat:member:${target.id}:${username}`,
    apply: () => {
      const prevMembers = [...target.members]
      const prevConversations = [...conversations.value]
      if (leaving) {
        conversations.value = conversations.value.filter((c) => c.id !== target.id)
      } else if (active.value?.id === target.id) {
        active.value = { ...active.value, members: active.value.members.filter((m) => m.username !== username) }
      }
      return { prevMembers, prevConversations }
    },
    commit: () => removeChatMember(target.id, username),
    rollback: ({ prevMembers, prevConversations }) => {
      conversations.value = prevConversations
      if (active.value?.id === target.id) active.value = { ...active.value, members: prevMembers }
    },
    onError: (error) => {
      sendError.value = describeRequestError(error, t('chat.createError'))
    },
  })
  if (!res.ok) return
  if (leaving) {
    void router.push({ name: 'chat' })
    void refreshList()
  } else {
    void pollThread(target.id, threadToken)
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
  { immediate: true }
)

const messageTabs = computed(() => [
  { id: 'chat', label: t('chat.tabChat'), icon: 'lucide:message-circle', unread: unread.unread.value, to: { name: 'chat' } },
  { id: 'mail', label: t('inbox.title'), icon: 'lucide:mail', unread: mail.mailbox.value?.unread ?? 0, to: { name: 'chat', query: { tab: 'mail' } } }
])

watch(mailMode, (on) => { if (on) void mail.load().then(mail.syncSelection) }, { immediate: true })
watch(() => mail.selectedId.value, () => { if (mailMode.value) void mail.syncSelection() })

onMounted(() => {
  void mail.refreshMailInfo()
  void loadProfile()
  void refreshList(false)
  stopEvents = onChatEvent(onEvent)
  activePollTimer = setInterval(() => {
    if (props.id && !document.hidden && !threadLoading.value) {
      void pollThread(props.id, threadToken)
    }
  }, 4_000)
  compactScreen.addEventListener('change', onCompactScreenChange)
  window.addEventListener('resize', syncViewport)
  if (Capacitor.isNativePlatform()) {
    void Keyboard.addListener('keyboardWillShow', onKeyboardWillShow).then((handle) => {
      if (chatViewUnmounted) {
        void handle.remove().catch((error: unknown) => {
          console.error('[chat] Could not remove native keyboard listener', error)
        })
      } else {
        keyboardListeners.push(handle)
      }
    }).catch((error: unknown) => {
      console.error('[chat] Could not listen for the native keyboard show event', error)
    })
    void Keyboard.addListener('keyboardWillHide', onKeyboardWillHide).then((handle) => {
      if (chatViewUnmounted) {
        void handle.remove().catch((error: unknown) => {
          console.error('[chat] Could not remove native keyboard listener', error)
        })
      } else {
        keyboardListeners.push(handle)
      }
    }).catch((error: unknown) => {
      console.error('[chat] Could not listen for the native keyboard hide event', error)
    })
  }
  syncViewport()
  void nextTick(() => {
    syncComposerAlignment()
    const grid = document.querySelector<HTMLElement>('.chat-grid')
    const navSurface = document.querySelector<HTMLElement>('.mobile-tab-bar__surface')
    if (typeof ResizeObserver !== 'undefined' && grid && navSurface) {
      composerAlignmentObserver = new ResizeObserver(syncComposerAlignment)
      composerAlignmentObserver.observe(grid)
      composerAlignmentObserver.observe(navSurface)
    }
  })
  setTimeout(syncViewport, 300)
  window.visualViewport?.addEventListener('resize', syncViewport)
  window.visualViewport?.addEventListener('scroll', syncViewport)
  document.addEventListener('visibilitychange', onVisible)
})

onBeforeUnmount(() => {
  if (activePollTimer) {
    clearInterval(activePollTimer)
    activePollTimer = null
  }
  chatViewUnmounted = true
  viewingChat.value = null
  threadToken++
  clearTimeout(composerBlurTimer)
  composerAlignmentObserver?.disconnect()
  void Promise.all(keyboardListeners.map((handle) => handle.remove())).catch((error: unknown) => {
    console.error('[chat] Could not remove native keyboard listeners', error)
  })
  keyboardListeners = []
  stopEvents?.()
  compactScreen.removeEventListener('change', onCompactScreenChange)
  window.removeEventListener('resize', syncViewport)
  document.documentElement.style.overflow = ''
  window.visualViewport?.removeEventListener('resize', syncViewport)
  window.visualViewport?.removeEventListener('scroll', syncViewport)
  document.removeEventListener('visibilitychange', onVisible)
})
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-flixer-background font-sans text-flixer-text">
    <main class="chat-main w-full pt-16">
      <div
        class="chat-grid grid grid-rows-[minmax(0,1fr)] overflow-hidden bg-flixer-background lg:h-[calc(100dvh-4rem)]"
        :class="[
          locked ? 'fixed inset-x-0 z-30 bg-flixer-background' : '',
          detailsOpen && (active || priorityMode) && !partyMode && !mailMode
            ? 'lg:grid-cols-[20rem_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)_19.5rem]'
            : 'lg:grid-cols-[20rem_minmax(0,1fr)]',
        ]"
        :style="locked ? { top: `${frame.top}px`, height: `${frame.height}px` } : undefined"
      >
        <aside
          class="chat-pane flex min-h-0 flex-col border-flixer-border bg-flixer-surface/35 max-lg:absolute max-lg:inset-0 lg:border-r"
          :class="hasSelection ? 'max-lg:-translate-x-1/4 max-lg:pointer-events-none max-lg:opacity-0' : ''"
          :inert="isCompact && hasSelection"
          :aria-label="t('chat.conversations')"
        >
          <div class="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-flixer-border px-4">
            <h1 class="truncate text-xl font-bold tracking-tight text-white">{{ t('chat.title') }}</h1>
            <button
              v-if="mailMode && mail.mailbox.value?.address"
              type="button"
              class="grid size-9 shrink-0 place-items-center rounded bg-white/[0.08] text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent"
              :title="`${t('inbox.copyAddress')}: ${mail.mailbox.value.address}`"
              :aria-label="t('inbox.copyAddress')"
              @click="mail.copyAddress"
            >
              <Icon icon="lucide:copy" class="size-4" aria-hidden="true" />
            </button>
            <button
              v-else-if="!mailMode"
              type="button"
              class="grid size-9 shrink-0 place-items-center rounded bg-white/[0.08] text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent"
              :title="t('chat.new')"
              :aria-label="t('chat.new')"
              @click="newChat"
            >
              <Icon icon="lucide:square-pen" class="size-4" aria-hidden="true" />
            </button>
            <span v-else class="size-9 shrink-0" aria-hidden="true" />
          </div>

          <div v-if="mailEnabled" class="flex gap-1 border-b border-flixer-border/70 px-4 py-2.5" role="tablist" :aria-label="t('chat.title')">
            <RouterLink
              v-for="tab in messageTabs"
              :key="tab.id"
              :to="tab.to"
              role="tab"
              :aria-selected="(tab.id === 'mail') === mailMode"
              class="flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition"
              :class="(tab.id === 'mail') === mailMode ? 'bg-flixer-accent/20 text-flixer-accent' : 'text-flixer-muted hover:bg-white/[0.06] hover:text-white'"
            >
              <Icon :icon="tab.icon" class="size-3.5" aria-hidden="true" />
              {{ tab.label }}
              <span v-if="tab.unread" class="grid min-w-4 place-items-center rounded bg-flixer-accent px-1.5 text-[10px] font-bold leading-4 text-flixer-background">{{ tab.unread > 99 ? '99+' : tab.unread }}</span>
            </RouterLink>
          </div>
          <div v-if="!mailMode" class="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
            <label class="flex min-w-0 flex-1 items-center gap-2 rounded bg-white/5 px-3 py-2 text-sm text-flixer-text focus-within:ring-1 focus-within:ring-flixer-accent">
              <Icon icon="lucide:search" class="size-4 shrink-0 text-flixer-muted" aria-hidden="true" />
              <input
                v-model="searchQuery"
                type="search"
                :placeholder="t('common.search', 'Search conversations…')"
                :aria-label="t('common.search', 'Search conversations')"
                class="h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-flixer-text outline-none placeholder:text-flixer-muted"
              />
            </label>
            <button
              type="button"
              class="grid size-9 shrink-0 place-items-center rounded border-0 bg-transparent p-0 transition hover:bg-white/10"
              :class="chatFilter === 'unread' ? 'bg-white/10 text-flixer-accent' : 'text-flixer-muted'"
              :aria-pressed="chatFilter === 'unread'"
              :aria-label="t('inbox.unreadOnly')"
              :title="t('inbox.unreadOnly')"
              @click="chatFilter = chatFilter === 'unread' ? 'all' : 'unread'"
            >
              <Icon icon="lucide:list-filter" class="size-4" aria-hidden="true" />
            </button>
          </div>

          <MailList v-if="mailMode" />
          <ul v-else-if="listLoading" class="space-y-1 p-2">
            <li v-for="n in 5" :key="n" class="flex items-center gap-3 p-2">
              <Skeleton class="size-11 shrink-0 rounded" />
              <div class="flex-1 space-y-1.5">
                <Skeleton class="h-3.5 w-28" />
                <Skeleton class="h-3 w-40" />
              </div>
            </li>
          </ul>
          <p v-else-if="listFailed" class="p-4 text-sm text-red-400" role="alert">{{ t('chat.loadError') }}</p>
          <div v-else-if="!conversations.length && !prioritySupport.hasPrioritySupport.value && !party.party.value" class="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <div class="grid size-12 place-items-center rounded border border-flixer-border bg-flixer-background/60 text-flixer-muted">
              <Icon icon="lucide:message-circle" class="size-5" aria-hidden="true" />
            </div>
            <p class="text-sm text-flixer-muted">{{ t('chat.empty') }}</p>
            <button type="button" class="rounded bg-flixer-accent px-4 py-2 text-xs font-bold text-flixer-background transition hover:brightness-110" @click="newChat">{{ t('chat.startChat') }}</button>
          </div>
          <div v-else-if="!filteredConversations.length && !prioritySupport.hasPrioritySupport.value && !party.party.value" class="p-8 text-center text-sm text-flixer-muted">
            No matching conversations.
          </div>
          <ul v-else class="min-h-0 flex-1 space-y-1 overflow-y-auto p-2.5">
            <li v-if="prioritySupport.hasPrioritySupport.value && (chatFilter === 'all' || chatFilter === 'support')">
              <RouterLink
                :to="{ name: 'chat', query: { tab: 'support' } }"
                class="flex items-center gap-3 rounded border px-2.5 py-3 transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent"
                :class="priorityMode ? 'border-white/10 bg-white/5' : 'border-transparent bg-transparent'"
              >
                <span class="relative grid size-11 shrink-0 place-items-center rounded bg-gradient-to-br from-flixer-accent to-flixer-primary text-white" aria-hidden="true">
                  <Icon icon="lucide:headset" class="size-5" aria-hidden="true" />
                  <span
                    class="absolute bottom-0.5 right-0.5 size-2.5 rounded-full border-2 border-flixer-background"
                    :class="prioritySupport.roomOpen.value ? 'bg-emerald-400' : 'bg-flixer-muted'"
                  />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="flex items-baseline justify-between gap-2">
                    <span class="truncate text-sm font-semibold text-white">{{ t('admin.prioritySupport.chatTitle') }}</span>
                    <time v-if="prioritySupport.messages.value.length" class="shrink-0 text-[11px] text-flixer-muted">{{ shortTime(prioritySupport.messages.value[prioritySupport.messages.value.length - 1]!.timestamp) }}</time>
                  </span>
                  <span class="flex items-center justify-between gap-2">
                    <span class="truncate text-xs text-flixer-muted">{{ prioritySupport.messages.value.length ? prioritySupport.messages.value[prioritySupport.messages.value.length - 1]!.text || t('admin.prioritySupport.screenshotAttached') : t('admin.prioritySupport.emptyConversation') }}</span>
                    <span v-if="prioritySupport.unreadCount.value" class="size-2 shrink-0 rounded-full bg-flixer-accent" aria-hidden="true" />
                  </span>
                </span>
              </RouterLink>
            </li>

            <li v-if="party.party.value && (chatFilter === 'all' || chatFilter === 'groups')">
              <RouterLink
                :to="{ name: 'chat', query: { tab: 'party' } }"
                class="flex items-center gap-3 rounded border px-2.5 py-3 transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent"
                :class="partyMode ? 'border-white/10 bg-white/5' : 'border-transparent bg-transparent'"
              >
                <span class="grid size-11 shrink-0 place-items-center rounded bg-gradient-to-br from-flixer-primary to-flixer-secondary text-white" aria-hidden="true">
                  <Icon icon="lucide:popcorn" class="size-5" aria-hidden="true" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="flex items-baseline justify-between gap-2">
                    <span class="truncate text-sm font-semibold text-white">{{ t('party.chat') }}</span>
                  </span>
                  <span class="flex items-center justify-between gap-2">
                    <span class="truncate text-xs text-flixer-muted">{{ party.party.value.item.title }}</span>
                    <span v-if="party.unread.value" class="size-2 shrink-0 rounded-full bg-flixer-accent" aria-hidden="true" />
                  </span>
                </span>
              </RouterLink>
            </li>

            <li v-for="conversation in filteredConversations" :key="conversation.id">
              <RouterLink
                :to="{ name: 'chat', params: { id: conversation.id } }"
                class="flex items-center gap-3 rounded border px-2.5 py-3 transition motion-reduce:transition-none hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent"
                :class="conversation.id === props.id ? 'border-white/10 bg-white/5' : 'border-transparent bg-transparent'"
              >
                <span class="relative block size-11 shrink-0 overflow-hidden rounded">
                  <UserAvatar v-if="conversation.kind === 'direct'" :avatar-url="otherMember(conversation)?.avatarUrl" :name="title(conversation)" />
                  <span v-else-if="typeof conversation.supportChatOpen === 'boolean' || conversation.name?.startsWith('Ticket: ')" class="grid size-full place-items-center bg-gradient-to-br from-flixer-accent to-flixer-primary text-white" aria-hidden="true">
                    <Icon icon="lucide:life-buoy" class="size-5" aria-hidden="true" />
                  </span>
                  <span v-else class="grid size-full place-items-center bg-gradient-to-br from-flixer-primary to-flixer-secondary text-white" aria-hidden="true">
                    <Icon icon="lucide:users-round" class="size-5" aria-hidden="true" />
                  </span>
                </span>
                <span class="min-w-0 flex-1">
                  <span class="flex items-baseline justify-between gap-2">
                    <span class="truncate text-sm text-white" :class="conversation.unread ? 'font-bold' : 'font-medium'">{{ title(conversation) }}</span>
                    <time v-if="conversation.lastMessage" class="shrink-0 text-[11px] text-flixer-muted">{{ shortTime(conversation.lastMessage.createdAt) }}</time>
                  </span>
                  <span class="flex items-center justify-between gap-2">
                    <span class="truncate text-xs" :class="conversation.unread ? 'text-white' : 'text-flixer-muted'">{{ preview(conversation) }}</span>
                    <span v-if="conversation.unread" class="size-2 shrink-0 rounded-full bg-flixer-accent" aria-hidden="true" />
                  </span>
                </span>
              </RouterLink>
            </li>
          </ul>
        </aside>

        <section
          class="chat-pane flex min-h-0 min-w-0 flex-col bg-flixer-background max-lg:absolute max-lg:inset-0"
          :class="hasSelection ? '' : 'max-lg:pointer-events-none max-lg:translate-x-full'"
          :inert="isCompact && !hasSelection"
          :aria-label="t('chat.thread')"
        >
          <div v-if="partyMode" class="flex min-h-0 flex-1 flex-col">
            <button type="button" class="flex items-center gap-2 border-b border-flixer-border px-3 py-3 text-sm text-white/80 lg:hidden" @click="router.push({ name: 'chat' })">
              <Icon icon="lucide:chevron-left" class="size-5" aria-hidden="true" />
              {{ t('chat.back') }}
            </button>
            <PartyChat class="min-h-0 flex-1" @close="router.push({ name: 'chat' })" />
          </div>
          <div v-else-if="priorityMode" class="chat-fade flex min-h-0 flex-1 flex-col">
            <header class="flex h-16 items-center gap-3 border-b border-flixer-border bg-flixer-background/95 px-3 sm:px-4">
              <RouterLink :to="{ name: 'chat' }" class="grid size-9 shrink-0 place-items-center rounded text-white/80 transition hover:bg-white/10 lg:hidden" :aria-label="t('chat.back')">
                <Icon icon="lucide:chevron-left" class="size-5" aria-hidden="true" />
              </RouterLink>
              <span class="relative grid size-10 shrink-0 place-items-center rounded bg-gradient-to-br from-flixer-accent to-flixer-primary text-white" aria-hidden="true">
                <Icon icon="lucide:headset" class="size-4.5" aria-hidden="true" />
                <span class="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-flixer-background" :class="prioritySupport.roomOpen.value ? 'bg-emerald-400' : 'bg-flixer-muted'" />
              </span>
              <div class="min-w-0 flex-1">
                <h2 class="truncate text-sm font-semibold text-white">{{ t('admin.prioritySupport.chatTitle') }}</h2>
                <p class="truncate text-xs text-flixer-muted">{{ prioritySupport.roomOpen.value ? t('admin.prioritySupport.sessionActive') : t('admin.prioritySupport.readyToStart') }}</p>
              </div>
              <div class="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  class="hidden size-9 place-items-center rounded text-flixer-accent transition hover:bg-white/10 xl:grid"
                  :class="detailsOpen ? 'bg-white/10' : ''"
                  aria-label="Conversation details"
                  @click="detailsOpen = !detailsOpen"
                >
                  <Icon icon="lucide:info" class="size-4.5" aria-hidden="true" />
                </button>
              </div>
            </header>

            <div ref="priorityScroller" class="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5" role="log" aria-live="polite">
              <div v-if="prioritySupport.chatError.value" class="mx-auto max-w-lg rounded border border-amber-300/30 bg-amber-400/10 p-3 text-center text-xs text-amber-100" role="status">
                {{ prioritySupport.chatError.value }}
              </div>
              <p v-if="prioritySupport.isLoadingChat.value && prioritySupport.messages.value.length === 0" class="py-8 text-center text-sm text-flixer-muted">
                {{ t('admin.prioritySupport.loadingConversation') }}
              </p>
              <div v-else-if="prioritySupport.messages.value.length === 0 && !prioritySupport.sessionEnded.value" class="mx-auto max-w-md py-12 text-center">
                <p class="text-sm text-flixer-muted">{{ t('admin.prioritySupport.emptyConversation') }}</p>
              </div>
              <template v-else>
                <div
                  v-for="(msg, idx) in prioritySupport.messages.value"
                  :key="msg.id"
                  class="flex items-end gap-2"
                  :class="[
                    msg.sender === 'customer' ? 'justify-end' : 'justify-start',
                    idx > 0 && prioritySupport.messages.value[idx - 1]?.sender !== msg.sender ? 'pt-2' : '',
                  ]"
                >
                  <span v-if="msg.sender !== 'customer'" class="grid size-7 shrink-0 place-items-center rounded bg-gradient-to-br from-flixer-accent to-flixer-primary text-white">
                    <Icon icon="lucide:headset" class="size-3.5" aria-hidden="true" />
                  </span>
                  <div class="max-w-[82%] sm:max-w-[66%]">
                    <p v-if="msg.sender !== 'customer' && (idx === 0 || prioritySupport.messages.value[idx - 1]?.sender === 'customer')" class="mb-1 px-2 text-[11px] font-medium text-flixer-muted">{{ msg.senderName }}</p>
                    <div
                      class="whitespace-pre-wrap break-words rounded px-3.5 py-2 text-sm leading-relaxed"
                      :class="msg.sender === 'customer' ? 'bg-gradient-to-r from-flixer-primary to-flixer-accent text-white' : 'bg-white/[0.1] text-white'"
                    >
                      <p v-if="msg.text" class="m-0">{{ msg.text }}</p>
                      <div v-if="msg.attachments?.length" class="mt-2 flex flex-col gap-1.5">
                        <a
                          v-for="att in msg.attachments"
                          :key="att.url"
                          :href="prioritySupport.resolveAttachmentUrl(att.url)"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="block overflow-hidden rounded border border-white/15 bg-black/20"
                        >
                          <img
                            v-if="!att.contentType || att.contentType.startsWith('image/')"
                            :src="prioritySupport.resolveAttachmentUrl(att.url)"
                            :alt="att.name"
                            class="max-h-56 w-full object-contain"
                            loading="lazy"
                          />
                          <span v-else class="block px-2.5 py-1.5 text-xs underline">{{ att.name }}</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>

            <div v-if="prioritySupport.sessionEnded.value" class="border-t border-flixer-border bg-flixer-background px-4 py-3 text-center">
              <p class="text-xs font-medium text-flixer-muted">{{ t('admin.prioritySupport.sessionEnded') }}</p>
              <div class="mt-2 flex items-center justify-center gap-2">
                <button type="button" class="rounded bg-flixer-accent px-4 py-1.5 text-xs font-bold text-flixer-background transition hover:brightness-110" @click="prioritySupport.startNewSession">
                  {{ t('admin.prioritySupport.startNewSession') }}
                </button>
                <button
                  v-if="prioritySupport.messages.value.length > 0"
                  type="button"
                  class="rounded border border-flixer-border bg-white/[0.06] px-4 py-1.5 text-xs font-semibold text-flixer-text transition hover:bg-white/10"
                  @click="prioritySupport.downloadTranscript"
                >
                  {{ t('admin.prioritySupport.downloadTranscript') }}
                </button>
              </div>
            </div>

            <form v-else class="border-t border-flixer-border bg-flixer-background/95 px-3 py-3 sm:px-4" :style="composerInsets" @submit.prevent="prioritySupport.sendMessage()">
              <div v-if="prioritySupport.pendingScreenshot.value" class="mb-2 flex items-center justify-between gap-2 rounded border border-flixer-border bg-flixer-surface p-2">
                <div class="flex min-w-0 items-center gap-2">
                  <img :src="prioritySupport.pendingScreenshot.value.dataUrl" :alt="prioritySupport.pendingScreenshot.value.name" class="h-10 w-16 rounded object-cover" />
                  <span class="truncate text-xs text-flixer-text">{{ prioritySupport.pendingScreenshot.value.name }}</span>
                </div>
                <button type="button" class="rounded px-2.5 py-1 text-xs text-flixer-muted hover:bg-white/10 hover:text-white" @click="prioritySupport.clearScreenshot">{{ t('common.cancel') }}</button>
              </div>
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  class="grid size-9 shrink-0 place-items-center rounded text-flixer-accent transition hover:bg-white/10 disabled:opacity-50"
                  :title="t('admin.prioritySupport.diagnosticsButton')"
                  :disabled="prioritySupport.isAttaching.value || prioritySupport.isSending.value"
                  @click="prioritySupport.attachDiagnostics(false)"
                >
                  <Icon icon="lucide:file-text" class="size-4.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  class="grid size-9 shrink-0 place-items-center rounded text-flixer-accent transition hover:bg-white/10 disabled:opacity-50"
                  :title="t('admin.prioritySupport.screenshotButton')"
                  :disabled="prioritySupport.isCapturingScreenshot.value || prioritySupport.isSending.value"
                  @click="prioritySupport.captureScreenshot"
                >
                  <Icon icon="lucide:camera" class="size-4.5" aria-hidden="true" />
                </button>
                <div class="flex min-w-0 flex-1 items-center rounded bg-white/[0.08] px-4 py-1.5 focus-within:ring-2 focus-within:ring-flixer-accent/40">
                  <textarea
                    v-model="prioritySupport.draft.value"
                    rows="1"
                    maxlength="2000"
                    class="max-h-28 min-h-6 w-full resize-none bg-transparent text-sm text-white placeholder:text-flixer-muted focus:outline-none"
                    :placeholder="t('admin.prioritySupport.placeholder')"
                    @keydown="onPriorityKey"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  class="grid size-9 shrink-0 place-items-center rounded text-flixer-accent transition hover:bg-white/10 disabled:opacity-35"
                  :aria-label="t('admin.prioritySupport.send')"
                  :disabled="prioritySupport.isSending.value || (!prioritySupport.draft.value.trim() && !prioritySupport.pendingScreenshot.value)"
                >
                  <Icon icon="lucide:send-horizontal" class="size-4.5" aria-hidden="true" />
                </button>
              </div>
            </form>
          </div>
          <MailReader v-else-if="mailMode" :key="mail.selectedId.value || 'none'" class="chat-fade" />
          <div v-else :key="props.id ?? 'none'" class="chat-fade flex min-h-0 flex-1 flex-col">
            <div v-if="!props.id" class="m-auto flex max-w-xs flex-col items-center gap-3 p-6 text-center">
              <div class="grid size-14 place-items-center rounded border border-flixer-border bg-flixer-surface/80 text-flixer-accent shadow-lg">
                <Icon icon="lucide:messages-square" class="size-6" aria-hidden="true" />
              </div>
              <p class="text-sm font-medium text-white">{{ t('chat.title') }}</p>
              <p class="text-xs leading-relaxed text-flixer-muted">{{ t('chat.selectPrompt') }}</p>
              <button type="button" class="mt-1 flex items-center gap-1.5 rounded bg-flixer-accent px-4 py-2 text-xs font-bold text-flixer-background transition hover:brightness-110" @click="newChat">
                <Icon icon="lucide:plus" class="size-3.5" aria-hidden="true" />
                {{ t('chat.startChat') }}
              </button>
            </div>
            <div v-else-if="threadMissing" class="m-auto p-6 text-center">
              <p class="text-sm text-flixer-muted">{{ t('chat.notFound') }}</p>
              <RouterLink :to="{ name: 'chat' }" class="mt-3 inline-block rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20">{{ t('chat.back') }}</RouterLink>
            </div>
            <template v-else>
              <header class="flex h-16 items-center gap-3 border-b border-flixer-border bg-flixer-background/95 px-3 sm:px-4">
                <RouterLink :to="{ name: 'chat' }" class="grid size-9 shrink-0 place-items-center rounded text-white/80 transition hover:bg-white/10 lg:hidden" :aria-label="t('chat.back')">
                  <Icon icon="lucide:chevron-left" class="size-5" aria-hidden="true" />
                </RouterLink>
                <template v-if="active">
                  <span class="relative block size-10 shrink-0 rounded">
                    <span class="block size-full overflow-hidden rounded">
                      <UserAvatar v-if="active.kind === 'direct'" :avatar-url="otherMember(active)?.avatarUrl" :name="title(active)" />
                      <span v-else-if="isSupportThread" class="grid size-full place-items-center bg-gradient-to-br from-flixer-accent to-flixer-primary text-white" aria-hidden="true">
                        <Icon icon="lucide:life-buoy" class="size-4.5" aria-hidden="true" />
                      </span>
                      <span v-else class="grid size-full place-items-center bg-gradient-to-br from-flixer-primary to-flixer-secondary text-white" aria-hidden="true">
                        <Icon icon="lucide:users-round" class="size-4.5" aria-hidden="true" />
                      </span>
                    </span>
                    <span
                      v-if="active.kind === 'direct'"
                      class="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-flixer-background"
                      :class="presenceDotClass(getUserPresence(otherMember(active)?.username))"
                      aria-hidden="true"
                    />
                  </span>
                  <div class="min-w-0 flex-1">
                    <RouterLink v-if="active.kind === 'direct'" :to="{ name: 'profile', params: { username: otherMember(active)?.username } }" class="block truncate text-sm font-semibold text-white hover:underline">{{ title(active) }}</RouterLink>
                    <h2 v-else class="truncate text-sm font-semibold text-white">{{ title(active) }}</h2>
                    <p v-if="isSupportThread" class="truncate text-xs text-flixer-muted">Support Team</p>
                    <p v-else-if="active.kind === 'group'" class="truncate text-xs text-flixer-muted">{{ t('chat.memberCount', { count: active.members.length }, active.members.length) }}</p>
                  </div>
                  <span class="flex shrink-0 items-center gap-0.5">
                    <template v-if="active.kind === 'direct' && chatCall.available.value && canUseEncryptedChat">
                      <button type="button" class="grid size-9 shrink-0 place-items-center rounded text-flixer-accent transition hover:bg-white/10 disabled:opacity-40" :disabled="chatCall.phase.value !== 'idle'" :aria-label="t('chat.call.audio')" :title="t('chat.call.audio')" @click="chatCall.startCall(active.id, false, title(active))">
                        <Icon icon="lucide:phone" class="size-4.5" aria-hidden="true" />
                      </button>
                      <button type="button" class="grid size-9 shrink-0 place-items-center rounded text-flixer-accent transition hover:bg-white/10 disabled:opacity-40" :disabled="chatCall.phase.value !== 'idle'" :aria-label="t('chat.call.video')" :title="t('chat.call.video')" @click="chatCall.startCall(active.id, true, title(active))">
                        <Icon icon="lucide:video" class="size-4.5" aria-hidden="true" />
                      </button>
                    </template>
                    <button
                      type="button"
                      class="hidden size-9 shrink-0 place-items-center rounded text-flixer-accent transition hover:bg-white/10 xl:grid"
                      :class="detailsOpen ? 'bg-white/10' : ''"
                      aria-label="Conversation details"
                      @click="detailsOpen = !detailsOpen"
                    >
                      <Icon icon="lucide:info" class="size-4.5" aria-hidden="true" />
                    </button>
                    <button v-if="active.kind === 'direct' || isOwner || typeof active.supportChatOpen === 'boolean'" type="button" class="grid size-9 shrink-0 place-items-center rounded text-white/75 transition hover:bg-white/10 hover:text-red-400 xl:hidden" :aria-label="active.kind === 'group' ? t('chat.deleteGroup') : t('chat.deleteChat')" :title="active.kind === 'group' ? t('chat.deleteGroup') : t('chat.deleteChat')" @click="deleteActive">
                      <Icon icon="lucide:trash" class="size-4.5" aria-hidden="true" />
                    </button>
                    <button v-if="active.kind === 'group' && !isSupportThread" type="button" class="grid size-9 shrink-0 place-items-center rounded text-flixer-accent transition hover:bg-white/10 xl:hidden" :class="infoOpen ? 'bg-white/10' : ''" :aria-label="t('chat.groupInfo')" :aria-expanded="infoOpen" @click="infoOpen = !infoOpen">
                      <Icon icon="lucide:info" class="size-4.5" aria-hidden="true" />
                    </button>
                  </span>
                </template>
                <Skeleton v-else class="h-5 w-40" />
              </header>

              <div v-if="infoOpen && active?.kind === 'group' && !isSupportThread" class="max-h-64 shrink-0 space-y-3 overflow-y-auto border-b border-flixer-border bg-flixer-surface/60 p-4 xl:hidden">
                <form class="flex gap-2" @submit.prevent="rename">
                  <Input v-model="renameDraft" maxlength="60" class="h-auto min-w-0 flex-1 rounded border border-flixer-border bg-flixer-background px-3.5 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-flixer-accent" :aria-label="t('chat.groupName')" />
                  <Button type="submit" class="h-auto rounded border-0 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 disabled:opacity-50" :disabled="!renameDraft.trim() || renameDraft.trim() === active.name">{{ t('chat.rename') }}</Button>
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

              <div class="relative flex min-h-0 flex-1 flex-col">
              <div ref="scroller" class="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5" role="log" aria-live="polite" :aria-label="t('chat.messages')" @scroll.passive="onThreadScroll">
                <p v-if="encryptionError" class="mx-auto mb-3 max-w-lg rounded border border-amber-300/30 bg-amber-400/10 p-3 text-center text-xs text-amber-100" role="status">{{ encryptionError }}</p>
                <p v-if="historyWarning" class="mx-auto mb-3 max-w-lg rounded border border-amber-300/30 bg-amber-400/10 p-3 text-center text-xs text-amber-100" role="status">{{ historyWarning }}</p>
                <p v-if="threadLoading" class="py-8 text-center text-sm text-flixer-muted">{{ t('common.loading') }}</p>
                <template v-else>
                  <button v-if="hasMore" type="button" class="mx-auto mb-3 block rounded bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 disabled:opacity-50" :disabled="loadingEarlier" @click="loadEarlier">{{ loadingEarlier ? t('common.loading') : t('chat.loadEarlier') }}</button>
                  <p v-if="!messages.length" class="py-8 text-center text-sm text-flixer-muted">{{ t('chat.sayHello') }}</p>
                  <TransitionGroup name="chat-msg" tag="div" class="space-y-1">
                    <template v-for="(message, index) in messages" :key="message.id">
                      <p v-if="message.kind === 'system'" class="chat-msg-item py-1.5 text-center text-xs text-flixer-muted">{{ message.sender ? `${message.sender.displayName} ` : '' }}{{ message.body }}</p>
                      <div
                        v-else
                        class="chat-msg-item flex items-end gap-2"
                        :class="[
                          message.sender?.username === self ? 'justify-end' : 'justify-start',
                          index > 0 && messages[index - 1]?.sender?.username !== message.sender?.username ? 'pt-2' : '',
                        ]"
                      >
                        <span
                          v-if="message.sender?.username !== self"
                          class="block size-7 shrink-0 overflow-hidden rounded"
                          :class="index === messages.length - 1 || messages[index + 1]?.kind === 'system' || messages[index + 1]?.sender?.username !== message.sender?.username ? 'opacity-100' : 'opacity-0'"
                        >
                          <UserAvatar v-if="message.sender" :avatar-url="message.sender.avatarUrl" :name="message.sender.displayName" class="text-[10px]" />
                          <span v-else class="grid size-full place-items-center bg-gradient-to-br from-flixer-accent to-flixer-primary text-white">
                            <Icon icon="lucide:life-buoy" class="size-3.5" aria-hidden="true" />
                          </span>
                        </span>
                        <div class="max-w-[82%] sm:max-w-[66%]">
                          <p
                            v-if="active?.kind === 'group' && message.sender?.username !== self && (index === 0 || messages[index - 1]?.kind === 'system' || messages[index - 1]?.sender?.username !== message.sender?.username)"
                            class="mb-1 px-2 text-[11px] font-medium text-flixer-muted"
                          >
                            {{ message.sender?.displayName || 'Support Team' }}
                          </p>
                          <p
                            class="whitespace-pre-wrap break-words rounded px-3.5 py-2 text-sm leading-relaxed"
                            :class="message.sender?.username === self ? 'bg-gradient-to-r from-flixer-primary to-flixer-accent text-white' : 'bg-white/[0.1] text-white'"
                            :title="fullTime(message.createdAt)"
                          >
                            {{ messageBody(message) }}
                          </p>
                        </div>
                      </div>
                    </template>
                  </TransitionGroup>
                </template>
              </div>
              <Transition name="chat-jump">
                <button
                  v-if="scrolledUp"
                  type="button"
                  class="absolute bottom-4 right-4 z-10 grid size-9 place-items-center rounded border border-flixer-border bg-flixer-surface/95 text-white shadow-xl transition hover:border-flixer-accent hover:bg-flixer-surface"
                  aria-label="Jump to most recent messages"
                  title="Jump to most recent"
                  @click="scrollToEnd('smooth')"
                >
                  <Icon icon="lucide:arrow-down" class="size-4 text-flixer-accent" aria-hidden="true" />
                </button>
              </Transition>
              </div>

              <div v-if="!isSupportThread && encryptionMode === 'encrypted' && !encryptionError" class="px-4 py-2 text-center text-[11px] text-flixer-muted">
                <Icon icon="lucide:lock-keyhole" class="mr-1 inline size-3 align-text-bottom text-emerald-400" aria-hidden="true" />
                {{ t('chat.encrypted') }}
              </div>

              <form class="border-t border-flixer-border bg-flixer-background/95 px-3 py-3 sm:px-4" :style="composerInsets" @submit.prevent="send">
                <div v-if="active?.supportChatOpen === false" class="rounded border border-amber-300/30 bg-amber-400/10 p-3" role="status">
                  <p class="text-sm font-semibold text-amber-100">{{ t('chat.issueChatClosedTitle') }}</p>
                  <p class="mt-1 text-sm leading-5 text-amber-100/80">{{ t('chat.issueChatClosedDescription') }}</p>
                </div>
                <template v-else>
                  <p v-if="sendError" class="mb-2 text-xs text-red-400" role="alert">{{ sendError }}</p>
                  <div class="flex items-center gap-2">
                    <div class="flex min-w-0 flex-1 items-center rounded bg-white/[0.08] px-4 py-1.5 focus-within:ring-2 focus-within:ring-flixer-accent/40">
                      <textarea
                        ref="composer"
                        v-model="draft"
                        rows="1"
                        maxlength="2000"
                        class="max-h-28 min-h-6 w-full resize-none bg-transparent text-sm text-white placeholder:text-flixer-muted focus:outline-none"
                        :placeholder="t('chat.writeMessage')"
                        :aria-label="t('chat.writeMessage')"
                        @keydown="onComposerKey"
                        @focus="onComposerFocus"
                        @blur="onComposerBlur"
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      class="grid size-9 shrink-0 place-items-center rounded text-flixer-accent transition hover:bg-white/10 disabled:opacity-35"
                      :aria-label="t('chat.send')"
                      :disabled="!draft.trim() || sending || encryptionMode === 'unknown' || encryptionMode === 'error' || (encryptionMode === 'encrypted' && !!encryptionError)"
                    >
                      <Icon icon="lucide:send-horizontal" class="size-4.5" aria-hidden="true" />
                    </button>
                  </div>
                </template>
              </form>
            </template>
          </div>
        </section>

        <aside
          v-if="detailsOpen && (active || priorityMode) && !partyMode && !mailMode"
          class="hidden min-h-0 flex-col overflow-y-auto border-l border-flixer-border bg-flixer-surface/35 p-4 xl:flex"
          aria-label="Conversation details"
        >
          <template v-if="priorityMode">
            <div class="flex flex-col items-center pb-4 pt-3 text-center">
              <span class="grid size-20 place-items-center rounded bg-gradient-to-br from-flixer-accent to-flixer-primary text-white shadow-lg">
                <Icon icon="lucide:headset" class="size-8" aria-hidden="true" />
              </span>
              <h3 class="mt-3 text-base font-bold text-white">{{ t('admin.prioritySupport.chatTitle') }}</h3>
              <span class="mt-2 inline-flex items-center gap-1.5 rounded bg-white/[0.08] px-3 py-1 text-xs font-medium text-flixer-text">
                <span class="size-2 rounded" :class="prioritySupport.roomOpen.value ? 'bg-emerald-400' : 'bg-flixer-muted'" />
                {{ prioritySupport.roomOpen.value ? t('admin.prioritySupport.sessionActive') : t('admin.prioritySupport.readyToStart') }}
              </span>
            </div>

            <div class="mt-2 space-y-1">
              <button
                type="button"
                class="flex w-full items-center justify-between rounded px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
                @click="prioritySupport.attachDiagnostics(false)"
              >
                <span>{{ t('admin.prioritySupport.diagnosticsButton') }}</span>
                <Icon icon="lucide:file-text" class="size-4 text-flixer-muted" aria-hidden="true" />
              </button>
              <button
                type="button"
                class="flex w-full items-center justify-between rounded px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
                @click="prioritySupport.captureScreenshot"
              >
                <span>{{ t('admin.prioritySupport.screenshotButton') }}</span>
                <Icon icon="lucide:camera" class="size-4 text-flixer-muted" aria-hidden="true" />
              </button>
              <button
                v-if="prioritySupport.messages.value.length > 0"
                type="button"
                class="flex w-full items-center justify-between rounded px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
                @click="prioritySupport.downloadTranscript"
              >
                <span>{{ t('admin.prioritySupport.downloadTranscript') }}</span>
                <Icon icon="lucide:download" class="size-4 text-flixer-muted" aria-hidden="true" />
              </button>
              <button
                v-if="prioritySupport.roomOpen.value"
                type="button"
                class="flex w-full items-center justify-between rounded px-3 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
                @click="prioritySupport.endChat"
              >
                <span>{{ t('admin.prioritySupport.endChat') }}</span>
                <Icon icon="lucide:x-circle" class="size-4" aria-hidden="true" />
              </button>
            </div>
          </template>

          <template v-else-if="active">
            <div class="flex flex-col items-center pb-4 pt-3 text-center">
              <span class="block size-20 overflow-hidden rounded shadow-lg">
                <UserAvatar v-if="active.kind === 'direct'" :avatar-url="otherMember(active)?.avatarUrl" :name="title(active)" />
                <span v-else-if="isSupportThread" class="grid size-full place-items-center bg-gradient-to-br from-flixer-accent to-flixer-primary text-white">
                  <Icon icon="lucide:life-buoy" class="size-8" aria-hidden="true" />
                </span>
                <span v-else class="grid size-full place-items-center bg-gradient-to-br from-flixer-primary to-flixer-secondary text-white">
                  <Icon icon="lucide:users-round" class="size-8" aria-hidden="true" />
                </span>
              </span>
              <h3 class="mt-3 text-base font-bold text-white">{{ title(active) }}</h3>
              <span v-if="!isSupportThread && encryptionMode === 'encrypted' && !encryptionError" class="mt-2 inline-flex items-center gap-1.5 rounded bg-white/[0.08] px-3 py-1 text-xs font-medium text-emerald-300">
                <Icon icon="lucide:lock-keyhole" class="size-3.5" aria-hidden="true" />
                {{ t('chat.encrypted') }}
              </span>
              <span v-else-if="isSupportThread" class="mt-2 inline-flex items-center gap-1.5 rounded bg-flixer-accent/15 px-3 py-1 text-xs font-medium text-flixer-accent">
                Support Team
              </span>

              <div v-if="active.kind === 'direct'" class="mt-4 flex items-center justify-center gap-5">
                <RouterLink :to="{ name: 'profile', params: { username: otherMember(active)?.username } }" class="flex flex-col items-center gap-1.5 text-xs text-flixer-muted transition hover:text-white">
                  <span class="grid size-9 place-items-center rounded bg-white/[0.08] text-white">
                    <Icon icon="lucide:user-round" class="size-4" aria-hidden="true" />
                  </span>
                  <span>{{ t('header.profile') }}</span>
                </RouterLink>
              </div>
            </div>

            <div class="mt-2 space-y-1">
              <template v-if="active.kind === 'group' && !isSupportThread">
                <button
                  type="button"
                  class="flex w-full items-center justify-between rounded px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
                  @click="detailsSection = detailsSection === 'info' ? null : 'info'"
                >
                  <span>{{ t('chat.groupInfo') }}</span>
                  <Icon icon="lucide:chevron-down" class="size-4 text-flixer-muted transition-transform" :class="detailsSection === 'info' ? 'rotate-180' : ''" aria-hidden="true" />
                </button>
                <div v-if="detailsSection === 'info'" class="space-y-3 px-2 py-2">
                  <form class="flex gap-1.5" @submit.prevent="rename">
                    <Input v-model="renameDraft" maxlength="60" class="h-auto min-w-0 flex-1 rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-xs text-white focus:outline-none" :aria-label="t('chat.groupName')" />
                    <Button type="submit" class="h-auto rounded border-0 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 disabled:opacity-50" :disabled="!renameDraft.trim() || renameDraft.trim() === active.name">{{ t('chat.rename') }}</Button>
                  </form>
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-semibold uppercase tracking-wide text-flixer-muted">{{ t('chat.members') }}</span>
                    <button type="button" class="text-xs font-semibold text-flixer-accent hover:underline" @click="addPeople">{{ t('chat.addPeople') }}</button>
                  </div>
                  <ul class="space-y-1.5">
                    <li v-for="member in active.members" :key="member.username" class="flex items-center gap-2.5">
                      <span class="block size-7 shrink-0 overflow-hidden rounded"><UserAvatar :avatar-url="member.avatarUrl" :name="member.displayName" class="text-[10px]" /></span>
                      <RouterLink :to="{ name: 'profile', params: { username: member.username } }" class="min-w-0 flex-1 truncate text-xs text-white hover:underline">{{ member.displayName }}</RouterLink>
                      <button v-if="isOwner && member.username !== self" type="button" class="text-[11px] font-semibold text-red-400 hover:underline" @click="leaveOrRemove(member.username)">{{ t('chat.remove') }}</button>
                    </li>
                  </ul>
                  <button v-if="self" type="button" class="text-xs font-semibold text-red-400 hover:underline" @click="leaveOrRemove(self)">{{ t('chat.leaveGroup') }}</button>
                </div>
              </template>

              <button
                type="button"
                class="flex w-full items-center justify-between rounded px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
                @click="detailsSection = detailsSection === 'privacy' ? null : 'privacy'"
              >
                <span>Privacy & support</span>
                <Icon icon="lucide:chevron-down" class="size-4 text-flixer-muted transition-transform" :class="detailsSection === 'privacy' ? 'rotate-180' : ''" aria-hidden="true" />
              </button>
              <div v-if="detailsSection === 'privacy'" class="space-y-1.5 px-2 py-1">
                <button v-if="!isSupportThread && active.encryptionMode === 'encrypted' && allowUserDowngrade" type="button" class="flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-xs font-medium text-amber-200 transition hover:bg-white/[0.06]" :disabled="downgrading" @click="downgradeActiveToPlaintext">
                  <Icon icon="lucide:lock-open" class="size-3.5" aria-hidden="true" />
                  {{ t('chat.downgradeToPlaintext') }}
                </button>
                <button v-if="!isSupportThread && active.encryptionMode === 'plaintext' && canUseEncryptedChat" type="button" class="flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-xs font-medium text-emerald-200 transition hover:bg-white/[0.06]" :disabled="downgrading" @click="upgradeActiveToEncrypted">
                  <Icon icon="lucide:lock-keyhole" class="size-3.5" aria-hidden="true" />
                  {{ t('chat.upgradeToEncrypted') }}
                </button>
                <button v-if="active.kind === 'direct' || isOwner || typeof active.supportChatOpen === 'boolean'" type="button" class="flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-xs font-semibold text-red-400 transition hover:bg-red-500/10" @click="deleteActive">
                  <Icon icon="lucide:trash" class="size-3.5" aria-hidden="true" />
                  {{ active.kind === 'group' ? t('chat.deleteGroup') : t('chat.deleteChat') }}
                </button>
              </div>
            </div>
          </template>
        </aside>
      </div>
    </main>
    <MobileTabBar :tabs="mobileTabs" docked />
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

.chat-msg-item {
  content-visibility: auto;
  contain-intrinsic-size: auto 48px;
}

.chat-msg-enter-active {
  transition:
    opacity 180ms ease-out,
    transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
}

.chat-msg-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(0.985);
}

.chat-jump-enter-active,
.chat-jump-leave-active {
  transition:
    opacity 150ms ease,
    transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
}

.chat-jump-enter-from,
.chat-jump-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.9);
}

@keyframes chat-fade-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}

@media (min-width: 1024px) {
  :global(html.has-mini-player) .chat-grid {
    height: calc(100dvh - 11rem - 3rem);
  }

  .chat-pane {
    transition: none;
  }
}

@media (max-width: 63.99rem) {
  :global(html.capacitor) .chat-grid {
    left: env(safe-area-inset-left, 0px);
    right: env(safe-area-inset-right, 0px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .chat-pane,
  .chat-fade,
  .chat-msg-enter-active,
  .chat-jump-enter-active,
  .chat-jump-leave-active {
    transition: none;
    animation: none;
  }
}
</style>
