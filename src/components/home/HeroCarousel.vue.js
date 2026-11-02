import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';
import AuthImage from '../ui/AuthImage.vue';
const { defineProps, } = {};
const props = defineProps();
const { t } = useI18n();
const AUTOPLAY_MS = 8000;
const activeSlide = ref(0);
const currentItem = computed(() => props.items[activeSlide.value]);
function titleSize(title) {
    if (title.length > 32)
        return 'text-3xl sm:text-4xl lg:text-5xl tracking-[0.06em]';
    if (title.length > 20)
        return 'text-4xl sm:text-5xl lg:text-6xl tracking-[0.08em]';
    if (title.length > 12)
        return 'text-5xl sm:text-6xl lg:text-7xl tracking-[0.1em]';
    return 'text-5xl sm:text-7xl lg:text-8xl tracking-[0.1em]';
}
function typeLabel(item) {
    return t(`home.itemType.${item.type}`);
}
function runtimeLabel(minutes) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return hours > 0 ? `${hours}h ${rest}m` : `${rest}m`;
}
let timer;
function startAutoplay() {
    stopAutoplay();
    if (props.items.length > 1) {
        timer = setInterval(() => {
            activeSlide.value = (activeSlide.value + 1) % props.items.length;
        }, AUTOPLAY_MS);
    }
}
function stopAutoplay() {
    clearInterval(timer);
}
function selectSlide(index) {
    activeSlide.value = index;
    startAutoplay();
}
onMounted(startAutoplay);
onBeforeUnmount(stopAutoplay);
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
    __VLS_withDotValue(activeSlide, {});
    __VLS_withDotValue(currentItem, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "relative h-[36rem] overflow-hidden sm:h-[42rem] lg:h-[48rem]" },
        'aria-label': (__VLS_unwrap(t, {})('home.featured')),
    });
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-[36rem]']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:h-[42rem]']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:h-[48rem]']} */ ;
    const __VLS_0 = __VLS_tryAsConstant((__VLS_ctx.items));
    for (const [item, index] of __VLS_vFor(__VLS_nonNull(__VLS_0))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (item.id),
            ...{ class: "absolute inset-0 transition-opacity duration-700" },
            ...{ class: (index === activeSlide.value ? 'opacity-100' : 'opacity-0') },
        });
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-opacity']} */ ;
        /** @type {__VLS_StyleScopedClasses['duration-700']} */ ;
        if (item.backdrop !== null) {
            const __VLS_1 = AuthImage;
            // @ts-ignore
            const __VLS_2 = __VLS_asFunctionalComponent1(__VLS_1, new __VLS_1({
                // @ts-ignore
                scope: "library", itemId: (item.id), index: (item.backdrop), version: (item.updatedAt), width: (1600), alt: "", imgClass: "absolute inset-0 size-full object-cover object-top",
            }));
            const __VLS_3 = __VLS_2({
                scope: "library",
                itemId: (item.id),
                index: (item.backdrop),
                version: (item.updatedAt),
                width: (1600),
                alt: "",
                imgClass: "absolute inset-0 size-full object-cover object-top",
            }, ...__VLS_functionalComponentArgsRest(__VLS_2));
        }
        // @ts-ignore
        [t, items, activeSlide,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "absolute inset-0 bg-gradient-to-t from-flixer-background via-flixer-background/40 to-flixer-background/10" },
    });
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-gradient-to-t']} */ ;
    /** @type {__VLS_StyleScopedClasses['from-flixer-background']} */ ;
    /** @type {__VLS_StyleScopedClasses['via-flixer-background/40']} */ ;
    /** @type {__VLS_StyleScopedClasses['to-flixer-background/10']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "absolute inset-0 bg-gradient-to-r from-flixer-background/80 via-flixer-background/20 to-transparent" },
    });
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-gradient-to-r']} */ ;
    /** @type {__VLS_StyleScopedClasses['from-flixer-background/80']} */ ;
    /** @type {__VLS_StyleScopedClasses['via-flixer-background/20']} */ ;
    /** @type {__VLS_StyleScopedClasses['to-transparent']} */ ;
    if (currentItem.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "absolute inset-x-0 bottom-16 page-gutter" },
        });
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['inset-x-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['bottom-16']} */ ;
        /** @type {__VLS_StyleScopedClasses['page-gutter']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
            ...{ class: "line-clamp-3 max-w-4xl break-words font-bold uppercase text-white drop-shadow-lg" },
            ...{ class: (titleSize(currentItem.value.title)) },
        });
        /** @type {__VLS_StyleScopedClasses['line-clamp-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['max-w-4xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['break-words']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['drop-shadow-lg']} */ ;
        (currentItem.value.title);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-4 flex flex-wrap items-center gap-3 text-sm text-flixer-text" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "font-medium text-white" },
        });
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        (typeLabel(currentItem.value));
        if (currentItem.value.year) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (currentItem.value.year);
        }
        if (currentItem.value.rating) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "rounded border border-white/40 px-1.5 py-0.5 text-xs" },
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-white/40']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-1.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            (currentItem.value.rating);
        }
        if (currentItem.value.runtimeMinutes) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (runtimeLabel(currentItem.value.runtimeMinutes));
        }
        if (currentItem.value.overview) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mt-3 line-clamp-3 max-w-2xl text-base text-flixer-text/90" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['line-clamp-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['max-w-2xl']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-base']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-text/90']} */ ;
            (currentItem.value.overview);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-5 flex gap-3" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        let __VLS_6;
        /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
        RouterLink;
        // @ts-ignore
        const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
            // @ts-ignore
            to: ({ name: 'media-item', params: { id: currentItem.value.id } }), ...{ class: "inline-flex min-h-11 items-center gap-2 rounded bg-white px-6 text-sm font-semibold text-flixer-background transition hover:bg-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" },
        }));
        const __VLS_8 = __VLS_7({
            to: ({ name: 'media-item', params: { id: currentItem.value.id } }),
            ...{ class: "inline-flex min-h-11 items-center gap-2 rounded bg-white px-6 text-sm font-semibold text-flixer-background transition hover:bg-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_7));
        /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['min-h-11']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-background']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/85']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-offset-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        var __VLS_9;
        const { default: __VLS_11 } = __VLS_nonNull(__VLS_9.slots);
        let __VLS_12;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
            // @ts-ignore
            icon: "lucide:circle-question-mark", ...{ class: "size-4" }, 'aria-hidden': "true",
        }));
        const __VLS_14 = __VLS_13({
            icon: "lucide:circle-question-mark",
            ...{ class: "size-4" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_13));
        /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
        (__VLS_unwrap(t, {})('home.moreInfo'));
        // @ts-ignore
        [t, currentItem, currentItem, currentItem, currentItem, currentItem, currentItem, currentItem, currentItem, currentItem, currentItem, currentItem, currentItem, currentItem,];
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            type: "button",
            ...{ class: "inline-flex min-h-11 items-center gap-2 rounded border border-white/30 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" },
        });
        /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['min-h-11']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-white/30']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['backdrop-blur-md']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/20']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-offset-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        let __VLS_17;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({
            // @ts-ignore
            icon: "lucide:plus", ...{ class: "size-4" }, 'aria-hidden': "true",
        }));
        const __VLS_19 = __VLS_18({
            icon: "lucide:plus",
            ...{ class: "size-4" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_18));
        /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
        (__VLS_unwrap(t, {})('home.myList'));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "absolute inset-x-0 bottom-5 flex justify-center gap-3" },
    });
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-x-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['bottom-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    const __VLS_22 = __VLS_tryAsConstant((__VLS_ctx.items));
    for (const [item, index] of __VLS_vFor(__VLS_nonNull(__VLS_22))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    return (selectSlide(index));
                    // @ts-ignore
                    [t, items,];
                } },
            key: (item.id),
            type: "button",
            ...{ class: "h-2.5 rounded-full transition-all" },
            ...{ class: (index === activeSlide.value ? 'w-6 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/70') },
            'aria-label': (__VLS_unwrap(t, {})('home.showSlide', { name: item.title })),
            'aria-current': (index === activeSlide.value),
        });
        /** @type {__VLS_StyleScopedClasses['h-2.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
        // @ts-ignore
        [t, activeSlide, activeSlide,];
    }
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
