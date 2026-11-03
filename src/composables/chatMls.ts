import { createApplicationMessage, createCommit, createGroup, decodeGroupState, decodeMlsMessage, defaultCapabilities, defaultLifetime, emptyPskIndex, encodeGroupState, encodeMlsMessage, generateKeyPackage, getCiphersuiteFromName, getCiphersuiteImpl, joinGroup, processMessage, type AuthenticationService, type ClientState, type Credential, type IncomingMessageCallback, type KeyPackage, type PrivateKeyPackage, type Welcome, zeroOutUint8Array } from "ts-mls";
import { defaultClientConfig } from "ts-mls/clientConfig.js";
import { decodeKeyPackage, encodeKeyPackage } from "ts-mls/keyPackage.js";
import { decodeRatchetTree, encodeRatchetTree, type RatchetTree } from "ts-mls/ratchetTree.js";

const CIPHERSUITE = getCiphersuiteFromName("MLS_128_DHKEMX25519_AES128GCM_SHA256_Ed25519");
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export interface ChatMlsDevice {
	keyPackage: KeyPackage;
	privateKeyPackage: PrivateKeyPackage;
}

export interface ChatMlsGroup {
	state: ClientState;
}

export interface ChatMlsCommit {
	group: ChatMlsGroup;
	welcome: Welcome;
	commit: string;
	ratchetTree: string;
}

export interface ChatMlsTrustedDevice {
	userId: string;
	deviceId: string;
	keyPackage: KeyPackage;
}

export interface ChatMlsPairingKeys {
	publicKey: string;
	privateKey: string;
}

interface SerializedChatMlsDevice {
	keyPackage: string;
	privateKeyPackage: {
		initPrivateKey: string;
		hpkePrivateKey: string;
		signaturePrivateKey: string;
	};
}

export interface ChatMlsApplicationMessage {
	group: ChatMlsGroup;
	ciphertext: string;
}

export interface ChatMlsDecryption {
	group: ChatMlsGroup;
	plaintext: string | null;
}

let cipherSuitePromise: ReturnType<typeof getCiphersuiteImpl> | undefined;

function getCipherSuite() {
	cipherSuitePromise ??= getCiphersuiteImpl(CIPHERSUITE);
	return cipherSuitePromise;
}

function clientConfig(authService: AuthenticationService) {
	return { ...defaultClientConfig, authService };
}

function toBase64(bytes: Uint8Array): string {
	let binary = "";
	for (let index = 0; index < bytes.length; index += 0x8000) {
		binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
	}
	return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
	const binary = atob(value);
	return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

/** Creates a device key package; the private half must never be sent to Flixer's server. */
export async function createChatMlsDevice(userId: string, deviceId: string): Promise<ChatMlsDevice> {
	const cipherSuite = await getCipherSuite();
	const credential = {
		credentialType: "basic" as const,
		identity: encoder.encode(JSON.stringify({ userId, deviceId })),
	};
	const { publicPackage, privatePackage } = await generateKeyPackage(credential, defaultCapabilities(), defaultLifetime, [], cipherSuite);
	return { keyPackage: publicPackage, privateKeyPackage: privatePackage };
}

export async function createChatMlsPairingKeys(): Promise<ChatMlsPairingKeys> {
	const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
	const publicKey = new Uint8Array(await crypto.subtle.exportKey("spki", pair.publicKey));
	const privateKey = await crypto.subtle.exportKey("jwk", pair.privateKey);
	return {
		publicKey: toBase64(publicKey),
		privateKey: JSON.stringify(privateKey),
	};
}

export async function signChatMlsDeviceApproval(privateKeyJwk: string, targetDeviceId: string, challenge: string): Promise<string> {
	let jwk: JsonWebKey;
	try {
		jwk = JSON.parse(privateKeyJwk) as JsonWebKey;
	} catch (error) {
		throw new Error("The saved trusted-device key is invalid.", { cause: error });
	}
	const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
	const payload = encoder.encode(`flixer-chat-device-approval:v1:${targetDeviceId}:${challenge}`);
	return toBase64(new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, payload)));
}

/** Creates the first MLS group state for a chat. */
export async function createChatMlsGroup(groupId: string, device: ChatMlsDevice, authService: AuthenticationService): Promise<ChatMlsGroup> {
	const cipherSuite = await getCipherSuite();
	const state = await createGroup(encoder.encode(groupId), device.keyPackage, device.privateKeyPackage, [], cipherSuite, clientConfig(authService));
	return { state };
}

/** Adds a device to an existing MLS group and returns the one-time Welcome message. */
export async function addChatMlsDevice(group: ChatMlsGroup, device: ChatMlsDevice): Promise<ChatMlsCommit> {
	const cipherSuite = await getCipherSuite();
	const result = await createCommit(
		{ state: group.state, cipherSuite },
		{
			extraProposals: [{ proposalType: "add", add: { keyPackage: device.keyPackage } }],
			ratchetTreeExtension: true,
		},
	);
	result.consumed.forEach(zeroOutUint8Array);
	if (!result.welcome) throw new Error("MLS did not create a Welcome message for the new device.");
	return {
		group: { state: result.newState },
		welcome: result.welcome,
		commit: toBase64(encodeMlsMessage(result.commit)),
		ratchetTree: encodeChatMlsRatchetTree(result.newState.ratchetTree),
	};
}

export async function addChatMlsDevices(group: ChatMlsGroup, keyPackages: KeyPackage[]): Promise<ChatMlsCommit> {
	if (keyPackages.length === 0) throw new Error("At least one device must be added to the MLS group.");
	const cipherSuite = await getCipherSuite();
	const result = await createCommit(
		{ state: group.state, cipherSuite },
		{
			extraProposals: keyPackages.map((keyPackage) => ({
				proposalType: "add" as const,
				add: { keyPackage },
			})),
			ratchetTreeExtension: true,
		},
	);
	result.consumed.forEach(zeroOutUint8Array);
	if (!result.welcome) throw new Error("MLS did not create a Welcome message for the new devices.");
	return {
		group: { state: result.newState },
		welcome: result.welcome,
		commit: toBase64(encodeMlsMessage(result.commit)),
		ratchetTree: encodeChatMlsRatchetTree(result.newState.ratchetTree),
	};
}

/** Joins an MLS group using a Welcome delivered by a trusted device. */
export async function joinChatMlsGroup(welcome: Welcome, device: ChatMlsDevice, ratchetTree: ChatMlsGroup["state"]["ratchetTree"], authService: AuthenticationService): Promise<ChatMlsGroup> {
	const cipherSuite = await getCipherSuite();
	const state = await joinGroup(welcome, device.keyPackage, device.privateKeyPackage, emptyPskIndex, cipherSuite, ratchetTree, undefined, clientConfig(authService));
	return { state };
}

/** Encrypts an application payload and advances the sender's ratchet state. */
export async function encryptChatMlsMessage(group: ChatMlsGroup, plaintext: string): Promise<ChatMlsApplicationMessage> {
	const cipherSuite = await getCipherSuite();
	const result = await createApplicationMessage(group.state, encoder.encode(plaintext), cipherSuite);
	result.consumed.forEach(zeroOutUint8Array);
	return {
		group: { state: result.newState },
		ciphertext: toBase64(
			encodeMlsMessage({
				version: "mls10",
				wireformat: "mls_private_message",
				privateMessage: result.privateMessage,
			}),
		),
	};
}

/** Decrypts a relayed MLS message and advances state for both application and commit messages. */
export async function decryptChatMlsMessage(group: ChatMlsGroup, ciphertext: string, incomingMessageCallback: IncomingMessageCallback): Promise<ChatMlsDecryption> {
	const cipherSuite = await getCipherSuite();
	const bytes = fromBase64(ciphertext);
	const decoded = decodeMlsMessage(bytes, 0);
	if (!decoded || decoded[1] !== bytes.length || (decoded[0].wireformat !== "mls_private_message" && decoded[0].wireformat !== "mls_public_message")) {
		throw new Error("The encrypted chat message is malformed.");
	}
	const result = await processMessage(decoded[0], group.state, emptyPskIndex, incomingMessageCallback, cipherSuite);
	result.consumed.forEach(zeroOutUint8Array);
	return {
		group: { state: result.newState },
		plaintext: result.kind === "applicationMessage" ? decoder.decode(result.message) : null,
	};
}

/** Persists opaque MLS state locally; callers must encrypt this blob before durable storage. */
export function serializeChatMlsGroup(group: ChatMlsGroup): string {
	return toBase64(encodeGroupState(group.state));
}

/** Restores locally persisted group state with the caller's credential validator. */
export function restoreChatMlsGroup(serialized: string, authService: AuthenticationService): ChatMlsGroup {
	const bytes = fromBase64(serialized);
	const decoded = decodeGroupState(bytes, 0);
	if (!decoded || decoded[1] !== bytes.length) throw new Error("The saved MLS chat state is invalid.");
	return { state: { ...decoded[0], clientConfig: clientConfig(authService) } };
}

export function decodeChatMlsWelcome(serialized: string): Welcome {
	const bytes = fromBase64(serialized);
	const decoded = decodeMlsMessage(bytes, 0);
	const message = decoded?.[1] === bytes.length ? decoded[0] : undefined;
	if (message?.wireformat !== "mls_welcome") throw new Error("The MLS Welcome message is invalid.");
	return message.welcome;
}

export function encodeChatMlsWelcome(welcome: Welcome): string {
	return toBase64(encodeMlsMessage({ version: "mls10", wireformat: "mls_welcome", welcome }));
}

export function encodeChatMlsKeyPackage(keyPackage: KeyPackage): string {
	return toBase64(encodeKeyPackage(keyPackage));
}

export function encodeChatMlsRatchetTree(tree: RatchetTree): string {
	return toBase64(encodeRatchetTree(tree));
}

export function decodeChatMlsRatchetTree(serialized: string): RatchetTree {
	const bytes = fromBase64(serialized);
	const decoded = decodeRatchetTree(bytes, 0);
	if (!decoded || decoded[1] !== bytes.length) throw new Error("The MLS ratchet tree is invalid.");
	return decoded[0];
}

export function serializeChatMlsDevice(device: ChatMlsDevice): string {
	const serialized: SerializedChatMlsDevice = {
		keyPackage: encodeChatMlsKeyPackage(device.keyPackage),
		privateKeyPackage: {
			initPrivateKey: toBase64(device.privateKeyPackage.initPrivateKey),
			hpkePrivateKey: toBase64(device.privateKeyPackage.hpkePrivateKey),
			signaturePrivateKey: toBase64(device.privateKeyPackage.signaturePrivateKey),
		},
	};
	return JSON.stringify(serialized);
}

export function restoreChatMlsDevice(serialized: string): ChatMlsDevice {
	let parsed: SerializedChatMlsDevice;
	try {
		parsed = JSON.parse(serialized) as SerializedChatMlsDevice;
	} catch (error) {
		throw new Error("The saved MLS device is invalid.", { cause: error });
	}
	if (typeof parsed.keyPackage !== "string" || typeof parsed.privateKeyPackage?.initPrivateKey !== "string" || typeof parsed.privateKeyPackage?.hpkePrivateKey !== "string" || typeof parsed.privateKeyPackage?.signaturePrivateKey !== "string") {
		throw new Error("The saved MLS device is invalid.");
	}
	return {
		keyPackage: decodeChatMlsKeyPackage(parsed.keyPackage),
		privateKeyPackage: {
			initPrivateKey: fromBase64(parsed.privateKeyPackage.initPrivateKey),
			hpkePrivateKey: fromBase64(parsed.privateKeyPackage.hpkePrivateKey),
			signaturePrivateKey: fromBase64(parsed.privateKeyPackage.signaturePrivateKey),
		},
	};
}

export function decodeChatMlsKeyPackage(serialized: string): KeyPackage {
	const bytes = fromBase64(serialized);
	const decoded = decodeKeyPackage(bytes, 0);
	if (!decoded || decoded[1] !== bytes.length) throw new Error("The MLS key package is invalid.");
	return decoded[0];
}

export function createChatMlsAuthenticationService(devices: ChatMlsTrustedDevice[]): AuthenticationService {
	const trusted = new Set(
		devices.map(({ userId, deviceId, keyPackage }) => {
			const identity = JSON.stringify({ userId, deviceId });
			const signatureKey = toBase64(keyPackage.leafNode.signaturePublicKey);
			return `${identity}:${signatureKey}`;
		}),
	);
	return {
		validateCredential: async (credential: Credential, signaturePublicKey: Uint8Array) => {
			if (credential.credentialType !== "basic") return false;
			try {
				const identity = JSON.parse(decoder.decode(credential.identity)) as { userId?: unknown; deviceId?: unknown };
				if (typeof identity.userId !== "string" || typeof identity.deviceId !== "string") return false;
				return trusted.has(`${JSON.stringify({ userId: identity.userId, deviceId: identity.deviceId })}:${toBase64(signaturePublicKey)}`);
			} catch {
				return false;
			}
		},
	};
}
