import { useI18n } from 'vue-i18n';
import Skeleton from './Skeleton.vue';
const { defineProps, withDefaults, } = {};
/** Placeholder for a wrapped grid of artwork cards (browse, search, person pages). */
const { t } = useI18n();
const __VLS_props = withDefaults(defineProps(), { count: 12, square: false });
const __VLS_defaults = { count: 12, square: false };
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
        ...{ class: "grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-x-4 gap-y-6 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]" },
        role: "status",
        'aria-label': (__VLS_unwrap(t, {})('common.loading')),
        'aria-busy': "true",
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid-cols-[repeat(auto-fill,minmax(9rem,1fr))]']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-x-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-y-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]']} */ ;
    const __VLS_0 = __VLS_tryAsConstant((__VLS_ctx.count));
    for (const [n] of __VLS_vFor(__VLS_nonNull(__VLS_0))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
            key: (n),
        });
        const __VLS_1 = Skeleton;
        // @ts-ignore
        const __VLS_2 = __VLS_asFunctionalComponent1(__VLS_1, new __VLS_1({
            // @ts-ignore
            ...{ class: (__VLS_ctx.square ? 'aspect-square' : 'aspect-[2/3]') }, ...{ class: "w-full rounded" },
        }));
        const __VLS_3 = __VLS_2({
            ...{ class: (__VLS_ctx.square ? 'aspect-square' : 'aspect-[2/3]') },
            ...{ class: "w-full rounded" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_2));
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        const __VLS_6 = Skeleton;
        // @ts-ignore
        const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
            // @ts-ignore
            ...{ class: "mt-2 h-3.5 w-3/4" },
        }));
        const __VLS_8 = __VLS_7({
            ...{ class: "mt-2 h-3.5 w-3/4" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_7));
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-3/4']} */ ;
        const __VLS_11 = Skeleton;
        // @ts-ignore
        const __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11({
            // @ts-ignore
            ...{ class: "mt-1.5 h-3 w-1/3" },
        }));
        const __VLS_13 = __VLS_12({
            ...{ class: "mt-1.5 h-3 w-1/3" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_12));
        /** @type {__VLS_StyleScopedClasses['mt-1.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-1/3']} */ ;
        // @ts-ignore
        [t, count, square,];
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
