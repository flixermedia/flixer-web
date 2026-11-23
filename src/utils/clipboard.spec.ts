import { afterEach, describe, expect, it, vi } from "vitest";
import { copyToClipboard } from "./clipboard";

vi.mock("@capacitor/core", () => ({
	Capacitor: {
		isNativePlatform: vi.fn().mockReturnValue(false),
	},
}));

describe("copyToClipboard", () => {
	const originalNavigator = globalThis.navigator;
	const originalDocument = globalThis.document;

	afterEach(() => {
		Object.defineProperty(globalThis, "navigator", {
			value: originalNavigator,
			configurable: true,
			writable: true,
		});
		Object.defineProperty(globalThis, "document", {
			value: originalDocument,
			configurable: true,
			writable: true,
		});
		vi.restoreAllMocks();
	});

	it("uses navigator.clipboard.writeText when available and successful", async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(globalThis, "navigator", {
			value: { clipboard: { writeText } },
			configurable: true,
			writable: true,
		});

		const result = await copyToClipboard("https://flixer.example/invite/123");
		expect(result).toBe(true);
		expect(writeText).toHaveBeenCalledWith("https://flixer.example/invite/123");
	});

	it("falls back to document.execCommand when navigator.clipboard is undefined (e.g. HTTP on LAN)", async () => {
		Object.defineProperty(globalThis, "navigator", {
			value: {},
			configurable: true,
			writable: true,
		});

		const dummyTextArea = {
			value: "",
			style: {},
			setAttribute: vi.fn(),
			focus: vi.fn(),
			select: vi.fn(),
			setSelectionRange: vi.fn(),
		};

		const mockDocument = {
			createElement: vi.fn().mockReturnValue(dummyTextArea),
			body: {
				appendChild: vi.fn(),
				removeChild: vi.fn(),
			},
			execCommand: vi.fn().mockReturnValue(true),
		};

		Object.defineProperty(globalThis, "document", {
			value: mockDocument,
			configurable: true,
			writable: true,
		});

		const result = await copyToClipboard("http://172.16.0.19:8080/invite/TEST1234");
		expect(result).toBe(true);
		expect(mockDocument.createElement).toHaveBeenCalledWith("textarea");
		expect(mockDocument.body.appendChild).toHaveBeenCalledWith(dummyTextArea);
		expect(mockDocument.execCommand).toHaveBeenCalledWith("copy");
		expect(mockDocument.body.removeChild).toHaveBeenCalledWith(dummyTextArea);
	});

	it("falls back to document.execCommand when navigator.clipboard.writeText rejects", async () => {
		const writeText = vi.fn().mockRejectedValue(new Error("NotAllowedError"));
		Object.defineProperty(globalThis, "navigator", {
			value: { clipboard: { writeText } },
			configurable: true,
			writable: true,
		});

		const dummyTextArea = {
			value: "",
			style: {},
			setAttribute: vi.fn(),
			focus: vi.fn(),
			select: vi.fn(),
			setSelectionRange: vi.fn(),
		};

		const mockDocument = {
			createElement: vi.fn().mockReturnValue(dummyTextArea),
			body: {
				appendChild: vi.fn(),
				removeChild: vi.fn(),
			},
			execCommand: vi.fn().mockReturnValue(true),
		};

		Object.defineProperty(globalThis, "document", {
			value: mockDocument,
			configurable: true,
			writable: true,
		});

		const result = await copyToClipboard("https://example.com");
		expect(result).toBe(true);
		expect(writeText).toHaveBeenCalled();
		expect(mockDocument.execCommand).toHaveBeenCalledWith("copy");
	});

	it("returns false when both clipboard and execCommand fail or throw", async () => {
		Object.defineProperty(globalThis, "navigator", {
			value: {},
			configurable: true,
			writable: true,
		});

		const mockDocument = {
			createElement: vi.fn().mockImplementation(() => {
				throw new Error("DOM error");
			}),
		};

		Object.defineProperty(globalThis, "document", {
			value: mockDocument,
			configurable: true,
			writable: true,
		});

		const result = await copyToClipboard("https://example.com");
		expect(result).toBe(false);
	});
});
