import { AxiosError, type AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }));
vi.mock("./client", () => ({
	api: { get: getMock },
	clearAccessToken: vi.fn(),
}));

import { validateAccessToken } from "./auth";

describe("validateAccessToken", () => {
	beforeEach(() => {
		getMock.mockReset();
	});

	it("retries once on a 5xx response and succeeds when the retry succeeds", async () => {
		const error502 = new AxiosError("Bad Gateway", "ERR_BAD_RESPONSE", undefined, undefined, { status: 502 } as AxiosResponse);
		getMock.mockRejectedValueOnce(error502).mockResolvedValueOnce({ data: [{ current: true }] });

		await expect(validateAccessToken(0)).resolves.toBe(true);
		expect(getMock).toHaveBeenCalledTimes(2);
	});

	it("retries once on a network error without a response", async () => {
		const networkError = new AxiosError("Network Error", "ERR_NETWORK");
		getMock.mockRejectedValueOnce(networkError).mockResolvedValueOnce({ data: [{ current: false }] });

		await expect(validateAccessToken(0)).resolves.toBe(false);
		expect(getMock).toHaveBeenCalledTimes(2);
	});

	it("does not retry on 401 unauthorized", async () => {
		const error401 = new AxiosError("Unauthorized", "ERR_BAD_REQUEST", undefined, undefined, { status: 401 } as AxiosResponse);
		getMock.mockRejectedValueOnce(error401);

		await expect(validateAccessToken(0)).rejects.toBe(error401);
		expect(getMock).toHaveBeenCalledTimes(1);
	});
});
