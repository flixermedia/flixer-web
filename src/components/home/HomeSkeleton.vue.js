import { useI18n } from 'vue-i18n';
import Skeleton from '../ui/Skeleton.vue';
const { defineProps, withDefaults, } = {};
/** Placeholder for the home page: a few rows of cards. */
const { t } = useI18n();
const __VLS_props = withDefaults(defineProps(), { rows: 3 });
const __VLS_defaults = { rows: 3 };
void __VLS_defaults;
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-8 pt-2" },
        role: "status",
        'aria-label': (__VLS_unwrap(t, {})('common.loading')),
        'aria-busy': "true",
    });
    /** @type {__VLS_StyleScopedClasses['space-y-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-2']} */ ;
    const __VLS_0 = __VLS_tryAsConstant((__VLS_ctx.rows));
    for (const [row] of __VLS_vFor(__VLS_nonNull(__VLS_0))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            key: (row),
            ...{ class: "page-gutter" },
        });
        /** @type {__VLS_StyleScopedClasses['page-gutter']} */ ;
        const __VLS_1 = Skeleton;
        // @ts-ignore
        const __VLS_2 = __VLS_asFunctionalComponent1(__VLS_1, new __VLS_1({
            // @ts-ignore
            ...{ class: "mb-3 h-5 w-40" },
        }));
        const __VLS_3 = __VLS_2({
            ...{ class: "mb-3 h-5 w-40" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_2));
        /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-40']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex gap-3 overflow-hidden" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
        const __VLS_6 = __VLS_tryAsConstant((8));
        for (const [n] of __VLS_vFor(__VLS_nonNull(__VLS_6))) {
            const __VLS_7 = Skeleton;
            // @ts-ignore
            const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
                // @ts-ignore
                key: (n), ...{ class: "aspect-[2/3] w-36 shrink-0 rounded sm:w-44" },
            }));
            const __VLS_9 = __VLS_8({
                key: (n),
                ...{ class: "aspect-[2/3] w-36 shrink-0 rounded sm:w-44" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_8));
            /** @type {__VLS_StyleScopedClasses['aspect-[2/3]']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-36']} */ ;
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['sm:w-44']} */ ;
            // @ts-ignore
            [t, rows,];
        }
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __defaults: __VLS_defaults,
    __typeProps: {},
});
export default {};
