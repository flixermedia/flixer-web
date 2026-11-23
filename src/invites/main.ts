import { createModal, type DefineGroups } from "@kolirt/vue-modal";
import { createApp } from "vue";
import Vue3Toastify from "vue3-toastify";
import { toastContainerOptions } from "../composables/notify";
import { initAppearance } from "../composables/useAppearance";
import { initTheme } from "../composables/useTheme";
import { i18n, initLocale } from "../i18n";
import AppIcon from "../components/ui/AppIcon.vue";
import router from "./router";
import App from "./App.vue";
import { prefetchSetupGate } from "../setup/setupGate";
import "../tailwind.css";
import "../toast.css";
import "../modal.css";

declare module "@kolirt/vue-modal" {
	interface ModalGroupRegistry extends DefineGroups<["default"]> {}
}

prefetchSetupGate();

const app = createApp(App);

app.component("Icon", AppIcon);

initTheme();
initAppearance();

app.use(i18n);
app.use(router);
app.use(Vue3Toastify, toastContainerOptions);
app.use(createModal({ groups: { default: {} } }));

await initLocale();

app.mount("#app");
await router.isReady();
document.getElementById("startup")?.remove();
