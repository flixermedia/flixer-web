<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from "@kolirt/vue-modal";
import { Button } from "@ui-sdk/vue/button";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import TextInput from "./TextInput.vue";

defineOptions({ modalGroup: "default" });

withDefaults(
	defineProps<{
		title: string;
		description: string;
		passwordLabel: string;
		submitLabel: string;
		danger?: boolean;
	}>(),
	{ danger: false },
);

const { close, confirm } = useModalContext<string>();
const { t } = useI18n();
const password = ref("");

function submit() {
	if (!password.value) return;
	confirm(password.value);
	password.value = "";
}
</script>

<template>
	<ModalRoot class="flex items-center justify-center p-4">
		<ModalContent class="flixer-modal-card w-full max-w-md rounded border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
			<header class="flixer-modal-header">
				<ModalTitle class="text-lg font-semibold">{{ title }}</ModalTitle>
				<ModalDescription class="mt-1 text-sm leading-6 text-flixer-muted">{{ description }}</ModalDescription>
			</header>

			<form class="mt-5" @submit.prevent="submit">
				<TextInput v-model="password" :label="passwordLabel" type="password" name="passwordPrompt" autocomplete="current-password" maxlength="128" required autofocus />
				<div class="flixer-modal-actions mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
					<Button type="button" class="h-11 rounded border border-flixer-border bg-transparent px-6 text-sm font-semibold text-flixer-text transition hover:bg-white/5" @click="close()">{{ t("common.cancel") }}</Button>
					<Button type="submit" :data-agent-confirm="description" class="h-11 rounded border-0 px-6 text-sm font-semibold text-white transition" :class="danger ? 'bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-500/20 focus-visible:outline-rose-300' : 'bg-transparent hover:bg-transparent bg-gradient-to-r from-flixer-primary to-flixer-secondary shadow-lg shadow-flixer-primary/20 hover:brightness-110 focus-visible:outline-flixer-accent'">{{ submitLabel }}</Button>
				</div>
			</form>
		</ModalContent>
	</ModalRoot>
</template>
