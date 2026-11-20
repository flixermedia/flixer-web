<script setup lang="ts">
import { Select, SelectContent, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@ui-sdk/vue/select";
import { Input } from "@ui-sdk/vue/input";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useLiveLogs } from "../../composables/useLiveLogs";
import AdminSection from "./AdminSection.vue";
import { adminQuery } from "./adminNav";
import { loggingLevelClass } from "./loggingFilters";

const { t, locale } = useI18n();
const loggingPage = { path: "/admin", query: adminQuery("logging", "logging") };
const { entries, status, paused, pause, resume, clear } = useLiveLogs();
const level = ref("");
const search = ref("");
const levels = ["debug", "info", "warn", "error"] as const;
const selectedLevel = computed({
	get: () => level.value || "all",
	set: (value: string | null) => { level.value = value === null || value === "all" ? "" : value; },
});

const visibleEntries = computed(() => {
	const query = search.value.trim().toLocaleLowerCase(locale.value);
	return entries.value
		.filter((entry) => {
			if (level.value && entry.level !== level.value) return false;
			if (!query) return true;
			return [entry.level, entry.app, entry.source, entry.message, JSON.stringify(entry.fields ?? {})].join(" ").toLocaleLowerCase(locale.value).includes(query);
		})
		.slice()
		.reverse();
});

function formatTime(value: string) {
	const date = new Date(value);
	return Number.isFinite(date.getTime()) ? date.toLocaleTimeString(locale.value, { hour: "numeric", minute: "2-digit", second: "2-digit" }) : value;
}

function connectionLabel() {
	return paused.value ? t("admin.logs.paused") : t(`admin.logs.${status.value}`);
}
</script>

<template>
	<AdminSection :title="t('admin.logs.title')" :description="t('admin.logs.description')" compact>
		<template #actions>
			<span class="rounded bg-white/10 px-3 py-1 text-xs font-semibold" role="status" aria-live="polite">
				<span class="mr-1.5 inline-block size-2 rounded-full align-middle" :class="status === 'live' && !paused ? 'bg-emerald-400' : 'bg-amber-400'" aria-hidden="true"></span>
				{{ connectionLabel() }}
			</span>
			<RouterLink :to="loggingPage" class="rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-flixer-accent">
				{{ t("admin.logs.openLogging") }}
			</RouterLink>
		</template>

		<div class="flex flex-wrap items-center gap-2">
			<label class="sr-only" for="dashboard-log-search">{{ t("admin.logs.search") }}</label>
			<Input id="dashboard-log-search" v-model="search" type="search" :placeholder="t('admin.logs.search')" class="min-w-32 flex-1 rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-xs focus-visible:outline-2 focus-visible:outline-flixer-accent" />
			<Select v-model:value="selectedLevel">
				<SelectLabel class="sr-only">{{ t("admin.logs.logLevel") }}</SelectLabel>
				<SelectTrigger class="h-auto rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-left text-xs focus-visible:outline-2 focus-visible:outline-flixer-accent">
					<SelectValue />
				</SelectTrigger>
				<SelectContent class="max-h-64 rounded border border-flixer-border bg-flixer-surface p-1 text-xs text-flixer-text shadow-xl">
					<SelectItem value="all" class="cursor-pointer rounded px-3 py-2 outline-none data-highlighted:bg-white/10 data-selected:bg-white/10">{{ t("admin.logs.all") }}</SelectItem>
					<SelectItem v-for="item in levels" :key="item" :value="item" class="cursor-pointer rounded px-3 py-2 outline-none data-highlighted:bg-white/10 data-selected:bg-white/10">{{ t(`admin.logs.${item}`) }}</SelectItem>
				</SelectContent>
			</Select>
			<button type="button" class="rounded bg-white/10 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-flixer-accent" @click="paused ? resume() : pause()">
				{{ paused ? t("admin.logs.resume") : t("admin.logs.pause") }}
			</button>
			<button type="button" class="rounded bg-white/10 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-flixer-accent" :disabled="entries.length === 0" @click="clear">
				{{ t("admin.logs.clear") }}
			</button>
		</div>

		<ul class="mt-2 max-h-64 divide-y divide-flixer-border overflow-auto font-mono text-xs" :aria-label="t('admin.logs.title')">
			<li v-for="entry in visibleEntries" :key="entry.id" class="flex flex-wrap gap-x-2 gap-y-1 py-2">
				<time class="shrink-0 text-flixer-muted" :datetime="entry.time">{{ formatTime(entry.time) }}</time>
				<strong class="shrink-0 uppercase" :class="loggingLevelClass(entry.level)">{{ entry.level }}</strong>
				<span class="shrink-0 text-flixer-accent">{{ entry.app }}</span>
				<span class="shrink-0 text-flixer-muted">{{ entry.source }}</span>
				<span class="min-w-0 flex-1 whitespace-pre-wrap break-words">{{ entry.message }}</span>
			</li>
			<li v-if="visibleEntries.length === 0" class="py-6 text-center text-flixer-muted">{{ t("admin.logs.empty") }}</li>
		</ul>
	</AdminSection>
</template>
