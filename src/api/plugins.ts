/** Plugin catalog, installation, settings, and plugin-provided routes. */
import { api } from "./client";
import type { PluginCatalogEntry as BasePluginCatalogEntry, PluginInstallation, PluginPageEntry, PluginRepository, PluginSettingsView, PluginUpdateHistoryEntry, FlixerApiRouteBody, FlixerApiRouteData, FlixerApiRouteQuery } from "flixer-api-client";
export type { PluginInstallation, PluginPageEntry, PluginRepository, PluginSettingsSchema, PluginSettingsView, PluginUpdateHistoryEntry } from "flixer-api-client";
export type PluginCatalogEntry = BasePluginCatalogEntry & { icon?: string; banner?: string };

export async function listPluginInstallations(): Promise<PluginInstallation[]> {
	const response = await api.get<PluginInstallation[]>("/admin/plugins");
	return response.data;
}

export async function listPluginUpdateHistory(id: string): Promise<PluginUpdateHistoryEntry[]> {
	const response = await api.get<PluginUpdateHistoryEntry[]>(`/admin/plugins/${encodeURIComponent(id)}/history`);
	return response.data;
}

export async function listPluginRepositories(): Promise<PluginRepository[]> {
	const response = await api.get<PluginRepository[]>("/admin/plugins/repositories");
	return response.data;
}

export async function discoverPlugins(filters: FlixerApiRouteQuery<"get", "/admin/plugins/catalog"> = {}): Promise<PluginCatalogEntry[]> {
	const response = await api.get<PluginCatalogEntry[]>("/admin/plugins/catalog", { params: filters });
	return response.data;
}

export async function fetchPluginRepositoryImage(repositoryId: string, path: string, signal?: AbortSignal): Promise<Blob> {
	return (await api.get<Blob>(`/admin/plugins/repositories/${encodeURIComponent(repositoryId)}/image`, { params: { path }, responseType: "blob", signal })).data;
}

export async function addPluginRepository(name: string, url: string): Promise<PluginRepository> {
	const request: FlixerApiRouteBody<"post", "/admin/plugins/repositories"> = { name, url };
	const response = await api.post<PluginRepository>("/admin/plugins/repositories", request);
	return response.data;
}

export async function refreshPluginRepository(id: string): Promise<PluginRepository> {
	const response = await api.post<PluginRepository>(`/admin/plugins/repositories/${encodeURIComponent(id)}/refresh`);
	return response.data;
}

export async function installPlugin(id: string, request: FlixerApiRouteBody<"post", "/admin/plugins/{param}/install">): Promise<PluginInstallation> {
	const response = await api.post<PluginInstallation>(`/admin/plugins/${encodeURIComponent(id)}/install`, request);
	return response.data;
}

export interface LocalPluginManifest {
	id: string;
	name: string;
	version: string;
	description: string;
	author: string;
	permissions: string[];
	capabilities: string[];
	targets: Record<string, { entry: string }>;
}

export async function localPluginImportStatus(): Promise<boolean> {
	return (await api.get<{ enabled: boolean }>("/admin/plugins/local-import")).data.enabled;
}

export async function previewLocalPluginPackage(file: File): Promise<LocalPluginManifest> {
	const form = new FormData();
	form.append("package", file);
	const response = await api.post<{ manifest: LocalPluginManifest }>("/admin/plugins/local-import/preview", form, {
		headers: { "Content-Type": undefined },
	});
	return response.data.manifest;
}

export async function importLocalPluginPackage(file: File, approvedPermissions: string[]): Promise<PluginInstallation> {
	const form = new FormData();
	form.append("package", file);
	form.append("approvedPermissions", JSON.stringify(approvedPermissions));
	const response = await api.post<PluginInstallation>("/admin/plugins/local-import", form, {
		headers: { "Content-Type": undefined },
	});
	return response.data;
}

export async function enablePlugin(id: string): Promise<PluginInstallation> {
	const response = await api.post<PluginInstallation>(`/admin/plugins/${encodeURIComponent(id)}/enable`);
	return response.data;
}

export async function disablePlugin(id: string): Promise<PluginInstallation> {
	const response = await api.post<PluginInstallation>(`/admin/plugins/${encodeURIComponent(id)}/disable`);
	return response.data;
}

export async function uninstallPlugin(id: string): Promise<void> {
	await api.delete(`/admin/plugins/${encodeURIComponent(id)}`);
}

export async function getPluginSettings(id: string): Promise<PluginSettingsView> {
	const response = await api.get<PluginSettingsView>(`/admin/plugins/${encodeURIComponent(id)}/settings`);
	return response.data;
}

export async function updatePluginSettings(id: string, settings: FlixerApiRouteBody<"put", "/admin/plugins/{param}/settings">): Promise<PluginSettingsView> {
	const response = await api.put<PluginSettingsView>(`/admin/plugins/${encodeURIComponent(id)}/settings`, settings);
	return response.data;
}

export interface OAuthProviderSettings {
	authorizationUrl: string;
	tokenUrl: string;
	userInfoUrl: string;
	issuer: string;
	subjectField: string;
	scope: string;
	clientId: string;
	tokenAuthMethod: "client_secret_post" | "client_secret_basic" | "none";
}

export interface OAuthProviderProfile {
	id: string;
	pluginId: string;
	name: string;
	enabled: boolean;
	settings: OAuthProviderSettings;
	hasClientSecret: boolean;
}

export interface OAuthProviderUpdate {
	name: string;
	enabled: boolean;
	settings: OAuthProviderSettings;
	clientSecret?: string;
}

export async function listOAuthProviders(pluginId: string): Promise<OAuthProviderProfile[]> {
	return (await api.get<OAuthProviderProfile[]>(`/admin/plugins/${encodeURIComponent(pluginId)}/oauth-providers`)).data;
}

export async function getOAuthCallbackUrl(pluginId: string): Promise<string> {
	return (await api.get<{ callbackUrl: string }>(`/admin/plugins/${encodeURIComponent(pluginId)}/oauth-providers/callback`)).data.callbackUrl;
}

export async function saveOAuthProvider(pluginId: string, providerId: string | null, input: OAuthProviderUpdate): Promise<OAuthProviderProfile> {
	const path = `/admin/plugins/${encodeURIComponent(pluginId)}/oauth-providers`;
	return providerId ? (await api.put<OAuthProviderProfile>(`${path}/${encodeURIComponent(providerId)}`, input)).data : (await api.post<OAuthProviderProfile>(path, input)).data;
}

export async function deleteOAuthProvider(pluginId: string, providerId: string): Promise<void> {
	await api.delete(`/admin/plugins/${encodeURIComponent(pluginId)}/oauth-providers/${encodeURIComponent(providerId)}`);
}

export async function removePluginRepository(id: string): Promise<void> {
	await api.delete(`/admin/plugins/repositories/${encodeURIComponent(id)}`);
}

/** Calls a plugin's API route; the plugin enforces its own authorization. */
export async function callPluginOperation<T = unknown>(pluginId: string, operation: string, body: Record<string, unknown> = {}): Promise<T> {
	return (await api.post<T>(`/plugins/${encodeURIComponent(pluginId)}/${encodeURIComponent(operation)}`, body)).data;
}

/** Extra search results contributed by plugins; the shape is validated by `sanitizeSearchSections`. */
export async function searchPluginSections(q: string, type?: string, signal?: AbortSignal): Promise<FlixerApiRouteData<"get", "/plugins/search">> {
	const params: FlixerApiRouteQuery<"get", "/plugins/search"> = { q, type };
	return (await api.get<FlixerApiRouteData<"get", "/plugins/search">>("/plugins/search", { params, signal })).data;
}

export async function listPluginPages(): Promise<PluginPageEntry[]> {
	return (await api.get<PluginPageEntry[]>("/plugins/pages")).data;
}

export type PluginSlotLocation = "media.detail" | "player.controls";
export interface PluginSlotEntry {
	pluginId: string;
	id: string;
	title: string;
	source: string;
	playbackControl: boolean;
}

export async function listPluginSlots(location: PluginSlotLocation): Promise<PluginSlotEntry[]> {
	return (await api.get<PluginSlotEntry[]>("/plugins/slots", { params: { location } })).data;
}

export async function canPluginControlPlayback(pluginId: string, slotId: string): Promise<boolean> {
	return (await api.get<{ allowed: boolean }>(`/plugins/${encodeURIComponent(pluginId)}/slots/${encodeURIComponent(slotId)}/control`)).data.allowed;
}
