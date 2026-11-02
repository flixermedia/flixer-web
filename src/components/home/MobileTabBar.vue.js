import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, useRoute } from 'vue-router';
import { isActivePath } from '../../composables/homeNav';
const { defineProps, } = {};
const props = defineProps();
const { t } = useI18n();
const route = useRoute();
const isDocked = ref(false);
const menuOpen = ref(false);
const navRef = ref(null);
let observer = null;
const homeTab = computed(() => props.tabs.find((tab) => tab.to === '/'));
const discoverTab = computed(() => props.tabs.find((tab) => tab.to === '/discover'));
const searchTab = computed(() => props.tabs.find((tab) => tab.to === '/search'));
const menuTabs = computed(() => props.tabs.filter((tab) => !['/', '/discover', '/search'].includes(tab.to)));
const menuIsActive = computed(() => menuTabs.value.some((tab) => isActivePath(route.path, tab.to)));
function onPointerDown(event) {
    if (menuOpen.value && navRef.value && !navRef.value.contains(event.target)) {
        menuOpen.value = false;
    }
}
function onKeydown(event) {
    if (event.key === 'Escape')
        menuOpen.value = false;
}
function updateDocked() {
    isDocked.value = window.scrollY > 24;
}
// Other fixed UI (the mini player) sits above the tab bar using this height.
function publishHeight() {
    document.documentElement.style.setProperty('--tabbar-height', `${navRef.value?.offsetHeight ?? 0}px`);
}
onMounted(() => {
    updateDocked();
    window.addEventListener('scroll', updateDocked, { passive: true });
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeydown);
    publishHeight();
    if (navRef.value && typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(publishHeight);
        observer.observe(navRef.value);
    }
});
onBeforeUnmount(() => {
    window.removeEventListener('scroll', updateDocked);
    document.removeEventListener('pointerdown', onPointerDown);
    document.removeEventListener('keydown', onKeydown);
    observer?.disconnect();
    document.documentElement.style.removeProperty('--tabbar-height');
});
watch(() => route.path, () => {
    menuOpen.value = false;
});
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
    __VLS_withDotValue(isDocked, {});
    __VLS_withDotValue(homeTab, {});
    __VLS_withDotValue(route, {});
    __VLS_withDotValue(menuOpen, {});
    __VLS_withDotValue(menuIsActive, {});
    __VLS_withDotValue(discoverTab, {});
    __VLS_withDotValue(searchTab, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.nav, __VLS_intrinsics.nav)({
        ref: "navRef",
        'data-haptic': true,
        ...{ class: "pointer-events-none fixed inset-x-0 bottom-0 z-30 transition-[padding] duration-300 ease-out lg:hidden" },
        ...{ class: (isDocked.value ? 'px-0' : 'px-4') },
        ...{ style: ({ paddingBottom: isDocked.value ? '0px' : 'max(0.75rem, env(safe-area-inset-bottom))' }) },
        'aria-label': (__VLS_unwrap(t, {})('home.tabs')),
    });
    /** @type {__VLS_StyleScopedClasses['pointer-events-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['fixed']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-x-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['bottom-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-30']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-[padding]']} */ ;
    /** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['ease-out']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:hidden']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "pointer-events-auto relative mx-auto flex max-w-full items-center justify-around border border-white/10 bg-flixer-surface/80 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl transition-[max-width,border-radius,border-color] duration-300 ease-out" },
        ...{ class: (isDocked.value ? 'rounded-none border-x-0 border-b-0 border-t-white/10' : 'rounded') },
        ...{ style: (isDocked.value ? { paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' } : undefined) },
    });
    /** @type {__VLS_StyleScopedClasses['pointer-events-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-around']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/80']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-black/50']} */ ;
    /** @type {__VLS_StyleScopedClasses['backdrop-blur-xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-[max-width,border-radius,border-color]']} */ ;
    /** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['ease-out']} */ ;
    if (homeTab.value) {
        let __VLS_0;
        /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
        RouterLink;
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
            // @ts-ignore
            to: (homeTab.value.to), ...{ class: "group flex h-12 min-w-14 flex-1 flex-col items-center justify-center gap-0.5 rounded text-[10px] font-medium transition focus-visible:outline-2 focus-visible:outline-flixer-accent" }, ...{ class: (__VLS_unwrap(isActivePath, {})(route.value.path, homeTab.value.to) ? 'bg-flixer-primary/20 text-white' : 'text-flixer-muted hover:text-white') }, 'aria-current': (__VLS_unwrap(isActivePath, {})(route.value.path, homeTab.value.to) ? 'page' : undefined),
        }));
        const __VLS_2 = __VLS_1({
            to: (homeTab.value.to),
            ...{ class: "group flex h-12 min-w-14 flex-1 flex-col items-center justify-center gap-0.5 rounded text-[10px] font-medium transition focus-visible:outline-2 focus-visible:outline-flixer-accent" },
            ...{ class: (__VLS_unwrap(isActivePath, {})(route.value.path, homeTab.value.to) ? 'bg-flixer-primary/20 text-white' : 'text-flixer-muted hover:text-white') },
            'aria-current': (__VLS_unwrap(isActivePath, {})(route.value.path, homeTab.value.to) ? 'page' : undefined),
        }, ...__VLS_functionalComponentArgsRest(__VLS_1));
        /** @type {__VLS_StyleScopedClasses['group']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-12']} */ ;
        /** @type {__VLS_StyleScopedClasses['min-w-14']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-0.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        var __VLS_3;
        const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
        let __VLS_6;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
            // @ts-ignore
            icon: (homeTab.value.icon), ...{ class: "size-5 transition group-active:scale-90" }, ...{ class: (__VLS_unwrap(isActivePath, {})(route.value.path, homeTab.value.to) ? 'text-flixer-accent' : '') }, 'aria-hidden': "true",
        }));
        const __VLS_8 = __VLS_7({
            icon: (homeTab.value.icon),
            ...{ class: "size-5 transition group-active:scale-90" },
            ...{ class: (__VLS_unwrap(isActivePath, {})(route.value.path, homeTab.value.to) ? 'text-flixer-accent' : '') },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_7));
        /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['group-active:scale-90']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "max-w-full truncate" },
        });
        /** @type {__VLS_StyleScopedClasses['max-w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
        (homeTab.value.label);
        // @ts-ignore
        [isDocked, isDocked, isDocked, isDocked, t, homeTab, homeTab, homeTab, homeTab, homeTab, homeTab, homeTab, isActivePath, isActivePath, isActivePath, route, route, route,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                void $event;
                return (menuOpen.value = !menuOpen.value);
                // @ts-ignore
                [menuOpen, menuOpen,];
            } },
        id: "mobile-tab-more",
        type: "button",
        ...{ class: "group flex h-12 min-w-14 flex-1 flex-col items-center justify-center gap-0.5 rounded text-[10px] font-medium transition focus-visible:outline-2 focus-visible:outline-flixer-accent" },
        ...{ class: (menuIsActive.value || menuOpen.value ? 'bg-flixer-primary/20 text-white' : 'text-flixer-muted hover:text-white') },
        'aria-expanded': (menuOpen.value),
        'aria-haspopup': "true",
        'aria-controls': "mobile-tab-menu",
        'aria-label': (__VLS_unwrap(t, {})('home.nav.more')),
    });
    /** @type {__VLS_StyleScopedClasses['group']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-14']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-0.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    let __VLS_11;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11({
        // @ts-ignore
        icon: "lucide:menu", ...{ class: "size-5 transition group-active:scale-90" }, ...{ class: (menuIsActive.value || menuOpen.value ? 'text-flixer-accent' : '') }, 'aria-hidden': "true",
    }));
    const __VLS_13 = __VLS_12({
        icon: "lucide:menu",
        ...{ class: "size-5 transition group-active:scale-90" },
        ...{ class: (menuIsActive.value || menuOpen.value ? 'text-flixer-accent' : '') },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_12));
    /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['group-active:scale-90']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_unwrap(t, {})('home.nav.more'));
    if (discoverTab.value) {
        let __VLS_16;
        /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
        RouterLink;
        // @ts-ignore
        const __VLS_17 = __VLS_asFunctionalComponent1(__VLS_16, new __VLS_16({
            // @ts-ignore
            to: (discoverTab.value.to), ...{ class: "group flex h-12 min-w-14 flex-1 flex-col items-center justify-center gap-0.5 rounded text-[10px] font-medium transition focus-visible:outline-2 focus-visible:outline-flixer-accent" }, ...{ class: (__VLS_unwrap(isActivePath, {})(route.value.path, discoverTab.value.to) ? 'bg-flixer-primary/20 text-white' : 'text-flixer-muted hover:text-white') }, 'aria-current': (__VLS_unwrap(isActivePath, {})(route.value.path, discoverTab.value.to) ? 'page' : undefined),
        }));
        const __VLS_18 = __VLS_17({
            to: (discoverTab.value.to),
            ...{ class: "group flex h-12 min-w-14 flex-1 flex-col items-center justify-center gap-0.5 rounded text-[10px] font-medium transition focus-visible:outline-2 focus-visible:outline-flixer-accent" },
            ...{ class: (__VLS_unwrap(isActivePath, {})(route.value.path, discoverTab.value.to) ? 'bg-flixer-primary/20 text-white' : 'text-flixer-muted hover:text-white') },
            'aria-current': (__VLS_unwrap(isActivePath, {})(route.value.path, discoverTab.value.to) ? 'page' : undefined),
        }, ...__VLS_functionalComponentArgsRest(__VLS_17));
        /** @type {__VLS_StyleScopedClasses['group']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-12']} */ ;
        /** @type {__VLS_StyleScopedClasses['min-w-14']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-0.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        var __VLS_19;
        const { default: __VLS_21 } = __VLS_nonNull(__VLS_19.slots);
        let __VLS_22;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_23 = __VLS_asFunctionalComponent1(__VLS_22, new __VLS_22({
            // @ts-ignore
            icon: (discoverTab.value.icon), ...{ class: "size-5 transition group-active:scale-90" }, ...{ class: (__VLS_unwrap(isActivePath, {})(route.value.path, discoverTab.value.to) ? 'text-flixer-accent' : '') }, 'aria-hidden': "true",
        }));
        const __VLS_24 = __VLS_23({
            icon: (discoverTab.value.icon),
            ...{ class: "size-5 transition group-active:scale-90" },
            ...{ class: (__VLS_unwrap(isActivePath, {})(route.value.path, discoverTab.value.to) ? 'text-flixer-accent' : '') },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_23));
        /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['group-active:scale-90']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "max-w-full truncate" },
        });
        /** @type {__VLS_StyleScopedClasses['max-w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
        (discoverTab.value.label);
        // @ts-ignore
        [t, t, isActivePath, isActivePath, isActivePath, route, route, route, menuOpen, menuOpen, menuOpen, menuIsActive, menuIsActive, discoverTab, discoverTab, discoverTab, discoverTab, discoverTab, discoverTab, discoverTab,];
    }
    if (searchTab.value) {
        let __VLS_27;
        /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
        RouterLink;
        // @ts-ignore
        const __VLS_28 = __VLS_asFunctionalComponent1(__VLS_27, new __VLS_27({
            // @ts-ignore
            to: (searchTab.value.to), ...{ class: "group flex h-12 min-w-14 flex-1 flex-col items-center justify-center gap-0.5 rounded text-[10px] font-medium transition focus-visible:outline-2 focus-visible:outline-flixer-accent" }, ...{ class: (__VLS_unwrap(isActivePath, {})(route.value.path, searchTab.value.to) ? 'bg-flixer-primary/20 text-white' : 'text-flixer-muted hover:text-white') }, 'aria-current': (__VLS_unwrap(isActivePath, {})(route.value.path, searchTab.value.to) ? 'page' : undefined),
        }));
        const __VLS_29 = __VLS_28({
            to: (searchTab.value.to),
            ...{ class: "group flex h-12 min-w-14 flex-1 flex-col items-center justify-center gap-0.5 rounded text-[10px] font-medium transition focus-visible:outline-2 focus-visible:outline-flixer-accent" },
            ...{ class: (__VLS_unwrap(isActivePath, {})(route.value.path, searchTab.value.to) ? 'bg-flixer-primary/20 text-white' : 'text-flixer-muted hover:text-white') },
            'aria-current': (__VLS_unwrap(isActivePath, {})(route.value.path, searchTab.value.to) ? 'page' : undefined),
        }, ...__VLS_functionalComponentArgsRest(__VLS_28));
        /** @type {__VLS_StyleScopedClasses['group']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-12']} */ ;
        /** @type {__VLS_StyleScopedClasses['min-w-14']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-0.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        var __VLS_30;
        const { default: __VLS_32 } = __VLS_nonNull(__VLS_30.slots);
        let __VLS_33;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_34 = __VLS_asFunctionalComponent1(__VLS_33, new __VLS_33({
            // @ts-ignore
            icon: (searchTab.value.icon), ...{ class: "size-5 transition group-active:scale-90" }, ...{ class: (__VLS_unwrap(isActivePath, {})(route.value.path, searchTab.value.to) ? 'text-flixer-accent' : '') }, 'aria-hidden': "true",
        }));
        const __VLS_35 = __VLS_34({
            icon: (searchTab.value.icon),
            ...{ class: "size-5 transition group-active:scale-90" },
            ...{ class: (__VLS_unwrap(isActivePath, {})(route.value.path, searchTab.value.to) ? 'text-flixer-accent' : '') },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_34));
        /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['group-active:scale-90']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "max-w-full truncate" },
        });
        /** @type {__VLS_StyleScopedClasses['max-w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
        (searchTab.value.label);
        // @ts-ignore
        [isActivePath, isActivePath, isActivePath, route, route, route, searchTab, searchTab, searchTab, searchTab, searchTab, searchTab, searchTab,];
    }
    if (menuOpen.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            id: "mobile-tab-menu",
            ...{ class: "absolute inset-x-0 bottom-full mb-3 grid max-h-[60vh] grid-cols-3 gap-1 overflow-y-auto rounded border border-white/10 bg-flixer-surface/95 p-2 shadow-2xl shadow-black/60 backdrop-blur-xl" },
            'aria-label': (__VLS_unwrap(t, {})('home.nav.more')),
            role: "group",
        });
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['inset-x-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['bottom-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['max-h-[60vh]']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid-cols-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/95']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-2xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-black/60']} */ ;
        /** @type {__VLS_StyleScopedClasses['backdrop-blur-xl']} */ ;
        const __VLS_38 = __VLS_tryAsConstant((__VLS_unwrap(menuTabs, {})));
        for (const [tab] of __VLS_vFor(__VLS_nonNull(__VLS_38))) {
            let __VLS_39;
            /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
            RouterLink;
            // @ts-ignore
            const __VLS_40 = __VLS_asFunctionalComponent1(__VLS_39, new __VLS_39({
                // @ts-ignore
                ...{ 'onClick': {} }, key: (tab.to), to: (tab.to), ...{ class: "flex min-w-0 flex-col items-center justify-center gap-1 rounded px-2 py-3 text-center text-xs font-medium transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-flixer-accent" }, ...{ class: (__VLS_unwrap(isActivePath, {})(route.value.path, tab.to) ? 'bg-flixer-primary/20 text-white' : 'text-flixer-muted hover:text-white') }, 'aria-current': (__VLS_unwrap(isActivePath, {})(route.value.path, tab.to) ? 'page' : undefined),
            }));
            const __VLS_41 = __VLS_40({
                ...{ 'onClick': {} },
                key: (tab.to),
                to: (tab.to),
                ...{ class: "flex min-w-0 flex-col items-center justify-center gap-1 rounded px-2 py-3 text-center text-xs font-medium transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-flixer-accent" },
                ...{ class: (__VLS_unwrap(isActivePath, {})(route.value.path, tab.to) ? 'bg-flixer-primary/20 text-white' : 'text-flixer-muted hover:text-white') },
                'aria-current': (__VLS_unwrap(isActivePath, {})(route.value.path, tab.to) ? 'page' : undefined),
            }, ...__VLS_functionalComponentArgsRest(__VLS_40));
            let __VLS_44;
            const __VLS_45 = {
                /** @type {typeof __VLS_44.click} */
                onClick: (...[$event]) => {
                    void $event;
                    if (!(menuOpen.value))
                        throw 0;
                    return (menuOpen.value = false);
                    // @ts-ignore
                    [t, isActivePath, isActivePath, route, route, menuOpen, menuOpen, menuTabs,];
                },
            };
            void __VLS_45;
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
            var __VLS_42;
            var __VLS_43;
            const { default: __VLS_46 } = __VLS_nonNull(__VLS_42.slots);
            let __VLS_47;
            /** @ts-ignore @type { | typeof __VLS_components.Icon} */
            Icon;
            // @ts-ignore
            const __VLS_48 = __VLS_asFunctionalComponent1(__VLS_47, new __VLS_47({
                // @ts-ignore
                icon: (tab.icon), ...{ class: "size-5 shrink-0" }, ...{ class: (__VLS_unwrap(isActivePath, {})(route.value.path, tab.to) ? 'text-flixer-accent' : '') }, 'aria-hidden': "true",
            }));
            const __VLS_49 = __VLS_48({
                icon: (tab.icon),
                ...{ class: "size-5 shrink-0" },
                ...{ class: (__VLS_unwrap(isActivePath, {})(route.value.path, tab.to) ? 'text-flixer-accent' : '') },
                'aria-hidden': "true",
            }, ...__VLS_functionalComponentArgsRest(__VLS_48));
            /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "max-w-full truncate" },
            });
            /** @type {__VLS_StyleScopedClasses['max-w-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
            (tab.label);
            // @ts-ignore
            [isActivePath, route,];
            // @ts-ignore
            [];
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
