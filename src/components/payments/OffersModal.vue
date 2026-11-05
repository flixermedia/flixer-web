<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from "@kolirt/vue-modal";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { checkoutPayment, confirmPaymentOrder, getMyPayments, getOffers, pickPrice, quotePayment, type CheckoutRequest, type CheckoutResult, type Offers, type Quote, type SavedCard } from "../../api";
import { notify } from "../../composables/notify";
import { completePaymentAction } from "../../composables/paymentSdk";
import { usePaymentFormat } from "../../composables/usePaymentFormat";
import { usePayments } from "../../composables/usePayments";
import { describeRequestError } from "../../composables/useProfile";
import { catchError } from "../../utils/catchError";
import AddCardForm from "./AddCardForm.vue";

defineOptions({ modalGroup: "default" });

const props = defineProps<{ itemId: string; title: string }>();
const { close, confirm } = useModalContext<boolean>();
const { t } = useI18n();
const { money, price, recurring, hours } = usePaymentFormat();
const payments = usePayments();

interface Option {
	key: string;
	kind: "buy" | "rent" | "plan" | "registration";
	name: string;
	detail: string;
	priceLabel: string;
	request: CheckoutRequest;
}

const offers = ref<Offers | null>(null);
const cards = ref<SavedCard[]>([]);
const loading = ref(true);
const loadError = ref("");
const selectedKey = ref("");
const coupon = ref("");
const couponError = ref("");
const quote = ref<Quote | null>(null);
const quoting = ref(false);
const methodId = ref("");
const addingCard = ref(false);
const paying = ref(false);
const payError = ref("");
let quoteToken = 0;

const options = computed<Option[]>(() => {
	const current = offers.value;
	if (!current) return [];
	const list: Option[] = [];
	for (const product of current.products) {
		const rentalStart = product.rentalStart === "first_play" ? t("payments.offers.startsOnPlay") : t("payments.offers.startsNow");
		list.push({
			key: `product:${product.id}`,
			kind: product.kind,
			name: product.name,
			detail: product.kind === "rent" && product.rentalHours ? `${t("payments.offers.rentalWindow", { duration: hours(product.rentalHours) })} · ${rentalStart}` : (product.description ?? t("payments.offers.keepForever")),
			priceLabel: price(product.price),
			request: { productId: product.id },
		});
	}
	for (const plan of current.plans) {
		list.push({
			key: `plan:${plan.id}`,
			kind: "plan",
			name: plan.name,
			detail: plan.trialDays > 0 ? t("payments.offers.trial", { days: plan.trialDays }) : (plan.description ?? t("payments.offers.cancelAnytime")),
			priceLabel: recurring(plan.price ?? pickPrice(plan.prices, null, current.currency), plan.interval),
			request: { planId: plan.id },
		});
	}
	if (current.registration?.price) {
		list.push({ key: "registration", kind: "registration", name: t("payments.offers.membership"), detail: t("payments.offers.membershipDetail"), priceLabel: price(current.registration.price), request: { registration: true } });
	}
	return list;
});
const selected = computed(() => options.value.find((option) => option.key === selectedKey.value) ?? null);
const needsCard = computed(() => Boolean(quote.value && (quote.value.totals.totalMinor > 0 || quote.value.recurring)));
const showCardForm = computed(() => needsCard.value && (addingCard.value || cards.value.length === 0));
const canPay = computed(() => Boolean(quote.value) && !quoting.value && !paying.value && (!needsCard.value || (methodId.value && !addingCard.value)));
const payLabel = computed(() => {
	const total = quote.value?.totals.totalMinor ?? 0;
	if (total > 0) return t("payments.offers.pay", { amount: money(total, quote.value?.currency ?? "USD") });
	return quote.value && quote.value.trialDays > 0 ? t("payments.offers.startTrial") : t("payments.offers.unlock");
});

async function refreshQuote() {
	const option = selected.value;
	const current = ++quoteToken;
	quote.value = null;
	couponError.value = "";
	if (!option) return;
	quoting.value = true;
	const [error, result] = await catchError(quotePayment({ ...option.request, couponCode: coupon.value.trim() || undefined }));
	if (current !== quoteToken) return;
	quoting.value = false;
	if (error) {
		// A bad coupon should not hide the price: fall back to the plain quote.
		couponError.value = describeRequestError(error, t("payments.offers.quoteError"));
		if (coupon.value.trim()) {
			coupon.value = "";
			const [plainError, plain] = await catchError(quotePayment(option.request));
			if (current === quoteToken && !plainError) quote.value = plain;
		}
		return;
	}
	quote.value = result;
}

function select(key: string) {
	selectedKey.value = key;
	coupon.value = "";
	payError.value = "";
	void refreshQuote();
}

async function load() {
	const [error, results] = await catchError(Promise.all([getOffers(props.itemId), getMyPayments(), payments.load()]));
	loading.value = false;
	if (error) {
		loadError.value = describeRequestError(error, t("payments.offers.loadError"));
		return;
	}
	[offers.value, { methods: cards.value }] = results;
	methodId.value = (cards.value.find((card) => card.isDefault) ?? cards.value[0])?.id ?? "";
	if (options.value.length > 0) select(options.value[0].key);
}
void load();

function cardAdded(card: SavedCard) {
	cards.value = [...cards.value, card];
	methodId.value = card.id;
	addingCard.value = false;
}

async function finish(result: CheckoutResult): Promise<boolean> {
	if (result.status === "paid") return true;
	if (result.status === "requires_action" && result.clientSecret) {
		const status = payments.activeStatus.value;
		const [actionError] = await catchError(completePaymentAction(status?.client ?? null, status?.provider ?? "stripe", result.clientSecret));
		if (actionError) {
			payError.value = actionError.message === "payment-action" ? t("payments.offers.actionError") : actionError.message;
			return false;
		}
		const [confirmError, confirmed] = await catchError(confirmPaymentOrder(result.orderId));
		if (confirmError) {
			payError.value = describeRequestError(confirmError, t("payments.offers.payError"));
			return false;
		}
		return finish({ ...confirmed, status: confirmed.status === "requires_action" ? "failed" : confirmed.status, error: confirmed.error ?? t("payments.offers.actionError") });
	}
	payError.value = result.error ?? t("payments.offers.payError");
	return false;
}

async function pay() {
	const option = selected.value;
	if (!option || !quote.value || !canPay.value) return;
	paying.value = true;
	payError.value = "";
	try {
		const [error, result] = await catchError(checkoutPayment({ ...option.request, couponCode: quote.value.couponCode ?? undefined, currency: quote.value.currency, paymentMethodId: needsCard.value ? methodId.value : undefined }));
		if (error) {
			payError.value = describeRequestError(error, t("payments.offers.payError"));
			return;
		}
		if (await finish(result)) {
			notify.success(t("payments.offers.success"));
			confirm(true);
		}
	} finally {
		paying.value = false;
	}
}

const kindIcon: Record<Option["kind"], string> = { buy: "lucide:shopping-bag", rent: "lucide:clock", plan: "lucide:repeat", registration: "lucide:ticket" };
const tax = computed(() => payments.activeStatus.value?.tax);
</script>

<template>
	<ModalRoot class="flex items-center justify-center p-4">
		<ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col rounded border border-flixer-border bg-flixer-surface text-flixer-text shadow-2xl shadow-black/60">
			<header class="flex shrink-0 items-center gap-4 border-b border-flixer-border px-6 py-5">
				<span class="grid size-11 shrink-0 place-items-center rounded bg-flixer-primary/15 text-flixer-accent"><Icon icon="lucide:lock" class="size-5" aria-hidden="true" /></span>
				<div class="min-w-0 flex-1">
					<ModalTitle class="text-lg font-semibold">{{ t("payments.offers.title") }}</ModalTitle>
					<ModalDescription class="mt-0.5 truncate text-sm text-flixer-muted">{{ t("payments.offers.description", { title }) }}</ModalDescription>
				</div>
			</header>

			<div class="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-6 py-5 [scrollbar-width:thin]">
				<p v-if="loading" class="text-sm text-flixer-muted" role="status">{{ t("payments.loading") }}</p>
				<p v-else-if="loadError" class="text-sm text-red-300" role="alert">{{ loadError }}</p>
				<p v-else-if="options.length === 0" class="text-sm text-flixer-muted">{{ t("payments.offers.none") }}</p>

				<template v-else>
					<div class="grid gap-2" role="radiogroup" :aria-label="t('payments.offers.choose')">
						<button v-for="option in options" :key="option.key" type="button" role="radio" :aria-checked="option.key === selectedKey" class="flex items-center gap-3 rounded border p-3 text-left transition focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="option.key === selectedKey ? 'border-flixer-primary bg-flixer-primary/10' : 'border-flixer-border hover:bg-white/5'" @click="select(option.key)">
							<span class="grid size-9 shrink-0 place-items-center rounded bg-white/5 text-flixer-accent"><Icon :icon="kindIcon[option.kind]" class="size-4" aria-hidden="true" /></span>
							<span class="min-w-0 flex-1">
								<span class="block truncate text-sm font-semibold">{{ option.name }}</span>
								<span class="block text-xs text-flixer-muted">{{ t(`payments.offers.kinds.${option.kind}`) }} · {{ option.detail }}</span>
							</span>
							<span class="shrink-0 text-sm font-semibold">{{ option.priceLabel }}</span>
						</button>
					</div>

					<form class="flex gap-2" @submit.prevent="refreshQuote">
						<label class="sr-only" for="offer-coupon">{{ t("payments.coupon.label") }}</label>
						<input id="offer-coupon" v-model="coupon" type="text" autocomplete="off" autocapitalize="characters" maxlength="64" :placeholder="t('payments.coupon.placeholder')" class="h-11 min-w-0 flex-1 rounded border border-flixer-border bg-flixer-surface/50 px-4 text-base uppercase text-flixer-text outline-none placeholder:normal-case placeholder:text-flixer-muted/70 focus:border-flixer-accent/60 sm:text-sm" />
						<button type="submit" class="h-11 shrink-0 rounded bg-white/10 px-4 text-sm font-semibold transition hover:bg-white/15 disabled:opacity-60" :disabled="!coupon.trim() || quoting">{{ t("payments.coupon.apply") }}</button>
					</form>
					<p v-if="couponError" class="-mt-3 text-sm text-red-300" role="alert">{{ couponError }}</p>

					<dl v-if="quote" class="space-y-1.5 rounded border border-flixer-border bg-flixer-background/40 p-4 text-sm">
						<div class="flex justify-between gap-4">
							<dt class="text-flixer-muted">{{ quote.description }}</dt>
							<dd>{{ money(quote.totals.subtotalMinor || quote.recurring?.amountMinor || 0, quote.currency) }}</dd>
						</div>
						<div v-if="quote.trialDays > 0" class="flex justify-between gap-4 text-flixer-accent">
							<dt>{{ t("payments.offers.trial", { days: quote.trialDays }) }}</dt>
							<dd>{{ money(0, quote.currency) }}</dd>
						</div>
						<div v-if="quote.totals.discountMinor > 0" class="flex justify-between gap-4 text-emerald-300">
							<dt>
								{{ t("payments.discount") }}<template v-if="quote.couponCode"> ({{ quote.couponCode }})</template>
							</dt>
							<dd>−{{ money(quote.totals.discountMinor, quote.currency) }}</dd>
						</div>
						<div v-if="quote.totals.taxMinor > 0" class="flex justify-between gap-4">
							<dt class="text-flixer-muted">{{ tax?.inclusive ? t("payments.taxIncluded") : t("payments.tax") }}</dt>
							<dd>{{ money(quote.totals.taxMinor, quote.currency) }}</dd>
						</div>
						<div class="flex justify-between gap-4 border-t border-flixer-border pt-2 text-base font-semibold">
							<dt>{{ t("payments.total") }}</dt>
							<dd>{{ money(quote.totals.totalMinor, quote.currency) }}</dd>
						</div>
						<p v-if="quote.recurring" class="pt-1 text-xs text-flixer-muted">{{ t("payments.offers.renews", { price: recurring({ currency: quote.currency, amountMinor: quote.recurring.amountMinor }, quote.recurring.interval) }) }}</p>
					</dl>
					<p v-else-if="quoting" class="text-sm text-flixer-muted" role="status">{{ t("payments.offers.quoting") }}</p>

					<section v-if="needsCard" class="space-y-3 border-t border-flixer-border pt-5">
						<h3 class="text-sm font-semibold">{{ t("payments.offers.payWith") }}</h3>
						<div v-if="cards.length > 0 && !addingCard" class="grid gap-2" role="radiogroup" :aria-label="t('payments.offers.payWith')">
							<button v-for="card in cards" :key="card.id" type="button" role="radio" :aria-checked="card.id === methodId" class="flex items-center gap-3 rounded border p-3 text-left text-sm transition focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="card.id === methodId ? 'border-flixer-primary bg-flixer-primary/10' : 'border-flixer-border hover:bg-white/5'" @click="methodId = card.id">
								<Icon icon="lucide:credit-card" class="size-4 text-flixer-accent" aria-hidden="true" />
								<span class="flex-1 capitalize">{{ card.brand }} •••• {{ card.last4 }}</span>
								<span class="text-xs text-flixer-muted">{{ String(card.expMonth).padStart(2, "0") }}/{{ String(card.expYear).slice(-2) }}</span>
							</button>
							<button type="button" class="self-start text-sm font-medium text-flixer-accent hover:underline focus-visible:outline-2 focus-visible:outline-flixer-accent" @click="addingCard = true">{{ t("payments.card.addAnother") }}</button>
						</div>
						<AddCardForm v-if="showCardForm" :cancellable="cards.length > 0" @added="cardAdded" @cancel="addingCard = false" />
					</section>
					<p v-if="selected?.kind === 'rent'" class="text-xs text-flixer-muted">{{ t("payments.offers.rentalNote") }}</p>
					<p v-if="payError" class="text-sm text-red-300" role="alert">{{ payError }}</p>
				</template>
			</div>

			<footer class="flex shrink-0 flex-col-reverse gap-3 border-t border-flixer-border px-6 py-4 sm:flex-row sm:justify-end">
				<button type="button" class="flex h-11 items-center justify-center rounded border border-flixer-border px-6 text-sm font-semibold text-flixer-text transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" :disabled="paying" @click="close()">{{ t("common.close") }}</button>
				<button v-if="options.length > 0" type="button" class="flex h-11 items-center justify-center gap-2 rounded bg-gradient-to-r from-flixer-primary to-flixer-secondary px-6 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:opacity-60" :disabled="!canPay" :aria-busy="paying" @click="pay">
					<Icon v-if="paying" icon="lucide:loader-circle" class="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
					{{ paying ? t("payments.offers.paying") : payLabel }}
				</button>
			</footer>
		</ModalContent>
	</ModalRoot>
</template>
