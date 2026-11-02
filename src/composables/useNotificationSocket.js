import { AUTH_TOKEN_CHANGED_EVENT, getAccessToken } from '../api';
import { buildApiWebSocketUrl } from '../platform/serverConnection';
const CLOSE_UNAUTHORIZED = 4401;
const MAX_BACKOFF_MS = 15_000;
const listeners = new Set();
let socket = null;
let retryTimer;
let attempts = 0;
function connect() {
    const token = getAccessToken();
    if (!token || listeners.size === 0 || socket)
        return;
    const ws = new WebSocket(buildApiWebSocketUrl('/notifications/live'));
    socket = ws;
    ws.onopen = () => ws.send(JSON.stringify({ type: 'auth', token }));
    ws.onmessage = (event) => {
        let message;
        try {
            message = JSON.parse(String(event.data));
        }
        catch {
            return;
        }
        if (message.type === 'ready' || message.type === 'changed') {
            attempts = 0;
            for (const listener of listeners)
                listener();
        }
    };
    ws.onclose = (event) => {
        if (socket !== ws)
            return;
        socket = null;
        if (listeners.size === 0 || event.code === CLOSE_UNAUTHORIZED)
            return;
        retryTimer = setTimeout(connect, Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attempts++));
    };
    ws.onerror = () => ws.close();
}
function reconnectForTokenChange() {
    clearTimeout(retryTimer);
    retryTimer = undefined;
    const previous = socket;
    socket = null;
    previous?.close();
    attempts = 0;
    connect();
}
/** Subscribes to notification inbox changes; REST remains the source of notification data. */
export function onNotificationChange(listener) {
    listeners.add(listener);
    if (listeners.size === 1) {
        window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, reconnectForTokenChange);
        connect();
    }
    return () => {
        listeners.delete(listener);
        if (listeners.size > 0)
            return;
        window.removeEventListener(AUTH_TOKEN_CHANGED_EVENT, reconnectForTokenChange);
        clearTimeout(retryTimer);
        retryTimer = undefined;
        const previous = socket;
        socket = null;
        previous?.close();
        attempts = 0;
    };
}
