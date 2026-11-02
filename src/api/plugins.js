/** Plugin catalog, installation, settings, and plugin-provided routes. */
import { api } from './client';
export async function listPluginInstallations() {
    const response = await api.get('/admin/plugins');
    return response.data;
}
export async function listPluginUpdateHistory(id) {
    const response = await api.get(`/admin/plugins/${encodeURIComponent(id)}/history`);
    return response.data;
}
export async function listPluginRepositories() {
    const response = await api.get('/admin/plugins/repositories');
    return response.data;
}
export async function discoverPlugins(filters = {}) {
    const response = await api.get('/admin/plugins/catalog', { params: filters });
    return response.data;
}
export async function addPluginRepository(name, url) {
    const request = { name, url };
    const response = await api.post('/admin/plugins/repositories', request);
    return response.data;
}
export async function refreshPluginRepository(id) {
    const response = await api.post(`/admin/plugins/repositories/${encodeURIComponent(id)}/refresh`);
    return response.data;
}
export async function installPlugin(id, request) {
    const response = await api.post(`/admin/plugins/${encodeURIComponent(id)}/install`, request);
    return response.data;
}
export async function enablePlugin(id) {
    const response = await api.post(`/admin/plugins/${encodeURIComponent(id)}/enable`);
    return response.data;
}
export async function disablePlugin(id) {
    const response = await api.post(`/admin/plugins/${encodeURIComponent(id)}/disable`);
    return response.data;
}
export async function uninstallPlugin(id) {
    await api.delete(`/admin/plugins/${encodeURIComponent(id)}`);
}
export async function getPluginSettings(id) {
    const response = await api.get(`/admin/plugins/${encodeURIComponent(id)}/settings`);
    return response.data;
}
export async function updatePluginSettings(id, settings) {
    const response = await api.put(`/admin/plugins/${encodeURIComponent(id)}/settings`, settings);
    return response.data;
}
export async function removePluginRepository(id) {
    await api.delete(`/admin/plugins/repositories/${encodeURIComponent(id)}`);
}
/** Calls a plugin's API route; the plugin enforces its own authorization. */
export async function callPluginOperation(pluginId, operation, body = {}) {
    return (await api.post(`/plugins/${encodeURIComponent(pluginId)}/${encodeURIComponent(operation)}`, body)).data;
}
/** Extra search results contributed by plugins; the shape is validated by `sanitizeSearchSections`. */
export async function searchPluginSections(q, type, signal) {
    const params = { q, type };
    return (await api.get('/plugins/search', { params, signal })).data;
}
export async function listPluginPages() {
    return (await api.get('/plugins/pages')).data;
}
