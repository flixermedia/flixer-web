<script setup lang="ts">
import { openModal } from "@kolirt/vue-modal";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink } from "vue-router";
import { useAccess } from "../../composables/useAccess";
import { useProfile } from "../../composables/useProfile";
import { useRequestsConfig } from "../../composables/useRequestsConfig";
import LanguageModal from "../ui/LanguageModal.vue";
import ThemeModal from "../ui/ThemeModal.vue";
import UserAvatar from "../ui/UserAvatar.vue";

defineProps<{ isSigningOut: boolean }>();
const emit = defineEmits<{ close: []; logout: [] }>();

const { t } = useI18n();
const { profile } = useProfile();
const { enabled: requestsEnabled } = useRequestsConfig();

const { load: loadAccess, requestUnlock, relock, isUnlocked, canUnlock, hasLimits } = useAccess();
onMounted(() => void loadAccess());

const isAdmin = computed(() => profile.value?.role === "admin");
const open = ref<"preferences" | "admin" | null>(null);

const row = "flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm text-flixer-text transition hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none";
const iconClass = "size-4 shrink-0 text-flixer-muted";
const subRow = "flex w-full items-center gap-3 rounded py-2 pl-9 pr-3 text-left text-sm text-flixer-text/90 transition hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none";

function collapsedStyle(element: Element, height: string) {
	const panel = element as HTMLElement
	panel.style.height = height
	panel.style.overflow = 'hidden'
}

function animateTo(element: Element, height: string | (() => string)) {
	const panel = element as HTMLElement
	panel.style.transition = 'height 220ms cubic-bezier(0.4, 0, 0.2, 1)'
	requestAnimationFrame(() => {
		panel.style.height = typeof height === 'function' ? height() : height
	})
}

function settle(element: Element, height: string) {
	const panel = element as HTMLElement
	panel.style.height = height
	panel.style.overflow = ''
	panel.style.transition = ''
}

const accordion = {
	onBeforeEnter: (el: Element) => collapsedStyle(el, '0'),
	onEnter: (el: Element) => animateTo(el, () => `${(el as HTMLElement).scrollHeight}px`),
	onAfterEnter: (el: Element) => settle(el, 'auto'),
	onBeforeLeave: (el: Element) => {
		collapsedStyle(el, `${(el as HTMLElement).scrollHeight}px`)
		void (el as HTMLElement).offsetHeight
	},
	onLeave: (el: Element) => animateTo(el, '0'),
	onAfterLeave: (el: Element) => settle(el, ''),
}

function toggle(section: "preferences" | "admin") {
	open.value = open.value === section ? null : section;
}

function openLanguage() {
	emit("close");
	void openModal(LanguageModal).catch(() => undefined);
}

function openTheme() {
	emit("close");
	void openModal(ThemeModal).catch(() => undefined);
}
</script>

<template>
	<div v-if="profile" class="flex items-center gap-3 px-3 py-2.5">
		<span class="block size-10 shrink-0 overflow-hidden rounded text-sm"><UserAvatar :avatar-url="profile.avatarUrl" :name="profile.displayName" /></span>
		<div class="min-w-0">
			<p class="truncate text-sm font-semibold text-white">{{ profile.displayName }}</p>
			<p class="truncate text-xs text-flixer-muted">{{ profile.username }}</p>
		</div>
	</div>
	<div v-if="profile" class="my-1.5 h-px bg-white/10"></div>

	<RouterLink v-if="profile" :to="{ name: 'profile', params: { username: profile.username } }" :class="row" role="menuitem" @click="emit('close')"><Icon icon="lucide:user-round" :class="iconClass" aria-hidden="true" />{{ t("header.profile") }}</RouterLink>

	<RouterLink to="/people" :class="row" role="menuitem" @click="emit('close')"><Icon icon="lucide:users" :class="iconClass" aria-hidden="true" />{{ t("header.people") }}</RouterLink>
	<RouterLink to="/issues" :class="row" role="menuitem" @click="emit('close')"><Icon icon="lucide:flag" :class="iconClass" aria-hidden="true" />{{ t("issues.myReports") }}</RouterLink>
	<RouterLink v-if="requestsEnabled" to="/requests" :class="row" role="menuitem" @click="emit('close')"><Icon icon="lucide:clapperboard" :class="iconClass" aria-hidden="true" />{{ t("requests.nav.requests") }}</RouterLink>

	<button v-if="hasLimits && (isUnlocked || canUnlock)" type="button" :class="row" role="menuitem" @click="emit('close'); isUnlocked ? relock() : requestUnlock()">
		<Icon :icon="isUnlocked ? 'lucide:lock' : 'lucide:lock-keyhole-open'" :class="iconClass" aria-hidden="true" />
		<span class="min-w-0"><span class="block">{{ t(isUnlocked ? "access.unlockedMenu" : "access.lockedMenu") }}</span><span class="block text-xs text-flixer-muted">{{ t(isUnlocked ? "access.unlockedMenuDescription" : "access.lockedMenuDescription") }}</span></span>
	</button>

	<div class="my-1.5 h-px bg-white/10"></div>

	<button type="button" :class="row" role="menuitem" aria-haspopup="true" :aria-expanded="open === 'preferences'" @click="toggle('preferences')">
		<Icon icon="lucide:sliders-horizontal" :class="iconClass" aria-hidden="true" />
		<span class="flex-1">{{ t("header.preferences") }}</span>
		<Icon icon="lucide:chevron-down" class="size-4 text-flixer-muted transition-transform" :class="open === 'preferences' ? 'rotate-180' : ''" aria-hidden="true" />
	</button>
	<Transition v-bind="accordion">
	<div v-if="open === 'preferences'" role="group">
		<button type="button" :class="subRow" role="menuitem" @click="openLanguage"><Icon icon="lucide:languages" :class="iconClass" aria-hidden="true" />{{ t("header.language") }}</button>
		<button type="button" :class="subRow" role="menuitem" @click="openTheme"><Icon icon="lucide:palette" :class="iconClass" aria-hidden="true" />{{ t("header.theme") }}</button>
		<RouterLink to="/settings" :class="subRow" role="menuitem" @click="emit('close')"><Icon icon="lucide:settings" :class="iconClass" aria-hidden="true" />{{ t("header.settings") }}</RouterLink>
	</div>
	</Transition>

	<template v-if="isAdmin">
		<button type="button" :class="row" role="menuitem" aria-haspopup="true" :aria-expanded="open === 'admin'" @click="toggle('admin')">
			<Icon icon="lucide:shield-check" :class="iconClass" aria-hidden="true" />
			<span class="flex-1">{{ t("header.administration") }}</span>
			<Icon icon="lucide:chevron-down" class="size-4 text-flixer-muted transition-transform" :class="open === 'admin' ? 'rotate-180' : ''" aria-hidden="true" />
		</button>
		<Transition v-bind="accordion">
		<div v-if="open === 'admin'" role="group">
			<RouterLink to="/admin" :class="subRow" role="menuitem" @click="emit('close')"><Icon icon="lucide:layout-dashboard" :class="iconClass" aria-hidden="true" />{{ t("header.adminDashboard") }}</RouterLink>
			<RouterLink :to="{ name: 'admin', query: { tab: 'issues', page: 'tickets' } }" :class="subRow" role="menuitem" @click="emit('close')"><Icon icon="lucide:ticket" :class="iconClass" aria-hidden="true" />{{ t("header.manageIssues") }}</RouterLink>
		</div>
		</Transition>
	</template>

	<div class="my-1.5 h-px bg-white/10"></div>

	<button type="button" class="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm text-red-300 transition hover:bg-red-500/10 focus-visible:outline-none disabled:cursor-wait disabled:opacity-70" role="menuitem" :disabled="isSigningOut" @click="emit('logout')">
		<Icon icon="lucide:log-out" class="size-4 shrink-0" aria-hidden="true" />
		{{ isSigningOut ? t("header.signingOut") : t("header.signOut") }}
	</button>
</template>
