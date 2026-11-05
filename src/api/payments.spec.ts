import axios, { AxiosError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("./client", () => ({ api: { get: mocks.get } }));

import { formatMoney, getOrderReceiptUrl, isPaymentRequired, listPaymentCurrencies, minorDigits, minorToInput, parseMinor, pickPrice, registerCurrencyDigits, rentalRemainingMs } from "./payments";

describe("payment money helpers", () => {
	it("knows how many minor units make a whole currency unit", () => {
		expect(minorDigits("USD")).toBe(2);
		expect(minorDigits("JPY")).toBe(0);
	});

	it("parses typed prices into minor units", () => {
		expect(parseMinor("4.99", "USD")).toBe(499);
		expect(parseMinor("4,5", "EUR")).toBe(450);
		expect(parseMinor("500", "JPY")).toBe(500);
		expect(parseMinor("", "USD")).toBeNull();
		expect(parseMinor("-1", "USD")).toBeNull();
		expect(parseMinor("abc", "USD")).toBeNull();
	});

	it("round-trips amounts for editing and formats them for display", () => {
		expect(minorToInput(499, "USD")).toBe("4.99");
		expect(minorToInput(500, "JPY")).toBe("500");
		expect(formatMoney(499, "USD", "en")).toBe("$4.99");
	});

	it("prefers the requested currency, then the server currency, then the first price", () => {
		const prices = [
			{ currency: "EUR", amountMinor: 400 },
			{ currency: "USD", amountMinor: 500 },
		];
		expect(pickPrice(prices, "EUR", "USD")?.amountMinor).toBe(400);
		expect(pickPrice(prices, "GBP", "USD")?.amountMinor).toBe(500);
		expect(pickPrice(prices, null, "GBP")?.amountMinor).toBe(400);
		expect(pickPrice([], null, "USD")).toBeNull();
	});
});

describe("rentals and paywall errors", () => {
	it("reports the time left on a rental", () => {
		expect(rentalRemainingMs(null)).toBeNull();
		expect(rentalRemainingMs("not a date")).toBeNull();
		expect(rentalRemainingMs("2026-01-01T01:00:00Z", Date.parse("2026-01-01T00:00:00Z"))).toBe(3_600_000);
		expect(rentalRemainingMs("2026-01-01T00:00:00Z", Date.parse("2026-01-02T00:00:00Z"))).toBe(0);
	});

	it("recognises HTTP 402 as a paywall", () => {
		const paywall = new AxiosError("Payment Required", "ERR_BAD_REQUEST", undefined, undefined, { status: 402, statusText: "", headers: {}, config: {} as never, data: {} });
		const missing = new AxiosError("Not Found", "ERR_BAD_REQUEST", undefined, undefined, { status: 404, statusText: "", headers: {}, config: {} as never, data: {} });
		expect(axios.isAxiosError(paywall)).toBe(true);
		expect(isPaymentRequired(paywall)).toBe(true);
		expect(isPaymentRequired(missing)).toBe(false);
		expect(isPaymentRequired(new Error("x"))).toBe(false);
	});
});

describe("server currency digits", () => {
	it("override the browser's data for conversion between major and minor units", () => {
		registerCurrencyDigits([
			{ code: "KRW", digits: 0 },
			{ code: "USD", digits: 2 },
		]);
		expect(minorDigits("KRW")).toBe(0);
		expect(parseMinor("1500", "KRW")).toBe(1500);
		expect(parseMinor("12.345", "USD")).toBe(1235);
		expect(minorToInput(1500, "KRW")).toBe("1500");
		expect(minorToInput(5, "USD")).toBe("0.05");
		registerCurrencyDigits([{ code: "XTS", digits: 3 }]);
		expect(parseMinor("1.234", "XTS")).toBe(1234);
		expect(formatMoney(1234, "XTS", "en")).toContain("1.234");
	});
});

describe("payment api calls", () => {
	beforeEach(() => mocks.get.mockReset());

	it("fetches an order receipt url", async () => {
		mocks.get.mockResolvedValue({ data: { url: "https://pay.example/r/1" } });
		await expect(getOrderReceiptUrl("o 1")).resolves.toBe("https://pay.example/r/1");
		expect(mocks.get).toHaveBeenCalledWith("/payments/orders/o%201/receipt");
	});

	it("lists currencies for a provider, or all when none is given", async () => {
		mocks.get.mockResolvedValue({ data: [{ code: "USD", name: "US dollar", digits: 2, square: true }] });
		await expect(listPaymentCurrencies("square")).resolves.toHaveLength(1);
		expect(mocks.get).toHaveBeenCalledWith("/admin/payments/currencies", { params: { provider: "square" } });
		await listPaymentCurrencies(null);
		expect(mocks.get).toHaveBeenLastCalledWith("/admin/payments/currencies", { params: { provider: undefined } });
	});
});
