import { useI18n } from 'vue-i18n';
const { defineProps, withDefaults, } = {};
const __VLS_props = withDefaults(defineProps(), { label: false });
const { t } = useI18n();
const __VLS_defaults = { label: false };
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
        ...{ class: "animate-pulse rounded bg-white/10 motion-reduce:animate-none" },
        role: (__VLS_ctx.label ? 'status' : undefined),
        'aria-label': (__VLS_ctx.label ? __VLS_unwrap(t, {})('common.loading') : undefined),
        'aria-hidden': (__VLS_ctx.label ? undefined : true),
    });
    /** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
    /** @type {__VLS_StyleScopedClasses['motion-reduce:animate-none']} */ ;
    // @ts-ignore
    [label, label, label, t,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __defaults: __VLS_defaults,
    __typeProps: {},
});
export default {};
