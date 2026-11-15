import { computed, readonly, ref } from "vue";
import { AUTH_TOKEN_CHANGED_EVENT, getAccessToken } from "../api";
import { buildApiWebSocketUrl } from "../platform/serverConnection";

export interface RemotePlaybackState {
	kind: "audio" | "video";
	title: string;
	subtitle?: string;
	itemId?: string;
	playing: boolean;
	position: number;
	duration: number;
	volume?: number;
	muted?: boolean;
	audioTracks?: Array<{ id: string; label: string }>;
	audioTrackIndex?: number | null;
	subtitles?: Array<{ id: string; label: string }>;
	subtitleId?: string;
	chapters?: Array<{ start: number; title: string }>;
	segments?: Array<{ start: number; end: number; type: string }>;
	trickplay?: {
		manifest: { intervalMs: number; thumbWidth: number; thumbHeight: number; columns: number; rows: number; count: number; sheets: number };
	};
}

export interface RemotePlaybackDevice {
	clientId: string;
	deviceName: string;
	player?: RemotePlaybackState;
	updatedAt: number;
}

export type RemoteCastItem = { kind: "video"; itemId: string; title: string; startAt?: number } | { kind: "audio"; tracks: Array<{ id: string; title: string; artist: string | null; artistId: string | null; album: string | null; albumId: string | null; art: { itemId: string; index: number; version?: string } | null }>; startIndex: number };

export type RemotePlaybackCommand = { action: "play" | "pause" } | { action: "seek"; position: number } | { action: "volume"; volume: number; muted: boolean } | { action: "audio-track"; index: number } | { action: "subtitle"; id: string } | { action: "skip" } | { action: "play-item"; item: RemoteCastItem };
type ConnectionStatus = "offline" | "connecting" | "connected" | "reconnecting";
type CommandHandler = (command: RemotePlaybackCommand) => boolean | Promise<boolean>;
type PreviewHandler = (position: number) => Promise<string | null>;

const clientId = getClientId();
const devices = ref<RemotePlaybackDevice[]>([]);
const status = ref<ConnectionStatus>("offline");
const handlers = new Set<CommandHandler>();
const previewHandlers = new Set<PreviewHandler>();
const previewListeners = new Set<(requestId: string, dataUrl: string) => void>();
let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
let attempts = 0;
let started = false;
let desiredState: RemotePlaybackState | null = null;

function getClientId(): string {
	const key = "flixer.remoteClientId";
	let value = sessionStorage.getItem(key);
	if (!value) {
		value = crypto.randomUUID();
		sessionStorage.setItem(key, value);
	}
	return value;
}

function deviceName(): string {
	const platform = navigator.platform || "Device";
	const agent = navigator.userAgent;
	const browser = /Edg\//.test(agent) ? "Edge" : /Firefox\//.test(agent) ? "Firefox" : /Chrome\//.test(agent) ? "Chrome" : /Safari\//.test(agent) ? "Safari" : "Browser";
	return `${platform} ${browser}`.slice(0, 64);
}

function send(message: unknown): boolean {
	if (socket?.readyState !== WebSocket.OPEN) return false;
	socket.send(JSON.stringify(message));
	return true;
}

function publishCurrentState(): void {
	send({ type: "state", clientId, deviceName: deviceName(), player: desiredState });
}

function connect(): void {
	const token = getAccessToken();
	if (!started || !token || socket?.readyState === WebSocket.CONNECTING || socket?.readyState === WebSocket.OPEN) return;
	status.value = attempts ? "reconnecting" : "connecting";
	const ws = new WebSocket(buildApiWebSocketUrl("/playback/remote"));
	socket = ws;
	ws.addEventListener("open", () => {
		if (socket !== ws) return ws.close();
		ws.send(JSON.stringify({ type: "auth", token }));
	});
	ws.addEventListener("message", async (event) => {
		if (socket !== ws || typeof event.data !== "string") return;
		let message: Record<string, unknown>;
		try {
			message = JSON.parse(event.data) as Record<string, unknown>;
		} catch {
			return;
		}
		if (message.type === "ready") {
			status.value = "connected";
			attempts = 0;
			publishCurrentState();
		} else if (message.type === "devices" && Array.isArray(message.devices)) {
			devices.value = message.devices.filter(isRemoteDevice);
		} else if (message.type === "command") {
			const command = parseCommand(message.command);
			if (!command) return;
			let applied = false;
			for (const handler of handlers) {
				if (await handler(command)) {
					applied = true;
					break;
				}
			}
			send({ type: "command-result", requestId: message.requestId, ok: applied });
		} else if (message.type === "preview-request" && typeof message.requestId === "string" && typeof message.requesterClientId === "string" && typeof message.position === "number") {
			let dataUrl: string | null = null;
			try {
				for (const handler of previewHandlers) {
					dataUrl = await handler(message.position);
					if (dataUrl) break;
				}
			} catch (error) {
				console.warn("Could not render a remote playback preview", error);
			}
			if (dataUrl && dataUrl.length <= 32_000) send({ type: "preview-response", requestId: message.requestId, requesterClientId: message.requesterClientId, dataUrl });
		} else if (message.type === "preview-response" && typeof message.requestId === "string" && typeof message.dataUrl === "string" && message.dataUrl.length <= 32_000) {
			for (const listener of previewListeners) listener(message.requestId, message.dataUrl);
		}
	});
	ws.addEventListener("close", () => {
		if (socket !== ws) return;
		socket = null;
		devices.value = [];
		if (!started || !getAccessToken()) {
			status.value = "offline";
			return;
		}
		status.value = "reconnecting";
		attempts++;
		reconnectTimer = setTimeout(connect, Math.min(1_000 * 2 ** Math.min(attempts, 4), 15_000));
	});
	ws.addEventListener("error", () => ws.close());
}

function onTokenChanged(): void {
	clearTimeout(reconnectTimer);
	socket?.close();
	socket = null;
	devices.value = [];
	attempts = 0;
	if (getAccessToken()) connect();
	else status.value = "offline";
}

export function startRemotePlayback(): void {
	if (started) return;
	started = true;
	window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, onTokenChanged);
	if (getAccessToken()) connect();
}

export function stopRemotePlayback(): void {
	started = false;
	window.removeEventListener(AUTH_TOKEN_CHANGED_EVENT, onTokenChanged);
	clearTimeout(reconnectTimer);
	socket?.close();
	socket = null;
	devices.value = [];
	status.value = "offline";
}

export function publishRemotePlayback(state: RemotePlaybackState | null): void {
	desiredState = state && isRemotePlaybackState(state) ? { ...state } : null;
	publishCurrentState();
}

export function registerRemoteCommandHandler(handler: CommandHandler): () => void {
	handlers.add(handler);
	return () => handlers.delete(handler);
}

export function registerRemotePreviewHandler(handler: PreviewHandler): () => void {
	previewHandlers.add(handler);
	return () => previewHandlers.delete(handler);
}

export function onRemotePreview(listener: (requestId: string, dataUrl: string) => void): () => void {
	previewListeners.add(listener);
	return () => previewListeners.delete(listener);
}

export function requestRemotePreview(targetClientId: string, position: number): string | null {
	if (!Number.isFinite(position) || position < 0 || position > 86_400) return null;
	const requestId = crypto.randomUUID();
	return send({ type: "preview-request", requestId, targetClientId, position }) ? requestId : null;
}

export function sendRemotePlaybackCommand(targetClientId: string, command: RemotePlaybackCommand): boolean {
	if (!parseCommand(command)) return false;
	return send({ type: "command", requestId: crypto.randomUUID(), targetClientId, command });
}

export function useRemotePlayback() {
	return {
		clientId,
		devices: readonly(devices),
		otherDevices: computed(() => devices.value.filter((device) => device.clientId !== clientId)),
		status: readonly(status),
		sendCommand: sendRemotePlaybackCommand,
		connect: startRemotePlayback,
	};
}

function isRemotePlaybackState(value: unknown): value is RemotePlaybackState {
	if (!value || typeof value !== "object") return false;
	const state = value as Record<string, unknown>;
	return (
		(state.kind === "audio" || state.kind === "video") &&
		typeof state.title === "string" &&
		state.title.length > 0 &&
		state.title.length <= 200 &&
		(state.subtitle === undefined || (typeof state.subtitle === "string" && state.subtitle.length <= 200)) &&
		(state.itemId === undefined || (typeof state.itemId === "string" && state.itemId.length <= 128)) &&
		typeof state.playing === "boolean" &&
		typeof state.position === "number" &&
		Number.isFinite(state.position) &&
		state.position >= 0 &&
		typeof state.duration === "number" &&
		Number.isFinite(state.duration) &&
		state.duration >= 0 &&
		(state.volume === undefined || (typeof state.volume === "number" && state.volume >= 0 && state.volume <= 1)) &&
		(state.muted === undefined || typeof state.muted === "boolean") &&
		(state.audioTracks === undefined || (Array.isArray(state.audioTracks) && state.audioTracks.length <= 32 && state.audioTracks.every((track) => typeof track?.id === "string" && typeof track.label === "string"))) &&
		(state.subtitles === undefined || (Array.isArray(state.subtitles) && state.subtitles.length <= 32 && state.subtitles.every((track) => typeof track?.id === "string" && typeof track.label === "string"))) &&
		(state.chapters === undefined || (Array.isArray(state.chapters) && state.chapters.length <= 100 && state.chapters.every((chapter) => typeof chapter?.title === "string" && typeof chapter.start === "number"))) &&
		(state.segments === undefined || (Array.isArray(state.segments) && state.segments.length <= 100 && state.segments.every((segment) => typeof segment?.type === "string" && typeof segment.start === "number" && typeof segment.end === "number"))) &&
		isRemoteTrickplay(state.trickplay)
	);
}

function isRemoteTrickplay(value: unknown): boolean {
	if (value === undefined) return true;
	if (typeof value !== "object" || value === null) return false;
	const trickplay = value as Record<string, unknown>;
	if (typeof trickplay.manifest !== "object" || trickplay.manifest === null) return false;
	const manifest = trickplay.manifest as Record<string, unknown>;
	return ["intervalMs", "thumbWidth", "thumbHeight", "columns", "rows", "count", "sheets"].every((key) => typeof manifest[key] === "number" && Number.isFinite(manifest[key]));
}

function isRemoteDevice(value: unknown): value is RemotePlaybackDevice {
	if (!value || typeof value !== "object") return false;
	const device = value as Record<string, unknown>;
	return typeof device.clientId === "string" && typeof device.deviceName === "string" && (device.player === undefined || isRemotePlaybackState(device.player)) && typeof device.updatedAt === "number";
}

function parseCommand(value: unknown): RemotePlaybackCommand | null {
	if (!value || typeof value !== "object") return null;
	const command = value as Record<string, unknown>;
	if (command.action === "play" || command.action === "pause") return { action: command.action };
	if (command.action === "seek" && typeof command.position === "number" && Number.isFinite(command.position) && command.position >= 0 && command.position <= 86_400) {
		return { action: "seek", position: command.position };
	}
	if (command.action === "volume" && typeof command.volume === "number" && Number.isFinite(command.volume) && command.volume >= 0 && command.volume <= 1 && typeof command.muted === "boolean") return { action: "volume", volume: command.volume, muted: command.muted };
	if (command.action === "audio-track" && typeof command.index === "number" && Number.isInteger(command.index) && command.index >= 0 && command.index < 32) return { action: "audio-track", index: command.index };
	if (command.action === "subtitle" && typeof command.id === "string" && command.id.length <= 128) return { action: "subtitle", id: command.id };
	if (command.action === "skip") return { action: "skip" };
	if (command.action === "play-item" && isRemoteCastItem(command.item)) return { action: "play-item", item: command.item };
	return null;
}

function isRemoteCastItem(value: unknown): value is RemoteCastItem {
	if (!value || typeof value !== "object") return false;
	const item = value as Record<string, unknown>;
	if (item.kind === "video") return typeof item.itemId === "string" && typeof item.title === "string" && (item.startAt === undefined || (typeof item.startAt === "number" && Number.isFinite(item.startAt)));
	return item.kind === "audio" && Array.isArray(item.tracks) && item.tracks.length > 0 && item.tracks.length <= 200 && typeof item.startIndex === "number" && Number.isInteger(item.startIndex) && item.startIndex >= 0 && item.startIndex < item.tracks.length;
}
