<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { deleteMyMailMessage, downloadMailAttachment, getMyMailMessage, listMyMailMessages, type MailMessage, type MailMessageSummary, type MailMessagePage } from '../api'
import Header from '../components/header/Header.vue'
import { getNavLinks } from '../composables/homeNav'
import { confirmAction } from '../composables/confirm'
import { notify } from '../composables/notify'
import { describeRequestError } from '../composables/useProfile'
import { useSignOut } from '../composables/useSignOut.ts'
import { useMailSummary } from '../composables/useMailSummary'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const navLinks = computed(getNavLinks)
const { isSigningOut, signOut } = useSignOut()
const { info: mailbox, refresh: refreshMailInfo } = useMailSummary()
const pageData = ref<MailMessagePage | null>(null)
const messages = computed(() => pageData.value?.items ?? [])
const active = ref<MailMessage | null>(null)
const loading = ref(true)
const readerLoading = ref(false)
const error = ref('')
const search = ref(typeof route.query.search === 'string' ? route.query.search : '')
const unreadOnly = ref(false)
const page = ref(1)
const actionBusy = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | undefined

function safeHtmlDocument(html: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font:16px/1.6 system-ui,sans-serif;color:#202124;margin:20px;overflow-wrap:anywhere}img{max-width:100%;height:auto}table{max-width:100%;border-collapse:collapse}</style></head><body>${html}</body></html>`
}
function escapeText(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char)
}
const readerSource = computed(() => active.value?.html ? safeHtmlDocument(active.value.html) : active.value ? safeHtmlDocument(`<pre style="white-space:pre-wrap">${escapeText(active.value.text)}</pre>`) : '')
const totalPages = computed(() => Math.max(1, Math.ceil((pageData.value?.total ?? 0) / (pageData.value?.limit ?? 30))))
const authChecks = computed(() => {
  const checks = active.value?.authResults ?? {}
  return ['spf', 'dkim', 'dmarc'].map((key) => ({ key, value: typeof checks[key] === 'string' ? String(checks[key]) : 'unknown' }))
})

async function loadMessages() {
  loading.value = true
  error.value = ''
  try {
    pageData.value = await listMyMailMessages({ search: search.value.trim() || undefined, unread: unreadOnly.value || undefined, page: page.value, limit: 30 })
    const id = typeof route.query.message === 'string' ? route.query.message : ''
    if (id && (!active.value || active.value.id !== id)) await openMessage(id, false)
    else if (!id && active.value && !pageData.value.items.some((item) => item.id === active.value?.id)) active.value = null
  } catch (requestError) {
    error.value = describeRequestError(requestError, t('inbox.loadFailed'))
  } finally {
    loading.value = false
  }
}

async function openMessage(id: string, updateUrl = true) {
  readerLoading.value = true
  try {
    active.value = await getMyMailMessage(id)
    await refreshMailInfo(true)
    if (updateUrl) await router.replace({ query: { ...route.query, message: id } })
    if (pageData.value) pageData.value.items = pageData.value.items.map((item) => item.id === id ? { ...item, read: true } : item)
  } catch (requestError) {
    active.value = null
    error.value = describeRequestError(requestError, t('inbox.messageLoadFailed'))
  } finally {
    readerLoading.value = false
  }
}

function setSearch(value: string) {
  search.value = value
  page.value = 1
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { void loadMessages() }, 250)
}

async function removeMessage(message: MailMessageSummary) {
  if (!await confirmAction(t('inbox.deleteConfirm', { subject: message.subject || t('inbox.noSubject') }), { title: t('inbox.deleteTitle'), danger: true })) return
  actionBusy.value = true
  try {
    await deleteMyMailMessage(message.id)
    if (active.value?.id === message.id) {
      active.value = null
      await router.replace({ query: { ...route.query, message: undefined } })
    }
    notify.success(t('inbox.deleted'))
    await loadMessages()
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

function date(value: string) {
  return new Date(value).toLocaleString()
}

onMounted(async () => {
  await refreshMailInfo()
  await loadMessages()
})
watch(() => route.query.message, (id) => {
  if (typeof id === 'string' && id && active.value?.id !== id) void openMessage(id, false)
  if (!id) active.value = null
})
watch([unreadOnly, page], () => { void loadMessages() })
</script>

<template>
  <div class="min-h-screen bg-flixer-background pb-24 font-sans text-flixer-text md:pb-12">
    <Header :links="navLinks" :is-signing-out="isSigningOut" @logout="signOut" />
    <main class="page-gutter mx-auto w-full max-w-7xl pt-28">
      <header class="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-white">{{ t('inbox.title') }}</h1>
          <p class="mt-1 text-sm text-flixer-muted">{{ mailbox?.address ?? t('inbox.noAddress') }}</p>
        </div>
        <div class="flex items-center gap-2">
          <label class="flex items-center gap-2 rounded border border-flixer-border bg-flixer-surface px-3 py-2 text-sm text-flixer-text">
            <Icon icon="lucide:search" class="size-4 text-flixer-muted" aria-hidden="true" />
            <input :value="search" type="search" class="w-40 bg-transparent outline-none placeholder:text-flixer-muted sm:w-56" :placeholder="t('inbox.search')" @input="setSearch(($event.target as HTMLInputElement).value)" />
          </label>
          <label class="flex items-center gap-2 text-xs text-flixer-muted"><input v-model="unreadOnly" type="checkbox" class="accent-flixer-accent" />{{ t('inbox.unreadOnly') }}</label>
        </div>
      </header>
      <p v-if="error" class="mb-4 rounded border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200" role="alert">{{ error }}</p>
      <div class="grid min-h-[32rem] gap-4 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.5fr)]">
        <section class="overflow-hidden rounded border border-flixer-border bg-flixer-surface/70">
          <div class="flex items-center justify-between border-b border-flixer-border/70 px-4 py-3"><h2 class="text-sm font-semibold text-white">{{ t('inbox.messages') }}</h2><span class="text-xs text-flixer-muted">{{ pageData?.total ?? 0 }}</span></div>
          <p v-if="loading" class="p-6 text-center text-sm text-flixer-muted">{{ t('inbox.loading') }}</p>
          <p v-else-if="messages.length === 0" class="p-8 text-center text-sm text-flixer-muted">{{ t('inbox.empty') }}</p>
          <ul v-else class="divide-y divide-flixer-border/60">
            <li v-for="message in messages" :key="message.id">
              <button type="button" class="w-full p-4 text-left transition hover:bg-white/5" :class="active?.id === message.id ? 'bg-white/5' : ''" @click="openMessage(message.id)">
                <div class="flex items-start gap-2"><span class="mt-1.5 size-2 shrink-0 rounded-full" :class="message.read ? 'bg-transparent' : 'bg-flixer-accent'" aria-hidden="true"></span><span class="min-w-0 flex-1"><span class="flex items-center justify-between gap-2"><span class="truncate text-sm font-semibold text-white">{{ message.fromName || message.from }}</span><time class="shrink-0 text-[11px] text-flixer-muted">{{ date(message.createdAt) }}</time></span><span class="mt-1 block truncate text-sm" :class="message.read ? 'text-flixer-text/75' : 'text-white'">{{ message.subject || t('inbox.noSubject') }}</span><span class="mt-1 block truncate text-xs text-flixer-muted">{{ message.preview }}</span></span></div>
              </button>
            </li>
          </ul>
          <div class="flex items-center justify-between border-t border-flixer-border/70 px-4 py-3 text-xs"><button type="button" class="rounded px-2 py-1 hover:bg-white/10 disabled:opacity-40" :disabled="page <= 1" @click="page--">{{ t('inbox.previous') }}</button><span>{{ t('inbox.pageOf', { page, pages: totalPages }) }}</span><button type="button" class="rounded px-2 py-1 hover:bg-white/10 disabled:opacity-40" :disabled="page >= totalPages" @click="page++">{{ t('inbox.next') }}</button></div>
        </section>
        <section class="min-h-[28rem] overflow-hidden rounded border border-flixer-border bg-flixer-surface/70">
          <p v-if="readerLoading" class="p-8 text-center text-sm text-flixer-muted">{{ t('inbox.loadingMessage') }}</p>
          <div v-else-if="active" class="flex h-full flex-col">
            <header class="border-b border-flixer-border/70 p-4 sm:p-5">
              <div class="flex flex-wrap items-start justify-between gap-3"><h2 class="min-w-0 flex-1 break-words text-lg font-semibold text-white">{{ active.subject || t('inbox.noSubject') }}</h2><button type="button" class="rounded p-2 text-flixer-muted hover:bg-red-500/10 hover:text-red-200 disabled:opacity-50" :aria-label="t('inbox.delete')" :disabled="actionBusy" @click="removeMessage(active)"><Icon icon="lucide:trash-2" class="size-4" aria-hidden="true" /></button></div>
              <dl class="mt-3 grid gap-1 text-xs text-flixer-muted sm:grid-cols-[auto_1fr]"><dt>{{ t('inbox.from') }}</dt><dd class="break-all text-flixer-text">{{ active.fromName ? `${active.fromName} <${active.from}>` : active.from }}</dd><dt>{{ t('inbox.to') }}</dt><dd class="break-all text-flixer-text">{{ active.to.join(', ') }}</dd><dt>{{ t('inbox.date') }}</dt><dd class="text-flixer-text">{{ date(active.createdAt) }}</dd><dt v-if="active.messageId">{{ t('inbox.messageId') }}</dt><dd v-if="active.messageId" class="break-all text-flixer-text">{{ active.messageId }}</dd></dl>
              <div class="mt-3 flex flex-wrap items-center gap-2"><span v-for="check in authChecks" :key="check.key" class="rounded px-2 py-1 text-[11px] font-semibold" :class="check.value === 'pass' ? 'bg-emerald-500/15 text-emerald-300' : check.value === 'fail' ? 'bg-red-500/15 text-red-200' : 'bg-white/10 text-flixer-muted'">{{ check.key.toUpperCase() }} · {{ check.value }}</span></div>
            </header>
            <div v-if="active.attachments.length" class="flex flex-wrap gap-2 border-b border-flixer-border/70 p-4"><button v-for="attachment in active.attachments" :key="attachment.id" type="button" class="flex items-center gap-2 rounded border border-flixer-border px-3 py-2 text-xs text-flixer-text hover:bg-white/5" @click="download(attachment)"><Icon icon="lucide:paperclip" class="size-3.5" aria-hidden="true" />{{ attachment.filename }}<span class="text-flixer-muted">{{ Math.max(1, Math.round(attachment.size / 1024)) }} KB</span></button></div>
            <iframe v-if="active.html" :srcdoc="readerSource" sandbox="" class="min-h-[24rem] w-full flex-1 bg-white" :title="t('inbox.messageBody')"></iframe>
            <pre v-else class="min-h-[24rem] flex-1 overflow-auto whitespace-pre-wrap break-words p-5 text-sm leading-6 text-flixer-text">{{ active.text }}</pre>
          </div>
          <p v-else class="grid h-full min-h-[28rem] place-items-center p-8 text-center text-sm text-flixer-muted">{{ t('inbox.selectMessage') }}</p>
        </section>
      </div>
    </main>
  </div>
</template>
