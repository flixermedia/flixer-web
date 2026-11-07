<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from "@kolirt/vue-modal";
import { computed, ref, useId } from "vue";
import { useI18n } from "vue-i18n";
import { saveCoupon, type Coupon, type CouponInput, type Plan, type Price, type Product } from "../../../api";
import { notify } from "../../../composables/notify";
import { describeRequestError } from "../../../composables/useProfile";
import { catchError } from "../../../utils/catchError";
import AdminToggle from "../AdminToggle.vue";
import { adminInput, secondaryButton } from "./adminPaymentStyles";
import PriceListEditor from "./PriceListEditor.vue";

defineOptions({ modalGroup: "default" });

const props = defineProps<{ coupon: Coupon | null; currency: string; currencies: string[]; products: Product[]; plans: Plan[] }>();

// Resolves true when the list needs a refresh.
const { close, confirm } = useModalContext<boolean>();
const { t } = useI18n();
const saving = ref(false);
const formId = `payment-edit-${useId()}`;

type Editing = { id: string | null; data: CouponInput; type: "percent" | "amount"; expires: string };
const editing = ref<Editing>(
	props.coupon
		? { id: props.coupon.id, type: props.coupon.percentOff ? "percent" : "amount", expires: props.coupon.expiresAt?.slice(0, 10) ?? "", data: JSON.parse(JSON.stringify({ ...props.coupon, id: undefined, redeemed: undefined })) as CouponInput }
		: { id: null, type: "percent", expires: "", data: { code: "", description: null, percentOff: 10, amountOff: null, maxRedemptions: null, expiresAt: null, productIds: [], planIds: [], active: true } },
);

const amountOff = computed<Price[]>({
	get: () => editing.value.data.amountOff ?? [],
	set: (value) => {
		editing.value.data.amountOff = value;
	},
});

function chooseType(type: "percent" | "amount") {
	editing.value.type = type;
	editing.value.data.percentOff = type === "percent" ? (editing.value.data.percentOff ?? 10) : null;
	editing.value.data.amountOff = type === "amount" ? (editing.value.data.amountOff?.length ? editing.value.data.amountOff : [{ currency: props.currency, amountMinor: 0 }]) : null;
}

function toggleId(list: string[], id: string) {
	return list.includes(id) ? list.filter((entry) => entry !== id) : [...list, id];
}

async function save() {
	const current = editing.value;
	const data: CouponInput = { ...current.data, code: current.data.code.trim().toUpperCase(), description: current.data.description?.trim() || null, expiresAt: current.expires ? new Date(`${current.expires}T23:59:59`).toISOString() : null, maxRedemptions: current.data.maxRedemptions || null };
	saving.value = true;
	const [error] = await catchError(saveCoupon(current.id, data));
	saving.value = false;
	if (error) {
		notify.error(describeRequestError(error, t("payments.admin.saveError")));
		return;
	}
	notify.success(t("payments.admin.saved"));
	confirm(true);
}
</script>

<template>
	<ModalRoot class="flex items-center justify-center p-4">
		<ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col rounded border border-flixer-border bg-flixer-surface text-flixer-text shadow-2xl shadow-black/60">
			<header class="flex shrink-0 items-center gap-4 border-b border-flixer-border px-6 py-5">
				<div class="grid size-11 shrink-0 place-items-center rounded bg-flixer-primary/15 text-flixer-accent"><Icon icon="lucide:ticket" class="size-5" aria-hidden="true" /></div>
				<div class="min-w-0 flex-1">
					<ModalTitle class="text-lg font-semibold">{{ props.coupon ? t('payments.admin.edit') : t('payments.admin.newCoupon') }}</ModalTitle>
					<ModalDescription class="mt-0.5 text-sm text-flixer-muted">{{ t("payments.admin.couponModalHint") }}</ModalDescription>
				</div>
			</header>
			<div class="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-6 py-5 [scrollbar-width:thin]">
			<form :id="formId" class="space-y-6" @submit.prevent="save">
				<div class="grid gap-4 sm:grid-cols-2">
					<label class="block text-sm font-medium">
						{{ t("payments.admin.code") }}
						<input v-model="editing.data.code" required minlength="3" maxlength="64" pattern="[A-Za-z0-9_\-]+" autocapitalize="characters" :class="[adminInput, 'mt-2 w-full font-mono uppercase']" />
					</label>
					<label class="block text-sm font-medium">
						{{ t("payments.admin.description") }}
						<input :value="editing.data.description ?? ''" maxlength="200" :class="[adminInput, 'mt-2 w-full']" @input="editing.data.description = ($event.target as HTMLInputElement).value" />
					</label>
				</div>
				<div class="space-y-3 border-t border-flixer-border pt-5">
					<div class="inline-flex rounded border border-flixer-border p-0.5" role="radiogroup" :aria-label="t('payments.admin.discountType')">
						<button v-for="type in ['percent', 'amount'] as const" :key="type" type="button" role="radio" :aria-checked="editing.type === type" class="rounded px-4 py-1.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="editing.type === type ? 'bg-flixer-primary text-white' : 'text-flixer-muted hover:text-white'" @click="chooseType(type)">{{ type === "percent" ? t("payments.admin.percentOff") : t("payments.admin.amountOff") }}</button>
					</div>
					<label v-if="editing.type === 'percent'" class="block text-sm font-medium sm:w-1/2">
						{{ t("payments.admin.percentOff") }}
						<input v-model.number="editing.data.percentOff" type="number" min="1" max="100" step="1" required :class="[adminInput, 'mt-2 w-full']" />
					</label>
					<PriceListEditor v-else v-model="amountOff" :label="t('payments.admin.amountOff')" :default-currency="currency" :currencies="currencies" />
				</div>
				<div class="grid gap-4 sm:grid-cols-2">
					<label class="block text-sm font-medium">
						{{ t("payments.admin.maxRedemptions") }}
						<input v-model.number="editing.data.maxRedemptions" type="number" min="1" :placeholder="t('payments.admin.unlimited')" :class="[adminInput, 'mt-2 w-full']" />
					</label>
					<label class="block text-sm font-medium">
						{{ t("payments.admin.expires") }}
						<input v-model="editing.expires" type="date" :class="[adminInput, 'mt-2 w-full']" />
					</label>
				</div>
				<fieldset v-if="products.length + plans.length > 0" class="border-t border-flixer-border pt-5">
					<legend class="text-sm font-medium">{{ t("payments.admin.couponLimit") }}</legend>
					<p class="mt-0.5 text-xs text-flixer-muted">{{ t("payments.admin.couponLimitHint") }}</p>
					<div class="mt-2 flex flex-wrap gap-2">
						<label v-for="product in products" :key="product.id" class="inline-flex cursor-pointer items-center gap-2 rounded-full border border-flixer-border px-3 py-1 text-xs">
							<input type="checkbox" :checked="editing.data.productIds.includes(product.id)" @change="editing.data.productIds = toggleId(editing.data.productIds, product.id)" />
							{{ product.name }}
						</label>
						<label v-for="plan in plans" :key="plan.id" class="inline-flex cursor-pointer items-center gap-2 rounded-full border border-flixer-border px-3 py-1 text-xs">
							<input type="checkbox" :checked="editing.data.planIds.includes(plan.id)" @change="editing.data.planIds = toggleId(editing.data.planIds, plan.id)" />
							{{ plan.name }}
						</label>
					</div>
				</fieldset>
				<div class="border-t border-flixer-border pt-5"><AdminToggle v-model="editing.data.active" :label="t('payments.admin.active')" /></div>
			</form>
			</div>
			<footer class="flex shrink-0 flex-col-reverse gap-3 border-t border-flixer-border px-6 py-4 sm:flex-row sm:justify-end">
				<button type="button" :class="secondaryButton" :disabled="saving" @click="close()">{{ t("common.cancel") }}</button>
				<button type="submit" :form="formId" class="flex h-11 items-center justify-center rounded bg-flixer-primary px-6 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:opacity-60" :disabled="saving">{{ t("common.save") }}</button>
			</footer>
		</ModalContent>
	</ModalRoot>
</template>
