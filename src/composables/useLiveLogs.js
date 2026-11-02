import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import { getAccessToken } from '../api';
import { buildApiWebSocketUrl } from '../platform/serverConnection';
const MAX_ENTRIES = 1000;
function buildUrl() {
    return buildApiWebSocketUrl('/logs/stream');
}
/** Streams backend logs over a WebSocket, reconnecting with backoff. */
export function useLiveLogs() {
    const entries = shallowRef([]);
    const status = ref('connecting');
    const paused = ref(false);
    let socket = null;
    let retryTimer;
    let attempts = 0;
    let stopped = false;
    let pending = [];
    function append(items) {
        if (paused.value) {
            pending = pending.concat(items).slice(-MAX_ENTRIES);
            return;
        }
        entries.value = entries.value.concat(items).slice(-MAX_ENTRIES);
    }
    function connect() {
        if (stopped)
            return;
        status.value = 'connecting';
        const token = getAccessToken();
        if (!token) {
            status.value = 'unauthorized';
            return;
        }
        const ws = new WebSocket(buildUrl());
        socket = ws;
        ws.onopen = () => ws.send(JSON.stringify({ type: 'auth', token }));
        ws.onmessage = (event) => {
            let msg;
            try {
                msg = JSON.parse(String(event.data));
            }
            catch {
                return;
            }
            if (msg.type === 'snapshot') {
                status.value = 'live';
                attempts = 0;
                pending = [];
                entries.value = (msg.entries ?? []).slice(-MAX_ENTRIES);
            }
            else if (msg.type === 'log' && msg.entry) {
                append([msg.entry]);
            }
        };
        ws.onclose = (event) => {
            if (socket !== ws)
                return;
            socket = null;
            if (event.code === 4401 || event.code === 4403) {
                status.value = 'unauthorized';
                return;
            }
            status.value = 'disconnected';
            if (stopped)
                return;
            const delay = Math.min(30000, 1000 * 2 ** attempts++);
            retryTimer = setTimeout(connect, delay);
        };
    }
    function pause() {
        paused.value = true;
    }
    function resume() {
        paused.value = false;
        if (pending.length) {
            entries.value = entries.value.concat(pending).slice(-MAX_ENTRIES);
            pending = [];
        }
    }
    function clear() {
        entries.value = [];
        pending = [];
    }
    onMounted(connect);
    onBeforeUnmount(() => {
        stopped = true;
        clearTimeout(retryTimer);
        socket?.close();
    });
    return { entries, status, paused, pause, resume, clear };
}
