import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
const { defineProps, } = {};
const __VLS_props = defineProps();
const { t } = useI18n();
const scroller = ref(null);
function scrollBy(direction) {
    const el = scroller.value?.$el;
    if (el) {
        el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: 'smooth' });
    }
}
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "group/row" },
        'aria-label': (__VLS_ctx.title),
    });
    /** @type {__VLS_StyleScopedClasses['group/row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mb-3 flex items-end justify-between page-gutter" },
    });
    /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-end']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['page-gutter']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
        ...{ class: "text-xl font-semibold tracking-tight text-white sm:text-2xl" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-tight']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:text-2xl']} */ ;
    (__VLS_ctx.title);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "hidden gap-2 opacity-0 transition group-hover/row:opacity-100 group-focus-within/row:opacity-100 md:flex" },
    });
    /** @type {__VLS_StyleScopedClasses['hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['opacity-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['group-hover/row:opacity-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['group-focus-within/row:opacity-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:flex']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                void $event;
                return (scrollBy(-1));
                // @ts-ignore
                [title, title,];
            } },
        type: "button",
        ...{ class: "grid size-8 place-items-center rounded border border-flixer-border bg-flixer-surface text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
        'aria-label': (__VLS_unwrap(t, {})('home.scrollLeft', { title: __VLS_ctx.title })),
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['size-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    let __VLS_0;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        icon: "lucide:chevron-left", ...{ class: "size-4" }, 'aria-hidden': "true",
    }));
    const __VLS_2 = __VLS_1({
        icon: "lucide:chevron-left",
        ...{ class: "size-4" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                void $event;
                return (scrollBy(1));
                // @ts-ignore
                [title, t,];
            } },
        type: "button",
        ...{ class: "grid size-8 place-items-center rounded border border-flixer-border bg-flixer-surface text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
        'aria-label': (__VLS_unwrap(t, {})('home.scrollRight', { title: __VLS_ctx.title })),
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['size-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    let __VLS_5;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
        // @ts-ignore
        icon: "lucide:chevron-right", ...{ class: "size-4" }, 'aria-hidden': "true",
    }));
    const __VLS_7 = __VLS_6({
        icon: "lucide:chevron-right",
        ...{ class: "size-4" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_6));
    /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
    let __VLS_10;
    /** @ts-ignore @type { | typeof __VLS_components.TransitionGroup | typeof __VLS_components.TransitionGroup} */
    TransitionGroup;
    // @ts-ignore
    const __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({
        // @ts-ignore
        ref: "scroller", tag: "ul", name: "row-card", ...{ class: "-mt-5 flex snap-x gap-4 overflow-x-auto scroll-smooth page-gutter pb-5 pt-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" },
    }));
    const __VLS_12 = __VLS_11({
        ref: "scroller",
        tag: "ul",
        name: "row-card",
        ...{ class: "-mt-5 flex snap-x gap-4 overflow-x-auto scroll-smooth page-gutter pb-5 pt-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_11));
    /** @type {__VLS_StyleScopedClasses['-mt-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['snap-x']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-x-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['scroll-smooth']} */ ;
    /** @type {__VLS_StyleScopedClasses['page-gutter']} */ ;
    /** @type {__VLS_StyleScopedClasses['pb-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['[scrollbar-width:none]']} */ ;
    /** @type {__VLS_StyleScopedClasses['[&::-webkit-scrollbar]:hidden']} */ ;
    var __VLS_13;
    const { default: __VLS_15 } = __VLS_nonNull(__VLS_13.slots);
    var __VLS_16 = {};
    // @ts-ignore
    [title, t,];
    var __VLS_17 = __VLS_16;
    // @ts-ignore
    [];
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
