<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { confirmAction } from '../../composables/confirm'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { createMailDomain, createMailbox, deleteMailDomain, deleteMailbox, deleteAdminMailMessage, deleteMailTemplate, downloadMailAttachment, generateUserMailboxes, getAdminMailMessage, getMailSettings, getMailStatus, getMailTemplate, listAdminMailMessages, listMailDomains, listMailTemplates, listMailboxes, previewMailTemplate, rotateMailDomainDkim, runMailDiagnostics, saveMailTemplate, sendAdminMail, sendMailTemplateTest, updateMailDomain, updateMailSettings, updateMailbox, verifyMailDomain, type MailCheck, type MailDomain, type MailDnsRecord, type MailMessage, type MailMessagePage, type MailMessageSummary, type MailSettings, type MailTemplate, type Mailbox } from '../../api'
import AdminSection from './AdminSection.vue'
import AdminToggle from './AdminToggle.vue'
import StatusPill from './StatusPill.vue'
import { groupDnsRecords, isValidMailTemplateSlug } from '../../utils/mailHelpers'

const props = defineProps<{ screen: 'overview' | 'domains' | 'inboxes' | 'messages' | 'templates' }>()
const { t } = useI18n()
const inputClass = 'mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-flixer-text placeholder:text-flixer-muted focus:border-flixer-accent focus:outline-none'
const buttonClass = 'rounded bg-white/10 px-3 py-2 text-xs font-semibold text-flixer-text transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50'
const primaryButtonClass = 'rounded bg-flixer-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:cursor-not-allowed disabled:opacity-50'
const loading = ref(true)
const loadError = ref('')
const busy = ref(false)
const status = ref<Awaited<ReturnType<typeof getMailStatus>> | null>(null)
const settings = reactive<MailSettings>({ inboundEnabled: false, inboundPort: 25, hostname: '', maxMessageMb: 10, outboundEnabled: false, relayFallback: false, noreplyAddress: '', noreplyName: 'Flixer', userAddressesEnabled: false, userAddressMode: 'username', userAddressDomain: null })
const savedSettings = ref<MailSettings | null>(null)
const diagnostics = ref<Record<string, MailCheck> | null>(null)
const domains = ref<MailDomain[]>([])
const domainInput = reactive({ domain: '', allowSubdomains: false })
const domainBusy = ref<string | null>(null)
const mailboxes = ref<Mailbox[]>([])
const mailboxInput = reactive({ address: '', displayName: '' })
const messagePage = ref<MailMessagePage | null>(null)
const activeMessage = ref<MailMessage | null>(null)
const messageFilters = reactive<{ mailboxId: string; direction: 'inbound' | 'outbound'; search: string; unread: boolean }>({ mailboxId: '', direction: 'inbound', search: '', unread: false })
const messagePageNumber = ref(1)
const readerLoading = ref(false)
const composeOpen = ref(false)
const compose = reactive({ from: '', to: '', subject: '', text: '', inReplyTo: '' })
const templates = ref<MailTemplate[]>([])
const activeTemplate = ref<MailTemplate | null>(null)
const templateName = ref('')
const newTemplateName = ref('')
const templateEditor = reactive({ label: '', description: '', subject: '', html: '', text: '' })
const templateEditTab = ref<'html' | 'text'>('html')
const previewTab = ref<'html' | 'text'>('html')
const preview = ref<Awaited<ReturnType<typeof previewMailTemplate>> | null>(null)
const templateTestTo = ref('')
const templateSlugValid = computed(() => isValidMailTemplateSlug(newTemplateName.value))
const templatePersisted = computed(() => !!activeTemplate.value && templates.value.some((template) => template.name === activeTemplate.value?.name))
const verifiedDomains = computed(() => domains.value.filter((domain) => domain.verified))
const sendableMailboxes = computed(() => mailboxes.value.filter((mailbox) => mailbox.kind !== 'system' && mailbox.enabled))
const totalPages = computed(() => Math.max(1, Math.ceil((messagePage.value?.total ?? 0) / (messagePage.value?.limit ?? 30))))
const dnsGroups = (records: MailDnsRecord[]) => groupDnsRecords(records)
const messageChecks = computed(() => {
  const checks = activeMessage.value?.authResults ?? {}
  return ['spf', 'dkim', 'dmarc'].map((key) => ({ key, value: typeof checks[key] === 'string' ? String(checks[key]) : 'unknown' }))
})
let previewTimer: ReturnType<typeof setTimeout> | undefined
let searchTimer: ReturnType<typeof setTimeout> | undefined
const templateHtmlEditor = ref<HTMLTextAreaElement | null>(null)
const templateTextEditor = ref<HTMLTextAreaElement | null>(null)

function safeHtmlDocument(html: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font:16px/1.6 system-ui,sans-serif;color:#202124;margin:20px;overflow-wrap:anywhere}img{max-width:100%;height:auto}table{max-width:100%;border-collapse:collapse}</style></head><body>${html}</body></html>`
}
function escapeText(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char)
}
const messageHtml = computed(() => activeMessage.value?.html ? safeHtmlDocument(activeMessage.value.html) : activeMessage.value ? safeHtmlDocument(`<pre style="white-space:pre-wrap">${escapeText(activeMessage.value.text)}</pre>`) : '')
const previewHtml = computed(() => preview.value ? safeHtmlDocument(preview.value.html) : '')

function setSettings(value: MailSettings) {
  Object.assign(settings, value)
  savedSettings.value = { ...value }
}
async function loadOverview() {
  const [nextStatus, nextSettings, nextDomains] = await Promise.all([getMailStatus(), getMailSettings(), listMailDomains()])
  status.value = nextStatus
  setSettings(nextSettings)
  domains.value = nextDomains
}
async function loadDomains() { domains.value = await listMailDomains() }
async function loadMailboxes() { mailboxes.value = await listMailboxes() }
async function loadMessages() {
  const query = {
    mailboxId: messageFilters.mailboxId || undefined,
    direction: messageFilters.direction,
    search: messageFilters.search.trim() || undefined,
    unread: messageFilters.unread || undefined,
    page: messagePageNumber.value,
    limit: 30,
  }
  messagePage.value = await listAdminMailMessages(query)
  if (activeMessage.value && !messagePage.value.items.some((item) => item.id === activeMessage.value?.id)) activeMessage.value = null
}
async function loadTemplates() {
  templates.value = await listMailTemplates()
  if (templateName.value) await selectTemplate(templateName.value)
}
async function load() {
  loading.value = true
  loadError.value = ''
  try {
    if (props.screen === 'overview') await loadOverview()
    if (props.screen === 'domains') await loadDomains()
    if (props.screen === 'inboxes') await loadMailboxes()
    if (props.screen === 'messages') {
      await Promise.all([loadMailboxes(), loadMessages()])
    }
    if (props.screen === 'templates') await loadTemplates()
  } catch (error) {
    loadError.value = describeRequestError(error, t('admin.mail.loadFailed'))
  } finally {
    loading.value = false
  }
}

async function saveSettings() {
  busy.value = true
  try {
    setSettings(await updateMailSettings({ ...settings, hostname: settings.hostname || null, noreplyAddress: settings.noreplyAddress || null }))
    notify.success(t('admin.mail.settingsSaved'))
    await loadOverview()
  } catch (error) {
    notify.error(describeRequestError(error, t('admin.mail.saveFailed')))
  } finally { busy.value = false }
}
async function runDiagnostics() {
  busy.value = true
  try { diagnostics.value = await runMailDiagnostics() }
  catch (error) { notify.error(describeRequestError(error, t('admin.mail.diagnosticsFailed'))) }
  finally { busy.value = false }
}
async function generateAddresses() {
  if (!await confirmAction(t('admin.mail.generateConfirm'), { title: t('admin.mail.generateTitle') })) return
  busy.value = true
  try {
    const result = await generateUserMailboxes()
    notify.success(t('admin.mail.addressesGenerated', { count: result.created }))
    await loadMailboxes()
  } catch (error) { notify.error(describeRequestError(error, t('admin.mail.generateFailed'))) }
  finally { busy.value = false }
}
async function addDomain() {
  if (!domainInput.domain.trim()) return
  busy.value = true
  try {
    await createMailDomain({ domain: domainInput.domain.trim(), allowSubdomains: domainInput.allowSubdomains })
    domainInput.domain = ''
    domainInput.allowSubdomains = false
    notify.success(t('admin.mail.domainAdded'))
    await loadDomains()
  } catch (error) { notify.error(describeRequestError(error, t('admin.mail.domainAddFailed'))) }
  finally { busy.value = false }
}
async function updateDomain(domain: MailDomain, allowSubdomains: boolean) {
  domainBusy.value = domain.id
  try { replaceDomain(await updateMailDomain(domain.id, { allowSubdomains })) }
  catch (error) { notify.error(describeRequestError(error, t('admin.mail.domainUpdateFailed'))) }
  finally { domainBusy.value = null }
}
function replaceDomain(value: MailDomain) {
  const index = domains.value.findIndex((domain) => domain.id === value.id)
  if (index >= 0) domains.value[index] = value
  else domains.value.push(value)
}
async function verifyDomain(domain: MailDomain) {
  domainBusy.value = domain.id
  try {
    replaceDomain(await verifyMailDomain(domain.id))
    notify.success(t('admin.mail.domainVerified'))
  } catch (error) { notify.error(describeRequestError(error, t('admin.mail.verifyFailed'))) }
  finally { domainBusy.value = null }
}
async function rotateDkim(domain: MailDomain) {
  if (!await confirmAction(t('admin.mail.rotateConfirm', { domain: domain.domain }), { title: t('admin.mail.rotateTitle'), danger: true })) return
  domainBusy.value = domain.id
  try { replaceDomain(await rotateMailDomainDkim(domain.id)); notify.success(t('admin.mail.dkimRotated')) }
  catch (error) { notify.error(describeRequestError(error, t('admin.mail.rotateFailed'))) }
  finally { domainBusy.value = null }
}
async function removeDomain(domain: MailDomain) {
  if (!await confirmAction(t('admin.mail.domainDeleteConfirm', { domain: domain.domain }), { title: t('admin.mail.domainDeleteTitle'), danger: true })) return
  domainBusy.value = domain.id
  try { await deleteMailDomain(domain.id); domains.value = domains.value.filter((item) => item.id !== domain.id); notify.success(t('admin.mail.domainDeleted')) }
  catch (error) { notify.error(describeRequestError(error, t('admin.mail.domainDeleteFailed'))) }
  finally { domainBusy.value = null }
}
async function copyValue(value: string) {
  try { await navigator.clipboard.writeText(value); notify.success(t('admin.mail.copied')) }
  catch { notify.error(t('admin.mail.copyFailed')) }
}
async function addMailbox() {
  busy.value = true
  try {
    await createMailbox({ address: mailboxInput.address.trim(), displayName: mailboxInput.displayName.trim() || undefined })
    mailboxInput.address = ''
    mailboxInput.displayName = ''
    notify.success(t('admin.mail.inboxCreated'))
    await loadMailboxes()
  } catch (error) { notify.error(describeRequestError(error, t('admin.mail.inboxCreateFailed'))) }
  finally { busy.value = false }
}
async function toggleMailbox(mailbox: Mailbox) {
  try { Object.assign(mailbox, await updateMailbox(mailbox.id, { enabled: !mailbox.enabled })) }
  catch (error) { notify.error(describeRequestError(error, t('admin.mail.inboxUpdateFailed'))) }
}
async function removeMailbox(mailbox: Mailbox) {
  if (!await confirmAction(t('admin.mail.inboxDeleteConfirm', { address: mailbox.address }), { title: t('admin.mail.inboxDeleteTitle'), danger: true })) return
  try { await deleteMailbox(mailbox.id); mailboxes.value = mailboxes.value.filter((item) => item.id !== mailbox.id); notify.success(t('admin.mail.inboxDeleted')) }
  catch (error) { notify.error(describeRequestError(error, t('admin.mail.inboxDeleteFailed'))) }
}
function scheduleMessages() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { messagePageNumber.value = 1; void loadMessages().catch((error) => notify.error(describeRequestError(error, t('admin.mail.messagesLoadFailed')))) }, 250)
}
async function openMessage(message: MailMessageSummary) {
  readerLoading.value = true
  try { activeMessage.value = await getAdminMailMessage(message.id) }
  catch (error) { notify.error(describeRequestError(error, t('admin.mail.messageLoadFailed'))) }
  finally { readerLoading.value = false }
}
async function removeMessage(message: MailMessageSummary) {
  if (!await confirmAction(t('admin.mail.messageDeleteConfirm', { subject: message.subject || t('admin.mail.noSubject') }), { title: t('admin.mail.messageDeleteTitle'), danger: true })) return
  try {
    await deleteAdminMailMessage(message.id)
    if (activeMessage.value?.id === message.id) activeMessage.value = null
    notify.success(t('admin.mail.messageDeleted'))
    await loadMessages()
  } catch (error) { notify.error(describeRequestError(error, t('admin.mail.messageDeleteFailed'))) }
}
function startReply(message: MailMessage) {
  compose.from = sendableMailboxes.value[0]?.address ?? ''
  compose.to = message.direction === 'inbound' ? message.from : message.to.join(', ')
  compose.subject = message.subject.startsWith('Re:') ? message.subject : `Re: ${message.subject}`
  compose.text = ''
  compose.inReplyTo = message.messageId ?? ''
  composeOpen.value = true
}
async function sendMessage() {
  const recipients = compose.to.split(/[;,\n]/).map((value) => value.trim()).filter(Boolean)
  if (!recipients.length || !compose.from) { notify.error(t('admin.mail.composeRequired')); return }
  busy.value = true
  try {
    const result = await sendAdminMail({ from: compose.from, to: recipients, subject: compose.subject, text: compose.text, inReplyTo: compose.inReplyTo || null })
    composeOpen.value = false
    notify.success(t('admin.mail.messageQueued', { count: result.queued }))
    await loadMessages()
  } catch (error) { notify.error(describeRequestError(error, t('admin.mail.sendFailed'))) }
  finally { busy.value = false }
}
async function downloadAttachment(attachment: NonNullable<MailMessage['attachments']>[number]) {
  if (!activeMessage.value) return
  try { await downloadMailAttachment('admin', activeMessage.value.id, attachment) }
  catch (error) { notify.error(describeRequestError(error, t('admin.mail.attachmentFailed'))) }
}
function selectTemplate(name: string) {
  templateName.value = name
  activeTemplate.value = null
  preview.value = null
  getMailTemplate(name).then((template) => {
    if (templateName.value !== name) return
    activeTemplate.value = template
    Object.assign(templateEditor, { label: template.label, description: template.description, subject: template.subject, html: template.html, text: template.text })
    void updatePreview()
  }).catch((error) => notify.error(describeRequestError(error, t('admin.mail.templateLoadFailed'))))
}
async function createTemplate() {
  if (!templateSlugValid.value) return
  const name = newTemplateName.value
  templateName.value = name
  newTemplateName.value = ''
  activeTemplate.value = { name, label: name, description: '', subject: '', html: '<p>Hello {{displayName}},</p>', text: 'Hello {{displayName}},', builtin: false, customized: true, variables: [], updatedAt: null }
  Object.assign(templateEditor, { label: name, description: '', subject: '', html: '<p>Hello {{displayName}},</p>', text: 'Hello {{displayName}},' })
  preview.value = null
}
async function saveTemplate() {
  if (!templateName.value) return
  busy.value = true
  try {
    activeTemplate.value = await saveMailTemplate(templateName.value, { ...templateEditor })
    Object.assign(templateEditor, { label: activeTemplate.value.label, description: activeTemplate.value.description, subject: activeTemplate.value.subject, html: activeTemplate.value.html, text: activeTemplate.value.text })
    await loadTemplates()
    notify.success(t('admin.mail.templateSaved'))
    void updatePreview()
  } catch (error) { notify.error(describeRequestError(error, t('admin.mail.templateSaveFailed'))) }
  finally { busy.value = false }
}
async function resetTemplate() {
  if (!activeTemplate.value) return
  if (!templatePersisted.value) {
    templateName.value = ''
    activeTemplate.value = null
    preview.value = null
    return
  }
  const template = activeTemplate.value
  const action = template.builtin ? t('admin.mail.templateResetConfirm', { name: template.label }) : t('admin.mail.templateDeleteConfirm', { name: template.label })
  if (!await confirmAction(action, { title: template.builtin ? t('admin.mail.templateResetTitle') : t('admin.mail.templateDeleteTitle'), danger: true })) return
  busy.value = true
  try {
    await deleteMailTemplate(template.name)
    notify.success(template.builtin ? t('admin.mail.templateReset') : t('admin.mail.templateDeleted'))
    if (template.builtin) selectTemplate(template.name)
    else { templateName.value = ''; activeTemplate.value = null; preview.value = null; await loadTemplates() }
  } catch (error) { notify.error(describeRequestError(error, t('admin.mail.templateDeleteFailed'))) }
  finally { busy.value = false }
}
async function updatePreview() {
  if (!templateName.value || !templateEditor.subject || !templateEditor.html) return
  try {
    preview.value = await previewMailTemplate(templateName.value, { subject: templateEditor.subject, html: templateEditor.html, text: templateEditor.text })
  } catch { /* The editor may be incomplete while the user is typing. */ }
}
function schedulePreview() {
  clearTimeout(previewTimer)
  previewTimer = setTimeout(() => { void updatePreview() }, 350)
}
function insertVariable(variable: string) {
  const value = `{{${variable}}}`
  const editor = templateEditTab.value === 'html' ? templateHtmlEditor.value : templateTextEditor.value
  if (!editor) {
    templateEditor.subject += value
    return
  }
  const start = editor.selectionStart
  const end = editor.selectionEnd
  const current = templateEditTab.value === 'html' ? templateEditor.html : templateEditor.text
  const next = `${current.slice(0, start)}${value}${current.slice(end)}`
  if (templateEditTab.value === 'html') templateEditor.html = next
  else templateEditor.text = next
  requestAnimationFrame(() => { editor.focus(); editor.setSelectionRange(start + value.length, start + value.length) })
}
async function sendTest() {
  if (!activeTemplate.value || !templateTestTo.value.trim()) return
  busy.value = true
  try {
    const saved = await saveMailTemplate(activeTemplate.value.name, { ...templateEditor })
    activeTemplate.value = saved
    const index = templates.value.findIndex((template) => template.name === saved.name)
    if (index >= 0) templates.value[index] = saved
    else templates.value.push(saved)
    const result = await sendMailTemplateTest(activeTemplate.value.name, templateTestTo.value.trim())
    notify.success(t('admin.mail.templateTestSent', { email: result.sentTo }))
  } catch (error) { notify.error(describeRequestError(error, t('admin.mail.templateTestFailed'))) }
  finally { busy.value = false }
}
function formatDate(value: string) { return new Date(value).toLocaleString() }
function variableToken(variable: string) { return `{{${variable}}}` }
function mailboxKind(kind: Mailbox['kind']) { return t(`admin.mail.kind.${kind}`) }

watch(() => props.screen, () => { void load() })
watch(() => [messageFilters.mailboxId, messageFilters.direction, messageFilters.unread], scheduleMessages)
watch(() => messageFilters.search, scheduleMessages)
watch(messagePageNumber, () => { if (!loading.value) void loadMessages().catch((error) => notify.error(describeRequestError(error, t('admin.mail.messagesLoadFailed')))) })
watch(templateEditor, schedulePreview, { deep: true })
onMounted(() => { void load() })
onBeforeUnmount(() => { clearTimeout(previewTimer); clearTimeout(searchTimer) })
</script>

<template>
  <div class="space-y-5">
    <p v-if="loadError" class="rounded border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200" role="alert">{{ loadError }}</p>
    <p v-if="loading" class="admin-card p-6 text-sm text-flixer-muted" role="status">{{ t('admin.mail.loading') }}</p>

    <template v-else-if="screen === 'overview'">
      <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div class="admin-card p-4"><p class="text-xs text-flixer-muted">{{ t('admin.mail.inboundStatus') }}</p><div class="mt-2 flex items-center justify-between gap-2"><StatusPill :tone="status?.inbound.listening ? 'good' : status?.inbound.error ? 'bad' : 'neutral'">{{ status?.inbound.listening ? t('admin.mail.listening') : t('admin.mail.notListening') }}</StatusPill><span class="text-xs text-flixer-muted">{{ status?.inbound.port ? t('admin.mail.portValue', { port: status.inbound.port }) : t('admin.mail.noPort') }}</span></div><p v-if="status?.inbound.error" class="mt-2 break-words text-xs text-red-200">{{ status.inbound.error }}</p></div>
        <div class="admin-card p-4"><p class="text-xs text-flixer-muted">{{ t('admin.mail.outboundStatus') }}</p><div class="mt-2"><StatusPill :tone="status?.outboundReady ? 'good' : 'warn'">{{ status?.outboundReady ? t('admin.mail.ready') : t('admin.mail.notReady') }}</StatusPill></div><p class="mt-2 truncate text-xs text-flixer-muted">{{ status?.sender || t('admin.mail.noSender') }}</p></div>
        <div class="admin-card p-4"><p class="text-xs text-flixer-muted">{{ t('admin.mail.verifiedDomains') }}</p><p class="mt-2 text-2xl font-semibold text-white">{{ status?.domains.verified ?? 0 }}<span class="text-sm font-normal text-flixer-muted"> / {{ status?.domains.total ?? 0 }}</span></p></div>
        <div class="admin-card p-4"><p class="text-xs text-flixer-muted">{{ t('admin.mail.serverHostname') }}</p><p class="mt-2 truncate text-sm font-semibold text-white">{{ settings.hostname || t('admin.mail.hostnameNotSet') }}</p></div>
      </section>
      <AdminSection :title="t('admin.mail.settingsTitle')" :description="t('admin.mail.settingsDescription')">
        <template #actions><button type="button" :class="buttonClass" :disabled="busy" @click="runDiagnostics">{{ t('admin.mail.runDiagnostics') }}</button><button type="button" :class="primaryButtonClass" :disabled="busy" @click="saveSettings">{{ t('common.save') }}</button></template>
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <label class="text-xs text-flixer-muted">{{ t('admin.mail.hostname') }}<input v-model="settings.hostname" :class="inputClass" placeholder="mail.example.com" /></label>
          <label class="text-xs text-flixer-muted">{{ t('admin.mail.inboundPort') }}<input v-model.number="settings.inboundPort" type="number" min="1" max="65535" :class="inputClass" /></label>
          <label class="text-xs text-flixer-muted">{{ t('admin.mail.maxMessageSize') }}<input v-model.number="settings.maxMessageMb" type="number" min="1" max="50" :class="inputClass" /></label>
          <label class="text-xs text-flixer-muted">{{ t('admin.mail.noreplyAddress') }}<input v-model="settings.noreplyAddress" :class="inputClass" placeholder="noreply@example.com" /></label>
          <label class="text-xs text-flixer-muted">{{ t('admin.mail.senderName') }}<input v-model="settings.noreplyName" :class="inputClass" /></label>
          <label class="text-xs text-flixer-muted">{{ t('admin.mail.userAddressMode') }}<select v-model="settings.userAddressMode" :class="inputClass"><option value="username">{{ t('admin.mail.mode.username') }}</option><option value="random">{{ t('admin.mail.mode.random') }}</option></select></label>
          <label class="text-xs text-flixer-muted">{{ t('admin.mail.userAddressDomain') }}<select v-model="settings.userAddressDomain" :class="inputClass"><option :value="null">{{ t('admin.mail.selectDomain') }}</option><option v-for="domain in verifiedDomains" :key="domain.id" :value="domain.domain">{{ domain.domain }}</option></select></label>
        </div>
        <div class="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4"><AdminToggle v-model="settings.inboundEnabled" :label="t('admin.mail.inboundEnabled')" /><AdminToggle v-model="settings.outboundEnabled" :label="t('admin.mail.outboundEnabled')" /><AdminToggle v-model="settings.relayFallback" :label="t('admin.mail.relayFallback')" /><AdminToggle v-model="settings.userAddressesEnabled" :label="t('admin.mail.userAddressesEnabled')" /></div>
        <p class="mt-3 text-xs text-flixer-muted">{{ t('admin.mail.addressesDefaultOff') }}</p>
        <div v-if="diagnostics" class="mt-5 border-t border-flixer-border/70 pt-4"><h3 class="mb-3 text-sm font-semibold text-white">{{ t('admin.mail.diagnosticsResults') }}</h3><ul class="grid gap-2 sm:grid-cols-2"><li v-for="(check, name) in diagnostics" :key="name" class="rounded border border-flixer-border/70 bg-black/10 p-3"><div class="flex items-center justify-between gap-2"><span class="text-xs font-semibold text-white">{{ t(`admin.mail.diagnostic.${name}`, name) }}</span><StatusPill :tone="check.ok ? 'good' : 'bad'">{{ check.ok ? t('admin.mail.pass') : t('admin.mail.fail') }}</StatusPill></div><p class="mt-2 text-xs leading-5 text-flixer-muted">{{ check.detail }}</p></li></ul></div>
        <div v-if="settings.userAddressesEnabled" class="mt-4 flex flex-wrap items-center justify-between gap-3 rounded border border-flixer-border/70 bg-black/10 p-3"><p class="text-xs text-flixer-muted">{{ t('admin.mail.generateDescription') }}</p><button type="button" :class="buttonClass" :disabled="busy" @click="generateAddresses">{{ t('admin.mail.generateAddresses') }}</button></div>
      </AdminSection>
    </template>

    <template v-else-if="screen === 'domains'">
      <AdminSection :title="t('admin.mail.addDomain')" :description="t('admin.mail.domainHelp')">
        <div class="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"><label class="text-xs text-flixer-muted">{{ t('admin.mail.domainName') }}<input v-model="domainInput.domain" :class="inputClass" placeholder="example.com" /></label><button type="button" :class="primaryButtonClass" :disabled="busy || !domainInput.domain.trim()" @click="addDomain">{{ t('admin.mail.addDomainAction') }}</button></div>
        <div class="mt-3"><AdminToggle v-model="domainInput.allowSubdomains" :label="t('admin.mail.allowSubdomains')" /></div>
      </AdminSection>
      <div v-if="domains.length" class="space-y-4">
        <section v-for="domain in domains" :key="domain.id" class="admin-card overflow-hidden p-4 sm:p-5">
          <header class="flex flex-wrap items-start justify-between gap-3 border-b border-flixer-border/70 pb-4"><div><div class="flex flex-wrap items-center gap-2"><h2 class="text-lg font-semibold text-white">{{ domain.domain }}</h2><StatusPill :tone="domain.verified ? 'good' : 'warn'">{{ domain.verified ? t('admin.mail.verified') : t('admin.mail.unverified') }}</StatusPill></div><p class="mt-1 text-xs text-flixer-muted">{{ t('admin.mail.dkimSelector', { selector: domain.dkimSelector }) }}<span v-if="domain.lastCheckedAt"> · {{ t('admin.mail.lastChecked', { date: formatDate(domain.lastCheckedAt) }) }}</span></p></div><div class="flex flex-wrap gap-2"><button type="button" :class="buttonClass" :disabled="domainBusy === domain.id" @click="verifyDomain(domain)">{{ t('admin.mail.verify') }}</button><button type="button" :class="buttonClass" :disabled="domainBusy === domain.id" @click="rotateDkim(domain)">{{ t('admin.mail.rotateDkim') }}</button><button type="button" class="rounded bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/20 disabled:opacity-50" :disabled="domainBusy === domain.id" @click="removeDomain(domain)">{{ t('common.delete') }}</button></div></header>
          <div class="flex items-center justify-between gap-3 border-b border-flixer-border/70 py-3"><span class="text-xs text-flixer-muted">{{ t('admin.mail.allowSubdomains') }}</span><input type="checkbox" role="switch" class="size-4 accent-flixer-accent" :checked="domain.allowSubdomains" :disabled="domainBusy === domain.id" @change="updateDomain(domain, ($event.target as HTMLInputElement).checked)" /></div>
          <div v-if="domain.checks && Object.keys(domain.checks).length" class="flex flex-wrap gap-2 border-b border-flixer-border/70 py-3"><span v-for="(check, name) in domain.checks" :key="name" class="rounded px-2 py-1 text-[11px]" :class="check.ok ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-200'">{{ t(`admin.mail.dns.${name}`, name) }} · {{ check.ok ? t('admin.mail.pass') : t('admin.mail.fail') }}: {{ check.detail }}</span></div>
          <div class="mt-3 overflow-x-auto"><table class="mail-stack w-full text-left text-xs md:min-w-[42rem]"><thead class="text-flixer-muted"><tr><th class="px-2 py-2 font-medium">{{ t('admin.mail.dnsType') }}</th><th class="px-2 py-2 font-medium">{{ t('admin.mail.dnsName') }}</th><th class="px-2 py-2 font-medium">{{ t('admin.mail.dnsValue') }}</th><th class="px-2 py-2 font-medium">{{ t('admin.mail.dnsNote') }}</th></tr></thead><tbody><template v-for="group in dnsGroups(domain.records)" :key="group.purpose"><tr v-for="record in group.records" :key="`${record.purpose}-${record.name}`" class="border-t border-flixer-border/50 align-top"><td class="px-2 py-3" :data-label="t('admin.mail.dnsType')"><span class="font-semibold text-white">{{ record.type }}</span><span class="mt-1 block text-[10px] text-flixer-muted">{{ t(`admin.mail.dns.${record.purpose}`) }}</span><span v-if="record.required" class="mt-1 inline-block rounded bg-flixer-primary/20 px-1.5 py-0.5 text-[10px] text-flixer-accent">{{ t('admin.mail.required') }}</span><span v-else class="mt-1 inline-block rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-flixer-muted">{{ t('admin.mail.recommended') }}</span></td><td class="break-all px-2 py-3 font-mono text-flixer-text" :data-label="t('admin.mail.dnsName')">{{ record.name }}<button type="button" class="ml-2 text-flixer-muted hover:text-white" :aria-label="t('admin.mail.copyValue', { value: record.name })" @click="copyValue(record.name)"><Icon icon="lucide:copy" class="inline size-3" aria-hidden="true" /></button></td><td class="break-all px-2 py-3 font-mono text-flixer-text" :data-label="t('admin.mail.dnsValue')"><span v-if="record.priority" class="mr-1 text-flixer-muted">{{ t('admin.mail.priority', { priority: record.priority }) }}</span>{{ record.value }}<button type="button" class="ml-2 text-flixer-muted hover:text-white" :aria-label="t('admin.mail.copyValue', { value: record.value })" @click="copyValue(record.value)"><Icon icon="lucide:copy" class="inline size-3" aria-hidden="true" /></button></td><td class="max-w-xs px-2 py-3 leading-5 text-flixer-muted" :data-label="t('admin.mail.dnsNote')">{{ record.note }}</td></tr></template></tbody></table></div>
        </section>
      </div>
      <p v-else-if="!loading" class="admin-card p-8 text-center text-sm text-flixer-muted">{{ t('admin.mail.noDomains') }}</p>
    </template>

    <template v-else-if="screen === 'inboxes'">
      <AdminSection :title="t('admin.mail.createInbox')" :description="t('admin.mail.inboxHelp')">
        <div class="grid gap-3 sm:grid-cols-2"><label class="text-xs text-flixer-muted">{{ t('admin.mail.address') }}<input v-model="mailboxInput.address" :class="inputClass" placeholder="hello@example.com" /></label><label class="text-xs text-flixer-muted">{{ t('admin.mail.displayName') }}<input v-model="mailboxInput.displayName" :class="inputClass" :placeholder="t('admin.mail.optional')" /></label></div>
        <div class="mt-3 flex justify-end"><button type="button" :class="primaryButtonClass" :disabled="busy || !mailboxInput.address.trim()" @click="addMailbox">{{ t('admin.mail.createInboxAction') }}</button></div>
      </AdminSection>
      <AdminSection :title="t('admin.mail.inboxesTitle')">
        <div class="overflow-x-auto"><table class="mail-stack w-full text-left text-sm md:min-w-[44rem]"><thead class="text-xs text-flixer-muted"><tr><th class="px-3 py-2 font-medium">{{ t('admin.mail.address') }}</th><th class="px-3 py-2 font-medium">{{ t('admin.mail.kindLabel') }}</th><th class="px-3 py-2 font-medium">{{ t('admin.mail.unread') }}</th><th class="px-3 py-2 font-medium">{{ t('admin.mail.received') }}</th><th class="px-3 py-2 font-medium">{{ t('admin.mail.sent') }}</th><th class="px-3 py-2 font-medium">{{ t('admin.mail.enabled') }}</th><th class="px-3 py-2"></th></tr></thead><tbody><tr v-for="mailbox in mailboxes" :key="mailbox.id" class="border-t border-flixer-border/60"><td class="px-3 py-3" :data-label="t('admin.mail.address')"><p class="font-medium text-white">{{ mailbox.displayName || mailbox.address }}</p><p v-if="mailbox.displayName" class="text-xs text-flixer-muted">{{ mailbox.address }}</p></td><td class="px-3 py-3" :data-label="t('admin.mail.kindLabel')"><StatusPill :tone="mailbox.kind === 'system' ? 'neutral' : mailbox.kind === 'user' ? 'accent' : 'good'">{{ mailboxKind(mailbox.kind) }}</StatusPill></td><td class="px-3 py-3" :data-label="t('admin.mail.unread')">{{ mailbox.unread }}</td><td class="px-3 py-3" :data-label="t('admin.mail.received')">{{ mailbox.received }}</td><td class="px-3 py-3" :data-label="t('admin.mail.sent')">{{ mailbox.sent }}</td><td class="px-3 py-3" :data-label="t('admin.mail.enabled')"><input type="checkbox" role="switch" class="size-4 accent-flixer-accent" :checked="mailbox.enabled" :disabled="mailbox.kind === 'system'" :aria-label="t('admin.mail.toggleInbox', { address: mailbox.address })" @change="toggleMailbox(mailbox)" /></td><td class="px-3 py-3 text-right"><button v-if="mailbox.kind !== 'system'" type="button" class="rounded p-2 text-flixer-muted hover:bg-red-500/10 hover:text-red-200" :aria-label="t('admin.mail.deleteInbox', { address: mailbox.address })" @click="removeMailbox(mailbox)"><Icon icon="lucide:trash-2" class="size-4" aria-hidden="true" /></button></td></tr></tbody></table></div>
        <p v-if="mailboxes.length === 0" class="py-8 text-center text-sm text-flixer-muted">{{ t('admin.mail.noInboxes') }}</p>
      </AdminSection>
    </template>

    <template v-else-if="screen === 'messages'">
      <div class="flex flex-wrap items-center gap-2 rounded border border-flixer-border bg-flixer-surface/70 p-3">
        <select v-model="messageFilters.mailboxId" class="min-w-40 rounded border border-flixer-border bg-flixer-background px-3 py-2 text-xs text-flixer-text"><option value="">{{ t('admin.mail.allInboxes') }}</option><option v-for="mailbox in mailboxes" :key="mailbox.id" :value="mailbox.id">{{ mailbox.address }}</option></select>
        <div class="flex rounded bg-black/20 p-1"><button v-for="direction in ['inbound', 'outbound'] as const" :key="direction" type="button" class="rounded px-3 py-1.5 text-xs" :class="messageFilters.direction === direction ? 'bg-white/10 text-white' : 'text-flixer-muted'" @click="messageFilters.direction = direction">{{ t(`admin.mail.${direction}`) }}</button></div>
        <label class="flex min-w-40 flex-1 items-center gap-2 rounded border border-flixer-border bg-flixer-background px-3 py-2"><Icon icon="lucide:search" class="size-4 text-flixer-muted" aria-hidden="true" /><input v-model="messageFilters.search" class="w-full bg-transparent text-xs outline-none placeholder:text-flixer-muted" :placeholder="t('admin.mail.searchMessages')" /></label>
        <label class="flex items-center gap-2 text-xs text-flixer-muted"><input v-model="messageFilters.unread" type="checkbox" class="accent-flixer-accent" />{{ t('admin.mail.unreadOnly') }}</label>
      </div>
      <div class="grid min-h-[36rem] gap-4 lg:grid-cols-[minmax(19rem,0.8fr)_minmax(0,1.4fr)]">
        <section class="overflow-hidden rounded border border-flixer-border bg-flixer-surface/70"><div class="flex items-center justify-between border-b border-flixer-border/70 px-4 py-3"><h2 class="text-sm font-semibold text-white">{{ t('admin.mail.messages') }}</h2><span class="text-xs text-flixer-muted">{{ messagePage?.total ?? 0 }}</span></div><p v-if="!messagePage" class="p-6 text-center text-sm text-flixer-muted">{{ t('admin.mail.loading') }}</p><p v-else-if="messagePage.items.length === 0" class="p-8 text-center text-sm text-flixer-muted">{{ t('admin.mail.noMessages') }}</p><ul v-else class="divide-y divide-flixer-border/60"><li v-for="message in messagePage.items" :key="message.id"><button type="button" class="w-full p-4 text-left hover:bg-white/5" :class="activeMessage?.id === message.id ? 'bg-white/5' : ''" @click="openMessage(message)"><div class="flex items-center justify-between gap-2"><span class="truncate text-sm font-semibold text-white">{{ message.direction === 'inbound' ? (message.fromName || message.from) : message.to.join(', ') }}</span><time class="shrink-0 text-[11px] text-flixer-muted">{{ formatDate(message.createdAt) }}</time></div><span class="mt-1 block truncate text-sm text-flixer-text">{{ message.subject || t('admin.mail.noSubject') }}</span><span class="mt-1 block truncate text-xs text-flixer-muted">{{ message.preview }}</span><span v-if="message.status !== 'sent'" class="mt-2 inline-flex rounded bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-200">{{ t(`admin.mail.status.${message.status}`, message.status) }}</span></button></li></ul><div class="flex items-center justify-between border-t border-flixer-border/70 px-4 py-3 text-xs"><button type="button" class="rounded px-2 py-1 hover:bg-white/10 disabled:opacity-40" :disabled="messagePageNumber <= 1" @click="messagePageNumber--">{{ t('admin.mail.previous') }}</button><span>{{ t('admin.mail.pageOf', { page: messagePageNumber, pages: totalPages }) }}</span><button type="button" class="rounded px-2 py-1 hover:bg-white/10 disabled:opacity-40" :disabled="messagePageNumber >= totalPages" @click="messagePageNumber++">{{ t('admin.mail.next') }}</button></div></section>
        <section class="min-h-[28rem] overflow-hidden rounded border border-flixer-border bg-flixer-surface/70"><p v-if="readerLoading" class="p-8 text-center text-sm text-flixer-muted">{{ t('admin.mail.loadingMessage') }}</p><div v-else-if="activeMessage" class="flex h-full flex-col"><header class="border-b border-flixer-border/70 p-4 sm:p-5"><div class="flex flex-wrap items-start justify-between gap-3"><h2 class="min-w-0 flex-1 break-words text-lg font-semibold text-white">{{ activeMessage.subject || t('admin.mail.noSubject') }}</h2><div class="flex gap-1"><button type="button" class="rounded p-2 text-flixer-muted hover:bg-white/10 hover:text-white" :aria-label="t('admin.mail.reply')" @click="startReply(activeMessage)"><Icon icon="lucide:reply" class="size-4" aria-hidden="true" /></button><button type="button" class="rounded p-2 text-flixer-muted hover:bg-red-500/10 hover:text-red-200" :aria-label="t('admin.mail.deleteMessage')" @click="removeMessage(activeMessage)"><Icon icon="lucide:trash-2" class="size-4" aria-hidden="true" /></button></div></div><dl class="mt-3 grid gap-1 text-xs text-flixer-muted sm:grid-cols-[auto_1fr]"><dt>{{ t('admin.mail.from') }}</dt><dd class="break-all text-flixer-text">{{ activeMessage.fromName ? `${activeMessage.fromName} <${activeMessage.from}>` : activeMessage.from }}</dd><dt>{{ t('admin.mail.to') }}</dt><dd class="break-all text-flixer-text">{{ activeMessage.to.join(', ') }}</dd><dt>{{ t('admin.mail.date') }}</dt><dd class="text-flixer-text">{{ formatDate(activeMessage.createdAt) }}</dd><dt v-if="activeMessage.messageId">{{ t('admin.mail.messageId') }}</dt><dd v-if="activeMessage.messageId" class="break-all text-flixer-text">{{ activeMessage.messageId }}</dd><dt v-if="activeMessage.lastError">{{ t('admin.mail.deliveryError') }}</dt><dd v-if="activeMessage.lastError" class="break-words text-red-200">{{ activeMessage.lastError }}</dd></dl><div class="mt-3 flex flex-wrap gap-2"><span v-for="check in messageChecks" :key="check.key" class="rounded px-2 py-1 text-[11px] font-semibold" :class="check.value === 'pass' ? 'bg-emerald-500/15 text-emerald-300' : check.value === 'fail' ? 'bg-red-500/15 text-red-200' : 'bg-white/10 text-flixer-muted'">{{ check.key.toUpperCase() }} · {{ check.value }}</span></div></header><div v-if="activeMessage.attachments.length" class="flex flex-wrap gap-2 border-b border-flixer-border/70 p-4"><button v-for="attachment in activeMessage.attachments" :key="attachment.id" type="button" class="flex items-center gap-2 rounded border border-flixer-border px-3 py-2 text-xs text-flixer-text hover:bg-white/5" @click="downloadAttachment(attachment)"><Icon icon="lucide:paperclip" class="size-3.5" aria-hidden="true" />{{ attachment.filename }}<span class="text-flixer-muted">{{ Math.max(1, Math.round(attachment.size / 1024)) }} KB</span></button></div><iframe v-if="activeMessage.html" :srcdoc="messageHtml" sandbox="" class="min-h-[24rem] w-full flex-1 bg-white" :title="t('admin.mail.messageBody')"></iframe><pre v-else class="min-h-[24rem] flex-1 overflow-auto whitespace-pre-wrap break-words p-5 text-sm leading-6 text-flixer-text">{{ activeMessage.text }}</pre></div><p v-else class="grid h-full min-h-[28rem] place-items-center p-8 text-center text-sm text-flixer-muted">{{ t('admin.mail.selectMessage') }}</p></section>
      </div>
      <div v-if="composeOpen" class="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-3" role="dialog" aria-modal="true" :aria-label="t('admin.mail.composeTitle')"><section class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded border border-flixer-border bg-flixer-surface p-5 shadow-2xl"><header class="mb-4 flex items-center justify-between"><h2 class="text-lg font-semibold text-white">{{ t('admin.mail.composeTitle') }}</h2><button type="button" class="rounded p-2 text-flixer-muted hover:bg-white/10" :aria-label="t('common.close')" @click="composeOpen = false"><Icon icon="lucide:x" class="size-4" aria-hidden="true" /></button></header><div class="grid gap-3"><label class="text-xs text-flixer-muted">{{ t('admin.mail.from') }}<select v-model="compose.from" :class="inputClass"><option v-for="mailbox in sendableMailboxes" :key="mailbox.id" :value="mailbox.address">{{ mailbox.displayName || mailbox.address }}</option></select></label><label class="text-xs text-flixer-muted">{{ t('admin.mail.toMultiple') }}<input v-model="compose.to" :class="inputClass" :placeholder="t('admin.mail.recipientHelp')" /></label><label class="text-xs text-flixer-muted">{{ t('admin.mail.subject') }}<input v-model="compose.subject" :class="inputClass" /></label><label class="text-xs text-flixer-muted">{{ t('admin.mail.bodyText') }}<textarea v-model="compose.text" rows="9" :class="inputClass" /></label></div><div class="mt-4 flex justify-end gap-2"><button type="button" :class="buttonClass" @click="composeOpen = false">{{ t('common.cancel') }}</button><button type="button" :class="primaryButtonClass" :disabled="busy || !compose.subject.trim() || !compose.text.trim()" @click="sendMessage">{{ t('admin.mail.send') }}</button></div></section></div>
    </template>

    <template v-else-if="screen === 'templates'">
      <div class="grid gap-4 xl:grid-cols-[minmax(15rem,0.65fr)_minmax(0,1.8fr)]">
        <AdminSection :title="t('admin.mail.templatesTitle')" :description="t('admin.mail.templatesDescription')">
          <div class="mb-4 flex gap-2"><input v-model="newTemplateName" :class="inputClass" class="min-w-0" :placeholder="t('admin.mail.templateSlug')" @keydown.enter="createTemplate" /><button type="button" :class="primaryButtonClass" :disabled="!templateSlugValid" @click="createTemplate">{{ t('admin.mail.newTemplate') }}</button></div>
          <p v-if="newTemplateName && !templateSlugValid" class="mb-3 text-xs text-red-200">{{ t('admin.mail.invalidTemplateSlug') }}</p>
          <ul class="space-y-1"><li v-for="template in templates" :key="template.name"><button type="button" class="w-full rounded p-3 text-left hover:bg-white/5" :class="templateName === template.name ? 'bg-white/10' : ''" @click="selectTemplate(template.name)"><span class="flex items-center justify-between gap-2"><span class="truncate text-sm font-semibold text-white">{{ template.label }}</span><StatusPill :tone="template.builtin ? 'accent' : 'neutral'">{{ template.builtin ? t('admin.mail.builtin') : t('admin.mail.custom') }}</StatusPill></span><span class="mt-1 block truncate text-xs text-flixer-muted">{{ template.name }}</span></button></li></ul>
        </AdminSection>
        <AdminSection v-if="activeTemplate" :title="templateEditor.label || activeTemplate.name" :description="activeTemplate.description">
          <template #actions><button type="button" :class="buttonClass" :disabled="busy" @click="resetTemplate">{{ activeTemplate.builtin ? t('admin.mail.resetTemplate') : t('common.delete') }}</button><button type="button" :class="primaryButtonClass" :disabled="busy" @click="saveTemplate">{{ t('common.save') }}</button></template>
          <div class="grid gap-3 sm:grid-cols-2"><label class="text-xs text-flixer-muted">{{ t('admin.mail.templateLabel') }}<input v-model="templateEditor.label" :class="inputClass" /></label><label class="text-xs text-flixer-muted">{{ t('admin.mail.templateDescription') }}<input v-model="templateEditor.description" :class="inputClass" /></label><label class="text-xs text-flixer-muted sm:col-span-2">{{ t('admin.mail.subject') }}<input v-model="templateEditor.subject" :class="inputClass" /></label></div>
          <div class="mt-4 flex flex-wrap items-center justify-between gap-2"><div class="flex rounded bg-black/20 p-1"><button v-for="tab in ['html', 'text'] as const" :key="tab" type="button" class="rounded px-3 py-1.5 text-xs" :class="templateEditTab === tab ? 'bg-white/10 text-white' : 'text-flixer-muted'" @click="templateEditTab = tab">{{ t(`admin.mail.${tab}Tab`) }}</button></div><div class="flex flex-wrap gap-1"><button v-for="variable in [...new Set([...(activeTemplate.variables ?? []), ...(preview?.variables ?? [])])]" :key="variable" type="button" class="rounded bg-flixer-primary/15 px-2 py-1 text-[10px] text-flixer-accent hover:bg-flixer-primary/25" @click="insertVariable(variable)">{{ variableToken(variable) }}</button></div></div>
          <textarea v-if="templateEditTab === 'html'" ref="templateHtmlEditor" v-model="templateEditor.html" rows="14" spellcheck="false" class="mt-2 w-full resize-y rounded border border-flixer-border bg-[#111318] p-3 font-mono text-xs leading-5 text-flixer-text focus:border-flixer-accent focus:outline-none" :aria-label="t('admin.mail.htmlEditor')" />
          <textarea v-else ref="templateTextEditor" v-model="templateEditor.text" rows="14" spellcheck="false" class="mt-2 w-full resize-y rounded border border-flixer-border bg-[#111318] p-3 font-mono text-xs leading-5 text-flixer-text focus:border-flixer-accent focus:outline-none" :aria-label="t('admin.mail.textEditor')" />
          <div class="mt-5 border-t border-flixer-border/70 pt-4"><div class="flex flex-wrap items-center justify-between gap-3"><div><h3 class="text-sm font-semibold text-white">{{ t('admin.mail.preview') }}</h3><p class="mt-1 text-xs text-flixer-muted">{{ preview?.subject || t('admin.mail.previewPending') }}</p></div><div class="flex rounded bg-black/20 p-1"><button v-for="tab in ['html', 'text'] as const" :key="tab" type="button" class="rounded px-3 py-1.5 text-xs" :class="previewTab === tab ? 'bg-white/10 text-white' : 'text-flixer-muted'" @click="previewTab = tab">{{ t(`admin.mail.${tab}Tab`) }}</button></div></div><iframe v-if="previewTab === 'html' && preview" :srcdoc="previewHtml" sandbox="" class="mt-3 h-72 w-full rounded bg-white" :title="t('admin.mail.templatePreview')"></iframe><pre v-else-if="preview" class="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded bg-white p-4 text-sm text-gray-900">{{ preview.text }}</pre><p v-else class="mt-3 rounded bg-black/10 p-6 text-center text-xs text-flixer-muted">{{ t('admin.mail.previewPending') }}</p></div>
          <div class="mt-5 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end"><label class="text-xs text-flixer-muted">{{ t('admin.mail.testRecipient') }}<input v-model="templateTestTo" type="email" :class="inputClass" placeholder="you@example.com" /></label><button type="button" :class="buttonClass" :disabled="busy || !templateTestTo.trim()" @click="sendTest">{{ t('admin.mail.sendTest') }}</button></div>
        </AdminSection>
        <AdminSection v-else :title="t('admin.mail.chooseTemplate')" :description="t('admin.mail.chooseTemplateHelp')"><p class="text-sm text-flixer-muted">{{ t('admin.mail.noTemplateSelected') }}</p></AdminSection>
      </div>
    </template>
  </div>
</template>

<style scoped>
@media (width < 48rem) {
  .mail-stack,
  .mail-stack tbody,
  .mail-stack tr,
  .mail-stack td {
    display: block;
    width: 100%;
  }

  .mail-stack thead {
    display: none;
  }

  .mail-stack tr {
    padding: 0.5rem 0;
  }

  .mail-stack td {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.25rem 0.5rem !important;
    text-align: right;
  }

  .mail-stack td[data-label]::before {
    content: attr(data-label);
    flex-shrink: 0;
    font-size: 0.6875rem;
    color: var(--color-flixer-muted);
    text-align: left;
  }

  .mail-stack td > * {
    min-width: 0;
  }
}
</style>
