<script setup lang="ts">
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "@lucide/vue";
import { Button } from "@ui-sdk/vue/button";
import { CalendarDay, CalendarGrid, CalendarHeading, CalendarNext, CalendarPrevious, CalendarWeekday, CalendarWeekdays, CalendarWeeks, DatePicker, DatePickerContent, DatePickerInput, DatePickerTrigger, type DatePickerValue } from "@ui-sdk/vue/date-picker";
import { Input } from "@ui-sdk/vue/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui-sdk/vue/select";
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter, type LocationQueryValue } from "vue-router";
import { getAdminActivity, type AdminActivityPage } from "../../api";
import AdminSection from "./AdminSection.vue";
import AdminSkeleton from "./AdminSkeleton.vue";
import StatusPill from "./StatusPill.vue";
import { useActivityFormat } from "../../composables/useActivityFormat";
import { describeRequestError } from "../../composables/useProfile";
import { catchError } from "../../utils/catchError";

const props = withDefaults(defineProps<{ embedded?: boolean }>(), { embedded: false });
const PAGE_SIZE = 25;
const ALL_FILTER = "__all__";
const SORTS = ["recent", "oldest", "user", "title"] as const;
const TYPES = ["movie", "episode", "track", "video"] as const;

const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();
const { relativeTime, activityTitle, progressPercent } = useActivityFormat();

const single = (value: LocationQueryValue | LocationQueryValue[] | undefined) => (typeof value === "string" ? value : "");

const filters = computed(() => ({
	search: single(route.query.search),
	user: single(route.query.user),
	type: single(route.query.type),
	status: single(route.query.status),
	from: single(route.query.from),
	to: single(route.query.to),
	sort: single(route.query.sort) || "recent",
	page: Math.max(1, Number.parseInt(single(route.query[props.embedded ? "activityPage" : "page"]), 10) || 1),
}));
const hasFilters = computed(() => Boolean(filters.value.search || filters.value.user || filters.value.type || filters.value.status || filters.value.from || filters.value.to));

const data = ref<AdminActivityPage | null>(null);
const loading = ref(true);
const error = ref("");
let requestId = 0;

async function load() {
	const current = ++requestId;
	loading.value = true;
	try {
		const [requestError, result] = await catchError(getAdminActivity({ ...filters.value, page: String(filters.value.page), pageSize: String(PAGE_SIZE) }));
		if (requestError) {
			if (current !== requestId) return;
			error.value = describeRequestError(requestError, t("admin.activity.loadError"));
		} else if (current === requestId) {
			data.value = result;
			error.value = "";
		}
	} finally {
		if (current === requestId) loading.value = false;
	}
}

// Filters live in the URL so a filtered view can be bookmarked or shared; changing one returns to the first page.
function setFilters(changes: Record<string, string | number | undefined>) {
	const pageKey = props.embedded ? "activityPage" : "page";
	const mapped = { ...changes };
	if ("page" in mapped && props.embedded) {
		mapped.activityPage = mapped.page;
		delete mapped.page;
	}
	const next: Record<string, string> = {};
	for (const [key, value] of Object.entries({ ...route.query, ...(pageKey in mapped ? {} : { [pageKey]: undefined }), ...mapped })) {
		const text = typeof value === "number" ? String(value) : single(value as LocationQueryValue);
		if (text !== "" && !(key === pageKey && text === "1") && !(key === "sort" && text === "recent")) next[key] = text;
	}
	void router.replace({ query: next });
}

function setSelectFilter(key: "user" | "type" | "status" | "sort", value: string | null) {
	if (value !== null) setFilters({ [key]: value === ALL_FILTER ? "" : value });
}

const searchText = ref(filters.value.search);
let searchTimer: ReturnType<typeof setTimeout> | undefined;
watch(searchText, (value) => {
	clearTimeout(searchTimer);
	searchTimer = setTimeout(() => {
		if (value.trim() !== filters.value.search) setFilters({ search: value.trim() });
	}, 300);
});
watch(
	() => filters.value.search,
	(value) => {
		if (value !== searchText.value.trim()) searchText.value = value;
	},
);
onBeforeUnmount(() => clearTimeout(searchTimer));

watch(
	() => route.query,
	() => {
		if (route.name === "admin-activity" || props.embedded) void load();
	},
	{ immediate: true },
);

function reset() {
	searchText.value = "";
	void router.replace({ query: props.embedded ? { tab: "analytics", page: "analyticsHistory" } : {} });
}

const pageCount = computed(() => Math.max(1, Math.ceil((data.value?.total ?? 0) / PAGE_SIZE)));
const rangeStart = computed(() => ((data.value?.total ?? 0) === 0 ? 0 : (filters.value.page - 1) * PAGE_SIZE + 1));
const rangeEnd = computed(() => Math.min(data.value?.total ?? 0, filters.value.page * PAGE_SIZE));

const summaryCards = computed(() => [
	{ label: t(props.embedded ? "analytics.progressRecords" : "admin.activity.summary.total"), value: data.value?.summary.total ?? 0 },
	{ label: t("admin.activity.summary.finished"), value: data.value?.summary.finished ?? 0 },
	{ label: t("admin.activity.summary.inProgress"), value: data.value?.summary.inProgress ?? 0 },
	{ label: t("admin.activity.summary.users"), value: data.value?.summary.users ?? 0 },
]);

const fieldClass = "h-10 w-full rounded border border-flixer-border bg-flixer-background px-3 text-sm text-flixer-text placeholder:text-flixer-muted focus-visible:outline-2 focus-visible:outline-flixer-accent scheme-dark";
const absoluteTime = (iso: string) => new Date(iso).toLocaleString(locale.value);

function setDateFilter(filter: "from" | "to", value: DatePickerValue) {
	setFilters({ [filter]: typeof value === "string" ? value : "" });
}
</script>

<template>
	<div class="flex flex-col gap-6">
		<div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
			<div v-for="card in summaryCards" :key="card.label" class="admin-card p-5">
				<p class="text-xs text-flixer-muted">{{ card.label }}</p>
				<p class="mt-1 text-3xl font-semibold transition-opacity" :class="loading ? 'opacity-50' : ''">{{ card.value.toLocaleString(locale) }}</p>
			</div>
		</div>

		<AdminSection :title="t('admin.activity.title')" :description="t(props.embedded ? 'analytics.historyNote' : 'admin.activity.subtitle')">
			<form class="grid gap-3 sm:grid-cols-2 lg:grid-cols-6" role="search" @submit.prevent>
				<Input v-model="searchText" type="search" autocomplete="off" :placeholder="t('admin.activity.search')" :aria-label="t('admin.activity.search')" :class="fieldClass" class="sm:col-span-2" />
				<Select :value="filters.user || ALL_FILTER" @value-change="setSelectFilter('user', $event)">
					<SelectTrigger :aria-label="t('admin.activity.user')" :class="fieldClass"><SelectValue /></SelectTrigger>
					<SelectContent class="max-h-64 rounded border border-flixer-border bg-flixer-surface p-1 text-sm text-flixer-text shadow-xl">
						<SelectItem :value="ALL_FILTER" class="cursor-pointer rounded px-3 py-2 outline-none data-highlighted:bg-white/10 data-selected:bg-white/10">{{ t("admin.activity.allUsers") }}</SelectItem>
						<SelectItem v-for="user in data?.users ?? []" :key="user.id" :value="user.id" class="cursor-pointer rounded px-3 py-2 outline-none data-highlighted:bg-white/10 data-selected:bg-white/10">{{ user.name }}</SelectItem>
					</SelectContent>
				</Select>
				<Select :value="filters.type || ALL_FILTER" @value-change="setSelectFilter('type', $event)">
					<SelectTrigger :aria-label="t('admin.activity.type.label')" :class="fieldClass"><SelectValue /></SelectTrigger>
					<SelectContent class="max-h-64 rounded border border-flixer-border bg-flixer-surface p-1 text-sm text-flixer-text shadow-xl">
						<SelectItem :value="ALL_FILTER" class="cursor-pointer rounded px-3 py-2 outline-none data-highlighted:bg-white/10 data-selected:bg-white/10">{{ t("admin.activity.type.all") }}</SelectItem>
						<SelectItem v-for="type in TYPES" :key="type" :value="type" class="cursor-pointer rounded px-3 py-2 outline-none data-highlighted:bg-white/10 data-selected:bg-white/10">{{ t(`admin.activity.type.${type}`) }}</SelectItem>
					</SelectContent>
				</Select>
				<Select :value="filters.status || ALL_FILTER" @value-change="setSelectFilter('status', $event)">
					<SelectTrigger :aria-label="t('admin.activity.status.label')" :class="fieldClass"><SelectValue /></SelectTrigger>
					<SelectContent class="max-h-64 rounded border border-flixer-border bg-flixer-surface p-1 text-sm text-flixer-text shadow-xl">
						<SelectItem :value="ALL_FILTER" class="cursor-pointer rounded px-3 py-2 outline-none data-highlighted:bg-white/10 data-selected:bg-white/10">{{ t("admin.activity.status.all") }}</SelectItem>
						<SelectItem value="finished" class="cursor-pointer rounded px-3 py-2 outline-none data-highlighted:bg-white/10 data-selected:bg-white/10">{{ t("admin.activity.status.finished") }}</SelectItem>
						<SelectItem value="in_progress" class="cursor-pointer rounded px-3 py-2 outline-none data-highlighted:bg-white/10 data-selected:bg-white/10">{{ t("admin.activity.status.inProgress") }}</SelectItem>
					</SelectContent>
				</Select>
				<Select :value="filters.sort" @value-change="setSelectFilter('sort', $event)">
					<SelectTrigger :aria-label="t('admin.activity.sort.label')" :class="fieldClass"><SelectValue /></SelectTrigger>
					<SelectContent class="max-h-64 rounded border border-flixer-border bg-flixer-surface p-1 text-sm text-flixer-text shadow-xl">
						<SelectItem v-for="sort in SORTS" :key="sort" :value="sort" class="cursor-pointer rounded px-3 py-2 outline-none data-highlighted:bg-white/10 data-selected:bg-white/10">{{ t(`admin.activity.sort.${sort}`) }}</SelectItem>
					</SelectContent>
				</Select>
				<div class="flex items-center gap-2 text-xs text-flixer-muted sm:col-span-1 lg:col-span-2">
					<span class="shrink-0">{{ t("admin.activity.from") }}</span>
					<DatePicker :value="filters.from || null" :max="filters.to || undefined" :locale="locale" class="min-w-0 flex-1" @value-change="setDateFilter('from', $event)">
						<div class="relative">
							<DatePickerInput :aria-label="t('admin.activity.from')" :class="[fieldClass, 'pr-11']" />
							<DatePickerTrigger :aria-label="`${t('admin.activity.from')} calendar`" class="absolute inset-y-1 right-1 flex w-8 items-center justify-center rounded text-flixer-muted transition hover:bg-white/10 hover:text-flixer-text focus-visible:outline-2 focus-visible:outline-flixer-accent">
								<CalendarIcon aria-hidden="true" class="size-4" />
							</DatePickerTrigger>
						</div>
						<DatePickerContent class="z-50 mt-1 w-72 rounded border border-flixer-border bg-flixer-background p-3 text-flixer-text shadow-xl">
							<div class="mb-2 flex items-center justify-between">
								<CalendarPrevious class="flex size-8 items-center justify-center rounded text-flixer-muted hover:bg-white/10 hover:text-flixer-text focus-visible:outline-2 focus-visible:outline-flixer-accent data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40">
									<ChevronLeftIcon aria-hidden="true" class="size-4" />
								</CalendarPrevious>
								<CalendarHeading class="text-sm font-semibold" />
								<CalendarNext class="flex size-8 items-center justify-center rounded text-flixer-muted hover:bg-white/10 hover:text-flixer-text focus-visible:outline-2 focus-visible:outline-flixer-accent data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40">
									<ChevronRightIcon aria-hidden="true" class="size-4" />
								</CalendarNext>
							</div>
							<CalendarGrid class="w-full border-separate border-spacing-y-1">
								<CalendarWeekdays v-slot="{ index }">
									<CalendarWeekday :index="index" class="h-8 text-xs font-medium text-flixer-muted" />
								</CalendarWeekdays>
								<CalendarWeeks v-slot="{ cell }">
									<CalendarDay :value="cell.date" class="size-8 rounded text-sm transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-flixer-accent data-[outside]:text-flixer-muted/40 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-35 data-[selected]:bg-flixer-primary data-[selected]:text-white data-[today]:ring-1 data-[today]:ring-flixer-accent" />
								</CalendarWeeks>
							</CalendarGrid>
						</DatePickerContent>
					</DatePicker>
				</div>
				<div class="flex items-center gap-2 text-xs text-flixer-muted sm:col-span-1 lg:col-span-2">
					<span class="shrink-0">{{ t("admin.activity.to") }}</span>
					<DatePicker :value="filters.to || null" :min="filters.from || undefined" :locale="locale" class="min-w-0 flex-1" @value-change="setDateFilter('to', $event)">
						<div class="relative">
							<DatePickerInput :aria-label="t('admin.activity.to')" :class="[fieldClass, 'pr-11']" />
							<DatePickerTrigger :aria-label="`${t('admin.activity.to')} calendar`" class="absolute inset-y-1 right-1 flex w-8 items-center justify-center rounded text-flixer-muted transition hover:bg-white/10 hover:text-flixer-text focus-visible:outline-2 focus-visible:outline-flixer-accent">
								<CalendarIcon aria-hidden="true" class="size-4" />
							</DatePickerTrigger>
						</div>
						<DatePickerContent class="z-50 mt-1 w-72 rounded border border-flixer-border bg-flixer-background p-3 text-flixer-text shadow-xl">
							<div class="mb-2 flex items-center justify-between">
								<CalendarPrevious class="flex size-8 items-center justify-center rounded text-flixer-muted hover:bg-white/10 hover:text-flixer-text focus-visible:outline-2 focus-visible:outline-flixer-accent data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40">
									<ChevronLeftIcon aria-hidden="true" class="size-4" />
								</CalendarPrevious>
								<CalendarHeading class="text-sm font-semibold" />
								<CalendarNext class="flex size-8 items-center justify-center rounded text-flixer-muted hover:bg-white/10 hover:text-flixer-text focus-visible:outline-2 focus-visible:outline-flixer-accent data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40">
									<ChevronRightIcon aria-hidden="true" class="size-4" />
								</CalendarNext>
							</div>
							<CalendarGrid class="w-full border-separate border-spacing-y-1">
								<CalendarWeekdays v-slot="{ index }">
									<CalendarWeekday :index="index" class="h-8 text-xs font-medium text-flixer-muted" />
								</CalendarWeekdays>
								<CalendarWeeks v-slot="{ cell }">
									<CalendarDay :value="cell.date" class="size-8 rounded text-sm transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-flixer-accent data-[outside]:text-flixer-muted/40 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-35 data-[selected]:bg-flixer-primary data-[selected]:text-white data-[today]:ring-1 data-[today]:ring-flixer-accent" />
								</CalendarWeeks>
							</CalendarGrid>
						</DatePickerContent>
					</DatePicker>
				</div>
				<div class="flex items-center sm:col-span-2 lg:col-span-2 lg:justify-end">
					<Button :disabled="!hasFilters" class="h-10 rounded border border-flixer-border px-4 text-sm font-semibold transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40" @click="reset">{{ t("admin.activity.reset") }}</Button>
				</div>
			</form>

			<AdminSkeleton v-if="loading && !data" variant="table" class="mt-4" />

			<p v-if="error" role="alert" class="mt-4 rounded border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{{ error }}</p>

			<div v-if="data" class="mt-4 overflow-hidden rounded border border-flixer-border" :aria-busy="loading">
				<div class="hidden grid-cols-[12rem_1fr_6rem_12rem_9rem] gap-4 border-b border-flixer-border px-5 py-3 text-xs font-semibold uppercase tracking-wide text-flixer-muted md:grid">
					<span>{{ t("admin.activity.columns.user") }}</span>
					<span>{{ t("admin.activity.columns.title") }}</span>
					<span>{{ t("admin.activity.columns.type") }}</span>
					<span>{{ t("admin.activity.columns.progress") }}</span>
					<span class="text-right">{{ t("admin.activity.columns.when") }}</span>
				</div>

				<ul class="divide-y divide-flixer-border transition-opacity" :class="loading && data ? 'opacity-50' : ''">
					<li v-for="(entry, i) in data?.items ?? []" :key="`${entry.at}-${i}`" class="grid gap-x-4 gap-y-2 px-5 py-4 text-sm md:grid-cols-[12rem_1fr_6rem_12rem_9rem] md:items-center">
						<span class="truncate font-semibold">{{ entry.user }}</span>
						<span class="min-w-0 truncate text-flixer-text/90" :title="activityTitle(entry)">{{ activityTitle(entry) }}</span>
						<span class="text-xs text-flixer-muted">{{ t(`admin.activity.type.${entry.type}`) }}</span>
						<span class="flex items-center gap-3">
							<StatusPill v-if="entry.completed" tone="good">{{ t("admin.activity.status.finished") }}</StatusPill>
							<template v-else>
								<span class="h-1.5 w-24 shrink-0 overflow-hidden rounded bg-white/10" role="progressbar" :aria-valuenow="progressPercent(entry)" aria-valuemin="0" aria-valuemax="100">
									<span class="block h-full rounded bg-linear-to-r from-flixer-primary to-flixer-cyan" :style="{ width: `${progressPercent(entry)}%` }"></span>
								</span>
								<span class="text-xs text-flixer-muted">{{ progressPercent(entry) }}%</span>
							</template>
						</span>
						<span class="text-xs text-flixer-muted md:text-right" :title="absoluteTime(entry.at)">{{ relativeTime(entry.at) }}</span>
					</li>
					<li v-if="!loading && (data?.items.length ?? 0) === 0 && !error" class="px-5 py-12 text-center text-sm text-flixer-muted">{{ hasFilters ? t("admin.activity.noMatches") : t("admin.overview.noActivity") }}</li>
				</ul>
			</div>

			<nav v-if="data && data.total > 0" class="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm" :aria-label="t('admin.activity.pagination')">
				<p class="text-flixer-muted">{{ t("admin.activity.range", { from: rangeStart.toLocaleString(locale), to: rangeEnd.toLocaleString(locale), total: data.total.toLocaleString(locale) }) }}</p>
				<div class="flex items-center gap-2">
					<Button :disabled="filters.page <= 1" class="h-10 rounded border border-flixer-border px-4 font-semibold transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40" @click="setFilters({ page: filters.page - 1 })">{{ t("admin.activity.previous") }}</Button>
					<span class="px-2 text-flixer-muted">{{ t("admin.activity.pageOf", { page: filters.page, pages: pageCount }) }}</span>
					<Button :disabled="filters.page >= pageCount" class="h-10 rounded border border-flixer-border px-4 font-semibold transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40" @click="setFilters({ page: filters.page + 1 })">{{ t("admin.activity.next") }}</Button>
				</div>
			</nav>
		</AdminSection>
	</div>
</template>
