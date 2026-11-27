<script setup lang="ts">
import { openModal } from "@kolirt/vue-modal";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import AdminSection from "./AdminSection.vue";
import AdminSkeleton from "./AdminSkeleton.vue";
import CreateInvitationModal from "./CreateInvitationModal.vue";
import InviteServerModal from "./InviteServerModal.vue";
import { deleteInvitation, deleteInviteServer, listInvitations, listInvitationUsages, listInviteServers, listMediaLibraries, testInviteServer, updateInvitation, type Invitation, type InvitationUsage, type InviteServer, type MediaLibrary } from "../../api";
import { confirmAction } from "../../composables/confirm";
import { notify } from "../../composables/notify";
import { describeRequestError } from "../../composables/useProfile";
import { catchError } from "../../utils/catchError";
import { copyToClipboard } from "../../utils/clipboard";

const props = defineProps<{ standalone?: boolean }>();

const { t, locale } = useI18n();

const formatDate = (iso: string) => new Date(iso).toLocaleDateString(locale.value, { dateStyle: "medium" });

const isLoading = ref(true);
const invitations = ref<Invitation[]>([]);
const servers = ref<InviteServer[]>([]);
const libraries = ref<MediaLibrary[]>([]);
const busyId = ref<string | null>(null);

async function load() {
	const [error, loaded] = await catchError(Promise.all([listInvitations(), listInviteServers(), listMediaLibraries()]));
	if (error) {
		console.error("[invites] failed to load", error);
		notify.error(describeRequestError(error, t("admin.invites.loadFailed")));
	} else {
		invitations.value = loaded[0];
		servers.value = loaded[1];
		libraries.value = loaded[2];
	}
	isLoading.value = false;
}

onMounted(load);

// ---- Invitations ---------------------------------------------------------------------------------------------

async function openCreateInvitation() {
	const created = await openModal<Invitation>(CreateInvitationModal, { props: { servers: servers.value, libraries: libraries.value } }).catch(() => null);
	if (!created) return;
	invitations.value = [created, ...invitations.value];
	notify.success(t("admin.invites.created"));
	void copyLink(created);
}

async function openEditInvitation(invitation: Invitation) {
	const updated = await openModal<Invitation>(CreateInvitationModal, { props: { servers: servers.value, libraries: libraries.value, invitation } }).catch(() => null);
	if (!updated) return;
	invitations.value = invitations.value.map((item) => (item.id === updated.id ? updated : item));
	notify.success(t("admin.invites.saved"));
}

const copiedLinkId = ref<string | null>(null);
const copiedCodeId = ref<string | null>(null);

function inviteLink(invitation: Invitation): string {
	return `${window.location.origin}/invite/${invitation.code}`;
}

async function copyLink(invitation: Invitation) {
	const ok = await copyToClipboard(inviteLink(invitation));
	if (ok) {
		copiedLinkId.value = invitation.id;
		setTimeout(() => {
			if (copiedLinkId.value === invitation.id) copiedLinkId.value = null;
		}, 2000);
		notify.success(t("admin.invites.copied"));
	} else {
		notify.error(t("admin.invites.copyFailed"));
	}
}

async function copyCode(invitation: Invitation) {
	const ok = await copyToClipboard(invitation.code);
	if (ok) {
		copiedCodeId.value = invitation.id;
		setTimeout(() => {
			if (copiedCodeId.value === invitation.id) copiedCodeId.value = null;
		}, 2000);
		notify.success(t("admin.invites.codeCopied"));
	} else {
		notify.error(t("admin.invites.copyFailed"));
	}
}

function inviteState(invitation: Invitation): "disabled" | "expired" | "exhausted" | "active" {
	if (invitation.disabled) return "disabled";
	if (invitation.expiresAt && new Date(invitation.expiresAt).getTime() <= Date.now()) return "expired";
	if (invitation.maxUses !== null && invitation.usedCount >= invitation.maxUses) return "exhausted";
	return "active";
}

function destinationLabel(invitation: Invitation): string {
	const parts: string[] = [];
	if (invitation.includeFlixer ?? true) {
		parts.push(t("admin.invites.types.flixer"));
	}
	const servers = invitation.servers?.length ? invitation.servers : invitation.server ? [invitation.server] : [];
	for (const server of servers) {
		parts.push(`${server.name} (${t(`admin.invites.types.${server.type}`)})`);
	}
	return parts.length ? parts.join(" + ") : t("admin.invites.types.flixer");
}

async function toggleInvite(invitation: Invitation) {
	busyId.value = invitation.id;
	const [error, updated] = await catchError(updateInvitation(invitation.id, { disabled: !invitation.disabled }));
	busyId.value = null;
	if (error) {
		notify.error(describeRequestError(error, t("admin.invites.saveFailed")));
		return;
	}
	invitations.value = invitations.value.map((item) => (item.id === updated.id ? updated : item));
}

async function removeInvite(invitation: Invitation) {
	const confirmed = await confirmAction(t("admin.invites.deleteConfirm", { code: invitation.code }), { danger: true });
	if (!confirmed) return;
	busyId.value = invitation.id;
	const [error] = await catchError(deleteInvitation(invitation.id));
	busyId.value = null;
	if (error) {
		notify.error(describeRequestError(error, t("admin.invites.deleteFailed")));
		return;
	}
	invitations.value = invitations.value.filter((item) => item.id !== invitation.id);
	if (expandedInviteId.value === invitation.id) expandedInviteId.value = null;
}

const expandedInviteId = ref<string | null>(null);
const usages = ref<InvitationUsage[]>([]);
const usagesLoading = ref(false);

async function toggleUsages(invitation: Invitation) {
	if (expandedInviteId.value === invitation.id) {
		expandedInviteId.value = null;
		return;
	}
	expandedInviteId.value = invitation.id;
	usages.value = [];
	usagesLoading.value = true;
	const [error, loaded] = await catchError(listInvitationUsages(invitation.id));
	usagesLoading.value = false;
	if (error) {
		notify.error(describeRequestError(error, t("admin.invites.loadFailed")));
		return;
	}
	usages.value = loaded;
}

// ---- Media servers -------------------------------------------------------------------------------------------

async function openServerModal(server?: InviteServer) {
	const saved = await openModal<InviteServer>(InviteServerModal, { props: { server } }).catch(() => null);
	if (!saved) return;
	servers.value = server ? servers.value.map((item) => (item.id === saved.id ? saved : item)) : [...servers.value, saved];
}

async function testServer(server: InviteServer) {
	busyId.value = server.id;
	const [error] = await catchError(testInviteServer(server.id));
	busyId.value = null;
	if (error) notify.error(describeRequestError(error, t("admin.invites.testFailed")));
	else notify.success(t("admin.invites.testPassed"));
}

async function removeServer(server: InviteServer) {
	const confirmed = await confirmAction(t("admin.invites.serverDeleteConfirm", { name: server.name }), { danger: true });
	if (!confirmed) return;
	busyId.value = server.id;
	const [error] = await catchError(deleteInviteServer(server.id));
	busyId.value = null;
	if (error) {
		notify.error(describeRequestError(error, t("admin.invites.deleteFailed")));
		return;
	}
	servers.value = servers.value.filter((item) => item.id !== server.id);
	invitations.value = invitations.value.filter((item) => item.server?.id !== server.id);
}
</script>

<template>
	<div class="flex flex-col gap-6">
		<div v-if="!props.standalone" class="admin-card flex flex-wrap items-center justify-between gap-4 border-flixer-accent/30 bg-flixer-primary/10 p-4">
		<div class="flex min-w-0 items-start gap-3">
			<div class="flex size-9 shrink-0 items-center justify-center rounded bg-flixer-primary/20 text-flixer-accent">
				<Icon icon="lucide:sparkles" class="size-4" aria-hidden="true" />
			</div>
			<div class="min-w-0">
				<p class="text-sm font-semibold text-flixer-text">{{ t("admin.invites.standaloneBanner.title") }}</p>
				<p class="mt-0.5 text-sm text-flixer-muted">{{ t("admin.invites.standaloneBanner.description") }}</p>
			</div>
		</div>
		<a
			href="https://github.com/flixermedia/flixer-invites"
			target="_blank"
			rel="noopener noreferrer"
			class="inline-flex shrink-0 items-center gap-1.5 rounded border border-flixer-accent/40 bg-flixer-primary/20 px-3 py-1.5 text-sm font-semibold text-flixer-text transition hover:bg-flixer-primary/30"
		>
			<Icon icon="lucide:github" class="size-4" aria-hidden="true" />
			<span>{{ t("admin.invites.standaloneBanner.cta") }}</span>
			<Icon icon="lucide:external-link" class="size-3.5 text-flixer-muted" aria-hidden="true" />
		</a>
	</div>

	<AdminSection :title="t('admin.invites.title')" :description="t('admin.invites.description')">
		<template #actions>
			<button type="button" class="rounded bg-flixer-primary px-3 py-2 text-sm font-semibold text-white hover:brightness-110" @click="openCreateInvitation">
				{{ t("admin.invites.new") }}
			</button>
		</template>

		<AdminSkeleton v-if="isLoading" variant="toggles" :rows="4" />
		<template v-else>
			<p v-if="!invitations.length" class="text-sm text-flixer-muted">{{ t("admin.invites.empty") }}</p>
			<div v-else class="overflow-x-auto">
				<table class="w-full text-left text-sm">
					<thead>
						<tr class="border-b border-flixer-border text-xs text-flixer-muted">
							<th class="py-2 pr-3 font-medium">{{ t("admin.invites.table.code") }}</th>
							<th class="py-2 pr-3 font-medium">{{ t("admin.invites.table.destination") }}</th>
							<th class="py-2 pr-3 font-medium">{{ t("admin.invites.table.uses") }}</th>
							<th class="py-2 pr-3 font-medium">{{ t("admin.invites.table.expires") }}</th>
							<th class="py-2 pr-3 font-medium">{{ t("admin.invites.table.status") }}</th>
							<th class="py-2 font-medium">{{ t("admin.invites.table.actions") }}</th>
						</tr>
					</thead>
					<tbody>
						<template v-for="invitation in invitations" :key="invitation.id">
							<tr class="border-b border-flixer-border/60 align-top">
								<td class="py-2 pr-3">
									<div class="flex flex-col gap-1">
										<div class="flex items-center gap-1.5">
											<code class="font-mono text-xs font-semibold text-flixer-text">{{ invitation.code }}</code>
											<button
												type="button"
												class="inline-flex items-center gap-1 rounded px-1 py-0.5 text-xs text-flixer-muted hover:bg-flixer-surface hover:text-flixer-text"
												:title="t('admin.invites.copyCode')"
												@click="copyCode(invitation)"
											>
												<Icon :icon="copiedCodeId === invitation.id ? 'lucide:check' : 'lucide:copy'" class="size-3" :class="{ 'text-emerald-400': copiedCodeId === invitation.id }" aria-hidden="true" />
												<span class="sr-only">{{ t("admin.invites.copyCode") }}</span>
											</button>
										</div>
										<div class="flex items-center gap-1.5 text-xs text-flixer-muted">
											<a :href="inviteLink(invitation)" target="_blank" rel="noopener noreferrer" class="max-w-[220px] truncate text-flixer-text/80 hover:text-flixer-accent hover:underline">
												{{ inviteLink(invitation) }}
											</a>
											<button
												type="button"
												class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium text-flixer-primary hover:bg-flixer-primary/10"
												:title="t('admin.invites.copyLink')"
												@click="copyLink(invitation)"
											>
												<Icon :icon="copiedLinkId === invitation.id ? 'lucide:check' : 'lucide:link'" class="size-3" :class="{ 'text-emerald-400': copiedLinkId === invitation.id }" aria-hidden="true" />
												<span>{{ copiedLinkId === invitation.id ? t("admin.invites.copied") : t("admin.invites.copyLink") }}</span>
											</button>
										</div>
									</div>
									<p v-if="invitation.label" class="mt-1 text-xs text-flixer-muted">{{ invitation.label }}</p>
									<p v-if="invitation.skipPayment" class="text-[10px] font-semibold uppercase tracking-wide text-emerald-400">{{ t("admin.invites.freeBadge") }}</p>
									<p v-if="invitation.skipEmailVerification" class="text-[10px] font-semibold uppercase tracking-wide text-sky-400">{{ t("admin.invites.skipVerificationBadge") }}</p>
								</td>
								<td class="py-2 pr-3 text-flixer-text">{{ destinationLabel(invitation) }}</td>
								<td class="py-2 pr-3 text-flixer-text">{{ invitation.usedCount }} / {{ invitation.maxUses ?? "∞" }}</td>
								<td class="py-2 pr-3 text-flixer-text">{{ invitation.expiresAt ? formatDate(invitation.expiresAt) : t("admin.invites.form.never") }}</td>
								<td class="py-2 pr-3">
									<span class="text-xs font-semibold" :class="{ 'text-emerald-400': inviteState(invitation) === 'active', 'text-flixer-muted': inviteState(invitation) === 'disabled', 'text-amber-400': inviteState(invitation) !== 'active' && inviteState(invitation) !== 'disabled' }">
										{{ t(`admin.invites.state.${inviteState(invitation)}`) }}
									</span>
								</td>
								<td class="py-2">
									<div class="flex flex-wrap gap-1.5" :class="{ 'pointer-events-none opacity-60': busyId === invitation.id }">
										<button type="button" class="inline-flex items-center gap-1 rounded border border-flixer-border px-2 py-1 text-xs text-flixer-text hover:bg-flixer-border/40" @click="copyLink(invitation)">
											<Icon :icon="copiedLinkId === invitation.id ? 'lucide:check' : 'lucide:link'" class="size-3" :class="{ 'text-emerald-400': copiedLinkId === invitation.id }" aria-hidden="true" />
											{{ copiedLinkId === invitation.id ? t("admin.invites.copied") : t("admin.invites.copyLink") }}
										</button>
										<button type="button" class="rounded border border-flixer-border px-2 py-1 text-xs text-flixer-text hover:bg-flixer-border/40" @click="openEditInvitation(invitation)">{{ t("admin.invites.edit") }}</button>
										<button type="button" class="rounded border border-flixer-border px-2 py-1 text-xs text-flixer-text hover:bg-flixer-border/40" @click="toggleUsages(invitation)">{{ t("admin.invites.usages") }}</button>
										<button type="button" class="rounded border border-flixer-border px-2 py-1 text-xs text-flixer-text hover:bg-flixer-border/40" @click="toggleInvite(invitation)">{{ invitation.disabled ? t("admin.invites.enable") : t("admin.invites.disable") }}</button>
										<button type="button" class="rounded border border-rose-500/40 px-2 py-1 text-xs text-rose-400 hover:bg-rose-500/10" @click="removeInvite(invitation)">{{ t("common.delete") }}</button>
									</div>
								</td>
							</tr>
							<tr v-if="expandedInviteId === invitation.id" class="border-b border-flixer-border/60">
								<td colspan="6" class="bg-flixer-surface/40 px-3 py-2">
									<p v-if="usagesLoading" class="text-xs text-flixer-muted">{{ t("common.loading") }}</p>
									<p v-else-if="!usages.length" class="text-xs text-flixer-muted">{{ t("admin.invites.noUsages") }}</p>
									<ul v-else class="flex flex-col gap-1">
										<li v-for="usage in usages" :key="usage.id" class="text-xs text-flixer-text">
											<span class="font-semibold">{{ usage.username }}</span>
											· {{ t(`admin.invites.usageStatus.${usage.status}`) }} · {{ formatDate(usage.createdAt) }}
											<span v-if="usage.externalEmail"> · {{ t("admin.invites.plexInviteSent", { email: usage.externalEmail }) }}</span>
											<span v-if="usage.expiresAt"> · {{ t("admin.invites.accessUntil", { date: formatDate(usage.expiresAt) }) }}</span>
											<span v-if="usage.error" class="text-rose-400"> · {{ usage.error }}</span>
										</li>
									</ul>
								</td>
							</tr>
						</template>
					</tbody>
				</table>
			</div>
		</template>
	</AdminSection>

	<AdminSection :title="t('admin.invites.servers.title')" :description="t('admin.invites.servers.description')">
		<template #actions>
			<button type="button" class="rounded border border-flixer-border px-3 py-2 text-sm text-flixer-text hover:bg-flixer-border/40" @click="openServerModal()">
				{{ t("admin.invites.servers.add") }}
			</button>
		</template>

		<AdminSkeleton v-if="isLoading" variant="toggles" :rows="2" />
		<template v-else>
			<p v-if="!servers.length" class="text-sm text-flixer-muted">{{ t("admin.invites.servers.empty") }}</p>
			<ul v-else class="flex flex-col gap-2">
				<li v-for="server in servers" :key="server.id" class="flex flex-wrap items-center justify-between gap-2 rounded border border-flixer-border p-3">
					<div class="min-w-0">
						<p class="text-sm font-semibold text-flixer-text">
							{{ server.name }}
							<span class="ml-1 text-xs font-normal text-flixer-muted">{{ t(`admin.invites.types.${server.type}`) }}</span>
							<span v-if="!server.enabled" class="ml-1 text-xs font-semibold text-amber-400">{{ t("admin.invites.state.disabled") }}</span>
						</p>
						<p class="truncate text-xs text-flixer-muted">{{ server.url }}</p>
						<p v-if="server.externalUrl" class="truncate text-xs text-flixer-muted">{{ t("admin.invites.servers.externalUrlLabel", { url: server.externalUrl }) }}</p>
					</div>
					<div class="flex gap-1.5" :class="{ 'pointer-events-none opacity-60': busyId === server.id }">
						<button v-if="server.type !== 'other'" type="button" class="rounded border border-flixer-border px-2 py-1 text-xs text-flixer-text hover:bg-flixer-border/40" @click="testServer(server)">{{ t("admin.invites.servers.test") }}</button>
						<button type="button" class="rounded border border-flixer-border px-2 py-1 text-xs text-flixer-text hover:bg-flixer-border/40" @click="openServerModal(server)">{{ t("admin.invites.servers.edit") }}</button>
						<button type="button" class="rounded border border-rose-500/40 px-2 py-1 text-xs text-rose-400 hover:bg-rose-500/10" @click="removeServer(server)">{{ t("common.delete") }}</button>
					</div>
				</li>
			</ul>
		</template>
	</AdminSection>
	</div>
</template>
