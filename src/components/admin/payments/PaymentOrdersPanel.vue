<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { listAdminOrders, refundOrder, type AdminOrder } from "../../../api";
import { confirmAction } from "../../../composables/confirm";
import { notify } from "../../../composables/notify";
import { usePaymentFormat } from "../../../composables/usePaymentFormat";
import { describeRequestError } from "../../../composables/useProfile";
import { catchError } from "../../../utils/catchError";
import AdminSection from "../AdminSection.vue";
import StatusPill from "../StatusPill.vue";
import { adminSelect, dangerButton, secondaryButton } from "./adminPaymentStyles";

const PAGE_SIZE = 25;
const STATUSES = ["paid", "pending", "requires_action", "failed", "refunded", "partially_refunded"] as const;

const { t } = useI18n();
const { money, dateTime } = usePaymentFormat();

const orders = ref<AdminOrder[]>([]);
const total = ref(0);
const page = ref(0);
const status = ref("");
const loading = ref(true);
const busyId = ref("");

const pages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)));
const tone = (value: string) => (value === "paid" ? "good" : value === "failed" ? "bad" : value === "pending" || value === "requires_action" ? "warn" : "neutral");
const refundable = (order: AdminOrder) => (order.status === "paid" || order.status === "partially_refunded") && order.refundedMinor < order.totalMinor;

async function load() {
	loading.value = true;
	const [error, result] = await catchError(listAdminOrders(page.value, status.value || undefined));
	loading.value = false;
	if (error) notify.error(describeRequestError(error, t("payments.admin.loadError")));
	else {
		orders.value = result.items;
		total.value = result.total;
	}
}

async function refund(order: AdminOrder) {
	const remaining = money(order.totalMinor - order.refundedMinor, order.currency);
	if (!(await confirmAction(t("payments.admin.refundConfirm", { amount: remaining, user: order.user.displayName || order.user.username }), { danger: true, confirmLabel: t("payments.admin.refund") }))) return;
	busyId.value = order.id;
	const [error] = await catchError(refundOrder(order.id));
	busyId.value = "";
	if (error) notify.error(describeRequestError(error, t("payments.admin.refundError")));
	else {
		notify.success(t("payments.admin.refunded"));
		await load();
	}
}

watch(status, () => {
	page.value = 0;
	void load();
});
onMounted(load);
</script>

<template>
	<AdminSection :title="t('payments.admin.orders')" :description="t('payments.admin.ordersHint')">
		<template #actions>
			<select v-model="status" :aria-label="t('payments.admin.filterStatus')" :class="adminSelect">
				<option value="">{{ t("payments.admin.allStatuses") }}</option>
				<option v-for="entry in STATUSES" :key="entry" :value="entry">{{ t(`payments.orderStatus.${entry}`) }}</option>
			</select>
		</template>
		<p v-if="!loading && orders.length === 0" class="text-sm text-flixer-muted">{{ t("payments.admin.noOrders") }}</p>
		<ul class="divide-y divide-flixer-border">
			<li v-for="order in orders" :key="order.id" class="flex flex-wrap items-center gap-3 py-3">
				<div class="min-w-0 flex-1">
					<p class="truncate text-sm font-medium">{{ order.description }}</p>
					<p class="truncate text-xs text-flixer-muted">
						{{ order.user.displayName || order.user.username }} · {{ dateTime(order.createdAt) }} · {{ order.provider }}<template v-if="order.couponCode"> · {{ order.couponCode }}</template
						><template v-if="order.refundedMinor > 0"> · {{ t("payments.billing.refunded", { amount: money(order.refundedMinor, order.currency) }) }}</template>
					</p>
					<p v-if="order.failure" class="truncate text-xs text-red-300">{{ order.failure }}</p>
				</div>
				<span class="text-sm font-semibold">{{ money(order.totalMinor, order.currency) }}</span>
				<StatusPill :tone="tone(order.status)">{{ t(`payments.orderStatus.${order.status}`) }}</StatusPill>
				<button v-if="refundable(order)" type="button" :class="dangerButton" :disabled="busyId === order.id" @click="refund(order)">{{ t("payments.admin.refund") }}</button>
			</li>
		</ul>
		<div v-if="pages > 1" class="mt-4 flex items-center justify-between text-sm">
			<button type="button" :class="secondaryButton" :disabled="page === 0" @click="(page--, load())">{{ t("payments.admin.previous") }}</button>
			<span class="text-flixer-muted">{{ t("payments.admin.pageOf", { page: page + 1, pages }) }}</span>
			<button type="button" :class="secondaryButton" :disabled="page + 1 >= pages" @click="(page++, load())">{{ t("payments.admin.next") }}</button>
		</div>
	</AdminSection>
</template>
