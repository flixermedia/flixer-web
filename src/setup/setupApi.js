import axios from 'axios';
import { api } from '../api';
import { catchError } from '../utils/catchError';
const RECOVERY_KEY = 'flixer:setup-recovery-code';
/** Kept in this tab only: the code unlocks reconnecting the database, so it should not outlive the session. */
export function storedRecoveryCode() {
    try {
        return sessionStorage.getItem(RECOVERY_KEY) ?? '';
    }
    catch {
        return '';
    }
}
export function storeRecoveryCode(code) {
    try {
        sessionStorage.setItem(RECOVERY_KEY, code.trim());
    }
    catch {
        // Without storage the code has to be entered again after a reload.
    }
}
export function clearRecoveryCode() {
    try {
        sessionStorage.removeItem(RECOVERY_KEY);
    }
    catch {
        // Nothing to clear.
    }
}
function recoveryHeaders() {
    const code = storedRecoveryCode();
    return code ? { headers: { 'x-setup-recovery-code': code } } : {};
}
const STATES = ['not_started', 'in_progress', 'completed', 'recovery_required'];
function parseStatus(data) {
    if (typeof data !== 'object' || data === null)
        return null;
    const value = data;
    if (!STATES.includes(value.state))
        return null;
    if (value.mode !== 'bootstrap' && value.mode !== 'ready')
        return null;
    if (value.database !== 'ok' && value.database !== 'unconfigured' && value.database !== 'unavailable')
        return null;
    return { state: value.state, mode: value.mode, database: value.database, persistent: value.persistent === true };
}
/** Pure so it can be reasoned about on its own: a failed or malformed response never produces `setup`. */
export function classifyStatus(status) {
    if (!status)
        return { kind: 'unavailable', reason: 'invalid' };
    if (status.state === 'completed') {
        return status.mode === 'ready' && status.database === 'ok' ? { kind: 'ready' } : { kind: 'unavailable', reason: 'starting' };
    }
    return { kind: 'setup', status };
}
export async function fetchSetupGate() {
    const [error, response] = await catchError(api.get('/setup/status', { timeout: 6000 }));
    if (error) {
        // An API that predates the wizard has no such route; it is already configured, not waiting for setup.
        if (axios.isAxiosError(error) && error.response?.status === 404)
            return { kind: 'ready' };
        return { kind: 'unavailable', reason: 'unreachable' };
    }
    return classifyStatus(parseStatus(response.data));
}
export async function getProgress() {
    return (await api.get('/setup/progress', { timeout: 10_000, ...recoveryHeaders() })).data;
}
export async function setFlow(flow) {
    const request = { flow };
    await api.post('/setup/flow', request, recoveryHeaders());
}
export async function testStep(id, values) {
    return (await api.post(`/setup/steps/${id}/test`, values, { timeout: 20_000, ...recoveryHeaders() })).data;
}
export async function applyStep(id, values) {
    return (await api.post(`/setup/steps/${id}`, values, { timeout: 20_000, ...recoveryHeaders() })).data;
}
/** Asks the server to write the setup recovery key to its log. The key is never returned here. */
export async function requestRecoveryKey() {
    await api.post('/setup/recovery/request', {}, { timeout: 10_000 });
}
export async function completeSetup() {
    await api.post('/setup/complete', {}, recoveryHeaders());
}
export function describeFailure(error, fallback) {
    if (axios.isAxiosError(error)) {
        const body = error.response?.data;
        const fields = body?.fields && typeof body.fields === 'object' ? body.fields : {};
        const message = typeof body?.error === 'string' ? body.error : typeof body?.message === 'string' ? body.message : fallback;
        return { message, fields };
    }
    return { message: fallback, fields: {} };
}
