import { computed } from 'vue';
const { defineProps, } = {};
const props = defineProps();
const toneClass = computed(() => ({
    good: 'bg-emerald-500/20 text-emerald-300',
    warn: 'bg-amber-500/20 text-amber-300',
    bad: 'bg-red-500/20 text-red-200',
    accent: 'bg-flixer-primary/25 text-flixer-accent',
    neutral: 'bg-white/10 text-flixer-muted',
})[props.tone ?? 'neutral']);
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "inline-flex items-center rounded px-3 py-1 text-xs font-semibold" },
        ...{ class: (__VLS_unwrap(toneClass, {})) },
    });
    /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    var __VLS_0 = {};
    var __VLS_1 = __VLS_0;
    // @ts-ignore
    [toneClass,];
    return {
        __VLS_Slots: {},
    };
};
void [__VLS_template, {}];
const __VLS_base = (await import('vue')).defineComponent({
    __typeProps: {},
});
const __VLS_export = {};
export default {};
