<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from "@kolirt/vue-modal";
import { computed, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { createInvitation, updateInvitation, type Invitation, type InviteServer, type MediaLibrary } from "../../api";
import { notify } from "../../composables/notify";
import { describeRequestError } from "../../composables/useProfile";
import { catchError } from "../../utils/catchError";
import TextInput from "../ui/TextInput.vue";
import AdminToggle from "./AdminToggle.vue";

defineOptions({ modalGroup: "default" });

const props = defineProps<{ servers: InviteServer[]; libraries: MediaLibrary[]; invitation?: Invitation }>();

const { close, confirm } = useModalContext<Invitation>();
const { t } = useI18n();

function toDateTimeLocal(iso: string | null | undefined): string {
	if (!iso) return "";
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "";
	const pad = (value: number) => String(value).padStart(2, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const isEditing = computed(() => !!props.invitation);
const canChangeDestination = computed(() => !props.invitation || props.invitation.usedCount === 0);

const initialServerIds = props.invitation?.servers?.length
	? props.invitation.servers.map((s) => s.id)
	: props.invitation?.server?.id
		? [props.invitation.server.id]
		: [];

const busy = ref(false);
const form = reactive({
	label: props.invitation?.label ?? "",
	code: props.invitation?.code ?? "",
	includeFlixer: props.invitation?.includeFlixer ?? true,
	serverIds: [...initialServerIds],
	maxUses: props.invitation?.maxUses != null ? String(props.invitation.maxUses) : "",
	expiresAt: toDateTimeLocal(props.invitation?.expiresAt),
	userExpiresInDays: props.invitation?.userExpiresInDays != null ? String(props.invitation.userExpiresInDays) : "",
	libraryMode: (props.invitation?.libraryMode ?? "all") as "all" | "selected",
	libraryIds: [...(props.invitation?.libraryIds ?? [])],
	externalLibraryIds: (props.invitation?.externalLibraryIds ?? []).join(", "),
	allowDownloads: props.invitation?.allowDownloads ?? true,
	skipPayment: props.invitation?.skipPayment ?? false,
	skipEmailVerification: props.invitation?.skipEmailVerification ?? false,
	disablePlexOnlineSources: props.invitation?.disablePlexOnlineSources ?? true,
});

const selectableServers = computed(() => props.servers.filter((item) => item.enabled || form.serverIds.includes(item.id)));
const selectedServers = computed(() => props.servers.filter((server) => form.serverIds.includes(server.id)));
const hasNonOtherSelected = computed(() => selectedServers.value.some((server) => server.type !== "other"));
const hasPlexSelected = computed(() => selectedServers.value.some((server) => server.type === "plex"));

async function submit() {
	busy.value = true;
	try {
		const externalLibraryIds = form.externalLibraryIds
			.split(",")
			.map((id) => id.trim())
			.filter(Boolean);
		const libraryIds = form.libraryMode === "selected" ? form.libraryIds : [];
		const disablePlexOnlineSources = hasPlexSelected.value ? form.disablePlexOnlineSources : false;

		const [error, saved] = await catchError(
			props.invitation
				? updateInvitation(props.invitation.id, {
						label: form.label.trim(),
						code: form.code.trim(),
						...(canChangeDestination.value ? { serverIds: form.serverIds, serverId: form.serverIds[0] ?? null } : {}),
						includeFlixer: form.includeFlixer,
						maxUses: form.maxUses ? Number(form.maxUses) : null,
						expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
						userExpiresInDays: form.userExpiresInDays ? Number(form.userExpiresInDays) : null,
						libraryMode: form.libraryMode,
						libraryIds,
						externalLibraryIds,
						allowDownloads: form.allowDownloads,
						skipPayment: form.skipPayment,
						skipEmailVerification: form.skipEmailVerification,
						disablePlexOnlineSources,
					})
				: createInvitation({
						label: form.label.trim() || undefined,
						code: form.code.trim() || undefined,
						serverIds: form.serverIds,
						serverId: form.serverIds[0] || undefined,
						includeFlixer: form.includeFlixer,
						maxUses: form.maxUses ? Number(form.maxUses) : undefined,
						expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
						userExpiresInDays: form.userExpiresInDays ? Number(form.userExpiresInDays) : undefined,
						libraryMode: form.libraryMode,
						libraryIds,
						externalLibraryIds,
						allowDownloads: form.allowDownloads,
						skipPayment: form.skipPayment,
						skipEmailVerification: form.skipEmailVerification,
						disablePlexOnlineSources,
					}),
		);
		if (error) {
			console.error(props.invitation ? "[invites] update failed" : "[invites] create failed", error);
			notify.error(describeRequestError(error, t("admin.invites.saveFailed")));
		} else {
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
				<ModalTitle class="shrink-0 text-lg font-semibold">{{ isEditing ? t("admin.invites.editTitle") : t("admin.invites.new") }}</ModalTitle>
				<ModalDescription class="mt-1 shrink-0 text-sm leading-6 text-flixer-muted">{{ isEditing ? t("admin.invites.editDescription") : t("admin.invites.createDescription") }}</ModalDescription>
			</header>

			<form class="flixer-modal-form mt-5" @submit.prevent="submit">
				<div class="flixer-modal-form-body gap-4">
					<TextInput v-model="form.label" :label="t('admin.invites.form.label')" name="label" maxlength="100" :placeholder="t('admin.invites.form.labelPlaceholder')" autocomplete="off" autofocus />

					<div class="flex min-w-0 flex-col gap-2">
						<span class="text-xs font-semibold text-flixer-muted">{{ t("admin.invites.form.destination") }}</span>
						<div class="flex flex-col gap-2 rounded border border-flixer-border bg-flixer-surface/50 p-3">
							<label class="flex items-center gap-2.5 text-sm text-flixer-text">
								<input v-model="form.includeFlixer" type="checkbox" class="accent-flixer-primary" :disabled="!canChangeDestination" />
								<span>{{ t("admin.invites.types.flixer") }}</span>
							</label>
							<label v-for="server in selectableServers" :key="server.id" class="flex items-center gap-2.5 text-sm text-flixer-text">
								<input v-model="form.serverIds" type="checkbox" :value="server.id" class="accent-flixer-primary" :disabled="!canChangeDestination" />
								<span>{{ server.name }} <span class="text-xs text-flixer-muted">({{ t(`admin.invites.types.${server.type}`) }})</span></span>
							</label>
						</div>
						<p v-if="!canChangeDestination" class="text-xs text-flixer-muted">{{ t("admin.invites.form.destinationLockedHint") }}</p>
					</div>

					<TextInput v-model="form.code" :label="isEditing ? t('admin.invites.table.code') : t('admin.invites.form.code')" name="code" :required="isEditing" minlength="4" maxlength="64" pattern="[a-zA-Z0-9\-]+" :placeholder="t('admin.invites.form.codePlaceholder')" autocomplete="off" />
					<div class="grid gap-4 sm:grid-cols-2">
						<TextInput v-model="form.maxUses" :label="t('admin.invites.form.maxUses')" name="maxUses" type="number" min="1" :placeholder="t('admin.invites.form.unlimited')" />
						<TextInput v-model="form.userExpiresInDays" :label="t('admin.invites.form.userExpiresInDays')" name="userExpiresInDays" type="number" min="1" :placeholder="t('admin.invites.form.never')" />
					</div>
					<TextInput v-model="form.expiresAt" :label="t('admin.invites.form.expiresAt')" name="expiresAt" type="datetime-local" />

					<div class="flex min-w-0 flex-col gap-2">
						<label for="invitation-library-mode" class="text-xs font-semibold text-flixer-muted">{{ t("admin.invites.form.libraryMode") }}</label>
						<select id="invitation-library-mode" v-model="form.libraryMode" class="h-12 w-full rounded border border-flixer-border bg-flixer-surface/50 px-4 text-base text-flixer-text outline-none focus:border-flixer-accent/60 sm:text-sm">
							<option value="all">{{ t("admin.invites.form.allLibraries") }}</option>
							<option value="selected">{{ t("admin.invites.form.selectedLibraries") }}</option>
						</select>
						<div v-if="form.libraryMode === 'selected'" class="flex flex-wrap gap-3">
							<label v-for="library in props.libraries" :key="library.id" class="flex items-center gap-1.5 text-xs text-flixer-text">
								<input v-model="form.libraryIds" type="checkbox" :value="library.id" class="accent-flixer-primary" />
								{{ library.name }}
							</label>
						</div>
					</div>

					<TextInput v-if="hasNonOtherSelected" v-model="form.externalLibraryIds" :label="t('admin.invites.form.externalLibraryIds')" name="externalLibraryIds" :hint="t('admin.invites.form.externalLibraryIdsPlaceholder')" autocomplete="off" />

					<AdminToggle v-model="form.allowDownloads" :label="t('admin.invites.form.allowDownloads')" :description="t('admin.invites.form.allowDownloadsDescription')" />
					<AdminToggle v-if="hasPlexSelected" v-model="form.disablePlexOnlineSources" :label="t('admin.invites.form.disablePlexOnlineSources')" :description="t('admin.invites.form.disablePlexOnlineSourcesDescription')" />
					<AdminToggle v-model="form.skipPayment" :label="t('admin.invites.form.skipPayment')" :description="t('admin.invites.form.skipPaymentDescription')" />
					<AdminToggle v-model="form.skipEmailVerification" :label="t('admin.invites.form.skipEmailVerification')" :description="t('admin.invites.form.skipEmailVerificationDescription')" />
				</div>

				<div class="flixer-modal-actions flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
					<button type="button" class="flex h-11 items-center justify-center rounded border border-flixer-border px-6 text-sm font-semibold text-flixer-text transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" :disabled="busy" @click="close()">{{ t("common.cancel") }}</button>
					<button type="submit" class="flex h-11 items-center justify-center rounded bg-flixer-primary px-6 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:opacity-60" :disabled="busy">{{ isEditing ? t("common.save") : t("admin.invites.form.create") }}</button>
				</div>
			</form>
		</ModalContent>
	</ModalRoot>
</template>
