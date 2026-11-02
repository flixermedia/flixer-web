import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { discoverRequests } from '../api';
import Header from '../components/header/Header.vue';
import MediaCard from '../components/home/MediaCard.vue';
import MobileTabBar from '../components/home/MobileTabBar.vue';
import { getMobileTabs, getNavLinks } from '../composables/homeNav';
import { useRequestsConfig } from '../composables/useRequestsConfig';
import { useSignOut } from '../composables/useSignOut';
const { t } = useI18n();
const { isSigningOut, signOut } = useSignOut();
const navLinks = computed(getNavLinks);
const tabs = computed(getMobileTabs);
const config = useRequestsConfig();
const sections = ['trending', 'movies', 'tv', 'upcoming', 'music'];
const rows = ref({});
const loading = ref(true);
onMounted(async () => {
    await config.load();
    if (!config.enabled.value) {
        loading.value = false;
        return;
    }
    const results = await Promise.all(sections.map(async (section) => [section, await discoverRequests(section).catch(() => [])]));
    rows.value = Object.fromEntries(results);
    loading.value = false;
});
function subtitle(item) {
    const kind = t(`home.itemType.${item.type === 'tv' ? 'series' : item.type === 'music' ? 'album' : 'movie'}`);
    return item.year ? `${kind} · ${item.year}` : kind;
}
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(loading, {});
    __VLS_withDotValue(rows, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "min-h-screen overflow-x-hidden bg-flixer-background pb-28 pt-24 text-flixer-text md:pb-12 md:pt-28" },
    });
    /** @type {__VLS_StyleScopedClasses['min-h-screen']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-x-hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
    /** @type {__VLS_StyleScopedClasses['pb-28']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-24']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:pb-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:pt-28']} */ ;
    const __VLS_0 = Header;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        ...{ 'onLogout': {} }, links: (__VLS_unwrap(navLinks, {})), isSigningOut: (__VLS_unwrap(isSigningOut, {})),
    }));
    const __VLS_2 = __VLS_1({
        ...{ 'onLogout': {} },
        links: (__VLS_unwrap(navLinks, {})),
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
        ...{ class: "page-gutter mx-auto max-w-[110rem]" },
    });
    /** @type {__VLS_StyleScopedClasses['page-gutter']} */ ;
    /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-[110rem]']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs font-semibold uppercase tracking-[0.2em] text-flixer-accent" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-[0.2em]']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
    (__VLS_unwrap(t, {})('requests.discover'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
        ...{ class: "mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-tight']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:text-4xl']} */ ;
    (__VLS_unwrap(t, {})('requests.discover'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-2 max-w-2xl text-sm leading-6 text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['leading-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('requests.discoverDescription'));
    if (loading.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-9 space-y-9" },
            role: "status",
            'aria-label': (__VLS_unwrap(t, {})('common.loading')),
        });
        /** @type {__VLS_StyleScopedClasses['mt-9']} */ ;
        /** @type {__VLS_StyleScopedClasses['space-y-9']} */ ;
        const __VLS_7 = __VLS_tryAsConstant((__VLS_unwrap(sections, {})));
        for (const [section] of __VLS_vFor(__VLS_nonNull(__VLS_7))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
                key: (section),
                ...{ class: "page-gutter" },
            });
            /** @type {__VLS_StyleScopedClasses['page-gutter']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
                ...{ class: "mb-4 h-6 w-48 animate-pulse rounded bg-white/[0.07]" },
            });
            /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-6']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-48']} */ ;
            /** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white/[0.07]']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex gap-4 overflow-hidden" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
            const __VLS_8 = __VLS_tryAsConstant((6));
            for (const [n] of __VLS_vFor(__VLS_nonNull(__VLS_8))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    key: (n),
                    ...{ class: "w-36 shrink-0 animate-pulse sm:w-44" },
                });
                /** @type {__VLS_StyleScopedClasses['w-36']} */ ;
                /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
                /** @type {__VLS_StyleScopedClasses['sm:w-44']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
                    ...{ class: "aspect-[2/3] rounded bg-white/[0.06]" },
                });
                /** @type {__VLS_StyleScopedClasses['aspect-[2/3]']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-white/[0.06]']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
                    ...{ class: "mt-3 h-3 rounded bg-white/[0.06]" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-white/[0.06]']} */ ;
                // @ts-ignore
                [navLinks, isSigningOut, signOut, t, t, t, t, loading, sections,];
            }
            // @ts-ignore
            [];
        }
    }
    else if (Object.values(rows.value).some((row) => row.length)) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-9 space-y-9" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-9']} */ ;
        /** @type {__VLS_StyleScopedClasses['space-y-9']} */ ;
        const __VLS_9 = __VLS_tryAsConstant((__VLS_unwrap(sections, {})));
        for (const [section] of __VLS_vFor(__VLS_nonNull(__VLS_9))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
                key: (section),
                ...{ class: "group/requests-row" },
                'aria-label': (__VLS_unwrap(t, {})(`requests.sections.${section}`)),
            });
            const __VLS_10 = __VLS_asFunctionalDirective(__VLS_directives.vShow, {});
            __VLS_10(__VLS_nonNull(null), { ...__VLS_directiveBindingRestFields, value: (rows.value[section]?.length), }, ...__VLS_directiveHookArgsRest(__VLS_10));
            /** @type {__VLS_StyleScopedClasses['group/requests-row']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "page-gutter mx-auto mb-4 flex max-w-[110rem] items-end justify-between" },
            });
            /** @type {__VLS_StyleScopedClasses['page-gutter']} */ ;
            /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
            /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['max-w-[110rem]']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-end']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
                ...{ class: "text-xl font-semibold tracking-tight text-white sm:text-2xl" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['tracking-tight']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['sm:text-2xl']} */ ;
            (__VLS_unwrap(t, {})(`requests.sections.${section}`));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
                ...{ class: "mt-2 h-0.5 w-10 rounded-full bg-flixer-accent/80" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-0.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-10']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-accent/80']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (rows.value[section]?.length);
            __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
                ...{ class: "page-gutter mx-auto flex max-w-[110rem] snap-x gap-4 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" },
            });
            /** @type {__VLS_StyleScopedClasses['page-gutter']} */ ;
            /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['max-w-[110rem]']} */ ;
            /** @type {__VLS_StyleScopedClasses['snap-x']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['overflow-x-auto']} */ ;
            /** @type {__VLS_StyleScopedClasses['scroll-smooth']} */ ;
            /** @type {__VLS_StyleScopedClasses['pb-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['[scrollbar-width:none]']} */ ;
            /** @type {__VLS_StyleScopedClasses['[&::-webkit-scrollbar]:hidden']} */ ;
            const __VLS_11 = __VLS_tryAsConstant((rows.value[section]));
            for (const [item] of __VLS_vFor(__VLS_nonNull(__VLS_11))) {
                const __VLS_12 = MediaCard;
                // @ts-ignore
                const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
                    // @ts-ignore
                    key: (`${item.source}:${item.id}`), variant: (item.type === 'music' ? 'square' : 'poster'), title: (item.title), subtitle: (subtitle(item)), posterUrl: (item.poster), requestStatus: (item.status), to: ({ name: 'request-item', params: { type: item.type, id: item.id } }),
                }));
                const __VLS_14 = __VLS_13({
                    key: (`${item.source}:${item.id}`),
                    variant: (item.type === 'music' ? 'square' : 'poster'),
                    title: (item.title),
                    subtitle: (subtitle(item)),
                    posterUrl: (item.poster),
                    requestStatus: (item.status),
                    to: ({ name: 'request-item', params: { type: item.type, id: item.id } }),
                }, ...__VLS_functionalComponentArgsRest(__VLS_13));
                // @ts-ignore
                [t, t, sections, rows, rows, rows, rows,];
            }
            // @ts-ignore
            [];
        }
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "page-gutter mx-auto mt-10 max-w-4xl rounded border border-dashed border-flixer-border bg-flixer-surface/30 px-5 py-14 text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['page-gutter']} */ ;
        /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
        /** @type {__VLS_StyleScopedClasses['mt-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['max-w-4xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-dashed']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/30']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-14']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('requests.noDiscover'));
    }
    const __VLS_17 = MobileTabBar;
    // @ts-ignore
    const __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({
        // @ts-ignore
        tabs: (__VLS_unwrap(tabs, {})),
    }));
    const __VLS_19 = __VLS_18({
        tabs: (__VLS_unwrap(tabs, {})),
    }, ...__VLS_functionalComponentArgsRest(__VLS_18));
    // @ts-ignore
    [t, tabs,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
