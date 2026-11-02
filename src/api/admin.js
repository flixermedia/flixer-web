/** Administrative stream, user, API-key, and indexer operations. */
import { api, apiRequest } from './client';
export async function listAdminScheduledTasks() {
    const response = await apiRequest({ method: 'GET', url: '/admin/scheduled-tasks' });
    return response.data.tasks;
}
export async function saveAdminScheduledTaskSchedule(id, schedule) {
    await apiRequest({ method: 'PUT', url: `/admin/scheduled-tasks/${encodeURIComponent(id)}`, data: schedule });
}
export async function runAdminScheduledTask(id) {
    await apiRequest({ method: 'POST', url: `/admin/scheduled-tasks/${encodeURIComponent(id)}/run` });
}
export async function stopAdminScheduledTask(id) {
    await apiRequest({ method: 'POST', url: `/admin/scheduled-tasks/${encodeURIComponent(id)}/stop` });
}
export async function listStreamSessions() {
    const response = await api.get('/admin/streams');
    return response.data;
}
export async function cancelStreamSession(id) {
    await api.delete(`/admin/streams/${encodeURIComponent(id)}`);
}
export async function getAdminActivity(filters) {
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== undefined && value !== ''));
    const response = await api.get('/admin/overview/activity', { params });
    return response.data;
}
export async function getAdminOverview() {
    const response = await api.get('/admin/overview');
    return response.data;
}
export async function listDevices() {
    const response = await api.get('/admin/devices');
    return response.data;
}
export async function signOutDevice(id) {
    await api.delete(`/admin/devices/${encodeURIComponent(id)}`);
}
export async function listAdminUsers() {
    const response = await api.get('/admin/users');
    return response.data;
}
export async function createAdminUser(user) {
    const response = await api.post('/admin/users', user);
    return response.data;
}
export async function updateAdminUser(id, changes) {
    const response = await api.patch(`/admin/users/${encodeURIComponent(id)}`, changes);
    return response.data;
}
export async function setAdminUserAvatar(id, file) {
    const body = new FormData();
    body.append('avatar', file);
    const response = await api.post(`/admin/users/${encodeURIComponent(id)}/avatar`, body, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
}
export async function removeAdminUserAvatar(id) {
    const response = await api.delete(`/admin/users/${encodeURIComponent(id)}/avatar`);
    return response.data;
}
export async function setAdminUserPassword(id, password) {
    const request = { password };
    await api.put(`/admin/users/${encodeURIComponent(id)}/password`, request);
}
export async function revokeAdminUserSessions(id) {
    const response = await api.delete(`/admin/users/${encodeURIComponent(id)}/sessions`);
    return response.data;
}
export async function deleteAdminUser(id) {
    await api.delete(`/admin/users/${encodeURIComponent(id)}`);
}
export async function listApiKeys() {
    const response = await api.get('/admin/api-keys');
    return response.data;
}
export async function createApiKey(name) {
    const request = { name };
    const response = await api.post('/admin/api-keys', request);
    return response.data;
}
export async function revokeApiKey(id) {
    await api.delete(`/admin/api-keys/${encodeURIComponent(id)}`);
}
export async function getMediaSearchAdminStatus() {
    const response = await apiRequest({ method: 'GET', url: '/admin/search/status' });
    return response.data;
}
export async function getMediaSearchTask(uid) {
    const response = await apiRequest({
        method: 'GET',
        url: `/admin/search/tasks/${encodeURIComponent(uid)}`,
    });
    return response.data;
}
export async function saveMediaSearchAdminSettings(settings) {
    const response = await apiRequest({
        method: 'PUT',
        url: '/admin/search/settings',
        data: {
            enabled: settings.enabled,
            url: settings.customUrl,
        },
    });
    return response.data;
}
export async function rebuildMediaSearchIndex() {
    const response = await apiRequest({ method: 'POST', url: '/admin/search/rebuild' });
    return response.data;
}
export async function resetMediaSearchIndex() {
    const response = await apiRequest({ method: 'POST', url: '/admin/search/reset' });
    return response.data;
}
export async function getDatabaseTransferStatus() {
    const response = await apiRequest({ method: 'GET', url: '/admin/database-transfer' });
    return response.data;
}
export async function startDatabaseTransfer(databaseUrl, replaceTarget = false) {
    const response = await apiRequest({
        method: 'POST',
        url: '/admin/database-transfer',
        data: { databaseUrl, replaceTarget },
    });
    return response.data;
}
export async function restoreDatabaseSourceWrites() {
    const response = await apiRequest({
        method: 'POST',
        url: '/admin/database-transfer/restore-writes',
    });
    return response.data;
}
export const INDEXER_QUEUES = ['scan', 'identify', 'metadata', 'images', 'probe', 'refresh', 'trickplay', 'themes', 'lyrics', 'intro-movies', 'intro-episodes'];
export const INDEXER_TASK_QUEUES = [...INDEXER_QUEUES, 'identify-priority', 'metadata-priority', 'images-priority', 'probe-priority', 'refresh-priority'];
export const INDEXER_TASK_STATES = ['pending', 'active', 'scheduled', 'retry', 'archived', 'completed'];
function isIndexerTaskQueue(queue) {
    return INDEXER_TASK_QUEUES.some((knownQueue) => knownQueue === queue);
}
export async function getIndexerStatus() {
    const response = await api.get('/admin/indexer/status');
    return response.data;
}
export async function scanMediaLibrary(id, force = false, trickplayOnly = false, jobs = []) {
    const request = { force, trickplayOnly, ...(jobs.length ? { jobs } : {}) };
    await api.post(`/admin/indexer/libraries/${encodeURIComponent(id)}/scan`, request);
}
export async function queueLibrarySegments(id, type) {
    const response = await api.post(`/admin/indexer/libraries/${encodeURIComponent(id)}/segments`, { type });
    return response.data;
}
export async function syncLibraryThemes(id) {
    const response = await api.post('/themes/sync', { libraryId: id });
    return response.data;
}
export async function listIndexerTasks(queue, state, page = 1, size = 20) {
    const params = { queue, state, page, size };
    const response = await api.get('/admin/indexer/tasks', { params });
    return (response.data.tasks ?? []).map((task) => {
        if (!isIndexerTaskQueue(task.queue))
            throw new Error(`Unknown indexer task queue "${task.queue}".`);
        return { ...task, queue: task.queue };
    });
}
export async function getIndexerTaskLogs(queue, id, offset = 0) {
    const params = { offset };
    const response = await api.get(`/admin/indexer/tasks/${queue}/${encodeURIComponent(id)}/logs`, { params });
    return response.data;
}
export async function cancelIndexerTask(queue, id) {
    await api.post(`/admin/indexer/tasks/${queue}/${encodeURIComponent(id)}/cancel`);
}
export async function retryIndexerTask(queue, id) {
    await api.post(`/admin/indexer/tasks/${queue}/${encodeURIComponent(id)}/retry`);
}
export async function clearFailedIndexerTasks(queue) {
    const response = await api.post(`/admin/indexer/queues/${queue}/clear-failed`);
    return response.data.cleared ?? 0;
}
export async function clearAllFailedIndexerTasks() {
    const cleared = await Promise.all(INDEXER_TASK_QUEUES.map((queue) => clearFailedIndexerTasks(queue)));
    return cleared.reduce((total, count) => total + count, 0);
}
export async function cancelActiveIndexerTasks(queue) {
    const response = await api.post(`/admin/indexer/queues/${queue}/cancel-active`);
    return response.data.cancelled ?? 0;
}
export async function setIndexerQueuePaused(queue, paused) {
    await api.post(`/admin/indexer/queues/${queue}/${paused ? 'pause' : 'resume'}`);
}
export async function setIndexerConcurrency(concurrency) {
    const response = await api.put('/admin/indexer/concurrency', concurrency);
    return response.data;
}
