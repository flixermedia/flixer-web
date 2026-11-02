import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { getIndexerStatus } from '../../../api';
import AdminSection from '../AdminSection.vue';
import { useWidgetData } from './useWidgetData';
const { t } = useI18n();
const { data, failed } = useWidgetData(getIndexerStatus, 5000);
const totals = computed(() => {
    const queues = data.value?.queues ?? [];
    const sum = (pick) => queues.reduce((total, q) => total + pick(q), 0);
    return { pending: sum((q) => q.pending), active: sum((q) => q.active), retry: sum((q) => q.retry), failed: sum((q) => q.failed) };
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(failed, {});
    __VLS_withDotValue(data, {});
    __VLS_withDotValue(totals, {});
    const __VLS_0 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('admin.dashboard.widgets.queues')), ...{ class: "h-full" },
    }));
    const __VLS_2 = __VLS_1({
        title: (__VLS_unwrap(t, {})('admin.dashboard.widgets.queues')),
        ...{ class: "h-full" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    if (failed.value && !data.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm text-red-200" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-200']} */ ;
        (__VLS_unwrap(t, {})('admin.dashboard.loadError'));
    }
    else if (data.value && !data.value.reachable) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm text-red-200" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-200']} */ ;
        (__VLS_unwrap(t, {})('admin.dashboard.offline'));
    }
    else if (data.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.dl, __VLS_intrinsics.dl)({
            ...{ class: "grid grid-cols-2 gap-3 text-sm" },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        const __VLS_6 = __VLS_tryAsConstant(['active', 'pending', 'retry', 'failed']);
        for (const [key] of __VLS_vFor(__VLS_nonNull(__VLS_6))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (key),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
                ...{ class: "text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})(`admin.dashboard.queueStates.${key}`));
            __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
                ...{ class: "text-2xl font-semibold" },
                ...{ class: (key === 'failed' && totals.value.failed > 0 && 'text-red-300') },
            });
            /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            (totals.value[key]);
            // @ts-ignore
            [t, t, t, t, failed, data, data, data, data, totals, totals,];
        }
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('common.loading'));
    }
    // @ts-ignore
    [t,];
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
