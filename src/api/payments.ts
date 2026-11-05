/** Payments: provider status, cards, checkout, locked-content offers, and the administrator's catalogue and sales tools. */
import axios from "axios";
import { api } from "./client";
import type { AuthResult, VerificationPending } from "./auth";

export type PaymentProviderId = "stripe" | "square";
export type ContentKind = "movies" | "tv" | "music" | "guide";
export type ScopeType = "all" | "kind" | "item" | "artist";
export type RegistrationMode = "one_time" | "subscription";
export type RegistrationUnlocks = "all" | "scopes" | "none";
export type PlanInterval = "month" | "year";
export type RentalStart = "purchase" | "first_play";
export type ProductKind = "buy" | "rent";
export type OrderKind = "registration" | "purchase" | "rental" | "subscription";
export type OrderStatus = "pending" | "requires_action" | "paid" | "failed" | "refunded" | "partially_refunded";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "expired";

export const CONTENT_KINDS: ContentKind[] = ["movies", "tv", "music", "guide"];

export interface Price {
	currency: string;
	amountMinor: number;
}

/** What a product, plan or registration unlocks. An `item` scope covers the item and everything below it. */
export interface ContentScope {
	type: ScopeType;
	ref: string | null;
	label?: string;
}

export interface TaxRate {
	name: string;
	percent: number;
}

export interface TaxSettings {
	enabled: boolean;
	inclusive: boolean;
	rates: TaxRate[];
}

export interface StripeClientSettings {
	publishableKey: string;
}

export interface SquareClientSettings {
	applicationId: string;
	locationId: string;
	environment: "sandbox" | "production";
}

export interface PublicPlan {
	id: string;
	name: string;
	description: string | null;
	interval: PlanInterval;
	prices: Price[];
	price: Price | null;
	scopes: ContentScope[];
	trialDays: number;
}

export type PaymentStatus =
	| { enabled: false }
	| {
			enabled: true;
			provider: PaymentProviderId;
			client: StripeClientSettings | SquareClientSettings | null;
			currency: string;
			currencies: string[];
			tax: TaxSettings;
			registration: {
				cardRequired: boolean;
				feeEnabled: boolean;
				mode: RegistrationMode;
				prices: Price[];
				price: Price | null;
				unlocks: RegistrationUnlocks;
				plan: PublicPlan | null;
			};
	  };

export type ActivePaymentStatus = Extract<PaymentStatus, { enabled: true }>;

/** What the card element needs to mount; `clientSecret` is only set for Stripe. */
export interface CardSetup {
	provider: PaymentProviderId;
	clientSecret: string | null;
	client: StripeClientSettings | SquareClientSettings | null;
}

export interface SignupSetup extends CardSetup {
	setupToken: string;
}

/** The result of the browser collecting a card: a confirmed Stripe SetupIntent or a Square card token. */
export interface CardResult {
	setupIntentId?: string;
	sourceId?: string;
	verificationToken?: string;
}

export interface SignupPayment extends CardResult {
	setupToken: string;
	couponCode?: string;
	currency?: string;
}

export interface SavedCard {
	id: string;
	brand: string;
	last4: string;
	expMonth: number;
	expYear: number;
	isDefault: boolean;
}

export interface MySubscription {
	id: string;
	planId: string;
	planName: string;
	interval: PlanInterval;
	status: SubscriptionStatus;
	currency: string;
	amountMinor: number;
	periodEnd: string;
	cancelAtPeriodEnd: boolean;
	graceUntil: string | null;
	active: boolean;
}

export interface MyOrder {
	id: string;
	kind: OrderKind;
	description: string;
	currency: string;
	totalMinor: number;
	taxMinor: number;
	discountMinor: number;
	refundedMinor: number;
	status: OrderStatus;
	createdAt: string;
}

export interface MyEntitlement {
	id: string;
	source: string;
	scope: ContentScope;
	expiresAt: string | null;
	rentalNotStarted: boolean;
	rentalHours: number | null;
	claimUntil: string | null;
}

export interface MyPayments {
	currency: string;
	methods: SavedCard[];
	subscriptions: MySubscription[];
	orders: MyOrder[];
	entitlements: MyEntitlement[];
}

export interface OfferProduct {
	id: string;
	name: string;
	description: string | null;
	kind: ProductKind;
	rentalHours: number | null;
	rentalStart: RentalStart;
	scope: ContentScope;
	prices: Price[];
	price: Price | null;
}

export interface Offers {
	currency: string;
	products: OfferProduct[];
	plans: PublicPlan[];
	registration: { prices: Price[]; price: Price | null } | null;
}

export interface LockState {
	locked: boolean;
	rentalEndsAt?: string | null;
}

export interface LockStates {
	enabled: boolean;
	items: Record<string, LockState>;
}

export interface CheckoutRequest {
	productId?: string;
	planId?: string;
	registration?: boolean;
	couponCode?: string;
	currency?: string;
	paymentMethodId?: string;
}

export interface Quote {
	kind: OrderKind;
	description: string;
	currency: string;
	totals: { subtotalMinor: number; discountMinor: number; taxMinor: number; totalMinor: number };
	couponCode: string | null;
	productId: string | null;
	planId: string | null;
	trialDays: number;
	recurring: { amountMinor: number; interval: PlanInterval } | null;
}

export interface CheckoutResult {
	status: "paid" | "requires_action" | "failed";
	orderId: string;
	clientSecret?: string;
	error?: string;
}

export interface PaymentConfig {
	enabled: boolean;
	provider: PaymentProviderId | null;
	currency: string;
	/** Currencies customers may pay in; always includes `currency`. */
	currencies: string[];
	graceDays: number;
	enabledAt: string | null;
	grandfatherExisting: boolean;
	registration: {
		enabled: boolean;
		mode: RegistrationMode;
		prices: Price[];
		planId: string | null;
		unlocks: RegistrationUnlocks;
		scopes: ContentScope[];
	};
	tax: TaxSettings;
	stripe: { publishableKey: string; secretKey: string; webhookSecret: string };
	square: { environment: "sandbox" | "production"; applicationId: string; locationId: string; accessToken: string; signatureKey: string; webhookUrl: string };
}

export interface CurrencyInfo {
	code: string;
	name: string;
	/** Digits after the decimal point; amounts are stored as whole units of 10^-digits. */
	digits: number;
	/** Whether Square can settle this currency. */
	square: boolean;
}

export type PaymentConfigUpdate = Partial<Omit<PaymentConfig, "registration" | "stripe" | "square" | "tax" | "enabledAt">> & {
	registration?: Partial<PaymentConfig["registration"]>;
	tax?: Partial<TaxSettings>;
	stripe?: Partial<PaymentConfig["stripe"]>;
	square?: Partial<PaymentConfig["square"]>;
};

export interface PaymentStats {
	revenue30d: { currency: string; amountMinor: number; orders: number }[];
	subscriptions: { status: SubscriptionStatus; count: number }[];
	failed30d: number;
}

export interface Product {
	id: string;
	name: string;
	description: string | null;
	kind: ProductKind;
	scope: ContentScope;
	prices: Price[];
	rentalHours: number | null;
	rentalStart: RentalStart;
	requiresPurchase: boolean;
	active: boolean;
	sortOrder: number;
}

export type ProductInput = Omit<Product, "id">;

export interface Plan {
	id: string;
	name: string;
	description: string | null;
	interval: PlanInterval;
	prices: Price[];
	scopes: ContentScope[];
	trialDays: number;
	active: boolean;
	sortOrder: number;
}

export type PlanInput = Omit<Plan, "id">;

export interface Coupon {
	id: string;
	code: string;
	description: string | null;
	percentOff: number | null;
	amountOff: Price[] | null;
	maxRedemptions: number | null;
	redeemed: number;
	expiresAt: string | null;
	productIds: string[];
	planIds: string[];
	active: boolean;
}

export type CouponInput = Omit<Coupon, "id" | "redeemed">;

export interface PaymentUserRef {
	id: string;
	username: string;
	displayName: string | null;
}

export interface AdminOrder extends MyOrder {
	userId: string;
	user: PaymentUserRef;
	provider: string;
	failure: string | null;
	subtotalMinor: number;
	couponCode: string | null;
}

export interface AdminSubscription {
	id: string;
	userId: string;
	user: PaymentUserRef;
	planId: string;
	planName: string;
	status: SubscriptionStatus;
	currency: string;
	amountMinor: number;
	periodEnd: string;
	cancelAtPeriodEnd: boolean;
	graceUntil: string | null;
}

export type AccountLevel = "off" | "admin" | "grandfathered" | "everything" | "partial" | "none";

export interface AdminUserPayments extends MyPayments {
	level: AccountLevel;
	signupPending: boolean;
	role: string;
}

export interface Grant {
	id: string;
	userId: string;
	source: string;
	scope: ContentScope;
	expiresAt: string | null;
	createdAt: string;
}

export interface ScopeSearchItem {
	id: string;
	title: string;
	type: string;
	year: number | null;
	seasonNumber: number | null;
	episodeNumber: number | null;
}

export interface ScopeSearchResult {
	items: ScopeSearchItem[];
	artists: string[];
}

/** True when the server refused something because it needs to be bought, rented or unlocked. */
export function isPaymentRequired(error: unknown): boolean {
	return axios.isAxiosError(error) && error.response?.status === 402;
}

/** How many minor units make a whole unit of this currency (100 for USD, 1 for JPY). */
const knownDigits = new Map<string, number>();

/** Remembers the server's digit counts so they win over the browser's currency data. */
export function registerCurrencyDigits(currencies: Pick<CurrencyInfo, "code" | "digits">[]) {
	for (const currency of currencies) knownDigits.set(currency.code, currency.digits);
}

export function minorDigits(currency: string): number {
	const known = knownDigits.get(currency);
	if (known !== undefined) return known;
	try {
		return new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
	} catch {
		return 2;
	}
}

export function formatMoney(amountMinor: number, currency: string, locale?: string): string {
	try {
		const digits = minorDigits(currency);
		return new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(amountMinor / 10 ** digits);
	} catch {
		return `${(amountMinor / 100).toFixed(2)} ${currency}`;
	}
}

/** Parses what an administrator typed ("4.99") into whole minor units, or null when it is not a valid amount. */
export function parseMinor(text: string, currency: string): number | null {
	const value = Number(text.trim().replace(",", "."));
	if (!text.trim() || !Number.isFinite(value) || value < 0) return null;
	return Math.round(value * 10 ** minorDigits(currency));
}

export function minorToInput(amountMinor: number, currency: string): string {
	const digits = minorDigits(currency);
	return (amountMinor / 10 ** digits).toFixed(digits);
}

export function pickPrice(prices: Price[], currency: string | null, fallback: string): Price | null {
	return (currency ? prices.find((price) => price.currency === currency) : undefined) ?? prices.find((price) => price.currency === fallback) ?? prices[0] ?? null;
}

/** An unlocked item that is only available through a rental. */
export function rentalRemainingMs(endsAt: string | null | undefined, now = Date.now()): number | null {
	if (!endsAt) return null;
	const end = Date.parse(endsAt);
	return Number.isNaN(end) ? null : Math.max(0, end - now);
}

// ---- Public and signed-in user ----

export async function getPaymentStatus(): Promise<PaymentStatus> {
	return (await api.get<PaymentStatus>("/payments/status")).data;
}

/** Starts a card session for an account that registered but has not paid. Rejects with 401 once the token has expired. */
export async function beginSignupSetup(token: string): Promise<SignupSetup> {
	return (await api.post<SignupSetup>("/payments/signup/setup", { token })).data;
}

/** The card needs extra authentication (3-D Secure); finish it in the browser, then confirm with the same `orderId`. */
export interface SignupAction {
	requiresAction: true;
	orderId: string;
	clientSecret: string;
}

/** Saves the card, takes the registration fee and signs the account in. Rejects with 402 and the reason when the card is refused; it can be retried. */
export async function completeSignupPayment(token: string, payment: SignupPayment | undefined, orderId?: string): Promise<AuthResult | VerificationPending | SignupAction> {
	return (await api.post<AuthResult | VerificationPending | SignupAction>("/payments/signup/complete", { token, payment, orderId })).data;
}

export async function getOrderReceiptUrl(orderId: string): Promise<string> {
	return (await api.get<{ url: string }>(`/payments/orders/${encodeURIComponent(orderId)}/receipt`)).data.url;
}

export async function getMyPayments(): Promise<MyPayments> {
	return (await api.get<MyPayments>("/payments/me")).data;
}

export async function listPaymentPlans(): Promise<(PublicPlan & { subscribed: boolean })[]> {
	return (await api.get<(PublicPlan & { subscribed: boolean })[]>("/payments/plans")).data;
}

export async function getOffers(itemId: string): Promise<Offers> {
	return (await api.get<Offers>(`/payments/offers/${encodeURIComponent(itemId)}`)).data;
}

export async function checkLocks(ids: string[]): Promise<LockStates> {
	return (await api.post<LockStates>("/payments/access", { ids })).data;
}

export async function quotePayment(request: CheckoutRequest): Promise<Quote> {
	return (await api.post<Quote>("/payments/quote", request)).data;
}

export async function checkoutPayment(request: CheckoutRequest): Promise<CheckoutResult> {
	return (await api.post<CheckoutResult>("/payments/checkout", request, { timeout: 60_000 })).data;
}

export async function confirmPaymentOrder(orderId: string): Promise<CheckoutResult> {
	return (await api.post<CheckoutResult>(`/payments/orders/${encodeURIComponent(orderId)}/confirm`, {}, { timeout: 60_000 })).data;
}

export async function beginMethodSetup(): Promise<CardSetup> {
	return (await api.post<CardSetup>("/payments/methods/setup", {})).data;
}

export async function addPaymentMethod(card: CardResult): Promise<SavedCard> {
	return (await api.post<SavedCard>("/payments/methods", card)).data;
}

export async function makeDefaultMethod(id: string): Promise<void> {
	await api.post(`/payments/methods/${encodeURIComponent(id)}/default`, {});
}

export async function removePaymentMethod(id: string): Promise<void> {
	await api.delete(`/payments/methods/${encodeURIComponent(id)}`);
}

export async function cancelMySubscription(id: string): Promise<void> {
	await api.post(`/payments/subscriptions/${encodeURIComponent(id)}/cancel`, {});
}

export async function resumeMySubscription(id: string): Promise<void> {
	await api.post(`/payments/subscriptions/${encodeURIComponent(id)}/resume`, {});
}

// ---- Administrator ----

export async function getAdminPaymentConfig(): Promise<PaymentConfig> {
	return (await api.get<PaymentConfig>("/admin/payments/config")).data;
}

export async function updateAdminPaymentConfig(changes: PaymentConfigUpdate): Promise<PaymentConfig> {
	return (await api.put<PaymentConfig>("/admin/payments/config", changes)).data;
}

export async function testPaymentConnection(overrides: PaymentConfigUpdate): Promise<{ ok: boolean; detail: string }> {
	return (await api.post<{ ok: boolean; detail: string }>("/admin/payments/config/test", overrides, { timeout: 30_000 })).data;
}

export async function listPaymentCurrencies(provider?: PaymentProviderId | null): Promise<CurrencyInfo[]> {
	return (await api.get<CurrencyInfo[]>("/admin/payments/currencies", { params: { provider: provider || undefined } })).data;
}

export async function getPaymentStats(): Promise<PaymentStats> {
	return (await api.get<PaymentStats>("/admin/payments/stats")).data;
}

export async function searchPaymentScopes(q: string, type?: string): Promise<ScopeSearchResult> {
	return (await api.get<ScopeSearchResult>("/admin/payments/scope-search", { params: { q, type: type || undefined } })).data;
}

export async function listProducts(): Promise<Product[]> {
	return (await api.get<Product[]>("/admin/payments/products")).data;
}

export async function saveProduct(id: string | null, product: ProductInput): Promise<Product> {
	return (id ? await api.put<Product>(`/admin/payments/products/${encodeURIComponent(id)}`, product) : await api.post<Product>("/admin/payments/products", product)).data;
}

export async function deleteProduct(id: string): Promise<void> {
	await api.delete(`/admin/payments/products/${encodeURIComponent(id)}`);
}

export async function listPlans(): Promise<Plan[]> {
	return (await api.get<Plan[]>("/admin/payments/plans")).data;
}

export async function savePlan(id: string | null, plan: PlanInput): Promise<Plan> {
	return (id ? await api.put<Plan>(`/admin/payments/plans/${encodeURIComponent(id)}`, plan) : await api.post<Plan>("/admin/payments/plans", plan)).data;
}

export async function deletePlan(id: string): Promise<void> {
	await api.delete(`/admin/payments/plans/${encodeURIComponent(id)}`);
}

export async function listCoupons(): Promise<Coupon[]> {
	return (await api.get<Coupon[]>("/admin/payments/coupons")).data;
}

export async function saveCoupon(id: string | null, coupon: CouponInput): Promise<Coupon> {
	return (id ? await api.put<Coupon>(`/admin/payments/coupons/${encodeURIComponent(id)}`, coupon) : await api.post<Coupon>("/admin/payments/coupons", coupon)).data;
}

export async function deleteCoupon(id: string): Promise<void> {
	await api.delete(`/admin/payments/coupons/${encodeURIComponent(id)}`);
}

export async function listAdminOrders(page = 0, status?: string, userId?: string): Promise<{ total: number; items: AdminOrder[] }> {
	return (await api.get<{ total: number; items: AdminOrder[] }>("/admin/payments/orders", { params: { page, status: status || undefined, userId: userId || undefined } })).data;
}

export async function refundOrder(id: string, amountMinor?: number): Promise<AdminOrder> {
	return (await api.post<AdminOrder>(`/admin/payments/orders/${encodeURIComponent(id)}/refund`, amountMinor === undefined ? {} : { amountMinor })).data;
}

export async function listAdminSubscriptions(status?: string): Promise<AdminSubscription[]> {
	return (await api.get<AdminSubscription[]>("/admin/payments/subscriptions", { params: { status: status || undefined } })).data;
}

export async function cancelAdminSubscription(id: string, immediately: boolean): Promise<void> {
	await api.post(`/admin/payments/subscriptions/${encodeURIComponent(id)}/cancel`, { immediately });
}

export async function listGrants(userId: string): Promise<Grant[]> {
	return (await api.get<Grant[]>(`/admin/payments/users/${encodeURIComponent(userId)}/grants`)).data;
}

export async function createGrant(userId: string, scope: ContentScope, hours?: number): Promise<Grant> {
	return (await api.post<Grant>(`/admin/payments/users/${encodeURIComponent(userId)}/grants`, { scope, hours })).data;
}

export async function revokeGrant(id: string): Promise<void> {
	await api.patch(`/admin/payments/grants/${encodeURIComponent(id)}/revoke`, {});
}

export async function getAdminUserPayments(userId: string): Promise<AdminUserPayments> {
	return (await api.get<AdminUserPayments>(`/admin/payments/users/${encodeURIComponent(userId)}`)).data;
}

export async function waiveUserSignup(userId: string): Promise<void> {
	await api.post(`/admin/payments/users/${encodeURIComponent(userId)}/waive-signup`, {});
}

export async function removeUserCard(userId: string, methodId: string): Promise<void> {
	await api.delete(`/admin/payments/users/${encodeURIComponent(userId)}/methods/${encodeURIComponent(methodId)}`);
}
