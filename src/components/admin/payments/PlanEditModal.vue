<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from "@kolirt/vue-modal";
import { ref, useId } from "vue";
import { useI18n } from "vue-i18n";
import { savePlan, type Plan, type PlanInput } from "../../../api";
import { notify } from "../../../composables/notify";
import { describeRequestError } from "../../../composables/useProfile";
import { catchError } from "../../../utils/catchError";
import AdminToggle from "../AdminToggle.vue";
import { adminInput, adminSelect, secondaryButton } from "./adminPaymentStyles";
import PriceListEditor from "./PriceListEditor.vue";
import ScopePicker from "./ScopePicker.vue";

defineOptions({ modalGroup: "default" });

const props = defineProps<{ plan: Plan | null; currency: string; currencies: string[]; sortOrder: number }>();

// Resolves true when the list needs a refresh.
const { close, confirm } = useModalContext<boolean>();
const { t } = useI18n();
const saving = ref(false);
const formId = `payment-edit-${useId()}`;

const blank = (): PlanInput => ({ name: "", description: null, interval: "month", prices: [{ currency: props.currency, amountMinor: 0 }], scopes: [{ type: "all", ref: null }], trialDays: 0, adsExempt: false, active: true, sortOrder: props.sortOrder });
const editing = ref<{ id: string | null; data: PlanInput }>(props.plan ? { id: props.plan.id, data: JSON.parse(JSON.stringify({ ...props.plan, id: undefined })) as PlanInput } : { id: null, data: blank() });

async function save() {
	const current = editing.value;
	if (current.data.scopes.length === 0) {
		notify.error(t("payments.admin.planNeedsScope"));
		return;
	}
	saving.value = true;
	const [error] = await catchError(savePlan(current.id, { ...current.data, description: current.data.description?.trim() || null }));
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
				<div class="grid size-11 shrink-0 place-items-center rounded bg-flixer-primary/15 text-flixer-accent"><Icon icon="lucide:repeat" class="size-5" aria-hidden="true" /></div>
				<div class="min-w-0 flex-1">
					<ModalTitle class="text-lg font-semibold">{{ props.plan ? t('payments.admin.edit') : t('payments.admin.newPlan') }}</ModalTitle>
					<ModalDescription class="mt-0.5 text-sm text-flixer-muted">{{ t("payments.admin.planModalHint") }}</ModalDescription>
				</div>
			</header>
			<div class="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-6 py-5 [scrollbar-width:thin]">
			<form :id="formId" class="space-y-6" @submit.prevent="save">
				<div class="grid gap-4 sm:grid-cols-2">
					<label class="block text-sm font-medium">
						{{ t("payments.admin.name") }}
						<input v-model="editing.data.name" required maxlength="120" :class="[adminInput, 'mt-2 w-full']" />
					</label>
					<label class="block text-sm font-medium">
						{{ t("payments.admin.interval") }}
						<select v-model="editing.data.interval" :class="[adminSelect, 'mt-2 w-full']">
							<option value="month">{{ t("payments.interval.month") }}</option>
							<option value="year">{{ t("payments.interval.year") }}</option>
						</select>
					</label>
				</div>
				<label class="block text-sm font-medium">
					{{ t("payments.admin.description") }}
					<input :value="editing.data.description ?? ''" maxlength="500" :class="[adminInput, 'mt-2 w-full']" @input="editing.data.description = ($event.target as HTMLInputElement).value" />
				</label>
				<label class="block text-sm font-medium sm:w-1/2">
					{{ t("payments.admin.trialDays") }}
					<input v-model.number="editing.data.trialDays" type="number" min="0" max="365" :class="[adminInput, 'mt-2 w-full']" />
				</label>
				<div class="border-t border-flixer-border pt-5">
					<PriceListEditor v-model="editing.data.prices" :label="t('payments.admin.prices')" :default-currency="currency" :currencies="currencies" />
				</div>
				<div class="border-t border-flixer-border pt-5">
					<ScopePicker v-model="editing.data.scopes" multiple :label="t('payments.admin.planScopes')" />
				</div>
				<div class="border-t border-flixer-border pt-5"><AdminToggle v-model="editing.data.adsExempt" :label="t('payments.admin.adsExempt')" :description="t('payments.admin.planAdsExemptHint')" /></div>
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
