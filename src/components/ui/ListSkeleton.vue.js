import { useI18n } from 'vue-i18n';
import Skeleton from './Skeleton.vue';
const { defineProps, withDefaults, } = {};
/** Placeholder for a settings or admin panel's rows while its data loads. */
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
        ...{ class: "space-y-3" },
        role: "status",
        'aria-label': (__VLS_unwrap(t, {})('common.loading')),
        'aria-busy': "true",
    });
    /** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
    const __VLS_0 = __VLS_tryAsConstant((__VLS_ctx.rows));
    for (const [n] of __VLS_vFor(__VLS_nonNull(__VLS_0))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (n),
            ...{ class: "flex items-center gap-3" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        const __VLS_1 = Skeleton;
        // @ts-ignore
        const __VLS_2 = __VLS_asFunctionalComponent1(__VLS_1, new __VLS_1({
            // @ts-ignore
            ...{ class: "size-9 shrink-0 rounded-full" },
        }));
        const __VLS_3 = __VLS_2({
            ...{ class: "size-9 shrink-0 rounded-full" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_2));
        /** @type {__VLS_StyleScopedClasses['size-9']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "min-w-0 flex-1 space-y-2" },
        });
        /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
        const __VLS_6 = Skeleton;
        // @ts-ignore
        const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
            // @ts-ignore
            ...{ class: "h-3.5 w-2/5" },
        }));
        const __VLS_8 = __VLS_7({
            ...{ class: "h-3.5 w-2/5" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_7));
        /** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-2/5']} */ ;
        const __VLS_11 = Skeleton;
        // @ts-ignore
        const __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11({
            // @ts-ignore
            ...{ class: "h-3 w-3/5" },
        }));
        const __VLS_13 = __VLS_12({
            ...{ class: "h-3 w-3/5" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_12));
        /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-3/5']} */ ;
        // @ts-ignore
        [t, rows,];
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
