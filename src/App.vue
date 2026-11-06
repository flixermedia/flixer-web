<script setup lang="ts">
import { computed, watch } from "vue";
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
import LyricsView from "./views/LyricsView.vue";
import { useAudioPlayer } from "./composables/useAudioPlayer";
import { useIdleSplash } from "./composables/useIdleSplash";
import { useParty } from "./composables/useParty";
import { getMobileTabs } from "./composables/homeNav";
import { useVideoOverlay } from "./composables/useVideoOverlay";
import { getAccessToken } from "./api";
import { useMailSummary } from "./composables/useMailSummary";
import { nativeMoreMenuNativeActive, nativeMusicPlayerNativeActive, nativeNavigationEnabled, setNativeMoreTabs, setNativePlayerOpen } from "./platform/nativeNavigation";

const nativeMenuTabs = computed(getMobileTabs);
watch(nativeMenuTabs, setNativeMoreTabs, { immediate: true, deep: true });
useMailSummary();
const audio = useAudioPlayer();
const { lyricsOpen } = audio;
const party = useParty();
const { playing, close: closeVideo } = useVideoOverlay();
const idle = useIdleSplash(() => playing.value !== null);
watch(playing, (value) => setNativePlayerOpen(value !== null), { immediate: true });
if (getAccessToken()) void party.resume();

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
	<!-- Main application view -->
	<RouterView v-slot="{ Component, route }">
		<Transition name="page" mode="out-in">
			<component :is="Component" :key="route.path" />
		</Transition>
	</RouterView>

	<ChatCallOverlay />

	<!-- Player components -->
	<NativeMoreMenu v-if="nativeNavigationEnabled && !nativeMoreMenuNativeActive" />
	<MiniPlayer v-if="!nativeMusicPlayerNativeActive" />
	<AudioEngineDebug />
	<PlayerOverlay v-if="playing" :item-id="playing.id" :start-at-seconds="playing.startAt" :title="playing.title" :autoplay="playing.autoplay" :live-playback="playing.livePlayback" :start-mini="playing.startMini" @close="closeVideo" />

	<!-- Lyrics view -->
	<Transition name="lyrics">
		<LyricsView v-if="lyricsOpen" />
	</Transition>

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
html.capacitor main.page-gutter {
	padding-top: max(env(safe-area-inset-top, 0px), 10.5rem);
	padding-bottom: max(env(safe-area-inset-bottom, 0px), 0.5rem);
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

.lyrics-enter-active {
	transition:
		transform 0.4s cubic-bezier(0.22, 1, 0.36, 1),
		opacity 0.3s ease-out;
}
.lyrics-leave-active {
	transition:
		transform 0.25s ease-in,
		opacity 0.2s ease-in;
}
.lyrics-enter-from,
.lyrics-leave-to {
	transform: translateY(5%);
	opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
	.lyrics-enter-active,
	.lyrics-leave-active {
		transition: opacity 0.15s linear;
	}
	.lyrics-enter-from,
	.lyrics-leave-to {
		transform: none;
	}
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
