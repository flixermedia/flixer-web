<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import type { CardResult, CardSetup } from "../../api";
import { mountCardField, type CardField } from "../../composables/paymentSdk";

const props = defineProps<{ setup: CardSetup | null; name?: string; email?: string }>();
const emit = defineEmits<{ ready: []; change: [complete: boolean]; failed: [message: string] }>();

const { t } = useI18n();
const target = ref<HTMLElement | null>(null);
const loading = ref(true);
const failure = ref("");
let field: CardField | null = null;
let generation = 0;

function describe(error: unknown): string {
	const message = error instanceof Error ? error.message : "";
	if (message === "payment-sdk-load") return t("payments.card.sdkError");
	if (message === "payment-setup") return t("payments.card.setupError");
	if (message === "payment-card") return t("payments.card.cardError");
	if (message === "payment-verification") return t("payments.card.verificationError");
	return message || t("payments.card.cardError");
}

async function mount() {
	const current = ++generation;
	field?.destroy();
	field = null;
	failure.value = "";
	if (!props.setup || !target.value) {
		loading.value = true;
		return;
	}
	loading.value = true;
	try {
		const mounted = await mountCardField(target.value, props.setup, { name: props.name, email: props.email }, (complete) => emit("change", complete));
		if (current !== generation) {
			mounted.destroy();
			return;
		}
		field = mounted;
		emit("ready");
	} catch (error) {
		if (current !== generation) return;
		failure.value = describe(error);
		emit("failed", failure.value);
	} finally {
		if (current === generation) loading.value = false;
	}
}

watch(
	() => [props.setup, target.value] as const,
	() => void mount(),
	{ flush: "post", immediate: true },
);

onBeforeUnmount(() => {
	generation++;
	field?.destroy();
	field = null;
});

/** Collects the card the customer typed. Rejects with a readable message when the card is incomplete or declined. */
async function collect(): Promise<CardResult> {
	if (!field) throw new Error(failure.value || t("payments.card.notReady"));
	try {
		return await field.collect();
	} catch (error) {
		throw new Error(describe(error));
	}
}

defineExpose({ collect });
</script>

<template>
	<div>
		<div v-if="loading" class="mb-2 flex h-12 items-center justify-center rounded border border-flixer-border bg-flixer-surface/50 text-sm text-flixer-muted" role="status">
			<Icon icon="lucide:loader-circle" class="mr-2 size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
			{{ t("payments.card.loading") }}
		</div>
		<p v-if="failure" class="rounded border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200" role="alert">{{ failure }}</p>
		<div ref="target" data-payment-element :data-square-card="setup?.provider === 'square' ? '' : undefined"></div>
	</div>
</template>

<style scoped>
/* Chromium paints Square's otherwise transparent iframe white when it inherits a dark color scheme. */
[data-square-card] :deep(iframe) {
	color-scheme: light;
}
</style>
