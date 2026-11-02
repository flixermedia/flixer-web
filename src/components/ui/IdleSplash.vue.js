import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import logoUrl from '../../../resources/logo/flixer-logo.svg';
import { useAudioPlayer } from '../../composables/useAudioPlayer';
import AuthImage from './AuthImage.vue';
const { t, locale } = useI18n();
const { current, isPlaying } = useAudioPlayer();
const now = ref(new Date());
let tick;
onMounted(() => {
    tick = setInterval(() => (now.value = new Date()), 10_000);
});
onBeforeUnmount(() => clearInterval(tick));
const time = () => now.value.toLocaleTimeString(locale.value, { hour: 'numeric', minute: '2-digit' });
const date = () => now.value.toLocaleDateString(locale.value, { weekday: 'long', month: 'long', day: 'numeric' });
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(current, {});
    __VLS_withDotValue(isPlaying, {});
    void {};
    /** @type {__VLS_StyleScopedClasses['logo']} */ ;
    /** @type {__VLS_StyleScopedClasses['drift']} */ ;
    /** @type {__VLS_StyleScopedClasses['orb']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "idle-splash fixed inset-0 z-[100] cursor-none select-none overflow-hidden bg-flixer-background" },
        role: "dialog",
        'aria-modal': "true",
        'aria-label': (__VLS_unwrap(t, {})('idle.title')),
    });
    /** @type {__VLS_StyleScopedClasses['idle-splash']} */ ;
    /** @type {__VLS_StyleScopedClasses['fixed']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-[100]']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['select-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "orb orb-a" },
        'aria-hidden': "true",
    });
    /** @type {__VLS_StyleScopedClasses['orb']} */ ;
    /** @type {__VLS_StyleScopedClasses['orb-a']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "orb orb-b" },
        'aria-hidden': "true",
    });
    /** @type {__VLS_StyleScopedClasses['orb']} */ ;
    /** @type {__VLS_StyleScopedClasses['orb-b']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "orb orb-c" },
        'aria-hidden': "true",
    });
    /** @type {__VLS_StyleScopedClasses['orb']} */ ;
    /** @type {__VLS_StyleScopedClasses['orb-c']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "drift absolute inset-0 grid place-items-center" },
    });
    /** @type {__VLS_StyleScopedClasses['drift']} */ ;
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-col items-center gap-6 text-center" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
        src: (__VLS_unwrap(logoUrl, {})),
        alt: "",
        ...{ class: "logo size-28 sm:size-36" },
    });
    /** @type {__VLS_StyleScopedClasses['logo']} */ ;
    /** @type {__VLS_StyleScopedClasses['size-28']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:size-36']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-4xl font-semibold tracking-tight text-white sm:text-5xl" },
    });
    /** @type {__VLS_StyleScopedClasses['text-4xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-tight']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:text-5xl']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-3xl font-light tabular-nums text-white/90" },
    });
    /** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-light']} */ ;
    /** @type {__VLS_StyleScopedClasses['tabular-nums']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white/90']} */ ;
    (__VLS_unwrap(time, {})());
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-1 text-sm text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(date, {})());
    if (current.value && isPlaying.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex max-w-xs items-center gap-3 rounded bg-white/5 p-2 pr-4 text-left backdrop-blur" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['max-w-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/5']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['pr-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
        /** @type {__VLS_StyleScopedClasses['backdrop-blur']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "size-12 shrink-0 overflow-hidden rounded bg-flixer-surface" },
        });
        /** @type {__VLS_StyleScopedClasses['size-12']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
        if (current.value.art) {
            const __VLS_0 = AuthImage;
            // @ts-ignore
            const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
                // @ts-ignore
                scope: "library", itemId: (current.value.art.itemId), index: (current.value.art.index), version: (current.value.art.version), width: (96), alt: "",
            }));
            const __VLS_2 = __VLS_1({
                scope: "library",
                itemId: (current.value.art.itemId),
                index: (current.value.art.index),
                version: (current.value.art.version),
                width: (96),
                alt: "",
            }, ...__VLS_functionalComponentArgsRest(__VLS_1));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "min-w-0" },
        });
        /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "truncate text-sm font-semibold text-white" },
        });
        /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        (current.value.title);
        if (current.value.artist) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "truncate text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (current.value.artist);
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "absolute inset-x-0 bottom-6 text-center text-xs text-flixer-muted/70" },
    });
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-x-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['bottom-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted/70']} */ ;
    (__VLS_unwrap(t, {})('idle.hint'));
    // @ts-ignore
    [t, t, logoUrl, time, date, current, current, current, current, current, current, current, current, isPlaying,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
