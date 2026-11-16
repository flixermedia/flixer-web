import { createModal, type DefineGroups } from "@kolirt/vue-modal";
import { App as CapacitorApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";
import { SplashScreen } from "@capacitor/splash-screen";
import { createApp } from "vue";
import { registerSW } from "virtual:pwa-register";
import Vue3Toastify from "vue3-toastify";
import { AUTH_INVALID_EVENT } from "./api";
import { toastContainerOptions } from "./composables/notify";
import { initAppearance } from "./composables/useAppearance";
import { initTheme } from "./composables/useTheme";
import { initButtonHaptics } from "./platform/haptics";
import { initNativeTextInteraction } from "./platform/textInteraction.ts";
import { NATIVE_PASSKEY_CALLBACK_SCHEME } from "./platform/passkeyHandoff";
import { initializeNativeNavigation } from "./platform/nativeNavigation";
import { initializeTvNavigation } from "./platform/tvNavigation";
import { isNativeTv, isTvMode, setTvMode } from "./platform/tvMode";
import { initializeTvViewport, initializeTvZoomControls } from "./platform/tvViewport";
import { isTvFrame } from "./platform/tvFrame";
import { i18n, initLocale, syncLocaleFromAccount } from "./i18n";
import { initMonitoring } from "./monitoring";
import { initBrowserLogging } from "./browserLogging";
import router from "./router/index.ts";
import { oauthInteractionPath, signInForRoute } from "./router/oauthSignIn";
import { getNativeServerUrl } from "./platform/serverConnection";
import { restoreNativeAccount } from "./platform/nativeAccount";
import { catchError } from "./utils/catchError";
import { initializeIconButtonTooltips } from "./utils/iconButtonTooltips";
import { prefetchSetupGate } from "./setup/setupGate";
import "./tailwind.css";
import "./toast.css";
import "./modal.css";
import App from "./App.vue";
import AppIcon from "./components/ui/AppIcon.vue";

//
declare module "@kolirt/vue-modal" {
	interface ModalGroupRegistry extends DefineGroups<["default"]> {}
}

if (!Capacitor.isNativePlatform() || getNativeServerUrl()) prefetchSetupGate();

const app = createApp(App);

initBrowserLogging(app);
void initMonitoring(app);

app.component("Icon", AppIcon);
initializeIconButtonTooltips();
let lastPasskeyCallbackUrl = "";
document.documentElement.classList.toggle("capacitor", Capacitor.isNativePlatform());
if (isNativeTv && !isTvFrame()) initializeTvViewport();
setTvMode(isTvMode.value);
initializeTvZoomControls();
initializeTvNavigation();
if (isTvFrame()) {
	const updateTitle = () => { window.parent.document.title = document.title; };
	const title = document.querySelector("title");
	if (title) new MutationObserver(updateTitle).observe(title, { childList: true, subtree: true, characterData: true });
	updateTitle();
}
if (Capacitor.getPlatform() === "ios") {
	void catchError(Keyboard.setAccessoryBarVisible({ isVisible: false })).then(([keyboardAccessoryError]) => {
		if (keyboardAccessoryError) console.error("[keyboard] Could not hide the iOS form accessory bar", keyboardAccessoryError);
	});
}

initButtonHaptics();
void catchError(initNativeTextInteraction()).then(([error]) => {
	if (error) console.error("[text-interaction] Could not initialise native text interaction", error);
});
initTheme();
initAppearance();

window.addEventListener(AUTH_INVALID_EVENT, () => {
	const current = router.currentRoute.value;
	const path = window.location.pathname;
	if (current.name === "login" || (current.name === "register" && oauthInteractionPath(current.query.redirect)) || current.name === "oauth-sign-in" || current.name === "oauth-error" || path === "/oauth/sign-in" || path === "/oauth/error") return;
	if (current.name === "oauth-interaction" || /^\/oauth\/interaction\/[\w-]{1,128}$/.test(path)) {
		void router.replace(signInForRoute("oauth-interaction", current.name === "oauth-interaction" ? current.fullPath : path));
	} else {
		void router.replace({ name: "login" });
	}
});

app.use(i18n);
router.afterEach((to, _from, failure) => {
	if (failure) return;
	if (isTvFrame()) {
		if (!isTvMode.value && !isNativeTv) window.parent.location.assign(to.fullPath);
		else window.parent.history.replaceState(window.parent.history.state, "", to.fullPath);
	} else if (isTvMode.value) {
		window.location.reload();
	}
});
app.use(router);
app.use(Vue3Toastify, toastContainerOptions);
app.use(createModal({ groups: { default: {} } }));

async function handleAppUrl(url: string) {
	let callback: URL;
	try {
		callback = new URL(url);
	} catch {
		return;
	}
	if (callback.protocol !== `${NATIVE_PASSKEY_CALLBACK_SCHEME}:` || callback.hostname !== "passkey" || callback.pathname !== "/callback") return;
	if (url === lastPasskeyCallbackUrl) return;
	lastPasskeyCallbackUrl = url;

	const [closeError] = await catchError(Browser.close());
	if (closeError) {
		console.warn("[passkey] browser close failed after callback", closeError);
	}

	await router.isReady();
	await router.replace({
		name: "passkey-callback",
		query: {
			code: callback.searchParams.get("code") ?? undefined,
			state: callback.searchParams.get("state") ?? undefined,
			cancelled: callback.searchParams.get("cancelled") ?? undefined,
		},
	});
}

let launchUrl: string | undefined;

if (Capacitor.isNativePlatform()) {
	await CapacitorApp.addListener("appUrlOpen", ({ url }) => void handleAppUrl(url));
	launchUrl = (await CapacitorApp.getLaunchUrl())?.url;
}

await initLocale();

if (Capacitor.isNativePlatform()) {
	const [restoreError] = await catchError(restoreNativeAccount());
	if (restoreError) {
		console.warn("[native-account] Could not restore the saved account", restoreError);
	}
}

app.mount("#app");

if (Capacitor.isNativePlatform()) {
	await router.isReady();
	try {
		await initializeNativeNavigation(router);
	} catch (error) {
		console.error("[native-navigation] Could not initialize native navigation", error);
	}
	if (launchUrl) await handleAppUrl(launchUrl);
	await SplashScreen.hide();
}

void syncLocaleFromAccount();

if (!Capacitor.isNativePlatform()) void registerSW({ immediate: true });
