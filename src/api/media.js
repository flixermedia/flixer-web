/** Media-library browsing, item metadata, artwork, and network-share operations. */
import { api } from './client';
export const MEDIA_ITEM_TYPES = ['movie', 'series', 'season', 'episode', 'album', 'track', 'video'];
export const MEDIA_IMAGE_TYPES = ['poster', 'backdrop', 'logo', 'banner', 'thumb', 'disc'];
export async function listMediaItems(query) {
    const response = await api.get('/admin/media/items', { params: query });
    return response.data;
}
export async function getMediaItem(id) {
    const response = await api.get(`/admin/media/items/${encodeURIComponent(id)}`);
    return response.data;
}
export async function updateMediaItem(id, changes) {
    const response = await api.patch(`/admin/media/items/${encodeURIComponent(id)}`, changes);
    return response.data;
}
export async function refreshMediaItem(id, priority = false) {
    const body = { priority };
    const response = await api.post(`/admin/media/items/${encodeURIComponent(id)}/refresh`, body);
    return response.data;
}
export async function deleteMediaItem(id) {
    await api.delete(`/admin/media/items/${encodeURIComponent(id)}`);
}
/** Images need the admin token, so they are fetched as blobs instead of used as plain img sources. */
export async function fetchMediaImage(id, index, width, version) {
    const params = {
        ...(width ? { w: width } : {}),
        ...(version ? { v: version } : {}),
    };
    const response = await api.get(`/admin/media/items/${encodeURIComponent(id)}/images/${index}`, { params, responseType: 'blob' });
    return response.data;
}
export async function addMediaItemImage(id, type, file) {
    const body = new FormData();
    body.append('image', file);
    const params = { type };
    const response = await api.post(`/admin/media/items/${encodeURIComponent(id)}/images`, body, {
        params,
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
}
export async function removeMediaItemImage(id, index) {
    const response = await api.delete(`/admin/media/items/${encodeURIComponent(id)}/images/${index}`);
    return response.data;
}
export async function listItemSubtitles(id) {
    const response = await api.get(`/admin/media/items/${encodeURIComponent(id)}/subtitles`);
    return response.data;
}
export async function searchItemSubtitles(id, options = {}) {
    const response = await api.post(`/admin/media/items/${encodeURIComponent(id)}/subtitles/search`, options, { timeout: 70_000 });
    return response.data.results;
}
export async function downloadItemSubtitle(id, fileId, language) {
    const request = { fileId, language };
    await api.post(`/admin/media/items/${encodeURIComponent(id)}/subtitles/download`, request, { timeout: 70_000 });
}
export async function deleteItemSubtitle(id, file) {
    const params = { file };
    await api.delete(`/admin/media/items/${encodeURIComponent(id)}/subtitles`, { params });
}
export async function getHomeContent() {
    const response = await api.get('/media/home');
    return response.data;
}
export async function getWatchProgress(itemId) {
    const response = await api.get(`/media/items/${encodeURIComponent(itemId)}/progress`);
    return response.data;
}
export async function setItemWatched(itemId, watched) {
    const request = { watched };
    await api.put(`/media/items/${encodeURIComponent(itemId)}/watched`, request);
}
export async function saveWatchProgress(itemId, positionSeconds, durationSeconds) {
    const request = { positionSeconds: Math.floor(positionSeconds), durationSeconds: Math.floor(durationSeconds) };
    await api.put(`/media/items/${encodeURIComponent(itemId)}/progress`, request);
}
export async function searchMedia(query, filters = {}, signal) {
    const params = { q: query, ...filters };
    const response = await api.get('/media/search', { params, signal });
    return response.data;
}
export async function getSearchGenres() {
    const response = await api.get('/media/search/genres');
    return response.data;
}
export async function browseMedia(kind, sort, offset, signal) {
    const params = { sort, offset, limit: 48 };
    const response = await api.get(`/media/browse/${kind}`, { params, signal });
    return response.data;
}
export async function fetchPersonImage(id, width) {
    const params = width ? { w: width } : {};
    const response = await api.get(`/media/people/${encodeURIComponent(id)}/image`, { params, responseType: 'blob' });
    return response.data;
}
export async function getPerson(id, signal) {
    const response = await api.get(`/media/people/${encodeURIComponent(id)}`, { signal });
    return response.data;
}
export async function getItemDetail(id) {
    const response = await api.get(`/media/items/${encodeURIComponent(id)}`);
    return response.data;
}
/** Artwork for any signed-in user, fetched as a blob because it needs the Bearer token. */
/** `version` only busts the browser's cache when an item changes; the server ignores it. */
export async function fetchHomeImage(id, index, width, version) {
    const params = {
        ...(width ? { w: width } : {}),
        ...(version ? { v: version } : {}),
    };
    const response = await api.get(`/media/items/${encodeURIComponent(id)}/images/${index}`, { params, responseType: 'blob' });
    return response.data;
}
export const INDEXER_PROVIDERS = [
    { id: 'tmdb', keyed: true, optionalKey: false },
    { id: 'tvdb', keyed: true, optionalKey: false },
    { id: 'omdb', keyed: true, optionalKey: false },
    { id: 'fanart', keyed: true, optionalKey: false },
    { id: 'audiodb', keyed: true, optionalKey: false },
    { id: 'discogs', keyed: true, optionalKey: false },
    { id: 'anidb', keyed: true, optionalKey: false },
    { id: 'musicbrainz', keyed: false, optionalKey: false },
    { id: 'anilist', keyed: false, optionalKey: false },
    { id: 'theintrodb', keyed: false, optionalKey: true },
    { id: 'introdb', keyed: false, optionalKey: false },
];
export async function listMediaLibraries() {
    const response = await api.get('/admin/media-libraries');
    return response.data;
}
export async function listMediaRoots() {
    const response = await api.get('/admin/media-libraries/roots');
    return response.data;
}
export async function browseMediaFolders(rootId, path) {
    const params = { rootId, path };
    const response = await api.get('/admin/media-libraries/browse', { params });
    return response.data;
}
export async function createMediaLibrary(library) {
    const response = await api.post('/admin/media-libraries', library);
    return response.data;
}
export async function updateMediaLibrary(id, changes) {
    const response = await api.patch(`/admin/media-libraries/${encodeURIComponent(id)}`, changes);
    return response.data;
}
export async function deleteMediaLibrary(id) {
    await api.delete(`/admin/media-libraries/${encodeURIComponent(id)}`);
}
export async function getNetworkShareSupport() {
    const response = await api.get('/admin/network-shares/support');
    return response.data;
}
export async function listNetworkShares() {
    const response = await api.get('/admin/network-shares');
    return response.data;
}
export async function createNetworkShare(share) {
    const response = await api.post('/admin/network-shares', share);
    return response.data;
}
export async function updateNetworkShare(id, changes) {
    const response = await api.patch(`/admin/network-shares/${encodeURIComponent(id)}`, changes);
    return response.data;
}
export async function reconnectNetworkShare(id) {
    const response = await api.post(`/admin/network-shares/${encodeURIComponent(id)}/reconnect`);
    return response.data;
}
export async function deleteNetworkShare(id) {
    await api.delete(`/admin/network-shares/${encodeURIComponent(id)}`);
}
