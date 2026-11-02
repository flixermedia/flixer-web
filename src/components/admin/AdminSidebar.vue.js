import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
const { defineProps, defineEmits, } = {};
const props = defineProps();
const emit = defineEmits();
const { t } = useI18n();
const openSection = ref(props.active.tab);
const icons = {
    dashboard: 'lucide:layout-dashboard',
    guide: 'lucide:tv',
    library: 'lucide:library',
    providers: 'lucide:plug',
    requests: 'lucide:message-square',
    notifications: 'lucide:bell',
    apikeys: 'lucide:key-round',
    plugins: 'lucide:puzzle',
    settings: 'lucide:settings',
};
const pageIcons = {
    overview: 'lucide:layout-dashboard',
    guide: 'lucide:calendar-days',
    libraries: 'lucide:library',
    tasks: 'lucide:list-checks',
    media: 'lucide:film',
    transcoding: 'lucide:video',
    metadata: 'lucide:file-text',
    subtitles: 'lucide:captions',
    themes: 'lucide:palette',
    requests: 'lucide:message-square',
    notifications: 'lucide:bell',
    smtp: 'lucide:mail',
    apikeys: 'lucide:key-round',
    plugins: 'lucide:puzzle',
    server: 'lucide:server',
    users: 'lucide:users-round',
    networking: 'lucide:network',
    search: 'lucide:search',
    updates: 'lucide:refresh-cw',
    backups: 'lucide:archive',
};
function choose(tab, page) {
    emit('select', { tab, page });
}
function toggle(tab) {
    openSection.value = openSection.value === tab ? null : tab;
}
function beforeAccordionEnter(element) {
    const panel = element;
    panel.style.height = '0';
    panel.style.overflow = 'hidden';
}
function enterAccordion(element) {
    const panel = element;
    panel.style.transition = 'height 240ms cubic-bezier(0.4, 0, 0.2, 1)';
    requestAnimationFrame(() => {
        panel.style.height = `${panel.scrollHeight}px`;
    });
}
function afterAccordionEnter(element) {
    const panel = element;
    panel.style.height = 'auto';
    panel.style.overflow = '';
    panel.style.transition = '';
}
function beforeAccordionLeave(element) {
    const panel = element;
    panel.style.height = `${panel.scrollHeight}px`;
    panel.style.overflow = 'hidden';
    void panel.offsetHeight;
}
function leaveAccordion(element) {
    const panel = element;
    panel.style.transition = 'height 240ms cubic-bezier(0.4, 0, 0.2, 1)';
    requestAnimationFrame(() => {
        panel.style.height = '0';
    });
}
function afterAccordionLeave(element) {
    const panel = element;
    panel.style.height = '';
    panel.style.overflow = '';
    panel.style.transition = '';
}
watch(() => props.active.tab, (tab) => {
    openSection.value = tab;
});
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
    __VLS_withDotValue(openSection, {});
    __VLS_withDotValue(icons, {});
    __VLS_withDotValue(pageIcons, {});
    void {};
    /** @type {__VLS_StyleScopedClasses['admin-subnav-list']} */ ;
    /** @type {__VLS_StyleScopedClasses['is-compact']} */ ;
    /** @type {__VLS_StyleScopedClasses['admin-nav-chevron']} */ ;
    /** @type {__VLS_StyleScopedClasses['admin-nav-label']} */ ;
    /** @type {__VLS_StyleScopedClasses['is-compact']} */ ;
    /** @type {__VLS_StyleScopedClasses['admin-nav-header-leave-active']} */ ;
    /** @type {__VLS_StyleScopedClasses['admin-nav-header-enter-active']} */ ;
    /** @type {__VLS_StyleScopedClasses['admin-nav-header-leave-active']} */ ;
    /** @type {__VLS_StyleScopedClasses['admin-nav-label']} */ ;
    /** @type {__VLS_StyleScopedClasses['admin-nav-chevron']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.nav, __VLS_intrinsics.nav)({
        ...{ class: "rounded border border-flixer-border bg-flixer-surface/90 shadow-xl shadow-black/10 backdrop-blur transition-[width,padding] duration-300 ease-in-out motion-reduce:transition-none lg:rounded-none lg:fixed lg:bottom-0 lg:left-0 lg:top-16 lg:z-30 lg:flex lg:flex-col lg:overflow-hidden lg:shadow-2xl" },
        ...{ class: (__VLS_ctx.compact ? 'p-2 lg:w-20' : 'p-3 lg:w-60') },
        'aria-label': (__VLS_unwrap(t, {})('admin.adminNavigation')),
    });
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/90']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-black/10']} */ ;
    /** @type {__VLS_StyleScopedClasses['backdrop-blur']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-[width,padding]']} */ ;
    /** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['ease-in-out']} */ ;
    /** @type {__VLS_StyleScopedClasses['motion-reduce:transition-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:rounded-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:fixed']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:bottom-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:left-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:top-16']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:z-30']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:overflow-hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:shadow-2xl']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
        ...{ class: "mb-5 border-b border-flixer-border/20 px-3 pb-4 pt-2 transition-[height,padding] duration-300 ease-in-out motion-reduce:transition-none lg:mb-0 lg:h-[6.125rem] lg:shrink-0 lg:overflow-hidden" },
        ...{ class: (__VLS_ctx.compact ? 'lg:!h-9 lg:!px-0 lg:!py-0' : '') },
    });
    /** @type {__VLS_StyleScopedClasses['mb-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border/20']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['pb-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-[height,padding]']} */ ;
    /** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['ease-in-out']} */ ;
    /** @type {__VLS_StyleScopedClasses['motion-reduce:transition-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:mb-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:h-[6.125rem]']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:overflow-hidden']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "relative h-[4.5rem] min-w-0 lg:w-48" },
    });
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-[4.5rem]']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:w-48']} */ ;
    let __VLS_0;
    /** @ts-ignore @type { | typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
    Transition;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        name: "admin-nav-header",
    }));
    const __VLS_2 = __VLS_1({
        name: "admin-nav-header",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    if (!__VLS_ctx.compact) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (`${__VLS_ctx.title}:${__VLS_ctx.subtitle}`),
            ...{ class: "absolute inset-x-0 top-0" },
        });
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['inset-x-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['top-0']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
            ...{ class: "whitespace-nowrap text-xl font-semibold tracking-tight text-white" },
        });
        /** @type {__VLS_StyleScopedClasses['whitespace-nowrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['tracking-tight']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        (__VLS_ctx.title);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-1 h-10 line-clamp-2 text-xs leading-5 text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['line-clamp-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['leading-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_ctx.subtitle);
    }
    // @ts-ignore
    [compact, compact, compact, t, title, title, subtitle, subtitle,];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "relative lg:min-h-0 lg:flex-1" },
    });
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:min-h-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:flex-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "admin-nav-scroll h-full overflow-y-auto lg:py-5" },
    });
    /** @type {__VLS_StyleScopedClasses['admin-nav-scroll']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:py-5']} */ ;
    const __VLS_6 = __VLS_tryAsConstant((__VLS_ctx.tabs));
    for (const [tab] of __VLS_vFor(__VLS_nonNull(__VLS_6))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (tab.id),
            ...{ class: "not-first:mt-2" },
        });
        /** @type {__VLS_StyleScopedClasses['not-first:mt-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    return (toggle(tab.id));
                    // @ts-ignore
                    [tabs,];
                } },
            id: (`admin-nav-${tab.id}`),
            type: "button",
            ...{ class: "admin-nav-item flex w-full items-center rounded py-3 text-sm font-semibold transition-[gap,padding,background-color,color] duration-300 ease-in-out hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
            ...{ class: ([__VLS_ctx.compact ? 'justify-center px-0' : 'gap-3 px-3 text-left', __VLS_ctx.active.tab === tab.id ? 'text-white' : 'text-flixer-text/70']) },
            'aria-label': (__VLS_ctx.compact ? tab.label : undefined),
            title: (__VLS_ctx.compact ? tab.label : undefined),
            'aria-expanded': (openSection.value === tab.id),
            'aria-controls': (`admin-nav-pages-${tab.id}`),
        });
        /** @type {__VLS_StyleScopedClasses['admin-nav-item']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-[gap,padding,background-color,color]']} */ ;
        /** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
        /** @type {__VLS_StyleScopedClasses['ease-in-out']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/5']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        let __VLS_7;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
            // @ts-ignore
            icon: (icons.value[tab.id]), ...{ class: "admin-nav-icon size-5 shrink-0" }, 'aria-hidden': "true",
        }));
        const __VLS_9 = __VLS_8({
            icon: (icons.value[tab.id]),
            ...{ class: "admin-nav-icon size-5 shrink-0" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_8));
        /** @type {__VLS_StyleScopedClasses['admin-nav-icon']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "admin-nav-label min-w-0 flex-1 truncate" },
            ...{ class: (__VLS_ctx.compact && 'is-compact') },
            'aria-hidden': (__VLS_ctx.compact),
        });
        /** @type {__VLS_StyleScopedClasses['admin-nav-label']} */ ;
        /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
        (tab.label);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "admin-nav-chevron shrink-0" },
            ...{ class: (__VLS_ctx.compact && 'is-compact') },
            'aria-hidden': "true",
        });
        /** @type {__VLS_StyleScopedClasses['admin-nav-chevron']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        let __VLS_12;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
            // @ts-ignore
            icon: "lucide:chevron-down", ...{ class: "size-4 transition-transform duration-200 motion-reduce:transition-none" }, ...{ class: (openSection.value === tab.id ? 'rotate-180' : '') },
        }));
        const __VLS_14 = __VLS_13({
            icon: "lucide:chevron-down",
            ...{ class: "size-4 transition-transform duration-200 motion-reduce:transition-none" },
            ...{ class: (openSection.value === tab.id ? 'rotate-180' : '') },
        }, ...__VLS_functionalComponentArgsRest(__VLS_13));
        /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-transform']} */ ;
        /** @type {__VLS_StyleScopedClasses['duration-200']} */ ;
        /** @type {__VLS_StyleScopedClasses['motion-reduce:transition-none']} */ ;
        let __VLS_17;
        /** @ts-ignore @type { | typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
        Transition;
        // @ts-ignore
        const __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({
            // @ts-ignore
            ...{ 'onBeforeEnter': {} }, ...{ 'onEnter': {} }, ...{ 'onAfterEnter': {} }, ...{ 'onBeforeLeave': {} }, ...{ 'onLeave': {} }, ...{ 'onAfterLeave': {} },
        }));
        const __VLS_19 = __VLS_18({
            ...{ 'onBeforeEnter': {} },
            ...{ 'onEnter': {} },
            ...{ 'onAfterEnter': {} },
            ...{ 'onBeforeLeave': {} },
            ...{ 'onLeave': {} },
            ...{ 'onAfterLeave': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_18));
        let __VLS_22;
        const __VLS_23 = {
            /** @type {typeof __VLS_22.beforeEnter} */
            onBeforeEnter: (beforeAccordionEnter),
        };
        void __VLS_23;
        const __VLS_24 = {
            /** @type {typeof __VLS_22.enter} */
            onEnter: (enterAccordion),
        };
        void __VLS_24;
        const __VLS_25 = {
            /** @type {typeof __VLS_22.afterEnter} */
            onAfterEnter: (afterAccordionEnter),
        };
        void __VLS_25;
        const __VLS_26 = {
            /** @type {typeof __VLS_22.beforeLeave} */
            onBeforeLeave: (beforeAccordionLeave),
        };
        void __VLS_26;
        const __VLS_27 = {
            /** @type {typeof __VLS_22.leave} */
            onLeave: (leaveAccordion),
        };
        void __VLS_27;
        const __VLS_28 = {
            /** @type {typeof __VLS_22.afterLeave} */
            onAfterLeave: (afterAccordionLeave),
        };
        void __VLS_28;
        var __VLS_20;
        var __VLS_21;
        const { default: __VLS_29 } = __VLS_nonNull(__VLS_20.slots);
        if (openSection.value === tab.id) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                id: (`admin-nav-pages-${tab.id}`),
                ...{ class: "min-h-0" },
            });
            /** @type {__VLS_StyleScopedClasses['min-h-0']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
                ...{ class: "admin-subnav-list mt-2 grid gap-1" },
                ...{ class: (__VLS_ctx.compact ? 'is-compact' : 'ml-5 pl-3') },
            });
            /** @type {__VLS_StyleScopedClasses['admin-subnav-list']} */ ;
            /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
            const __VLS_30 = __VLS_tryAsConstant((tab.pages));
            for (const [page] of __VLS_vFor(__VLS_nonNull(__VLS_30))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                    key: (page.id),
                });
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!(openSection.value === tab.id))
                                throw 0;
                            return (choose(tab.id, page.id));
                            // @ts-ignore
                            [compact, compact, compact, compact, compact, compact, compact, active, openSection, openSection, openSection, icons,];
                        } },
                    type: "button",
                    ...{ class: "admin-subnav-item flex h-9 w-full items-center rounded text-sm transition-[padding,background-color,color] duration-300 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
                    ...{ class: ([__VLS_ctx.compact ? 'justify-center px-0' : 'justify-start px-3 text-left', __VLS_ctx.active.tab === tab.id && __VLS_ctx.active.page === page.id ? 'border border-flixer-accent/25 bg-flixer-primary/20 text-white' : 'border border-transparent text-flixer-text/70 hover:bg-white/5 hover:text-white']) },
                    'aria-label': (__VLS_ctx.compact ? page.label : undefined),
                    title: (__VLS_ctx.compact ? page.label : undefined),
                    'aria-current': (__VLS_ctx.active.tab === tab.id && __VLS_ctx.active.page === page.id ? 'page' : undefined),
                });
                /** @type {__VLS_StyleScopedClasses['admin-subnav-item']} */ ;
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['h-9']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['transition-[padding,background-color,color]']} */ ;
                /** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
                /** @type {__VLS_StyleScopedClasses['ease-in-out']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "flex min-w-0 items-center transition-[gap] duration-300 ease-in-out" },
                    ...{ class: (__VLS_ctx.compact ? 'justify-center' : 'gap-2.5') },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['transition-[gap]']} */ ;
                /** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
                /** @type {__VLS_StyleScopedClasses['ease-in-out']} */ ;
                let __VLS_31;
                /** @ts-ignore @type { | typeof __VLS_components.Icon} */
                Icon;
                // @ts-ignore
                const __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31({
                    // @ts-ignore
                    icon: (pageIcons.value[page.id]), ...{ class: "admin-subnav-icon size-4 shrink-0 opacity-80" }, 'aria-hidden': "true",
                }));
                const __VLS_33 = __VLS_32({
                    icon: (pageIcons.value[page.id]),
                    ...{ class: "admin-subnav-icon size-4 shrink-0 opacity-80" },
                    'aria-hidden': "true",
                }, ...__VLS_functionalComponentArgsRest(__VLS_32));
                /** @type {__VLS_StyleScopedClasses['admin-subnav-icon']} */ ;
                /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['opacity-80']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "admin-nav-label min-w-0 truncate whitespace-nowrap" },
                    ...{ class: (__VLS_ctx.compact && 'is-compact') },
                    'aria-hidden': (__VLS_ctx.compact),
                });
                /** @type {__VLS_StyleScopedClasses['admin-nav-label']} */ ;
                /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                /** @type {__VLS_StyleScopedClasses['whitespace-nowrap']} */ ;
                (page.label);
                // @ts-ignore
                [compact, compact, compact, compact, compact, compact, active, active, active, active, pageIcons,];
            }
        }
        // @ts-ignore
        [];
        // @ts-ignore
        [];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.footer, __VLS_intrinsics.footer)({
        ...{ class: "mt-4 flex justify-center border-t border-flixer-border/20 pt-3 lg:mt-0 lg:shrink-0" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border/20']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:mt-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:shrink-0']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                void $event;
                return (__VLS_unwrap(emit, {})('toggleCompact'));
                // @ts-ignore
                [emit,];
            } },
        type: "button",
        ...{ class: "grid size-9 shrink-0 place-items-center rounded text-flixer-muted transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
        'aria-label': (__VLS_unwrap(t, {})(__VLS_ctx.compact ? 'admin.expandNavigation' : 'admin.collapseNavigation')),
        title: (__VLS_unwrap(t, {})(__VLS_ctx.compact ? 'admin.expandNavigation' : 'admin.collapseNavigation')),
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['size-9']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    let __VLS_36;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36({
        // @ts-ignore
        icon: (__VLS_ctx.compact ? 'lucide:panel-left-open' : 'lucide:panel-left-close'), ...{ class: "size-5" }, 'aria-hidden': "true",
    }));
    const __VLS_38 = __VLS_37({
        icon: (__VLS_ctx.compact ? 'lucide:panel-left-open' : 'lucide:panel-left-close'),
        ...{ class: "size-5" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
    // @ts-ignore
    [compact, compact, compact, t, t,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};
