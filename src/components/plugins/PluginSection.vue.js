import PluginNode from './PluginNode.vue';
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "admin-card p-5" },
    });
    /** @type {__VLS_StyleScopedClasses['admin-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-5']} */ ;
    if (__VLS_ctx.node.title || __VLS_ctx.node.description || __VLS_ctx.node.actions?.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex flex-wrap items-start justify-between gap-3" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "min-w-0" },
        });
        /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
        if (__VLS_ctx.node.title) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
                ...{ class: "text-base font-semibold tracking-tight" },
            });
            /** @type {__VLS_StyleScopedClasses['text-base']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['tracking-tight']} */ ;
            (__VLS_ctx.node.title);
        }
        if (__VLS_ctx.node.description) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mt-1 text-sm text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_ctx.node.description);
        }
        if (__VLS_ctx.node.actions?.length) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex flex-wrap items-center gap-2" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            const __VLS_0 = __VLS_tryAsConstant((__VLS_ctx.node.actions));
            for (const [action, index] of __VLS_vFor(__VLS_nonNull(__VLS_0))) {
                const __VLS_1 = PluginNode;
                // @ts-ignore
                const __VLS_2 = __VLS_asFunctionalComponent1(__VLS_1, new __VLS_1({
                    // @ts-ignore
                    key: (index), node: (action),
                }));
                const __VLS_3 = __VLS_2({
                    key: (index),
                    node: (action),
                }, ...__VLS_functionalComponentArgsRest(__VLS_2));
                // @ts-ignore
                [node, node, node, node, node, node, node, node, node,];
            }
        }
    }
    if (__VLS_ctx.node.children?.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex flex-col gap-4" },
            ...{ class: ({ 'mt-4': __VLS_ctx.node.title || __VLS_ctx.node.description || __VLS_ctx.node.actions?.length }) },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        const __VLS_6 = __VLS_tryAsConstant((__VLS_ctx.node.children));
        for (const [child, index] of __VLS_vFor(__VLS_nonNull(__VLS_6))) {
            const __VLS_7 = PluginNode;
            // @ts-ignore
            const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
                // @ts-ignore
                key: (index), node: (child),
            }));
            const __VLS_9 = __VLS_8({
                key: (index),
                node: (child),
            }, ...__VLS_functionalComponentArgsRest(__VLS_8));
            // @ts-ignore
            [node, node, node, node, node,];
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
