<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { App as CapacitorApp } from "@capacitor/app";
import type { PluginListenerHandle } from "@capacitor/core";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { getMobileTabs, isActivePath } from "../../composables/homeNav";
import { useProfile } from "../../composables/useProfile";
import { isNativeTv, setTvMode } from "../../platform/tvMode";
import { consumeTvBackHandoff, exitTvAdjustmentMode, isTvAdjustmentMode } from "../../platform/tvNavigation";
import UserAvatar from "../ui/UserAvatar.vue";

defineProps<{ isSigningOut: boolean }>();
const emit = defineEmits<{ logout: [] }>();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { profile } = useProfile();
const open = ref(false);
const drawer = ref<HTMLElement | null>(null);
const tabs = computed(() => {
    const items = getMobileTabs().map((tab) => tab.to === "/" ? { ...tab, to: "/tv" } : tab);
    return [...items.filter((tab) => tab.to === "/search"), ...items.filter((tab) => tab.to !== "/search")];
});
let previousFocus: HTMLElement | null = null;
let backListener: PluginListenerHandle | undefined;
let disposed = false;
watch(open, (expanded) => document.documentElement.classList.toggle("tv-menu-expanded", expanded));

async function openMenu() {
    if (open.value) return;
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    open.value = true;
    await nextTick();
    (drawer.value?.querySelector<HTMLElement>('[aria-current="page"]') ?? drawer.value?.querySelector<HTMLElement>("a, button"))?.focus();
}

function closeMenu(restore = true, toContent = false) {
    open.value = false;
    if (restore) void nextTick(() => {
        const previous = previousFocus?.isConnected && (!toContent || !previousFocus.closest("[data-tv-rail]")) ? previousFocus : null;
        const fallback = toContent ? document.querySelector<HTMLElement>("main a[href], main button:not(:disabled), main input:not(:disabled)") : drawer.value?.querySelector<HTMLElement>("a, button");
        (previous ?? fallback)?.focus();
    });
}

function onKeydown(event: KeyboardEvent) {
    const target = event.target instanceof HTMLElement ? event.target : null;
    if ((event.key === "Escape" || event.key === "Backspace") && isTvAdjustmentMode(target)) return;
    if (open.value && event.key === "ArrowRight" && drawer.value?.contains(target)) {
        event.preventDefault();
        event.stopPropagation();
        closeMenu(true, true);
        return;
    }
    if (event.key === "Escape" || (event.key === "Backspace" && !target?.matches("input, textarea, [contenteditable='true']"))) {
        if (!open.value && (route.name === "lyrics" || document.querySelector('[aria-modal="true"]'))) return;
        event.preventDefault();
        event.stopPropagation();
        if (open.value) closeMenu();
        else void openMenu();
    }
}

function onPointerDown(event: PointerEvent) {
    if (open.value && event.target instanceof Node && !drawer.value?.contains(event.target)) closeMenu(false);
}

function exitTvMode() {
    closeMenu(false);
    setTvMode(false);
    void router.push("/");
}

onMounted(() => {
    window.addEventListener("flixer:tv-open-menu", openMenu);
    document.addEventListener("keydown", onKeydown, true);
    document.addEventListener("pointerdown", onPointerDown, true);
    if (isNativeTv) void CapacitorApp.addListener("backButton", () => {
        const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        if (exitTvAdjustmentMode(active, true)) return;
        if (consumeTvBackHandoff(active)) {
            void openMenu();
            return;
        }
        if (!open.value && (route.name === "lyrics" || document.querySelector('[aria-modal="true"]'))) return;
        if (open.value) closeMenu();
        else void openMenu();
    }).then((listener) => {
        if (disposed) void listener.remove();
        else backListener = listener;
    });
});
onBeforeUnmount(() => {
    disposed = true;
    document.documentElement.classList.remove("tv-menu-expanded");
    void backListener?.remove();
    window.removeEventListener("flixer:tv-open-menu", openMenu);
    document.removeEventListener("keydown", onKeydown, true);
    document.removeEventListener("pointerdown", onPointerDown, true);
});
</script>

<template>
    <nav ref="drawer" class="tv-rail" :class="{ 'is-open': open }" data-tv-rail :role="open ? 'dialog' : undefined"
        :aria-modal="open ? 'true' : undefined" :aria-label="t('home.nav.more')">
        <RouterLink v-if="profile" :to="{ name: 'profile', params: { username: profile.username } }" class="tv-profile"
            :aria-label="t('header.profile')" :title="t('header.profile')" @click="closeMenu(false)">
            <span class="tv-avatar">
                <UserAvatar :avatar-url="profile.avatarUrl" :name="profile.displayName" />
            </span><span class="tv-label" :aria-hidden="!open">{{ profile.displayName }}</span>
        </RouterLink>
        <RouterLink v-for="tab in tabs" :key="tab.to" :to="tab.to" class="tv-rail-item" :aria-label="tab.label"
            :title="tab.label" :aria-current="isActivePath(route.path, tab.to) ? 'page' : undefined"
            @click="closeMenu(false)">
            <Icon :icon="tab.icon" aria-hidden="true" /><span class="tv-label" :aria-hidden="!open">{{ tab.label
            }}</span>
        </RouterLink>
        <RouterLink to="/settings" class="tv-rail-item tv-secondary" :aria-label="t('header.settings')"
            :title="t('header.settings')" @click="closeMenu(false)">
            <Icon icon="lucide:settings" aria-hidden="true" /><span class="tv-label" :aria-hidden="!open">{{
                t('header.settings') }}</span>
        </RouterLink>
        <button v-if="open && !isNativeTv" type="button" class="tv-rail-item" @click="exitTvMode">
            <Icon icon="lucide:monitor" aria-hidden="true" /><span class="tv-label">Exit TV mode</span>
        </button>
        <button v-if="open" type="button" class="tv-rail-item" :disabled="isSigningOut"
            @click="closeMenu(false); emit('logout')">
            <Icon icon="lucide:log-out" aria-hidden="true" /><span class="tv-label">{{ t('header.signOut') }}</span>
        </button>
    </nav>
</template>

<style scoped>
.tv-rail {
    position: fixed;
    z-index: 110;
    inset: 0 auto 0 0;
    display: flex;
    width: 5rem;
    flex-direction: column;
    gap: 0.3rem;
    overflow-x: hidden;
    overflow-y: auto;
    padding: 1.25rem 0.5rem 1rem 1.5rem;
    background: transparent;
    color: white;
    transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1), padding 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.tv-rail.is-open {
    z-index: 120;
    width: min(19rem, 85vw);
    padding-right: 1rem;
}

.tv-profile {
    display: flex;
    min-height: 3rem;
    flex-shrink: 0;
    align-items: center;
    gap: 1rem;
    overflow: hidden;
    padding-left: 0.25rem;
    margin-bottom: 1.5rem;
}

.tv-avatar {
    display: block;
    width: 2.5rem;
    height: 2.5rem;
    flex-shrink: 0;
    overflow: hidden;
    border-radius: 50%;
}

.tv-rail-item {
    display: flex;
    width: 100%;
    min-height: 3.25rem;
    flex-shrink: 0;
    align-items: center;
    gap: 1rem;
    overflow: hidden;
    border-radius: 0.25rem;
    padding: 0.65rem 1rem;
    color: #b7b7ba;
    text-align: left;
    white-space: nowrap;
}

.tv-rail-item[aria-current="page"],
.tv-rail-item:focus {
    color: white;
}

.is-open .tv-rail-item[aria-current="page"],
.is-open .tv-rail-item:focus {
    background: #f4f4f5;
    color: #141519;
}

.tv-rail-item svg {
    width: 1.4rem;
    height: 1.4rem;
    flex-shrink: 0;
}

.tv-label {
    max-width: 0;
    flex-shrink: 0;
    overflow: hidden;
    opacity: 0;
    white-space: nowrap;
    transition: max-width 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms ease;
}

.is-open .tv-label {
    max-width: 12rem;
    opacity: 1;
}

.tv-secondary {
    margin-top: 1.5rem;
}

@media (prefers-reduced-motion: reduce) {

    .tv-rail,
    .tv-label {
        transition: none;
    }
}
</style>