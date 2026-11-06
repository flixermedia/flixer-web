import {
	acknowledgeChatMlsWelcome,
	addChatMlsKeyPackage,
	claimChatMlsKeyPackage,
	getChatEncryptionStatus,
	getChatConversations,
	getChatMessages,
	getChatMlsDevices,
	getChatMlsDeviceKeyPackages,
	getChatMlsHistoryBackup,
	getChatMlsKeyPackages,
	getChatMlsWelcomes,
	registerChatMlsDevice,
	saveChatMlsHistoryBackup,
	sendChatMessage,
	type ChatMlsDeviceRegistration,
	type ChatMlsKeyPackage,
	type ChatMessage,
	type ChatMessageWithSequence,
} from "../api";
import {
	addChatMlsDevices,
	chatMlsGroupUserIds,
	createChatMlsAuthenticationService,
	createChatMlsDevice,
	createChatMlsGroup,
	createChatMlsPairingKeys,
	decodeChatMlsKeyPackage,
	decodeChatMlsRatchetTree,
	decodeChatMlsWelcome,
	decryptChatMlsMessage,
	encodeChatMlsKeyPackage,
	encodeChatMlsWelcome,
	encryptChatMlsMessage,
	joinChatMlsGroup,
	restoreChatMlsDevice,
	serializeChatMlsDevice,
	type ChatMlsDevice,
	type ChatMlsGroup,
	type ChatMlsTrustedDevice,
} from "./chatMls";
import {
	exportChatMlsMessageCache,
	loadChatMlsLocalValue,
	openChatMlsAccountBackup,
	openChatMlsTransfer,
	restoreChatMlsMessageCache,
	sealChatMlsAccountBackup,
	sealChatMlsTransfer,
	storeChatMlsLocalValue,
} from "./chatMlsStorage";

const DEVICE_STORAGE_ID = "local-device";
const DEVICE_STORAGE_ENTRY = "identity-v1";
const KEY_PACKAGE_RESERVE = 8;
const rejectGroupChanges = () => "reject" as const;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface LocalKeyPackage {
	serializedDevice: string;
	keyPackageId: string | null;
	pendingUpload: boolean;
}

interface LocalDeviceRecord {
	deviceId: string;
	name: string;
	status: "registering" | "active" | "pending";
	pairingPublicKey: string;
	pairingPrivateKey: string;
	keyPackages: Record<string, LocalKeyPackage>;
}

type ChatMessageWithEncryption = ChatMessage & { encrypted?: boolean };

let registrationByUser = new Map<string, Promise<LocalDeviceRecord>>();
let encryptionStatus: Promise<{ enabled: boolean; supported: boolean }> | undefined;
let encryptionStatusCheckedAt = 0;
let historyBackupPassword: string | undefined;

export function clearChatMlsHistoryBackupPassword(): void {
	historyBackupPassword = undefined;
}

export interface ChatMlsDecryptionResult {
	messages: Map<string, string>;
	unavailableMessageIds: Set<string>;
}

function randomId(): string {
	return crypto.randomUUID();
}

function parseLocalDevice(serialized: string): LocalDeviceRecord {
	let record: LocalDeviceRecord;
	try {
		record = JSON.parse(serialized) as LocalDeviceRecord;
	} catch (error) {
		throw new Error("Saved chat device data is invalid.", { cause: error });
	}
	if (
		typeof record.deviceId !== "string" ||
		typeof record.name !== "string" ||
		typeof record.pairingPublicKey !== "string" ||
		typeof record.pairingPrivateKey !== "string" ||
		(record.status !== "registering" && record.status !== "active" && record.status !== "pending") ||
		typeof record.keyPackages !== "object" ||
		record.keyPackages === null
	) {
		throw new Error("Saved chat device data is invalid.");
	}
	return record;
}

function normalizeLocalKeyPackages(record: LocalDeviceRecord): boolean {
	let changed = false;
	for (const [localId, packageRecord] of Object.entries(record.keyPackages)) {
		const keyPackageId = packageRecord.keyPackageId;
		if (!keyPackageId || localId === keyPackageId) continue;
		if (record.keyPackages[keyPackageId]) {
			throw new Error("Saved chat device contains duplicate MLS key packages.");
		}
		delete record.keyPackages[localId];
		record.keyPackages[keyPackageId] = packageRecord;
		changed = true;
	}
	return changed;
}

async function saveLocalDevice(userId: string, record: LocalDeviceRecord): Promise<void> {
	await storeChatMlsLocalValue(userId, DEVICE_STORAGE_ID, DEVICE_STORAGE_ENTRY, JSON.stringify(record));
}

async function readLocalDevice(userId: string): Promise<LocalDeviceRecord | null> {
	const value = await loadChatMlsLocalValue(userId, DEVICE_STORAGE_ID, DEVICE_STORAGE_ENTRY);
	return value === null ? null : parseLocalDevice(value);
}

function packageForId(record: LocalDeviceRecord, keyPackageId: string): ChatMlsDevice {
	const packageRecord = record.keyPackages[keyPackageId];
	if (!packageRecord) throw new Error("This device is missing private MLS key material required to decrypt the message.");
	return restoreChatMlsDevice(packageRecord.serializedDevice);
}

async function registerInitialPackage(userId: string, record: LocalDeviceRecord): Promise<void> {
	const packageRecord = Object.values(record.keyPackages).find((candidate) => candidate.keyPackageId === null);
	if (!packageRecord) return;
	const device = restoreChatMlsDevice(packageRecord.serializedDevice);
	const registration: ChatMlsDeviceRegistration = await registerChatMlsDevice({
		deviceId: record.deviceId,
		name: record.name,
		keyPackage: encodeChatMlsKeyPackage(device.keyPackage),
		pairingPublicKey: record.pairingPublicKey,
	});
	packageRecord.keyPackageId = registration.keyPackageId;
	record.status = registration.status;
	normalizeLocalKeyPackages(record);
	await saveLocalDevice(userId, record);
}

async function createAndUploadPackage(userId: string, record: LocalDeviceRecord): Promise<void> {
	const device = await createChatMlsDevice(userId, record.deviceId);
	const localId = `pending:${randomId()}`;
	record.keyPackages[localId] = {
		serializedDevice: serializeChatMlsDevice(device),
		keyPackageId: null,
		pendingUpload: true,
	};
	await saveLocalDevice(userId, record);
	const result = await addChatMlsKeyPackage(record.deviceId, encodeChatMlsKeyPackage(device.keyPackage));
	delete record.keyPackages[localId];
	record.keyPackages[result.keyPackageId] = {
		serializedDevice: serializeChatMlsDevice(device),
		keyPackageId: result.keyPackageId,
		pendingUpload: false,
	};
	await saveLocalDevice(userId, record);
}

async function uploadPendingPackages(userId: string, record: LocalDeviceRecord): Promise<void> {
	for (const [localId, packageRecord] of Object.entries(record.keyPackages)) {
		if (!packageRecord.pendingUpload) continue;
		const device = restoreChatMlsDevice(packageRecord.serializedDevice);
		const result = await addChatMlsKeyPackage(record.deviceId, encodeChatMlsKeyPackage(device.keyPackage));
		delete record.keyPackages[localId];
		record.keyPackages[result.keyPackageId] = {
			serializedDevice: packageRecord.serializedDevice,
			keyPackageId: result.keyPackageId,
			pendingUpload: false,
		};
		await saveLocalDevice(userId, record);
	}
}

async function ensurePackageReserve(userId: string, record: LocalDeviceRecord): Promise<void> {
	await uploadPendingPackages(userId, record);
	const remote = await getChatMlsDeviceKeyPackages(record.deviceId);
	const locallyUsable = remote.keyPackages.filter((item) => item.available && record.keyPackages[item.keyPackageId]);
	while (locallyUsable.length < KEY_PACKAGE_RESERVE) {
		await createAndUploadPackage(userId, record);
		locallyUsable.push({ keyPackageId: Object.keys(record.keyPackages).at(-1) ?? "", keyPackage: "", available: true });
	}
}

async function createLocalDevice(userId: string): Promise<LocalDeviceRecord> {
	const deviceId = randomId();
	const name = typeof navigator === "undefined" ? "This device" : "This browser";
	const pairingKeys = await createChatMlsPairingKeys();
	const device = await createChatMlsDevice(userId, deviceId);
	const local: LocalDeviceRecord = {
		deviceId,
		name,
		status: "registering",
		pairingPublicKey: pairingKeys.publicKey,
		pairingPrivateKey: pairingKeys.privateKey,
		keyPackages: {
			initial: {
				serializedDevice: serializeChatMlsDevice(device),
				keyPackageId: null,
				pendingUpload: false,
			},
		},
	};
	await saveLocalDevice(userId, local);
	return local;
}

async function registerDevice(userId: string): Promise<LocalDeviceRecord> {
	let record = await readLocalDevice(userId);
	if (!record) record = await createLocalDevice(userId);
	await registerInitialPackage(userId, record);
	if (normalizeLocalKeyPackages(record)) await saveLocalDevice(userId, record);
	if (record.status === "pending") {
		const { devices } = await getChatMlsDevices();
		const registered = devices.find((device) => device.deviceId === record?.deviceId);
		if (!registered) throw new Error("This device is waiting for approval, but its registration could not be found.");
		if (registered.status === "active") {
			record.status = "active";
			await saveLocalDevice(userId, record);
		}
	}
	if (record.status === "active") await ensurePackageReserve(userId, record);
	return record;
}

export async function initializeChatMlsDevice(userId: string): Promise<LocalDeviceRecord | null> {
	if (!encryptionStatus || Date.now() - encryptionStatusCheckedAt > 60_000) {
		encryptionStatusCheckedAt = Date.now();
		encryptionStatus = getChatEncryptionStatus().catch((error: unknown) => {
			encryptionStatus = undefined;
			throw error;
		});
	}
	if (!(await encryptionStatus).supported) return null;
	let pending = registrationByUser.get(userId);
	if (!pending) {
		pending = registerDevice(userId);
		registrationByUser.set(userId, pending);
	}
	try {
		return await pending;
	} finally {
		registrationByUser.delete(userId);
	}
}

function parseHistoryBackup(serialized: string, userId: string): Array<{ messageId: string; text: string }> {
	let bundle: unknown;
	try {
		bundle = JSON.parse(serialized);
	} catch (error) {
		throw new Error("The encrypted account chat history backup is invalid.", { cause: error });
	}
	if (
		typeof bundle !== "object" ||
		bundle === null ||
		!("format" in bundle) ||
		bundle.format !== "flixer-chat-history" ||
		!("version" in bundle) ||
		bundle.version !== 1 ||
		!("userId" in bundle) ||
		bundle.userId !== userId ||
		!("entries" in bundle) ||
		!Array.isArray(bundle.entries) ||
		bundle.entries.length > 100_000
	) {
		throw new Error("The encrypted account chat history backup does not match this account.");
	}
	return bundle.entries as Array<{ messageId: string; text: string }>;
}

async function updateHistoryBackup(userId: string, deviceId: string, password: string): Promise<void> {
	const [remote, localEntries] = await Promise.all([getChatMlsHistoryBackup(), exportChatMlsMessageCache(userId, deviceId)]);
	const entries = new Map<string, string>();
	if (remote.backup) {
		const existing = parseHistoryBackup(await openChatMlsAccountBackup(remote.backup, password), userId);
		for (const entry of existing) entries.set(entry.messageId, entry.text);
	}
	for (const entry of localEntries) entries.set(entry.messageId, entry.text);
	const backup = await sealChatMlsAccountBackup(
		JSON.stringify({
			format: "flixer-chat-history",
			version: 1,
			userId,
			entries: [...entries].map(([messageId, text]) => ({ messageId, text })),
		}),
		password,
	);
	await saveChatMlsHistoryBackup(backup);
}

export async function syncChatMlsHistoryBackup(userId: string, password: string): Promise<void> {
	const record = await initializeChatMlsDevice(userId);
	if (!record || record.status !== "active") throw new Error("This device must be active before account history can be synchronized.");
	const { backup } = await getChatMlsHistoryBackup();
	if (backup) {
		const entries = parseHistoryBackup(await openChatMlsAccountBackup(backup, password), userId);
		await restoreChatMlsMessageCache(userId, record.deviceId, entries);
	}
	historyBackupPassword = password;

	const { conversations } = await getChatConversations();
	const syncFailures: unknown[] = [];
	for (const conversation of conversations) {
		let beforeSequence: string | undefined;
		try {
			while (true) {
				const page = await getChatMessages(conversation.id, beforeSequence ? { beforeSequence } : {});
				const result = await decryptChatMessages(userId, conversation.id, page.messages, false);
				if (result.unavailableMessageIds.size > 0) {
					throw new Error(`${result.unavailableMessageIds.size} encrypted message(s) could not be decrypted on this device.`);
				}
				if (!page.hasMore || page.messages.length === 0) break;
				const nextBefore = page.messages[0].sequence;
				if (nextBefore === beforeSequence) break;
				beforeSequence = nextBefore;
			}
		} catch (error) {
			console.error("[chat encryption] conversation history could not be synchronized", { conversationId: conversation.id, error });
			syncFailures.push(error);
		}
	}
	await updateHistoryBackup(userId, record.deviceId, password);
	if (syncFailures.length > 0) throw new Error(`Encrypted history synchronized with ${syncFailures.length} conversation(s) unavailable.`);
}

export async function decryptChatMessages(
	userId: string,
	conversationId: string,
	messages: ChatMessageWithEncryption[],
	syncBackup = true,
	preparePackages = true,
): Promise<ChatMlsDecryptionResult> {
	const record = await initializeChatMlsDevice(userId);
	if (!record) return { messages: new Map(), unavailableMessageIds: new Set() };
	if (record.status !== "active") throw new Error("This chat device is not active. Sign in again after updating the Flixer server.");
	const [{ keyPackages }, { welcomes }] = await Promise.all([
		getChatMlsKeyPackages(conversationId),
		getChatMlsWelcomes(conversationId, record.deviceId),
	]);
	const trustedDevices: ChatMlsTrustedDevice[] = keyPackages.map((item) => ({
		userId: item.userId,
		deviceId: item.deviceId,
		keyPackage: decodeChatMlsKeyPackage(item.keyPackage),
	}));
	const authentication = createChatMlsAuthenticationService(trustedDevices);
	const welcomeByMessage = new Map(welcomes.map((welcome) => [welcome.messageId, welcome]));
	const result = new Map<string, string>();
	const unavailableMessageIds = new Set<string>();
	let cacheChanged = false;
	for (const message of messages) {
		if (message.kind !== "text" || message.encrypted !== true) continue;
		const saved = await loadChatMlsLocalValue(userId, record.deviceId, `message:${message.id}`);
		if (saved !== null) {
			result.set(message.id, saved);
			continue;
		}
		const welcome = welcomeByMessage.get(message.id);
		if (!welcome) {
			unavailableMessageIds.add(message.id);
			continue;
		}
		const localDevice = packageForId(record, welcome.keyPackageId);
		const group = await joinChatMlsGroup(
			decodeChatMlsWelcome(welcome.welcome),
			localDevice,
			decodeChatMlsRatchetTree(welcome.ratchetTree),
			authentication,
		);
		const decrypted = await decryptChatMlsMessage(group, message.body, rejectGroupChanges);
		if (decrypted.plaintext === null) throw new Error("The encrypted chat message did not contain text.");
		await storeChatMlsLocalValue(userId, record.deviceId, `message:${message.id}`, decrypted.plaintext);
		cacheChanged = true;
		await acknowledgeChatMlsWelcome(conversationId, welcome.id, record.deviceId);
		result.set(message.id, decrypted.plaintext);
	}
	if (preparePackages) await ensurePackageReserve(userId, record);
	if (syncBackup && cacheChanged && historyBackupPassword) {
		try {
			await updateHistoryBackup(userId, record.deviceId, historyBackupPassword);
		} catch (error) {
			console.error("[chat encryption] account history backup sync failed", error);
		}
	}
	return { messages: result, unavailableMessageIds };
}

interface SealedChatGroup {
	record: LocalDeviceRecord;
	group: ChatMlsGroup;
	mlsWelcome?: { recipients: Array<{ deviceId: string; keyPackageId: string }>; welcome: string; ratchetTree: string };
}

/** Where key packages are listed and claimed: a chat conversation, or one peer inside a party. */
export interface ChatKeyPackageSource {
	/** `lenient` skips the "every device has a spare key package" check, which only creators need. */
	list(lenient?: boolean): Promise<{ keyPackages: ChatMlsKeyPackage[] }>;
	claim(keyPackageId: string): Promise<unknown>;
}

const conversationSource = (conversationId: string): ChatKeyPackageSource => ({
	list: (lenient) => getChatMlsKeyPackages(conversationId, lenient),
	claim: (keyPackageId) => claimChatMlsKeyPackage(conversationId, keyPackageId),
});

/** Creates a fresh MLS group containing this device and one claimed key package per other device in the source. */
async function createSealedChatGroup(userId: string, source: ChatKeyPackageSource, lenient = false): Promise<SealedChatGroup> {
	let record = await initializeChatMlsDevice(userId);
	if (!record) throw new Error("End-to-end chat encryption is not enabled on this server.");
	if (record.status !== "active") throw new Error("This chat device is not active. Sign in again after updating the Flixer server.");
	await ensurePackageReserve(userId, record);
	const directory = await source.list(lenient);
	let ownPackage = directory.keyPackages.find((item) => item.deviceId === record?.deviceId && item.available && record.keyPackages[item.keyPackageId]);
	if (!ownPackage) {
		await createAndUploadPackage(userId, record);
		const refreshed = await source.list(lenient);
		ownPackage = refreshed.keyPackages.find((item) => item.deviceId === record?.deviceId && item.available && record.keyPackages[item.keyPackageId]);
		if (!ownPackage) throw new Error("This device could not prepare an MLS key package.");
		record = parseLocalDevice((await loadChatMlsLocalValue(userId, DEVICE_STORAGE_ID, DEVICE_STORAGE_ENTRY)) ?? "");
	}
	const selectedByDevice = new Map<string, ChatMlsKeyPackage>();
	for (const item of directory.keyPackages) {
		if (!item.available || item.deviceId === record.deviceId || selectedByDevice.has(item.deviceId)) continue;
		selectedByDevice.set(item.deviceId, item);
	}
	const selected = [ownPackage, ...selectedByDevice.values()];
	const claimed: ChatMlsKeyPackage[] = [];
	for (const item of selected) {
		await source.claim(item.keyPackageId);
		claimed.push({ ...item, available: false });
	}
	const ownClaim = claimed[0];
	if (!ownClaim) throw new Error("This device could not claim its MLS key package.");
	const ownDevice = packageForId(record, ownClaim.keyPackageId);
	const trustedDevices: ChatMlsTrustedDevice[] = directory.keyPackages.map((item) => ({
		userId: item.userId,
		deviceId: item.deviceId,
		keyPackage: decodeChatMlsKeyPackage(item.keyPackage),
	}));
	const authentication = createChatMlsAuthenticationService(trustedDevices);
	let group = await createChatMlsGroup(randomId(), ownDevice, authentication);
	const recipients = claimed.filter((item) => item.deviceId !== record?.deviceId);
	let mlsWelcome;
	if (recipients.length) {
		const commit = await addChatMlsDevices(
			group,
			recipients.map((item) => decodeChatMlsKeyPackage(item.keyPackage)),
		);
		group = commit.group;
		mlsWelcome = {
			recipients: recipients.map(({ deviceId, keyPackageId }) => ({ deviceId, keyPackageId })),
			welcome: encodeChatMlsWelcome(commit.welcome),
			ratchetTree: commit.ratchetTree,
		};
	}
	return { record, group, mlsWelcome };
}

export async function sendEncryptedChatMessage(
	userId: string,
	conversationId: string,
	plaintext: string,
): Promise<{ message: ChatMessageWithSequence; plaintext: string }> {
	const { record, group, mlsWelcome } = await createSealedChatGroup(userId, conversationSource(conversationId));
	const encrypted = await encryptChatMlsMessage(group, plaintext);
	const message = await sendChatMessage(conversationId, encrypted.ciphertext, true, mlsWelcome, record.deviceId);
	await storeChatMlsLocalValue(userId, record.deviceId, `message:${message.id}`, plaintext);
	await ensurePackageReserve(userId, record);
	if (historyBackupPassword) {
		try {
			await updateHistoryBackup(userId, record.deviceId, historyBackupPassword);
		} catch (error) {
			console.error("[chat encryption] account history backup sync failed", error);
		}
	}
	return { message, plaintext };
}

export interface ChatCallInvite {
	recipients: Array<{ deviceId: string; keyPackageId: string }>;
	welcome: string;
	ratchetTree: string;
}

/** Starts an ephemeral MLS group for a call; the invite is the group's Welcome and is sent over the signalling relay. */
export async function createChatCallGroup(
	userId: string,
	conversationId: string,
): Promise<{ group: ChatMlsGroup; invite: ChatCallInvite; deviceId: string }> {
	return createCallGroup(userId, conversationSource(conversationId));
}

/** Same as {@link createChatCallGroup}, for a voice link between two members of a party. */
export function createPartyPeerGroup(
	userId: string,
	source: ChatKeyPackageSource,
): Promise<{ group: ChatMlsGroup; invite: ChatCallInvite; deviceId: string }> {
	return createCallGroup(userId, source);
}

async function createCallGroup(
	userId: string,
	source: ChatKeyPackageSource,
): Promise<{ group: ChatMlsGroup; invite: ChatCallInvite; deviceId: string }> {
	const { record, group, mlsWelcome } = await createSealedChatGroup(userId, source, true);
	// Calls ring whichever devices are reachable; devices with no spare key package are simply left out.
	if (!mlsWelcome) throw new Error("The other person has not set up encrypted chat on any device yet.");
	return { group, invite: mlsWelcome, deviceId: record.deviceId };
}

/** Joins a call group from an invite, or returns null when the invite wasn't addressed to this device. */
export function joinChatCallGroup(
	userId: string,
	conversationId: string,
	invite: ChatCallInvite,
	callerUserId: string,
): Promise<{ group: ChatMlsGroup; deviceId: string } | null> {
	return joinCallGroup(userId, conversationSource(conversationId), invite, callerUserId);
}

/** Joins a party voice link from an invite, or returns null when the invite wasn't addressed to this device. */
export function joinPartyPeerGroup(
	userId: string,
	source: ChatKeyPackageSource,
	invite: ChatCallInvite,
	callerUserId: string,
): Promise<{ group: ChatMlsGroup; deviceId: string } | null> {
	return joinCallGroup(userId, source, invite, callerUserId);
}

async function joinCallGroup(
	userId: string,
	source: ChatKeyPackageSource,
	invite: ChatCallInvite,
	callerUserId: string,
): Promise<{ group: ChatMlsGroup; deviceId: string } | null> {
	const record = await initializeChatMlsDevice(userId);
	if (!record || record.status !== "active") return null;
	const recipient = invite.recipients.find((item) => item.deviceId === record.deviceId);
	if (!recipient || !record.keyPackages[recipient.keyPackageId]) return null;
	const directory = await source.list(true);
	const trustedDevices: ChatMlsTrustedDevice[] = directory.keyPackages.map((item) => ({
		userId: item.userId,
		deviceId: item.deviceId,
		keyPackage: decodeChatMlsKeyPackage(item.keyPackage),
	}));
	const group = await joinChatMlsGroup(
		decodeChatMlsWelcome(invite.welcome),
		packageForId(record, recipient.keyPackageId),
		decodeChatMlsRatchetTree(invite.ratchetTree),
		createChatMlsAuthenticationService(trustedDevices),
	);
	// The relay names the sender; the group must contain only that person and us, or the invite is forged.
	const members = chatMlsGroupUserIds(group);
	if (!members.has(callerUserId) || [...members].some((id) => id !== callerUserId && id !== userId)) {
		throw new Error("The call invite does not match the caller.");
	}
	return { group, deviceId: record.deviceId };
}

export async function exportChatMlsHistory(userId: string, deviceId: string, passphrase: string): Promise<string> {
	const entries = await exportChatMlsMessageCache(userId, deviceId);
	if (entries.length === 0) throw new Error("Open some encrypted chats on this device before exporting chat history.");
	return sealChatMlsTransfer(JSON.stringify({ format: "flixer-chat-history", version: 1, userId, entries }), passphrase);
}

export async function importChatMlsHistory(userId: string, deviceId: string, serialized: string, passphrase: string): Promise<number> {
	const plaintext = await openChatMlsTransfer(serialized, passphrase);
	let bundle: unknown;
	try {
		bundle = JSON.parse(plaintext);
	} catch (error) {
		throw new Error("The decrypted chat history file is invalid.", { cause: error });
	}
	if (
		typeof bundle !== "object" ||
		bundle === null ||
		!("format" in bundle) ||
		bundle.format !== "flixer-chat-history" ||
		!("version" in bundle) ||
		bundle.version !== 1 ||
		!("userId" in bundle) ||
		bundle.userId !== userId ||
		!("entries" in bundle) ||
		!Array.isArray(bundle.entries) ||
		bundle.entries.length > 100_000
	) {
		throw new Error("This encrypted chat history file is not valid for the signed-in account.");
	}
	const entries: Array<{ messageId: string; text: string }> = [];
	const seen = new Set<string>();
	for (const entry of bundle.entries) {
		if (
			typeof entry !== "object" ||
			entry === null ||
			!("messageId" in entry) ||
			typeof entry.messageId !== "string" ||
			!UUID_PATTERN.test(entry.messageId) ||
			!("text" in entry) ||
			typeof entry.text !== "string" ||
			entry.text.length === 0 ||
			entry.text.length > 2000 ||
			seen.has(entry.messageId)
		) {
			throw new Error("The encrypted chat history contains an invalid or duplicate message.");
		}
		seen.add(entry.messageId);
		entries.push({ messageId: entry.messageId, text: entry.text });
	}
	for (const entry of entries) {
		await storeChatMlsLocalValue(userId, deviceId, `message:${entry.messageId}`, entry.text);
	}
	return entries.length;
}
