import { computed, ref } from 'vue';
import { deleteNotification, getAccessToken, getNotificationConfig, getPushPublicKey, getPushStatus, listNotifications, markNotificationsRead, removePushSubscription, savePushSubscription } from '../api';
import { isNativeApp } from '../platform/serverConnection';
import { checkNativeNotificationPermission, NATIVE_NOTIFICATIONS_ENABLED_KEY, newNotificationsSince, prepareNativeNotifications, requestNativeNotificationPermission, showNativeNotifications, supportsNativeLocalNotifications } from '../platform/nativeNotifications';
import { catchError } from '../utils/catchError';
import { notify } from './notify';
import { i18n } from '../i18n';
const items = ref([]);
const unread = ref(0);
const isLoading = ref(false);
const pushEnabled = ref(false);
const pushBusy = ref(false);
const enabled = ref(true);
const promptMode = ref('button');
let promptedThisSession = false;
const permission = ref(typeof Notification === 'undefined' ? 'denied' : Notification.permission);
const nativeNotificationsSupported = supportsNativeLocalNotifications();
const nativeNotificationsEnabled = ref(false);
const nativeNotificationsBusy = ref(false);
const nativeNotificationPermission = ref('prompt');
let observedNotificationIds = new Set();
let hasObservedNotifications = false;
const pushSupported = !isNativeApp() && typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && typeof Notification !== 'undefined';
function keyBytes(base64Url) {
    const padded = base64Url
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .padEnd(Math.ceil(base64Url.length / 4) * 4, '=');
    const raw = atob(padded);
    const bytes = new Uint8Array(new ArrayBuffer(raw.length));
    for (let i = 0; i < raw.length; i++)
        bytes[i] = raw.charCodeAt(i);
    return bytes;
}
async function registration() {
    return navigator.serviceWorker.ready;
}
async function loadConfig() {
    if (!getAccessToken())
        return;
    const [error, config] = await catchError(getNotificationConfig());
    if (error)
        return; // Keep defaults.
    enabled.value = config.enabled;
    promptMode.value = config.permissionPrompt;
}
async function maybePromptOnLoad() {
    if (promptedThisSession || !enabled.value || promptMode.value !== 'load' || !pushSupported)
        return;
    if (Notification.permission !== 'default' || pushEnabled.value)
        return;
    promptedThisSession = true;
    await enablePush();
}
async function refresh() {
    if (!getAccessToken())
        return;
    isLoading.value = true;
    try {
        const [error, result] = await catchError(listNotifications());
        if (error)
            return; // The bell just keeps its last known state.
        const newItems = hasObservedNotifications ? newNotificationsSince(observedNotificationIds, result.items) : [];
        observedNotificationIds = new Set(result.items.map((item) => item.id));
        hasObservedNotifications = true;
        items.value = result.items;
        unread.value = result.unread;
        if (nativeNotificationsEnabled.value && newItems.length > 0) {
            const [localError] = await catchError(showNativeNotifications(newItems));
            if (localError) {
                console.error('[notifications] native local notification delivery failed', localError);
                notify.error(i18n.global.t('notifications.localDeliveryError'));
            }
        }
    }
    finally {
        isLoading.value = false;
    }
}
async function refreshNativeNotificationState() {
    if (!nativeNotificationsSupported)
        return;
    let saved = false;
    try {
        saved = localStorage.getItem(NATIVE_NOTIFICATIONS_ENABLED_KEY) === 'true';
    }
    catch (error) {
        console.error('[notifications] native notification preference could not be read', error);
    }
    const [permissionError, status] = await catchError(checkNativeNotificationPermission());
    if (permissionError) {
        console.error('[notifications] native notification permission could not be checked', permissionError);
        return;
    }
    nativeNotificationPermission.value = status.display;
    nativeNotificationsEnabled.value = saved && status.display === 'granted';
}
async function enableNativeNotifications() {
    if (!nativeNotificationsSupported)
        return false;
    nativeNotificationsBusy.value = true;
    try {
        const [permissionError, status] = await catchError(requestNativeNotificationPermission());
        if (permissionError) {
            console.error('[notifications] native notification permission request failed', permissionError);
            notify.error(i18n.global.t('notifications.localPermissionError'));
            return false;
        }
        nativeNotificationPermission.value = status.display;
        if (status.display !== 'granted')
            return false;
        const [setupError] = await catchError(prepareNativeNotifications());
        if (setupError) {
            console.error('[notifications] native notification channel setup failed', setupError);
            notify.error(i18n.global.t('notifications.localSetupError'));
            return false;
        }
        try {
            localStorage.setItem(NATIVE_NOTIFICATIONS_ENABLED_KEY, 'true');
        }
        catch (error) {
            console.error('[notifications] native notification preference could not be saved', error);
            notify.error(i18n.global.t('notifications.localSetupError'));
            return false;
        }
        nativeNotificationsEnabled.value = true;
        return true;
    }
    finally {
        nativeNotificationsBusy.value = false;
    }
}
function disableNativeNotifications() {
    if (!nativeNotificationsSupported)
        return;
    try {
        localStorage.setItem(NATIVE_NOTIFICATIONS_ENABLED_KEY, 'false');
        nativeNotificationsEnabled.value = false;
    }
    catch (error) {
        console.error('[notifications] native notification preference could not be saved', error);
        notify.error(i18n.global.t('notifications.localSetupError'));
    }
}
async function refreshPushState() {
    if (!pushSupported || !getAccessToken())
        return;
    permission.value = Notification.permission;
    const [registrationError, reg] = await catchError(registration());
    if (registrationError) {
        pushEnabled.value = false;
        return;
    }
    const [subscriptionError, subscription] = await catchError(Promise.resolve().then(() => reg.pushManager.getSubscription()));
    if (subscriptionError) {
        pushEnabled.value = false;
        return;
    }
    if (!subscription) {
        pushEnabled.value = false;
        return;
    }
    const [statusError, status] = await catchError(getPushStatus(subscription.endpoint));
    if (statusError) {
        pushEnabled.value = false;
        return;
    }
    pushEnabled.value = status;
}
async function enablePush() {
    if (!pushSupported)
        return false;
    pushBusy.value = true;
    try {
        const [permissionError, result] = await catchError(Promise.resolve().then(() => Notification.requestPermission()));
        if (permissionError)
            return false;
        permission.value = result;
        if (result !== 'granted')
            return false;
        const [registrationError, reg] = await catchError(registration());
        if (registrationError)
            return false;
        const [subscriptionError, existing] = await catchError(Promise.resolve().then(() => reg.pushManager.getSubscription()));
        if (subscriptionError)
            return false;
        let subscription = existing;
        if (!subscription) {
            const [keyError, publicKey] = await catchError(getPushPublicKey());
            if (keyError)
                return false;
            const [subscribeError, created] = await catchError(Promise.resolve().then(() => reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) })));
            if (subscribeError)
                return false;
            subscription = created;
        }
        let json;
        try {
            json = subscription.toJSON();
        }
        catch {
            return false;
        }
        if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth)
            return false;
        const [saveError] = await catchError(savePushSubscription({ endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } }));
        if (saveError)
            return false;
        pushEnabled.value = true;
        return true;
    }
    finally {
        pushBusy.value = false;
    }
}
async function disablePush() {
    if (!pushSupported)
        return;
    pushBusy.value = true;
    try {
        const [registrationError, reg] = await catchError(registration());
        if (registrationError)
            return;
        const [subscriptionError, subscription] = await catchError(Promise.resolve().then(() => reg.pushManager.getSubscription()));
        if (subscriptionError)
            return;
        if (subscription) {
            const [removeError] = await catchError(removePushSubscription(subscription.endpoint));
            if (removeError)
                return; // Leave the state as it was; the user can retry.
            const [unsubscribeError] = await catchError(Promise.resolve().then(() => subscription.unsubscribe()));
            if (unsubscribeError)
                return; // Leave the state as it was; the user can retry.
        }
        pushEnabled.value = false;
    }
    finally {
        pushBusy.value = false;
    }
}
async function markAllRead() {
    if (unread.value === 0)
        return;
    items.value = items.value.map((item) => ({ ...item, read: true }));
    unread.value = 0;
    const [error] = await catchError(markNotificationsRead());
    if (error)
        await refresh();
}
async function markRead(id) {
    const target = items.value.find((item) => item.id === id);
    if (!target || target.read)
        return;
    target.read = true;
    unread.value = Math.max(0, unread.value - 1);
    const [error] = await catchError(markNotificationsRead([id]));
    if (error)
        await refresh();
}
async function dismiss(id) {
    const target = items.value.find((item) => item.id === id);
    items.value = items.value.filter((item) => item.id !== id);
    if (target && !target.read)
        unread.value = Math.max(0, unread.value - 1);
    const [error] = await catchError(deleteNotification(id));
    if (error)
        await refresh();
}
export function useNotifications() {
    return {
        items,
        unread,
        isLoading,
        hasUnread: computed(() => unread.value > 0),
        pushSupported,
        nativeNotificationsSupported,
        nativeNotificationsEnabled,
        nativeNotificationsBusy,
        nativeNotificationPermission,
        enabled,
        promptMode,
        loadConfig,
        maybePromptOnLoad,
        pushEnabled,
        pushBusy,
        permission,
        refresh,
        refreshPushState,
        refreshNativeNotificationState,
        enableNativeNotifications,
        disableNativeNotifications,
        enablePush,
        disablePush,
        markAllRead,
        markRead,
        dismiss,
    };
}
