import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import logo from '../../resources/logo/flixer-logo.svg';
import { configureNativeServer, disconnectNativeServer } from '../api';
import { useProfile } from '../composables/useProfile';
import { getNativeServerUrl, isNativeApp } from '../platform/serverConnection';
import { fetchSetupGate } from '../setup/setupApi';
import { resetSetupGate } from '../setup/setupGate';
import { catchError } from '../utils/catchError';
const { t } = useI18n();
const router = useRouter();
const serverUrl = ref('');
const isConnecting = ref(false);
const error = ref('');
onMounted(() => {
    if (!isNativeApp()) {
        void router.replace({ name: 'login' });
        return;
    }
    serverUrl.value = getNativeServerUrl();
});
async function connect() {
    error.value = '';
    isConnecting.value = true;
    try {
        let changed;
        try {
            changed = configureNativeServer(serverUrl.value);
        }
        catch (cause) {
            error.value = cause instanceof Error && cause.message === 'invalid' ? t('native.invalidServerUrl') : t('native.serverUnreachable');
            return;
        }
        if (changed) {
            useProfile().clear();
            resetSetupGate();
        }
        const [gateError, gate] = await catchError(fetchSetupGate());
        if (gateError || gate.kind === 'unavailable') {
            const cause = gateError ?? new Error('unreachable');
            error.value = cause instanceof Error && cause.message === 'invalid' ? t('native.invalidServerUrl') : t('native.serverUnreachable');
            return;
        }
        const [navigationError] = await catchError(router.replace({ name: gate.kind === 'setup' ? 'setup' : 'login' }));
        if (navigationError) {
            const cause = navigationError;
            error.value = cause instanceof Error && cause.message === 'invalid' ? t('native.invalidServerUrl') : t('native.serverUnreachable');
        }
    }
    finally {
        isConnecting.value = false;
    }
}
function resetServer() {
    disconnectNativeServer();
    serverUrl.value = '';
    useProfile().clear();
    resetSetupGate();
}
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(error, {});
    __VLS_withDotValue(isConnecting, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({
        ...{ class: "flex min-h-screen items-center justify-center bg-flixer-background px-5 py-10 text-flixer-text" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-h-screen']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "w-full max-w-md rounded border border-flixer-border bg-flixer-surface/80 p-7 shadow-2xl sm:p-9" },
        'aria-labelledby': "connect-title",
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/80']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-7']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:p-9']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
        src: (__VLS_unwrap(logo, {})),
        alt: "",
        ...{ class: "mx-auto mb-5 size-16 rounded" },
        'aria-hidden': "true",
    });
    /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['size-16']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
        id: "connect-title",
        ...{ class: "text-center text-2xl font-bold" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    (__VLS_unwrap(t, {})('native.connectTitle'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-3 text-center text-sm leading-6 text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['leading-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('native.connectDescription'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (connect) },
        ...{ class: "mt-7 space-y-4" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-7']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "server-url",
        ...{ class: "block text-sm font-medium" },
    });
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    (__VLS_unwrap(t, {})('native.serverUrlLabel'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        id: "server-url",
        type: "url",
        inputmode: "url",
        autocomplete: "url",
        autocapitalize: "none",
        spellcheck: "false",
        required: true,
        placeholder: "https://flixer.example.com",
        ...{ class: "w-full rounded border border-flixer-border bg-flixer-background px-4 py-3 text-flixer-text outline-none focus:border-flixer-accent" },
    });
    (__VLS_unwrap(serverUrl, {}));
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
    /** @type {__VLS_StyleScopedClasses['outline-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:border-flixer-accent']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs leading-5 text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['leading-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('native.serverUrlHelp'));
    if (error.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm text-red-400" },
            role: "alert",
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-400']} */ ;
        (error.value);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        type: "submit",
        disabled: (isConnecting.value),
        ...{ class: "w-full rounded bg-flixer-primary px-5 py-3 font-semibold text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-primary']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:brightness-110']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled:cursor-wait']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
    (isConnecting.value ? __VLS_unwrap(t, {})('native.connecting') : __VLS_unwrap(t, {})('native.connectButton'));
    if (__VLS_unwrap(getNativeServerUrl, {})()) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (resetServer) },
            type: "button",
            ...{ class: "mt-5 w-full text-sm text-flixer-muted underline hover:text-flixer-text" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        /** @type {__VLS_StyleScopedClasses['underline']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-flixer-text']} */ ;
        (__VLS_unwrap(t, {})('native.forgetServer'));
    }
    // @ts-ignore
    [logo, t, t, t, t, t, t, t, serverUrl, error, error, isConnecting, isConnecting, getNativeServerUrl,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
