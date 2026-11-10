/** Loads the Stripe and Square browser SDKs on demand (no npm packages) and themes their card elements to match Flixer. */
import type { CardResult, CardSetup, SquareClientSettings, StripeClientSettings } from "../api";

const STRIPE_URL = "https://js.stripe.com/v3";
const SQUARE_URL = "https://web.squarecdn.com/v1/square.js";
const SQUARE_SANDBOX_URL = "https://sandbox.web.squarecdn.com/v1/square.js";

interface StripeElement {
	mount(target: HTMLElement): void;
	unmount(): void;
	destroy(): void;
	on(event: "ready" | "change" | "loaderror", handler: (event: { complete?: boolean }) => void): void;
}

interface StripeElements {
	create(type: "payment", options: Record<string, unknown>): StripeElement;
}

interface StripeInstance {
	elements(options: Record<string, unknown>): StripeElements;
	confirmSetup(options: Record<string, unknown>): Promise<{ error?: { message?: string }; setupIntent?: { id: string; status: string } }>;
	handleNextAction(options: { clientSecret: string }): Promise<{ error?: { message?: string }; paymentIntent?: { status: string } }>;
}

interface SquareCard {
	attach(target: HTMLElement): Promise<void>;
	tokenize(): Promise<{ status: string; token?: string; errors?: { message?: string }[] }>;
	destroy(): Promise<void>;
}

interface SquarePayments {
	card(options: Record<string, unknown>): Promise<SquareCard>;
	verifyBuyer(sourceId: string, details: Record<string, unknown>): Promise<{ token?: string } | null>;
}

interface SdkWindow {
	Stripe?: (publishableKey: string) => StripeInstance;
	Square?: { payments(applicationId: string, locationId: string): Promise<SquarePayments> };
}

const scripts = new Map<string, Promise<void>>();

/** Adds a script once; a failed load is forgotten so the next attempt can retry. */
function loadScript(url: string): Promise<void> {
	const existing = scripts.get(url);
	if (existing) return existing;
	const promise = new Promise<void>((resolve, reject) => {
		const script = document.createElement("script");
		script.src = url;
		script.async = true;
		script.onload = () => resolve();
		script.onerror = () => {
			script.remove();
			reject(new Error("payment-sdk-load"));
		};
		document.head.append(script);
	});
	promise.catch(() => scripts.delete(url));
	scripts.set(url, promise);
	return promise;
}

export interface CardTheme {
	background: string;
	surface: string;
	border: string;
	primary: string;
	accent: string;
	text: string;
	muted: string;
	danger: string;
	font: string;
}

/** Reads the active Flixer theme, so the card element follows light and dark mode. */
export function readCardTheme(): CardTheme {
	const style = getComputedStyle(document.documentElement);
	const color = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
	return {
		background: color("--color-flixer-background", "#080811"),
		surface: color("--color-flixer-surface", "#14131d"),
		border: color("--color-flixer-border", "#292735"),
		primary: color("--color-flixer-primary", "#7645d7"),
		accent: color("--color-flixer-accent", "#a789ff"),
		text: color("--color-flixer-text", "#f4f2fb"),
		muted: color("--color-flixer-muted", "#9492a4"),
		danger: "#f87171",
		font: style.getPropertyValue("--font-sans").trim() || "system-ui, sans-serif",
	};
}

function isLightTheme(theme: CardTheme): boolean {
	return document.documentElement.classList.contains("light") || theme.background.toLowerCase() === "#f5f4fa";
}

/** A mounted card field. `collect` turns what was typed into what the server needs. */
export interface CardField {
	collect(): Promise<CardResult>;
	destroy(): void;
}

export interface CardContext {
	name?: string;
	email?: string;
}

const stripes = new Map<string, StripeInstance>();

async function stripeFor(client: StripeClientSettings): Promise<StripeInstance> {
	await loadScript(STRIPE_URL);
	const factory = (window as unknown as SdkWindow).Stripe;
	if (!factory) throw new Error("payment-sdk-load");
	let stripe = stripes.get(client.publishableKey);
	if (!stripe) {
		stripe = factory(client.publishableKey);
		stripes.set(client.publishableKey, stripe);
	}
	return stripe;
}

async function mountStripe(target: HTMLElement, setup: CardSetup, context: CardContext, onChange: (complete: boolean) => void): Promise<CardField> {
	if (!setup.clientSecret || !setup.client) throw new Error("payment-setup");
	const stripe = await stripeFor(setup.client as StripeClientSettings);
	const theme = readCardTheme();
	const elements = stripe.elements({
		clientSecret: setup.clientSecret,
		appearance: {
			theme: isLightTheme(theme) ? "stripe" : "night",
			variables: {
				colorPrimary: theme.accent,
				colorBackground: theme.surface,
				colorText: theme.text,
				colorTextSecondary: theme.muted,
				colorTextPlaceholder: theme.muted,
				colorDanger: theme.danger,
				fontFamily: theme.font,
				borderRadius: "4px",
				spacingUnit: "4px",
			},
			rules: {
				".Input": { border: `1px solid ${theme.border}`, boxShadow: "none" },
				".Input:focus": { borderColor: theme.accent, boxShadow: "none" },
				".Tab": { border: `1px solid ${theme.border}`, boxShadow: "none" },
				".Tab--selected": { borderColor: theme.accent, boxShadow: "none" },
				".Label": { color: theme.muted, fontWeight: "600" },
			},
		},
	});
	const element = elements.create("payment", {
		layout: "tabs",
		wallets: { applePay: "never", googlePay: "never", link: "never" },
		defaultValues: { billingDetails: { name: context.name ?? "", email: context.email ?? "" } },
	});
	element.on("change", (event) => onChange(event.complete === true));
	// Stripe's card form lives in cross-origin iframes; when a browser blocks them the form never becomes ready, so surface that instead of showing a blank box.
	const ready = new Promise<void>((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error("payment-sdk-load")), 15_000);
		element.on("ready", () => {
			clearTimeout(timer);
			resolve();
		});
		element.on("loaderror", () => {
			clearTimeout(timer);
			reject(new Error("payment-sdk-load"));
		});
	});
	element.mount(target);
	try {
		await ready;
	} catch (error) {
		element.destroy();
		throw error;
	}
	return {
		async collect() {
			const result = await stripe.confirmSetup({ elements, redirect: "if_required", confirmParams: { return_url: window.location.href } });
			if (result.error) throw new Error(result.error.message || "payment-card");
			if (!result.setupIntent) throw new Error("payment-card");
			return { setupIntentId: result.setupIntent.id };
		},
		destroy() {
			element.destroy();
		},
	};
}

async function mountSquare(target: HTMLElement, setup: CardSetup, context: CardContext, onChange: (complete: boolean) => void): Promise<CardField> {
	const client = setup.client as SquareClientSettings | null;
	if (!client) throw new Error("payment-setup");
	await loadScript(client.environment === "sandbox" ? SQUARE_SANDBOX_URL : SQUARE_URL);
	const square = (window as unknown as SdkWindow).Square;
	if (!square) throw new Error("payment-sdk-load");
	const payments = await square.payments(client.applicationId, client.locationId);
	const theme = readCardTheme();
	// Square rejects some valid CSS font stacks; use its default font.
	const input = { backgroundColor: theme.surface, color: theme.text, fontSize: "16px" };
	const card = await payments.card({
		style: {
			".input-container": { borderColor: theme.border, borderRadius: "4px", borderWidth: "1px" },
			".input-container.is-focus": { borderColor: theme.accent },
			".input-container.is-error": { borderColor: theme.danger },
			".message-text": { color: theme.muted },
			".message-icon": { color: theme.muted },
			".message-text.is-error": { color: theme.danger },
			".message-icon.is-error": { color: theme.danger },
			input,
			"input.is-focus": { backgroundColor: theme.surface, color: theme.text },
			"input::placeholder": { color: theme.muted },
			"input.is-focus::placeholder": { color: theme.muted },
			"input.is-error": { backgroundColor: theme.surface, color: theme.danger },
		},
	});
	await card.attach(target);
	onChange(false);
	return {
		async collect() {
			const result = await card.tokenize();
			if (result.status !== "OK" || !result.token) throw new Error(result.errors?.[0]?.message || "payment-card");
			let verification: { token?: string } | null;
			try {
				verification = await payments.verifyBuyer(result.token, {
					intent: "STORE",
					customerInitiated: true,
					sellerKeyedIn: false,
					billingContact: { givenName: context.name || undefined, email: context.email || undefined },
				});
			} catch (error) {
				console.warn("[payments] Square card verification failed", error instanceof Error ? error.name : "unknown error");
				throw new Error("payment-verification");
			}
			if (!verification?.token) throw new Error("payment-verification");
			return { sourceId: result.token, verificationToken: verification.token };
		},
		destroy() {
			void card.destroy().catch(() => undefined);
		},
	};
}

/** Mounts the provider's themed card element into `target`. Rejects with `payment-sdk-load` or `payment-setup` when it cannot. */
export function mountCardField(target: HTMLElement, setup: CardSetup, context: CardContext, onChange: (complete: boolean) => void): Promise<CardField> {
	return setup.provider === "stripe" ? mountStripe(target, setup, context, onChange) : mountSquare(target, setup, context, onChange);
}

/** Finishes 3-D Secure for a payment the server said needs the customer. Resolves when the customer has completed it. */
export async function completePaymentAction(client: CardSetup["client"], provider: CardSetup["provider"], clientSecret: string): Promise<void> {
	if (provider !== "stripe" || !client) throw new Error("payment-action");
	const stripe = await stripeFor(client as StripeClientSettings);
	const result = await stripe.handleNextAction({ clientSecret });
	if (result.error) throw new Error(result.error.message || "payment-action");
}
