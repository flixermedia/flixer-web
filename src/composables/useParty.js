import { computed, ref, shallowRef, watch } from 'vue';
import { openModal } from '@kolirt/vue-modal';
import { createParty, endParty, getAccessToken } from '../api';
import PartyVisibilityModal from '../components/party/PartyVisibilityModal.vue';
import { i18n } from '../i18n';
import { notify } from './notify';
import { expectedPosition } from './partyClock';
import { useAudioPlayer } from './useAudioPlayer';
import { useProfile } from './useProfile';
import { useVideoOverlay } from './useVideoOverlay';
import { buildApiWebSocketUrl } from '../platform/serverConnection';
export { expectedPosition };
const STORAGE_KEY = 'flixer.party';
const CLOSE_UNAUTHORIZED = 4401;
const CLOCK_SYNC_MS = 5_000;
const MAX_BACKOFF_MS = 15_000;
const party = shallowRef(null);
const latest = shallowRef(null);
const status = ref('idle');
const messages = shallowRef([]);
const chatOpen = ref(false);
const unread = ref(0);
const MAX_CHAT_KEPT = 200;
const audio = useAudioPlayer();
const videoOverlay = useVideoOverlay();
const { profile, load: loadProfile } = useProfile();
const isHost = computed(() => !!party.value && !!profile.value && party.value.host.id === profile.value.id);
const isGuest = computed(() => !!party.value && !isHost.value);
let socket = null;
let wantedId = null;
let retryTimer;
let attempts = 0;
let clockSyncTimer;
let clockOffset = 0;
let bestClockRtt = Number.POSITIVE_INFINITY;
let nextPingId = 0;
const pendingPings = new Map();
// The guest only reopens the player when the host moves to something new, so closing it is respected.
let appliedItemId = null;
let applyingAudioItemId = null;
function buildUrl() {
    return buildApiWebSocketUrl('/party');
}
function t(key, values) {
    return i18n.global.t(key, values ?? {});
}
function send(message) {
    if (socket?.readyState === WebSocket.OPEN)
        socket.send(JSON.stringify(message));
}
function reset() {
    wantedId = null;
    clearTimeout(retryTimer);
    clearInterval(clockSyncTimer);
    clockSyncTimer = undefined;
    pendingPings.clear();
    retryTimer = undefined;
    const ws = socket;
    socket = null;
    ws?.close();
    party.value = null;
    latest.value = null;
    messages.value = [];
    unread.value = 0;
    chatOpen.value = false;
    status.value = 'idle';
    appliedItemId = null;
    applyingAudioItemId = null;
    audio.correctPartyDrift(audio.currentTime.value);
    attempts = 0;
    sessionStorage.removeItem(STORAGE_KEY);
}
function toQueueTrack(item) {
    return {
        id: item.id,
        title: item.title,
        artist: item.subtitle,
        artistId: null,
        album: null,
        albumId: null,
        art: item.imageIndex === null ? null : { itemId: item.imageItemId, index: item.imageIndex, version: item.imageUpdatedAt },
    };
}
function applyVideo(state) {
    const { item } = state.party;
    if (audio.queue.value.length > 0)
        audio.stop();
    if (appliedItemId === item.id)
        return;
    appliedItemId = item.id;
    videoOverlay.play({
        id: item.id,
        title: item.subtitle ? `${item.title} · ${item.subtitle}` : item.title,
        startAt: expectedPosition(state),
        autoplay: state.party.playing,
    });
}
function applyAudio(state) {
    const { item, playing } = state.party;
    if (videoOverlay.playing.value)
        videoOverlay.close();
    if (audio.current.value?.id !== item.id) {
        if (applyingAudioItemId === item.id)
            return;
        appliedItemId = item.id;
        applyingAudioItemId = item.id;
        void audio
            .applyPartyPlayback(toQueueTrack(item), expectedPosition(state), playing)
            .catch((error) => notify.error(error instanceof Error ? error.message : t('party.joinFailed')))
            .finally(() => {
            if (applyingAudioItemId === item.id)
                applyingAudioItemId = null;
        });
        return;
    }
    appliedItemId = item.id;
    if (audio.isLoading.value)
        return;
    audio.correctPartyDrift(expectedPosition(state));
    if (playing !== audio.isPlaying.value) {
        void audio.applyPartyPlayback(toQueueTrack(item), expectedPosition(state), playing).catch((error) => notify.error(error instanceof Error ? error.message : t('party.joinFailed')));
    }
}
function applyState() {
    const state = latest.value;
    if (!state || !party.value)
        return;
    if (state.party.kind === 'video')
        applyVideo(state);
    else
        applyAudio(state);
}
function handleEnded() {
    if (!wantedId)
        return;
    const wasHost = isHost.value;
    const kind = party.value?.kind;
    reset();
    if (wasHost)
        return;
    // Guests only watch or listen because of the party, so ending it takes them out of the player.
    if (kind === 'video')
        videoOverlay.close();
    else if (kind === 'music')
        audio.stop();
    notify.info(t('party.ended'));
}
function connect(onFirstState, onFailure) {
    const token = getAccessToken();
    if (!token || !wantedId) {
        onFailure?.(t('party.signIn'));
        return;
    }
    const ws = new WebSocket(buildUrl());
    socket = ws;
    pendingPings.clear();
    bestClockRtt = Number.POSITIVE_INFINITY;
    let settled = !onFirstState;
    const fail = (message) => {
        if (settled)
            return;
        settled = true;
        onFailure?.(message);
    };
    ws.onopen = () => {
        if (socket === ws)
            ws.send(JSON.stringify({ type: 'auth', token }));
    };
    ws.onmessage = (event) => {
        if (socket !== ws)
            return;
        let message;
        try {
            message = JSON.parse(String(event.data));
        }
        catch {
            return;
        }
        if (message.type === 'ready') {
            ws.send(JSON.stringify({ type: 'join', partyId: wantedId }));
            sendTimePing();
        }
        else if (message.type === 'state' && message.party && typeof message.serverTime === 'number') {
            if (party.value?.id === message.party.id && message.party.version < party.value.version)
                return;
            status.value = 'live';
            attempts = 0;
            party.value = message.party;
            if (!Number.isFinite(bestClockRtt))
                clockOffset = message.serverTime - Date.now();
            latest.value = {
                party: message.party,
                offset: clockOffset,
                serverTimeAtReceipt: Date.now() + clockOffset,
                localMonotonicAtReceipt: performance.now(),
            };
            if (wantedId)
                sessionStorage.setItem(STORAGE_KEY, wantedId);
            applyState();
            if (!settled) {
                settled = true;
                onFirstState?.(message.party);
            }
        }
        else if (message.type === 'chat-history' && Array.isArray(message.messages)) {
            messages.value = message.messages;
        }
        else if (message.type === 'chat' && typeof message.message === 'object') {
            receiveChat(message.message);
        }
        else if (message.type === 'time-pong' && typeof message.requestId === 'string' && typeof message.serverReceivedAt === 'number' && typeof message.serverSentAt === 'number') {
            const sample = pendingPings.get(message.requestId);
            pendingPings.delete(message.requestId);
            if (!sample)
                return;
            const rtt = performance.now() - sample.monotonicTime;
            if (rtt < bestClockRtt) {
                bestClockRtt = rtt;
                const serverMidpoint = (message.serverReceivedAt + message.serverSentAt) / 2;
                const localMidpoint = sample.wallTime + rtt / 2;
                clockOffset = serverMidpoint - localMidpoint;
                if (latest.value) {
                    latest.value = {
                        ...latest.value,
                        offset: clockOffset,
                        serverTimeAtReceipt: Date.now() + clockOffset,
                        localMonotonicAtReceipt: performance.now(),
                    };
                    applyState();
                }
            }
        }
        else if (message.type === 'ended') {
            handleEnded();
        }
        else if (message.type === 'error') {
            if (!settled) {
                fail(typeof message.message === 'string' ? message.message : t('party.joinFailed'));
                reset();
            }
            else if (message.status === 404) {
                handleEnded();
            }
            else if (message.status === 429 && typeof message.message === 'string') {
                notify.error(message.message);
            }
            if (latest.value)
                applyState();
        }
    };
    ws.onclose = (event) => {
        if (socket !== ws)
            return;
        socket = null;
        if (!wantedId)
            return;
        if (event.code === CLOSE_UNAUTHORIZED || !settled) {
            fail(t('party.joinFailed'));
            reset();
            return;
        }
        status.value = 'reconnecting';
        retryTimer = setTimeout(() => connect(), Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attempts++));
    };
}
function open(id) {
    if (wantedId)
        reset();
    wantedId = id;
    status.value = 'connecting';
    return new Promise((resolve, reject) => connect(resolve, (message) => reject(new Error(message))));
}
function receiveChat(message) {
    if (messages.value.some((existing) => existing.id === message.id))
        return;
    messages.value = [...messages.value, message].slice(-MAX_CHAT_KEPT);
    if (!chatOpen.value && message.from.id !== profile.value?.id)
        unread.value++;
}
function sendChat(text) {
    const trimmed = text.trim();
    if (trimmed)
        send({ type: 'chat', text: trimmed });
}
function setChatOpen(open) {
    chatOpen.value = open;
    if (open)
        unread.value = 0;
}
function sendCommand(action, values = {}) {
    if (!isHost.value)
        return false;
    if (socket?.readyState !== WebSocket.OPEN) {
        notify.info(t('party.reconnecting'));
        return false;
    }
    send({ type: 'command', commandId: crypto.randomUUID(), action, ...values });
    return true;
}
function sendVideoCommand(state, itemId) {
    return sendCommand(state.action, { itemId, ...(state.action === 'seek' ? { position: state.position } : {}) });
}
function sendTimePing() {
    if (socket?.readyState !== WebSocket.OPEN)
        return;
    const requestId = `${++nextPingId}`;
    const wallTime = Date.now();
    pendingPings.set(requestId, { wallTime, monotonicTime: performance.now() });
    send({ type: 'time-ping', requestId });
}
audio.setPartyControlHandler((command) => {
    if (party.value?.kind !== 'music')
        return false;
    if (!isHost.value) {
        const state = latest.value;
        if (state?.party.kind === 'music') {
            void audio.applyPartyPlayback(toQueueTrack(state.party.item), expectedPosition(state), state.party.playing).catch((error) => notify.error(error instanceof Error ? error.message : t('party.joinFailed')));
        }
        return true;
    }
    sendCommand(command.action, {
        ...(command.action === 'change-item' ? { itemId: command.itemId } : {}),
        ...(command.action === 'seek' ? { position: command.position } : {}),
    });
    return true;
});
watch([audio.isLoading, audio.duration], applyState);
watch(() => party.value?.id, (id) => {
    clearInterval(clockSyncTimer);
    pendingPings.clear();
    bestClockRtt = Number.POSITIVE_INFINITY;
    if (!id) {
        clockSyncTimer = undefined;
        return;
    }
    sendTimePing();
    clockSyncTimer = setInterval(sendTimePing, CLOCK_SYNC_MS);
});
watch(() => audio.current.value, (track, previous) => {
    if (track || !previous || !isHost.value || party.value?.kind !== 'music')
        return;
    void leaveParty();
});
/** Guests leave the party; the host ends it for everyone. */
async function leaveParty() {
    const current = party.value;
    const hosting = isHost.value;
    if (!hosting)
        send({ type: 'leave' });
    reset();
    if (current && hosting) {
        await endParty(current.id).catch((error) => {
            notify.error(error instanceof Error ? error.message : t('party.joinFailed'));
        });
    }
}
export function useParty() {
    async function start(itemId) {
        const visibility = await openModal(PartyVisibilityModal).catch(() => null);
        if (!visibility)
            return null;
        await loadProfile();
        if (wantedId)
            await leave();
        const activeTrack = audio.current.value?.id === itemId ? audio.current.value : null;
        const initialMusic = activeTrack ? { position: audio.currentTime.value, playing: audio.isPlaying.value } : null;
        const created = await createParty(itemId, visibility);
        const joined = await open(created.id);
        if (created.kind === 'music' && activeTrack && initialMusic) {
            sendCommand('seek', { itemId: activeTrack.id, position: initialMusic.position });
            if (initialMusic.playing)
                sendCommand('play', { itemId: activeTrack.id });
        }
        return joined;
    }
    async function join(id) {
        await loadProfile();
        if (party.value?.id === id)
            return party.value;
        if (wantedId)
            await leave();
        return open(id);
    }
    const leave = leaveParty;
    async function resume() {
        const id = sessionStorage.getItem(STORAGE_KEY);
        if (!id || wantedId)
            return;
        await loadProfile();
        await open(id).catch(() => undefined);
    }
    function reconnect() {
        if (!wantedId) {
            void resume();
            return;
        }
        clearTimeout(retryTimer);
        retryTimer = undefined;
        const previousSocket = socket;
        socket = null;
        previousSocket?.close();
        status.value = 'reconnecting';
        connect();
    }
    function inviteLink(id = party.value?.id) {
        return `${location.origin}/party/${id ?? ''}`;
    }
    return { party, latest, status, messages, chatOpen, unread, sendChat, setChatOpen, isHost, isGuest, start, join, leave, resume, reconnect, sendVideoCommand, inviteLink, expectedPosition };
}
