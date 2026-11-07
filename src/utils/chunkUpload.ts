export interface ChunkUploadOptions {
	chunkSize: number;
	maxBytes: number;
	concurrency?: number;
	retries?: number;
	signal?: AbortSignal;
	onProgress?: (uploadedBytes: number, totalBytes: number) => void;
	shouldRetry: (error: unknown) => boolean;
	sendChunk: (index: number, chunk: Blob, signal: AbortSignal) => Promise<void>;
}

function abortError(): DOMException {
	return new DOMException("Upload cancelled", "AbortError");
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		if (signal.aborted) {
			reject(abortError());
			return;
		}
		const timer = setTimeout(() => {
			signal.removeEventListener("abort", onAbort);
			resolve();
		}, ms);
		function onAbort() {
			clearTimeout(timer);
			reject(abortError());
		}
		signal.addEventListener("abort", onAbort, { once: true });
	});
}

/** Uploads bounded slices with limited concurrency and retries only failed chunks. */
export async function uploadChunks(file: Blob, options: ChunkUploadOptions): Promise<void> {
	const { chunkSize, maxBytes, sendChunk, shouldRetry, onProgress } = options;
	const concurrency = options.concurrency ?? 3;
	const retries = options.retries ?? 3;
	if (!Number.isSafeInteger(chunkSize) || chunkSize < 1 || !Number.isSafeInteger(maxBytes) || maxBytes < 1 || !Number.isSafeInteger(concurrency) || concurrency < 1 || concurrency > 5 || !Number.isSafeInteger(retries) || retries < 0 || retries > 10) {
		throw new Error("Invalid upload options.");
	}
	if (file.size < 1 || file.size > maxBytes) throw new Error("Invalid upload size.");

	const controller = new AbortController();
	const cancel = () => controller.abort();
	if (options.signal?.aborted) throw abortError();
	options.signal?.addEventListener("abort", cancel, { once: true });
	const totalChunks = Math.ceil(file.size / chunkSize);
	let next = 0;
	let uploaded = 0;
	let failure: unknown;
	let hasFailure = false;

	async function worker() {
		while (!controller.signal.aborted) {
			const index = next++;
			if (index >= totalChunks) return;
			const chunk = file.slice(index * chunkSize, Math.min(file.size, (index + 1) * chunkSize));
			for (let attempt = 0; ; attempt++) {
				try {
					await sendChunk(index, chunk, controller.signal);
				} catch (error) {
					if (controller.signal.aborted) return;
					if (attempt >= retries || !shouldRetry(error)) {
						failure = error;
						hasFailure = true;
						controller.abort();
						return;
					}
					try {
						await wait(Math.min(500 * 2 ** attempt, 10_000), controller.signal);
					} catch (error) {
						if (!controller.signal.aborted) throw error;
						return;
					}
					continue;
				}
				if (controller.signal.aborted) return;
				uploaded += chunk.size;
				onProgress?.(uploaded, file.size);
				break;
			}
		}
	}

	try {
		await Promise.all(
			Array.from({ length: Math.min(concurrency, totalChunks) }, () =>
				worker().catch((error: unknown) => {
					if (!controller.signal.aborted) {
						failure = error;
						hasFailure = true;
						controller.abort();
					}
				}),
			),
		);
		if (hasFailure) throw failure;
		if (controller.signal.aborted) throw abortError();
	} finally {
		options.signal?.removeEventListener("abort", cancel);
	}
}
