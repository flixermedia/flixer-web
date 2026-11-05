<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { CONTENT_KINDS, searchPaymentScopes, type ContentKind, type ContentScope, type ScopeSearchResult } from "../../../api";
import { adminInput, adminSelect, secondaryButton } from "./adminPaymentStyles";

const props = defineProps<{ label: string; multiple?: boolean; required?: boolean }>();
const model = defineModel<ContentScope[]>({ required: true });
const { t } = useI18n();

const ITEM_TYPES = ["movie", "series", "season", "episode", "album", "track", "video"] as const;

const mode = ref<"all" | "kind" | "item" | "artist">("all");
const kind = ref<ContentKind>("movies");
const itemType = ref("");
const query = ref("");
const results = ref<ScopeSearchResult>({ items: [], artists: [] });
const searching = ref(false);
let token = 0;
let timer: ReturnType<typeof setTimeout> | undefined;

const searchable = computed(() => mode.value === "item" || mode.value === "artist");

watch([query, itemType, mode], () => {
	clearTimeout(timer);
	const q = query.value.trim();
	if (!searchable.value || q.length < 2) {
		results.value = { items: [], artists: [] };
		return;
	}
	timer = setTimeout(async () => {
		const current = ++token;
		searching.value = true;
		const found = await searchPaymentScopes(q, mode.value === "item" ? itemType.value || undefined : undefined).catch(() => ({ items: [], artists: [] }));
		if (current !== token) return;
		searching.value = false;
		results.value = found;
	}, 250);
});

function scopeKey(scope: ContentScope) {
	return `${scope.type}:${scope.ref ?? ""}`;
}

function add(scope: ContentScope) {
	if (model.value.some((entry) => scopeKey(entry) === scopeKey(scope))) return;
	model.value = props.multiple ? [...model.value, scope] : [scope];
	query.value = "";
}

function describe(scope: ContentScope) {
	if (scope.type === "all") return t("payments.scope.all");
	if (scope.type === "kind") return t("payments.scope.kindOf", { kind: t(`payments.kinds.${scope.ref}`) });
	return scope.label || scope.ref || "";
}

function itemLabel(item: ScopeSearchResult["items"][number]) {
	const numbers = item.type === "season" ? ` S${item.seasonNumber ?? "?"}` : item.type === "episode" ? ` S${item.seasonNumber ?? "?"}E${item.episodeNumber ?? "?"}` : "";
	return `${item.title}${numbers}${item.year ? ` (${item.year})` : ""}`;
}
</script>

<template>
	<fieldset class="min-w-0 space-y-3">
		<legend class="text-sm font-medium">{{ label }}</legend>
		<ul v-if="model.length > 0" class="flex flex-wrap gap-2">
			<li v-for="scope in model" :key="scopeKey(scope)" class="inline-flex items-center gap-1.5 rounded-full border border-flixer-border bg-white/5 py-1 pl-3 text-xs" :class="!required || multiple ? 'pr-1' : 'pr-3'">
				<span class="max-w-60 truncate">{{ describe(scope) }}</span>
				<span class="text-flixer-muted">· {{ t(`payments.scope.${scope.type}`) }}</span>
				<button v-if="!required || multiple" type="button" class="grid size-5 place-items-center rounded-full text-flixer-muted hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-flixer-accent" :aria-label="t('payments.admin.removeScope')" @click="model = model.filter((entry) => scopeKey(entry) !== scopeKey(scope))"><Icon icon="lucide:x" class="size-3" aria-hidden="true" /></button>
			</li>
		</ul>
		<p v-else class="text-xs text-flixer-muted">{{ t("payments.admin.noScope") }}</p>

		<div class="flex flex-wrap items-center gap-2">
			<select v-model="mode" :aria-label="t('payments.admin.scopeType')" :class="adminSelect">
				<option value="all">{{ t("payments.scope.all") }}</option>
				<option value="kind">{{ t("payments.scope.kind") }}</option>
				<option value="item">{{ t("payments.scope.item") }}</option>
				<option value="artist">{{ t("payments.scope.artist") }}</option>
			</select>
			<template v-if="mode === 'all'">
				<button type="button" :class="secondaryButton" @click="add({ type: 'all', ref: null })">{{ t("payments.admin.addScope") }}</button>
			</template>
			<template v-else-if="mode === 'kind'">
				<select v-model="kind" :aria-label="t('payments.scope.kind')" :class="adminSelect">
					<option v-for="entry in CONTENT_KINDS" :key="entry" :value="entry">{{ t(`payments.kinds.${entry}`) }}</option>
				</select>
				<button type="button" :class="secondaryButton" @click="add({ type: 'kind', ref: kind })">{{ t("payments.admin.addScope") }}</button>
			</template>
			<template v-else>
				<select v-if="mode === 'item'" v-model="itemType" :aria-label="t('payments.admin.itemType')" :class="adminSelect">
					<option value="">{{ t("payments.admin.anyType") }}</option>
					<option v-for="entry in ITEM_TYPES" :key="entry" :value="entry">{{ t(`payments.itemTypes.${entry}`) }}</option>
				</select>
				<input v-model="query" type="search" autocomplete="off" :placeholder="t('payments.admin.searchScope')" :aria-label="t('payments.admin.searchScope')" :class="[adminInput, 'min-w-0 flex-1']" />
			</template>
		</div>

		<div v-if="searchable && query.trim().length >= 2" class="max-h-56 overflow-y-auto rounded border border-flixer-border bg-flixer-background/60" role="listbox" :aria-label="t('payments.admin.searchResults')">
			<p v-if="searching" class="p-3 text-xs text-flixer-muted" role="status">{{ t("payments.loading") }}</p>
			<template v-else-if="mode === 'item'">
				<button v-for="item in results.items" :key="item.id" type="button" role="option" class="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-flixer-accent" @click="add({ type: 'item', ref: item.id, label: itemLabel(item) })">
					<span class="truncate">{{ itemLabel(item) }}</span>
					<span class="shrink-0 text-xs text-flixer-muted">{{ t(`payments.itemTypes.${item.type}`) }}</span>
				</button>
				<p v-if="results.items.length === 0" class="p-3 text-xs text-flixer-muted">{{ t("payments.admin.noResults") }}</p>
			</template>
			<template v-else>
				<button v-for="artist in results.artists" :key="artist" type="button" role="option" class="block w-full truncate px-3 py-2 text-left text-sm hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-flixer-accent" @click="add({ type: 'artist', ref: artist, label: artist })">{{ artist }}</button>
				<p v-if="results.artists.length === 0" class="p-3 text-xs text-flixer-muted">{{ t("payments.admin.noResults") }}</p>
			</template>
		</div>
	</fieldset>
</template>
