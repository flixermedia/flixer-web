import { Capacitor } from "@capacitor/core";
import { NativeNavigation } from "@capgo/capacitor-native-navigation";
import type { NativeNavigationMusicPlayerOptions } from "@capgo/capacitor-native-navigation";
import { ref, watch } from "vue";
import type { Router } from "vue-router";
import { isActivePath } from "../composables/homeNav";
import { useAudioPlayer } from "../composables/useAudioPlayer";
import { i18n } from "../i18n";
import type { NavTab } from "../types/media";

export const nativeNavigationEnabled = ref(false);
export const nativeMoreMenuOpen = ref(false);
export const nativeMoreMenuNativeActive = ref(Capacitor.getPlatform() === "ios");
export const nativeMusicPlayerNativeActive = ref(false);
export const nativeMoreTabs = ref<NavTab[]>([]);

let playerOpen = false;
let lyricsOverlayOpen = false;
let router: Router | null = null;
let renderQueue = Promise.resolve();
let nativeMenuIsPresented = false;
const primaryTabPaths = new Set(["/", "/discover", "/search"]);
const nativeMoreSymbols: Record<string, string> = {
	"lucide:film": "film",
	"lucide:tv": "tv",
	"lucide:music-2": "music.note",
	"lucide:messages-square": "bubble.left.and.bubble.right",
	"lucide:calendar-days": "calendar",
};

const icon = (svg: string, sfSymbol: string) => ({
	svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svg}</svg>`,
	width: 24,
	height: 24,
	ios: { sfSymbol },
});

const navigationTabs = () => [
	{ id: "home", title: i18n.global.t("home.nav.home"), icon: icon('<path d="m3 10 9-7 9 7"/><path d="M5 9v12h14V9"/><path d="M9 21v-7h6v7"/>', "house") },
	{ id: "more", title: i18n.global.t("home.nav.more"), icon: icon('<path d="M4 6h16M4 12h16M4 18h16"/>', "line.3.horizontal") },
	{ id: "discover", title: i18n.global.t("requests.nav.discover"), icon: icon('<path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/><path d="m19 14 1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14Z"/>', "sparkles") },
	{ id: "search", title: i18n.global.t("home.nav.search"), icon: icon('<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>', "magnifyingglass") },
];

function selectedTab(path: string): string {
	if (path === "/") return "home";
	if (path === "/discover" || path.startsWith("/discover/")) return "discover";
	if (path === "/search" || path.startsWith("/search/")) return "search";
	return "more";
}

export function closeNativeMoreMenu(): void {
	const shouldHideNativeMenu = nativeMenuIsPresented;
	nativeMenuIsPresented = false;
	nativeMoreMenuOpen.value = false;
	if (shouldHideNativeMenu) {
		void NativeNavigation.setMoreMenu({ open: false }).catch((error: unknown) => {
			console.error("[native-navigation] Could not close the native More menu", error);
		});
	}
}

export async function setNativeMusicPlayer(options: NativeNavigationMusicPlayerOptions): Promise<void> {
	try {
		const result = await NativeNavigation.setMusicPlayer({
			...options,
			labels: {
				open: i18n.global.t("music.lyrics"),
				previous: i18n.global.t("music.previous"),
				play: i18n.global.t("music.play"),
				pause: i18n.global.t("music.pause"),
				next: i18n.global.t("music.next"),
			},
		});
		nativeMusicPlayerNativeActive.value = result.native;
		if (result.native) {
			document.documentElement.classList.toggle("has-mini-player", options.visible);
		}
	} catch (error) {
		nativeMusicPlayerNativeActive.value = false;
		console.error("[native-navigation] Could not update the native music player", error);
	}
}

function nativeMoreMenuOptions(open: boolean) {
	const currentPath = router?.currentRoute.value.path;
	const activeMoreTab = currentPath ? nativeMoreTabs.value.find((tab) => isActivePath(currentPath, tab.to)) : undefined;
	return {
		open,
		items: nativeMoreTabs.value.map((tab) => {
			const icon = tab.icon.startsWith("M")
				? {
						svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${tab.icon}"/></svg>`,
						width: 24,
						height: 24,
					}
				: { ios: { sfSymbol: nativeMoreSymbols[tab.icon] ?? "square.grid.2x2" }, width: 24, height: 24 };
			return { id: tab.to, title: tab.label, icon };
		}),
		selectedId: activeMoreTab?.to,
		closeLabel: i18n.global.t("common.close"),
	};
}

async function openNativeMoreMenu(): Promise<void> {
	if (nativeMoreMenuNativeActive.value) {
		try {
			const result = await NativeNavigation.setMoreMenu(nativeMoreMenuOptions(true));
			if (result.native) {
				nativeMenuIsPresented = true;
				nativeMoreMenuOpen.value = true;
				if (Capacitor.getPlatform() === "ios" && !result.liquidGlass) {
					console.warn("[native-navigation] The More tray is using the material fallback; Liquid Glass requires iOS 26+, a compatible Xcode SDK, and Reduce Transparency disabled.");
				}
				return;
			}
			nativeMoreMenuNativeActive.value = false;
		} catch (error) {
			console.error("[native-navigation] Could not present the native More menu", error);
			nativeMoreMenuNativeActive.value = false;
		}
	}
	nativeMoreMenuOpen.value = true;
}

function renderNativeChrome(): Promise<void> {
	renderQueue = renderQueue
		.then(async () => {
			if (!router) return;

			const currentRoute = router.currentRoute.value;
			const authenticated = currentRoute.matched.some((record) => record.meta.requiresAuth);
			const hidden = !authenticated || playerOpen || lyricsOverlayOpen;

			await NativeNavigation.setNavbar({ hidden: true });

			await NativeNavigation.setTabbar({
				selectedId: selectedTab(currentRoute.path),
				labelVisibilityMode: "labeled",
				icons: true,
				tabs: navigationTabs(),
				style: { shape: "floating", horizontalMargin: 16, bottomGap: 6, maxWidth: 480, placement: "bottom" },
				glass: { effect: "liquidGlass", surfaceAlpha: 0.68 },
				colors: {
					tint: "#A789FF",
					inactiveTint: "#9492A4",
					foreground: "#F4F2FB",
					background: "#CC14131D",
					indicator: "#337645D7",
					ripple: "#337645D7",
				},
				hidden,
				animated: true,
			});

			nativeNavigationEnabled.value = true;
			document.documentElement.classList.add("native-navigation");
		})
		.catch((error: unknown) => {
			console.error("[native-navigation] Could not update native navigation chrome", error);
		});
	return renderQueue;
}

export async function initializeNativeNavigation(appRouter: Router): Promise<void> {
	if (!Capacitor.isNativePlatform()) return;

	router = appRouter;
	const audio = useAudioPlayer();
	const syncMusicPlayer = () => {
		const current = audio.current.value;
		void setNativeMusicPlayer({
			visible: current !== null && !audio.lyricsOpen.value && !(nativeMoreMenuOpen.value && !nativeMoreMenuNativeActive.value),
			title: current?.title ?? "",
			artist: current?.artist ?? current?.album ?? "",
			artworkUrl: audio.nativeNavigationArtworkUri.value ?? undefined,
			isPlaying: audio.isPlaying.value,
			isLoading: audio.isLoading.value,
			hasPrevious: current !== null,
			hasNext: audio.hasNext.value,
		});
	};
	await NativeNavigation.configure({
		enabled: true,
		contentInsetMode: "css",
		animationDuration: 240,
		verticalBarBehavior: "disabled",
		colors: {
			tint: "#A789FF",
			inactiveTint: "#9492A4",
			foreground: "#F4F2FB",
			background: "#CC14131D",
		},
		glass: { effect: "liquidGlass", surfaceAlpha: 0.68 },
	});

	await NativeNavigation.addListener("tabSelect", ({ id }) => {
		if (!router) return;
		if (id === "more") {
			if (nativeMoreTabs.value.length > 0) {
				if (nativeMoreMenuOpen.value) closeNativeMoreMenu();
				else void openNativeMoreMenu();
			}
			return;
		}

		closeNativeMoreMenu();
		const destinations: Record<string, string> = {
			home: "/",
			discover: "/discover",
			search: "/search",
		};
		const destination = destinations[id];
		if (destination) void router.push(destination);
	});
	await NativeNavigation.addListener("moreMenuSelect", ({ id }) => {
		nativeMenuIsPresented = false;
		nativeMoreMenuOpen.value = false;
		if (router && id) void router.push(id);
	});
	await NativeNavigation.addListener("moreMenuDismiss", () => {
		nativeMenuIsPresented = false;
		nativeMoreMenuOpen.value = false;
	});
	await NativeNavigation.addListener("musicPlayerAction", ({ action }) => {
		if (action === "previous") audio.previous();
		else if (action === "playPause") audio.toggle();
		else if (action === "next") audio.next();
		else if (action === "open") audio.lyricsOpen.value = true;
	});
	watch(() => [audio.current.value, audio.isPlaying.value, audio.isLoading.value, audio.nativeNavigationArtworkUri.value, audio.hasNext.value, audio.lyricsOpen.value, nativeMoreMenuOpen.value, nativeMoreMenuNativeActive.value], syncMusicPlayer, { immediate: true });
	watch(
		audio.lyricsOpen,
		(open) => {
			lyricsOverlayOpen = open;
			void renderNativeChrome();
		},
		{ immediate: true },
	);
	appRouter.afterEach(() => {
		closeNativeMoreMenu();
		void renderNativeChrome();
	});
	watch(i18n.global.locale, () => {
		void renderNativeChrome();
		syncMusicPlayer();
	});

	await renderNativeChrome();
}

export function setNativeMoreTabs(tabs: NavTab[]): void {
	nativeMoreTabs.value = tabs.filter((tab) => !primaryTabPaths.has(tab.to));
	if (nativeMoreTabs.value.length === 0) {
		closeNativeMoreMenu();
		return;
	}
	if (nativeMenuIsPresented) {
		void NativeNavigation.setMoreMenu(nativeMoreMenuOptions(true))
			.then(({ native }) => {
				if (!native) {
					nativeMenuIsPresented = false;
					nativeMoreMenuNativeActive.value = false;
				}
			})
			.catch((error: unknown) => {
				console.error("[native-navigation] Could not update the native More menu", error);
				nativeMenuIsPresented = false;
				nativeMoreMenuNativeActive.value = false;
			});
	}
}

export function setNativePlayerOpen(open: boolean): void {
	playerOpen = open;
	if (open) closeNativeMoreMenu();
	void renderNativeChrome();
}
