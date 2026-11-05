<script setup lang="ts">
import { onMounted, ref } from "vue";
import { getAdminPaymentConfig } from "../../../api";
import PaymentCouponsPanel from "./PaymentCouponsPanel.vue";
import PaymentPlansPanel from "./PaymentPlansPanel.vue";
import PaymentProductsPanel from "./PaymentProductsPanel.vue";

import { loadPaymentCurrencies } from "../../../composables/usePaymentCurrencies";

const currency = ref<string | null>(null);
const currencies = ref<string[]>([]);

onMounted(async () => {
	const config = await getAdminPaymentConfig().catch(() => null);
	currency.value = config?.currency ?? "USD";
	currencies.value = config?.currencies ?? [currency.value];
	await loadPaymentCurrencies().catch(() => undefined);
});
</script>

<template>
	<div v-if="currency" class="space-y-6">
		<PaymentProductsPanel :currency="currency" :currencies="currencies" />
		<PaymentPlansPanel :currency="currency" :currencies="currencies" />
		<PaymentCouponsPanel :currency="currency" :currencies="currencies" />
	</div>
</template>
