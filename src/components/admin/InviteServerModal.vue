<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from "@kolirt/vue-modal";
import { reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { createInviteServer, updateInviteServer, type InviteServer, type InviteServerType } from "../../api";
import { notify } from "../../composables/notify";
import { describeRequestError } from "../../composables/useProfile";
import { catchError } from "../../utils/catchError";
import TextInput from "../ui/TextInput.vue";
import AdminToggle from "./AdminToggle.vue";

defineOptions({ modalGroup: "default" });

const SERVER_TYPES: InviteServerType[] = ["flixer", "jellyfin", "emby", "plex", "other"];

const props = defineProps<{ server?: InviteServer }>();

const { close, confirm } = useModalContext<InviteServer>();
const { t } = useI18n();

const busy = ref(false);
const form = reactive({
	name: props.server?.name ?? "",
	type: props.server?.type ?? ("jellyfin" as InviteServerType),
	url: props.server?.url ?? "",
	externalUrl: props.server?.externalUrl ?? "",
	apiKey: "",
	instructions: props.server?.instructions ?? "",
	enabled: props.server?.enabled ?? true,
});

async function submit() {
	busy.value = true;
	try {
		const input = {
			name: form.name.trim(),
			url: form.url.trim(),
			externalUrl: form.externalUrl.trim() || null,
			apiKey: form.apiKey || (props.server ? undefined : ""),
			instructions: form.instructions,
			enabled: form.enabled,
		};
		const [error, saved] = await catchError(props.server ? updateInviteServer(props.server.id, input) : createInviteServer({ ...input, type: form.type }));
		if (error) {
			console.error("[invites] server save failed", error);
			notify.error(describeRequestError(error, t("admin.invites.saveFailed")));
		} else {
			notify.success(t("admin.invites.serverSaved"));
			confirm(saved);
		}
	} finally {
		busy.value = false;
	}
}
</script>

<template>
	<ModalRoot class="flex items-center justify-center p-4">
		<ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col rounded border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
			<header class="flixer-modal-header">
				<ModalTitle class="shrink-0 text-lg font-semibold">{{ props.server ? t("admin.invites.servers.edit") : t("admin.invites.servers.add") }}</ModalTitle>
				<ModalDescription class="mt-1 shrink-0 text-sm leading-6 text-flixer-muted">{{ t("admin.invites.servers.description") }}</ModalDescription>
			</header>

			<form class="flixer-modal-form mt-5" @submit.prevent="submit">
				<div class="flixer-modal-form-body gap-4">
					<TextInput v-model="form.name" :label="t('admin.invites.servers.name')" name="name" required maxlength="100" autocomplete="off" autofocus />

					<div class="flex min-w-0 flex-col gap-2">
						<label for="invite-server-type" class="text-xs font-semibold text-flixer-muted">{{ t("admin.invites.servers.type") }}</label>
						<select id="invite-server-type" v-model="form.type" :disabled="!!props.server" class="h-12 w-full rounded border border-flixer-border bg-flixer-surface/50 px-4 text-base text-flixer-text outline-none focus:border-flixer-accent/60 disabled:opacity-60 sm:text-sm">
							<option v-for="type in SERVER_TYPES" :key="type" :value="type">{{ t(`admin.invites.types.${type}`) }}</option>
						</select>
					</div>

					<TextInput v-model="form.url" :label="t('admin.invites.servers.url')" name="url" type="url" required maxlength="500" placeholder="https://" autocomplete="off" />
					<TextInput v-model="form.externalUrl" :label="t('admin.invites.servers.externalUrl')" name="externalUrl" type="url" maxlength="500" placeholder="https://" :hint="t('admin.invites.servers.externalUrlHint')" autocomplete="off" />
					<TextInput v-if="form.type !== 'other'" v-model="form.apiKey" :label="form.type === 'plex' ? t('admin.invites.servers.token') : t('admin.invites.servers.apiKey')" name="apiKey" type="password" maxlength="500" autocomplete="off" :placeholder="props.server ? t('admin.invites.servers.apiKeyKeep') : ''" />

					<div class="flex min-w-0 flex-col gap-2">
						<label for="invite-server-instructions" class="text-xs font-semibold text-flixer-muted">{{ t("admin.invites.servers.instructions") }}</label>
						<textarea id="invite-server-instructions" v-model="form.instructions" rows="3" maxlength="2000" :placeholder="t('admin.invites.servers.instructionsPlaceholder')" class="w-full resize-y rounded border border-flixer-border bg-flixer-surface/50 px-4 py-3 text-base text-flixer-text outline-none placeholder:text-flixer-muted/70 focus:border-flixer-accent/60 sm:text-sm"></textarea>
					</div>

					<AdminToggle v-model="form.enabled" :label="t('admin.invites.servers.enabled')" />
				</div>

				<div class="flixer-modal-actions flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
					<button type="button" class="flex h-11 items-center justify-center rounded border border-flixer-border px-6 text-sm font-semibold text-flixer-text transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" :disabled="busy" @click="close()">{{ t("common.cancel") }}</button>
					<button type="submit" class="flex h-11 items-center justify-center rounded bg-flixer-primary px-6 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:opacity-60" :disabled="busy">{{ t("common.save") }}</button>
				</div>
			</form>
		</ModalContent>
	</ModalRoot>
</template>
