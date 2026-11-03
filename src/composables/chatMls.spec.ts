import { describe, expect, it } from "vitest";
import type { AuthenticationService } from "ts-mls";
import { addChatMlsDevice, createChatMlsAuthenticationService, createChatMlsDevice, createChatMlsGroup, createChatMlsPairingKeys, decryptChatMlsMessage, encryptChatMlsMessage, joinChatMlsGroup, restoreChatMlsDevice, restoreChatMlsGroup, serializeChatMlsDevice, serializeChatMlsGroup, signChatMlsDeviceApproval } from "./chatMls";
import { openChatMlsAccountBackup, openChatMlsTransfer, sealChatMlsAccountBackup, sealChatMlsTransfer } from "./chatMlsStorage";

const authService: AuthenticationService = {
	validateCredential: async () => true,
};

describe("chat MLS primitives", () => {
	it("signs trusted-device approvals with the challenge-bound pairing key", async () => {
		const keys = await createChatMlsPairingKeys();
		const targetDeviceId = "44444444-4444-4444-8444-444444444444";
		const challenge = "one-time-challenge";
		const signature = await signChatMlsDeviceApproval(keys.privateKey, targetDeviceId, challenge);
		const publicKey = await crypto.subtle.importKey("spki", Uint8Array.from(atob(keys.publicKey), (character) => character.charCodeAt(0)), { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
		const verify = (deviceId: string, value: string) => crypto.subtle.verify(
			{ name: "ECDSA", hash: "SHA-256" },
			publicKey,
			Uint8Array.from(atob(signature), (character) => character.charCodeAt(0)),
			new TextEncoder().encode(`flixer-chat-device-approval:v1:${deviceId}:${value}`),
		);

		await expect(verify(targetDeviceId, challenge)).resolves.toBe(true);
		await expect(verify(targetDeviceId, "another-challenge")).resolves.toBe(false);
		await expect(verify("55555555-5555-4555-8555-555555555555", challenge)).resolves.toBe(false);
	});

	it("encrypts application messages for group members and persists updated group state", async () => {
		const aliceDevice = await createChatMlsDevice("alice-id", "alice-device");
		const bobDevice = await createChatMlsDevice("bob-id", "bob-device");
		const restoredAliceDevice = restoreChatMlsDevice(serializeChatMlsDevice(aliceDevice));
		const aliceGroup = await createChatMlsGroup("conversation-id", aliceDevice, authService);
		const { group: updatedAliceGroup, welcome } = await addChatMlsDevice(aliceGroup, bobDevice);
		const bobGroup = await joinChatMlsGroup(welcome, bobDevice, updatedAliceGroup.state.ratchetTree, authService);
		const encrypted = await encryptChatMlsMessage(updatedAliceGroup, "A secret message");
		const rejectGroupChanges = () => "reject" as const;
		const decrypted = await decryptChatMlsMessage(bobGroup, encrypted.ciphertext, rejectGroupChanges);

		expect(decrypted.plaintext).toBe("A secret message");
		expect(encrypted.ciphertext).not.toContain("A secret message");

		const restored = restoreChatMlsGroup(serializeChatMlsGroup(encrypted.group), authService);
		const nextEncrypted = await encryptChatMlsMessage(restored, "State survived reload");
		const nextDecrypted = await decryptChatMlsMessage(decrypted.group, nextEncrypted.ciphertext, rejectGroupChanges);
		expect(nextDecrypted.plaintext).toBe("State survived reload");
		expect(restoredAliceDevice.keyPackage).toEqual(aliceDevice.keyPackage);
	});

	it("authenticates MLS credentials against registered devices rather than accepting all credentials", async () => {
		const device = await createChatMlsDevice("alice-id", "alice-device");
		const validate = createChatMlsAuthenticationService([{ userId: "alice-id", deviceId: "alice-device", keyPackage: device.keyPackage }]);
		const { credential, signaturePublicKey } = device.keyPackage.leafNode;

		await expect(validate.validateCredential(credential, signaturePublicKey)).resolves.toBe(true);
		await expect(
			validate.validateCredential(
				{
					credentialType: "basic",
					identity: new TextEncoder().encode(JSON.stringify({ userId: "mallory", deviceId: "device" })),
				},
				signaturePublicKey,
			),
		).resolves.toBe(false);
	});

	it("protects device-transfer exports with a passphrase", async () => {
		const transfer = await sealChatMlsTransfer("encrypted history bundle", "correct horse battery staple");
		await expect(openChatMlsTransfer(transfer, "correct horse battery staple")).resolves.toBe("encrypted history bundle");
		await expect(openChatMlsTransfer(transfer, "wrong passphrase")).rejects.toThrow(/passphrase is incorrect/i);
	});

	it("protects account history backups with the account password", async () => {
		const backup = await sealChatMlsAccountBackup("account history", "account-password");
		await expect(openChatMlsAccountBackup(backup, "account-password")).resolves.toBe("account history");
		await expect(openChatMlsAccountBackup(backup, "wrong-password")).rejects.toThrow(/passphrase is incorrect/i);
	});
});
