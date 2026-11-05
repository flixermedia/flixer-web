<script setup lang="ts">
import { openModal } from "@kolirt/vue-modal";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { deletePlan, listPlans, type Plan } from "../../../api";
import { confirmAction } from "../../../composables/confirm";
import { notify } from "../../../composables/notify";
import { usePaymentFormat } from "../../../composables/usePaymentFormat";
import { describeRequestError } from "../../../composables/useProfile";
import { catchError } from "../../../utils/catchError";
import AdminSection from "../AdminSection.vue";
import StatusPill from "../StatusPill.vue";
import { dangerButton, primaryButton, secondaryButton } from "./adminPaymentStyles";
import PlanEditModal from "./PlanEditModal.vue";

const props = defineProps<{ currency: string; currencies: string[] }>();
const { t } = useI18n();
const { price, interval } = usePaymentFormat();

const plans = ref<Plan[]>([]);
const loading = ref(true);
async function load() {
	const [error, list] = await catchError(listPlans());
	loading.value = false;
	if (error) notify.error(describeRequestError(error, t("payments.admin.loadError")));
	else plans.value = list;
}

async function edit(plan?: Plan) {
	const refresh = await openModal<boolean>(PlanEditModal, { props: { plan: plan ?? null, currency: props.currency, currencies: props.currencies, sortOrder: plans.value.length } }).catch(() => false);
	if (refresh) await load();
}

async function remove(plan: Plan) {
	if (!(await confirmAction(t("payments.admin.deleteConfirm", { name: plan.name }), { danger: true, confirmLabel: t("common.delete") }))) return;
	const [error] = await catchError(deletePlan(plan.id));
	if (error) notify.error(describeRequestError(error, t("payments.admin.deleteError")));
	else await load();
}

onMounted(load);
</script>

<template>
	<AdminSection :title="t('payments.admin.plans')" :description="t('payments.admin.plansHint')">
		<template #actions>
			<button type="button" :class="primaryButton" @click="edit()">{{ t("payments.admin.newPlan") }}</button>
		</template>

		<p v-if="!loading && plans.length === 0" class="text-sm text-flixer-muted">{{ t("payments.admin.noPlans") }}</p>
		<ul class="divide-y divide-flixer-border">
			<li v-for="plan in plans" :key="plan.id" class="flex flex-wrap items-center gap-3 py-3">
				<div class="min-w-0 flex-1">
					<p class="flex flex-wrap items-center gap-2 text-sm font-medium">
						{{ plan.name }}
						<StatusPill v-if="!plan.active" tone="warn">{{ t("payments.admin.inactive") }}</StatusPill>
						<StatusPill v-if="plan.trialDays > 0" tone="accent">{{ t("payments.offers.trial", { days: plan.trialDays }) }}</StatusPill>
					</p>
					<p class="truncate text-xs text-flixer-muted">{{ plan.prices.map((entry) => price(entry)).join(", ") }} / {{ interval(plan.interval) }} · {{ t("payments.admin.scopeCount", { count: plan.scopes.length }) }}</p>
				</div>
				<button type="button" :class="secondaryButton" @click="edit(plan)">{{ t("payments.admin.edit") }}</button>
				<button type="button" :class="dangerButton" @click="remove(plan)">{{ t("common.delete") }}</button>
			</li>
		</ul>
	</AdminSection>
</template>
