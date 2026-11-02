const { defineProps, defineModel, } = {};
const __VLS_props = defineProps();
const model = defineModel({ default: false });
const __VLS_defaultModels = {
    'modelValue': false,
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "cursor-pointer items-center" },
        ...{ class: (__VLS_ctx.compact ? 'inline-flex gap-3' : 'flex justify-between gap-4 py-2') },
    });
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "min-w-0" },
    });
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "flex items-center gap-2 text-sm font-medium" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    (__VLS_ctx.label);
    if (__VLS_ctx.badge) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "rounded-full border border-flixer-accent/40 bg-flixer-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-flixer-accent" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-accent/40']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-accent/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
        (__VLS_ctx.badge);
    }
    if (__VLS_ctx.description) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "mt-0.5 block text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-0.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_ctx.description);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "checkbox",
        role: "switch",
        ...{ class: "peer sr-only" },
    });
    (__VLS_unwrap(model, {}));
    /** @type {__VLS_StyleScopedClasses['peer']} */ ;
    /** @type {__VLS_StyleScopedClasses['sr-only']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "relative h-6 w-11 shrink-0 rounded-full bg-white/15 transition after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:transition peer-checked:bg-flixer-primary peer-checked:after:translate-x-5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-flixer-accent" },
        'aria-hidden': "true",
    });
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-11']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white/15']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['after:absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['after:left-0.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['after:top-0.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['after:size-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['after:rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['after:bg-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['after:transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['peer-checked:bg-flixer-primary']} */ ;
    /** @type {__VLS_StyleScopedClasses['peer-checked:after:translate-x-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['peer-focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['peer-focus-visible:outline-offset-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['peer-focus-visible:outline-flixer-accent']} */ ;
    // @ts-ignore
    [compact, label, badge, badge, description, description, model,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};
