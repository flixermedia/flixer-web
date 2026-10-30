/** Plugin catalog, installation, settings, and plugin-provided routes. */
import { api } from './client'
import type {
  PluginCatalogEntry,
  PluginInstallation,
  PluginPageEntry,
  PluginRepository,
  PluginSettingsView,
  PluginUpdateHistoryEntry,
  FlixerApiRouteBody,
  FlixerApiRouteData,
  FlixerApiRouteQuery,
} from 'flixer-api-client'
export type {
  PluginCatalogEntry,
  PluginInstallation,
  PluginPageEntry,
  PluginRepository,
  PluginSettingsSchema,
  PluginSettingsView,
  PluginUpdateHistoryEntry,
} from 'flixer-api-client'

export async function listPluginInstallations(): Promise<PluginInstallation[]> {
  const response = await api.get<PluginInstallation[]>('/admin/plugins')
  return response.data
}

export async function listPluginUpdateHistory(id: string): Promise<PluginUpdateHistoryEntry[]> {
  const response = await api.get<PluginUpdateHistoryEntry[]>(`/admin/plugins/${encodeURIComponent(id)}/history`)
  return response.data
}

export async function listPluginRepositories(): Promise<PluginRepository[]> {
  const response = await api.get<PluginRepository[]>('/admin/plugins/repositories')
  return response.data
}

export async function discoverPlugins(filters: FlixerApiRouteQuery<'get', '/admin/plugins/catalog'> = {}): Promise<PluginCatalogEntry[]> {
  const response = await api.get<PluginCatalogEntry[]>('/admin/plugins/catalog', { params: filters })
  return response.data
}

export async function addPluginRepository(name: string, url: string): Promise<PluginRepository> {
  const request: FlixerApiRouteBody<'post', '/admin/plugins/repositories'> = { name, url }
  const response = await api.post<PluginRepository>('/admin/plugins/repositories', request)
  return response.data
}

export async function refreshPluginRepository(id: string): Promise<PluginRepository> {
  const response = await api.post<PluginRepository>(`/admin/plugins/repositories/${encodeURIComponent(id)}/refresh`)
  return response.data
}

export async function installPlugin(id: string, request: FlixerApiRouteBody<'post', '/admin/plugins/{param}/install'>): Promise<PluginInstallation> {
  const response = await api.post<PluginInstallation>(`/admin/plugins/${encodeURIComponent(id)}/install`, request)
  return response.data
}

export async function enablePlugin(id: string): Promise<PluginInstallation> {
  const response = await api.post<PluginInstallation>(`/admin/plugins/${encodeURIComponent(id)}/enable`)
  return response.data
}

export async function disablePlugin(id: string): Promise<PluginInstallation> {
  const response = await api.post<PluginInstallation>(`/admin/plugins/${encodeURIComponent(id)}/disable`)
  return response.data
}

export async function uninstallPlugin(id: string): Promise<void> {
  await api.delete(`/admin/plugins/${encodeURIComponent(id)}`)
}

export async function getPluginSettings(id: string): Promise<PluginSettingsView> {
  const response = await api.get<PluginSettingsView>(`/admin/plugins/${encodeURIComponent(id)}/settings`)
  return response.data
}

export async function updatePluginSettings(id: string, settings: FlixerApiRouteBody<'put', '/admin/plugins/{param}/settings'>): Promise<PluginSettingsView> {
  const response = await api.put<PluginSettingsView>(`/admin/plugins/${encodeURIComponent(id)}/settings`, settings)
  return response.data
}

export async function removePluginRepository(id: string): Promise<void> {
  await api.delete(`/admin/plugins/repositories/${encodeURIComponent(id)}`)
}

/** Calls a plugin's API route; the plugin enforces its own authorization. */
export async function callPluginOperation<T = unknown>(pluginId: string, operation: string, body: Record<string, unknown> = {}): Promise<T> {
  return (await api.post<T>(`/plugins/${encodeURIComponent(pluginId)}/${encodeURIComponent(operation)}`, body)).data
}

/** Extra search results contributed by plugins; the shape is validated by `sanitizeSearchSections`. */
export async function searchPluginSections(q: string, type?: string, signal?: AbortSignal): Promise<FlixerApiRouteData<'get', '/plugins/search'>> {
  const params: FlixerApiRouteQuery<'get', '/plugins/search'> = { q, type }
  return (await api.get<FlixerApiRouteData<'get', '/plugins/search'>>('/plugins/search', { params, signal })).data
}

export async function listPluginPages(): Promise<PluginPageEntry[]> {
  return (await api.get<PluginPageEntry[]>('/plugins/pages')).data
}
