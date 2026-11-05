<script setup lang="ts">
import { openModal } from "@kolirt/vue-modal";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { deleteCoupon, listCoupons, listPlans, listProducts, type Coupon, type Plan, type Product } from "../../../api";
import { confirmAction } from "../../../composables/confirm";
import { notify } from "../../../composables/notify";
import { usePaymentFormat } from "../../../composables/usePaymentFormat";
import { describeRequestError } from "../../../composables/useProfile";
import { catchError } from "../../../utils/catchError";
import AdminSection from "../AdminSection.vue";
import StatusPill from "../StatusPill.vue";
import { dangerButton, primaryButton, secondaryButton } from "./adminPaymentStyles";
import CouponEditModal from "./CouponEditModal.vue";

const props = defineProps<{ currency: string; currencies: string[] }>();
const { t } = useI18n();
const { price, date } = usePaymentFormat();

const coupons = ref<Coupon[]>([]);
const products = ref<Product[]>([]);
const plans = ref<Plan[]>([]);
const loading = ref(true);
async function load() {
	const [error, results] = await catchError(Promise.all([listCoupons(), listProducts(), listPlans()]));
	loading.value = false;
	if (error) notify.error(describeRequestError(error, t("payments.admin.loadError")));
	else [coupons.value, products.value, plans.value] = results;
}

async function edit(coupon?: Coupon) {
	const refresh = await openModal<boolean>(CouponEditModal, { props: { coupon: coupon ?? null, currency: props.currency, currencies: props.currencies, products: products.value, plans: plans.value } }).catch(() => false);
	if (refresh) await load();
}

async function remove(coupon: Coupon) {
	if (!(await confirmAction(t("payments.admin.deleteConfirm", { name: coupon.code }), { danger: true, confirmLabel: t("common.delete") }))) return;
	const [error] = await catchError(deleteCoupon(coupon.id));
	if (error) notify.error(describeRequestError(error, t("payments.admin.deleteError")));
	else await load();
}

const discount = (coupon: Coupon) => (coupon.percentOff ? `${coupon.percentOff}%` : (coupon.amountOff ?? []).map((entry) => price(entry)).join(", "));

onMounted(load);
</script>

<template>
	<AdminSection :title="t('payments.admin.coupons')" :description="t('payments.admin.couponsHint')">
		<template #actions>
			<button type="button" :class="primaryButton" @click="edit()">{{ t("payments.admin.newCoupon") }}</button>
		</template>

		<p v-if="!loading && coupons.length === 0" class="text-sm text-flixer-muted">{{ t("payments.admin.noCoupons") }}</p>
		<ul class="divide-y divide-flixer-border">
			<li v-for="coupon in coupons" :key="coupon.id" class="flex flex-wrap items-center gap-3 py-3">
				<div class="min-w-0 flex-1">
					<p class="flex flex-wrap items-center gap-2 text-sm font-medium">
						<code class="rounded bg-black/30 px-2 py-0.5 text-xs">{{ coupon.code }}</code>
						{{ discount(coupon) }}
						<StatusPill v-if="!coupon.active" tone="warn">{{ t("payments.admin.inactive") }}</StatusPill>
					</p>
					<p class="truncate text-xs text-flixer-muted">
						{{ t("payments.admin.redeemed", { count: coupon.redeemed, max: coupon.maxRedemptions ?? "∞" }) }}<template v-if="coupon.expiresAt"> · {{ t("payments.admin.expiresOn", { date: date(coupon.expiresAt) }) }}</template>
					</p>
				</div>
				<button type="button" :class="secondaryButton" @click="edit(coupon)">{{ t("payments.admin.edit") }}</button>
				<button type="button" :class="dangerButton" @click="remove(coupon)">{{ t("common.delete") }}</button>
			</li>
		</ul>
	</AdminSection>
</template>
