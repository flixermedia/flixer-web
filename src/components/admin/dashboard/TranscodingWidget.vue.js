import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AdminSection from '../AdminSection.vue';
const { defineProps, } = {};
const props = defineProps();
const { t } = useI18n();
const streamer = computed(() => props.overview.server.streamer);
const pct = computed(() => (streamer.value.maxTranscodes > 0 ? Math.min(100, Math.round((streamer.value.activeTranscodes / streamer.value.maxTranscodes) * 100)) : 0));
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
    __VLS_withDotValue(streamer, {});
    const __VLS_0 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('admin.dashboard.widgets.transcoding')), ...{ class: "h-full" },
    }));
    const __VLS_2 = __VLS_1({
        title: (__VLS_unwrap(t, {})('admin.dashboard.widgets.transcoding')),
        ...{ class: "h-full" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    if (!streamer.value.reachable) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm text-red-200" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-200']} */ ;
        (__VLS_unwrap(t, {})('admin.dashboard.offline'));
    }
    else if (!streamer.value.transcodingAvailable) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.dashboard.transcodingUnavailable'));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-3xl font-semibold" },
        });
        /** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        (streamer.value.activeTranscodes);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-sm font-normal text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-normal']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (streamer.value.maxTranscodes);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-3 h-2 overflow-hidden rounded-full bg-white/10" },
            role: "progressbar",
            'aria-valuenow': (__VLS_unwrap(pct, {})),
            'aria-valuemin': "0",
            'aria-valuemax': "100",
        });
        /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "h-full rounded-full bg-linear-to-r from-flixer-primary to-flixer-cyan" },
            ...{ style: ({ width: `${__VLS_unwrap(pct, {})}%` }) },
        });
        /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-linear-to-r']} */ ;
        /** @type {__VLS_StyleScopedClasses['from-flixer-primary']} */ ;
        /** @type {__VLS_StyleScopedClasses['to-flixer-cyan']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-2 text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.dashboard.streamSessions', { count: streamer.value.sessions }));
    }
    // @ts-ignore
    [t, t, t, t, streamer, streamer, streamer, streamer, streamer, pct, pct,];
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
