import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	add: vi.fn(),
	list: vi.fn(),
	remove: vi.fn(),
	reorder: vi.fn(),
}));

vi.mock("../api/userMedia", () => ({
	addVideoQueueItem: mocks.add,
	getVideoQueue: mocks.list,
	removeVideoQueueItem: mocks.remove,
	reorderVideoQueue: mocks.reorder,
}));
vi.mock("../api/client", () => ({ AUTH_INVALID_EVENT: "auth-invalid", AUTH_TOKEN_CHANGED_EVENT: "auth-changed" }));

describe("video queue account isolation", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
		vi.stubGlobal("window", new EventTarget());
	});
	afterEach(() => vi.unstubAllGlobals());

	it("discards an old account response after the token changes", async () => {
		let resolve!: (value: unknown[]) => void;
		mocks.list.mockReturnValue(
			new Promise((done) => {
				resolve = done;
			}),
		);
		const queue = (await import("./useVideoQueue")).useVideoQueue();
		const pending = queue.load();
		window.dispatchEvent(new Event("auth-changed"));
		resolve([{ id: "old-item" }]);
		await pending;
		expect(queue.items.value).toEqual([]);
	});

	it("does not remove an item or start playback after the account changes", async () => {
		let resolve!: () => void;
		mocks.list.mockResolvedValue([{ id: "shared-item" }]);
		mocks.remove.mockReturnValue(
			new Promise<void>((done) => {
				resolve = done;
			}),
		);
		const queue = (await import("./useVideoQueue")).useVideoQueue();
		await queue.load();
		const pending = queue.remove("shared-item");
		window.dispatchEvent(new Event("auth-changed"));
		await queue.load();
		resolve();
		expect(await pending).toBe(false);
		expect(queue.items.value).toEqual([{ id: "shared-item" }]);
	});
});
