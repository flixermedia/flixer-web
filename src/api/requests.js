/** Media request workflows and theme-related API operations. */
import { api } from './client';
import axios from 'axios';
import { catchError } from '../utils/catchError';
/** Cached TMDB images are served by the API as relative paths; other (absolute) URLs pass through. */
function withApiBase(url) {
    return url?.startsWith('/') ? `${api.defaults.baseURL ?? ''}${url}` : url;
}
function withPoster(entry) {
    return { ...entry, poster: withApiBase(entry.poster) };
}
export async function getRequestsConfig() {
    return (await api.get('/requests/config')).data;
}
export async function searchRequests(query, type, signal) {
    const params = { q: query, type };
    return (await api.get('/requests/search', { params, signal })).data.map(withPoster);
}
export async function discoverRequests(section, signal) {
    const params = { section };
    return (await api.get('/requests/discover', { params, signal })).data.map(withPoster);
}
export async function getExternalMediaDetail(type, id) {
    const detail = (await api.get(`/requests/details/${type}/${encodeURIComponent(id)}`)).data;
    return { ...withPoster(detail), backdrop: withApiBase(detail.backdrop), requests: detail.requests.map(withPoster) };
}
export async function createMediaRequest(input) {
    return (await api.post('/requests', input)).data;
}
export async function listMediaRequests(params = {}) {
    const data = (await api.get('/requests', { params })).data;
    return { ...data, items: data.items.map(withPoster) };
}
export async function approveMediaRequest(id, input = {}) {
    return (await api.post(`/requests/${encodeURIComponent(id)}/approve`, input)).data;
}
export async function declineMediaRequest(id, reason) {
    const request = { reason };
    return (await api.post(`/requests/${encodeURIComponent(id)}/decline`, request)).data;
}
export async function retryMediaRequest(id) {
    return (await api.post(`/requests/${encodeURIComponent(id)}/retry`)).data;
}
export async function deleteMediaRequest(id) {
    await api.delete(`/requests/${encodeURIComponent(id)}`);
}
export async function listRequestServices() {
    return (await api.get('/admin/requests/services')).data;
}
export async function saveRequestService(input, id) {
    return (await (id ? api.put(`/admin/requests/services/${encodeURIComponent(id)}`, input) : api.post('/admin/requests/services', input))).data;
}
export async function deleteRequestService(id) {
    await api.delete(`/admin/requests/services/${encodeURIComponent(id)}`);
}
export async function testRequestService(input) {
    return (await api.post('/admin/requests/services/test', input)).data;
}
export async function listRequestUsers() {
    return (await api.get('/admin/requests/users')).data;
}
export async function updateRequestUser(id, patch) {
    return (await api.put(`/admin/requests/users/${encodeURIComponent(id)}`, patch)).data;
}
export async function getItemTheme(id) {
    const [error, response] = await catchError(api.get(`/themes/items/${encodeURIComponent(id)}`, { responseType: 'blob' }));
    if (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404)
            return null;
        throw error;
    }
    return response.data;
}
export async function syncThemes() {
    return (await api.post('/themes/sync')).data;
}
