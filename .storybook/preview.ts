import { addCollection, Icon } from "@iconify/vue";
import lucideIcons from "@iconify-json/lucide/icons.json";
import type { Preview } from "@storybook/vue3-vite";
import { setup } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { MINIMAL_VIEWPORTS } from "storybook/viewport";
import { getNotificationConfig, getPaymentStatus, listNotifications } from "../src/api";
import { createModal, ModalOverlay, ModalTarget } from "@kolirt/vue-modal";
import Vue3Toastify from "vue3-toastify";
import { toastContainerOptions } from "../src/composables/notify";
import { createI18n } from "vue-i18n";
import { createMemoryHistory, createRouter } from "vue-router";
import en from "../src/locales/en.json";
import "../src/tailwind.css";
import "../src/toast.css";
import "../src/modal.css";

addCollection(lucideIcons);

// A self-contained i18n/router so stories never touch the app's API-bound singletons.
const i18n = createI18n({ legacy: false, locale: "en", fallbackLocale: "en", messages: { en } });
// Mirrors the app's named routes (src/router/index.ts) so components can resolve links with `{ name, params }`.
const namedRoutes: [string, string][] = [
	["connect", "/connect"],
	["setup", "/setup"],
	["unavailable", "/unavailable"],
	["login", "/login"],
	["passkey-callback", "/passkey/callback"],
	["passkey-handoff", "/passkey/handoff/:handoffId"],
	["register", "/register"],
	["verify-email", "/verify-email"],
	["home", "/"],
	["discover", "/discover"],
	["requests", "/requests"],
	["request-item", "/request/:type/:id"],
	["plugin-page", "/plugins/:pluginId/:pageId"],
	["profile", "/u/:username"],
	["friend-invite", "/friend-invite/:token"],
	["people", "/people"],
	["inbox", "/inbox"],
	["notifications", "/notifications"],
	["chat", "/chat/:id?"],
	["issues", "/issues/:id?"],
	["party", "/party/:id"],
	["playlist", "/playlists/:id"],
	["media-item", "/media/:id"],
	["person", "/person/:id"],
	["settings", "/settings"],
	["admin", "/admin"],
	["admin-activity", "/admin/activity"],
	["movies", "/movies"],
	["tv", "/tv"],
	["music", "/music"],
	["guide", "/guide"],
	["live-player", "/live/:channelId"],
	["search", "/search"],
	["player-test", "/player-test"],
];
const stub = { render: () => null };
const router = createRouter({
	history: createMemoryHistory(),
	routes: [...namedRoutes.map(([name, path]) => ({ name, path, component: stub })), { path: "/:pathMatch(.*)*", component: stub }],
});

setup((app) => {
	app.use(i18n);
	app.use(router);
	app.use(createModal({ groups: { default: {} } }));
	app.use(Vue3Toastify, toastContainerOptions);
	app.component("Icon", Icon);
});

const preview: Preview = {
	// Safe defaults for calls the shared composables make on mount; stories override them as needed.
	beforeEach: () => {
		mocked(getPaymentStatus).mockResolvedValue({ enabled: false });
		mocked(getNotificationConfig).mockResolvedValue({ enabled: false } as Awaited<ReturnType<typeof getNotificationConfig>>);
		mocked(listNotifications).mockResolvedValue({ items: [] } as unknown as Awaited<ReturnType<typeof listNotifications>>);
	},
	parameters: {
		layout: "centered",
		controls: { expanded: true, sort: "requiredFirst", matchers: { color: /(background|color)$/i, date: /Date$/i } },
		backgrounds: { disable: true },
		viewport: { options: MINIMAL_VIEWPORTS },

		a11y: {
			// 'todo' - show a11y violations in the test UI only
			// 'error' - fail CI on a11y violations
			// 'off' - skip a11y checks entirely
			test: "todo",
		},
	},
	globalTypes: {
		theme: {
			description: "Flixer theme",
			toolbar: { title: "Theme", icon: "paintbrush", items: ["dark", "light"], dynamicTitle: true },
		},
	},
	initialGlobals: { theme: "dark" },
	decorators: [
		(story, context) => {
			const light = context.globals.theme === "light";
			document.documentElement.classList.toggle("light", light);
			return { components: { story, ModalTarget, ModalOverlay }, template: '<div class="bg-flixer-background p-6 text-flixer-text"><story /><ModalTarget group="default" class="z-50"><ModalOverlay class="flixer-modal-overlay" /></ModalTarget></div>' };
		},
	],
};

export default preview;
