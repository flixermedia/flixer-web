import { finishExternalOAuth, startExternalOAuth } from "../api";

const KEY = "flixer.externalOAuth";
const KEY_PREFIX = `${KEY}.`;
const FLOW_LIFETIME_MS = 10 * 60_000;

interface PendingExternalOAuth {
	pluginId: string;
	browserSecret: string;
	state: string;
	redirect?: string;
	expiresAt?: number;
}

function parsePending(raw: string | null): PendingExternalOAuth | null {
	if (!raw) return null;
	try {
		const value: unknown = JSON.parse(raw);
		if (!value || typeof value !== "object") return null;
		const pending = value as Record<string, unknown>;
		if (typeof pending.pluginId !== "string" || typeof pending.browserSecret !== "string" || typeof pending.state !== "string") return null;
		if (pending.expiresAt !== undefined && (typeof pending.expiresAt !== "number" || pending.expiresAt <= Date.now())) return null;
		return {
			pluginId: pending.pluginId,
			browserSecret: pending.browserSecret,
			state: pending.state,
			...(typeof pending.redirect === "string" ? { redirect: pending.redirect } : {}),
			...(typeof pending.expiresAt === "number" ? { expiresAt: pending.expiresAt } : {}),
		};
	} catch {
		return null;
	}
}

function pendingKey(state: string): string {
	return `${KEY_PREFIX}${encodeURIComponent(state)}`;
}

function savePending(pending: PendingExternalOAuth): void {
	const value = JSON.stringify({ ...pending, expiresAt: Date.now() + FLOW_LIFETIME_MS });
	try {
		window.localStorage.setItem(pendingKey(pending.state), value);
	} catch {
		window.sessionStorage.setItem(KEY, value);
	}
}

function takePending(state: string): PendingExternalOAuth | null {
	if (!/^[A-Za-z0-9_-]{43}$/.test(state)) return null;
	const key = pendingKey(state);
	let raw: string | null = null;
	let storage: Storage = window.localStorage;
	try {
		raw = storage.getItem(key);
	} catch {
		storage = window.sessionStorage;
		raw = storage.getItem(KEY);
	}
	const pending = parsePending(raw);
	if (pending?.state !== state) return null;
	storage.removeItem(storage === window.localStorage ? key : KEY);
	window.sessionStorage.removeItem(KEY);
	return pending;
}

export async function beginExternalOAuth(pluginId: string, link: boolean, accountPassword?: string, redirect?: string) {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	const browserSecret = btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""))
		.replaceAll("+", "-")
		.replaceAll("/", "_")
		.replaceAll("=", "");
	const result = await startExternalOAuth(pluginId, browserSecret, link, accountPassword);
	const destination = new URL(result.authorizationUrl);
	if (destination.protocol !== "https:" || destination.username || destination.password) throw new Error("Invalid authorization destination.");
	savePending({ pluginId, browserSecret, state: result.state, redirect });
	window.location.assign(destination.toString());
}

export async function completeExternalOAuth(state: string, code: string) {
	const pending = takePending(state) ?? parsePending(window.sessionStorage.getItem(KEY));
	if (!pending || pending.state !== state) throw new Error("External sign-in expired. Start the provider sign-in again.");
	try {
		const result = await finishExternalOAuth(pending.pluginId, state, pending.browserSecret, code);
		return { result, redirect: pending.redirect?.startsWith("/") && !pending.redirect.startsWith("//") ? pending.redirect : undefined };
	} finally {
		window.localStorage.removeItem(pendingKey(state));
		window.sessionStorage.removeItem(KEY);
	}
}
