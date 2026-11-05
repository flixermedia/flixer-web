<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from "@kolirt/vue-modal";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { saveProduct, type Product, type ProductInput } from "../../../api";
import { notify } from "../../../composables/notify";
import { describeRequestError } from "../../../composables/useProfile";
import { catchError } from "../../../utils/catchError";
import AdminToggle from "../AdminToggle.vue";
import { adminInput, adminSelect, secondaryButton } from "./adminPaymentStyles";
import PriceListEditor from "./PriceListEditor.vue";
import ScopePicker from "./ScopePicker.vue";

defineOptions({ modalGroup: "default" });

const props = defineProps<{ product: Product | null; currency: string; currencies: string[]; sortOrder: number }>();

// Resolves true when the list needs a refresh.
const { close, confirm } = useModalContext<boolean>();
const { t } = useI18n();
const saving = ref(false);

const blank = (): ProductInput => ({ name: "", description: null, kind: "buy", scope: { type: "all", ref: null }, prices: [{ currency: props.currency, amountMinor: 0 }], rentalHours: null, rentalStart: "purchase", requiresPurchase: false, active: true, sortOrder: props.sortOrder });
const editing = ref<{ id: string | null; data: ProductInput }>(props.product ? { id: props.product.id, data: JSON.parse(JSON.stringify({ ...props.product, id: undefined })) as ProductInput } : { id: null, data: blank() });
const scopes = computed({
	get: () => [editing.value.data.scope],
	set: (value) => {
		if (value[0]) editing.value.data.scope = value[0];
	},
});

async function save() {
	const current = editing.value;
	const data = { ...current.data, rentalHours: current.data.kind === "rent" ? (current.data.rentalHours ?? 48) : null, description: current.data.description?.trim() || null };
	saving.value = true;
	const [error] = await catchError(saveProduct(current.id, data));
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
				<div class="grid size-11 shrink-0 place-items-center rounded bg-flixer-primary/15 text-flixer-accent"><Icon icon="lucide:package" class="size-5" aria-hidden="true" /></div>
				<div class="min-w-0 flex-1">
					<ModalTitle class="text-lg font-semibold">{{ props.product ? t('payments.admin.edit') : t('payments.admin.newProduct') }}</ModalTitle>
					<ModalDescription class="mt-0.5 text-sm text-flixer-muted">{{ t("payments.admin.productModalHint") }}</ModalDescription>
				</div>
			</header>
			<div class="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-6 py-5 [scrollbar-width:thin]">
			<form id="payment-edit-form" class="space-y-6" @submit.prevent="save">
				<div class="grid gap-4 sm:grid-cols-2">
					<label class="block text-sm font-medium">
						{{ t("payments.admin.name") }}
						<input v-model="editing.data.name" required maxlength="120" :class="[adminInput, 'mt-2 w-full']" />
					</label>
					<label class="block text-sm font-medium">
						{{ t("payments.admin.kind") }}
						<select v-model="editing.data.kind" :class="[adminSelect, 'mt-2 w-full']">
							<option value="buy">{{ t("payments.offers.kinds.buy") }}</option>
							<option value="rent">{{ t("payments.offers.kinds.rent") }}</option>
						</select>
					</label>
				</div>
				<label class="block text-sm font-medium">
					{{ t("payments.admin.description") }}
					<input :value="editing.data.description ?? ''" maxlength="500" :class="[adminInput, 'mt-2 w-full']" @input="editing.data.description = ($event.target as HTMLInputElement).value" />
				</label>
				<div v-if="editing.data.kind === 'rent'" class="grid gap-4 sm:grid-cols-2">
					<label class="block text-sm font-medium">
						{{ t("payments.admin.rentalHours") }}
						<input v-model.number="editing.data.rentalHours" type="number" min="1" max="8760" :class="[adminInput, 'mt-2 w-full']" />
					</label>
					<label class="block text-sm font-medium">
						{{ t("payments.admin.rentalStart") }}
						<select v-model="editing.data.rentalStart" :class="[adminSelect, 'mt-2 w-full']">
							<option value="purchase">{{ t("payments.admin.startPurchase") }}</option>
							<option value="first_play">{{ t("payments.admin.startFirstPlay") }}</option>
						</select>
					</label>
				</div>
				<div class="border-t border-flixer-border pt-5">
					<PriceListEditor v-model="editing.data.prices" :label="t('payments.admin.prices')" :default-currency="currency" :currencies="currencies" />
				</div>
				<div class="border-t border-flixer-border pt-5">
					<ScopePicker v-model="scopes" required :label="t('payments.admin.productScope')" />
				</div>
				<div class="border-t border-flixer-border pt-5"><AdminToggle v-model="editing.data.requiresPurchase" :label="t('payments.admin.requiresPurchase')" :description="t('payments.admin.requiresPurchaseHint')" /></div>
				<div class="border-t border-flixer-border pt-5"><AdminToggle v-model="editing.data.active" :label="t('payments.admin.active')" /></div>
			</form>
			</div>
			<footer class="flex shrink-0 flex-col-reverse gap-3 border-t border-flixer-border px-6 py-4 sm:flex-row sm:justify-end">
				<button type="button" :class="secondaryButton" :disabled="saving" @click="close()">{{ t("common.cancel") }}</button>
				<button type="submit" form="payment-edit-form" class="flex h-11 items-center justify-center rounded bg-flixer-primary px-6 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:opacity-60" :disabled="saving">{{ t("common.save") }}</button>
			</footer>
		</ModalContent>
	</ModalRoot>
</template>
