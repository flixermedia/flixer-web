/** Application update status and update actions. */
import { api } from './client';
export async function getUpdateStatus(refresh = false) {
    const response = await api.get('/admin/updates', { params: refresh ? { refresh: true } : undefined });
    return response.data;
}
export async function applyUpdates() {
    const response = await api.post('/admin/updates/apply');
    return response.data;
}
