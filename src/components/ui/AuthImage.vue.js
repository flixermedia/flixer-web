import { onBeforeUnmount, ref, watch } from 'vue';
import { fetchHomeImage, fetchMediaImage } from '../../api';
import { limitedImageLoad } from '../../composables/imageQueue';
import { fetchCachedImageBlob } from '../../composables/imageBlobCache';
import { catchError } from '../../utils/catchError';
const { defineProps, withDefaults, } = {};
const props = withDefaults(defineProps(), { scope: 'admin', imgClass: 'size-full object-cover' });
/** The server scales to the width asked for, so request what the element needs (in CSS px) plus room for high-density screens. */
function pixelWidth() {
    if (!props.width)
        return undefined;
    return Math.ceil(props.width * Math.min(window.devicePixelRatio || 1, 2));
}
const src = ref('');
const failed = ref(false);
let objectUrl = '';
let request = 0;
function release() {
    if (objectUrl)
        URL.revokeObjectURL(objectUrl);
    objectUrl = '';
}
async function load() {
    const current = ++request;
    failed.value = false;
    const width = pixelWidth();
    const cacheKey = JSON.stringify([props.scope, props.itemId, props.index, width ?? 'original', props.version ?? '']);
    const fetcher = () => (props.scope === 'admin'
        ? fetchMediaImage(props.itemId, props.index, width, props.version)
        : fetchHomeImage(props.itemId, props.index, width, props.version));
    if (current !== request)
        return;
    const [failure, blob] = await catchError(fetchCachedImageBlob(cacheKey, () => limitedImageLoad(() => fetcher().catch(() => fetcher())), props.version));
    if (failure) {
        if (current === request) {
            release();
            src.value = '';
            failed.value = true;
        }
        return;
    }
    if (current !== request)
        return;
    release();
    objectUrl = URL.createObjectURL(blob);
    src.value = objectUrl;
}
watch(() => [props.itemId, props.index, props.version, props.scope, props.width], load, { immediate: true });
onBeforeUnmount(() => {
    request++;
    release();
});
const __VLS_defaults = { scope: 'admin', imgClass: 'size-full object-cover' };
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
    __VLS_withDotValue(src, {});
    __VLS_withDotValue(failed, {});
    if (src.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
            src: (src.value),
            alt: (__VLS_ctx.alt),
            loading: "lazy",
            ...{ class: (__VLS_ctx.imgClass) },
        });
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "flex size-full items-center justify-center text-[10px] text-flixer-muted" },
            ...{ class: (failed.value ? '' : 'animate-pulse bg-white/10 motion-reduce:animate-none') },
            'aria-label': (__VLS_ctx.alt),
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (failed.value ? '⚠' : '');
    }
    // @ts-ignore
    [src, src, alt, alt, imgClass, failed, failed,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __defaults: __VLS_defaults,
    __typeProps: {},
});
export default {};
