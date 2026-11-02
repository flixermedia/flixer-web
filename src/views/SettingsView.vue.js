import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import Header from '../components/header/Header.vue';
import DefaultPlaybackOptionsSection from '../components/settings/DefaultPlaybackOptionsSection.vue';
import LanguageSection from '../components/settings/LanguageSection.vue';
import PasskeysSection from '../components/settings/PasskeysSection.vue';
import ProfileSection from '../components/settings/ProfileSection.vue';
import ServerSection from '../components/settings/ServerSection.vue';
import { useSignOut } from '../composables/useSignOut';
import { isNativeApp } from '../platform/serverConnection';
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { isSigningOut, signOut } = useSignOut();
const tabIcons = {
    profile: 'lucide:user-round',
    passkeys: 'lucide:fingerprint',
    language: 'lucide:languages',
    defaultPlayback: 'lucide:play',
};
const tabs = computed(() => {
    return [{ id: 'profile', label: t('settings.tabs.profile') }, ...(!isNativeApp() ? [{ id: 'passkeys', label: t('settings.tabs.passkeys') }] : []), { id: 'language', label: t('settings.tabs.language') }, { id: 'defaultPlayback', label: t('settings.tabs.defaultPlayback') }];
});
const activeTab = computed({
    get: () => {
        const requested = typeof route.query.tab === 'string' ? route.query.tab : 'profile';
        return tabs.value.some((tab) => tab.id === requested) ? requested : 'profile';
    },
    set: (id) => {
        void router.replace({ query: { ...route.query, tab: id } });
    },
});
function selectTab(id) {
    activeTab.value = id;
}
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(router, {});
    __VLS_withDotValue(activeTab, {});
    __VLS_withDotValue(tabIcons, {});
    void {};
    /** @type {__VLS_StyleScopedClasses['settings-panel-enter-active']} */ ;
    /** @type {__VLS_StyleScopedClasses['settings-panel-leave-active']} */ ;
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
        ...{ class: "page-gutter mx-auto w-full max-w-[110rem] pb-16 pt-24 lg:pt-28" },
    });
    /** @type {__VLS_StyleScopedClasses['page-gutter']} */ ;
    /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-[110rem]']} */ ;
    /** @type {__VLS_StyleScopedClasses['pb-16']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-24']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:pt-28']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
        ...{ class: "admin-card mb-6 flex flex-wrap items-center justify-between gap-5 p-5 sm:p-6" },
    });
    /** @type {__VLS_StyleScopedClasses['admin-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:p-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex min-w-0 items-center gap-4" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "grid size-12 shrink-0 place-items-center rounded border border-flixer-accent/25 bg-flixer-primary/20 text-flixer-accent shadow-inner shadow-white/5" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['size-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-accent/25']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-primary/20']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-inner']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-white/5']} */ ;
    let __VLS_7;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        // @ts-ignore
        icon: "lucide:settings-2", ...{ class: "size-6" }, 'aria-hidden': "true",
    }));
    const __VLS_9 = __VLS_8({
        icon: "lucide:settings-2",
        ...{ class: "size-6" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    /** @type {__VLS_StyleScopedClasses['size-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "min-w-0" },
    });
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
        ...{ class: "truncate text-2xl font-semibold tracking-tight text-white sm:text-3xl" },
    });
    /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-tight']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:text-3xl']} */ ;
    (__VLS_unwrap(t, {})('settings.title'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-1 text-sm text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('settings.subtitle'));
    if (__VLS_unwrap(isNativeApp, {})()) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!(__VLS_unwrap(isNativeApp, {})()))
                        throw 0;
                    return (router.value.push({ name: 'connect' }));
                    // @ts-ignore
                    [isSigningOut, signOut, t, t, isNativeApp, router,];
                } },
            type: "button",
            ...{ class: "inline-flex items-center gap-2 rounded border border-flixer-border bg-white/5 px-4 py-2.5 text-sm font-medium text-flixer-text transition hover:border-white/20 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
        });
        /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/5']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:border-white/20']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        let __VLS_12;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
            // @ts-ignore
            icon: "lucide:server", ...{ class: "size-4" }, 'aria-hidden': "true",
        }));
        const __VLS_14 = __VLS_13({
            icon: "lucide:server",
            ...{ class: "size-4" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_13));
        /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
        (__VLS_unwrap(t, {})('native.changeServer'));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid min-w-0 gap-5 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:grid-cols-[15rem_minmax(0,1fr)]']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:items-start']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.nav, __VLS_intrinsics.nav)({
        ...{ class: "admin-card flex min-w-0 gap-1 overflow-x-auto p-2 lg:sticky lg:top-20 lg:flex-col" },
        'aria-label': (__VLS_unwrap(t, {})('settings.title')),
        role: "tablist",
    });
    /** @type {__VLS_StyleScopedClasses['admin-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-x-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:sticky']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:top-20']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:flex-col']} */ ;
    const __VLS_17 = __VLS_tryAsConstant((__VLS_unwrap(tabs, {})));
    for (const [tab] of __VLS_vFor(__VLS_nonNull(__VLS_17))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    return (selectTab(tab.id));
                    // @ts-ignore
                    [t, t, tabs,];
                } },
            id: (`settings-tab-${tab.id}`),
            key: (tab.id),
            type: "button",
            role: "tab",
            ...{ class: "group relative inline-flex min-h-11 shrink-0 items-center gap-3 rounded px-3 py-2.5 text-left text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent lg:w-full" },
            ...{ class: (activeTab.value === tab.id ? 'bg-flixer-primary/20 text-white shadow-inner shadow-white/5' : 'text-flixer-text/70 hover:bg-white/5 hover:text-white') },
            'aria-selected': (activeTab.value === tab.id),
            'aria-controls': "settings-panel",
        });
        /** @type {__VLS_StyleScopedClasses['group']} */ ;
        /** @type {__VLS_StyleScopedClasses['relative']} */ ;
        /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['min-h-11']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        /** @type {__VLS_StyleScopedClasses['lg:w-full']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "grid size-8 shrink-0 place-items-center rounded" },
            ...{ class: (activeTab.value === tab.id ? 'bg-flixer-primary/30 text-flixer-accent' : 'text-flixer-muted transition group-hover:text-white') },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-8']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        let __VLS_18;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
            // @ts-ignore
            icon: (tabIcons.value[tab.id] ?? 'lucide:settings-2'), ...{ class: "size-4" }, 'aria-hidden': "true",
        }));
        const __VLS_20 = __VLS_19({
            icon: (tabIcons.value[tab.id] ?? 'lucide:settings-2'),
            ...{ class: "size-4" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_19));
        /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "whitespace-nowrap" },
        });
        /** @type {__VLS_StyleScopedClasses['whitespace-nowrap']} */ ;
        (tab.label);
        if (activeTab.value === tab.id) {
            let __VLS_23;
            /** @ts-ignore @type { | typeof __VLS_components.Icon} */
            Icon;
            // @ts-ignore
            const __VLS_24 = __VLS_asFunctionalComponent1(__VLS_23, new __VLS_23({
                // @ts-ignore
                icon: "lucide:chevron-right", ...{ class: "ml-auto hidden size-4 text-flixer-accent lg:block" }, 'aria-hidden': "true",
            }));
            const __VLS_25 = __VLS_24({
                icon: "lucide:chevron-right",
                ...{ class: "ml-auto hidden size-4 text-flixer-accent lg:block" },
                'aria-hidden': "true",
            }, ...__VLS_functionalComponentArgsRest(__VLS_24));
            /** @type {__VLS_StyleScopedClasses['ml-auto']} */ ;
            /** @type {__VLS_StyleScopedClasses['hidden']} */ ;
            /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
            /** @type {__VLS_StyleScopedClasses['lg:block']} */ ;
        }
        // @ts-ignore
        [activeTab, activeTab, activeTab, activeTab, tabIcons,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        id: "settings-panel",
        ...{ class: "admin-card min-w-0 p-5 sm:p-6 lg:p-7" },
        role: "tabpanel",
        'aria-labelledby': (`settings-tab-${activeTab.value}`),
        tabindex: "0",
    });
    /** @type {__VLS_StyleScopedClasses['admin-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:p-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:p-7']} */ ;
    let __VLS_28;
    /** @ts-ignore @type { | typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
    Transition;
    // @ts-ignore
    const __VLS_29 = __VLS_asFunctionalComponent1(__VLS_28, new __VLS_28({
        // @ts-ignore
        name: "settings-panel", mode: "out-in",
    }));
    const __VLS_30 = __VLS_29({
        name: "settings-panel",
        mode: "out-in",
    }, ...__VLS_functionalComponentArgsRest(__VLS_29));
    var __VLS_31;
    const { default: __VLS_33 } = __VLS_nonNull(__VLS_31.slots);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (activeTab.value),
    });
    if (activeTab.value === 'profile') {
        const __VLS_34 = ProfileSection;
        // @ts-ignore
        const __VLS_35 = __VLS_asFunctionalComponent1(__VLS_34, new __VLS_34({
        // @ts-ignore
        }));
        const __VLS_36 = __VLS_35({}, ...__VLS_functionalComponentArgsRest(__VLS_35));
    }
    else if (activeTab.value === 'passkeys') {
        const __VLS_39 = PasskeysSection;
        // @ts-ignore
        const __VLS_40 = __VLS_asFunctionalComponent1(__VLS_39, new __VLS_39({
        // @ts-ignore
        }));
        const __VLS_41 = __VLS_40({}, ...__VLS_functionalComponentArgsRest(__VLS_40));
    }
    else if (activeTab.value === 'language') {
        const __VLS_44 = LanguageSection;
        // @ts-ignore
        const __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44({
        // @ts-ignore
        }));
        const __VLS_46 = __VLS_45({}, ...__VLS_functionalComponentArgsRest(__VLS_45));
    }
    else if (activeTab.value === 'defaultPlayback') {
        const __VLS_49 = DefaultPlaybackOptionsSection;
        // @ts-ignore
        const __VLS_50 = __VLS_asFunctionalComponent1(__VLS_49, new __VLS_49({
        // @ts-ignore
        }));
        const __VLS_51 = __VLS_50({}, ...__VLS_functionalComponentArgsRest(__VLS_50));
    }
    else if (activeTab.value === 'server') {
        const __VLS_54 = ServerSection;
        // @ts-ignore
        const __VLS_55 = __VLS_asFunctionalComponent1(__VLS_54, new __VLS_54({
        // @ts-ignore
        }));
        const __VLS_56 = __VLS_55({}, ...__VLS_functionalComponentArgsRest(__VLS_55));
    }
    // @ts-ignore
    [activeTab, activeTab, activeTab, activeTab, activeTab, activeTab, activeTab,];
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
