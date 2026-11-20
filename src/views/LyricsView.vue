<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink, useRouter } from "vue-router";
import { App as CapacitorApp } from "@capacitor/app";
import type { PluginListenerHandle } from "@capacitor/core";
import AuthImage from "../components/ui/AuthImage.vue";
import Skeleton from "../components/ui/Skeleton.vue";
import { formatTime } from "../components/player/formatTime";
import AudioBitrateSelect from "../components/player/AudioBitrateSelect.vue";
import SyncedLyrics from "../components/player/SyncedLyrics.vue";
import { getPreferences } from "../api";
import { emulateWordTimings } from "../composables/lrc";
import { catchError } from "../utils/catchError";
import { useAudioPlayer } from "../composables/useAudioPlayer";
import { isNativeTv, isTvMode } from "../platform/tvMode";

const { t } = useI18n();
const router = useRouter();
const player = useAudioPlayer();
const { current, isPlaying, isLoading, currentTime, duration, lyrics, lyricsLoading } = player;
const emulateLyricWordTiming = ref(true);
const displayLyrics = computed(() => lyrics.value && emulateLyricWordTiming.value ? emulateWordTimings(lyrics.value, duration.value) : lyrics.value);

const progress = computed(() => (duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0));
const noLyrics = computed(() => !lyricsLoading.value && (!lyrics.value || lyrics.value.lines.length === 0));
let backListener: PluginListenerHandle | undefined;
let disposed = false;

function close() {
	if (window.history.state.back) router.back();
	else void router.replace({ name: "home" });
}

function onKeydown(event: KeyboardEvent) {
	if (event.key === "Escape") close();
}

function onSeek(event: Event) {
	player.seek((Number((event.target as HTMLInputElement).value) / 100) * duration.value);
}

watch(
	current,
	(track) => {
		if (!track) close();
	},
	{ immediate: true },
);

onMounted(() => {
	void catchError(getPreferences()).then(([error, preferences]) => {
		if (error) console.error("[lyrics] preferences load failed", error);
		else emulateLyricWordTiming.value = preferences.emulateLyricWordTiming ?? true;
	});
	window.addEventListener("keydown", onKeydown);
	if (isNativeTv) void CapacitorApp.addListener("backButton", close).then((listener) => {
		if (disposed) void listener.remove();
		else backListener = listener;
	});
});
onBeforeUnmount(() => {
	disposed = true;
	void backListener?.remove();
	window.removeEventListener("keydown", onKeydown);
});
</script>

<template>
	<div v-if="current"
		class="tv-lyrics theme-dark relative z-50 flex h-[100dvh] flex-col overflow-hidden bg-flixer-background pt-[env(safe-area-inset-top)] text-flixer-text">
		<div v-if="current.art"
			class="lyrics-art-background pointer-events-none absolute inset-0 scale-125 opacity-30 blur-3xl"
			aria-hidden="true">
			<AuthImage scope="library" :item-id="current.art.itemId" :index="current.art.index"
				:version="current.art.version" :width="128" alt="" />
		</div>
		<div
			class="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-flixer-background/60 to-flixer-background">
		</div>

		<header v-if="!isTvMode" class="relative shrink-0 flex items-center justify-between p-4 md:px-8">
			<button type="button"
				class="inline-flex items-center gap-2 rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent"
				@click="close">
				<Icon icon="lucide:chevron-down" class="size-4" aria-hidden="true" />
				{{ t("music.closeLyrics") }}
			</button>
			<AudioBitrateSelect />
		</header>

		<main v-if="noLyrics" class="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-[8vh]">
			<div class="w-[min(72vw,38vh)] text-center">
				<div
					class="aspect-square w-full overflow-hidden rounded border border-white/10 bg-flixer-surface shadow-2xl shadow-black/60">
					<AuthImage v-if="current.art" scope="library" :item-id="current.art.itemId"
						:index="current.art.index" :version="current.art.version" :width="512"
						:alt="current.album ?? current.title" />
				</div>
				<h1 class="mt-3 break-words text-xl font-bold text-white md:text-3xl">{{ current.title }}</h1>
				<RouterLink v-if="current.artist && current.artistId"
					:to="{ name: 'person', params: { id: current.artistId } }"
					class="mt-1 block truncate text-sm text-flixer-text/90 hover:underline md:text-base">{{
						current.artist }}</RouterLink>
				<p v-else-if="current.artist" class="mt-1 truncate text-sm text-flixer-text/90 md:text-base">{{
					current.artist }}</p>
				<p v-if="current.album" class="truncate text-xs text-flixer-muted md:text-sm">{{ current.album }}</p>
			</div>
		</main>

		<main v-else
			class="relative flex min-h-0 flex-1 flex-col gap-6 px-4 md:flex-row md:items-start md:gap-12 md:pt-[12vh] md:px-12 lg:px-24">
			<div class="flex shrink-0 items-center gap-4 md:w-72 md:flex-col md:items-start lg:w-96">
				<div
					class="aspect-square w-20 shrink-0 overflow-hidden rounded border border-white/10 bg-flixer-surface shadow-2xl shadow-black/60 md:w-[min(100%,38vh)]">
					<AuthImage v-if="current.art" scope="library" :item-id="current.art.itemId"
						:index="current.art.index" :version="current.art.version" :width="512"
						:alt="current.album ?? current.title" />
				</div>
				<div class="min-w-0">
					<h1 class="break-words text-xl font-bold text-white md:text-3xl">{{ current.title }}</h1>
					<RouterLink v-if="current.artist && current.artistId"
						:to="{ name: 'person', params: { id: current.artistId } }"
						class="mt-1 block truncate text-sm text-flixer-text/90 hover:underline md:text-base">{{
							current.artist }}</RouterLink>
					<p v-if="current.album" class="truncate text-xs text-flixer-muted md:text-sm">{{ current.album }}
					</p>
				</div>
			</div>

			<section
				class="relative min-h-0 min-w-0 flex-1 self-stretch overflow-hidden"
				:aria-label="t('music.lyrics')">
				<div v-if="lyricsLoading" class="w-full max-w-md space-y-4" role="status"
					:aria-label="t('music.loadingLyrics')">
					<Skeleton v-for="width in ['w-3/4', 'w-full', 'w-2/3', 'w-5/6', 'w-1/2']" :key="width" class="h-6"
						:class="width" />
				</div>
				<SyncedLyrics v-else-if="displayLyrics?.synced" :key="current.id" :lyrics="displayLyrics"
					:current-time="currentTime" :duration="duration" :paused="!isPlaying || isLoading" @seek="player.seek" />
				<div v-else-if="lyrics" class="h-full overflow-y-auto pb-8">
					<p class="mb-4 text-sm text-flixer-muted">{{ t("music.plainLyrics") }}</p>
					<ul class="space-y-3 md:space-y-5">
						<li v-for="(line, index) in lyrics.lines" :key="index"
							class="text-2xl font-bold leading-snug text-white/80 md:text-4xl">{{ line.text }}</li>
					</ul>
				</div>
			</section>
		</main>

		<footer class="relative shrink-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-12 lg:px-24">
			<p v-if="lyrics?.attribution" class="mb-3 text-center text-xs text-flixer-muted">
				<a :href="lyrics.attribution.sourceUrl" target="_blank" rel="noopener noreferrer" class="hover:text-white hover:underline">{{ t('music.lyricsFromUnison') }}</a>
				<span aria-hidden="true"> / </span>
				<a :href="lyrics.attribution.submitterUrl" target="_blank" rel="noopener noreferrer" class="hover:text-white hover:underline">{{ t('music.lyricsSubmittedBy', { name: lyrics.attribution.submitterName }) }}</a>
			</p>
			<div class="mx-auto flex max-w-3xl items-center gap-3 text-xs text-flixer-muted">
				<span class="w-10 text-right tabular-nums">{{ formatTime(currentTime) }}</span>
				<input type="range" min="0" max="100" step="0.1" class="h-1 flex-1 cursor-pointer accent-flixer-accent"
					:aria-label="t('music.seek')" :value="progress" @input="onSeek" />
				<span class="w-10 tabular-nums">{{ formatTime(duration) }}</span>
			</div>
			<div class="mt-2 flex items-center justify-center gap-4">
				<button type="button"
					class="grid size-11 place-items-center rounded text-white transition hover:bg-white/10"
					:aria-label="t('music.previous')" @click="player.previous()">
					<Icon icon="lucide:skip-back" class="size-6" aria-hidden="true" />
				</button>
				<button type="button"
					class="grid size-14 place-items-center rounded bg-white text-flixer-background transition hover:bg-white/85"
					:aria-label="isPlaying ? t('music.pause') : t('music.play')" @click="player.toggle()">
					<span v-if="isLoading"
						class="size-5 animate-spin rounded-full border-2 border-flixer-background/30 border-t-flixer-background"
						aria-hidden="true"></span>
					<Icon v-else-if="isPlaying" icon="lucide:pause" class="size-7" aria-hidden="true" />
					<Icon v-else icon="lucide:play" class="size-7" aria-hidden="true" />
				</button>
				<button type="button"
					class="grid size-11 place-items-center rounded text-white transition hover:bg-white/10 disabled:opacity-40"
					:disabled="!player.hasNext.value" :aria-label="t('music.next')" @click="player.next()">
					<Icon icon="lucide:skip-forward" class="size-6" aria-hidden="true" />
				</button>
			</div>
		</footer>
	</div>
</template>

<style>
html.flixer-tv .lyrics-art-background {
	display: none;
}
</style>
