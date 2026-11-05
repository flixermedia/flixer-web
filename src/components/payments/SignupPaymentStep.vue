<script setup lang="ts">
import axios from "axios";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { beginSignupSetup, completeSignupPayment, type AuthResult, type SignupAction, type SignupPayment, type SignupSetup, type VerificationPending } from "../../api";
import { completePaymentAction } from "../../composables/paymentSdk";
import { usePaymentFormat } from "../../composables/usePaymentFormat";
import { usePayments } from "../../composables/usePayments";
import { describeRequestError } from "../../composables/useProfile";
import { catchError } from "../../utils/catchError";
import CardElement from "./CardElement.vue";

const props = defineProps<{ token: string; name?: string; email?: string }>();
const emit = defineEmits<{ paid: [result: AuthResult | VerificationPending]; expired: []; back: [] }>();

const { t } = useI18n();
const { price, recurring } = usePaymentFormat();
const payments = usePayments();
const setup = ref<SignupSetup | null>(null);
const card = ref<InstanceType<typeof CardElement> | null>(null);
const coupon = ref("");
const failure = ref("");
const busy = ref(false);
const confirmed = ref<Pick<SignupPayment, "setupIntentId" | "sourceId" | "verificationToken"> | null>(null);

const registration = computed(() => payments.activeStatus.value?.registration ?? null);
const fee = computed(() => {
	const current = registration.value;
	if (!current?.feeEnabled) return "";
	return current.mode === "subscription" && current.plan ? recurring(current.price, current.plan.interval) : price(current.price);
});

function isStatus(error: unknown, status: number) {
	return axios.isAxiosError(error) && error.response?.status === status;
}

async function begin() {
	setup.value = null;
	await payments.load();
	const [error, result] = await catchError(beginSignupSetup(props.token));
	if (isStatus(error, 401)) return emit("expired");
	if (error) failure.value = describeRequestError(error, t("payments.card.setupError"));
	else setup.value = result;
}
void begin();

/** Drops the verified card and prepares a fresh form, for when the server rejected the card or the customer edits it. */
function reset() {
	confirmed.value = null;
	void begin();
}

async function pay() {
	if (busy.value) return;
	if (!setup.value || !card.value) {
		failure.value = t("payments.card.notReady");
		return;
	}
	busy.value = true;
	failure.value = "";
	try {
		// The card is verified once; a retry after a charge problem starts from a fresh form instead of a spent intent.
		const result = confirmed.value ?? (await card.value.collect());
		confirmed.value = result;
		const payment: SignupPayment = { ...result, setupToken: setup.value.setupToken, couponCode: coupon.value.trim() || undefined, currency: payments.activeStatus.value?.currency };
		let outcome: AuthResult | VerificationPending | SignupAction;
		try {
			outcome = await completeSignupPayment(props.token, payment);
			if ("requiresAction" in outcome) {
				// The bank wants the customer to approve the charge (3-D Secure); the server then re-checks the result itself.
				await completePaymentAction(setup.value.client, setup.value.provider, outcome.clientSecret).catch((actionError: unknown) => {
					throw new Error(actionError instanceof Error && actionError.message !== "payment-action" ? actionError.message : t("payments.offers.actionError"));
				});
				outcome = await completeSignupPayment(props.token, undefined, outcome.orderId);
			}
		} catch (error) {
			if (isStatus(error, 401)) return emit("expired");
			failure.value = axios.isAxiosError(error) ? describeRequestError(error, t("payments.card.cardError")) : error instanceof Error ? error.message : t("payments.card.cardError");
			reset();
			return;
		}
		if ("requiresAction" in outcome) throw new Error(t("payments.offers.actionError"));
		return emit("paid", outcome);
	} catch (error) {
		failure.value = error instanceof Error ? error.message : t("payments.card.cardError");
	} finally {
		busy.value = false;
	}
}
</script>

<template>
	<div data-haptic class="w-full">
		<span class="text-[9px] font-bold tracking-[0.2em] text-flixer-accent">{{ t("payments.signup.title") }}</span>
		<h1 id="registration-title" class="mt-3 text-3xl font-semibold tracking-tight text-flixer-text sm:text-4xl">
			{{ t("payments.signup.stepTitle") }}
			<span class="text-flixer-accent">.</span>
		</h1>
		<p class="mt-2 text-sm text-flixer-muted">{{ t("payments.signup.stepDescription") }}</p>

		<form class="mt-7 flex flex-col gap-3" @submit.prevent="pay">
			<p class="text-sm text-flixer-muted">
				<template v-if="fee">{{ t("payments.signup.fee", { price: fee }) }}</template>
				<template v-else>{{ t("payments.signup.cardOnly") }}</template>
			</p>
			<p v-if="failure" class="text-sm text-red-300" role="alert">{{ failure }}</p>
			<CardElement ref="card" :setup="setup" :name="name" :email="email" />
			<label v-if="registration?.feeEnabled" class="block text-sm font-medium">
				{{ t("payments.coupon.label") }}
				<input v-model="coupon" type="text" autocomplete="off" autocapitalize="characters" maxlength="64" :placeholder="t('payments.coupon.placeholder')" class="mt-2 h-11 w-full rounded border border-flixer-border bg-flixer-surface/50 px-4 text-base uppercase text-flixer-text outline-none placeholder:normal-case placeholder:text-flixer-muted/70 focus:border-flixer-accent/60 sm:text-sm" />
			</label>
			<p class="text-xs text-flixer-muted">{{ t("payments.signup.secure") }}</p>
			<button class="mt-2 flex h-12 items-center justify-center gap-2 rounded bg-gradient-to-r from-flixer-primary to-flixer-secondary text-sm font-semibold text-white shadow-lg shadow-flixer-primary/20 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-wait disabled:opacity-60" type="submit" :disabled="busy || !setup" :aria-busy="busy">
				<span>{{ busy ? t("payments.signup.paying") : t("payments.signup.pay") }}</span>
				<span v-if="busy" class="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true"></span>
				<Icon v-else icon="lucide:lock" class="size-[17px]" aria-hidden="true" />
			</button>
			<button type="button" class="text-xs font-semibold text-flixer-accent underline-offset-2 hover:underline" :disabled="busy" @click="emit('back')">{{ t("payments.signup.backToSignIn") }}</button>
		</form>
	</div>
</template>
