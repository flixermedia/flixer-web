const DATABASE_NAME = "flixer-chat-mls";
const DATABASE_VERSION = 1;
const KEY_STORE = "vault-keys";
const VALUE_STORE = "encrypted-values";
const TRANSFER_ITERATIONS = 600_000;
const MAX_TRANSFER_BYTES = 20 * 1024 * 1024;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const keyPromises = new Map<string, Promise<CryptoKey>>();

interface EncryptedValue {
	id: string;
	iv: string;
	ciphertext: string;
}

interface TransferEnvelope {
	version: 1;
	salt: string;
	iv: string;
	ciphertext: string;
}

function bytesToBase64(bytes: Uint8Array): string {
	let binary = "";
	for (let index = 0; index < bytes.length; index += 0x8000) {
		binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
	}
	return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
	const binary = atob(value);
	return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
	const buffer = new ArrayBuffer(bytes.byteLength);
	new Uint8Array(buffer).set(bytes);
	return buffer;
}

function openDatabase(): Promise<IDBDatabase> {
	if (typeof indexedDB === "undefined") throw new Error("Encrypted chat storage is unavailable in this browser.");
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
		request.onupgradeneeded = () => {
			const database = request.result;
			if (!database.objectStoreNames.contains(KEY_STORE)) database.createObjectStore(KEY_STORE, { keyPath: "id" });
			if (!database.objectStoreNames.contains(VALUE_STORE)) database.createObjectStore(VALUE_STORE, { keyPath: "id" });
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(new Error("Could not open encrypted chat storage.", { cause: request.error }));
	});
}

async function readRecord<T>(storeName: string, id: string): Promise<T | undefined> {
	const database = await openDatabase();
	return new Promise((resolve, reject) => {
		const transaction = database.transaction(storeName, "readonly");
		const request = transaction.objectStore(storeName).get(id);
		request.onsuccess = () => resolve(request.result as T | undefined);
		request.onerror = () => reject(new Error("Could not read encrypted chat storage.", { cause: request.error }));
		transaction.oncomplete = () => database.close();
		transaction.onabort = () => {
			database.close();
			reject(new Error("Could not read encrypted chat storage.", { cause: transaction.error }));
		};
	});
}

async function readAllRecords<T>(storeName: string): Promise<T[]> {
	const database = await openDatabase();
	return new Promise((resolve, reject) => {
		const transaction = database.transaction(storeName, "readonly");
		const request = transaction.objectStore(storeName).getAll();
		request.onsuccess = () => resolve(request.result as T[]);
		request.onerror = () => reject(new Error("Could not read encrypted chat storage.", { cause: request.error }));
		transaction.oncomplete = () => database.close();
		transaction.onabort = () => {
			database.close();
			reject(new Error("Could not read encrypted chat storage.", { cause: transaction.error }));
		};
	});
}

async function writeRecord(storeName: string, record: { id: string } & Record<string, unknown>): Promise<void> {
	const database = await openDatabase();
	return new Promise((resolve, reject) => {
		const transaction = database.transaction(storeName, "readwrite");
		transaction.objectStore(storeName).put(record);
		transaction.oncomplete = () => {
			database.close();
			resolve();
		};
		transaction.onerror = () => {
			database.close();
			reject(new Error("Could not save encrypted chat storage.", { cause: transaction.error }));
		};
		transaction.onabort = () => {
			database.close();
			reject(new Error("Could not save encrypted chat storage.", { cause: transaction.error }));
		};
	});
}

async function saveVaultKeyIfMissing(vaultId: string, generatedKey: CryptoKey): Promise<CryptoKey> {
	const database = await openDatabase();
	return new Promise((resolve, reject) => {
		const transaction = database.transaction(KEY_STORE, "readwrite");
		const store = transaction.objectStore(KEY_STORE);
		const request = store.get(vaultId);
		let selectedKey = generatedKey;
		request.onsuccess = () => {
			const current = request.result as { id: string; key: CryptoKey } | undefined;
			if (current) {
				selectedKey = current.key;
			} else {
				store.add({ id: vaultId, key: generatedKey });
			}
		};
		request.onerror = () => {
			database.close();
			reject(new Error("Could not read the local chat encryption key.", { cause: request.error }));
		};
		transaction.oncomplete = () => {
			database.close();
			resolve(selectedKey);
		};
		transaction.onerror = () => {
			database.close();
			reject(new Error("Could not save the local chat encryption key.", { cause: transaction.error }));
		};
		transaction.onabort = () => {
			database.close();
			reject(new Error("Could not save the local chat encryption key.", { cause: transaction.error }));
		};
	});
}

async function getVaultKey(vaultId: string): Promise<CryptoKey> {
	let pending = keyPromises.get(vaultId);
	if (!pending) {
		pending = (async () => {
			const current = await readRecord<{ id: string; key: CryptoKey }>(KEY_STORE, vaultId);
			if (current) return current.key;
			const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
			return saveVaultKeyIfMissing(vaultId, key);
		})();
		keyPromises.set(vaultId, pending);
	}
	try {
		return await pending;
	} catch (error) {
		keyPromises.delete(vaultId);
		throw error;
	}
}

function storageId(userId: string, deviceId: string, entry: string): string {
	return JSON.stringify([userId, deviceId, entry]);
}

export async function storeChatMlsLocalValue(userId: string, deviceId: string, entry: string, value: string): Promise<void> {
	const id = storageId(userId, deviceId, entry);
	const key = await getVaultKey(storageId(userId, deviceId, "vault-key"));
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: toArrayBuffer(iv) }, key, toArrayBuffer(encoder.encode(value)));
	await writeRecord(VALUE_STORE, {
		id,
		iv: bytesToBase64(iv),
		ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
	});
}

export async function loadChatMlsLocalValue(userId: string, deviceId: string, entry: string): Promise<string | null> {
	const id = storageId(userId, deviceId, entry);
	const record = await readRecord<EncryptedValue>(VALUE_STORE, id);
	if (!record) return null;
	const key = await getVaultKey(storageId(userId, deviceId, "vault-key"));
	try {
		const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: toArrayBuffer(base64ToBytes(record.iv)) }, key, toArrayBuffer(base64ToBytes(record.ciphertext)));
		return decoder.decode(plaintext);
	} catch (error) {
		throw new Error("Saved chat encryption data could not be decrypted.", { cause: error });
	}
}

export async function exportChatMlsMessageCache(userId: string, deviceId: string): Promise<Array<{ messageId: string; text: string }>> {
	const key = await getVaultKey(storageId(userId, deviceId, "vault-key"));
	const records = await readAllRecords<EncryptedValue>(VALUE_STORE);
	const messages: Array<{ messageId: string; text: string }> = [];
	for (const record of records) {
		let identity: unknown;
		try {
			identity = JSON.parse(record.id);
		} catch (error) {
			throw new Error("Saved chat storage contains an invalid entry.", { cause: error });
		}
		if (!Array.isArray(identity) || identity[0] !== userId || identity[1] !== deviceId || typeof identity[2] !== "string" || !identity[2].startsWith("message:")) continue;
		try {
			const plaintext = await crypto.subtle.decrypt(
				{ name: "AES-GCM", iv: toArrayBuffer(base64ToBytes(record.iv)) },
				key,
				toArrayBuffer(base64ToBytes(record.ciphertext)),
			);
			messages.push({ messageId: identity[2].slice("message:".length), text: decoder.decode(plaintext) });
		} catch (error) {
			throw new Error("Saved chat history could not be decrypted for transfer.", { cause: error });
		}
	}
	return messages;
}

async function sealTransfer(plaintext: string, passphrase: string, minimumLength: number): Promise<string> {
	if (passphrase.trim().length < minimumLength) throw new Error(`Use a transfer passphrase with at least ${minimumLength} characters.`);
	if (encoder.encode(plaintext).byteLength > MAX_TRANSFER_BYTES) throw new Error("The encrypted chat history export is too large.");
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const material = await crypto.subtle.importKey("raw", toArrayBuffer(encoder.encode(passphrase)), "PBKDF2", false, ["deriveKey"]);
	const key = await crypto.subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", salt: toArrayBuffer(salt), iterations: TRANSFER_ITERATIONS }, material, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
	const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: toArrayBuffer(iv) }, key, toArrayBuffer(encoder.encode(plaintext)));
	const envelope: TransferEnvelope = {
		version: 1,
		salt: bytesToBase64(salt),
		iv: bytesToBase64(iv),
		ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
	};
	return JSON.stringify(envelope);
}

async function openTransfer(serialized: string, passphrase: string): Promise<string> {
	if (serialized.length > MAX_TRANSFER_BYTES * 2) throw new Error("The encrypted chat transfer is too large.");
	let envelope: TransferEnvelope;
	try {
		envelope = JSON.parse(serialized) as TransferEnvelope;
	} catch (error) {
		throw new Error("The encrypted chat transfer is invalid.", { cause: error });
	}
	if (envelope.version !== 1 || typeof envelope.salt !== "string" || typeof envelope.iv !== "string" || typeof envelope.ciphertext !== "string") {
		throw new Error("The encrypted chat transfer is invalid.");
	}
	const material = await crypto.subtle.importKey("raw", toArrayBuffer(encoder.encode(passphrase)), "PBKDF2", false, ["deriveKey"]);
	const key = await crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			hash: "SHA-256",
			salt: toArrayBuffer(base64ToBytes(envelope.salt)),
			iterations: TRANSFER_ITERATIONS,
		},
		material,
		{ name: "AES-GCM", length: 256 },
		false,
		["decrypt"],
	);
	try {
		const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: toArrayBuffer(base64ToBytes(envelope.iv)) }, key, toArrayBuffer(base64ToBytes(envelope.ciphertext)));
		return decoder.decode(plaintext);
	} catch (error) {
		throw new Error("The transfer passphrase is incorrect or the file was changed.", { cause: error });
	}
}

export function sealChatMlsTransfer(plaintext: string, passphrase: string): Promise<string> {
	return sealTransfer(plaintext, passphrase, 12);
}

export function sealChatMlsAccountBackup(plaintext: string, password: string): Promise<string> {
	return sealTransfer(plaintext, password, 1);
}

export function openChatMlsTransfer(serialized: string, passphrase: string): Promise<string> {
	return openTransfer(serialized, passphrase);
}

export function openChatMlsAccountBackup(serialized: string, password: string): Promise<string> {
	return openTransfer(serialized, password);
}

export async function restoreChatMlsMessageCache(
	userId: string,
	deviceId: string,
	entries: Array<{ messageId: string; text: string }>,
): Promise<void> {
	for (const entry of entries) {
		if (typeof entry.messageId !== "string" || !UUID_PATTERN.test(entry.messageId) || typeof entry.text !== "string" || entry.text.length === 0 || entry.text.length > 2000) {
			throw new Error("The encrypted chat history backup contains an invalid message.");
		}
		await storeChatMlsLocalValue(userId, deviceId, `message:${entry.messageId}`, entry.text);
	}
}
