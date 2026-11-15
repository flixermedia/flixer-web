<script setup lang="ts">
import { openModal } from "@kolirt/vue-modal";
import { computed, onMounted, ref, watch } from "vue";
import AdminSection from "./AdminSection.vue";
import PasswordPromptModal from "../ui/PasswordPromptModal.vue";
import type { MediaLibrary } from "../../api";
import { notify } from "../../composables/notify";
import { createMediaOrganizationPlan, executeMediaOrganizationPlan, getMediaOrganization, getMediaOrganizationPlan, reconcileMediaOrganizationPlan, recoverUnmovedMediaOrganizationPlan, rollbackMediaOrganizationPlan, saveMediaOrganizationTemplates, saveMediaWritePermissions, type MediaOrganizationPlan, type OrganizationPlanReconciliation, type MediaOrganizationSettings, type MediaOrganizationTemplates } from "../../api/mediaOrganization";

const props = defineProps<{ libraries: MediaLibrary[] }>();
const libraryId = ref(props.libraries[0]?.id ?? "");
const settings = ref<MediaOrganizationSettings | null>(null);
const templates = ref<MediaOrganizationTemplates>({ movie: "", series: "", episode: "", music: "" });
const organizationWritesEnabled = ref(false);
const nfoWritesEnabled = ref(false);
const plan = ref<MediaOrganizationPlan | null>(null);
const reconciliation = ref<OrganizationPlanReconciliation | null>(null);
const reconcileProgress = ref(0);
const reconciling = ref(false);
const selectedPlanId = ref("");
const loading = ref(true);
const busy = ref(false);
const passwordPromptOpen = ref(false);
const error = ref("");
const visibleMoves = computed(() => plan.value?.moves.slice(0, 200) ?? []);
const inputClass = "min-w-0 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 font-mono text-sm text-flixer-text";

function displayError(cause: unknown) {
	if (typeof cause === "object" && cause !== null && "response" in cause) {
		const response = (cause as { response?: { status?: number; data?: unknown } }).response;
		const body = response?.data;
		if (typeof body === "string" && body.trim()) return body;
		if (typeof body === "object" && body !== null) {
			const details = body as { error?: unknown; message?: unknown };
			if (typeof details.error === "string") return details.error;
			if (typeof details.message === "string") return details.message;
		}
		if (response?.status === 409) return "This plan is already running or has changed. Its latest status has been reloaded.";
	}
	return cause instanceof Error ? cause.message : "The media organization request failed.";
}

function isConflict(cause: unknown): boolean {
	return typeof cause === "object" && cause !== null && "response" in cause && (cause as { response?: { status?: number } }).response?.status === 409;
}

async function reloadConflictedPlan() {
	const planId = plan.value?.id;
	await load();
	if (planId) await loadPlan(planId);
}

async function requestAdminPassword(title: string, description: string, submitLabel: string, danger = false) {
	if (busy.value || passwordPromptOpen.value) return "";
	passwordPromptOpen.value = true;
	try {
		return await openModal<string>(PasswordPromptModal, { props: { title, description, passwordLabel: "Administrator password", submitLabel, danger } }).catch(() => "");
	} finally {
		passwordPromptOpen.value = false;
	}
}

async function load() {
	if (!libraryId.value) return;
	loading.value = true;
	error.value = "";
	try {
		settings.value = await getMediaOrganization(libraryId.value);
		templates.value = { ...settings.value.templates };
		organizationWritesEnabled.value = settings.value.organizationWritesEnabled;
		nfoWritesEnabled.value = settings.value.nfoWritesEnabled;
		const latest = settings.value.plans[0];
		if (latest) await loadPlan(latest.id);
		else {
			plan.value = null;
			selectedPlanId.value = "";
		}
	} catch (cause) {
		error.value = displayError(cause);
	} finally {
		loading.value = false;
	}
}

async function loadPlan(id: string) {
	selectedPlanId.value = id;
	reconciliation.value = null;
	reconcileProgress.value = 0;
	try {
		plan.value = await getMediaOrganizationPlan(libraryId.value, id);
	} catch (cause) {
		error.value = displayError(cause);
	}
}

async function reconcilePlan() {
	if (!plan.value || reconciling.value) return;
	reconciling.value = true;
	error.value = "";
	reconciliation.value = null;
	reconcileProgress.value = 0;
	const totalCounts = { notMoved: 0, moved: 0, bothExist: 0, neitherExists: 0, changed: 0, unavailable: 0 };
	const items: OrganizationPlanReconciliation["items"] = [];
	let offset = 0;
	try {
		let total = 0;
		do {
			const page = await reconcileMediaOrganizationPlan(libraryId.value, plan.value.id, offset, 100);
			total = page.total;
			for (const status of Object.keys(totalCounts) as Array<keyof typeof totalCounts>) totalCounts[status] += page.counts[status];
			items.push(...page.items);
			offset = page.nextOffset ?? total;
			reconcileProgress.value = offset;
		} while (offset < total);
		reconciliation.value = { planId: plan.value.id, state: plan.value.state, total, offset: 0, limit: total || 1, nextOffset: null, scanned: items.length, counts: totalCounts, items };
	} catch (cause) {
		error.value = displayError(cause);
	} finally {
		reconciling.value = false;
	}
}

async function recoverPlan() {
	if (!plan.value || plan.value.state !== "executing" || busy.value || passwordPromptOpen.value) return;
	const password = await requestAdminPassword(
		"Recover interrupted plan",
		"Flixer will recheck every source and destination. The plan will be marked failed only if all files are still unmoved.",
		"Verify and recover",
		true,
	);
	if (!password) return;
	busy.value = true;
	error.value = "";
	try {
		const planId = plan.value.id;
		plan.value = await recoverUnmovedMediaOrganizationPlan(libraryId.value, planId, password);
		await load();
		await loadPlan(planId);
	} catch (cause) {
		error.value = displayError(cause);
		if (isConflict(cause)) await reloadConflictedPlan();
	} finally {
		busy.value = false;
	}
}

async function saveTemplates() {
	busy.value = true;
	error.value = "";
	try {
		templates.value = await saveMediaOrganizationTemplates(libraryId.value, templates.value);
	} catch (cause) {
		error.value = displayError(cause);
	} finally {
		busy.value = false;
	}
}

async function saveWritePermissions() {
	busy.value = true;
	error.value = "";
	try {
		const saved = await saveMediaWritePermissions(libraryId.value, {
			organizationWritesEnabled: organizationWritesEnabled.value,
			nfoWritesEnabled: nfoWritesEnabled.value,
		});
		if (settings.value) settings.value = { ...settings.value, ...saved };
	} catch (cause) {
		error.value = displayError(cause);
	} finally {
		busy.value = false;
	}
}

async function createPlan() {
	busy.value = true;
	error.value = "";
	try {
		const created = await createMediaOrganizationPlan(libraryId.value);
		await load();
		await loadPlan(created.id);
	} catch (cause) {
		notify.error(displayError(cause));
	} finally {
		busy.value = false;
	}
}

async function executePlan() {
	if (!plan.value || !settings.value?.organizationWritesEnabled || busy.value || passwordPromptOpen.value) return;
	const password = await requestAdminPassword("Confirm organization plan", "Enter your administrator password to move these files.", "Execute plan", true);
	if (!password) return;
	busy.value = true;
	error.value = "";
	try {
		plan.value = await executeMediaOrganizationPlan(libraryId.value, plan.value.id, password);
		await load();
		await loadPlan(plan.value.id);
	} catch (cause) {
		const message = displayError(cause);
		if (isConflict(cause)) await reloadConflictedPlan();
		error.value = message;
	} finally {
		busy.value = false;
	}
}

async function rollbackPlan() {
	if (!plan.value || !settings.value?.organizationWritesEnabled || busy.value || passwordPromptOpen.value) return;
	const password = await requestAdminPassword("Confirm rollback", "Enter your administrator password to move files back to their previous paths.", "Roll back");
	if (!password) return;
	busy.value = true;
	error.value = "";
	try {
		plan.value = await rollbackMediaOrganizationPlan(libraryId.value, plan.value.id, password);
		await load();
		await loadPlan(plan.value.id);
	} catch (cause) {
		const message = displayError(cause);
		if (isConflict(cause)) await reloadConflictedPlan();
		error.value = message;
	} finally {
		busy.value = false;
	}
}

function formatBytes(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

watch(
	() => props.libraries.map((library) => library.id),
	(ids) => {
		if (!ids.includes(libraryId.value)) libraryId.value = ids[0] ?? "";
	},
);
watch(libraryId, () => {
	plan.value = null;
	selectedPlanId.value = "";
	void load();
});
onMounted(() => void load());
</script>

<template>
	<AdminSection title="Media organization" description="Preview file moves for a library. Existing media mounts remain read-only unless the deployment is explicitly changed.">
		<template #actions>
			<label class="flex items-center gap-2 text-xs text-flixer-muted">
				Library
				<select v-model="libraryId" :disabled="loading || busy" class="rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm text-flixer-text">
					<option v-for="library in libraries" :key="library.id" :value="library.id">{{ library.name }}</option>
				</select>
			</label>
		</template>
		<p v-if="error" role="alert" class="mb-3 text-sm text-red-300">{{ error }}</p>
		<div class="mb-4 grid gap-3 sm:grid-cols-2">
			<label class="flex items-start gap-2 text-sm text-flixer-text">
				<input v-model="organizationWritesEnabled" type="checkbox" class="mt-1 accent-flixer-primary" :disabled="busy || loading" />
				<span><span class="font-semibold">Allow organization writes</span><span class="mt-1 block text-xs text-flixer-muted">Required to execute or roll back file moves for this library.</span></span>
			</label>
			<label class="flex items-start gap-2 text-sm text-flixer-text">
				<input v-model="nfoWritesEnabled" type="checkbox" class="mt-1 accent-flixer-primary" :disabled="busy || loading" />
				<span><span class="font-semibold">Write NFO corrections on save</span><span class="mt-1 block text-xs text-flixer-muted">Updates or creates sidecar NFO files when an admin saves media metadata.</span></span>
			</label>
		</div>
		<div class="mb-4 flex flex-wrap items-center gap-3">
			<button type="button" :disabled="busy || loading" class="rounded border border-flixer-border px-3 py-1.5 text-xs font-semibold transition hover:bg-white/10 disabled:opacity-50" @click="saveWritePermissions">Save write permissions</button>
			<p class="text-xs text-amber-200">A writable host or share mount is still required. Writes are disabled by default.</p>
		</div>

		<div class="grid gap-3 md:grid-cols-2">
			<label class="flex min-w-0 flex-col gap-1 text-xs text-flixer-muted">
				Movies
				<input v-model="templates.movie" :class="inputClass" aria-label="Movie path template" />
			</label>
			<label class="flex min-w-0 flex-col gap-1 text-xs text-flixer-muted">
				Series folder
				<input v-model="templates.series" :class="inputClass" aria-label="Series path template" />
			</label>
			<label class="flex min-w-0 flex-col gap-1 text-xs text-flixer-muted">
				Episodes
				<input v-model="templates.episode" :class="inputClass" aria-label="Episode path template" />
			</label>
			<label class="flex min-w-0 flex-col gap-1 text-xs text-flixer-muted">
				Music tracks
				<input v-model="templates.music" :class="inputClass" aria-label="Music path template" />
			</label>
		</div>
		<p class="mt-2 text-xs text-flixer-muted">Placeholders: movie {title}, {year}, {filename}; series {seriesTitle}, {seriesYear}; episode {season}, {episode}, {filename}; music {artist}, {album}, {year}, {trackNumber}, {title}, {extension}. File templates must include {filename}, except music may compose a name from {title} and {extension}.</p>

		<div class="mt-4 flex flex-wrap gap-2">
			<button type="button" :disabled="busy || loading" class="rounded bg-white/10 px-3 py-2 text-sm font-semibold transition hover:bg-white/15 disabled:opacity-50" @click="saveTemplates">Save templates</button>
			<button type="button" :disabled="busy || loading" class="rounded bg-flixer-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-50" @click="createPlan">Create preview</button>
		</div>

		<div v-if="settings?.plans.length" class="mt-6 border-t border-flixer-border pt-4">
			<label class="flex max-w-xl flex-col gap-1 text-xs text-flixer-muted">
				Saved plan
				<select v-model="selectedPlanId" :class="inputClass" @change="loadPlan(selectedPlanId)">
					<option v-for="entry in settings.plans" :key="entry.id" :value="entry.id">{{ entry.createdAt }} · {{ entry.state }} · {{ entry.summary.moveCount }} moves</option>
				</select>
			</label>
		</div>

		<div v-if="plan" class="mt-4">
			<div class="flex flex-wrap items-baseline justify-between gap-2">
				<h3 class="text-sm font-semibold">Preview · {{ plan.state }}</h3>
				<span class="text-xs text-flixer-muted">{{ plan.summary.moveCount }} moves · {{ plan.summary.unchangedCount }} unchanged · {{ formatBytes(plan.summary.totalBytes) }}</span>
			</div>
			<div v-if="plan.state === 'executing' || plan.state === 'rolling_back'" class="mt-3 flex flex-wrap items-center justify-between gap-2 rounded border border-amber-400/30 bg-amber-400/5 p-3 text-sm text-amber-200" role="status">
				<span>{{ plan.state === "executing" ? "This plan is already executing. Do not retry it." : "This plan is already rolling back. Do not retry it." }}</span>
				<div class="flex flex-wrap gap-2">
					<button type="button" class="rounded border border-amber-400/40 px-3 py-1.5 text-xs font-semibold hover:bg-amber-400/10" :disabled="loading || busy" @click="loadPlan(plan!.id)">Refresh status</button>
					<button v-if="plan.state === 'executing'" type="button" class="rounded border border-amber-400/40 px-3 py-1.5 text-xs font-semibold hover:bg-amber-400/10 disabled:opacity-50" :disabled="busy || passwordPromptOpen" @click="recoverPlan">Verify and recover untouched plan</button>
				</div>
			</div>
			<div v-if="plan.state === 'executing' || plan.state === 'rolling_back'" class="mt-3">
				<button type="button" :disabled="reconciling" class="rounded border border-flixer-border px-3 py-1.5 text-xs font-semibold hover:bg-white/5 disabled:opacity-50" @click="reconcilePlan">
					{{ reconciling ? `Inspecting ${reconcileProgress} of ${plan.moves.length} files…` : "Inspect source and destination status (read-only)" }}
				</button>
				<p class="mt-1 text-xs text-flixer-muted">This checks file presence, size, and modification time only. It does not change files or plan state.</p>
				<div v-if="reconciliation" class="mt-3 rounded border border-flixer-border bg-flixer-background/50 p-3 text-xs">
					<p class="font-semibold text-flixer-text">{{ reconciliation.scanned }} files inspected</p>
					<p class="mt-1 text-flixer-muted">Not moved: {{ reconciliation.counts.notMoved }} · Moved: {{ reconciliation.counts.moved }} · Both exist: {{ reconciliation.counts.bothExist }} · Neither exists: {{ reconciliation.counts.neitherExists }} · Changed/uncertain: {{ reconciliation.counts.changed + reconciliation.counts.unavailable }}</p>
					<ul v-if="reconciliation.counts.changed + reconciliation.counts.unavailable > 0" class="mt-2 max-h-40 overflow-auto border-t border-flixer-border pt-2">
						<li v-for="entry in reconciliation.items.filter(item => item.status === 'changed' || item.status === 'unavailable').slice(0, 20)" :key="entry.itemId" class="break-all py-1 text-amber-200">{{ entry.status }} · {{ entry.title }} · {{ entry.sourceRelativePath }} → {{ entry.targetRelativePath }}</li>
					</ul>
				</div>
			</div>
			<p v-if="plan.error" role="alert" class="mt-2 break-words text-sm text-red-300">{{ plan.error }}</p>
			<div class="mt-3 max-h-96 overflow-auto rounded border border-flixer-border">
				<table class="w-full min-w-[42rem] border-collapse text-left text-xs">
					<thead class="sticky top-0 bg-flixer-background text-flixer-muted">
						<tr>
							<th class="p-2 font-medium">Item</th>
							<th class="p-2 font-medium">Current path</th>
							<th class="p-2 font-medium">Planned path</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="move in visibleMoves" :key="move.itemId" class="border-t border-flixer-border align-top">
							<td class="max-w-40 break-words p-2">
								{{ move.title }}<span class="block text-flixer-muted">{{ move.type }}</span>
							</td>
							<td class="max-w-72 break-all p-2 font-mono text-flixer-muted">{{ move.sourceRelativePath }}</td>
							<td class="max-w-72 break-all p-2 font-mono">{{ move.targetRelativePath }}</td>
						</tr>
					</tbody>
				</table>
			</div>
			<p v-if="plan.moves.length > visibleMoves.length" class="mt-2 text-xs text-flixer-muted">Showing the first {{ visibleMoves.length }} of {{ plan.moves.length }} moves.</p>

			<div v-if="plan.state === 'preview' || plan.state === 'completed'" class="mt-4 flex flex-wrap items-end gap-2">
				<button v-if="plan.state === 'preview'" type="button" :disabled="busy || passwordPromptOpen || !settings?.organizationWritesEnabled" class="rounded bg-red-500/20 px-3 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/30 disabled:opacity-50" @click="executePlan">Execute plan</button>
				<button v-else type="button" :disabled="busy || passwordPromptOpen || !settings?.organizationWritesEnabled" class="rounded bg-white/10 px-3 py-2 text-sm transition hover:bg-white/15 disabled:opacity-50" @click="rollbackPlan">Roll back</button>
			</div>

			<ol v-if="plan.audit?.length" class="mt-4 border-t border-flixer-border pt-3 text-xs text-flixer-muted">
				<li v-for="event in plan.audit" :key="event.id" class="py-1">{{ event.createdAt }} · {{ event.action }}</li>
			</ol>
		</div>
	</AdminSection>
</template>
