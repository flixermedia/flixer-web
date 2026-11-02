import { useI18n } from 'vue-i18n';
import PluginNode from './PluginNode.vue';
const { defineProps, } = {};
const __VLS_props = defineProps();
const { t } = useI18n();
function cellNode(cell) {
    return cell !== null && typeof cell === 'object' ? cell : null;
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "admin-card overflow-x-auto" },
    });
    /** @type {__VLS_StyleScopedClasses['admin-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-x-auto']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "w-full min-w-max text-left text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-max']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({
        ...{ class: "border-b border-flixer-border text-xs uppercase tracking-wide text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    const __VLS_0 = __VLS_tryAsConstant((__VLS_ctx.node.columns));
    for (const [column] of __VLS_vFor(__VLS_nonNull(__VLS_0))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            key: (column.key),
            scope: "col",
            ...{ class: "px-4 py-3 font-semibold" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        (column.label);
        // @ts-ignore
        [node,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    const __VLS_1 = __VLS_tryAsConstant((__VLS_ctx.node.rows));
    for (const [row, index] of __VLS_vFor(__VLS_nonNull(__VLS_1))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (row.key ?? index),
            ...{ class: "border-b border-flixer-border/60 last:border-0" },
        });
        /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border/60']} */ ;
        /** @type {__VLS_StyleScopedClasses['last:border-0']} */ ;
        const __VLS_2 = __VLS_tryAsConstant((__VLS_ctx.node.columns));
        for (const [column] of __VLS_vFor(__VLS_nonNull(__VLS_2))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                key: (column.key),
                ...{ class: "px-4 py-3 align-middle" },
            });
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['align-middle']} */ ;
            if (cellNode(row.cells[column.key])) {
                const __VLS_3 = PluginNode;
                // @ts-ignore
                const __VLS_4 = __VLS_asFunctionalComponent1(__VLS_3, new __VLS_3({
                    // @ts-ignore
                    node: (cellNode(row.cells[column.key])),
                }));
                const __VLS_5 = __VLS_4({
                    node: (cellNode(row.cells[column.key])),
                }, ...__VLS_functionalComponentArgsRest(__VLS_4));
            }
            else {
                (row.cells[column.key] ?? '');
            }
            // @ts-ignore
            [node, node,];
        }
        // @ts-ignore
        [];
    }
    if (!__VLS_ctx.node.rows.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            colspan: (Math.max(1, __VLS_ctx.node.columns.length)),
            ...{ class: "px-4 py-8 text-center text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-8']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_ctx.node.emptyText ?? __VLS_unwrap(t, {})('plugins.view.empty'));
    }
    // @ts-ignore
    [node, node, node, t,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
