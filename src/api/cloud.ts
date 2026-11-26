import { api } from './client'

export interface CloudPlan {
  id: string
  name: string
  status: string
  kind: 'subscription' | 'one_time'
  active: boolean
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: string | null
  features?: string[]
}

export interface CloudAccount {
  uid: string
  email: string
  displayName: string
}

export interface CloudEntitlementStatus {
  connected: boolean
  stale: boolean
  autoSyncEnabled: boolean
  gracePeriodDays: number
  instanceId: string | null
  account: CloudAccount | null
  linkId: string | null
  plans: CloudPlan[]
  features: string[]
  syncedAt: string | null
  lastSyncAttemptAt: string | null
  lastError: string | null
  cloudWebUrl: string
}

export interface SupportChatAttachment {
  name: string
  url: string
  contentType?: string
}

export interface SupportChatAttachmentInput {
  dataUrl: string
  name?: string
}

export interface SupportChatMessage {
  id: string
  sender: 'customer' | 'agent'
  senderName: string
  text: string
  timestamp: string
  attachments?: SupportChatAttachment[]
}

export interface SupportChatState {
  room: { rid: string; open: boolean } | null
  messages: SupportChatMessage[]
}

export interface ServerDiagnosticsSummary {
  flixerVersion: string
  nodeVersion: string
  platform: string
  arch: string
  uptimeSeconds: number
  instanceId: string | null
  linkId: string | null
  activePlans: string[]
  activeFeatures: string[]
  formattedText: string
}

export async function getCloudStatus(): Promise<CloudEntitlementStatus> {
  const response = await api.get<CloudEntitlementStatus>('/admin/cloud')
  return response.data
}

export async function startCloudConnect(redirectUri: string): Promise<{ authorizeUrl: string }> {
  const response = await api.post<{ authorizeUrl: string }>('/admin/cloud/connect/start', { redirectUri })
  return response.data
}

export async function completeCloudConnect(code: string, state: string): Promise<CloudEntitlementStatus> {
  const response = await api.post<CloudEntitlementStatus>('/admin/cloud/connect/callback', { code, state })
  return response.data
}

export async function syncCloudEntitlements(): Promise<CloudEntitlementStatus> {
  const response = await api.post<CloudEntitlementStatus>('/admin/cloud/sync')
  return response.data
}

export async function disconnectCloud(): Promise<CloudEntitlementStatus> {
  const response = await api.post<CloudEntitlementStatus>('/admin/cloud/disconnect')
  return response.data
}

export async function updateCloudSettings(payload: { autoSyncEnabled: boolean }): Promise<CloudEntitlementStatus> {
  const response = await api.post<CloudEntitlementStatus>('/admin/cloud/settings', payload)
  return response.data
}

export async function getSupportMessages(): Promise<SupportChatState> {
  const response = await api.get<SupportChatState>('/admin/cloud/support/messages')
  return response.data
}

export async function sendSupportMessage(
  message: string,
  attachment?: SupportChatAttachmentInput,
): Promise<{ room: { rid: string; open: boolean } | null; message: SupportChatMessage }> {
  const response = await api.post<{ room: { rid: string; open: boolean } | null; message: SupportChatMessage }>('/admin/cloud/support/messages', {
    message,
    ...(attachment ? { attachment } : {}),
  })
  return response.data
}

export async function fetchSupportAttachmentBlobUrl(path: string): Promise<string> {
  const response = await api.get<Blob>('/admin/cloud/support/attachment', {
    params: { path },
    responseType: 'blob',
  })
  return URL.createObjectURL(response.data)
}

export async function endSupportSession(): Promise<{ closed: boolean; room: null }> {
  const response = await api.post<{ closed: boolean; room: null }>('/admin/cloud/support/close')
  return response.data
}

export async function getSupportDiagnostics(): Promise<ServerDiagnosticsSummary> {
  const response = await api.get<ServerDiagnosticsSummary>('/admin/cloud/support/diagnostics')
  return response.data
}
