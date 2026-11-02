<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { forceRefreshAiRecommendations, getAiAdminStatus, getAiRecommendationCaches, retryAiModel, saveAiAdminConfiguration, type AiActivityEvent, type AiAdminConfiguration, type AiAdminStatus, type AiRecommendationCacheUser } from "../../api";
import { notify } from "../../composables/notify";
import { describeRequestError } from "../../composables/useProfile";
import { catchError } from "../../utils/catchError";
import AdminSection from "./AdminSection.vue";
import AdminToggle from "./AdminToggle.vue";

const { t } = useI18n();
const configuration = ref<AiAdminConfiguration>({ enabled: false, profile: "auto", allowDownloads: true, cacheRefreshIntervalMinutes: 10 });
const status = ref<AiAdminStatus | null>(null);
const recommendationUsers = ref<AiRecommendationCacheUser[]>([]);
const selectedRecommendationUserId = ref("");
const loading = ref(true);
const saving = ref(false);
const retrying = ref(false);
const loadingRecommendations = ref(false);
const forcingRefresh = ref(false);
const loadError = ref("");
let refreshTimer: ReturnType<typeof setInterval> | undefined;
let refreshing = false;
let hasLoaded = false;

const activity = computed(() => (status.value?.events ?? []).slice(-60).reverse());
const selectedRecommendationUser = computed(() => recommendationUsers.value.find((user) => user.userId === selectedRecommendationUserId.value) ?? null);
const configurationOutOfSync = computed(() => {
	const service = status.value?.service;
	return Boolean(service && (service.enabled !== configuration.value.enabled || service.requestedProfile !== configuration.value.profile || service.allowDownloads !== configuration.value.allowDownloads || service.recommendationCache?.refreshIntervalMinutes !== configuration.value.cacheRefreshIntervalMinutes));
});
const serviceState = computed(() => {
	if (!status.value?.available) return t("admin.ai.unavailable");
	if (!status.value.service?.enabled) return t("admin.ai.disabled");
	if (status.value.service?.loadingProfile) return t("admin.ai.loadingModel", { profile: status.value.service.loadingProfile });
	if (status.value.service?.activeProfile === "classic") return t("admin.ai.classicActive");
	if (status.value.service?.modelReady) return t("admin.ai.ready");
	return t("admin.ai.fallback");
});

onMounted(() => {
	void refresh();
	void loadRecommendationCaches();
	refreshTimer = setInterval(() => void refresh(), 3000);
});

onBeforeUnmount(() => {
	if (refreshTimer) clearInterval(refreshTimer);
});

async function refresh() {
	if (refreshing) return;
	refreshing = true;
	try {
		const [error, result] = await catchError(getAiAdminStatus());
		if (error) {
			loadError.value = describeRequestError(error, t("admin.ai.loadError"));
			if (!hasLoaded) notify.error(loadError.value);
			return;
		}
		status.value = result;
		configuration.value = result.configuration;
		loadError.value = "";
		hasLoaded = true;
	} finally {
		loading.value = false;
		refreshing = false;
	}
}

async function updateConfiguration(next: AiAdminConfiguration) {
	const previous = configuration.value;
	configuration.value = next;
	saving.value = true;
	try {
		const [error, result] = await catchError(saveAiAdminConfiguration(next));
		if (error) {
			configuration.value = previous;
			notify.error(describeRequestError(error, t("admin.ai.saveError")));
			return;
		}
		configuration.value = result.configuration;
		if (!result.applied) {
			notify.info(t("admin.ai.savedOffline"));
			await refresh();
			return;
		}
		notify.success(t("admin.ai.saved"));
		await refresh();
	} finally {
		saving.value = false;
	}
}

async function setEnabled(enabled: boolean) {
	await updateConfiguration({ ...configuration.value, enabled });
}

async function setProfile(event: Event) {
	const profile = (event.target as HTMLSelectElement).value as AiAdminConfiguration["profile"];
	await updateConfiguration({ ...configuration.value, profile });
}

async function setDownloads(allowDownloads: boolean) {
	await updateConfiguration({ ...configuration.value, allowDownloads });
}

async function setCacheRefreshInterval(event: Event) {
	const interval = Number((event.target as HTMLInputElement).value);
	if (!Number.isInteger(interval) || interval < 1 || interval > 1440) {
		notify.error(t("admin.ai.cacheRefreshIntervalError"));
		return;
	}
	await updateConfiguration({ ...configuration.value, cacheRefreshIntervalMinutes: interval });
}

async function retryModel() {
	retrying.value = true;
	try {
		const [error] = await catchError(retryAiModel());
		if (error) notify.error(describeRequestError(error, t("admin.ai.retryError")));
		else {
			notify.success(t("admin.ai.retryStarted"));
			await refresh();
		}
	} finally {
		retrying.value = false;
	}
}

async function loadRecommendationCaches() {
	loadingRecommendations.value = true;
	try {
		const [error, result] = await catchError(getAiRecommendationCaches());
		if (error) {
			notify.error(describeRequestError(error, t("admin.ai.recommendationsLoadError")));
			return;
		}
		recommendationUsers.value = result;
		if (!result.some((user) => user.userId === selectedRecommendationUserId.value)) {
			selectedRecommendationUserId.value = result[0]?.userId ?? "";
		}
	} finally {
		loadingRecommendations.value = false;
	}
}

async function forceRefreshRecommendations() {
	const user = selectedRecommendationUser.value;
	if (!user) return;
	forcingRefresh.value = true;
	try {
		const [error] = await catchError(forceRefreshAiRecommendations(user.userId));
		if (error) {
			notify.error(describeRequestError(error, t("admin.ai.forceRefreshError")));
			return;
		}
		notify.success(t("admin.ai.forceRefreshSuccess", { user: user.displayName }));
		await loadRecommendationCaches();
	} finally {
		forcingRefresh.value = false;
	}
}

function eventColor(event: AiActivityEvent): string {
	if (event.level === "error" || event.level === "critical") return "text-red-300";
	if (event.level === "warning") return "text-amber-300";
	return "text-flixer-text/80";
}

function formatTime(value: string): string {
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString();
}

function formatMemory(bytes: number | undefined): string {
	return typeof bytes === "number" && Number.isFinite(bytes) ? `${(bytes / 1024 ** 3).toFixed(1)} GB` : "—";
}
</script>

<template>
	<div class="space-y-4">
		<AdminSection :title="t('admin.ai.title')" :description="t('admin.ai.description')">
			<template #actions>
				<button v-if="status?.available && configurationOutOfSync" type="button" :disabled="saving" class="rounded border border-amber-400/30 px-3 py-1.5 text-xs font-semibold text-amber-100 transition hover:bg-amber-400/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent disabled:opacity-50" @click="updateConfiguration(configuration)">{{ t("admin.ai.applySettings") }}</button>
			</template>
			<div v-if="loading && !status" class="grid animate-pulse gap-3">
				<div class="h-14 rounded bg-white/5" />
				<div class="h-14 rounded bg-white/5" />
				<div class="h-14 rounded bg-white/5" />
			</div>
			<div v-else class="space-y-4">
				<p v-if="loadError" role="alert" class="rounded border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{{ loadError }}</p>
				<p v-if="configurationOutOfSync" class="rounded border border-amber-400/20 bg-amber-400/5 p-3 text-sm text-amber-100">{{ t("admin.ai.outOfSync") }}</p>
				<AdminToggle :model-value="configuration.enabled" :label="t('admin.ai.enabled')" :description="t('admin.ai.enabledHint')" :disabled="saving || !status" @update:model-value="setEnabled" />
				<div class="grid gap-4 border-t border-flixer-border/50 pt-4 sm:grid-cols-2">
					<label class="block">
						<span class="text-sm font-medium">{{ t("admin.ai.profile") }}</span>
						<span class="mt-1 block text-xs text-flixer-muted">{{ t("admin.ai.profileHint") }}</span>
						<select :value="configuration.profile" :disabled="saving || !status" class="mt-2 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-flixer-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent disabled:opacity-50" @change="setProfile">
							<option value="auto">{{ t("admin.ai.profiles.auto") }}</option>
							<option value="classic">{{ t("admin.ai.profiles.classic") }}</option>
							<option value="micro">{{ t("admin.ai.profiles.micro") }}</option>
							<option value="mini">{{ t("admin.ai.profiles.mini") }}</option>
						</select>
					</label>
					<div class="flex items-center rounded border border-flixer-border/50 px-3">
						<AdminToggle :model-value="configuration.allowDownloads" :label="t('admin.ai.downloads')" :description="t('admin.ai.downloadsHint')" :disabled="saving || !status" @update:model-value="setDownloads" />
					</div>
					<label class="block">
						<span class="text-sm font-medium">{{ t("admin.ai.cacheRefreshInterval") }}</span>
						<span class="mt-1 block text-xs text-flixer-muted">{{ t("admin.ai.cacheRefreshIntervalHint") }}</span>
						<div class="mt-2 flex items-center gap-2">
							<input :value="configuration.cacheRefreshIntervalMinutes" type="number" min="1" max="1440" step="1" :disabled="saving || !status" class="w-24 rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-flixer-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent disabled:opacity-50" @change="setCacheRefreshInterval" />
							<span class="text-sm text-flixer-muted">{{ t("admin.ai.minutes") }}</span>
						</div>
					</label>
				</div>
			</div>
		</AdminSection>

		<AdminSection :title="t('admin.ai.serviceTitle')" :description="t('admin.ai.serviceDescription')">
			<template #actions>
				<span class="rounded-full border px-2.5 py-1 text-xs font-medium" :class="status?.available ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-amber-400/30 bg-amber-400/10 text-amber-200'">{{ status?.available ? t("admin.ai.connected") : t("admin.ai.disconnected") }}</span>
				<button type="button" :disabled="!status?.available || !configuration.enabled || retrying || saving" class="rounded border border-flixer-border px-3 py-1.5 text-xs font-semibold transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent disabled:cursor-not-allowed disabled:opacity-50" @click="retryModel">{{ retrying ? t("admin.ai.retrying") : t("admin.ai.retry") }}</button>
			</template>
			<div v-if="!status?.available" class="rounded border border-amber-400/20 bg-amber-400/5 p-3 text-sm text-flixer-muted">
				{{ status?.error ?? t("admin.ai.notConnected") }}
			</div>
			<div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				<div class="rounded border border-flixer-border/50 bg-flixer-background/30 p-3">
					<span class="block text-xs text-flixer-muted">{{ t("admin.ai.state") }}</span>
					<span class="mt-1 block text-sm font-medium">{{ serviceState }}</span>
				</div>
				<div class="rounded border border-flixer-border/50 bg-flixer-background/30 p-3">
					<span class="block text-xs text-flixer-muted">{{ t("admin.ai.activeProfile") }}</span>
					<span class="mt-1 block text-sm font-medium">{{ status.service?.activeProfile ?? "—" }}</span>
				</div>
				<div class="rounded border border-flixer-border/50 bg-flixer-background/30 p-3">
					<span class="block text-xs text-flixer-muted">{{ t("admin.ai.downloadState") }}</span>
					<span class="mt-1 block text-sm font-medium">{{ status.service?.downloadState ?? "—" }}</span>
				</div>
				<div class="rounded border border-flixer-border/50 bg-flixer-background/30 p-3">
					<span class="block text-xs text-flixer-muted">{{ t("admin.ai.availableMemory") }}</span>
					<span class="mt-1 block text-sm font-medium">{{ formatMemory(status.service?.availableMemoryBytes) }}</span>
				</div>
				<div class="rounded border border-flixer-border/50 bg-flixer-background/30 p-3">
					<span class="block text-xs text-flixer-muted">{{ t("admin.ai.cachedUsers") }}</span>
					<span class="mt-1 block text-sm font-medium">{{ status.service?.recommendationCache?.entries ?? 0 }}</span>
				</div>
			</div>
			<p v-if="status?.service?.fallbackReason" class="mt-3 rounded border border-amber-400/20 bg-amber-400/5 p-3 text-sm text-amber-100">{{ status.service.fallbackReason }}</p>
		</AdminSection>

		<AdminSection :title="t('admin.ai.userRecommendationsTitle')" :description="t('admin.ai.userRecommendationsDescription')">
			<template #actions>
				<button type="button" :disabled="loadingRecommendations || forcingRefresh" class="rounded border border-flixer-border px-3 py-1.5 text-xs font-semibold transition hover:bg-white/5 disabled:opacity-50" @click="loadRecommendationCaches">{{ t("admin.ai.refreshList") }}</button>
				<button type="button" :disabled="!selectedRecommendationUser || !configuration.enabled || forcingRefresh || loadingRecommendations" class="rounded bg-flixer-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-50" @click="forceRefreshRecommendations">{{ forcingRefresh ? t("admin.ai.forceRefreshing") : t("admin.ai.forceRefresh") }}</button>
			</template>
			<div class="grid gap-4 md:grid-cols-[minmax(12rem,0.7fr)_minmax(0,1.3fr)]">
				<label class="block">
					<span class="text-sm font-medium">{{ t("admin.ai.selectUser") }}</span>
					<select v-model="selectedRecommendationUserId" :disabled="loadingRecommendations || !recommendationUsers.length" class="mt-2 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-flixer-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent disabled:opacity-50">
						<option v-for="user in recommendationUsers" :key="user.userId" :value="user.userId">{{ user.displayName }} (@{{ user.username }})</option>
					</select>
				</label>
				<div v-if="loadingRecommendations && !recommendationUsers.length" class="animate-pulse space-y-2">
					<div class="h-10 rounded bg-white/5" />
					<div class="h-10 rounded bg-white/5" />
				</div>
				<p v-else-if="!selectedRecommendationUser" class="self-end text-sm text-flixer-muted">{{ t("admin.ai.noRecommendationUsers") }}</p>
				<div v-else>
					<p class="mb-3 text-xs text-flixer-muted">
						{{ t("admin.ai.lastRecommendationRefresh") }}:
						<time v-if="selectedRecommendationUser.lastRefreshAt" :datetime="selectedRecommendationUser.lastRefreshAt">{{ formatTime(selectedRecommendationUser.lastRefreshAt) }}</time>
						<span v-else>{{ t("admin.ai.neverRefreshed") }}</span>
					</p>
					<div v-if="!selectedRecommendationUser.entries.length" class="rounded border border-flixer-border/50 bg-flixer-background/30 p-3 text-sm text-flixer-muted">{{ t("admin.ai.noCachedRecommendations") }}</div>
					<div v-else class="max-h-96 space-y-3 overflow-y-auto">
						<section v-for="entry in selectedRecommendationUser.entries" :key="entry.key" class="rounded border border-flixer-border/50 bg-flixer-background/30 p-3">
							<h3 class="mb-2 text-xs font-semibold text-flixer-muted">{{ t("admin.ai.recommendationSet", { key: entry.key.slice(0, 12), count: entry.items.length }) }}</h3>
							<ol class="space-y-2">
								<li v-for="item in entry.items" :key="item.id" class="flex items-start justify-between gap-3 text-sm">
									<span class="min-w-0">
										<span class="font-medium">{{ item.title }}</span>
										<span v-if="item.type" class="ml-2 text-xs capitalize text-flixer-muted">{{ item.type }}</span>
										<span v-if="item.reason" class="mt-0.5 block text-xs text-flixer-muted">{{ item.reason }}</span>
									</span>
									<span class="shrink-0 text-xs tabular-nums text-flixer-muted">{{ Math.round(item.score * 100) }}%</span>
								</li>
							</ol>
						</section>
					</div>
				</div>
			</div>
		</AdminSection>

		<AdminSection :title="t('admin.ai.activityTitle')" :description="t('admin.ai.activityDescription')">
			<div class="max-h-80 overflow-y-auto rounded border border-flixer-border/50 bg-black/20" aria-live="polite" aria-relevant="additions text">
				<p v-if="!activity.length" class="p-4 text-sm text-flixer-muted">{{ t("admin.ai.noActivity") }}</p>
				<ol v-else class="divide-y divide-flixer-border/30">
					<li v-for="event in activity" :key="event.id" class="flex gap-3 px-3 py-2 font-mono text-xs">
						<time class="shrink-0 text-flixer-muted">{{ formatTime(event.timestamp) }}</time>
						<span class="w-16 shrink-0 uppercase text-flixer-muted">{{ event.level }}</span>
						<span class="min-w-0 break-words" :class="eventColor(event)">{{ event.message }}</span>
					</li>
				</ol>
			</div>
		</AdminSection>
	</div>
</template>
