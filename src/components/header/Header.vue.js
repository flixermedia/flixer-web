import { openModal } from '@kolirt/vue-modal';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, useRoute } from 'vue-router';
import logoUrl from '../../../resources/logo/flixer-logo.svg';
import { isActivePath } from '../../composables/homeNav';
import { useProfile } from '../../composables/useProfile';
import ChatButton from './ChatButton.vue';
import NotificationBell from './NotificationBell.vue';
import PartyButton from './PartyButton.vue';
import LanguageModal from '../ui/LanguageModal.vue';
import ThemeModal from '../ui/ThemeModal.vue';
import UserAvatar from '../ui/UserAvatar.vue';
const { defineProps, defineEmits, withDefaults, } = {};
const props = withDefaults(defineProps(), { navPosition: 'center', navBackground: true, docked: false, disableScrollCollapse: false });
const emit = defineEmits();
const { t } = useI18n();
const { profile, load: loadProfile } = useProfile();
const menuOpen = ref(false);
const scrolledPast = ref(false);
const scrolled = computed(() => props.docked || (!props.disableScrollCollapse && scrolledPast.value));
const menuRoot = ref(null);
const route = useRoute();
function openLanguage() {
    menuOpen.value = false;
    void openModal(LanguageModal).catch(() => undefined);
}
function openTheme() {
    menuOpen.value = false;
    void openModal(ThemeModal).catch(() => undefined);
}
function onScroll() {
    scrolledPast.value = window.scrollY > 24;
}
function onPointerDown(event) {
    if (menuOpen.value && menuRoot.value && !menuRoot.value.contains(event.target)) {
        menuOpen.value = false;
    }
}
function onKeydown(event) {
    if (event.key === 'Escape') {
        menuOpen.value = false;
    }
}
onMounted(() => {
    void loadProfile();
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeydown);
});
onBeforeUnmount(() => {
    window.removeEventListener('scroll', onScroll);
    document.removeEventListener('pointerdown', onPointerDown);
    document.removeEventListener('keydown', onKeydown);
});
const iconButton = 'grid size-10 place-items-center rounded text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent';
const __VLS_defaults = { navPosition: 'center', navBackground: true, docked: false, disableScrollCollapse: false };
void __VLS_defaults;
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
    __VLS_withDotValue(scrolled, {});
    __VLS_withDotValue(route, {});
    __VLS_withDotValue(menuOpen, {});
    __VLS_withDotValue(profile, {});
    void {};
    /** @type {__VLS_StyleScopedClasses['capacitor']} */ ;
    /** @type {__VLS_StyleScopedClasses['app-header']} */ ;
    /** @type {__VLS_StyleScopedClasses['capacitor']} */ ;
    /** @type {__VLS_StyleScopedClasses['app-header']} */ ;
    /** @type {__VLS_StyleScopedClasses['is-scrolled']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
        ...{ class: "app-header fixed inset-x-0 top-0 z-40 transition-[top,padding] duration-300 ease-out" },
        ...{ class: (scrolled.value ? 'is-scrolled p-0' : 'px-3 pt-3 sm:px-6 sm:pt-4') },
    });
    /** @type {__VLS_StyleScopedClasses['app-header']} */ ;
    /** @type {__VLS_StyleScopedClasses['fixed']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-x-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['top-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-40']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-[top,padding]']} */ ;
    /** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['ease-out']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.nav, __VLS_intrinsics.nav)({
        'data-haptic': true,
        ...{ class: "mx-auto grid h-16 grid-cols-[auto_1fr] items-center gap-4 border px-3 backdrop-blur-xl transition-all duration-300 ease-out md:px-4" },
        ...{ class: ([__VLS_ctx.navPosition === 'start' ? 'lg:grid-cols-[auto_auto_1fr]' : 'lg:grid-cols-[1fr_auto_1fr]', scrolled.value ? 'max-w-full rounded-none border-x-0 border-t-0 border-white/10 bg-flixer-background/85 shadow-lg shadow-black/40 sm:px-8 md:px-8' : 'max-w-[110rem] rounded border-white/10 bg-flixer-background/30']) },
        'aria-label': (__VLS_unwrap(t, {})('header.mainNavigation')),
    });
    /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-16']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid-cols-[auto_1fr]']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['backdrop-blur-xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
    /** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['ease-out']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:px-4']} */ ;
    let __VLS_0;
    /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
    RouterLink;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        ...{ class: "flex items-center gap-2.5 justify-self-start rounded pr-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" }, to: "/", 'aria-label': (__VLS_unwrap(t, {})('header.flixerHome')),
    }));
    const __VLS_2 = __VLS_1({
        ...{ class: "flex items-center gap-2.5 justify-self-start rounded pr-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
        to: "/",
        'aria-label': (__VLS_unwrap(t, {})('header.flixerHome')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-self-start']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['pr-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
        src: (__VLS_unwrap(logoUrl, {})),
        alt: "",
        ...{ class: "size-10" },
    });
    /** @type {__VLS_StyleScopedClasses['size-10']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "text-xl font-semibold tracking-tight text-white" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-tight']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    // @ts-ignore
    [scrolled, scrolled, navPosition, t, t, logoUrl,];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "hidden lg:block" },
        ...{ class: (__VLS_ctx.navPosition === 'start' ? 'justify-self-start' : 'justify-self-center') },
    });
    /** @type {__VLS_StyleScopedClasses['hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:block']} */ ;
    var __VLS_6 = {};
    if (__VLS_ctx.links.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
            ...{ class: "flex items-center gap-1 rounded p-1" },
            ...{ class: (__VLS_ctx.navBackground ? 'bg-white/5' : '') },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-1']} */ ;
        const __VLS_8 = __VLS_tryAsConstant((__VLS_ctx.links));
        for (const [link] of __VLS_vFor(__VLS_nonNull(__VLS_8))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                key: (link.to),
            });
            let __VLS_9;
            /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
            RouterLink;
            // @ts-ignore
            const __VLS_10 = __VLS_asFunctionalComponent1(__VLS_9, new __VLS_9({
                // @ts-ignore
                to: (link.to), ...{ class: "block rounded px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" }, ...{ class: (__VLS_unwrap(isActivePath, {})(route.value.path, link.to) ? 'bg-white/15 text-white' : 'text-flixer-text/70 hover:text-white') }, 'aria-current': (__VLS_unwrap(isActivePath, {})(route.value.path, link.to) ? 'page' : undefined),
            }));
            const __VLS_11 = __VLS_10({
                to: (link.to),
                ...{ class: "block rounded px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
                ...{ class: (__VLS_unwrap(isActivePath, {})(route.value.path, link.to) ? 'bg-white/15 text-white' : 'text-flixer-text/70 hover:text-white') },
                'aria-current': (__VLS_unwrap(isActivePath, {})(route.value.path, link.to) ? 'page' : undefined),
            }, ...__VLS_functionalComponentArgsRest(__VLS_10));
            /** @type {__VLS_StyleScopedClasses['block']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
            var __VLS_12;
            const { default: __VLS_14 } = __VLS_nonNull(__VLS_12.slots);
            (link.label);
            // @ts-ignore
            [navPosition, links, links, navBackground, isActivePath, isActivePath, route, route,];
            // @ts-ignore
            [];
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-center justify-self-end gap-1" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-self-end']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    let __VLS_15;
    /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
    RouterLink;
    // @ts-ignore
    const __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
        // @ts-ignore
        to: ({ name: 'search' }), ...{ class: (`hidden lg:grid ${__VLS_unwrap(iconButton, {})}`) }, 'aria-label': (__VLS_unwrap(t, {})('header.search')),
    }));
    const __VLS_17 = __VLS_16({
        to: ({ name: 'search' }),
        ...{ class: (`hidden lg:grid ${__VLS_unwrap(iconButton, {})}`) },
        'aria-label': (__VLS_unwrap(t, {})('header.search')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_16));
    var __VLS_18;
    const { default: __VLS_20 } = __VLS_nonNull(__VLS_18.slots);
    let __VLS_21;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21({
        // @ts-ignore
        icon: "lucide:search", ...{ class: "size-5" }, 'aria-hidden': "true",
    }));
    const __VLS_23 = __VLS_22({
        icon: "lucide:search",
        ...{ class: "size-5" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_22));
    /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
    // @ts-ignore
    [t, iconButton,];
    const __VLS_26 = ChatButton;
    // @ts-ignore
    const __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({
        // @ts-ignore
        buttonClass: (`hidden lg:grid relative ${__VLS_unwrap(iconButton, {})}`),
    }));
    const __VLS_28 = __VLS_27({
        buttonClass: (`hidden lg:grid relative ${__VLS_unwrap(iconButton, {})}`),
    }, ...__VLS_functionalComponentArgsRest(__VLS_27));
    const __VLS_31 = PartyButton;
    // @ts-ignore
    const __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31({
        // @ts-ignore
        buttonClass: (`relative ${__VLS_unwrap(iconButton, {})}`),
    }));
    const __VLS_33 = __VLS_32({
        buttonClass: (`relative ${__VLS_unwrap(iconButton, {})}`),
    }, ...__VLS_functionalComponentArgsRest(__VLS_32));
    const __VLS_36 = NotificationBell;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36({
        // @ts-ignore
        buttonClass: (`relative ${__VLS_unwrap(iconButton, {})}`),
    }));
    const __VLS_38 = __VLS_37({
        buttonClass: (`relative ${__VLS_unwrap(iconButton, {})}`),
    }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ref: "menuRoot",
        ...{ class: "relative" },
    });
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                void $event;
                return (menuOpen.value = !menuOpen.value);
                // @ts-ignore
                [iconButton, iconButton, iconButton, menuOpen, menuOpen,];
            } },
        type: "button",
        ...{ class: "grid size-10 place-items-center rounded transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
        'aria-label': (__VLS_unwrap(t, {})('header.accountMenu')),
        'aria-haspopup': "menu",
        'aria-expanded': (menuOpen.value),
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['size-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:brightness-110']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "block size-10 overflow-hidden rounded text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['size-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    const __VLS_41 = UserAvatar;
    // @ts-ignore
    const __VLS_42 = __VLS_asFunctionalComponent1(__VLS_41, new __VLS_41({
        // @ts-ignore
        avatarUrl: (profile.value?.avatarUrl), name: (profile.value?.displayName),
    }));
    const __VLS_43 = __VLS_42({
        avatarUrl: (profile.value?.avatarUrl),
        name: (profile.value?.displayName),
    }, ...__VLS_functionalComponentArgsRest(__VLS_42));
    let __VLS_46;
    /** @ts-ignore @type { | typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
    Transition;
    // @ts-ignore
    const __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46({
        // @ts-ignore
        enterActiveClass: "transition duration-150 ease-out", enterFromClass: "translate-y-1 opacity-0", leaveActiveClass: "transition duration-100 ease-in", leaveToClass: "translate-y-1 opacity-0",
    }));
    const __VLS_48 = __VLS_47({
        enterActiveClass: "transition duration-150 ease-out",
        enterFromClass: "translate-y-1 opacity-0",
        leaveActiveClass: "transition duration-100 ease-in",
        leaveToClass: "translate-y-1 opacity-0",
    }, ...__VLS_functionalComponentArgsRest(__VLS_47));
    var __VLS_49;
    const { default: __VLS_51 } = __VLS_nonNull(__VLS_49.slots);
    if (menuOpen.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "absolute right-0 top-full mt-3 w-56 origin-top-right rounded border border-white/10 bg-flixer-surface/95 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl" },
            role: "menu",
        });
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['right-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['top-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-56']} */ ;
        /** @type {__VLS_StyleScopedClasses['origin-top-right']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/95']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-1.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-2xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-black/60']} */ ;
        /** @type {__VLS_StyleScopedClasses['backdrop-blur-xl']} */ ;
        if (profile.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "px-3 py-2.5" },
            });
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "truncate text-sm font-semibold text-white" },
            });
            /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            (profile.value.displayName);
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "truncate text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (profile.value.username);
        }
        if (profile.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "my-1.5 h-px bg-white/10" },
            });
            /** @type {__VLS_StyleScopedClasses['my-1.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-px']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
        }
        if (profile.value) {
            let __VLS_52;
            /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
            RouterLink;
            // @ts-ignore
            const __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52({
                // @ts-ignore
                ...{ 'onClick': {} }, to: ({ name: 'profile', params: { username: profile.value.username } }), ...{ class: "flex items-center rounded px-3 py-2.5 text-sm text-flixer-text transition hover:bg-white/10" }, role: "menuitem",
            }));
            const __VLS_54 = __VLS_53({
                ...{ 'onClick': {} },
                to: ({ name: 'profile', params: { username: profile.value.username } }),
                ...{ class: "flex items-center rounded px-3 py-2.5 text-sm text-flixer-text transition hover:bg-white/10" },
                role: "menuitem",
            }, ...__VLS_functionalComponentArgsRest(__VLS_53));
            let __VLS_57;
            const __VLS_58 = {
                /** @type {typeof __VLS_57.click} */
                onClick: (...[$event]) => {
                    void $event;
                    if (!(menuOpen.value))
                        throw 0;
                    if (!(profile.value))
                        throw 0;
                    return (menuOpen.value = false);
                    // @ts-ignore
                    [t, menuOpen, menuOpen, menuOpen, profile, profile, profile, profile, profile, profile, profile, profile,];
                },
            };
            void __VLS_58;
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
            var __VLS_55;
            var __VLS_56;
            const { default: __VLS_59 } = __VLS_nonNull(__VLS_55.slots);
            (__VLS_unwrap(t, {})('header.profile'));
            // @ts-ignore
            [t,];
        }
        let __VLS_60;
        /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
        RouterLink;
        // @ts-ignore
        const __VLS_61 = __VLS_asFunctionalComponent1(__VLS_60, new __VLS_60({
            // @ts-ignore
            ...{ 'onClick': {} }, to: "/people", ...{ class: "flex items-center rounded px-3 py-2.5 text-sm text-flixer-text transition hover:bg-white/10" }, role: "menuitem",
        }));
        const __VLS_62 = __VLS_61({
            ...{ 'onClick': {} },
            to: "/people",
            ...{ class: "flex items-center rounded px-3 py-2.5 text-sm text-flixer-text transition hover:bg-white/10" },
            role: "menuitem",
        }, ...__VLS_functionalComponentArgsRest(__VLS_61));
        let __VLS_65;
        const __VLS_66 = {
            /** @type {typeof __VLS_65.click} */
            onClick: (...[$event]) => {
                void $event;
                if (!(menuOpen.value))
                    throw 0;
                return (menuOpen.value = false);
                // @ts-ignore
                [menuOpen,];
            },
        };
        void __VLS_66;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
        var __VLS_63;
        var __VLS_64;
        const { default: __VLS_67 } = __VLS_nonNull(__VLS_63.slots);
        (__VLS_unwrap(t, {})('header.people'));
        // @ts-ignore
        [t,];
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (openLanguage) },
            type: "button",
            ...{ class: "flex w-full items-center rounded px-3 py-2.5 text-left text-sm text-flixer-text transition hover:bg-white/10" },
            role: "menuitem",
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
        (__VLS_unwrap(t, {})('header.language'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (openTheme) },
            type: "button",
            ...{ class: "flex w-full items-center rounded px-3 py-2.5 text-left text-sm text-flixer-text transition hover:bg-white/10" },
            role: "menuitem",
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
        (__VLS_unwrap(t, {})('header.theme'));
        if (profile.value?.role === 'admin') {
            let __VLS_68;
            /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
            RouterLink;
            // @ts-ignore
            const __VLS_69 = __VLS_asFunctionalComponent1(__VLS_68, new __VLS_68({
                // @ts-ignore
                ...{ 'onClick': {} }, to: "/admin", ...{ class: "flex items-center rounded px-3 py-2.5 text-sm text-flixer-text transition hover:bg-white/10" }, role: "menuitem",
            }));
            const __VLS_70 = __VLS_69({
                ...{ 'onClick': {} },
                to: "/admin",
                ...{ class: "flex items-center rounded px-3 py-2.5 text-sm text-flixer-text transition hover:bg-white/10" },
                role: "menuitem",
            }, ...__VLS_functionalComponentArgsRest(__VLS_69));
            let __VLS_73;
            const __VLS_74 = {
                /** @type {typeof __VLS_73.click} */
                onClick: (...[$event]) => {
                    void $event;
                    if (!(menuOpen.value))
                        throw 0;
                    if (!(profile.value?.role === 'admin'))
                        throw 0;
                    return (menuOpen.value = false);
                    // @ts-ignore
                    [t, t, menuOpen, profile,];
                },
            };
            void __VLS_74;
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
            var __VLS_71;
            var __VLS_72;
            const { default: __VLS_75 } = __VLS_nonNull(__VLS_71.slots);
            (__VLS_unwrap(t, {})('header.administration'));
            // @ts-ignore
            [t,];
        }
        let __VLS_76;
        /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
        RouterLink;
        // @ts-ignore
        const __VLS_77 = __VLS_asFunctionalComponent1(__VLS_76, new __VLS_76({
            // @ts-ignore
            ...{ 'onClick': {} }, to: "/settings", ...{ class: "flex items-center rounded px-3 py-2.5 text-sm text-flixer-text transition hover:bg-white/10" }, role: "menuitem",
        }));
        const __VLS_78 = __VLS_77({
            ...{ 'onClick': {} },
            to: "/settings",
            ...{ class: "flex items-center rounded px-3 py-2.5 text-sm text-flixer-text transition hover:bg-white/10" },
            role: "menuitem",
        }, ...__VLS_functionalComponentArgsRest(__VLS_77));
        let __VLS_81;
        const __VLS_82 = {
            /** @type {typeof __VLS_81.click} */
            onClick: (...[$event]) => {
                void $event;
                if (!(menuOpen.value))
                    throw 0;
                return (menuOpen.value = false);
                // @ts-ignore
                [menuOpen,];
            },
        };
        void __VLS_82;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
        var __VLS_79;
        var __VLS_80;
        const { default: __VLS_83 } = __VLS_nonNull(__VLS_79.slots);
        (__VLS_unwrap(t, {})('header.settings'));
        // @ts-ignore
        [t,];
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "my-1.5 h-px bg-white/10" },
        });
        /** @type {__VLS_StyleScopedClasses['my-1.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-px']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!(menuOpen.value))
                        throw 0;
                    return (__VLS_unwrap(emit, {})('logout'));
                    // @ts-ignore
                    [emit,];
                } },
            type: "button",
            ...{ class: "flex w-full items-center rounded px-3 py-2.5 text-left text-sm text-flixer-text transition hover:bg-white/10 disabled:cursor-wait disabled:opacity-70" },
            role: "menuitem",
            disabled: (__VLS_ctx.isSigningOut),
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:cursor-wait']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-70']} */ ;
        (__VLS_ctx.isSigningOut ? __VLS_unwrap(t, {})('header.signingOut') : __VLS_unwrap(t, {})('header.signOut'));
    }
    // @ts-ignore
    [t, t, isSigningOut, isSigningOut,];
    var __VLS_7 = __VLS_6;
    // @ts-ignore
    [];
    return {
        __VLS_Slots: {},
    };
};
void [__VLS_template, {}];
const __VLS_base = (await import('vue')).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
const __VLS_export = {};
export default {};
