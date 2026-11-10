import { afterEach, describe, expect, it, vi } from "vitest";
import { mountCardField } from "./paymentSdk";

describe("Square card field", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("mounts and tokenizes without sending the CSS font stack to Square", async () => {
		const attach = vi.fn().mockResolvedValue(undefined);
		const tokenize = vi.fn().mockResolvedValue({ status: "OK", token: "sandbox-token" });
		const destroy = vi.fn().mockResolvedValue(undefined);
		const card = vi.fn().mockResolvedValue({ attach, tokenize, destroy });
		const verifyBuyer = vi.fn().mockResolvedValue({ token: "verification-token" });
		const payments = vi.fn().mockResolvedValue({ card, verifyBuyer });
		const target = {} as HTMLElement;
		vi.stubGlobal("window", { Square: { payments } });
		vi.stubGlobal("getComputedStyle", () => ({
			getPropertyValue: (name: string) => name === "--font-sans" ? "'Segoe UI', system-ui, sans-serif" : "",
		}));
		vi.stubGlobal("document", {
			documentElement: {},
			createElement: () => ({}),
			head: { append: (script: { onload: () => void }) => script.onload() },
		});

		const onChange = vi.fn();
		const field = await mountCardField(
			target,
			{ provider: "square", clientSecret: null, client: { applicationId: "app", locationId: "location", environment: "sandbox" } },
			{ name: "Test", email: "test@example.com" },
			onChange,
		);
		expect(card).toHaveBeenCalledOnce();
		const options = card.mock.calls[0][0];
		expect(options.style.input).toEqual({ backgroundColor: "#14131d", color: "#f4f2fb", fontSize: "16px" });
		expect(options.style["input.is-focus"]).toEqual({ backgroundColor: "#14131d", color: "#f4f2fb" });
		expect(options.style["input.is-error"]).toEqual({ backgroundColor: "#14131d", color: "#f87171" });
		expect(options.style["input.is-focus::placeholder"]).toEqual({ color: "#9492a4" });
		expect(attach).toHaveBeenCalledWith(target);
		expect(onChange).toHaveBeenCalledWith(false);
		expect(await field.collect()).toEqual({ sourceId: "sandbox-token", verificationToken: "verification-token" });
		field.destroy();
		expect(destroy).toHaveBeenCalledOnce();
	});

	it("uses the light palette for Square input states when the light theme is active", async () => {
		const card = vi.fn().mockResolvedValue({ attach: vi.fn(), destroy: vi.fn() });
		vi.stubGlobal("window", { Square: { payments: vi.fn().mockResolvedValue({ card }) } });
		const colors: Record<string, string> = { "--color-flixer-surface": "#ffffff", "--color-flixer-text": "#1c1b29", "--color-flixer-muted": "#5f5d72" };
		vi.stubGlobal("getComputedStyle", () => ({ getPropertyValue: (name: string) => colors[name] ?? "" }));
		vi.stubGlobal("document", { documentElement: {}, createElement: () => ({}), head: { append: (script: { onload: () => void }) => script.onload() } });
		await mountCardField(
			{} as HTMLElement,
			{ provider: "square", clientSecret: null, client: { applicationId: "app", locationId: "location", environment: "sandbox" } },
			{},
			vi.fn(),
		);
		const style = card.mock.calls[0][0].style;
		expect(style.input.backgroundColor).toBe("#ffffff");
		expect(style["input.is-focus"]).toEqual({ backgroundColor: "#ffffff", color: "#1c1b29" });
		expect(style["input.is-error"].backgroundColor).toBe("#ffffff");
	});

	it.each(["rejected", "missing token"])("surfaces Square verification failures instead of submitting an unverified card (%s)", async (failure) => {
		const verifyBuyer = failure === "rejected" ? vi.fn().mockRejectedValue(new Error("cancelled")) : vi.fn().mockResolvedValue(null);
		const card = vi.fn().mockResolvedValue({ attach: vi.fn(), destroy: vi.fn(), tokenize: vi.fn().mockResolvedValue({ status: "OK", token: "sandbox-token" }) });
		vi.stubGlobal("window", { Square: { payments: vi.fn().mockResolvedValue({ card, verifyBuyer }) } });
		vi.stubGlobal("getComputedStyle", () => ({ getPropertyValue: () => "" }));
		vi.stubGlobal("document", { documentElement: {}, createElement: () => ({}), head: { append: (script: { onload: () => void }) => script.onload() } });
		const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		try {
			const field = await mountCardField(
				{} as HTMLElement,
				{ provider: "square", clientSecret: null, client: { applicationId: "app", locationId: "location", environment: "sandbox" } },
				{},
				vi.fn(),
			);
			await expect(field.collect()).rejects.toThrow("payment-verification");
			expect(verifyBuyer).toHaveBeenCalledOnce();
		} finally {
			warning.mockRestore();
		}
	});
});
