import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { deleteMyMailMessage, downloadMailAttachment, getMyMailMessage, listMyMailMessages, type MailMessage, type MailMessagePage, type MailMessageSummary } from '../api'
import { confirmAction } from './confirm'
import { notify } from './notify'
import { describeRequestError } from './useProfile'
import { useMailSummary } from './useMailSummary'

// Shared so the mail list and reader panes inside the combined messages view stay in sync.
const pageData = ref<MailMessagePage | null>(null)
const active = ref<MailMessage | null>(null)
const loading = ref(false)
const readerLoading = ref(false)
const error = ref('')
const search = ref('')
const unreadOnly = ref(false)
const page = ref(1)
const actionBusy = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | undefined

export function useMailbox() {
  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()
  const { info: mailbox, refresh: refreshMailInfo } = useMailSummary()

  const messages = computed(() => pageData.value?.items ?? [])
  const totalPages = computed(() => Math.max(1, Math.ceil((pageData.value?.total ?? 0) / (pageData.value?.limit ?? 30))))
  const selectedId = computed(() => (typeof route.query.message === 'string' ? route.query.message : ''))

  async function load() {
    loading.value = true
    error.value = ''
    try {
      pageData.value = await listMyMailMessages({ search: search.value.trim() || undefined, unread: unreadOnly.value || undefined, page: page.value, limit: 30 })
    } catch (requestError) {
      error.value = describeRequestError(requestError, t('inbox.loadFailed'))
    } finally {
      loading.value = false
    }
  }

  async function open(id: string) {
    readerLoading.value = true
    try {
      active.value = await getMyMailMessage(id)
      await refreshMailInfo(true)
      if (pageData.value) pageData.value.items = pageData.value.items.map((item) => (item.id === id ? { ...item, read: true } : item))
    } catch (requestError) {
      active.value = null
      error.value = describeRequestError(requestError, t('inbox.messageLoadFailed'))
    } finally {
      readerLoading.value = false
    }
  }

  function select(id: string) {
    return router.replace({ query: { ...route.query, message: id } })
  }

  function close() {
    active.value = null
    return router.replace({ query: { ...route.query, message: undefined } })
  }

  async function syncSelection() {
    const id = selectedId.value
    if (!id) {
      active.value = null
      return
    }
    if (active.value?.id !== id) await open(id)
  }

  function setSearch(value: string) {
    search.value = value
    page.value = 1
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => { void load() }, 250)
  }

  function setUnreadOnly(value: boolean) {
    unreadOnly.value = value
    page.value = 1
    void load()
  }

  function setPage(next: number) {
    page.value = Math.min(Math.max(1, next), totalPages.value)
    void load()
  }

  async function remove(message: MailMessageSummary) {
    if (!await confirmAction(t('inbox.deleteConfirm', { subject: message.subject || t('inbox.noSubject') }), { title: t('inbox.deleteTitle'), danger: true })) return
    actionBusy.value = true
    try {
      await deleteMyMailMessage(message.id)
      if (active.value?.id === message.id) await close()
      notify.success(t('inbox.deleted'))
      await Promise.all([load(), refreshMailInfo(true)])
    } catch (requestError) {
      notify.error(describeRequestError(requestError, t('inbox.deleteFailed')))
    } finally {
      actionBusy.value = false
    }
  }

  async function download(attachment: NonNullable<MailMessage['attachments']>[number]) {
    if (!active.value) return
    try {
      await downloadMailAttachment('user', active.value.id, attachment)
    } catch (requestError) {
      notify.error(describeRequestError(requestError, t('inbox.attachmentFailed')))
    }
  }

  async function copyAddress() {
    if (!mailbox.value?.address) return
    try {
      await navigator.clipboard.writeText(mailbox.value.address)
      notify.success(t('inbox.addressCopied'))
    } catch {
      notify.error(t('inbox.copyFailed'))
    }
  }

  return { copyAddress, mailbox, refreshMailInfo, pageData, messages, totalPages, active, loading, readerLoading, error, search, unreadOnly, page, actionBusy, selectedId, load, open, select, close, syncSelection, setSearch, setUnreadOnly, setPage, remove, download }
}
