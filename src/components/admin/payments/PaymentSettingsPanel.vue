<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { api, getAdminPaymentConfig, getPaymentStats, listPlans, testPaymentConnection, updateAdminPaymentConfig, type CurrencyInfo, type PaymentConfig, type PaymentStats, type Plan, type PaymentProviderId } from "../../../api";
import { notify } from "../../../composables/notify";
import { loadPaymentCurrencies } from "../../../composables/usePaymentCurrencies";
import { usePaymentFormat } from "../../../composables/usePaymentFormat";
import { describeRequestError } from "../../../composables/useProfile";
import { catchError } from "../../../utils/catchError";
import AdminSection from "../AdminSection.vue";
import AdminSkeleton from "../AdminSkeleton.vue";
import AdminToggle from "../AdminToggle.vue";
import StatusPill from "../StatusPill.vue";
import { adminInput, adminSelect, primaryButton, secondaryButton } from "./adminPaymentStyles";
import PriceListEditor from "./PriceListEditor.vue";
import ScopePicker from "./ScopePicker.vue";

const { t } = useI18n();
const { money } = usePaymentFormat();

const loaded = ref(false);
const form = reactive<PaymentConfig>({
	enabled: false,
	provider: null,
	currency: "USD",
	currencies: ["USD"],
	graceDays: 3,
	enabledAt: null,
	grandfatherExisting: true,
	registration: { enabled: false, mode: "one_time", prices: [], planId: null, unlocks: "all", scopes: [] },
	tax: { enabled: false, inclusive: false, rates: [] },
	stripe: { publishableKey: "", secretKey: "", webhookSecret: "" },
	square: { environment: "production", applicationId: "", locationId: "", accessToken: "", signatureKey: "", webhookUrl: "" },
});
const stats = ref<PaymentStats | null>(null);
const plans = ref<Plan[]>([]);
const saving = ref(false);
const testing = ref(false);
const testResult = ref<{ ok: boolean; detail: string } | null>(null);
const failure = ref("");

const provider = computed<PaymentProviderId>(() => form.provider ?? "stripe");
function webhookUrlFor(id: PaymentProviderId) {
	const base = new URL(api.defaults.baseURL || "/api", window.location.origin);
	base.pathname = `${base.pathname.replace(/\/+$/, "")}/payments/webhooks/${id}`;
	return base.toString();
}
const WEBHOOK_EVENTS: Record<PaymentProviderId, string[]> = {
	stripe: ["payment_intent.succeeded", "payment_intent.payment_failed", "charge.refunded"],
	square: ["payment.created", "payment.updated", "refund.created", "refund.updated"],
};
const webhookEvents = computed(() => WEBHOOK_EVENTS[provider.value]);
const webhookUrl = computed(() => webhookUrlFor(provider.value));
const webhookSecretMissing = computed(() => (provider.value === "stripe" ? !form.stripe.webhookSecret.trim() : !form.square.signatureKey.trim()));
const available = ref<CurrencyInfo[]>([]);
const currencyName = (code: string) => available.value.find((entry) => entry.code === code)?.name ?? code;
const addable = computed(() => available.value.filter((entry) => !form.currencies.includes(entry.code)));
const hasKeys = computed(() => (provider.value === "stripe" ? Boolean(form.stripe.publishableKey && form.stripe.secretKey) : Boolean(form.square.applicationId && form.square.locationId && form.square.accessToken)));

function apply(config: PaymentConfig) {
	Object.assign(form, JSON.parse(JSON.stringify(config)));
	form.provider ??= "stripe";
	form.square.webhookUrl ||= webhookUrlFor("square");
}

async function loadCurrencies() {
	const [error, list] = await catchError(loadPaymentCurrencies(provider.value));
	if (error) {
		available.value = [];
		return;
	}
	available.value = list;
	const supported = new Set(list.map((entry) => entry.code));
	form.currencies = form.currencies.filter((code) => supported.has(code));
	if (!supported.has(form.currency) && list.length > 0) form.currency = list[0].code;
	if (!form.currencies.includes(form.currency)) form.currencies.unshift(form.currency);
}

function setDefaultCurrency(code: string) {
	form.currency = code;
	if (!form.currencies.includes(code)) form.currencies.unshift(code);
}

function addCurrency(code: string) {
	if (code && !form.currencies.includes(code)) form.currencies.push(code);
}

function removeCurrency(code: string) {
	if (code !== form.currency) form.currencies = form.currencies.filter((entry) => entry !== code);
}

watch(provider, () => {
	if (loaded.value) void loadCurrencies();
});

async function load() {
	const [error, config] = await catchError(getAdminPaymentConfig());
	if (error) {
		failure.value = describeRequestError(error, t("payments.admin.loadError"));
		return;
	}
	apply(config);
	loaded.value = true;
	void loadCurrencies();
	void listPlans()
		.then((result) => (plans.value = result))
		.catch(() => undefined);
	void getPaymentStats()
		.then((result) => (stats.value = result))
		.catch(() => undefined);
}

function payload() {
	// Secrets come back masked and are sent back unchanged, which keeps the stored value.
	return {
		enabled: form.enabled,
		provider: provider.value,
		currency: form.currency,
		currencies: form.currencies.includes(form.currency) ? form.currencies : [form.currency, ...form.currencies],
		graceDays: form.graceDays,
		grandfatherExisting: form.grandfatherExisting,
		registration: form.registration,
		tax: form.tax,
		stripe: form.stripe,
		square: form.square,
	};
}

async function save() {
	saving.value = true;
	const [error, config] = await catchError(updateAdminPaymentConfig(payload()));
	saving.value = false;
	if (error) {
		notify.error(describeRequestError(error, t("payments.admin.saveError")));
		return;
	}
	apply(config);
	void loadCurrencies();
	notify.success(t("payments.admin.saved"));
}

async function test() {
	testing.value = true;
	testResult.value = null;
	const [error, result] = await catchError(testPaymentConnection({ provider: provider.value, stripe: form.stripe, square: form.square }));
	testing.value = false;
	testResult.value = error ? { ok: false, detail: describeRequestError(error, t("payments.admin.testError")) } : result;
}

async function copyWebhook() {
	const [error] = await catchError(Promise.resolve().then(() => navigator.clipboard.writeText(webhookUrl.value)));
	if (error) notify.error(describeRequestError(error, t("payments.admin.copyFailed")));
	else notify.success(t("payments.admin.copied"));
}

function addTaxRate() {
	if (form.tax.rates.length < 10) form.tax.rates.push({ name: "", percent: 0 });
}

onMounted(load);

const label = "block text-sm font-medium";
</script>

<template>
	<div class="space-y-6">
		<p v-if="failure" class="text-sm text-red-300" role="alert">{{ failure }}</p>
		<AdminSkeleton v-else-if="!loaded" variant="table" />

		<template v-else>
			<AdminSection :title="t('payments.admin.general')" :description="t('payments.admin.generalHint')">
				<template #actions>
					<StatusPill :tone="form.enabled ? 'good' : 'neutral'">{{ form.enabled ? t("payments.admin.on") : t("payments.admin.off") }}</StatusPill>
					<button type="button" :class="primaryButton" :disabled="saving" @click="save">{{ saving ? t("payments.admin.saving") : t("common.save") }}</button>
				</template>
				<div class="space-y-3">
					<AdminToggle v-model="form.enabled" :label="t('payments.admin.enable')" :description="hasKeys ? t('payments.admin.enableHint') : t('payments.admin.needKeys')" :disabled="!form.enabled && !hasKeys" />
					<div class="grid gap-4 sm:grid-cols-3">
						<label :class="label">
							{{ t("payments.admin.defaultCurrency") }}
							<select :value="form.currency" :class="[adminSelect, 'mt-2 w-full']" @change="setDefaultCurrency(($event.target as HTMLSelectElement).value)">
								<option v-if="!available.some((entry) => entry.code === form.currency)" :value="form.currency">{{ form.currency }}</option>
								<option v-for="entry in available" :key="entry.code" :value="entry.code">{{ entry.code }} · {{ entry.name }}</option>
							</select>
							<span class="mt-1 block text-xs font-normal text-flixer-muted">{{ t("payments.admin.defaultCurrencyHint", { provider: provider === "stripe" ? "Stripe" : "Square" }) }}</span>
						</label>
						<label :class="label">
							{{ t("payments.admin.graceDays") }}
							<input v-model.number="form.graceDays" type="number" min="0" max="30" :class="[adminInput, 'mt-2 w-full']" />
							<span class="mt-1 block text-xs font-normal text-flixer-muted">{{ t("payments.admin.graceDaysHint") }}</span>
						</label>
					</div>
					<div>
						<p :class="label">{{ t("payments.admin.currencies") }}</p>
						<ul class="mt-2 flex flex-wrap gap-2" :aria-label="t('payments.admin.currencies')">
							<li v-for="code in form.currencies" :key="code" class="inline-flex items-center gap-1 rounded-full bg-white/10 py-1 pl-3 pr-1 text-xs font-semibold" :title="currencyName(code)">
								{{ code }}
								<span v-if="code === form.currency" class="rounded-full bg-flixer-primary/30 px-2 py-0.5 text-[10px] uppercase">{{ t("payments.admin.currencyDefault") }}</span>
								<button v-else type="button" class="grid size-5 place-items-center rounded-full text-flixer-muted transition hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-flixer-accent" :aria-label="t('payments.admin.removeCurrency', { code })" @click="removeCurrency(code)"><Icon icon="lucide:x" class="size-3" aria-hidden="true" /></button>
							</li>
						</ul>
						<select
							v-if="addable.length > 0"
							:class="[adminSelect, 'mt-2 w-full sm:w-72']"
							:aria-label="t('payments.admin.addCurrency')"
							@change="
								addCurrency(($event.target as HTMLSelectElement).value);
								($event.target as HTMLSelectElement).value = '';
							"
						>
							<option value="">{{ t("payments.admin.addCurrency") }}</option>
							<option v-for="entry in addable" :key="entry.code" :value="entry.code">{{ entry.code }} · {{ entry.name }}</option>
						</select>
						<p class="mt-1 text-xs text-flixer-muted">{{ t("payments.admin.currenciesHint") }}</p>
					</div>
					<AdminToggle v-model="form.grandfatherExisting" :label="t('payments.admin.grandfather')" :description="t('payments.admin.grandfatherHint')" />
				</div>
			</AdminSection>

			<AdminSection :title="t('payments.admin.provider')" :description="t('payments.admin.providerHint')">
				<div class="space-y-4">
					<div class="inline-flex rounded border border-flixer-border p-0.5" role="radiogroup" :aria-label="t('payments.admin.provider')">
						<button v-for="id in ['stripe', 'square'] as const" :key="id" type="button" role="radio" :aria-checked="provider === id" class="rounded px-4 py-1.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="provider === id ? 'bg-flixer-primary text-white' : 'text-flixer-muted hover:text-white'" @click="form.provider = id">{{ id === "stripe" ? "Stripe" : "Square" }}</button>
					</div>

					<div v-if="provider === 'stripe'" class="grid gap-4 sm:grid-cols-2">
						<label :class="label">
							{{ t("payments.admin.publishableKey") }}
							<input v-model="form.stripe.publishableKey" autocomplete="off" spellcheck="false" placeholder="pk_live_…" :class="[adminInput, 'mt-2 w-full font-mono']" />
						</label>
						<label :class="label">
							{{ t("payments.admin.secretKey") }}
							<input v-model="form.stripe.secretKey" type="password" autocomplete="new-password" spellcheck="false" placeholder="sk_live_…" :class="[adminInput, 'mt-2 w-full font-mono']" />
						</label>
						<label :class="[label, 'sm:col-span-2']">
							{{ t("payments.admin.stripeWebhookSecret") }}
							<input v-model="form.stripe.webhookSecret" type="password" autocomplete="new-password" spellcheck="false" placeholder="whsec_…" :class="[adminInput, 'mt-2 w-full font-mono']" />
							<span class="mt-1 block text-xs font-normal text-flixer-muted">{{ t("payments.admin.stripeWebhookSecretHint") }}</span>
						</label>
					</div>
					<div v-else class="grid gap-4 sm:grid-cols-2">
						<AdminToggle :model-value="form.square.environment === 'sandbox'" :label="t('payments.admin.sandbox')" :description="t('payments.admin.sandboxHint')" @update:model-value="form.square.environment = $event ? 'sandbox' : 'production'" />
						<span class="hidden sm:block"></span>
						<label :class="label">
							{{ t("payments.admin.applicationId") }}
							<input v-model="form.square.applicationId" autocomplete="off" spellcheck="false" :class="[adminInput, 'mt-2 w-full font-mono']" />
						</label>
						<label :class="label">
							{{ t("payments.admin.locationId") }}
							<input v-model="form.square.locationId" autocomplete="off" spellcheck="false" :class="[adminInput, 'mt-2 w-full font-mono']" />
						</label>
						<label :class="[label, 'sm:col-span-2']">
							{{ t("payments.admin.accessToken") }}
							<input v-model="form.square.accessToken" type="password" autocomplete="new-password" spellcheck="false" :class="[adminInput, 'mt-2 w-full font-mono']" />
						</label>
						<label :class="label">
							{{ t("payments.admin.squareSignatureKey") }}
							<input v-model="form.square.signatureKey" type="password" autocomplete="new-password" spellcheck="false" :class="[adminInput, 'mt-2 w-full font-mono']" />
							<span class="mt-1 block text-xs font-normal text-flixer-muted">{{ t("payments.admin.squareSignatureKeyHint") }}</span>
						</label>
						<label :class="label">
							{{ t("payments.admin.squareWebhookUrl") }}
							<input v-model="form.square.webhookUrl" type="url" autocomplete="off" spellcheck="false" :placeholder="webhookUrlFor('square')" :class="[adminInput, 'mt-2 w-full font-mono']" />
							<span class="mt-1 block text-xs font-normal text-flixer-muted">{{ t("payments.admin.squareWebhookUrlHint") }}</span>
						</label>
					</div>
					<p class="text-xs text-flixer-muted">{{ t("payments.admin.secretHint") }}</p>

					<div class="flex flex-wrap items-center gap-3">
						<button type="button" :class="secondaryButton" :disabled="testing || !hasKeys" @click="test">{{ testing ? t("payments.admin.testing") : t("payments.admin.test") }}</button>
						<span v-if="testResult" class="text-sm" :class="testResult.ok ? 'text-emerald-300' : 'text-red-300'" role="status">{{ testResult.detail }}</span>
					</div>

					<p v-if="webhookSecretMissing" class="rounded border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-200" role="alert">{{ t("payments.admin.webhookSecretMissing", { provider: provider === "stripe" ? "Stripe" : "Square" }) }}</p>

					<div class="rounded border border-flixer-border bg-flixer-background/40 p-3">
						<p class="text-sm font-medium">{{ t("payments.admin.webhook") }}</p>
						<p class="mt-0.5 text-xs text-flixer-muted">{{ t("payments.admin.webhookHint", { provider: provider === "stripe" ? "Stripe" : "Square" }) }}</p>
						<div class="mt-2 flex items-center gap-2">
							<code class="min-w-0 flex-1 truncate rounded bg-black/30 px-3 py-2 text-xs">{{ webhookUrl }}</code>
							<button type="button" :class="secondaryButton" @click="copyWebhook">{{ t("payments.admin.copy") }}</button>
						</div>
						<p class="mt-3 text-xs font-medium">{{ t("payments.admin.webhookEvents") }}</p>
						<ul class="mt-1 flex flex-wrap gap-1.5">
							<li v-for="event in webhookEvents" :key="event"><code class="rounded bg-black/30 px-2 py-1 text-xs">{{ event }}</code></li>
						</ul>
					</div>
				</div>
			</AdminSection>

			<AdminSection :title="t('payments.admin.registration')" :description="t('payments.admin.registrationHint')">
				<div class="space-y-4">
					<AdminToggle v-model="form.registration.enabled" :label="t('payments.admin.registrationEnable')" :description="t('payments.admin.registrationEnableHint')" />
					<template v-if="form.registration.enabled">
						<label :class="label">
							{{ t("payments.admin.registrationMode") }}
							<select v-model="form.registration.mode" :class="[adminSelect, 'mt-2 w-full sm:w-72']">
								<option value="one_time">{{ t("payments.admin.modeOneTime") }}</option>
								<option value="subscription">{{ t("payments.admin.modeSubscription") }}</option>
							</select>
						</label>
						<PriceListEditor v-if="form.registration.mode === 'one_time'" v-model="form.registration.prices" :label="t('payments.admin.registrationPrice')" :default-currency="form.currency" :currencies="form.currencies" />
						<label v-else :class="label">
							{{ t("payments.admin.registrationPlan") }}
							<select v-model="form.registration.planId" :class="[adminSelect, 'mt-2 w-full sm:w-72']">
								<option :value="null">{{ t("payments.admin.choosePlan") }}</option>
								<option v-for="plan in plans" :key="plan.id" :value="plan.id">{{ plan.name }}</option>
							</select>
							<span class="mt-1 block text-xs font-normal text-flixer-muted">{{ t("payments.admin.registrationPlanHint") }}</span>
						</label>
						<label :class="label">
							{{ t("payments.admin.unlocks") }}
							<select v-model="form.registration.unlocks" :class="[adminSelect, 'mt-2 w-full sm:w-72']">
								<option value="all">{{ t("payments.admin.unlocksAll") }}</option>
								<option value="scopes">{{ t("payments.admin.unlocksScopes") }}</option>
								<option value="none">{{ t("payments.admin.unlocksNone") }}</option>
							</select>
						</label>
						<ScopePicker v-if="form.registration.unlocks === 'scopes'" v-model="form.registration.scopes" multiple :label="t('payments.admin.unlockScopes')" />
					</template>
				</div>
			</AdminSection>

			<AdminSection :title="t('payments.admin.tax')" :description="t('payments.admin.taxHint')">
				<div class="space-y-4">
					<AdminToggle v-model="form.tax.enabled" :label="t('payments.admin.taxEnable')" />
					<template v-if="form.tax.enabled">
						<div class="inline-flex rounded border border-flixer-border p-0.5" role="radiogroup" :aria-label="t('payments.admin.taxMode')">
							<button v-for="inclusive in [false, true]" :key="String(inclusive)" type="button" role="radio" :aria-checked="form.tax.inclusive === inclusive" class="rounded px-4 py-1.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="form.tax.inclusive === inclusive ? 'bg-flixer-primary text-white' : 'text-flixer-muted hover:text-white'" @click="form.tax.inclusive = inclusive">{{ inclusive ? t("payments.admin.taxInclusive") : t("payments.admin.taxExclusive") }}</button>
						</div>
						<ul class="space-y-2">
							<li v-for="(rate, index) in form.tax.rates" :key="index" class="flex items-center gap-2">
								<input v-model="rate.name" :aria-label="t('payments.admin.taxName')" :placeholder="t('payments.admin.taxName')" maxlength="64" :class="[adminInput, 'min-w-0 flex-1']" />
								<input v-model.number="rate.percent" type="number" min="0" max="100" step="0.01" :aria-label="t('payments.admin.taxPercent')" :class="[adminInput, 'w-24']" />
								<span class="text-sm text-flixer-muted">%</span>
								<button type="button" class="grid size-9 place-items-center rounded text-flixer-muted hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-flixer-accent" :aria-label="t('payments.admin.removeTax')" @click="form.tax.rates.splice(index, 1)"><Icon icon="lucide:x" class="size-4" aria-hidden="true" /></button>
							</li>
						</ul>
						<button v-if="form.tax.rates.length < 10" type="button" class="text-xs font-semibold text-flixer-accent hover:underline focus-visible:outline-2 focus-visible:outline-flixer-accent" @click="addTaxRate">{{ t("payments.admin.addTax") }}</button>
					</template>
				</div>
			</AdminSection>

			<AdminSection v-if="stats" :title="t('payments.admin.stats')">
				<dl class="grid gap-4 sm:grid-cols-3">
					<div class="rounded border border-flixer-border bg-flixer-background/40 p-4">
						<dt class="text-xs text-flixer-muted">{{ t("payments.admin.revenue30d") }}</dt>
						<dd class="mt-1 space-y-0.5 text-lg font-semibold">
							<p v-for="entry in stats.revenue30d" :key="entry.currency">{{ money(entry.amountMinor, entry.currency) }}</p>
							<p v-if="stats.revenue30d.length === 0">—</p>
						</dd>
					</div>
					<div class="rounded border border-flixer-border bg-flixer-background/40 p-4">
						<dt class="text-xs text-flixer-muted">{{ t("payments.admin.activeSubscriptions") }}</dt>
						<dd class="mt-1 text-lg font-semibold">{{ stats.subscriptions.filter((entry) => entry.status === "active" || entry.status === "trialing").reduce((sum, entry) => sum + entry.count, 0) }}</dd>
					</div>
					<div class="rounded border border-flixer-border bg-flixer-background/40 p-4">
						<dt class="text-xs text-flixer-muted">{{ t("payments.admin.failed30d") }}</dt>
						<dd class="mt-1 text-lg font-semibold">{{ stats.failed30d }}</dd>
					</div>
				</dl>
			</AdminSection>
		</template>
	</div>
</template>
