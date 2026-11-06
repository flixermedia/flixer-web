import { mocked } from "storybook/test";
import { formatMoney, minorDigits, minorToInput, parseMinor, type AdminSubscription, type Plan, type Product } from "../api";

/** The currency helpers in src/api/payments.ts are auto-mocked in Storybook; this gives them their real behaviour back. */
export function restorePaymentHelpers() {
	const digits = (currency: string) => (currency === "JPY" ? 0 : 2);
	mocked(minorDigits).mockImplementation(digits);
	mocked(formatMoney).mockImplementation((amountMinor, currency, locale) => new Intl.NumberFormat(locale, { style: "currency", currency }).format(amountMinor / 10 ** digits(currency)));
	mocked(parseMinor).mockImplementation((text, currency) => {
		const value = Number(text.trim().replace(",", "."));
		return !text.trim() || !Number.isFinite(value) || value < 0 ? null : Math.round(value * 10 ** digits(currency));
	});
	mocked(minorToInput).mockImplementation((amountMinor, currency) => (amountMinor / 10 ** digits(currency)).toFixed(digits(currency)));
}

export const plansFixture: Plan[] = [
	{
		id: "plan-1",
		name: "Flixer Plus",
		description: "All movies and TV shows",
		interval: "month",
		prices: [
			{ currency: "USD", amountMinor: 899 },
			{ currency: "EUR", amountMinor: 799 },
		],
		scopes: [
			{ type: "kind", ref: "movies", label: "Movies" },
			{ type: "kind", ref: "tv", label: "TV" },
		],
		trialDays: 7,
		active: true,
		sortOrder: 0,
	},
	{ id: "plan-2", name: "Everything (yearly)", description: null, interval: "year", prices: [{ currency: "USD", amountMinor: 8900 }], scopes: [{ type: "all", ref: null }], trialDays: 0, active: true, sortOrder: 1 },
];

export const productsFixture: Product[] = [
	{ id: "prod-1", name: "Night of the Comet (rental)", description: "48 hour rental", kind: "rent", scope: { type: "item", ref: "item-1", label: "Night of the Comet (1984)" }, prices: [{ currency: "USD", amountMinor: 399 }], rentalHours: 48, rentalStart: "first_play", requiresPurchase: false, active: true, sortOrder: 0 },
	{ id: "prod-2", name: "All music", description: null, kind: "buy", scope: { type: "kind", ref: "music", label: "Music" }, prices: [{ currency: "USD", amountMinor: 1999 }], rentalHours: null, rentalStart: "purchase", requiresPurchase: false, active: false, sortOrder: 1 },
];

const future = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();

export const adminSubscriptionsFixture: AdminSubscription[] = [
	{ id: "sub-1", userId: "u1", user: { id: "u1", username: "ada", displayName: "Ada Lovelace" }, planId: "plan-1", planName: "Flixer Plus", status: "active", currency: "USD", amountMinor: 899, periodEnd: future(18), cancelAtPeriodEnd: false, graceUntil: null },
	{ id: "sub-2", userId: "u2", user: { id: "u2", username: "grace", displayName: null }, planId: "plan-2", planName: "Everything (yearly)", status: "trialing", currency: "USD", amountMinor: 8900, periodEnd: future(5), cancelAtPeriodEnd: false, graceUntil: null },
	{ id: "sub-3", userId: "u3", user: { id: "u3", username: "linus", displayName: "Linus" }, planId: "plan-1", planName: "Flixer Plus", status: "past_due", currency: "EUR", amountMinor: 799, periodEnd: future(-2), cancelAtPeriodEnd: true, graceUntil: future(3) },
	{ id: "sub-4", userId: "u4", user: { id: "u4", username: "ken", displayName: "Ken" }, planId: "plan-1", planName: "Flixer Plus", status: "canceled", currency: "USD", amountMinor: 899, periodEnd: future(-30), cancelAtPeriodEnd: false, graceUntil: null },
];
