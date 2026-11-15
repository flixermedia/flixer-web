<script setup lang="ts">
import { onMounted, ref } from "vue";
import { listMediaLibraries, scanMediaLibrary, type MediaLibrary } from "../../api";
import { listDuplicateSuggestions, type DuplicateSuggestionsPage } from "../../api/duplicateSuggestions";
import { describeRequestError } from "../../composables/useProfile";
import { catchError } from "../../utils/catchError";
import AdminSection from "./AdminSection.vue";

const PAGE_SIZE = 25;
const result = ref<DuplicateSuggestionsPage>({ items: [], total: 0, page: 1, size: PAGE_SIZE });
const loading = ref(false);
const libraries = ref<MediaLibrary[]>([]);
const hashLibraryId = ref("");
const hashScanBusy = ref(false);
const notice = ref("");
const error = ref("");

async function load(page = 1) {
	loading.value = true;
	const [failure, data] = await catchError(listDuplicateSuggestions(page, PAGE_SIZE));
	loading.value = false;
	if (failure) {
		error.value = describeRequestError(failure);
		return;
	}
	result.value = data;
	error.value = "";
}

function typeLabel(type: string): string {
	return type.replaceAll("_", " ");
}

function pageCount(total: number, size: number): number {
	return Math.max(1, Math.ceil(total / size));
}

async function scanFiles() {
	if (!hashLibraryId.value || hashScanBusy.value) return;
	hashScanBusy.value = true;
	try {
		await scanMediaLibrary(hashLibraryId.value, false, false, ["hashes"]);
		error.value = "";
		notice.value = "File hash scan queued. Refresh suggestions after the library scan completes.";
	} catch (cause) {
		error.value = describeRequestError(cause, "Could not queue file hash scan.");
	} finally {
		hashScanBusy.value = false;
	}
}

onMounted(() => {
	void load();
	void listMediaLibraries()
		.then((items) => {
			libraries.value = items;
			hashLibraryId.value = items[0]?.id ?? "";
		})
		.catch(() => undefined);
});
</script>

<template>
	<AdminSection title="Duplicate suggestions" description="Exact provider identity and file-content matches within the same library and media type. Titles and years are context only; no records or playback behavior are changed.">
		<template #actions>
			<div class="flex flex-wrap items-center gap-2">
				<label class="flex items-center gap-2 text-xs text-flixer-muted">
					Library
					<select v-model="hashLibraryId" class="rounded border border-flixer-border bg-flixer-background px-2 py-1.5 text-sm text-flixer-text">
						<option v-for="library in libraries" :key="library.id" :value="library.id">{{ library.name }}</option>
					</select>
				</label>
				<button type="button" class="rounded border border-flixer-border px-3 py-2 text-sm text-flixer-text hover:bg-white/5 disabled:opacity-50" :disabled="!hashLibraryId || hashScanBusy" @click="scanFiles">
					{{ hashScanBusy ? "Queueing…" : "Calculate file hashes" }}
				</button>
				<button type="button" class="rounded border border-flixer-border px-3 py-2 text-sm text-flixer-text hover:bg-white/5 disabled:opacity-50" :disabled="loading" @click="load(result.page)">
					{{ loading ? "Checking…" : "Refresh" }}
				</button>
			</div>
		</template>

		<p v-if="error" class="mb-4 rounded border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200" role="alert">{{ error }}</p>
		<p v-else-if="loading && !result.items.length" class="py-5 text-sm text-flixer-muted" role="status">Loading suggestions…</p>
		<p v-else-if="!result.total" class="py-5 text-sm text-flixer-muted">No exact provider identity suggestions found.</p>

		<div v-else class="space-y-3">
			<section v-for="suggestion in result.items" :key="`${suggestion.libraryId}:${suggestion.type}:${suggestion.provider}:${suggestion.providerId}`" class="border-b border-flixer-border pb-3 last:border-0 last:pb-0">
				<div class="flex flex-wrap items-start justify-between gap-2">
					<div class="min-w-0">
						<h3 class="break-words text-sm font-semibold text-flixer-text" :title="suggestion.providerId">{{ suggestion.kind === "fileHash" ? `SHA-256:${suggestion.providerId.slice(0, 16)}…` : `${suggestion.provider}:${suggestion.providerId}` }}</h3>
						<p class="mt-1 text-xs text-flixer-muted">{{ typeLabel(suggestion.type) }} · {{ suggestion.itemCount }} items · library {{ suggestion.libraryId }}</p>
					</div>
					<span class="shrink-0 rounded bg-white/5 px-2 py-1 text-xs text-flixer-muted">{{ suggestion.kind === "fileHash" ? "Identical file content" : "Exact provider ID" }}</span>
				</div>
				<ul class="mt-3 divide-y divide-flixer-border/70">
					<li v-for="item in suggestion.items" :key="item.id" class="py-2 first:pt-0 last:pb-0">
						<p class="break-words text-sm text-flixer-text">
							{{ item.title }}<span v-if="item.year" class="text-flixer-muted"> ({{ item.year }})</span>
						</p>
						<p class="mt-1 break-all text-xs text-flixer-muted">{{ item.path }}</p>
					</li>
				</ul>
				<p v-if="suggestion.itemsTruncated" class="mt-2 text-xs text-flixer-muted">Showing 10 of {{ suggestion.itemCount }} matching items.</p>
			</section>
			<p v-if="notice" class="text-sm text-flixer-muted" role="status">{{ notice }}</p>

			<div class="flex flex-wrap items-center justify-between gap-3 border-t border-flixer-border pt-3 text-sm text-flixer-muted">
				<span>{{ result.total }} suggestion groups · page {{ result.page }} of {{ pageCount(result.total, result.size) }}</span>
				<div class="flex gap-2">
					<button type="button" class="rounded border border-flixer-border px-3 py-1.5 hover:bg-white/5 disabled:opacity-40" :disabled="loading || result.page <= 1" @click="load(result.page - 1)">Previous</button>
					<button type="button" class="rounded border border-flixer-border px-3 py-1.5 hover:bg-white/5 disabled:opacity-40" :disabled="loading || result.page >= pageCount(result.total, result.size)" @click="load(result.page + 1)">Next</button>
				</div>
			</div>
		</div>
	</AdminSection>
</template>
