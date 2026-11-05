<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { addPaymentMethod, beginMethodSetup, type CardSetup, type SavedCard } from "../../api";
import { notify } from "../../composables/notify";
import { describeRequestError } from "../../composables/useProfile";
import { catchError } from "../../utils/catchError";
import CardElement from "./CardElement.vue";

defineProps<{ cancellable?: boolean }>();
const emit = defineEmits<{ added: [card: SavedCard]; cancel: [] }>();

const { t } = useI18n();
const setup = ref<CardSetup | null>(null);
const card = ref<InstanceType<typeof CardElement> | null>(null);
const failure = ref("");
const busy = ref(false);

async function begin() {
	failure.value = "";
	const [error, result] = await catchError(beginMethodSetup());
	if (error) failure.value = describeRequestError(error, t("payments.card.setupError"));
	else setup.value = result;
}
void begin();

async function save() {
	if (!card.value || busy.value) return;
	busy.value = true;
	failure.value = "";
	try {
		const [collectError, collected] = await catchError(card.value.collect());
		if (collectError) {
			failure.value = collectError.message;
			return;
		}
		const [error, saved] = await catchError(addPaymentMethod(collected));
		if (error) {
			failure.value = describeRequestError(error, t("payments.card.saveError"));
			return;
		}
		notify.success(t("payments.card.saved"));
		emit("added", saved);
	} finally {
		busy.value = false;
	}
}
</script>

<template>
	<form class="flex flex-col gap-3" @submit.prevent="save">
		<CardElement ref="card" :setup="setup" />
		<p v-if="failure" class="text-sm text-red-300" role="alert">{{ failure }}</p>
		<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
			<button v-if="cancellable" type="button" class="flex h-11 items-center justify-center rounded border border-flixer-border px-5 text-sm font-semibold text-flixer-text transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" :disabled="busy" @click="emit('cancel')">{{ t("common.cancel") }}</button>
			<button type="submit" class="flex h-11 items-center justify-center rounded bg-flixer-primary px-5 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:opacity-60" :disabled="busy || !setup">{{ busy ? t("payments.card.saving") : t("payments.card.save") }}</button>
		</div>
	</form>
</template>
