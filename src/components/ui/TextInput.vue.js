import { useId } from 'vue';
const { defineProps, defineModel, defineOptions, } = {};
defineOptions({ inheritAttrs: false });
const __VLS_props = defineProps();
const [model, modifiers] = defineModel({
    default: '',
    set: (value) => (modifiers.trim ? value.trim() : value),
});
const id = useId();
const __VLS_defaultModels = {
    'modelValue': '',
};
void __VLS_defaultModels;
let __VLS_modelEmit;
const __VLS_ctx = {
    ...{},
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
        ...{ class: "flex min-w-0 flex-col gap-2" },
        ...{ class: (__VLS_ctx.$attrs.class) },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    if (__VLS_ctx.label) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            for: (__VLS_unwrap(id, {})),
            ...{ class: "text-xs font-semibold text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_ctx.label);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        id: (__VLS_unwrap(id, {})),
        ...({ ...__VLS_ctx.$attrs, class: undefined }),
        ...{ class: "h-12 w-full min-w-0 rounded border border-flixer-border bg-flixer-surface/50 px-4 text-base text-flixer-text outline-none placeholder:text-flixer-muted/70 focus:border-flixer-accent/60 disabled:opacity-60 sm:text-sm" },
    });
    (__VLS_unwrap(model, {}));
    /** @type {__VLS_StyleScopedClasses['h-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/50']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-base']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
    /** @type {__VLS_StyleScopedClasses['outline-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['placeholder:text-flixer-muted/70']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:border-flixer-accent/60']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:text-sm']} */ ;
    if (__VLS_ctx.hint) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_ctx.hint);
    }
    // @ts-ignore
    [$attrs, $attrs, label, label, id, id, model, hint, hint,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};
