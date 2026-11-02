<script setup lang="ts">
import { App as CapacitorApp } from "@capacitor/app";
import { LocalNotifications } from "@capacitor/local-notifications";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { acceptFriend } from "../../api";
import { notify } from "../../composables/notify";
import { useNotifications } from "../../composables/useNotifications.ts";
import { onNotificationChange } from "../../composables/useNotificationSocket";
import { nativeNavigationEnabled } from "../../platform/nativeNavigation";
import { catchError } from "../../utils/catchError";

const POLL_MS = 60_000;

const props = withDefaults(defineProps<{ buttonClass?: string; standalone?: boolean }>(), {
	buttonClass: "",
	standalone: false,
});

const { t, locale } = useI18n();
const router = useRouter();
const { enabled, loadConfig, maybePromptOnLoad, items, unread, hasUnread, isLoading, pushSupported, nativeNotificationsSupported, nativeNotificationsEnabled, nativeNotificationsBusy, nativeNotificationPermission, pushEnabled, pushBusy, permission, refresh, refreshPushState, refreshNativeNotificationState, enableNativeNotifications, disableNativeNotifications, enablePush, disablePush, markAllRead, markRead, dismiss } = useNotifications();

const open = ref(props.standalone);
const acceptingFriendRequest = ref("");
const root = ref<HTMLElement | null>(null);
const panel = ref<HTMLElement | null>(null);
let timer: ReturnType<typeof setInterval> | undefined;
let stopNotificationSocket: (() => void) | undefined;
let nativeActionListener: { remove: () => Promise<void> } | undefined;
let nativeAppStateListener: { remove: () => Promise<void> } | undefined;
let isMounted = false;

function onMessage(event: MessageEvent) {
	const data = event.data as { type?: string; path?: string } | null;
	if (data?.type === "flixer-notification") void refresh();
	if (data?.type === "flixer-navigate" && typeof data.path === "string" && data.path.startsWith("/") && !data.path.startsWith("//")) void router.push(data.path);
}

function onVisible() {
	if (document.visibilityState === "visible") void refresh();
}

function onDocumentClick(event: MouseEvent) {
	if (props.standalone) return;
	const target = event.target as Node;
	if (open.value && !root.value?.contains(target) && !panel.value?.contains(target)) open.value = false;
}

function onKey(event: KeyboardEvent) {
	if (event.key === "Escape" && !props.standalone) open.value = false;
}

onMounted(() => {
	isMounted = true;
	void (async () => {
		await loadConfig();
		await refreshPushState();
		await refreshNativeNotificationState();
		await maybePromptOnLoad();
	})();
	void refresh();
	stopNotificationSocket = onNotificationChange(() => void refresh());
	timer = setInterval(() => void refresh(), POLL_MS);
	document.addEventListener("visibilitychange", onVisible);
	document.addEventListener("click", onDocumentClick);
	document.addEventListener("keydown", onKey);
	navigator.serviceWorker?.addEventListener("message", onMessage);
	if (nativeNotificationsSupported) {
		void CapacitorApp.addListener("appStateChange", ({ isActive }) => {
			if (isActive) void refresh();
		})
			.then((listener) => {
				if (isMounted) nativeAppStateListener = listener;
				else void listener.remove();
			})
			.catch((error: unknown) => console.error("[notifications] native app state listener failed", error));
		void LocalNotifications.addListener("localNotificationActionPerformed", ({ notification }) => {
			const extra = notification.extra as { notificationId?: unknown; url?: unknown } | undefined;
			if (typeof extra?.notificationId === "string") void markRead(extra.notificationId);
			if (typeof extra?.url === "string" && extra.url.startsWith("/") && !extra.url.startsWith("//")) {
				open.value = false;
				void router.push(extra.url);
			}
		})
			.then((listener) => {
				if (isMounted) nativeActionListener = listener;
				else void listener.remove();
			})
			.catch((error: unknown) => console.error("[notifications] native notification action listener failed", error));
	}
});

onBeforeUnmount(() => {
	isMounted = false;
	clearInterval(timer);
	stopNotificationSocket?.();
	document.removeEventListener("visibilitychange", onVisible);
	document.removeEventListener("click", onDocumentClick);
	document.removeEventListener("keydown", onKey);
	navigator.serviceWorker?.removeEventListener("message", onMessage);
	void nativeActionListener?.remove();
	void nativeAppStateListener?.remove();
});

function ago(iso: string) {
	const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
	const formatter = new Intl.RelativeTimeFormat(locale.value, { numeric: "auto" });
	for (const [unit, size] of [
		["day", 86400],
		["hour", 3600],
		["minute", 60],
	] as const) {
		if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
	}
	return formatter.format(0, "minute");
}

function openItem(id: string, url: string | null) {
	void markRead(id);
	if (url && url.startsWith("/") && !url.startsWith("//")) {
		open.value = false;
		void router.push(url);
	}
}

function friendUsername(url: string | null): string | null {
	if (!url) return null;
	try {
		const match = /^\/u\/([^/]+)\/?$/.exec(new URL(url, window.location.origin).pathname);
		if (!match) return null;
		return decodeURIComponent(match[1]);
	} catch {
		return null;
	}
}

async function acceptRequest(notificationId: string, url: string | null) {
	const username = friendUsername(url);
	if (!username || acceptingFriendRequest.value) return;
	acceptingFriendRequest.value = notificationId;
	try {
		const [acceptError] = await catchError(acceptFriend(username));
		if (acceptError) {
			notify.error(t("notifications.friendRequestAcceptError"));
			return;
		}
		const [dismissError] = await catchError(dismiss(notificationId));
		if (dismissError) notify.error(t("notifications.friendRequestAcceptError"));
	} finally {
		acceptingFriendRequest.value = "";
	}
}

function togglePush() {
	void (pushEnabled.value ? disablePush() : enablePush());
}

function toggleNativeNotifications() {
	if (nativeNotificationsEnabled.value) disableNativeNotifications();
	else void enableNativeNotifications();
}
</script>

<template>
	<div v-if="enabled" ref="root" :class="standalone ? 'w-full' : 'relative'">
		<button v-if="!standalone" type="button" :class="buttonClass" :aria-label="t('notifications.title')" aria-haspopup="dialog" :aria-expanded="open" @click="open = !open">
			<Icon icon="lucide:bell" class="size-5" aria-hidden="true" />
			<Transition name="bell-badge">
				<span v-if="hasUnread" class="absolute right-1 top-1 grid min-w-4 place-items-center rounded bg-flixer-accent px-1 text-[10px] font-bold leading-4 text-flixer-background">{{ unread > 9 ? "9+" : unread }}</span>
			</Transition>
		</button>

		<Teleport to="body" :disabled="standalone || !nativeNavigationEnabled">
			<Transition name="bell-panel">
				<div v-if="open" ref="panel" class="theme-dark overflow-hidden rounded border border-white/10 bg-flixer-surface shadow-2xl shadow-black/60" :class="[standalone ? 'w-full' : 'w-[22rem] max-w-[calc(100vw-2rem)] origin-top-right', standalone ? '' : nativeNavigationEnabled ? 'fixed right-4 z-[70]' : 'absolute right-0 top-12 z-50']" :style="nativeNavigationEnabled && !standalone ? { top: 'calc(env(safe-area-inset-top, 0px) + 4.5rem)' } : undefined" :role="standalone ? 'region' : 'dialog'" :aria-label="t('notifications.title')">
					<div class="flex items-center justify-between border-b border-white/10 px-4 py-3">
						<h2 class="text-sm font-semibold text-white">{{ t("notifications.title") }}</h2>
						<button v-if="hasUnread" type="button" class="text-xs text-flixer-muted transition hover:text-white" @click="markAllRead">{{ t("notifications.markAllRead") }}</button>
					</div>

					<ul v-if="items.length > 0" class="overflow-y-auto" :class="standalone ? 'max-h-none' : 'max-h-96'">
						<li v-for="item in items" :key="item.id" class="group flex items-start gap-3 border-b border-white/5 px-4 py-3 transition last:border-b-0 hover:bg-white/5">
							<span class="mt-1.5 size-2 shrink-0 rounded-full" :class="item.read ? 'bg-transparent' : 'bg-flixer-accent'" aria-hidden="true"></span>
							<div class="min-w-0 flex-1">
								<button type="button" class="w-full text-left" @click="openItem(item.id, item.url)">
									<span class="block truncate text-sm font-semibold text-white">{{ item.title }}</span>
									<span class="mt-0.5 line-clamp-2 block text-xs text-flixer-text/80">{{ item.body }}</span>
									<span class="mt-1 block text-[11px] text-flixer-muted">{{ ago(item.createdAt) }}</span>
								</button>
								<button v-if="item.kind === 'friend_request' && friendUsername(item.url)" type="button" class="mt-2 rounded bg-white px-3 py-1.5 text-xs font-semibold text-flixer-background transition hover:bg-white/85 disabled:opacity-60" :disabled="!!acceptingFriendRequest" @click="acceptRequest(item.id, item.url)">
									{{ acceptingFriendRequest === item.id ? t("notifications.acceptingFriendRequest") : t("notifications.acceptFriendRequest") }}
								</button>
							</div>
							<button type="button" class="grid size-6 shrink-0 place-items-center rounded text-flixer-muted opacity-0 transition hover:bg-white/10 hover:text-white focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100" :aria-label="t('notifications.dismiss')" @click="dismiss(item.id)">
								<Icon icon="lucide:x" class="size-3.5" aria-hidden="true" />
							</button>
						</li>
					</ul>
					<p v-else class="px-4 py-8 text-center text-sm text-flixer-muted">{{ isLoading ? t("notifications.loading") : t("notifications.empty") }}</p>

					<div v-if="pushSupported" class="border-t border-white/10 px-4 py-3">
						<label class="flex cursor-pointer items-center justify-between gap-3 text-sm text-white" :class="permission === 'denied' ? 'cursor-not-allowed opacity-60' : ''">
							<span>
								{{ t("notifications.pushToggle") }}
								<span v-if="permission === 'denied'" class="block text-xs text-flixer-muted">{{ t("notifications.pushBlocked") }}</span>
							</span>
							<input type="checkbox" role="switch" class="size-4 accent-flixer-accent" :checked="pushEnabled" :disabled="pushBusy || permission === 'denied'" @change="togglePush" />
						</label>
					</div>
					<div v-if="nativeNotificationsSupported" class="border-t border-white/10 px-4 py-3">
						<label class="flex cursor-pointer items-center justify-between gap-3 text-sm text-white" :class="nativeNotificationPermission === 'denied' ? 'cursor-not-allowed opacity-60' : ''">
							<span>
								{{ t("notifications.localToggle") }}
								<span class="block text-xs text-flixer-muted">{{ t("notifications.localNotice") }}</span>
								<span v-if="nativeNotificationPermission === 'denied'" class="block text-xs text-flixer-muted">{{ t("notifications.localBlocked") }}</span>
							</span>
							<input type="checkbox" role="switch" class="size-4 accent-flixer-accent" :checked="nativeNotificationsEnabled" :disabled="nativeNotificationsBusy || nativeNotificationPermission === 'denied'" @change="toggleNativeNotifications" />
						</label>
					</div>
				</div>
			</Transition>
		</Teleport>
	</div>
</template>

<style>
.bell-panel-enter-active,
.bell-panel-leave-active {
	transition:
		opacity 0.18s ease,
		transform 0.18s ease;
}
.bell-panel-enter-from,
.bell-panel-leave-to {
	opacity: 0;
	transform: translateY(-6px) scale(0.97);
}
.bell-badge-enter-active {
	transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.bell-badge-enter-from {
	transform: scale(0);
}
@media (prefers-reduced-motion: reduce) {
	.bell-panel-enter-active,
	.bell-panel-leave-active,
	.bell-badge-enter-active {
		transition: none;
	}
}
</style>
