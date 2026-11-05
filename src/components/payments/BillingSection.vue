<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { Browser } from "@capacitor/browser";
import axios from "axios";
import { cancelMySubscription, getMyPayments, getOrderReceiptUrl, makeDefaultMethod, rentalRemainingMs, removePaymentMethod, resumeMySubscription, type MyPayments } from "../../api";
import { notify } from "../../composables/notify";
import { usePaymentFormat } from "../../composables/usePaymentFormat";
import { describeRequestError } from "../../composables/useProfile";
import { catchError } from "../../utils/catchError";
import { isNativeApp } from "../../platform/serverConnection";
import StatusPill from "../admin/StatusPill.vue";
import AddCardForm from "./AddCardForm.vue";

const { t } = useI18n();
const { money, date, countdown } = usePaymentFormat();

const data = ref<MyPayments | null>(null);
const loading = ref(true);
const failure = ref("");
const adding = ref(false);
const busyId = ref("");
const now = ref(Date.now());
let ticker: ReturnType<typeof setInterval> | undefined;

const rentals = computed(() => (data.value?.entitlements ?? []).filter((entitlement) => entitlement.expiresAt || entitlement.rentalNotStarted));
const subscriptionTone = (status: string) => (status === "active" || status === "trialing" ? "good" : status === "past_due" ? "warn" : "neutral");
const orderTone = (status: string) => (status === "paid" ? "good" : status === "failed" ? "bad" : status === "pending" || status === "requires_action" ? "warn" : "neutral");
const hasReceipt = (status: string) => status === "paid" || status === "refunded" || status === "partially_refunded";
const canRemove = computed(() => (data.value?.methods.length ?? 0) > 1 || !(data.value?.subscriptions ?? []).some((subscription) => subscription.active));

async function load() {
	const [error, result] = await catchError(getMyPayments());
	loading.value = false;
	if (error) failure.value = describeRequestError(error, t("payments.billing.loadError"));
	else {
		failure.value = "";
		data.value = result;
	}
}

async function run(id: string, action: () => Promise<unknown>, success: string) {
	busyId.value = id;
	const [error] = await catchError(action());
	busyId.value = "";
	if (error) notify.error(describeRequestError(error, t("payments.billing.actionError")));
	else {
		notify.success(success);
		await load();
	}
}

const makeDefault = (id: string) => run(id, () => makeDefaultMethod(id), t("payments.billing.defaultSet"));
const remove = (id: string) => run(id, () => removePaymentMethod(id), t("payments.billing.cardRemoved"));
const cancel = (id: string) => run(id, () => cancelMySubscription(id), t("payments.billing.canceled"));
const resume = (id: string) => run(id, () => resumeMySubscription(id), t("payments.billing.resumed"));

async function openReceipt(orderId: string) {
	busyId.value = orderId;
	const [error, url] = await catchError(getOrderReceiptUrl(orderId));
	busyId.value = "";
	if (error) {
		notify.error(axios.isAxiosError(error) && error.response?.status === 404 ? t("payments.billing.noReceipt") : describeRequestError(error, t("payments.billing.receiptError")));
		return;
	}
	if (isNativeApp()) {
		const [openError] = await catchError(Browser.open({ url }));
		if (openError) notify.error(t("payments.billing.receiptError"));
	} else window.open(url, "_blank", "noopener,noreferrer");
}

function cardAdded() {
	adding.value = false;
	void load();
}

onMounted(() => {
	void load();
	ticker = setInterval(() => (now.value = Date.now()), 30_000);
});
onBeforeUnmount(() => clearInterval(ticker));

const buttonClass = "inline-flex h-9 items-center rounded border border-flixer-border px-3 text-xs font-semibold text-flixer-text transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-flixer-accent disabled:opacity-50";
</script>

<template>
	<section aria-labelledby="billing-heading" class="max-w-3xl space-y-8">
		<div>
			<h2 id="billing-heading" class="text-lg font-semibold">{{ t("payments.billing.title") }}</h2>
			<p class="mt-1 text-sm text-flixer-muted">{{ t("payments.billing.description") }}</p>
		</div>

		<p v-if="loading" class="text-sm text-flixer-muted" role="status">{{ t("payments.loading") }}</p>
		<p v-else-if="failure" class="text-sm text-red-300" role="alert">{{ failure }}</p>

		<template v-else-if="data">
			<section aria-labelledby="billing-cards" class="space-y-3">
				<div class="flex items-center justify-between gap-3">
					<h3 id="billing-cards" class="text-sm font-semibold">{{ t("payments.billing.cards") }}</h3>
					<button v-if="!adding && data.methods.length < 5" type="button" :class="buttonClass" @click="adding = true">{{ t("payments.card.add") }}</button>
				</div>
				<p v-if="data.methods.length === 0 && !adding" class="text-sm text-flixer-muted">{{ t("payments.billing.noCards") }}</p>
				<ul v-else class="space-y-2">
					<li v-for="card in data.methods" :key="card.id" class="flex flex-wrap items-center gap-3 rounded border border-flixer-border bg-flixer-background/40 p-3">
						<Icon icon="lucide:credit-card" class="size-5 text-flixer-accent" aria-hidden="true" />
						<div class="min-w-0 flex-1">
							<p class="text-sm font-medium capitalize">{{ card.brand }} •••• {{ card.last4 }}</p>
							<p class="text-xs text-flixer-muted">{{ t("payments.billing.expires", { date: `${String(card.expMonth).padStart(2, "0")}/${card.expYear}` }) }}</p>
						</div>
						<StatusPill v-if="card.isDefault" tone="accent">{{ t("payments.billing.default") }}</StatusPill>
						<button v-else type="button" :class="buttonClass" :disabled="busyId === card.id" @click="makeDefault(card.id)">{{ t("payments.billing.makeDefault") }}</button>
						<button type="button" :class="buttonClass" :disabled="busyId === card.id || !canRemove" :title="canRemove ? undefined : t('payments.billing.keepOne')" @click="remove(card.id)">{{ t("payments.card.remove") }}</button>
					</li>
				</ul>
				<div v-if="adding" class="rounded border border-flixer-border bg-flixer-background/40 p-4">
					<AddCardForm cancellable @added="cardAdded" @cancel="adding = false" />
				</div>
			</section>

			<section v-if="data.subscriptions.length > 0" aria-labelledby="billing-subs" class="space-y-3">
				<h3 id="billing-subs" class="text-sm font-semibold">{{ t("payments.billing.subscriptions") }}</h3>
				<ul class="space-y-2">
					<li v-for="subscription in data.subscriptions" :key="subscription.id" class="flex flex-wrap items-center gap-3 rounded border border-flixer-border bg-flixer-background/40 p-3">
						<div class="min-w-0 flex-1">
							<p class="text-sm font-medium">{{ subscription.planName }} · {{ money(subscription.amountMinor, subscription.currency) }} / {{ t(`payments.interval.${subscription.interval}`) }}</p>
							<p class="text-xs text-flixer-muted">
								<template v-if="subscription.status === 'past_due' && subscription.graceUntil">{{ t("payments.billing.pastDue", { date: date(subscription.graceUntil) }) }}</template>
								<template v-else-if="subscription.cancelAtPeriodEnd">{{ t("payments.billing.endsOn", { date: date(subscription.periodEnd) }) }}</template>
								<template v-else-if="subscription.active">{{ t("payments.billing.renewsOn", { date: date(subscription.periodEnd) }) }}</template>
							</p>
						</div>
						<StatusPill :tone="subscriptionTone(subscription.status)">{{ t(`payments.status.${subscription.status}`) }}</StatusPill>
						<template v-if="subscription.active">
							<button v-if="subscription.cancelAtPeriodEnd" type="button" :class="buttonClass" :disabled="busyId === subscription.id" @click="resume(subscription.id)">{{ t("payments.billing.resume") }}</button>
							<button v-else type="button" :class="buttonClass" :disabled="busyId === subscription.id" @click="cancel(subscription.id)">{{ t("payments.billing.cancel") }}</button>
						</template>
					</li>
				</ul>
			</section>

			<section v-if="rentals.length > 0" aria-labelledby="billing-rentals" class="space-y-3">
				<h3 id="billing-rentals" class="text-sm font-semibold">{{ t("payments.billing.rentals") }}</h3>
				<ul class="space-y-2">
					<li v-for="entitlement in rentals" :key="entitlement.id" class="flex items-center justify-between gap-3 rounded border border-flixer-border bg-flixer-background/40 p-3 text-sm">
						<span>{{ t(`payments.scope.${entitlement.scope.type}`) }}</span>
						<span class="text-flixer-muted">
							<template v-if="entitlement.rentalNotStarted">{{ t("payments.billing.startsOnPlay") }}</template>
							<template v-else-if="rentalRemainingMs(entitlement.expiresAt, now)">{{ t("payments.billing.remaining", { time: countdown(rentalRemainingMs(entitlement.expiresAt, now) ?? 0) }) }}</template>
						</span>
					</li>
				</ul>
			</section>

			<section aria-labelledby="billing-orders" class="space-y-3">
				<h3 id="billing-orders" class="text-sm font-semibold">{{ t("payments.billing.orders") }}</h3>
				<p v-if="data.orders.length === 0" class="text-sm text-flixer-muted">{{ t("payments.billing.noOrders") }}</p>
				<ul v-else class="divide-y divide-flixer-border rounded border border-flixer-border bg-flixer-background/40">
					<li v-for="order in data.orders" :key="order.id" class="flex flex-wrap items-center gap-3 p-3">
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium">{{ order.description }}</p>
							<p class="text-xs text-flixer-muted">
								{{ date(order.createdAt) }}<template v-if="order.taxMinor > 0"> · {{ t("payments.billing.taxAmount", { amount: money(order.taxMinor, order.currency) }) }}</template
								><template v-if="order.refundedMinor > 0"> · {{ t("payments.billing.refunded", { amount: money(order.refundedMinor, order.currency) }) }}</template>
							</p>
						</div>
						<span class="text-sm font-semibold">{{ money(order.totalMinor, order.currency) }}</span>
						<StatusPill :tone="orderTone(order.status)">{{ t(`payments.orderStatus.${order.status}`) }}</StatusPill>
						<button v-if="hasReceipt(order.status)" type="button" :class="buttonClass" :disabled="busyId === order.id" @click="openReceipt(order.id)">{{ t("payments.billing.receipt") }}</button>
					</li>
				</ul>
			</section>
		</template>
	</section>
</template>
