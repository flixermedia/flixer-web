import { api, getAccessToken } from './client'

export interface MailSettings {
  inboundEnabled: boolean
  inboundPort: number
  hostname: string | null
  maxMessageMb: number
  outboundEnabled: boolean
  relayFallback: boolean
  noreplyAddress: string | null
  noreplyName: string
  userAddressesEnabled: boolean
  userAddressMode: 'username' | 'random'
  userAddressDomain: string | null
}

export interface MailStatus {
  inbound: { listening: boolean; port: number | null; error: string | null }
  outboundReady: boolean
  sender: string | null
  domains: { total: number; verified: number }
  userAddressesEnabled: boolean
}

export interface MailCheck {
  ok: boolean
  detail: string
}

export interface MailDnsRecord {
  purpose: 'ownership' | 'mx' | 'spf' | 'dkim' | 'dmarc'
  type: 'TXT' | 'MX'
  name: string
  value: string
  priority?: number
  required: boolean
  note: string
}

export interface MailDomain {
  id: string
  domain: string
  allowSubdomains: boolean
  verified: boolean
  verifiedAt: string | null
  dkimSelector: string
  checks: Record<string, MailCheck>
  lastCheckedAt: string | null
  records: MailDnsRecord[]
  createdAt: string
}

export interface Mailbox {
  id: string
  address: string
  kind: 'system' | 'inbox' | 'user'
  displayName: string | null
  userId: string | null
  enabled: boolean
  createdAt: string
  username?: string | null
  received: number
  sent: number
  unread: number
}

export interface MailMessageSummary {
  id: string
  mailboxId: string
  direction: 'inbound' | 'outbound'
  status: string
  from: string
  fromName: string | null
  to: string[]
  subject: string
  preview: string
  hasAttachments: boolean
  read: boolean
  createdAt: string
}

export interface MailAttachment {
  id: string
  filename: string
  contentType: string
  size: number
}

export interface MailMessage extends MailMessageSummary {
  text: string
  html: string | null
  messageId: string | null
  authResults: Record<string, unknown> | null
  remoteAddress: string | null
  attempts: number
  lastError: string | null
  sentAt: string | null
  attachments: MailAttachment[]
}

export interface MailMessagePage {
  total: number
  page: number
  limit: number
  items: MailMessageSummary[]
}

export interface MailTemplate {
  name: string
  label: string
  description: string
  subject: string
  html: string
  text: string
  builtin: boolean
  customized: boolean
  variables: string[]
  updatedAt: string | null
}

export interface RenderedMailTemplate {
  subject: string
  html: string
  text: string
  variables: string[]
}

export interface MailMe {
  enabled: boolean
  address: string | null
  unread: number
}

export interface MailSettingsUpdate extends Partial<MailSettings> {}
export interface MailTemplateSave {
  label: string
  description: string
  subject: string
  html: string
  text: string
}

function params(values: Record<string, string | number | boolean | undefined>): URLSearchParams {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) if (value !== undefined && value !== '') query.set(key, String(value))
  return query
}

export async function getMailStatus(): Promise<MailStatus> {
  return (await api.get<MailStatus>('/admin/mail/status')).data
}
export async function getMailSettings(): Promise<MailSettings> {
  return (await api.get<MailSettings>('/admin/mail/settings')).data
}
export async function updateMailSettings(settings: MailSettingsUpdate): Promise<MailSettings> {
  return (await api.put<MailSettings>('/admin/mail/settings', settings)).data
}
export async function runMailDiagnostics(): Promise<Record<string, MailCheck>> {
  return (await api.post<Record<string, MailCheck>>('/admin/mail/diagnostics')).data
}
export async function listMailDomains(): Promise<MailDomain[]> {
  return (await api.get<MailDomain[]>('/admin/mail/domains')).data
}
export async function createMailDomain(input: { domain: string; allowSubdomains: boolean }): Promise<MailDomain> {
  return (await api.post<MailDomain>('/admin/mail/domains', input)).data
}
export async function updateMailDomain(id: string, input: { allowSubdomains: boolean }): Promise<MailDomain> {
  return (await api.patch<MailDomain>(`/admin/mail/domains/${encodeURIComponent(id)}`, input)).data
}
export async function verifyMailDomain(id: string): Promise<MailDomain> {
  return (await api.post<MailDomain>(`/admin/mail/domains/${encodeURIComponent(id)}/verify`)).data
}
export async function rotateMailDomainDkim(id: string): Promise<MailDomain> {
  return (await api.post<MailDomain>(`/admin/mail/domains/${encodeURIComponent(id)}/rotate-dkim`)).data
}
export async function deleteMailDomain(id: string): Promise<void> {
  await api.delete(`/admin/mail/domains/${encodeURIComponent(id)}`)
}
export async function listMailboxes(): Promise<Mailbox[]> {
  return (await api.get<Mailbox[]>('/admin/mail/mailboxes')).data
}
export async function createMailbox(input: { address: string; displayName?: string }): Promise<Mailbox> {
  return (await api.post<Mailbox>('/admin/mail/mailboxes', input)).data
}
export async function updateMailbox(id: string, input: { enabled?: boolean; displayName?: string | null }): Promise<Mailbox> {
  return (await api.patch<Mailbox>(`/admin/mail/mailboxes/${encodeURIComponent(id)}`, input)).data
}
export async function deleteMailbox(id: string): Promise<void> {
  await api.delete(`/admin/mail/mailboxes/${encodeURIComponent(id)}`)
}
export async function generateUserMailboxes(): Promise<{ created: number }> {
  return (await api.post<{ created: number }>('/admin/mail/mailboxes/generate-user-addresses')).data
}
export async function listAdminMailMessages(options: { mailboxId?: string; direction?: 'inbound' | 'outbound'; search?: string; unread?: boolean; page?: number; limit?: number }): Promise<MailMessagePage> {
  const query = params(options)
  return (await api.get<MailMessagePage>(`/admin/mail/messages${query.size ? `?${query}` : ''}`)).data
}
export async function getAdminMailMessage(id: string): Promise<MailMessage> {
  return (await api.get<MailMessage>(`/admin/mail/messages/${encodeURIComponent(id)}`)).data
}
export async function deleteAdminMailMessage(id: string): Promise<void> {
  await api.delete(`/admin/mail/messages/${encodeURIComponent(id)}`)
}
export async function sendAdminMail(input: { from: string; to: string[]; subject: string; text: string; html?: string | null; inReplyTo?: string | null }): Promise<{ queued: number; ids: string[] }> {
  return (await api.post<{ queued: number; ids: string[] }>('/admin/mail/send', input)).data
}
export async function listMailTemplates(): Promise<MailTemplate[]> {
  return (await api.get<MailTemplate[]>('/admin/mail/templates')).data
}
export async function getMailTemplate(name: string): Promise<MailTemplate> {
  return (await api.get<MailTemplate>(`/admin/mail/templates/${encodeURIComponent(name)}`)).data
}
export async function saveMailTemplate(name: string, input: MailTemplateSave): Promise<MailTemplate> {
  return (await api.put<MailTemplate>(`/admin/mail/templates/${encodeURIComponent(name)}`, input)).data
}
export async function deleteMailTemplate(name: string): Promise<void> {
  await api.delete(`/admin/mail/templates/${encodeURIComponent(name)}`)
}
export async function previewMailTemplate(name: string, input: Pick<MailTemplateSave, 'subject' | 'html' | 'text'>): Promise<RenderedMailTemplate> {
  return (await api.post<RenderedMailTemplate>(`/admin/mail/templates/${encodeURIComponent(name)}/preview`, input)).data
}
export async function sendMailTemplateTest(name: string, to: string): Promise<{ sentTo: string }> {
  return (await api.post<{ sentTo: string }>(`/admin/mail/templates/${encodeURIComponent(name)}/test`, { to })).data
}
export async function getMyMailInfo(): Promise<MailMe> {
  return (await api.get<MailMe>('/mail/me')).data
}
export async function listMyMailMessages(options: { search?: string; unread?: boolean; page?: number; limit?: number }): Promise<MailMessagePage> {
  const query = params(options)
  return (await api.get<MailMessagePage>(`/mail/messages${query.size ? `?${query}` : ''}`)).data
}
export async function getMyMailMessage(id: string): Promise<MailMessage> {
  return (await api.get<MailMessage>(`/mail/messages/${encodeURIComponent(id)}`)).data
}
export async function deleteMyMailMessage(id: string): Promise<void> {
  await api.delete(`/mail/messages/${encodeURIComponent(id)}`)
}

export async function downloadMailAttachment(scope: 'admin' | 'user', messageId: string, attachment: MailAttachment): Promise<void> {
  const token = getAccessToken()
  const base = (api.defaults.baseURL || '/api').replace(/\/$/, '')
  const path = scope === 'admin'
    ? `/admin/mail/messages/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(attachment.id)}`
    : `/mail/messages/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(attachment.id)}`
  const response = await fetch(`${base}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  if (!response.ok) throw new Error(`Attachment download failed (${response.status}).`)
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = attachment.filename
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
