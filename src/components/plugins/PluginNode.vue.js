import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';
import { usePluginContext } from '../../composables/usePluginActions';
import { activeTab, pagerState, resolveNav } from '../../plugins/pageLogic';
import { alertToneClasses, aspectClasses, badgeToneClasses, gapClasses, headingClasses, inputClass, quietButtonClass, textToneClasses } from './classes';
import PluginButton from './PluginButton.vue';
import PluginCard from './PluginCard.vue';
import PluginForm from './PluginForm.vue';
import PluginSection from './PluginSection.vue';
import PluginTable from './PluginTable.vue';
const { defineProps, } = {};
const props = defineProps();
const { t } = useI18n();
const context = usePluginContext();
const searchValue = ref(props.node.type === 'searchbox' ? (props.node.value ?? '') : '');
watch(() => (props.node.type === 'searchbox' ? props.node.value : undefined), (value) => {
    searchValue.value = value ?? '';
});
const stackClass = computed(() => {
    const node = props.node;
    if (node.type !== 'stack')
        return '';
    const row = node.direction === 'row';
    const align = node.align === 'between' ? 'justify-between' : node.align === 'center' ? (row ? 'justify-center' : 'items-center') : node.align === 'end' ? (row ? 'justify-end' : 'items-end') : node.align === 'start' ? (row ? 'justify-start' : 'items-start') : '';
    return [row ? 'flex flex-row items-center' : 'flex flex-col', gapClasses[node.gap ?? 3], node.wrap ? 'flex-wrap' : '', align].join(' ');
});
const selectedTab = computed(() => (props.node.type === 'tabs' ? activeTab(props.node.tabs, context.query.value, props.node.param) : undefined));
const pager = computed(() => (props.node.type === 'pager' ? pagerState(props.node.page, props.node.pageSize, props.node.total) : null));
const activeChip = computed(() => (props.node.type === 'chips' ? (context.query.value[props.node.param] ?? props.node.value ?? '') : ''));
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
    __VLS_withDotValue(headingClasses, {});
    __VLS_withDotValue(textToneClasses, {});
    __VLS_withDotValue(badgeToneClasses, {});
    __VLS_withDotValue(aspectClasses, {});
    __VLS_withDotValue(context, {});
    __VLS_withDotValue(selectedTab, {});
    __VLS_withDotValue(alertToneClasses, {});
    __VLS_withDotValue(pager, {});
    __VLS_withDotValue(searchValue, {});
    __VLS_withDotValue(activeChip, {});
    if (__VLS_ctx.node.type === 'stack') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: (__VLS_unwrap(stackClass, {})) },
        });
        const __VLS_0 = __VLS_tryAsConstant((__VLS_ctx.node.children));
        for (const [child, index] of __VLS_vFor(__VLS_nonNull(__VLS_0))) {
            let __VLS_1;
            /** @ts-ignore @type { | typeof __VLS_components.PluginNode} */
            PluginNode;
            // @ts-ignore
            const __VLS_2 = __VLS_asFunctionalComponent1(__VLS_1, new __VLS_1({
                // @ts-ignore
                key: (index), node: (child),
            }));
            const __VLS_3 = __VLS_2({
                key: (index),
                node: (child),
            }, ...__VLS_functionalComponentArgsRest(__VLS_2));
            // @ts-ignore
            [node, node, stackClass,];
        }
    }
    else if (__VLS_ctx.node.type === 'heading') {
        const __VLS_6 = (`h${__VLS_ctx.node.level ?? 2}`);
        // @ts-ignore
        const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
            // @ts-ignore
            ...{ class: (headingClasses.value[__VLS_ctx.node.level ?? 2]) },
        }));
        const __VLS_8 = __VLS_7({
            ...{ class: (headingClasses.value[__VLS_ctx.node.level ?? 2]) },
        }, ...__VLS_functionalComponentArgsRest(__VLS_7));
        var __VLS_9;
        const { default: __VLS_11 } = __VLS_nonNull(__VLS_9.slots);
        (__VLS_ctx.node.text);
        // @ts-ignore
        [node, node, node, node, headingClasses,];
    }
    else if (__VLS_ctx.node.type === 'text') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: ([textToneClasses.value[__VLS_ctx.node.tone ?? 'default'], __VLS_ctx.node.size === 'sm' ? 'text-xs' : 'text-sm']) },
            ...{ class: "whitespace-pre-line" },
        });
        /** @type {__VLS_StyleScopedClasses['whitespace-pre-line']} */ ;
        (__VLS_ctx.node.text);
    }
    else if (__VLS_ctx.node.type === 'badge') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold" },
            ...{ class: (badgeToneClasses.value[__VLS_ctx.node.tone ?? 'default']) },
        });
        /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-2.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        (__VLS_ctx.node.text);
    }
    else if (__VLS_ctx.node.type === 'image') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "relative w-full max-w-xs overflow-hidden rounded border border-white/10 bg-flixer-background" },
            ...{ class: (aspectClasses.value[__VLS_ctx.node.aspect ?? 'poster']) },
        });
        /** @type {__VLS_StyleScopedClasses['relative']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['max-w-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
            src: (__VLS_ctx.node.src),
            alt: (__VLS_ctx.node.alt),
            loading: "lazy",
            referrerpolicy: "no-referrer",
            ...{ class: "size-full object-cover" },
        });
        /** @type {__VLS_StyleScopedClasses['size-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['object-cover']} */ ;
    }
    else if (__VLS_ctx.node.type === 'grid') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid gap-4" },
            ...{ style: ({ gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${__VLS_ctx.node.minWidth ?? 160}px), 1fr))` }) },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
        const __VLS_12 = __VLS_tryAsConstant((__VLS_ctx.node.children));
        for (const [child, index] of __VLS_vFor(__VLS_nonNull(__VLS_12))) {
            let __VLS_13;
            /** @ts-ignore @type { | typeof __VLS_components.PluginNode} */
            PluginNode;
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
            [node, node, node, node, node, node, node, node, node, node, node, node, node, node, textToneClasses, badgeToneClasses, aspectClasses,];
        }
    }
    else if (__VLS_ctx.node.type === 'section') {
        const __VLS_18 = PluginSection;
        // @ts-ignore
        const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
            // @ts-ignore
            node: (__VLS_ctx.node),
        }));
        const __VLS_20 = __VLS_19({
            node: (__VLS_ctx.node),
        }, ...__VLS_functionalComponentArgsRest(__VLS_19));
    }
    else if (__VLS_ctx.node.type === 'card') {
        const __VLS_23 = PluginCard;
        // @ts-ignore
        const __VLS_24 = __VLS_asFunctionalComponent1(__VLS_23, new __VLS_23({
            // @ts-ignore
            node: (__VLS_ctx.node),
        }));
        const __VLS_25 = __VLS_24({
            node: (__VLS_ctx.node),
        }, ...__VLS_functionalComponentArgsRest(__VLS_24));
    }
    else if (__VLS_ctx.node.type === 'tabs') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "space-y-4" },
        });
        /** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" },
            role: "tablist",
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-x-auto']} */ ;
        /** @type {__VLS_StyleScopedClasses['pb-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['[scrollbar-width:none]']} */ ;
        /** @type {__VLS_StyleScopedClasses['[&::-webkit-scrollbar]:hidden']} */ ;
        const __VLS_28 = __VLS_tryAsConstant((__VLS_ctx.node.tabs));
        for (const [tab] of __VLS_vFor(__VLS_nonNull(__VLS_28))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!!(__VLS_ctx.node.type === 'stack'))
                            throw 0;
                        if (!!(__VLS_ctx.node.type === 'heading'))
                            throw 0;
                        if (!!(__VLS_ctx.node.type === 'text'))
                            throw 0;
                        if (!!(__VLS_ctx.node.type === 'badge'))
                            throw 0;
                        if (!!(__VLS_ctx.node.type === 'image'))
                            throw 0;
                        if (!!(__VLS_ctx.node.type === 'grid'))
                            throw 0;
                        if (!!(__VLS_ctx.node.type === 'section'))
                            throw 0;
                        if (!!(__VLS_ctx.node.type === 'card'))
                            throw 0;
                        if (!(__VLS_ctx.node.type === 'tabs'))
                            throw 0;
                        return (context.value.patchQuery({ [__VLS_ctx.node.param]: tab.id }, __VLS_ctx.node.reset));
                        // @ts-ignore
                        [node, node, node, node, node, node, node, node, context,];
                    } },
                key: (tab.id),
                type: "button",
                role: "tab",
                'aria-selected': (selectedTab.value === tab.id),
                ...{ class: "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
                ...{ class: (selectedTab.value === tab.id ? 'border-white bg-white text-flixer-background' : 'border-flixer-border bg-flixer-surface/50 text-flixer-muted hover:border-white/30 hover:text-white') },
            });
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
            (tab.label);
            // @ts-ignore
            [selectedTab, selectedTab,];
        }
        const __VLS_29 = __VLS_tryAsConstant((__VLS_ctx.node.tabs));
        for (const [tab] of __VLS_vFor(__VLS_nonNull(__VLS_29))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.template)({
                key: (tab.id),
            });
            if (tab.id === selectedTab.value) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "space-y-4" },
                    role: "tabpanel",
                });
                /** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
                const __VLS_30 = __VLS_tryAsConstant((tab.children));
                for (const [child, index] of __VLS_vFor(__VLS_nonNull(__VLS_30))) {
                    let __VLS_31;
                    /** @ts-ignore @type { | typeof __VLS_components.PluginNode} */
                    PluginNode;
                    // @ts-ignore
                    const __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31({
                        // @ts-ignore
                        key: (index), node: (child),
                    }));
                    const __VLS_33 = __VLS_32({
                        key: (index),
                        node: (child),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_32));
                    // @ts-ignore
                    [node, selectedTab,];
                }
            }
            // @ts-ignore
            [];
        }
    }
    else if (__VLS_ctx.node.type === 'table') {
        const __VLS_36 = PluginTable;
        // @ts-ignore
        const __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36({
            // @ts-ignore
            node: (__VLS_ctx.node),
        }));
        const __VLS_38 = __VLS_37({
            node: (__VLS_ctx.node),
        }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    }
    else if (__VLS_ctx.node.type === 'form') {
        const __VLS_41 = PluginForm;
        // @ts-ignore
        const __VLS_42 = __VLS_asFunctionalComponent1(__VLS_41, new __VLS_41({
            // @ts-ignore
            node: (__VLS_ctx.node),
        }));
        const __VLS_43 = __VLS_42({
            node: (__VLS_ctx.node),
        }, ...__VLS_functionalComponentArgsRest(__VLS_42));
    }
    else if (__VLS_ctx.node.type === 'button') {
        const __VLS_46 = PluginButton;
        // @ts-ignore
        const __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46({
            // @ts-ignore
            node: (__VLS_ctx.node),
        }));
        const __VLS_48 = __VLS_47({
            node: (__VLS_ctx.node),
        }, ...__VLS_functionalComponentArgsRest(__VLS_47));
    }
    else if (__VLS_ctx.node.type === 'link') {
        let __VLS_51;
        /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
        RouterLink;
        // @ts-ignore
        const __VLS_52 = __VLS_asFunctionalComponent1(__VLS_51, new __VLS_51({
            // @ts-ignore
            to: ({ query: __VLS_unwrap(resolveNav, {})(context.value.query.value, __VLS_ctx.node.to) }), ...{ class: "text-sm font-semibold text-flixer-accent underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
        }));
        const __VLS_53 = __VLS_52({
            to: ({ query: __VLS_unwrap(resolveNav, {})(context.value.query.value, __VLS_ctx.node.to) }),
            ...{ class: "text-sm font-semibold text-flixer-accent underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_52));
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
        /** @type {__VLS_StyleScopedClasses['underline-offset-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:underline']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        var __VLS_54;
        const { default: __VLS_56 } = __VLS_nonNull(__VLS_54.slots);
        (__VLS_ctx.node.label);
        // @ts-ignore
        [node, node, node, node, node, node, node, node, node, context, resolveNav,];
    }
    else if (__VLS_ctx.node.type === 'divider') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.hr)({
            ...{ class: "border-flixer-border" },
        });
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    }
    else if (__VLS_ctx.node.type === 'empty') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "rounded border border-dashed border-flixer-border bg-flixer-surface/30 px-5 py-10 text-center text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-dashed']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/30']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_ctx.node.text);
    }
    else if (__VLS_ctx.node.type === 'alert') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "rounded border px-4 py-3 text-sm" },
            ...{ class: (alertToneClasses.value[__VLS_ctx.node.tone ?? 'info']) },
            role: (__VLS_ctx.node.tone === 'danger' || __VLS_ctx.node.tone === 'warning' ? 'alert' : 'status'),
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        (__VLS_ctx.node.text);
    }
    else if (__VLS_ctx.node.type === 'pager' && pager.value && pager.value.pages > 1) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.nav, __VLS_intrinsics.nav)({
            ...{ class: "flex items-center justify-between gap-3" },
            'aria-label': (__VLS_unwrap(t, {})('plugins.view.pagination')),
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!!(__VLS_ctx.node.type === 'stack'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'heading'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'text'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'badge'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'image'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'grid'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'section'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'card'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'tabs'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'table'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'form'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'button'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'link'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'divider'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'empty'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'alert'))
                        throw 0;
                    if (!(__VLS_ctx.node.type === 'pager' && pager.value && pager.value.pages > 1))
                        throw 0;
                    return (context.value.patchQuery({ [__VLS_ctx.node.param]: String(pager.value.current - 1) }));
                    // @ts-ignore
                    [node, node, node, node, node, node, node, node, node, node, context, alertToneClasses, pager, pager, pager, t,];
                } },
            type: "button",
            ...{ class: (__VLS_unwrap(quietButtonClass, {})) },
            disabled: (!pager.value.hasPrev),
        });
        (__VLS_unwrap(t, {})('plugins.view.previous'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('plugins.view.range', { first: pager.value.first, last: pager.value.last, total: __VLS_ctx.node.total }));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!!(__VLS_ctx.node.type === 'stack'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'heading'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'text'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'badge'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'image'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'grid'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'section'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'card'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'tabs'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'table'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'form'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'button'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'link'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'divider'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'empty'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'alert'))
                        throw 0;
                    if (!(__VLS_ctx.node.type === 'pager' && pager.value && pager.value.pages > 1))
                        throw 0;
                    return (context.value.patchQuery({ [__VLS_ctx.node.param]: String(pager.value.current + 1) }));
                    // @ts-ignore
                    [node, node, context, pager, pager, pager, pager, t, t, quietButtonClass,];
                } },
            type: "button",
            ...{ class: (__VLS_unwrap(quietButtonClass, {})) },
            disabled: (!pager.value.hasNext),
        });
        (__VLS_unwrap(t, {})('plugins.view.next'));
    }
    else if (__VLS_ctx.node.type === 'searchbox') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
            ...{ onSubmit: (...[$event]) => {
                    void $event;
                    if (!!(__VLS_ctx.node.type === 'stack'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'heading'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'text'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'badge'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'image'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'grid'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'section'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'card'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'tabs'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'table'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'form'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'button'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'link'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'divider'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'empty'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'alert'))
                        throw 0;
                    if (!!(__VLS_ctx.node.type === 'pager' && pager.value && pager.value.pages > 1))
                        throw 0;
                    if (!(__VLS_ctx.node.type === 'searchbox'))
                        throw 0;
                    return (context.value.patchQuery({ [__VLS_ctx.node.param]: searchValue.value.trim() }, __VLS_ctx.node.reset));
                    // @ts-ignore
                    [node, node, node, context, pager, t, quietButtonClass, searchValue,];
                } },
            ...{ class: "flex gap-2" },
            role: "search",
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "search",
            ...{ class: (__VLS_unwrap(inputClass, {})) },
            placeholder: (__VLS_ctx.node.placeholder),
            'aria-label': (__VLS_ctx.node.placeholder || __VLS_unwrap(t, {})('plugins.view.search')),
            maxlength: "200",
        });
        (searchValue.value);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            type: "submit",
            ...{ class: (__VLS_unwrap(quietButtonClass, {})) },
        });
        (__VLS_unwrap(t, {})('plugins.view.search'));
    }
    else if (__VLS_ctx.node.type === 'chips') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" },
            role: "group",
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-x-auto']} */ ;
        /** @type {__VLS_StyleScopedClasses['pb-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['[scrollbar-width:none]']} */ ;
        /** @type {__VLS_StyleScopedClasses['[&::-webkit-scrollbar]:hidden']} */ ;
        const __VLS_57 = __VLS_tryAsConstant((__VLS_ctx.node.options));
        for (const [option] of __VLS_vFor(__VLS_nonNull(__VLS_57))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!!(__VLS_ctx.node.type === 'stack'))
                            throw 0;
                        if (!!(__VLS_ctx.node.type === 'heading'))
                            throw 0;
                        if (!!(__VLS_ctx.node.type === 'text'))
                            throw 0;
                        if (!!(__VLS_ctx.node.type === 'badge'))
                            throw 0;
                        if (!!(__VLS_ctx.node.type === 'image'))
                            throw 0;
                        if (!!(__VLS_ctx.node.type === 'grid'))
                            throw 0;
                        if (!!(__VLS_ctx.node.type === 'section'))
                            throw 0;
                        if (!!(__VLS_ctx.node.type === 'card'))
                            throw 0;
                        if (!!(__VLS_ctx.node.type === 'tabs'))
                            throw 0;
                        if (!!(__VLS_ctx.node.type === 'table'))
                            throw 0;
                        if (!!(__VLS_ctx.node.type === 'form'))
                            throw 0;
                        if (!!(__VLS_ctx.node.type === 'button'))
                            throw 0;
                        if (!!(__VLS_ctx.node.type === 'link'))
                            throw 0;
                        if (!!(__VLS_ctx.node.type === 'divider'))
                            throw 0;
                        if (!!(__VLS_ctx.node.type === 'empty'))
                            throw 0;
                        if (!!(__VLS_ctx.node.type === 'alert'))
                            throw 0;
                        if (!!(__VLS_ctx.node.type === 'pager' && pager.value && pager.value.pages > 1))
                            throw 0;
                        if (!!(__VLS_ctx.node.type === 'searchbox'))
                            throw 0;
                        if (!(__VLS_ctx.node.type === 'chips'))
                            throw 0;
                        return (context.value.patchQuery({ [__VLS_ctx.node.param]: option.value }, __VLS_ctx.node.reset));
                        // @ts-ignore
                        [node, node, node, node, node, node, context, t, t, quietButtonClass, searchValue, inputClass,];
                    } },
                key: (option.value),
                type: "button",
                ...{ class: "inline-flex shrink-0 items-center rounded-full border px-3 py-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" },
                ...{ class: (activeChip.value === option.value ? 'border-white bg-white text-flixer-background' : 'border-flixer-border bg-flixer-surface/50 text-flixer-muted hover:border-white/30 hover:text-white') },
                'aria-pressed': (activeChip.value === option.value),
            });
            /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-offset-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
            (option.label);
            // @ts-ignore
            [activeChip, activeChip,];
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
