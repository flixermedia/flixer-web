import { aspectClasses } from './classes';
const { defineProps, } = {};
const __VLS_props = defineProps();
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
    __VLS_withDotValue(aspectClasses, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "relative w-full overflow-hidden rounded border border-white/10 bg-flixer-background" },
        ...{ class: (aspectClasses.value[__VLS_ctx.image.aspect ?? 'poster']) },
    });
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
        src: (__VLS_ctx.image.src),
        alt: (__VLS_ctx.image.alt),
        loading: "lazy",
        referrerpolicy: "no-referrer",
        ...{ class: "size-full object-cover" },
    });
    /** @type {__VLS_StyleScopedClasses['size-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['object-cover']} */ ;
    // @ts-ignore
    [aspectClasses, image, image, image,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
