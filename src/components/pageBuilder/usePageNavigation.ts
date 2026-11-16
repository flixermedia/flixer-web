import { ref } from "vue";
import { AUTH_TOKEN_CHANGED_EVENT, getAccessToken } from "../../api/client";
import { getPageNavigation, type PageNavigationItem } from "./pageBuilder";

const pages = ref<PageNavigationItem[]>([]);
let loaded = false;
let pending: Promise<void> | null = null;
let generation = 0;
export function refreshPageNavigation(): Promise<void> {
	loaded = false;
	generation++;
	pending = null;
	return loadPageNavigation();
}
function loadPageNavigation(): Promise<void> {
	if (loaded) return Promise.resolve();
	if (typeof window === "undefined") return Promise.resolve();
	if (!getAccessToken()) {
		pages.value = [];
		return Promise.resolve();
	}
	if (!pending) {
		const request = generation;
		pending = getPageNavigation()
			.then((result) => {
				if (request === generation) {
					pages.value = result;
					loaded = true;
				}
			})
			.catch(() => {
				if (request === generation) pages.value = [];
			})
			.finally(() => {
				if (request === generation) pending = null;
			});
	}
	return pending;
}
if (typeof window !== "undefined")
	window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, () => {
		pages.value = [];
		void refreshPageNavigation();
	});
export function usePageNavigation() {
	return { pages, load: loadPageNavigation };
}
