import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import logo from '../../resources/logo/flixer-logo.svg';
import { fetchSetupGate } from '../setup/setupApi';
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const checking = ref(false);
const starting = ref(false);
let timer;
function target() {
    const redirect = route.query.redirect;
    return typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/';
}
// The router guard asks the server again on this navigation, so a recovered server leads straight to the right page.
async function retry() {
    checking.value = true;
    const gate = await fetchSetupGate();
    starting.value = gate.kind === 'unavailable' && gate.reason === 'starting';
    checking.value = false;
    if (gate.kind !== 'unavailable') {
        await router.replace(target());
        return;
    }
    timer = setTimeout(() => void retry(), 5000);
}
onMounted(() => void retry());
onBeforeUnmount(() => clearTimeout(timer));
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(starting, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({
        ...{ class: "fixed inset-0 flex flex-col items-center justify-center gap-6 bg-flixer-background px-6 text-center text-flixer-text" },
    });
    /** @type {__VLS_StyleScopedClasses['fixed']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
        src: (__VLS_unwrap(logo, {})),
        alt: "Flixer",
        ...{ class: "h-8 w-auto" },
    });
    /** @type {__VLS_StyleScopedClasses['h-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-auto']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "max-w-md" },
    });
    /** @type {__VLS_StyleScopedClasses['max-w-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
        ...{ class: "text-2xl font-semibold tracking-tight" },
    });
    /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-tight']} */ ;
    (starting.value ? __VLS_unwrap(t, {})('setup.unavailable.startingTitle') : __VLS_unwrap(t, {})('setup.unavailable.title'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-2 text-sm leading-6 text-flixer-muted" },
        role: "status",
    });
    /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['leading-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (starting.value ? __VLS_unwrap(t, {})('setup.unavailable.startingDescription') : __VLS_unwrap(t, {})('setup.unavailable.description'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (retry) },
        type: "button",
        ...{ class: "h-11 rounded bg-flixer-primary px-6 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60" },
        disabled: (__VLS_unwrap(checking, {})),
    });
    /** @type {__VLS_StyleScopedClasses['h-11']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-primary']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:brightness-110']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
    (__VLS_unwrap(t, {})('setup.retry'));
    // @ts-ignore
    [logo, starting, starting, t, t, t, t, t, checking,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
