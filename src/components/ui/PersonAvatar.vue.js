import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { fetchPersonImage } from '../../api';
import { limitedImageLoad } from '../../composables/imageQueue';
import AuthImage from './AuthImage.vue';
import { catchError } from '../../utils/catchError';
const { defineProps, } = {};
const props = defineProps();
const src = ref('');
let objectUrl = '';
let request = 0;
const initials = computed(() => props.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?');
function release() {
    if (objectUrl)
        URL.revokeObjectURL(objectUrl);
    objectUrl = '';
}
async function load() {
    const current = ++request;
    release();
    src.value = '';
    if (!props.hasImage)
        return;
    const width = Math.ceil(props.width * Math.min(window.devicePixelRatio || 1, 2));
    const [failure, blob] = await catchError(limitedImageLoad(() => fetchPersonImage(props.personId, width)));
    if (failure) {
        // Falls back to the artwork or initials.
        return;
    }
    if (current !== request)
        return;
    objectUrl = URL.createObjectURL(blob);
    src.value = objectUrl;
}
watch(() => [props.personId, props.hasImage, props.width], load, { immediate: true });
onBeforeUnmount(() => {
    request++;
    release();
});
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "relative overflow-hidden bg-flixer-surface" },
        role: "img",
        'aria-label': (__VLS_ctx.name),
    });
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
    if (src.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
            src: (src.value),
            alt: "",
            ...{ class: "size-full object-cover object-top" },
        });
        /** @type {__VLS_StyleScopedClasses['size-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['object-cover']} */ ;
        /** @type {__VLS_StyleScopedClasses['object-top']} */ ;
    }
    else if (__VLS_ctx.fallback) {
        const __VLS_0 = AuthImage;
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
            // @ts-ignore
            scope: "library", itemId: (__VLS_ctx.fallback.itemId), index: (__VLS_ctx.fallback.index), version: (__VLS_ctx.fallback.version), width: (__VLS_ctx.width), alt: "",
        }));
        const __VLS_2 = __VLS_1({
            scope: "library",
            itemId: (__VLS_ctx.fallback.itemId),
            index: (__VLS_ctx.fallback.index),
            version: (__VLS_ctx.fallback.version),
            width: (__VLS_ctx.width),
            alt: "",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "grid size-full place-items-center text-sm font-semibold text-flixer-muted" },
            'aria-hidden': "true",
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(initials, {}));
    }
    // @ts-ignore
    [name, src, src, fallback, fallback, fallback, fallback, width, initials,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
