import type { AdminOrder, Coupon, CurrencyInfo, Grant, PaymentConfig, PaymentStats } from "../api";

const daysFromNow = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();

export const couponsFixture: Coupon[] = [
	{ id: "coupon-1", code: "WELCOME10", description: "Welcome discount", percentOff: 10, amountOff: null, maxRedemptions: 100, redeemed: 12, expiresAt: daysFromNow(30), productIds: [], planIds: [], active: true },
	{
		id: "coupon-2",
		code: "FIVEOFF",
		description: null,
		percentOff: null,
		amountOff: [
			{ currency: "USD", amountMinor: 500 },
			{ currency: "EUR", amountMinor: 450 },
		],
		maxRedemptions: null,
		redeemed: 3,
		expiresAt: null,
		productIds: ["prod-1"],
		planIds: ["plan-1"],
		active: false,
	},
];

const ada = { id: "u1", username: "ada", displayName: "Ada Lovelace" };
const grace = { id: "u2", username: "grace", displayName: null };

export const adminOrdersFixture: AdminOrder[] = [
	{ id: "ord-1", kind: "subscription", description: "Flixer Plus (monthly)", currency: "USD", totalMinor: 899, taxMinor: 0, discountMinor: 0, refundedMinor: 0, status: "paid", createdAt: daysFromNow(-1), userId: "u1", user: ada, provider: "stripe", failure: null, subtotalMinor: 899, couponCode: null },
	{ id: "ord-2", kind: "rental", description: "Night of the Comet (rental)", currency: "USD", totalMinor: 359, taxMinor: 0, discountMinor: 40, refundedMinor: 0, status: "pending", createdAt: daysFromNow(-2), userId: "u2", user: grace, provider: "stripe", failure: null, subtotalMinor: 399, couponCode: "WELCOME10" },
	{ id: "ord-3", kind: "purchase", description: "All music", currency: "EUR", totalMinor: 1999, taxMinor: 0, discountMinor: 0, refundedMinor: 0, status: "failed", createdAt: daysFromNow(-3), userId: "u2", user: grace, provider: "square", failure: "Card declined", subtotalMinor: 1999, couponCode: null },
	{ id: "ord-4", kind: "purchase", description: "All music", currency: "USD", totalMinor: 1999, taxMinor: 0, discountMinor: 0, refundedMinor: 500, status: "partially_refunded", createdAt: daysFromNow(-9), userId: "u1", user: ada, provider: "stripe", failure: null, subtotalMinor: 1999, couponCode: null },
];

export const grantsFixture: Grant[] = [
	{ id: "grant-1", userId: "u1", source: "admin", scope: { type: "all", ref: null }, expiresAt: null, createdAt: daysFromNow(-10) },
	{ id: "grant-2", userId: "u1", source: "admin", scope: { type: "item", ref: "item-1", label: "Night of the Comet (1984)" }, expiresAt: daysFromNow(2), createdAt: daysFromNow(-1) },
];

export const currenciesFixture: CurrencyInfo[] = [
	{ code: "USD", name: "US Dollar", digits: 2, square: true },
	{ code: "EUR", name: "Euro", digits: 2, square: true },
	{ code: "JPY", name: "Japanese Yen", digits: 0, square: true },
];

export const paymentConfigFixture: PaymentConfig = {
	enabled: true,
	provider: "stripe",
	currency: "USD",
	currencies: ["USD", "EUR"],
	graceDays: 3,
	enabledAt: daysFromNow(-20),
	grandfatherExisting: true,
	registration: { enabled: false, mode: "one_time", prices: [{ currency: "USD", amountMinor: 500 }], planId: null, unlocks: "all", scopes: [] },
	tax: { enabled: true, inclusive: false, rates: [{ name: "VAT", percent: 20 }] },
	stripe: { publishableKey: "pk_test_storybook", secretKey: "********", webhookSecret: "" },
	square: { environment: "sandbox", applicationId: "", locationId: "", accessToken: "", signatureKey: "", webhookUrl: "" },
};

export const paymentStatsFixture: PaymentStats = {
	revenue30d: [
		{ currency: "USD", amountMinor: 125_000, orders: 42 },
		{ currency: "EUR", amountMinor: 38_000, orders: 11 },
	],
	subscriptions: [
		{ status: "active", count: 31 },
		{ status: "trialing", count: 4 },
		{ status: "past_due", count: 2 },
	],
	failed30d: 3,
};
