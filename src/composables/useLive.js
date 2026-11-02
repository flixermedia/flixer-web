import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import { getAccessToken } from '../api';
import { buildApiWebSocketUrl } from '../platform/serverConnection';
const CLOSE_UNAUTHORIZED = 4401;
const CLOSE_FORBIDDEN = 4403;
const IDLE_CLOSE_MS = 5_000;
const MAX_BACKOFF_MS = 30_000;
function buildUrl() {
    return buildApiWebSocketUrl('/live');
}
/**
 * One WebSocket shared by every panel. Topics are subscribed while at least one component
 * wants them; the socket closes when nothing does and reconnects with backoff when it drops.
 */
class LiveConnection {
    status = ref('connecting');
    socket = null;
    ready = false;
    listeners = new Map();
    latest = new Map();
    retryTimer;
    idleTimer;
    attempts = 0;
    subscribe(topic, listener) {
        clearTimeout(this.idleTimer);
        let set = this.listeners.get(topic);
        if (!set) {
            set = new Set();
            this.listeners.set(topic, set);
            if (this.ready)
                this.send({ type: 'subscribe', topic });
        }
        set.add(listener);
        if (this.latest.has(topic))
            listener(this.latest.get(topic));
        if (!this.socket && !this.retryTimer)
            this.connect();
        return () => {
            set.delete(listener);
            if (set.size > 0)
                return;
            this.listeners.delete(topic);
            this.latest.delete(topic);
            if (this.ready)
                this.send({ type: 'unsubscribe', topic });
            if (this.listeners.size === 0)
                this.idleTimer = setTimeout(() => this.disconnect(), IDLE_CLOSE_MS);
        };
    }
    send(message) {
        if (this.socket?.readyState === WebSocket.OPEN)
            this.socket.send(JSON.stringify(message));
    }
    connect() {
        const token = getAccessToken();
        if (!token) {
            this.status.value = 'unauthorized';
            return;
        }
        this.status.value = 'connecting';
        const ws = new WebSocket(buildUrl());
        this.socket = ws;
        ws.onopen = () => ws.send(JSON.stringify({ type: 'auth', token }));
        ws.onmessage = (event) => {
            let message;
            try {
                message = JSON.parse(String(event.data));
            }
            catch {
                return;
            }
            if (message.type === 'ready') {
                this.ready = true;
                this.attempts = 0;
                this.status.value = 'live';
                for (const topic of this.listeners.keys())
                    this.send({ type: 'subscribe', topic });
            }
            else if (message.type === 'data' && message.topic) {
                this.latest.set(message.topic, message.data);
                this.listeners.get(message.topic)?.forEach((listener) => listener(message.data));
            }
        };
        ws.onclose = (event) => {
            if (this.socket !== ws)
                return;
            this.socket = null;
            this.ready = false;
            if (event.code === CLOSE_UNAUTHORIZED || event.code === CLOSE_FORBIDDEN) {
                this.status.value = 'unauthorized';
                return;
            }
            this.status.value = 'disconnected';
            if (this.listeners.size === 0)
                return;
            this.retryTimer = setTimeout(() => {
                this.retryTimer = undefined;
                if (this.listeners.size > 0)
                    this.connect();
            }, Math.min(MAX_BACKOFF_MS, 1000 * 2 ** this.attempts++));
        };
    }
    disconnect() {
        clearTimeout(this.retryTimer);
        this.retryTimer = undefined;
        const ws = this.socket;
        this.socket = null;
        this.ready = false;
        ws?.close();
    }
}
const connection = new LiveConnection();
/** Subscribes to a live topic for the lifetime of the calling component. */
export function useLiveTopic(topic) {
    const data = shallowRef(null);
    let unsubscribe;
    onMounted(() => {
        unsubscribe = connection.subscribe(topic, (value) => {
            data.value = value;
        });
    });
    onBeforeUnmount(() => unsubscribe?.());
    return { data, status: connection.status, set: (value) => (data.value = value) };
}
