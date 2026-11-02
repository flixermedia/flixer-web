import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';
import AuthImage from '../ui/AuthImage.vue';
import { requestStatusLabelKey } from '../../composables/requestStatus';
import { badgeToneClasses } from '../plugins/classes';
const { defineProps, defineEmits, withDefaults, } = {};
const props = withDefaults(defineProps(), { variant: 'poster' });
const emit = defineEmits();
const { t } = useI18n();
const linkTo = computed(() => props.to ?? (props.variant !== 'library' && props.itemId ? { name: 'media-item', params: { id: props.itemId } } : null));
const statusClass = computed(() => ({
    pending: 'border-amber-300/30 bg-amber-300/15 text-amber-100',
    approved: 'border-flixer-accent/30 bg-flixer-accent/15 text-white',
    available: 'border-emerald-300/30 bg-emerald-300/15 text-emerald-100',
    declined: 'border-red-300/30 bg-red-300/15 text-red-100',
    failed: 'border-red-300/30 bg-red-300/15 text-red-100',
    none: '',
})[props.requestStatus ?? 'none']);
const __VLS_defaults = { variant: 'poster' };
void __VLS_defaults;
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
    __VLS_withDotValue(linkTo, {});
    __VLS_withDotValue(badgeToneClasses, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
        ...{ class: "group/card relative shrink-0 snap-start" },
        ...{ class: ({
                'w-36 sm:w-44': __VLS_ctx.variant === 'poster' || __VLS_ctx.variant === 'square',
                'w-64 sm:w-72': __VLS_ctx.variant === 'landscape',
                'w-56 sm:w-64': __VLS_ctx.variant === 'library',
            }) },
    });
    /** @type {__VLS_StyleScopedClasses['group/card']} */ ;
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['snap-start']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-36']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:w-44']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-64']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:w-72']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-56']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:w-64']} */ ;
    const __VLS_0 = (linkTo.value ? __VLS_unwrap(RouterLink, {}) : 'a');
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        ...(linkTo.value ? { to: linkTo.value } : { href: '#' }), ...{ class: "group block rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" },
    }));
    const __VLS_2 = __VLS_1({
        ...(linkTo.value ? { to: linkTo.value } : { href: '#' }),
        ...{ class: "group block rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    /** @type {__VLS_StyleScopedClasses['group']} */ ;
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-offset-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "relative overflow-hidden rounded border border-flixer-border bg-flixer-surface transition duration-300 group-hover:-translate-y-1 group-hover:border-white/30 group-hover:shadow-xl group-hover:shadow-black/50" },
        ...{ class: (__VLS_ctx.variant === 'poster' ? 'aspect-[2/3]' : __VLS_ctx.variant === 'square' ? 'aspect-square' : 'aspect-video') },
    });
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['group-hover:-translate-y-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['group-hover:border-white/30']} */ ;
    /** @type {__VLS_StyleScopedClasses['group-hover:shadow-xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['group-hover:shadow-black/50']} */ ;
    if (__VLS_ctx.posterUrl) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
            src: (__VLS_ctx.posterUrl),
            alt: "",
            loading: "lazy",
            referrerpolicy: "no-referrer",
            ...{ class: "size-full object-cover transition duration-500 group-hover:scale-105" },
        });
        /** @type {__VLS_StyleScopedClasses['size-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['object-cover']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['duration-500']} */ ;
        /** @type {__VLS_StyleScopedClasses['group-hover:scale-105']} */ ;
    }
    else if (__VLS_ctx.itemId && __VLS_ctx.imageIndex !== null && __VLS_ctx.imageIndex !== undefined) {
        const __VLS_6 = AuthImage;
        // @ts-ignore
        const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
            // @ts-ignore
            scope: "library", itemId: (__VLS_ctx.itemId), index: (__VLS_ctx.imageIndex), version: (__VLS_ctx.version), width: (__VLS_ctx.variant === 'landscape' ? 300 : __VLS_ctx.variant === 'library' ? 260 : 200), alt: (__VLS_ctx.variant === 'library' ? '' : __VLS_ctx.title), imgClass: "size-full object-cover transition duration-500 group-hover:scale-105",
        }));
        const __VLS_8 = __VLS_7({
            scope: "library",
            itemId: (__VLS_ctx.itemId),
            index: (__VLS_ctx.imageIndex),
            version: (__VLS_ctx.version),
            width: (__VLS_ctx.variant === 'landscape' ? 300 : __VLS_ctx.variant === 'library' ? 260 : 200),
            alt: (__VLS_ctx.variant === 'library' ? '' : __VLS_ctx.title),
            imgClass: "size-full object-cover transition duration-500 group-hover:scale-105",
        }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    }
    else if (__VLS_ctx.variant !== 'library') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "absolute inset-0 grid place-items-center p-3 text-center text-sm font-medium text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_ctx.title);
    }
    if (__VLS_ctx.variant === 'library') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "theme-dark absolute inset-0" },
        });
        /** @type {__VLS_StyleScopedClasses['theme-dark']} */ ;
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" },
        });
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-gradient-to-t']} */ ;
        /** @type {__VLS_StyleScopedClasses['from-black/80']} */ ;
        /** @type {__VLS_StyleScopedClasses['via-black/20']} */ ;
        /** @type {__VLS_StyleScopedClasses['to-transparent']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "absolute inset-x-4 bottom-3 text-lg font-semibold text-white" },
        });
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['inset-x-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['bottom-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        (__VLS_ctx.title);
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "theme-dark absolute inset-0 grid transition" },
            ...{ class: (__VLS_ctx.posterUrl ? 'items-end justify-end bg-gradient-to-t from-black/30 via-transparent to-transparent p-2' : 'place-items-center bg-black/40 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100') },
        });
        /** @type {__VLS_StyleScopedClasses['theme-dark']} */ ;
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "grid place-items-center rounded-full border border-white/25 bg-black/65 text-white shadow-lg backdrop-blur transition group-hover:scale-105" },
            ...{ class: (__VLS_ctx.posterUrl ? 'size-9 sm:size-10' : 'size-12') },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-white/25']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-black/65']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['backdrop-blur']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['group-hover:scale-105']} */ ;
        if (__VLS_ctx.posterUrl) {
            let __VLS_11;
            /** @ts-ignore @type { | typeof __VLS_components.Icon} */
            Icon;
            // @ts-ignore
            const __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11({
                // @ts-ignore
                icon: "lucide:plus", ...{ class: "size-6" }, 'aria-hidden': "true",
            }));
            const __VLS_13 = __VLS_12({
                icon: "lucide:plus",
                ...{ class: "size-6" },
                'aria-hidden': "true",
            }, ...__VLS_functionalComponentArgsRest(__VLS_12));
            /** @type {__VLS_StyleScopedClasses['size-6']} */ ;
        }
        else {
            let __VLS_16;
            /** @ts-ignore @type { | typeof __VLS_components.Icon} */
            Icon;
            // @ts-ignore
            const __VLS_17 = __VLS_asFunctionalComponent1(__VLS_16, new __VLS_16({
                // @ts-ignore
                icon: "lucide:play", ...{ class: "ml-0.5 size-5" }, 'aria-hidden': "true",
            }));
            const __VLS_18 = __VLS_17({
                icon: "lucide:play",
                ...{ class: "ml-0.5 size-5" },
                'aria-hidden': "true",
            }, ...__VLS_functionalComponentArgsRest(__VLS_17));
            /** @type {__VLS_StyleScopedClasses['ml-0.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
        }
        if (__VLS_ctx.requestStatus && __VLS_ctx.requestStatus !== 'none') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "absolute left-2 top-2 rounded-full border px-2.5 py-1 text-[10px] font-bold shadow-sm backdrop-blur-md" },
                ...{ class: (__VLS_unwrap(statusClass, {})) },
                'aria-label': (__VLS_unwrap(t, {})(__VLS_unwrap(requestStatusLabelKey, {})(__VLS_ctx.requestStatus))),
            });
            /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
            /** @type {__VLS_StyleScopedClasses['left-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['top-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-2.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
            /** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['backdrop-blur-md']} */ ;
            (__VLS_unwrap(t, {})(__VLS_unwrap(requestStatusLabelKey, {})(__VLS_ctx.requestStatus)));
        }
        if (__VLS_ctx.badge && (!__VLS_ctx.requestStatus || __VLS_ctx.requestStatus === 'none')) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "absolute left-2 top-2 rounded-full border px-2.5 py-1 text-[10px] font-bold shadow-sm backdrop-blur-md" },
                ...{ class: (badgeToneClasses.value[__VLS_ctx.badge.tone]) },
            });
            /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
            /** @type {__VLS_StyleScopedClasses['left-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['top-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-2.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
            /** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['backdrop-blur-md']} */ ;
            (__VLS_ctx.badge.text);
        }
        if (__VLS_ctx.progress !== undefined) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "absolute inset-x-0 bottom-0 h-1 bg-white/25" },
            });
            /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
            /** @type {__VLS_StyleScopedClasses['inset-x-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['bottom-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white/25']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "h-full bg-flixer-accent" },
                ...{ style: ({ width: `${__VLS_ctx.progress}%` }) },
            });
            /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-accent']} */ ;
        }
    }
    if (__VLS_ctx.variant !== 'library') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-2 px-0.5" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-0.5']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "truncate text-sm font-medium text-flixer-text" },
        });
        /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
        (__VLS_ctx.title);
        if (__VLS_ctx.subtitle) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "truncate text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_ctx.subtitle);
        }
    }
    // @ts-ignore
    [variant, variant, variant, variant, variant, variant, variant, variant, variant, variant, variant, variant, linkTo, linkTo, linkTo, RouterLink, posterUrl, posterUrl, posterUrl, posterUrl, posterUrl, itemId, itemId, imageIndex, imageIndex, imageIndex, version, title, title, title, title, requestStatus, requestStatus, requestStatus, requestStatus, requestStatus, requestStatus, statusClass, t, t, requestStatusLabelKey, requestStatusLabelKey, badge, badge, badge, badgeToneClasses, progress, progress, subtitle, subtitle,];
    if (__VLS_ctx.markable) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!(__VLS_ctx.markable))
                        throw 0;
                    return (__VLS_unwrap(emit, {})('watched'));
                    // @ts-ignore
                    [markable, emit,];
                } },
            type: "button",
            ...{ class: "theme-dark absolute right-2 top-2 grid size-8 place-items-center rounded bg-black/70 text-white opacity-0 transition hover:bg-black/90 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent group-hover/card:opacity-100 [@media(hover:none)]:opacity-100" },
            'aria-label': (__VLS_unwrap(t, {})('mediaItem.markWatched')),
            title: (__VLS_unwrap(t, {})('mediaItem.markWatched')),
        });
        /** @type {__VLS_StyleScopedClasses['theme-dark']} */ ;
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['right-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['top-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-8']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-black/70']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['opacity-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-black/90']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:opacity-100']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        /** @type {__VLS_StyleScopedClasses['group-hover/card:opacity-100']} */ ;
        /** @type {__VLS_StyleScopedClasses['[@media(hover:none)]:opacity-100']} */ ;
        let __VLS_21;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21({
            // @ts-ignore
            icon: "lucide:check", ...{ class: "size-4" }, 'aria-hidden': "true",
        }));
        const __VLS_23 = __VLS_22({
            icon: "lucide:check",
            ...{ class: "size-4" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_22));
        /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
    }
    // @ts-ignore
    [t, t,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
export default {};
