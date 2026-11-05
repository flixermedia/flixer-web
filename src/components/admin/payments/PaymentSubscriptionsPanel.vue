<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { cancelAdminSubscription, listAdminSubscriptions, type AdminSubscription } from "../../../api";
import { confirmAction } from "../../../composables/confirm";
import { notify } from "../../../composables/notify";
import { usePaymentFormat } from "../../../composables/usePaymentFormat";
import { describeRequestError } from "../../../composables/useProfile";
import { catchError } from "../../../utils/catchError";
import AdminSection from "../AdminSection.vue";
import StatusPill from "../StatusPill.vue";
import { adminSelect, dangerButton, secondaryButton } from "./adminPaymentStyles";

const STATUSES = ["active", "trialing", "past_due", "canceled", "expired"] as const;

const { t } = useI18n();
const { money, date } = usePaymentFormat();

const subscriptions = ref<AdminSubscription[]>([]);
const status = ref("");
const loading = ref(true);
const busyId = ref("");

const tone = (value: string) => (value === "active" || value === "trialing" ? "good" : value === "past_due" ? "warn" : "neutral");
const live = (subscription: AdminSubscription) => subscription.status === "active" || subscription.status === "trialing" || subscription.status === "past_due";

async function load() {
	loading.value = true;
	const [error, list] = await catchError(listAdminSubscriptions(status.value || undefined));
	loading.value = false;
	if (error) notify.error(describeRequestError(error, t("payments.admin.loadError")));
	else subscriptions.value = list;
}

async function cancel(subscription: AdminSubscription, immediately: boolean) {
	const user = subscription.user.displayName || subscription.user.username;
	if (!(await confirmAction(t(immediately ? "payments.admin.cancelNowConfirm" : "payments.admin.cancelEndConfirm", { user, plan: subscription.planName }), { danger: true, confirmLabel: t("payments.admin.cancelSubscription") }))) return;
	busyId.value = subscription.id;
	const [error] = await catchError(cancelAdminSubscription(subscription.id, immediately));
	busyId.value = "";
	if (error) notify.error(describeRequestError(error, t("payments.admin.cancelError")));
	else {
		notify.success(t("payments.admin.canceled"));
		await load();
	}
}

watch(status, load);
onMounted(load);
</script>

<template>
	<AdminSection :title="t('payments.admin.subscriptions')" :description="t('payments.admin.subscriptionsHint')">
		<template #actions>
			<select v-model="status" :aria-label="t('payments.admin.filterStatus')" :class="adminSelect">
				<option value="">{{ t("payments.admin.allStatuses") }}</option>
				<option v-for="entry in STATUSES" :key="entry" :value="entry">{{ t(`payments.status.${entry}`) }}</option>
			</select>
		</template>
		<p v-if="!loading && subscriptions.length === 0" class="text-sm text-flixer-muted">{{ t("payments.admin.noSubscriptions") }}</p>
		<ul class="divide-y divide-flixer-border">
			<li v-for="subscription in subscriptions" :key="subscription.id" class="flex flex-wrap items-center gap-3 py-3">
				<div class="min-w-0 flex-1">
					<p class="truncate text-sm font-medium">{{ subscription.user.displayName || subscription.user.username }} · {{ subscription.planName }}</p>
					<p class="truncate text-xs text-flixer-muted">
						{{ money(subscription.amountMinor, subscription.currency) }} · {{ subscription.cancelAtPeriodEnd ? t("payments.billing.endsOn", { date: date(subscription.periodEnd) }) : t("payments.billing.renewsOn", { date: date(subscription.periodEnd) }) }}<template v-if="subscription.graceUntil"> · {{ t("payments.billing.pastDue", { date: date(subscription.graceUntil) }) }}</template>
					</p>
				</div>
				<StatusPill :tone="tone(subscription.status)">{{ t(`payments.status.${subscription.status}`) }}</StatusPill>
				<template v-if="live(subscription)">
					<button v-if="!subscription.cancelAtPeriodEnd" type="button" :class="secondaryButton" :disabled="busyId === subscription.id" @click="cancel(subscription, false)">{{ t("payments.admin.cancelAtEnd") }}</button>
					<button type="button" :class="dangerButton" :disabled="busyId === subscription.id" @click="cancel(subscription, true)">{{ t("payments.admin.cancelNow") }}</button>
				</template>
			</li>
		</ul>
	</AdminSection>
</template>
