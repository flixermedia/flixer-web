/** Backup creation, restoration, uploads, downloads, and passphrase operations. */
import { api } from './client';
export async function getBackupStatus() {
    const response = await api.get('/admin/backups');
    return response.data;
}
export async function createBackup() {
    const response = await api.post('/admin/backups');
    return response.data;
}
export async function restoreBackup(name, passphrase) {
    const response = await api.post(`/admin/backups/${encodeURIComponent(name)}/restore`, { passphrase: passphrase || undefined });
    return response.data;
}
export async function deleteBackup(name) {
    await api.delete(`/admin/backups/${encodeURIComponent(name)}`);
}
export async function uploadBackup(file, onProgress) {
    const body = new FormData();
    body.append('backup', file);
    const response = await api.post('/admin/backups/upload', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 0,
        onUploadProgress: (event) => onProgress?.(event.total ? event.loaded / event.total : 0),
    });
    return response.data;
}
export async function setBackupPassphrase(passphrase) {
    const request = { passphrase };
    await api.put('/admin/backups/passphrase', request);
}
export async function clearBackupPassphrase() {
    await api.delete('/admin/backups/passphrase');
}
/** A short-lived signed URL, so the browser streams the file to disk instead of holding it in memory. */
export async function getBackupDownloadUrl(name) {
    const response = await api.post(`/admin/backups/${encodeURIComponent(name)}/download-link`);
    return `${api.defaults.baseURL ?? ''}${response.data.path}`;
}
