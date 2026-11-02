import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import StatusPill from '../StatusPill.vue';
import AdminSection from '../AdminSection.vue';
const { defineProps, } = {};
const props = defineProps();
const { t } = useI18n();
const services = computed(() => [
    { key: 'streamer', ok: props.overview.server.streamer.reachable },
    { key: 'indexer', ok: props.overview.server.indexer.reachable },
]);
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
    const __VLS_0 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('admin.dashboard.widgets.services')), compact: true, ...{ class: "h-full" },
    }));
    const __VLS_2 = __VLS_1({
        title: (__VLS_unwrap(t, {})('admin.dashboard.widgets.services')),
        compact: true,
        ...{ class: "h-full" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
        ...{ class: "flex flex-wrap gap-x-4 gap-y-2 text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-x-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-y-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    const __VLS_6 = __VLS_tryAsConstant((__VLS_unwrap(services, {})));
    for (const [service] of __VLS_vFor(__VLS_nonNull(__VLS_6))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
            key: (service.key),
            ...{ class: "flex items-center gap-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "font-medium" },
        });
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        (__VLS_unwrap(t, {})(`admin.dashboard.serviceNames.${service.key}`));
        const __VLS_7 = StatusPill || StatusPill;
        // @ts-ignore
        const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
            // @ts-ignore
            tone: (service.ok ? 'good' : 'bad'),
        }));
        const __VLS_9 = __VLS_8({
            tone: (service.ok ? 'good' : 'bad'),
        }, ...__VLS_functionalComponentArgsRest(__VLS_8));
        var __VLS_10;
        const { default: __VLS_12 } = __VLS_nonNull(__VLS_10.slots);
        (service.ok ? __VLS_unwrap(t, {})('admin.dashboard.online') : __VLS_unwrap(t, {})('admin.dashboard.offline'));
        // @ts-ignore
        [t, t, t, t, services,];
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
