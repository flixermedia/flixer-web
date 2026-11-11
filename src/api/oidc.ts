import { api } from './client'

export interface OidcClient {
  id: string
  name: string
  redirectUris: string[]
  type: 'public' | 'confidential'
  resourceScopes: string[]
  createdAt: string
}

export interface OidcInteraction {
  prompt: 'login' | 'consent'
  clientName: string
  scope: string
  username: string
}

export interface OidcConnectedApp {
  id: string
  name: string
  scopes: string[]
}

export async function listConnectedApps(): Promise<OidcConnectedApp[]> {
  return (await api.get<OidcConnectedApp[]>('/account/oidc-apps')).data
}

export async function revokeConnectedApp(id: string): Promise<void> {
  await api.delete(`/account/oidc-apps/${encodeURIComponent(id)}`)
}

export async function listOidcClients(): Promise<OidcClient[]> {
  return (await api.get<OidcClient[]>('/admin/oidc/clients')).data
}

export interface OidcConfiguration {
  publicUrl: string
  issuer: string
}

export async function getOidcConfiguration(): Promise<OidcConfiguration> {
  return (await api.get<OidcConfiguration>('/admin/oidc/clients/configuration')).data
}

export async function updateOidcConfiguration(publicUrl: string): Promise<OidcConfiguration> {
  return (await api.put<OidcConfiguration>('/admin/oidc/clients/configuration', { publicUrl })).data
}

export async function createOidcClient(input: { name: string; redirectUris: string[]; type: 'public' | 'confidential' }): Promise<OidcClient & { secret?: string }> {
  return (await api.post<OidcClient & { secret?: string }>('/admin/oidc/clients', input)).data
}

export async function deleteOidcClient(id: string): Promise<void> {
  await api.delete(`/admin/oidc/clients/${encodeURIComponent(id)}`)
}

export async function setOidcResourceScopes(id: string, scopes: string[]): Promise<void> {
  await api.put(`/admin/oidc/clients/${encodeURIComponent(id)}/resource-scopes`, { scopes })
}

export async function getOidcInteraction(uid: string): Promise<OidcInteraction> {
  return (await api.get<OidcInteraction>(`/oidc/interaction/${encodeURIComponent(uid)}/details`)).data
}

export async function getOidcInteractionClient(uid: string): Promise<{ clientName: string }> {
  return (await api.get<{ clientName: string }>(`/oidc/interaction/${encodeURIComponent(uid)}/client`)).data
}

export async function decideOidcInteraction(uid: string, action: 'login' | 'approve' | 'deny'): Promise<{ redirect: string }> {
  return (await api.post<{ redirect: string }>(`/oidc/interaction/${encodeURIComponent(uid)}`, { action })).data
}
