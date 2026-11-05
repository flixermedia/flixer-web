<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { minorDigits, minorToInput, parseMinor, type Price } from "../../../api";
import { adminInput, adminSelect } from "./adminPaymentStyles";

const props = defineProps<{ label: string; defaultCurrency: string; currencies: string[] }>();
const model = defineModel<Price[]>({ required: true });
const { t } = useI18n();

const accepted = computed(() => (props.currencies.includes(props.defaultCurrency) ? props.currencies : [props.defaultCurrency, ...props.currencies]));
const nextCurrency = computed(() => {
	const used = new Set(model.value.map((price) => price.currency));
	return [props.defaultCurrency, ...accepted.value].find((code) => !used.has(code)) ?? null;
});

function setAmount(index: number, input: HTMLInputElement) {
	const minor = parseMinor(input.value, model.value[index].currency);
	if (minor !== null) model.value = model.value.map((price, at) => (at === index ? { ...price, amountMinor: minor } : price));
	else input.value = minorToInput(model.value[index].amountMinor, model.value[index].currency);
}

// Keeps the same value in major units, re-expressed in the new currency's minor units.
function setCurrency(index: number, currency: string) {
	model.value = model.value.map((price, at) => {
		if (at !== index) return price;
		const major = price.amountMinor / 10 ** minorDigits(price.currency);
		return { currency, amountMinor: Math.round(major * 10 ** minorDigits(currency)) };
	});
}

function add() {
	const currency = nextCurrency.value;
	if (currency) model.value = [...model.value, { currency, amountMinor: 0 }];
}
</script>

<template>
	<fieldset class="min-w-0">
		<legend class="text-sm font-medium">{{ label }}</legend>
		<ul class="mt-2 space-y-2">
			<li v-for="(price, index) in model" :key="index" class="flex items-center gap-2">
				<select :value="price.currency" :aria-label="t('payments.admin.currency')" :class="[adminSelect, 'w-28']" @change="setCurrency(index, ($event.target as HTMLSelectElement).value)">
					<option v-for="code in accepted.filter((code) => code === price.currency || !model.some((other) => other.currency === code))" :key="code" :value="code">{{ code }}</option>
					<option v-if="!accepted.includes(price.currency)" :value="price.currency" disabled>{{ price.currency }}</option>
				</select>
				<input :key="price.currency" :value="minorToInput(price.amountMinor, price.currency)" inputmode="decimal" :aria-label="t('payments.admin.amount')" :class="[adminInput, 'min-w-0 flex-1']" @change="setAmount(index, $event.target as HTMLInputElement)" />
				<button type="button" class="grid size-9 shrink-0 place-items-center rounded text-flixer-muted transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-flixer-accent" :aria-label="t('payments.admin.removePrice')" @click="model = model.filter((_, at) => at !== index)"><Icon icon="lucide:x" class="size-4" aria-hidden="true" /></button>
			</li>
		</ul>
		<button v-if="nextCurrency" type="button" class="mt-2 text-xs font-semibold text-flixer-accent hover:underline focus-visible:outline-2 focus-visible:outline-flixer-accent" @click="add">{{ t("payments.admin.addPrice") }}</button>
	</fieldset>
</template>
