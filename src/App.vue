<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { ModalOverlay, ModalTarget } from "@kolirt/vue-modal";
import NativeMoreMenu from "./components/home/NativeMoreMenu.vue";
import IdleSplash from "./components/ui/IdleSplash.vue";
import OfflineBanner from "./components/ui/OfflineBanner.vue";
import ChatCallOverlay from "./components/chat/ChatCallOverlay.vue";
import MiniPlayer from "./components/player/MiniPlayer.vue";
import AudioEngineDebug from "./components/player/AudioEngineDebug.vue";
import PlayerOverlay from "./components/player/PlayerOverlay.vue";
import Header from "./components/header/Header.vue";
import { getHeaderRoute } from "./components/header/headerRoute";
import { useAudioPlayer, type QueueTrack } from "./composables/useAudioPlayer";
import { useIdleSplash } from "./composables/useIdleSplash";
import { useParty } from "./composables/useParty";
import { getMobileTabs, getNavLinks } from "./composables/homeNav";
import { useSignOut } from "./composables/useSignOut";
import { useVideoOverlay } from "./composables/useVideoOverlay";
import { getAccessToken } from "./api";
import { publishRemotePlayback, registerRemoteCommandHandler, startRemotePlayback, stopRemotePlayback, type RemotePlaybackCommand } from "./composables/useRemotePlayback";
import { useMailSummary } from "./composables/useMailSummary";
import { nativeMoreMenuNativeActive, nativeMusicPlayerNativeActive, nativeNavigationEnabled, setNativeMoreTabs, setNativePlayerOpen } from "./platform/nativeNavigation";
import { isTvMode } from "./platform/tvMode";
import TvNavigationDrawer from "./components/tv/TvNavigationDrawer.vue";
import { notify } from "./composables/notify";
import { i18n } from "./i18n";

const route = useRoute();
const router = useRouter();
const compactScreen = window.matchMedia("(max-width: 1023px)");
const compact = ref(compactScreen.matches);
const updateCompact = () => { compact.value = compactScreen.matches; };
let remoteStateTimer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
	compactScreen.addEventListener("change", updateCompact);
	startRemotePlayback();
	remoteStateTimer = setInterval(publishLocalAudio, 2_000);
});
onBeforeUnmount(() => {
	compactScreen.removeEventListener("change", updateCompact);
	clearInterval(remoteStateTimer);
	stopRemotePlayback();
});
const headerRoute = computed(() => getHeaderRoute(route.name, compact.value));
const headerLinks = computed(() => headerRoute.value.showLinks ? getNavLinks() : []);
const { isSigningOut, signOut } = useSignOut();
const nativeMenuTabs = computed(getMobileTabs);
watch(nativeMenuTabs, setNativeMoreTabs, { immediate: true, deep: true });
useMailSummary();
const audio = useAudioPlayer();
const { lyricsOpen } = audio;
const party = useParty();
const { playing, close: closeVideo, play: playVideo } = useVideoOverlay();
const idle = useIdleSplash(() => playing.value !== null);
watch(() => route.name, (name) => {
	lyricsOpen.value = name === "lyrics";
}, { immediate: true });
watch([isTvMode, headerRoute], () => {
	document.documentElement.classList.toggle("tv-has-rail", isTvMode.value && headerRoute.value.show);
}, { immediate: true });
onBeforeUnmount(() => document.documentElement.classList.remove("tv-has-rail"));
watch(playing, (value) => setNativePlayerOpen(value !== null), { immediate: true });
watch([playing, isTvMode], ([value, tv]) => {
	if (!value || !tv || route.name === "tv-player" || route.name === "live-player") return;
	void router.push({ name: "tv-player", query: { returnTo: route.fullPath } }).then((failure) => {
		if (failure && playing.value === value && router.currentRoute.value.name !== "tv-player") {
			console.error("[tv-player] Could not open player", failure);
			notify.error(i18n.global.t("errors.generic"));
			closeVideo();
		}
	}).catch((error: unknown) => {
		console.error("[tv-player] Could not open player", error);
		notify.error(i18n.global.t("errors.generic"));
		if (playing.value === value) closeVideo();
	});
});
watch(() => route.name, (name, previous) => {
	if (previous === "tv-player" && name !== "tv-player") closeVideo();
});
if (getAccessToken()) void party.resume();

function publishLocalAudio() {
	if (playing.value) return;
	const track = audio.current.value;
	if (!track) {
		publishRemotePlayback(null);
		return;
	}
	publishRemotePlayback({
		kind: "audio",
		title: track.title,
		...(track.artist ? { subtitle: track.artist } : {}),
		itemId: track.id,
		playing: audio.isPlaying.value,
		position: audio.currentTime.value,
		duration: audio.duration.value,
		volume: audio.volume.value,
		muted: audio.volume.value === 0,
	});
}

watch([audio.current, audio.isPlaying, audio.currentTime, audio.duration, playing], publishLocalAudio, { immediate: true });
watch(playing, (value) => {
	if (value) publishRemotePlayback(null);
	else publishLocalAudio();
});
const unregisterRemoteAudio = registerRemoteCommandHandler((command: RemotePlaybackCommand) => {
	if (party.isGuest.value) return false;
	if (command.action === "play-item") {
		if (command.item.kind === "video") {
			audio.stop();
			playVideo({ id: command.item.itemId, title: command.item.title, startAt: command.item.startAt ?? 0, autoplay: true });
		} else {
			closeVideo();
			audio.playQueue(command.item.tracks as QueueTrack[], command.item.startIndex);
		}
		return true;
	}
	if (playing.value || command.action === "audio-track" || command.action === "subtitle" || command.action === "skip") return false;
	return audio.applyRemoteCommand(command);
});
onBeforeUnmount(unregisterRemoteAudio);

if (Capacitor.isNativePlatform()) {
	void CapacitorApp.addListener("appStateChange", ({ isActive }) => {
		if (!isActive) return;
		audio.refreshPlayback();
		party.reconnect();
	}).catch((error: unknown) => {
		console.error("Could not listen for native app state changes", error);
	});
}
</script>

<template>
	<Header v-if="headerRoute.show && !isTvMode" :links="headerLinks" :is-signing-out="isSigningOut"
		:docked="headerRoute.docked" :disable-scroll-collapse="headerRoute.disableScrollCollapse" @logout="signOut" />
	<TvNavigationDrawer v-if="isTvMode && headerRoute.show" :is-signing-out="isSigningOut" @logout="signOut" />
	<!-- Main application view -->
	<RouterView v-slot="{ Component, route }">
		<Transition name="page" mode="out-in">
			<component :is="Component" :key="route.path" />
		</Transition>
	</RouterView>

	<ChatCallOverlay />

	<!-- Player components -->
	<NativeMoreMenu v-if="nativeNavigationEnabled && !nativeMoreMenuNativeActive" />
	<MiniPlayer v-if="!nativeMusicPlayerNativeActive && !(isTvMode && route.name === 'tv-player')" />
	<AudioEngineDebug v-if="!isTvMode" />
	<PlayerOverlay v-if="playing && !isTvMode" :item-id="playing.id" :start-at-seconds="playing.startAt"
		:title="playing.title" :autoplay="playing.autoplay" :live-playback="playing.livePlayback"
		:start-mini="playing.startMini" @close="closeVideo" />

	<!-- Idle splash -->
	<Transition name="idle">
		<IdleSplash v-if="idle.active.value" />
	</Transition>

	<!-- Offline banner -->
	<OfflineBanner />

	<!-- Modal target -->
	<ModalTarget group="default" class="z-50">
		<ModalOverlay class="flixer-modal-overlay" />
	</ModalTarget>
</template>

<style>
html.flixer-tv :focus {
	outline: 3px solid #fff;
	outline-offset: 3px;
}

html.flixer-tv [data-tv-adjusting="true"] {
	outline: 4px solid var(--color-flixer-accent);
	outline-offset: 4px;
}

html.flixer-tv .mobile-tab-bar {
	display: none !important;
}

html.tv-has-rail #app {
	--tv-rail-size: 5rem;
	padding-left: var(--tv-rail-size);
	transition: padding-left 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

html.tv-has-rail.tv-menu-expanded #app {
	--tv-rail-size: min(19rem, 85vw);
}

@media (prefers-reduced-motion: reduce) {
	html.tv-has-rail #app {
		transition: none;
	}
}

html.capacitor main.page-gutter {
	padding-top: max(env(safe-area-inset-top, 0px), 10.5rem);
	padding-bottom: max(env(safe-area-inset-bottom, 0px), 0.5rem);
}

html.flixer-tv main.page-gutter {
	padding-top: 2rem;
}

html.flixer-tv [data-tv-grid]>li>a {
	scroll-margin-top: 2rem;
}

html.capacitor.native-navigation #app {
	min-height: 100dvh;
	padding-top: env(safe-area-inset-top, 0px);
	padding-bottom: var(--cap-native-navigation-bottom, 0px);
	background-color: var(--color-flixer-background);
}

html.capacitor.native-navigation .mobile-tab-bar {
	display: none !important;
}

html.capacitor.native-navigation main.page-gutter {
	padding-top: max(0px, calc(10.5rem - env(safe-area-inset-top, 0px)));
}

.idle-enter-active {
	transition: opacity 1.2s ease-out;
}

.idle-leave-active {
	transition: opacity 0.3s ease-in;
}

.idle-enter-from,
.idle-leave-to {
	opacity: 0;
}

@media (prefers-reduced-motion: reduce) {

	.idle-enter-active,
	.idle-leave-active {
		transition: none;
	}
}

/* Opacity only: a transform or filter here would break the fixed header while pages swap. */
.page-enter-active {
	transition: opacity 0.28s ease-out;
}

.page-leave-active {
	transition: opacity 0.14s ease-in;
}

.page-enter-from,
.page-leave-to {
	opacity: 0;
}

@media (prefers-reduced-motion: reduce) {

	.page-enter-active,
	.page-leave-active {
		transition: none;
	}
}
</style>
