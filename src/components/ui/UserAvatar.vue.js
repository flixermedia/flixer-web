import { computed } from 'vue';
import { resolveAvatarUrl } from '../../api';
const { defineProps, } = {};
const props = defineProps();
const src = computed(() => resolveAvatarUrl(props.avatarUrl));
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
    __VLS_withDotValue(src, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "grid size-full place-items-center overflow-hidden bg-gradient-to-br from-flixer-primary to-flixer-secondary text-white" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['size-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-gradient-to-br']} */ ;
    /** @type {__VLS_StyleScopedClasses['from-flixer-primary']} */ ;
    /** @type {__VLS_StyleScopedClasses['to-flixer-secondary']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    if (src.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
            src: (src.value),
            alt: "",
            ...{ class: "size-full object-cover" },
        });
        /** @type {__VLS_StyleScopedClasses['size-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['object-cover']} */ ;
    }
    else if (__VLS_ctx.name) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "font-semibold uppercase" },
            'aria-hidden': "true",
        });
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        (__VLS_ctx.name.charAt(0));
    }
    else {
        let __VLS_0;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
            // @ts-ignore
            icon: "lucide:user-round", ...{ class: "size-1/3" }, 'aria-hidden': "true",
        }));
        const __VLS_2 = __VLS_1({
            icon: "lucide:user-round",
            ...{ class: "size-1/3" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1));
        /** @type {__VLS_StyleScopedClasses['size-1/3']} */ ;
    }
    // @ts-ignore
    [src, src, name, name,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
