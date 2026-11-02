import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';
import { useActivityFormat } from '../../../composables/useActivityFormat';
import AdminSection from '../AdminSection.vue';
const { defineProps, } = {};
const ACTIVITY_PREVIEW = 3;
const props = defineProps();
const { t } = useI18n();
const { relativeTime, activityTitle, activityVerb } = useActivityFormat();
const rows = computed(() => props.overview.activity.slice(0, ACTIVITY_PREVIEW).map((entry) => ({ user: entry.user, verb: activityVerb(entry), title: activityTitle(entry), time: relativeTime(entry.at) })));
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
    __VLS_withDotValue(rows, {});
    const __VLS_0 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('admin.overview.recentActivityTitle')), description: (__VLS_unwrap(t, {})('admin.overview.recentActivityDescription')), ...{ class: "h-full" },
    }));
    const __VLS_2 = __VLS_1({
        title: (__VLS_unwrap(t, {})('admin.overview.recentActivityTitle')),
        description: (__VLS_unwrap(t, {})('admin.overview.recentActivityDescription')),
        ...{ class: "h-full" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
        ...{ class: "grid gap-3 text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    const __VLS_6 = __VLS_tryAsConstant((rows.value));
    for (const [row, i] of __VLS_vFor(__VLS_nonNull(__VLS_6))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
            key: (i),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "font-semibold" },
        });
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        (row.user);
        (row.verb);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (row.title);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (row.time);
        // @ts-ignore
        [t, t, rows,];
    }
    if (rows.value.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
            ...{ class: "text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.overview.noActivity'));
    }
    let __VLS_7;
    /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
    RouterLink;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        // @ts-ignore
        to: ({ name: 'admin-activity' }), ...{ class: "mt-4 inline-block text-sm font-semibold text-flixer-accent hover:underline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
    }));
    const __VLS_9 = __VLS_8({
        to: ({ name: 'admin-activity' }),
        ...{ class: "mt-4 inline-block text-sm font-semibold text-flixer-accent hover:underline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['inline-block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:underline']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    var __VLS_10;
    const { default: __VLS_12 } = __VLS_nonNull(__VLS_10.slots);
    (__VLS_unwrap(t, {})('admin.overview.viewAllActivity'));
    // @ts-ignore
    [t, t, rows,];
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
