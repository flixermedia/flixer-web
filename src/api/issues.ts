import { apiRequest } from './client'

export type IssueReportStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export interface IssueReportUpdate {
  id: string
  body: string
  isInternal: boolean
  createdAt: string
  author: { username: string; displayName: string } | null
}

export interface IssueReport {
  id: string
  title: string
  category: string
  description: string
  status: IssueReportStatus
  mediaItemId: string | null
  mediaTitle: string | null
  chatOpen: boolean
  chatConversationId: string | null
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  requester: { username: string; displayName: string }
  updates?: IssueReportUpdate[]
}

export interface IssueReportConfiguration {
  enabled: boolean
  categories: string[]
  chatEnabled: boolean
}

export async function getIssueReportConfiguration(): Promise<IssueReportConfiguration> {
  return (await apiRequest<IssueReportConfiguration>({ method: 'GET', url: '/issues/config' })).data
}

export async function listIssueReports(): Promise<IssueReport[]> {
  const response = await apiRequest<{ reports: IssueReport[] }>({ method: 'GET', url: '/issues' })
  return response.data.reports
}

export async function getIssueReport(id: string): Promise<IssueReport> {
  return (await apiRequest<IssueReport>({ method: 'GET', url: `/issues/${encodeURIComponent(id)}` })).data
}

export async function createIssueReport(input: {
  title: string
  category: string
  description: string
  mediaItemId?: string
}): Promise<IssueReport> {
  return (await apiRequest<IssueReport>({ method: 'POST', url: '/issues', data: input })).data
}

export async function listAdminIssueReports(): Promise<IssueReport[]> {
  const response = await apiRequest<{ reports: IssueReport[] }>({ method: 'GET', url: '/admin/issues' })
  return response.data.reports
}

export async function getAdminIssueReport(id: string): Promise<IssueReport> {
  return (await apiRequest<IssueReport>({ method: 'GET', url: `/admin/issues/${encodeURIComponent(id)}` })).data
}

export async function deleteAdminIssueReport(id: string): Promise<void> {
  await apiRequest({ method: 'DELETE', url: `/admin/issues/${encodeURIComponent(id)}` })
}

export async function setAdminIssueReportStatus(id: string, status: IssueReportStatus): Promise<IssueReport> {
  return (await apiRequest<IssueReport>({
    method: 'PATCH',
    url: `/admin/issues/${encodeURIComponent(id)}/status`,
    data: { status },
  })).data
}

export async function addAdminIssueReportUpdate(id: string, body: string, isInternal: boolean): Promise<IssueReport> {
  return (await apiRequest<IssueReport>({
    method: 'POST',
    url: `/admin/issues/${encodeURIComponent(id)}/updates`,
    data: { body, isInternal },
  })).data
}

export async function setAdminIssueReportChat(id: string, open: boolean): Promise<IssueReport> {
  return (await apiRequest<IssueReport>({
    method: 'PATCH',
    url: `/admin/issues/${encodeURIComponent(id)}/chat`,
    data: { open },
  })).data
}
