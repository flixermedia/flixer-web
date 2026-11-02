import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { exchangeNativePasskeyHandoff, saveAccessToken } from '../api';
import { clearPendingNativePasskeyHandoff, getPendingNativePasskeyHandoff } from '../platform/passkeyHandoff';
import { syncLocaleFromAccount } from '../i18n';
import { useProfile } from '../composables/useProfile';
import { saveNativeAccount } from '../platform/nativeAccount';
import { notify } from '../composables/notify';
import { catchError } from '../utils/catchError';
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const error = ref('');
const isCompleting = ref(true);
onMounted(() => void completeHandoff());
async function completeHandoff() {
    const state = typeof route.query.state === 'string' ? route.query.state : '';
    const pending = getPendingNativePasskeyHandoff();
    if (!pending || state !== pending.state) {
        error.value = t('auth.passkeyHandoffExpired');
        isCompleting.value = false;
        return;
    }
    if (route.query.cancelled === '1') {
        clearPendingNativePasskeyHandoff();
        error.value = t('auth.passkeyHandoffCancelled');
        isCompleting.value = false;
        return;
    }
    const code = typeof route.query.code === 'string' ? route.query.code : '';
    if (!code) {
        error.value = t('auth.passkeyHandoffExpired');
        isCompleting.value = false;
        return;
    }
    const [exchangeError, result] = await catchError(exchangeNativePasskeyHandoff({ code, codeVerifier: pending.codeVerifier, state }));
    if (exchangeError) {
        console.error('[passkey] native handoff exchange failed', exchangeError);
        error.value = t('auth.passkeyHandoffFailed');
        isCompleting.value = false;
        return;
    }
    clearPendingNativePasskeyHandoff();
    useProfile().clear();
    saveAccessToken(result.accessToken);
    const [saveError] = await catchError(Promise.resolve().then(() => saveNativeAccount(result.user.username)));
    if (saveError) {
        console.warn('[native-account] Could not save the account for reinstall recovery', saveError);
        notify.error(t('auth.rememberAccountFailed'));
    }
    const [localeError] = await catchError(syncLocaleFromAccount());
    if (localeError) {
        console.error('[passkey] native handoff exchange failed', localeError);
        error.value = t('auth.passkeyHandoffFailed');
        isCompleting.value = false;
        return;
    }
    const redirect = pending.redirect;
    const destination = redirect?.startsWith('/') && !redirect.startsWith('//') ? redirect : '/';
    const [navigationError] = await catchError(router.replace(destination));
    if (navigationError) {
        console.error('[passkey] native handoff exchange failed', navigationError);
        error.value = t('auth.passkeyHandoffFailed');
        isCompleting.value = false;
    }
}
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(isCompleting, {});
    __VLS_withDotValue(router, {});
    void {};
    __VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({
        ...{ class: "passkey-main grid min-h-[100dvh] place-items-center bg-flixer-background p-6 text-flixer-text" },
    });
    /** @type {__VLS_StyleScopedClasses['passkey-main']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-h-[100dvh]']} */ ;
    /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "w-full max-w-md rounded border border-flixer-border bg-flixer-surface p-6 text-center" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    if (isCompleting.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm text-flixer-muted" },
            role: "status",
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('auth.passkeyHandoffCompleting'));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm text-flixer-muted" },
            role: "alert",
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(error, {}));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!!(isCompleting.value))
                        throw 0;
                    return (router.value.replace({ name: 'login' }));
                    // @ts-ignore
                    [isCompleting, t, error, router,];
                } },
            type: "button",
            ...{ class: "mt-5 rounded border border-flixer-border px-4 py-2 text-sm font-semibold hover:bg-white/5" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/5']} */ ;
        (__VLS_unwrap(t, {})('auth.backToSignIn'));
    }
    // @ts-ignore
    [t,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
