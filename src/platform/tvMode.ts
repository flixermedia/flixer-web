import { Capacitor } from "@capacitor/core";
import { ref } from "vue";

const STORAGE_KEY = "flixer.tvMode";
export const isNativeTv = Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("FlixerTv");

function savedTvMode(): boolean {
	try {
		return window.location.pathname === "/tv" || sessionStorage.getItem(STORAGE_KEY) === "1";
	} catch {
		return false;
	}
}

export const isTvMode = ref(isNativeTv || (typeof window !== "undefined" && savedTvMode()));

export function setTvMode(enabled: boolean): void {
	isTvMode.value = isNativeTv || enabled;
	if (typeof document !== "undefined") document.documentElement.classList.toggle("flixer-tv", isTvMode.value);
	if (!isNativeTv && typeof window !== "undefined") {
		try {
			if (enabled) sessionStorage.setItem(STORAGE_KEY, "1");
			else sessionStorage.removeItem(STORAGE_KEY);
		} catch {
			return;
		}
	}
}
