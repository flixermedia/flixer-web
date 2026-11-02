import { RouterLink } from 'vue-router';
import { usePluginContext } from '../../composables/usePluginActions';
import { resolveNav } from '../../plugins/pageLogic';
import { badgeToneClasses } from './classes';
import PluginImage from './PluginImage.vue';
import PluginNode from './PluginNode.vue';
const { defineProps, } = {};
const __VLS_props = defineProps();
const context = usePluginContext();
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
    __VLS_withDotValue(context, {});
    __VLS_withDotValue(badgeToneClasses, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
        ...{ class: "admin-card flex h-full flex-col overflow-hidden" },
    });
    /** @type {__VLS_StyleScopedClasses['admin-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
    const __VLS_0 = (__VLS_ctx.node.to ? __VLS_unwrap(RouterLink, {}) : 'div');
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        ...(__VLS_ctx.node.to ? { to: { query: __VLS_unwrap(resolveNav, {})(context.value.query.value, __VLS_ctx.node.to) } } : {}), ...{ class: "block" }, ...{ class: (__VLS_ctx.node.to ? 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent' : '') },
    }));
    const __VLS_2 = __VLS_1({
        ...(__VLS_ctx.node.to ? { to: { query: __VLS_unwrap(resolveNav, {})(context.value.query.value, __VLS_ctx.node.to) } } : {}),
        ...{ class: "block" },
        ...{ class: (__VLS_ctx.node.to ? 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent' : '') },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    if (__VLS_ctx.node.image) {
        const __VLS_6 = PluginImage;
        // @ts-ignore
        const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
            // @ts-ignore
            image: (__VLS_ctx.node.image), ...{ class: "rounded-none border-0" },
        }));
        const __VLS_8 = __VLS_7({
            image: (__VLS_ctx.node.image),
            ...{ class: "rounded-none border-0" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_7));
        /** @type {__VLS_StyleScopedClasses['rounded-none']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-0']} */ ;
    }
    if (__VLS_ctx.node.title || __VLS_ctx.node.subtitle) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "px-3 pt-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['pt-3']} */ ;
        if (__VLS_ctx.node.title) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
                ...{ class: "text-sm font-semibold text-white" },
            });
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            (__VLS_ctx.node.title);
        }
        if (__VLS_ctx.node.subtitle) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mt-0.5 text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-0.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_ctx.node.subtitle);
        }
    }
    // @ts-ignore
    [node, node, node, node, node, node, node, node, node, node, node, node, RouterLink, resolveNav, context,];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-1 flex-col gap-3 p-3" },
        ...{ class: ({ 'pt-2': __VLS_ctx.node.title || __VLS_ctx.node.subtitle }) },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-2']} */ ;
    if (__VLS_ctx.node.badges?.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex flex-wrap gap-1.5" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-1.5']} */ ;
        const __VLS_11 = __VLS_tryAsConstant((__VLS_ctx.node.badges));
        for (const [badge, index] of __VLS_vFor(__VLS_nonNull(__VLS_11))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                key: (index),
                ...{ class: "rounded-full border px-2.5 py-1 text-[10px] font-semibold" },
                ...{ class: (badgeToneClasses.value[badge.tone ?? 'default']) },
            });
            /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-2.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            (badge.text);
            // @ts-ignore
            [node, node, node, node, badgeToneClasses,];
        }
    }
    const __VLS_12 = __VLS_tryAsConstant((__VLS_ctx.node.children));
    for (const [child, index] of __VLS_vFor(__VLS_nonNull(__VLS_12))) {
        const __VLS_13 = PluginNode;
        // @ts-ignore
        const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
            // @ts-ignore
            key: (index), node: (child),
        }));
        const __VLS_15 = __VLS_14({
            key: (index),
            node: (child),
        }, ...__VLS_functionalComponentArgsRest(__VLS_14));
        // @ts-ignore
        [node,];
    }
    if (__VLS_ctx.node.actions?.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-auto flex flex-wrap items-center gap-2 pt-1" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-auto']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['pt-1']} */ ;
        const __VLS_18 = __VLS_tryAsConstant((__VLS_ctx.node.actions));
        for (const [action, index] of __VLS_vFor(__VLS_nonNull(__VLS_18))) {
            const __VLS_19 = PluginNode;
            // @ts-ignore
            const __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({
                // @ts-ignore
                key: (index), node: (action),
            }));
            const __VLS_21 = __VLS_20({
                key: (index),
                node: (action),
            }, ...__VLS_functionalComponentArgsRest(__VLS_20));
            // @ts-ignore
            [node, node,];
        }
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
