import { Capacitor } from "@capacitor/core";
import { ActionSheet } from "@capacitor/action-sheet";
import { NativeNavigation } from "@capgo/capacitor-native-navigation";
import { ref, watch } from "vue";
import type { Router } from "vue-router";
import { i18n } from "../i18n";
import type { NavTab } from "../types/media";

export const nativeNavigationEnabled = ref(false);

let playerOpen = false;
let router: Router | null = null;
let renderQueue = Promise.resolve();
let moreTabs: NavTab[] = [];
let moreActionSheetOpen = false;

const primaryTabPaths = new Set(["/", "/discover", "/search"]);

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

async function showNativeMoreActions(): Promise<void> {
	if (!router || moreActionSheetOpen) return;
	const options = moreTabs.filter((tab) => !primaryTabPaths.has(tab.to));
	if (options.length === 0) return;

	moreActionSheetOpen = true;
	try {
		const { index } = await ActionSheet.showActions({
			title: i18n.global.t("home.nav.more"),
			options: options.map((tab) => ({ title: tab.label })),
			cancelable: true,
		});
		const destination = options[index]?.to;
		if (destination) {
			await router.push(destination);
		}
	} catch (error) {
		console.error("[native-navigation] Could not present the More action sheet", error);
	} finally {
		moreActionSheetOpen = false;
	}
}

function renderNativeChrome(): Promise<void> {
	renderQueue = renderQueue
		.then(async () => {
			if (!router) return;

			const currentRoute = router.currentRoute.value;
			const authenticated = currentRoute.matched.some((record) => record.meta.requiresAuth);
			const hidden = !authenticated || playerOpen;

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
			void showNativeMoreActions();
			return;
		}

		const destinations: Record<string, string> = {
			home: "/",
			discover: "/discover",
			search: "/search",
		};
		const destination = destinations[id];
		if (destination) void router.push(destination);
	});
	appRouter.afterEach(() => void renderNativeChrome());
	watch(i18n.global.locale, () => void renderNativeChrome());

	await renderNativeChrome();
}

export function setNativeMoreTabs(tabs: NavTab[]): void {
	moreTabs = [...tabs];
}

export function setNativePlayerOpen(open: boolean): void {
	playerOpen = open;
	void renderNativeChrome();
}
