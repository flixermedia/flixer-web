import { mocked } from "storybook/test";
import { formatMoney, getMyPayments, getOffers, getPaymentStatus, pickPrice, quotePayment, rentalRemainingMs, type ActivePaymentStatus, type MyPayments, type Offers, type Quote, type SavedCard } from "../api";
import { usePayments } from "../composables/usePayments";

export const savedCards: SavedCard[] = [
	{ id: "pm_1", brand: "visa", last4: "4242", expMonth: 8, expYear: 2028, isDefault: true },
	{ id: "pm_2", brand: "mastercard", last4: "5100", expMonth: 1, expYear: 2027, isDefault: false },
];

const inDays = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();

export const myPayments: MyPayments = {
	currency: "USD",
	methods: savedCards,
	subscriptions: [{ id: "sub_1", planId: "plan_1", planName: "Flixer Plus", interval: "month", status: "active", currency: "USD", amountMinor: 999, periodEnd: inDays(20), cancelAtPeriodEnd: false, graceUntil: null, active: true }],
	orders: [
		{ id: "ord_1", kind: "subscription", description: "Flixer Plus (monthly)", currency: "USD", totalMinor: 999, taxMinor: 0, discountMinor: 0, refundedMinor: 0, status: "paid", createdAt: inDays(-10) },
		{ id: "ord_2", kind: "rental", description: "Dune: Part Two (rental)", currency: "USD", totalMinor: 399, taxMinor: 32, discountMinor: 0, refundedMinor: 0, status: "failed", createdAt: inDays(-2) },
	],
	entitlements: [{ id: "ent_1", source: "rental", scope: { type: "item", ref: "item-1", label: "Dune: Part Two" }, expiresAt: inDays(1.5), rentalNotStarted: false, rentalHours: 48, claimUntil: null }],
};

export const offers: Offers = {
	currency: "USD",
	products: [
		{ id: "prod_buy", name: "Buy", description: null, kind: "buy", rentalHours: null, rentalStart: "purchase", scope: { type: "item", ref: "item-1" }, prices: [{ currency: "USD", amountMinor: 1499 }], price: { currency: "USD", amountMinor: 1499 } },
		{ id: "prod_rent", name: "Rent", description: null, kind: "rent", rentalHours: 48, rentalStart: "first_play", scope: { type: "item", ref: "item-1" }, prices: [{ currency: "USD", amountMinor: 399 }], price: { currency: "USD", amountMinor: 399 } },
	],
	plans: [{ id: "plan_1", name: "Flixer Plus", description: "Everything, any time", interval: "month", prices: [{ currency: "USD", amountMinor: 999 }], price: { currency: "USD", amountMinor: 999 }, scopes: [{ type: "all", ref: null }], trialDays: 7 }],
	registration: null,
};

export const quote: Quote = {
	kind: "purchase",
	description: "Dune: Part Two",
	currency: "USD",
	totals: { subtotalMinor: 1499, discountMinor: 0, taxMinor: 0, totalMinor: 1499 },
	couponCode: null,
	productId: "prod_buy",
	planId: null,
	trialDays: 0,
	recurring: null,
};

export const activePaymentStatus: ActivePaymentStatus = {
	enabled: true,
	provider: "stripe",
	client: { publishableKey: "pk_test_storybook" },
	currency: "USD",
	currencies: ["USD", "EUR"],
	tax: { enabled: false, inclusive: false, rates: [] },
	registration: { cardRequired: true, feeEnabled: true, mode: "one_time", prices: [{ currency: "USD", amountMinor: 500 }], price: { currency: "USD", amountMinor: 500 }, unlocks: "all", plan: null },
};

/** The api helpers that are plain functions get replaced by spies in Storybook; give the pure ones their real behaviour back. */
export function mockPaymentHelpers() {
	mocked(formatMoney).mockImplementation((amountMinor, currency, locale) => new Intl.NumberFormat(locale, { style: "currency", currency }).format(amountMinor / 100));
	mocked(pickPrice).mockImplementation((prices, currency, fallback) => (currency ? prices.find((price) => price.currency === currency) : undefined) ?? prices.find((price) => price.currency === fallback) ?? prices[0] ?? null);
	mocked(rentalRemainingMs).mockImplementation((endsAt, now = Date.now()) => (endsAt ? Math.max(0, Date.parse(endsAt) - now) : null));
}

/** Makes the shared payment status active (or off) and loads it into the usePayments singleton. */
export async function setPaymentStatus(status: ActivePaymentStatus | { enabled: false } = activePaymentStatus) {
	mocked(getPaymentStatus).mockResolvedValue(status);
	await usePayments().load(true);
}

export function mockPaymentData(data: { payments?: MyPayments; offers?: Offers; quote?: Quote } = {}) {
	mockPaymentHelpers();
	mocked(getMyPayments).mockResolvedValue(data.payments ?? myPayments);
	mocked(getOffers).mockResolvedValue(data.offers ?? offers);
	mocked(quotePayment).mockResolvedValue(data.quote ?? quote);
}

/**
 * Stand-in for the Stripe browser SDK so the card element is usable without network access. Returns a cleanup function.
 * It intercepts the SDK <script> tag instead of loading it from the CDN.
 */
export function installFakeStripe(options: { fail?: boolean } = {}) {
	const win = window as unknown as { Stripe?: unknown };
	const previous = win.Stripe;
	const head = document.head;
	const originalAppend = head.append;
	head.append = function (...nodes: (Node | string)[]) {
		const rest = nodes.filter((node) => !(node instanceof HTMLScriptElement && node.src.includes("js.stripe.com")));
		for (const node of nodes) {
			if (node instanceof HTMLScriptElement && node.src.includes("js.stripe.com")) setTimeout(() => (options.fail ? node.onerror?.(new Event("error")) : node.onload?.(new Event("load"))), 0);
		}
		return originalAppend.apply(this, rest);
	};
	win.Stripe = () => ({
		elements: () => ({
			create: () => {
				const handlers: Record<string, ((event: { complete?: boolean }) => void)[]> = {};
				return {
					mount(target: HTMLElement) {
						target.innerHTML = '<div class="flex flex-col gap-2 rounded border border-flixer-border bg-flixer-surface p-3 text-sm text-flixer-muted"><div class="rounded border border-flixer-border px-3 py-2">Card number — 4242 4242 4242 4242</div><div class="flex gap-2"><div class="flex-1 rounded border border-flixer-border px-3 py-2">MM / YY</div><div class="flex-1 rounded border border-flixer-border px-3 py-2">CVC</div></div></div>';
						setTimeout(() => {
							handlers.ready?.forEach((handler) => handler({}));
							handlers.change?.forEach((handler) => handler({ complete: true }));
						}, 50);
					},
					unmount() {},
					destroy() {},
					on(event: string, handler: (event: { complete?: boolean }) => void) {
						(handlers[event] ??= []).push(handler);
					},
				};
			},
		}),
		confirmSetup: async () => ({ setupIntent: { id: "seti_storybook", status: "succeeded" } }),
		handleNextAction: async () => ({ paymentIntent: { status: "succeeded" } }),
	});
	return () => {
		head.append = originalAppend;
		win.Stripe = previous;
	};
}
