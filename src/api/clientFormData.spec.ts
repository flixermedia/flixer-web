import { describe, expect, it, vi } from "vitest";

const { generatedPost, generatedPut } = vi.hoisted(() => ({
	generatedPost: vi.fn(),
	generatedPut: vi.fn(),
}));

vi.mock("flixer-api-client", () => ({
	createFlixerApiClient: (transport: { post: unknown; put: unknown }) => ({
		post: generatedPost,
		put: generatedPut,
		get: vi.fn(),
		delete: vi.fn(),
		head: vi.fn(),
		options: vi.fn(),
		patch: vi.fn(),
		transport,
	}),
}));

vi.mock("../platform/serverConnection", () => ({
	forgetNativeServerUrl: vi.fn(),
	getApiBaseUrl: () => "https://flixer.example/api",
	saveNativeServerUrl: vi.fn(),
}));

import { api } from "./client";

describe("api FormData bypass", () => {
	it("sends FormData directly via axios transport instead of generated client wrapper", async () => {
		const storage = { getItem: () => null, setItem: () => undefined, removeItem: () => undefined };
		vi.stubGlobal("localStorage", storage);
		vi.stubGlobal("sessionStorage", storage);

		const form = new FormData();
		form.append("avatar", new Blob(["png"], { type: "image/png" }), "avatar.png");

		const adapter = vi.fn(async (config: { data?: unknown }) => ({ data: config.data, status: 200, statusText: "OK", headers: {}, config }));
		await api.post("/auth/me/avatar", form, { adapter: adapter as never });
		await api.put("/admin/advertisements/1/chunks/0", form, { adapter: adapter as never });

		expect(generatedPost).not.toHaveBeenCalled();
		expect(generatedPut).not.toHaveBeenCalled();
		expect(adapter).toHaveBeenCalledTimes(2);
		expect(adapter.mock.calls[0][0].data).toBe(form);
		expect(adapter.mock.calls[1][0].data).toBe(form);
	});
});
