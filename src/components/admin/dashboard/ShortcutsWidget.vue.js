import { useI18n } from 'vue-i18n';
import { adminQuery } from '../adminNav';
import AdminSection from '../AdminSection.vue';
const { t } = useI18n();
const links = [
    { key: 'libraries', query: adminQuery('library', 'libraries') },
    { key: 'tasks', query: adminQuery('library', 'tasks') },
    { key: 'users', query: adminQuery('settings', 'users') },
    { key: 'requests', query: adminQuery('requests') },
    { key: 'updates', query: adminQuery('settings', 'updates') },
    { key: 'backups', query: adminQuery('settings', 'backups') },
];
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    const __VLS_0 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('admin.dashboard.widgets.shortcuts')), ...{ class: "h-full" },
    }));
    const __VLS_2 = __VLS_1({
        title: (__VLS_unwrap(t, {})('admin.dashboard.widgets.shortcuts')),
        ...{ class: "h-full" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-wrap gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    const __VLS_6 = __VLS_tryAsConstant((__VLS_unwrap(links, {})));
    for (const [link] of __VLS_vFor(__VLS_nonNull(__VLS_6))) {
        let __VLS_7;
        /** @ts-ignore @type { | typeof __VLS_components.RouterLink | typeof __VLS_components.RouterLink} */
        RouterLink;
        // @ts-ignore
        const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
            // @ts-ignore
            key: (link.key), to: ({ path: '/admin', query: link.query }), ...{ class: "rounded bg-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-flixer-accent" },
        }));
        const __VLS_9 = __VLS_8({
            key: (link.key),
            to: ({ path: '/admin', query: link.query }),
            ...{ class: "rounded bg-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-flixer-accent" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_8));
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/20']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        var __VLS_10;
        const { default: __VLS_12 } = __VLS_nonNull(__VLS_10.slots);
        (__VLS_unwrap(t, {})(`admin.dashboard.shortcutNames.${link.key}`));
        // @ts-ignore
        [t, t, links,];
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
