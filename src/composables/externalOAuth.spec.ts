import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { startExternalOAuth, finishExternalOAuth } = vi.hoisted(() => ({ startExternalOAuth: vi.fn(), finishExternalOAuth: vi.fn() }));

vi.mock("../api", () => ({ startExternalOAuth, finishExternalOAuth }));

import { beginExternalOAuth, completeExternalOAuth } from "./externalOAuth.js";

class MemoryStorage {
	private values = new Map<string, string>();
	getItem(key: string) {
		return this.values.get(key) ?? null;
	}
	setItem(key: string, value: string) {
		this.values.set(key, value);
	}
	removeItem(key: string) {
		this.values.delete(key);
	}
}

const state = "a".repeat(43);
const browserSecret = Buffer.alloc(32, 7).toString("base64url");
let localStorage: MemoryStorage;
let sessionStorage: MemoryStorage;
const assign = vi.fn();

beforeEach(() => {
	localStorage = new MemoryStorage();
	sessionStorage = new MemoryStorage();
	vi.stubGlobal("window", { localStorage, sessionStorage, location: { assign } });
	vi.stubGlobal("crypto", { getRandomValues: (bytes: Uint8Array) => bytes.fill(7) });
	vi.stubGlobal("btoa", (value: string) => Buffer.from(value, "binary").toString("base64"));
	startExternalOAuth.mockResolvedValue({ authorizationUrl: "https://github.com/login/oauth/authorize", state });
	finishExternalOAuth.mockResolvedValue({ accessToken: "session" });
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.clearAllMocks();
});

describe("external OAuth browser state", () => {
	it("stores each redirect flow in origin storage before navigating", async () => {
		await beginExternalOAuth("plugin.example", false, undefined, "/movies");
		const raw = localStorage.getItem(`flixer.externalOAuth.${state}`);
		expect(raw).not.toBeNull();
		expect(JSON.parse(raw!)).toMatchObject({ pluginId: "plugin.example", browserSecret, state, redirect: "/movies" });
		expect(sessionStorage.getItem("flixer.externalOAuth")).toBeNull();
		expect(assign).toHaveBeenCalledWith("https://github.com/login/oauth/authorize");
	});

	it("finishes using the callback state and deletes its local flow record", async () => {
		localStorage.setItem(`flixer.externalOAuth.${state}`, JSON.stringify({ pluginId: "plugin.example", browserSecret, state, redirect: "/movies", expiresAt: Date.now() + 60_000 }));
		await expect(completeExternalOAuth(state, "code")).resolves.toEqual({ result: { accessToken: "session" }, redirect: "/movies" });
		expect(finishExternalOAuth).toHaveBeenCalledWith("plugin.example", state, browserSecret, "code");
		expect(localStorage.getItem(`flixer.externalOAuth.${state}`)).toBeNull();
	});

	it("accepts a legacy session-storage flow and rejects a different callback state", async () => {
		sessionStorage.setItem("flixer.externalOAuth", JSON.stringify({ pluginId: "plugin.example", browserSecret, state }));
		await expect(completeExternalOAuth(state, "code")).resolves.toMatchObject({ result: { accessToken: "session" } });
		expect(sessionStorage.getItem("flixer.externalOAuth")).toBeNull();
		await expect(completeExternalOAuth("c".repeat(43), "code")).rejects.toThrow("expired");
	});
});
