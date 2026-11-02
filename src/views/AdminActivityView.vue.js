import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import ActivityPanel from '../components/admin/ActivityPanel.vue';
import AdminSidebar from '../components/admin/AdminSidebar.vue';
import { adminQuery } from '../components/admin/adminNav';
import Header from '../components/header/Header.vue';
import { useAdminTabs } from '../composables/useAdminTabs';
import { useAdminSidebar } from '../composables/useAdminSidebar';
import { useSignOut } from '../composables/useSignOut';
const router = useRouter();
const { t } = useI18n();
const { isSigningOut, signOut } = useSignOut();
const { compact: sidebarCompact, toggleCompact: toggleSidebarCompact } = useAdminSidebar();
const tabs = useAdminTabs();
const active = { tab: 'dashboard', page: 'overview' };
function open({ tab, page }) {
    void router.push({ name: 'admin', query: adminQuery(tab, page) });
}
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(sidebarCompact, {});
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
        ...{ 'onSelect': {} }, ...{ 'onToggleCompact': {} }, tabs: (__VLS_unwrap(tabs, {})), active: (__VLS_unwrap(active, {})), title: (__VLS_unwrap(t, {})('admin.title')), subtitle: (__VLS_unwrap(t, {})('admin.subtitle')), compact: (sidebarCompact.value),
    }));
    const __VLS_9 = __VLS_8({
        ...{ 'onSelect': {} },
        ...{ 'onToggleCompact': {} },
        tabs: (__VLS_unwrap(tabs, {})),
        active: (__VLS_unwrap(active, {})),
        title: (__VLS_unwrap(t, {})('admin.title')),
        subtitle: (__VLS_unwrap(t, {})('admin.subtitle')),
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "min-w-0" },
    });
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-4" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    const __VLS_15 = ActivityPanel;
    // @ts-ignore
    const __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
    // @ts-ignore
    }));
    const __VLS_17 = __VLS_16({}, ...__VLS_functionalComponentArgsRest(__VLS_16));
    // @ts-ignore
    [isSigningOut, signOut, sidebarCompact, sidebarCompact, tabs, active, t, t, toggleSidebarCompact,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
