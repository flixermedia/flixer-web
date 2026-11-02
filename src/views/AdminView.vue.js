import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import AdminSidebar from '../components/admin/AdminSidebar.vue';
import { adminQuery, resolveAdminLocation } from '../components/admin/adminNav';
import { ADMIN_PAGE_BLOCKS } from '../components/admin/adminPages';
import PluginSettingsPage from '../components/admin/PluginSettingsPage.vue';
import Header from '../components/header/Header.vue';
import { useAdminTabs } from '../composables/useAdminTabs';
import { useAdminSidebar } from '../composables/useAdminSidebar';
import { useSignOut } from '../composables/useSignOut';
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { isSigningOut, signOut } = useSignOut();
const { compact: sidebarCompact, toggleCompact: toggleSidebarCompact } = useAdminSidebar();
const tabs = useAdminTabs();
const location = computed(() => resolveAdminLocation(route.query.tab, route.query.page));
const blocks = computed(() => ADMIN_PAGE_BLOCKS[location.value.page]);
const pluginId = computed(() => (location.value.tab === 'plugins' && typeof route.query.plugin === 'string' ? route.query.plugin : ''));
function open({ tab, page }) {
    // Filters such as the media search belong to the page that set them, so they do not follow to the next one.
    const query = Object.fromEntries(Object.entries(route.query).filter(([key]) => !key.startsWith('m') && key !== 'tab' && key !== 'page'));
    void router.replace({ query: { ...query, ...adminQuery(tab, page) } });
}
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(sidebarCompact, {});
    __VLS_withDotValue(location, {});
    __VLS_withDotValue(pluginId, {});
    void {};
    /** @type {__VLS_StyleScopedClasses['admin-page-enter-active']} */ ;
    /** @type {__VLS_StyleScopedClasses['admin-page-leave-active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "min-h-screen overflow-x-hidden bg-flixer-background font-sans text-flixer-text" },
    });
    /** @type {__VLS_StyleScopedClasses['min-h-screen']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-x-hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-sans']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
    const __VLS_0 = Header;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        ...{ 'onLogout': {} }, docked: (true), links: ([]), isSigningOut: (__VLS_unwrap(isSigningOut, {})),
    }));
    const __VLS_2 = __VLS_1({
        ...{ 'onLogout': {} },
        docked: (true),
        links: ([]),
        isSigningOut: (__VLS_unwrap(isSigningOut, {})),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    let __VLS_5;
    const __VLS_6 = {
        /** @type {typeof __VLS_5.logout} */
        onLogout: (__VLS_unwrap(signOut, {})),
    };
    void __VLS_6;
    var __VLS_3;
    var __VLS_4;
    __VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({
        ...{ class: "page-gutter w-full pb-16 pt-20 transition-[margin-left,width] duration-300 ease-in-out motion-reduce:transition-none lg:pt-16" },
        ...{ class: (sidebarCompact.value ? 'lg:ml-20 lg:w-[calc(100%-5rem)]' : 'lg:ml-60 lg:w-[calc(100%-15rem)]') },
    });
    /** @type {__VLS_StyleScopedClasses['page-gutter']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['pb-16']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-20']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-[margin-left,width]']} */ ;
    /** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['ease-in-out']} */ ;
    /** @type {__VLS_StyleScopedClasses['motion-reduce:transition-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:pt-16']} */ ;
    const __VLS_7 = AdminSidebar;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        // @ts-ignore
        ...{ 'onSelect': {} }, ...{ 'onToggleCompact': {} }, tabs: (__VLS_unwrap(tabs, {})), active: (location.value), title: (location.value.page === 'overview' ? __VLS_unwrap(t, {})('admin.title') : __VLS_unwrap(t, {})(`admin.pages.${location.value.page}`)), subtitle: (__VLS_unwrap(t, {})(`admin.subtitles.${location.value.page}`)), compact: (sidebarCompact.value),
    }));
    const __VLS_9 = __VLS_8({
        ...{ 'onSelect': {} },
        ...{ 'onToggleCompact': {} },
        tabs: (__VLS_unwrap(tabs, {})),
        active: (location.value),
        title: (location.value.page === 'overview' ? __VLS_unwrap(t, {})('admin.title') : __VLS_unwrap(t, {})(`admin.pages.${location.value.page}`)),
        subtitle: (__VLS_unwrap(t, {})(`admin.subtitles.${location.value.page}`)),
        compact: (sidebarCompact.value),
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    let __VLS_12;
    const __VLS_13 = {
        /** @type {typeof __VLS_12.select} */
        onSelect: (open),
    };
    void __VLS_13;
    const __VLS_14 = {
        /** @type {typeof __VLS_12.toggleCompact} */
        onToggleCompact: (__VLS_unwrap(toggleSidebarCompact, {})),
    };
    void __VLS_14;
    var __VLS_10;
    var __VLS_11;
    let __VLS_15;
    /** @ts-ignore @type { | typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
    Transition;
    // @ts-ignore
    const __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
        // @ts-ignore
        name: "admin-page", mode: "out-in",
    }));
    const __VLS_17 = __VLS_16({
        name: "admin-page",
        mode: "out-in",
    }, ...__VLS_functionalComponentArgsRest(__VLS_16));
    var __VLS_18;
    const { default: __VLS_20 } = __VLS_nonNull(__VLS_18.slots);
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        key: (`${location.value.page}:${pluginId.value}`),
        ...{ class: "min-w-0" },
    });
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-wrap items-center justify-between gap-3" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        id: "admin-header-actions",
        ...{ class: "flex items-center" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    if (pluginId.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-4" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        const __VLS_21 = PluginSettingsPage;
        // @ts-ignore
        const __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21({
            // @ts-ignore
            key: (pluginId.value), pluginId: (pluginId.value),
        }));
        const __VLS_23 = __VLS_22({
            key: (pluginId.value),
            pluginId: (pluginId.value),
        }, ...__VLS_functionalComponentArgsRest(__VLS_22));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-4 flex flex-col gap-10" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-10']} */ ;
        const __VLS_26 = __VLS_tryAsConstant((__VLS_unwrap(blocks, {})));
        for (const [block, index] of __VLS_vFor(__VLS_nonNull(__VLS_26))) {
            const __VLS_27 = (block.component);
            // @ts-ignore
            const __VLS_28 = __VLS_asFunctionalComponent1(__VLS_27, new __VLS_27({
                // @ts-ignore
                key: (`${location.value.page}-${index}`), ...(block.props),
            }));
            const __VLS_29 = __VLS_28({
                key: (`${location.value.page}-${index}`),
                ...(block.props),
            }, ...__VLS_functionalComponentArgsRest(__VLS_28));
            // @ts-ignore
            [isSigningOut, signOut, sidebarCompact, sidebarCompact, tabs, location, location, location, location, location, location, t, t, t, toggleSidebarCompact, pluginId, pluginId, pluginId, pluginId, blocks,];
        }
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
