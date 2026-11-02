import { App as CapacitorApp } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { acceptFriend } from '../../api';
import { notify } from '../../composables/notify';
import { useNotifications } from '../../composables/useNotifications';
import { onNotificationChange } from '../../composables/useNotificationSocket';
import { catchError } from '../../utils/catchError';
const { defineProps, } = {};
const POLL_MS = 60_000;
const __VLS_props = defineProps();
const { t, locale } = useI18n();
const router = useRouter();
const { enabled, loadConfig, maybePromptOnLoad, items, unread, hasUnread, isLoading, pushSupported, nativeNotificationsSupported, nativeNotificationsEnabled, nativeNotificationsBusy, nativeNotificationPermission, pushEnabled, pushBusy, permission, refresh, refreshPushState, refreshNativeNotificationState, enableNativeNotifications, disableNativeNotifications, enablePush, disablePush, markAllRead, markRead, dismiss } = useNotifications();
const open = ref(false);
const acceptingFriendRequest = ref('');
const root = ref(null);
let timer;
let stopNotificationSocket;
let nativeActionListener;
let nativeAppStateListener;
let isMounted = false;
function onMessage(event) {
    const data = event.data;
    if (data?.type === 'flixer-notification')
        void refresh();
    if (data?.type === 'flixer-navigate' && typeof data.path === 'string' && data.path.startsWith('/') && !data.path.startsWith('//'))
        void router.push(data.path);
}
function onVisible() {
    if (document.visibilityState === 'visible')
        void refresh();
}
function onDocumentClick(event) {
    if (open.value && root.value && !root.value.contains(event.target))
        open.value = false;
}
function onKey(event) {
    if (event.key === 'Escape')
        open.value = false;
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
    document.addEventListener('visibilitychange', onVisible);
    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onKey);
    navigator.serviceWorker?.addEventListener('message', onMessage);
    if (nativeNotificationsSupported) {
        void CapacitorApp.addListener('appStateChange', ({ isActive }) => {
            if (isActive)
                void refresh();
        })
            .then((listener) => {
            if (isMounted)
                nativeAppStateListener = listener;
            else
                void listener.remove();
        })
            .catch((error) => console.error('[notifications] native app state listener failed', error));
        void LocalNotifications.addListener('localNotificationActionPerformed', ({ notification }) => {
            const extra = notification.extra;
            if (typeof extra?.notificationId === 'string')
                void markRead(extra.notificationId);
            if (typeof extra?.url === 'string' && extra.url.startsWith('/') && !extra.url.startsWith('//')) {
                open.value = false;
                void router.push(extra.url);
            }
        })
            .then((listener) => {
            if (isMounted)
                nativeActionListener = listener;
            else
                void listener.remove();
        })
            .catch((error) => console.error('[notifications] native notification action listener failed', error));
    }
});
onBeforeUnmount(() => {
    isMounted = false;
    clearInterval(timer);
    stopNotificationSocket?.();
    document.removeEventListener('visibilitychange', onVisible);
    document.removeEventListener('click', onDocumentClick);
    document.removeEventListener('keydown', onKey);
    navigator.serviceWorker?.removeEventListener('message', onMessage);
    void nativeActionListener?.remove();
    void nativeAppStateListener?.remove();
});
function ago(iso) {
    const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
    const formatter = new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' });
    for (const [unit, size] of [
        ['day', 86400],
        ['hour', 3600],
        ['minute', 60],
    ]) {
        if (Math.abs(seconds) >= size)
            return formatter.format(Math.round(seconds / size), unit);
    }
    return formatter.format(0, 'minute');
}
function openItem(id, url) {
    void markRead(id);
    if (url && url.startsWith('/') && !url.startsWith('//')) {
        open.value = false;
        void router.push(url);
    }
}
function friendUsername(url) {
    if (!url)
        return null;
    try {
        const match = /^\/u\/([^/]+)\/?$/.exec(new URL(url, window.location.origin).pathname);
        if (!match)
            return null;
        return decodeURIComponent(match[1]);
    }
    catch {
        return null;
    }
}
async function acceptRequest(notificationId, url) {
    const username = friendUsername(url);
    if (!username || acceptingFriendRequest.value)
        return;
    acceptingFriendRequest.value = notificationId;
    try {
        const [acceptError] = await catchError(acceptFriend(username));
        if (acceptError) {
            notify.error(t('notifications.friendRequestAcceptError'));
            return;
        }
        const [dismissError] = await catchError(dismiss(notificationId));
        if (dismissError)
            notify.error(t('notifications.friendRequestAcceptError'));
    }
    finally {
        acceptingFriendRequest.value = '';
    }
}
function togglePush() {
    void (pushEnabled.value ? disablePush() : enablePush());
}
function toggleNativeNotifications() {
    if (nativeNotificationsEnabled.value)
        disableNativeNotifications();
    else
        void enableNativeNotifications();
}
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(enabled, {});
    __VLS_withDotValue(open, {});
    __VLS_withDotValue(hasUnread, {});
    __VLS_withDotValue(items, {});
    __VLS_withDotValue(acceptingFriendRequest, {});
    __VLS_withDotValue(isLoading, {});
    __VLS_withDotValue(pushSupported, {});
    __VLS_withDotValue(permission, {});
    __VLS_withDotValue(pushBusy, {});
    __VLS_withDotValue(nativeNotificationsSupported, {});
    __VLS_withDotValue(nativeNotificationPermission, {});
    __VLS_withDotValue(nativeNotificationsBusy, {});
    if (enabled.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ref: "root",
            ...{ class: "relative" },
        });
        /** @type {__VLS_StyleScopedClasses['relative']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!(enabled.value))
                        throw 0;
                    return (open.value = !open.value);
                    // @ts-ignore
                    [enabled, open, open,];
                } },
            type: "button",
            ...{ class: (__VLS_ctx.buttonClass) },
            'aria-label': (__VLS_unwrap(t, {})('notifications.title')),
            'aria-haspopup': "dialog",
            'aria-expanded': (open.value),
        });
        let __VLS_0;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
            // @ts-ignore
            icon: "lucide:bell", ...{ class: "size-5" }, 'aria-hidden': "true",
        }));
        const __VLS_2 = __VLS_1({
            icon: "lucide:bell",
            ...{ class: "size-5" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1));
        /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
        let __VLS_5;
        /** @ts-ignore @type { | typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
        Transition;
        // @ts-ignore
        const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
            // @ts-ignore
            name: "bell-badge",
        }));
        const __VLS_7 = __VLS_6({
            name: "bell-badge",
        }, ...__VLS_functionalComponentArgsRest(__VLS_6));
        var __VLS_8;
        const { default: __VLS_10 } = __VLS_nonNull(__VLS_8.slots);
        if (hasUnread.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "absolute right-1 top-1 grid min-w-4 place-items-center rounded bg-flixer-accent px-1 text-[10px] font-bold leading-4 text-flixer-background" },
            });
            /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
            /** @type {__VLS_StyleScopedClasses['right-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['top-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['min-w-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-accent']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
            /** @type {__VLS_StyleScopedClasses['leading-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-background']} */ ;
            (__VLS_unwrap(unread, {}) > 9 ? '9+' : __VLS_unwrap(unread, {}));
        }
        // @ts-ignore
        [open, buttonClass, t, hasUnread, unread, unread,];
        let __VLS_11;
        /** @ts-ignore @type { | typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
        Transition;
        // @ts-ignore
        const __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11({
            // @ts-ignore
            name: "bell-panel",
        }));
        const __VLS_13 = __VLS_12({
            name: "bell-panel",
        }, ...__VLS_functionalComponentArgsRest(__VLS_12));
        var __VLS_14;
        const { default: __VLS_16 } = __VLS_nonNull(__VLS_14.slots);
        if (open.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "theme-dark absolute right-0 top-12 z-50 w-[22rem] max-w-[calc(100vw-2rem)] origin-top-right overflow-hidden rounded border border-white/10 bg-flixer-surface shadow-2xl shadow-black/60" },
                role: "dialog",
                'aria-label': (__VLS_unwrap(t, {})('notifications.title')),
            });
            /** @type {__VLS_StyleScopedClasses['theme-dark']} */ ;
            /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
            /** @type {__VLS_StyleScopedClasses['right-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['top-12']} */ ;
            /** @type {__VLS_StyleScopedClasses['z-50']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-[22rem]']} */ ;
            /** @type {__VLS_StyleScopedClasses['max-w-[calc(100vw-2rem)]']} */ ;
            /** @type {__VLS_StyleScopedClasses['origin-top-right']} */ ;
            /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
            /** @type {__VLS_StyleScopedClasses['shadow-2xl']} */ ;
            /** @type {__VLS_StyleScopedClasses['shadow-black/60']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex items-center justify-between border-b border-white/10 px-4 py-3" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
                ...{ class: "text-sm font-semibold text-white" },
            });
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            (__VLS_unwrap(t, {})('notifications.title'));
            if (hasUnread.value) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (__VLS_unwrap(markAllRead, {})) },
                    type: "button",
                    ...{ class: "text-xs text-flixer-muted transition hover:text-white" },
                });
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
                (__VLS_unwrap(t, {})('notifications.markAllRead'));
            }
            if (items.value.length > 0) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
                    ...{ class: "max-h-96 overflow-y-auto" },
                });
                /** @type {__VLS_StyleScopedClasses['max-h-96']} */ ;
                /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
                const __VLS_17 = __VLS_tryAsConstant((items.value));
                for (const [item] of __VLS_vFor(__VLS_nonNull(__VLS_17))) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                        key: (item.id),
                        ...{ class: "group flex items-start gap-3 border-b border-white/5 px-4 py-3 transition last:border-b-0 hover:bg-white/5" },
                    });
                    /** @type {__VLS_StyleScopedClasses['group']} */ ;
                    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                    /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
                    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
                    /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
                    /** @type {__VLS_StyleScopedClasses['border-white/5']} */ ;
                    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
                    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
                    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                    /** @type {__VLS_StyleScopedClasses['last:border-b-0']} */ ;
                    /** @type {__VLS_StyleScopedClasses['hover:bg-white/5']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "mt-1.5 size-2 shrink-0 rounded-full" },
                        ...{ class: (item.read ? 'bg-transparent' : 'bg-flixer-accent') },
                        'aria-hidden': "true",
                    });
                    /** @type {__VLS_StyleScopedClasses['mt-1.5']} */ ;
                    /** @type {__VLS_StyleScopedClasses['size-2']} */ ;
                    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "min-w-0 flex-1" },
                    });
                    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
                    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                void $event;
                                if (!(enabled.value))
                                    throw 0;
                                if (!(open.value))
                                    throw 0;
                                if (!(items.value.length > 0))
                                    throw 0;
                                return (openItem(item.id, item.url));
                                // @ts-ignore
                                [open, t, t, t, hasUnread, markAllRead, items, items,];
                            } },
                        type: "button",
                        ...{ class: "w-full text-left" },
                    });
                    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "block truncate text-sm font-semibold text-white" },
                    });
                    /** @type {__VLS_StyleScopedClasses['block']} */ ;
                    /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                    (item.title);
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "mt-0.5 line-clamp-2 block text-xs text-flixer-text/80" },
                    });
                    /** @type {__VLS_StyleScopedClasses['mt-0.5']} */ ;
                    /** @type {__VLS_StyleScopedClasses['line-clamp-2']} */ ;
                    /** @type {__VLS_StyleScopedClasses['block']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-flixer-text/80']} */ ;
                    (item.body);
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "mt-1 block text-[11px] text-flixer-muted" },
                    });
                    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
                    /** @type {__VLS_StyleScopedClasses['block']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-[11px]']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                    (ago(item.createdAt));
                    if (item.kind === 'friend_request' && friendUsername(item.url)) {
                        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                            ...{ onClick: (...[$event]) => {
                                    void $event;
                                    if (!(enabled.value))
                                        throw 0;
                                    if (!(open.value))
                                        throw 0;
                                    if (!(items.value.length > 0))
                                        throw 0;
                                    if (!(item.kind === 'friend_request' && friendUsername(item.url)))
                                        throw 0;
                                    return (acceptRequest(item.id, item.url));
                                    // @ts-ignore
                                    [];
                                } },
                            type: "button",
                            ...{ class: "mt-2 rounded bg-white px-3 py-1.5 text-xs font-semibold text-flixer-background transition hover:bg-white/85 disabled:opacity-60" },
                            disabled: (!!acceptingFriendRequest.value),
                        });
                        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
                        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                        /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
                        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
                        /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
                        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                        /** @type {__VLS_StyleScopedClasses['text-flixer-background']} */ ;
                        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                        /** @type {__VLS_StyleScopedClasses['hover:bg-white/85']} */ ;
                        /** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
                        (acceptingFriendRequest.value === item.id ? __VLS_unwrap(t, {})('notifications.acceptingFriendRequest') : __VLS_unwrap(t, {})('notifications.acceptFriendRequest'));
                    }
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                void $event;
                                if (!(enabled.value))
                                    throw 0;
                                if (!(open.value))
                                    throw 0;
                                if (!(items.value.length > 0))
                                    throw 0;
                                return (__VLS_unwrap(dismiss, {})(item.id));
                                // @ts-ignore
                                [t, t, acceptingFriendRequest, acceptingFriendRequest, dismiss,];
                            } },
                        type: "button",
                        ...{ class: "grid size-6 shrink-0 place-items-center rounded text-flixer-muted opacity-0 transition hover:bg-white/10 hover:text-white focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100" },
                        'aria-label': (__VLS_unwrap(t, {})('notifications.dismiss')),
                    });
                    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
                    /** @type {__VLS_StyleScopedClasses['size-6']} */ ;
                    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                    /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
                    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                    /** @type {__VLS_StyleScopedClasses['opacity-0']} */ ;
                    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                    /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
                    /** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:opacity-100']} */ ;
                    /** @type {__VLS_StyleScopedClasses['group-hover:opacity-100']} */ ;
                    /** @type {__VLS_StyleScopedClasses['[@media(hover:none)]:opacity-100']} */ ;
                    let __VLS_18;
                    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
                    Icon;
                    // @ts-ignore
                    const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
                        // @ts-ignore
                        icon: "lucide:x", ...{ class: "size-3.5" }, 'aria-hidden': "true",
                    }));
                    const __VLS_20 = __VLS_19({
                        icon: "lucide:x",
                        ...{ class: "size-3.5" },
                        'aria-hidden': "true",
                    }, ...__VLS_functionalComponentArgsRest(__VLS_19));
                    /** @type {__VLS_StyleScopedClasses['size-3.5']} */ ;
                    // @ts-ignore
                    [t,];
                }
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "px-4 py-8 text-center text-sm text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-8']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (isLoading.value ? __VLS_unwrap(t, {})('notifications.loading') : __VLS_unwrap(t, {})('notifications.empty'));
            }
            if (pushSupported.value) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "border-t border-white/10 px-4 py-3" },
                });
                /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                    ...{ class: "flex cursor-pointer items-center justify-between gap-3 text-sm text-white" },
                    ...{ class: (permission.value === 'denied' ? 'cursor-not-allowed opacity-60' : '') },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                (__VLS_unwrap(t, {})('notifications.pushToggle'));
                if (permission.value === 'denied') {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "block text-xs text-flixer-muted" },
                    });
                    /** @type {__VLS_StyleScopedClasses['block']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                    (__VLS_unwrap(t, {})('notifications.pushBlocked'));
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    ...{ onChange: (togglePush) },
                    type: "checkbox",
                    role: "switch",
                    ...{ class: "size-4 accent-flixer-accent" },
                    checked: (__VLS_unwrap(pushEnabled, {})),
                    disabled: (pushBusy.value || permission.value === 'denied'),
                });
                /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['accent-flixer-accent']} */ ;
            }
            if (nativeNotificationsSupported.value) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "border-t border-white/10 px-4 py-3" },
                });
                /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                    ...{ class: "flex cursor-pointer items-center justify-between gap-3 text-sm text-white" },
                    ...{ class: (nativeNotificationPermission.value === 'denied' ? 'cursor-not-allowed opacity-60' : '') },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                (__VLS_unwrap(t, {})('notifications.localToggle'));
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "block text-xs text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['block']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (__VLS_unwrap(t, {})('notifications.localNotice'));
                if (nativeNotificationPermission.value === 'denied') {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "block text-xs text-flixer-muted" },
                    });
                    /** @type {__VLS_StyleScopedClasses['block']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                    (__VLS_unwrap(t, {})('notifications.localBlocked'));
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    ...{ onChange: (toggleNativeNotifications) },
                    type: "checkbox",
                    role: "switch",
                    ...{ class: "size-4 accent-flixer-accent" },
                    checked: (__VLS_unwrap(nativeNotificationsEnabled, {})),
                    disabled: (nativeNotificationsBusy.value || nativeNotificationPermission.value === 'denied'),
                });
                /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['accent-flixer-accent']} */ ;
            }
        }
        // @ts-ignore
        [t, t, t, t, t, t, t, isLoading, pushSupported, permission, permission, permission, pushEnabled, pushBusy, nativeNotificationsSupported, nativeNotificationPermission, nativeNotificationPermission, nativeNotificationPermission, nativeNotificationsEnabled, nativeNotificationsBusy,];
    }
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
