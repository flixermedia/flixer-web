<script setup lang="ts">
import { openModal } from "@kolirt/vue-modal";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { deleteProduct, listProducts, type Product } from "../../../api";
import { confirmAction } from "../../../composables/confirm";
import { notify } from "../../../composables/notify";
import { usePaymentFormat } from "../../../composables/usePaymentFormat";
import { describeRequestError } from "../../../composables/useProfile";
import { catchError } from "../../../utils/catchError";
import AdminSection from "../AdminSection.vue";
import StatusPill from "../StatusPill.vue";
import { dangerButton, primaryButton, secondaryButton } from "./adminPaymentStyles";
import ProductEditModal from "./ProductEditModal.vue";

const props = defineProps<{ currency: string; currencies: string[] }>();
const { t } = useI18n();
const { price, hours } = usePaymentFormat();

const products = ref<Product[]>([]);
const loading = ref(true);
async function load() {
	const [error, list] = await catchError(listProducts());
	loading.value = false;
	if (error) notify.error(describeRequestError(error, t("payments.admin.loadError")));
	else products.value = list;
}

async function edit(product?: Product) {
	const refresh = await openModal<boolean>(ProductEditModal, { props: { product: product ?? null, currency: props.currency, currencies: props.currencies, sortOrder: products.value.length } }).catch(() => false);
	if (refresh) await load();
}

async function remove(product: Product) {
	if (!(await confirmAction(t("payments.admin.deleteConfirm", { name: product.name }), { danger: true, confirmLabel: t("common.delete") }))) return;
	const [error] = await catchError(deleteProduct(product.id));
	if (error) notify.error(describeRequestError(error, t("payments.admin.deleteError")));
	else await load();
}

function scopeLabel(product: Product) {
	const scope = product.scope;
	return scope.type === "all" ? t("payments.scope.all") : scope.type === "kind" ? t("payments.scope.kindOf", { kind: t(`payments.kinds.${scope.ref}`) }) : scope.label || scope.ref || "";
}

onMounted(load);
</script>

<template>
	<AdminSection :title="t('payments.admin.products')" :description="t('payments.admin.productsHint')">
		<template #actions>
			<button type="button" :class="primaryButton" @click="edit()">{{ t("payments.admin.newProduct") }}</button>
		</template>

		<p v-if="!loading && products.length === 0" class="text-sm text-flixer-muted">{{ t("payments.admin.noProducts") }}</p>
		<ul class="divide-y divide-flixer-border">
			<li v-for="product in products" :key="product.id" class="flex flex-wrap items-center gap-3 py-3">
				<div class="min-w-0 flex-1">
					<p class="flex flex-wrap items-center gap-2 text-sm font-medium">
						{{ product.name }}
						<StatusPill :tone="product.kind === 'rent' ? 'accent' : 'neutral'">{{ t(`payments.offers.kinds.${product.kind}`) }}</StatusPill>
						<StatusPill v-if="!product.active" tone="warn">{{ t("payments.admin.inactive") }}</StatusPill>
					</p>
					<p class="truncate text-xs text-flixer-muted">
						{{ scopeLabel(product) }} · {{ product.prices.map((entry) => price(entry)).join(", ") }}<template v-if="product.kind === 'rent' && product.rentalHours"> · {{ hours(product.rentalHours) }}</template>
					</p>
				</div>
				<button type="button" :class="secondaryButton" @click="edit(product)">{{ t("payments.admin.edit") }}</button>
				<button type="button" :class="dangerButton" @click="remove(product)">{{ t("common.delete") }}</button>
			</li>
		</ul>
	</AdminSection>
</template>
