import { describe, expect, it, vi } from "vitest";
import { uploadChunks } from "./chunkUpload";

describe("uploadChunks", () => {
	it("slices a file, bounds concurrency and reports only completed bytes", async () => {
		const sent = new Map<number, string>();
		const progress: number[] = [];
		let active = 0;
		let maxActive = 0;
		await uploadChunks(new Blob(["abcdefghij"]), {
			chunkSize: 4,
			maxBytes: 10,
			concurrency: 2,
			shouldRetry: () => false,
			sendChunk: async (index, chunk) => {
				active++;
				maxActive = Math.max(maxActive, active);
				await new Promise((resolve) => setTimeout(resolve, 1));
				sent.set(index, await chunk.text());
				active--;
			},
			onProgress: (done) => progress.push(done),
		});
		expect(maxActive).toBe(2);
		expect([...sent.entries()].sort(([a], [b]) => a - b)).toEqual([
			[0, "abcd"],
			[1, "efgh"],
			[2, "ij"],
		]);
		expect(progress.at(-1)).toBe(10);
		expect(progress.every((value, index) => index === 0 || value > progress[index - 1]!)).toBe(true);
	});

	it("retries the failed chunk without double-counting progress", async () => {
		vi.useFakeTimers();
		try {
			const sendChunk = vi.fn().mockRejectedValueOnce(new Error("temporary")).mockResolvedValue(undefined);
			const progress = vi.fn();
			const result = uploadChunks(new Blob(["abcd"]), { chunkSize: 4, maxBytes: 4, sendChunk, onProgress: progress, shouldRetry: () => true });
			await vi.runAllTimersAsync();
			await result;
			expect(sendChunk).toHaveBeenCalledTimes(2);
			expect(progress).toHaveBeenCalledOnce();
			expect(progress).toHaveBeenCalledWith(4, 4);
		} finally {
			vi.useRealTimers();
		}
	});

	it("propagates permanent failures and stops scheduling new chunks", async () => {
		const sendChunk = vi.fn().mockRejectedValue(new Error("rejected"));
		await expect(uploadChunks(new Blob(["abcdefgh"]), { chunkSize: 2, maxBytes: 8, concurrency: 1, sendChunk, shouldRetry: () => false })).rejects.toThrow("rejected");
		expect(sendChunk).toHaveBeenCalledOnce();
	});

	it("enforces size and cancellation before sending", async () => {
		const sendChunk = vi.fn();
		await expect(uploadChunks(new Blob(["abc"]), { chunkSize: 2, maxBytes: 2, sendChunk, shouldRetry: () => false })).rejects.toThrow("Invalid upload size");
		const controller = new AbortController();
		controller.abort();
		await expect(uploadChunks(new Blob(["ab"]), { chunkSize: 2, maxBytes: 2, signal: controller.signal, sendChunk, shouldRetry: () => false })).rejects.toMatchObject({ name: "AbortError" });
		expect(sendChunk).not.toHaveBeenCalled();
	});

	it("accepts 100 MiB and rejects 100 MiB plus one byte", async () => {
		const maxBytes = 100 * 1024 * 1024;
		const file = new Blob(["x"]);
		Object.defineProperty(file, "size", { value: maxBytes, configurable: true });
		const sendChunk = vi.fn().mockRejectedValue(new Error("sent"));
		await expect(uploadChunks(file, { chunkSize: 5 * 1024 * 1024, maxBytes, concurrency: 1, sendChunk, shouldRetry: () => false })).rejects.toThrow("sent");
		Object.defineProperty(file, "size", { value: maxBytes + 1 });
		await expect(uploadChunks(file, { chunkSize: 5 * 1024 * 1024, maxBytes, sendChunk, shouldRetry: () => false })).rejects.toThrow("Invalid upload size");
		expect(sendChunk).toHaveBeenCalledOnce();
	});

	it("surfaces progress callback failures without retrying an uploaded chunk", async () => {
		const sendChunk = vi.fn().mockResolvedValue(undefined);
		await expect(
			uploadChunks(new Blob(["abcd"]), {
				chunkSize: 4,
				maxBytes: 4,
				sendChunk,
				shouldRetry: () => true,
				onProgress: () => {
					throw new Error("progress failed");
				},
			}),
		).rejects.toThrow("progress failed");
		expect(sendChunk).toHaveBeenCalledOnce();
	});
});
