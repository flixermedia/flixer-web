import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatMlsDeviceUnavailableError, initializeChatMlsDevice } from "./chatMlsClient";

const mocks = vi.hoisted(() => ({
	status: vi.fn(),
	packages: vi.fn(),
	devices: vi.fn(),
	load: vi.fn(),
	store: vi.fn(),
}));

vi.mock("../api", () => ({
	getChatEncryptionStatus: mocks.status,
	getChatMlsDeviceKeyPackages: mocks.packages,
	getChatMlsDevices: mocks.devices,
}));
vi.mock("./chatMlsStorage", () => ({ loadChatMlsLocalValue: mocks.load, storeChatMlsLocalValue: mocks.store }));
vi.mock("./chatMls", () => ({}));

const record = {
	deviceId: "device-1",
	name: "This browser",
	status: "active",
	pairingPublicKey: "public",
	pairingPrivateKey: "private",
	keyPackages: {},
};

function apiError(status: number, message: string) {
	return Object.assign(new Error("request failed"), { isAxiosError: true, response: { status, data: { message } } });
}

describe("chat device enrollment", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.status.mockResolvedValue({ supported: true, enabled: true });
		mocks.load.mockResolvedValue(JSON.stringify(record));
		mocks.packages.mockRejectedValue(apiError(404, "Active chat device not found."));
	});

	it.each([
		["revoked", [{ deviceId: "device-1", status: "revoked" }]],
		["missing", []],
	] as const)("identifies a %s device without replacing its local keys", async (reason, devices) => {
		mocks.devices.mockResolvedValue({ devices });
		await expect(initializeChatMlsDevice("user-1")).rejects.toMatchObject({ name: "ChatMlsDeviceUnavailableError", reason });
		expect(mocks.store).not.toHaveBeenCalled();
	});

	it("does not mistake unrelated 404s or an active device for a revoked device", async () => {
		const unrelated = apiError(404, "Endpoint not found.");
		mocks.packages.mockRejectedValueOnce(unrelated);
		await expect(initializeChatMlsDevice("user-2")).rejects.toBe(unrelated);
		expect(mocks.devices).not.toHaveBeenCalled();

		const notFound = apiError(404, "Active chat device not found.");
		mocks.packages.mockRejectedValueOnce(notFound);
		mocks.devices.mockResolvedValueOnce({ devices: [{ deviceId: "device-1", status: "active" }] });
		await expect(initializeChatMlsDevice("user-2")).rejects.toBe(notFound);
	});

	it("propagates failure to inspect the device rather than inventing a revoked status", async () => {
		const failure = new Error("network unavailable");
		mocks.devices.mockRejectedValue(failure);
		await expect(initializeChatMlsDevice("user-3")).rejects.toBe(failure);
		expect(failure).not.toBeInstanceOf(ChatMlsDeviceUnavailableError);
	});
});
