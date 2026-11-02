import axios from 'axios';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { getPerson } from '../api';
import Header from '../components/header/Header.vue';
import MediaCard from '../components/home/MediaCard.vue';
import CardGridSkeleton from '../components/ui/CardGridSkeleton.vue';
import PersonAvatar from '../components/ui/PersonAvatar.vue';
import Skeleton from '../components/ui/Skeleton.vue';
import MobileTabBar from '../components/home/MobileTabBar.vue';
import { getMobileTabs, getNavLinks } from '../composables/homeNav';
import { useSignOut } from '../composables/useSignOut';
import { catchError } from '../utils/catchError';
const { t, te } = useI18n();
const route = useRoute();
const { isSigningOut, signOut } = useSignOut();
const navLinks = computed(getNavLinks);
const mobileTabs = computed(getMobileTabs);
const routeName = computed(() => String(route.params.id ?? ''));
const name = ref('');
const hasImage = ref(false);
const fallbackArt = computed(() => {
    const group = groups.value.find((entry) => entry.role === 'artist');
    const card = group?.items.find((item) => item.poster !== null || item.backdrop !== null);
    const index = card?.poster ?? card?.backdrop ?? null;
    return card && index !== null ? { itemId: card.id, index, version: card.updatedAt } : null;
});
const isArtist = computed(() => groups.value.some((entry) => entry.role === 'artist'));
const totalTitles = computed(() => new Set(groups.value.flatMap((entry) => entry.items.map((item) => item.id))).size);
const yearRange = computed(() => {
    const years = groups.value.flatMap((entry) => entry.items.map((item) => item.year)).filter((year) => typeof year === 'number');
    if (years.length === 0)
        return '';
    const first = Math.min(...years);
    const last = Math.max(...years);
    return first === last ? String(first) : `${first} – ${last}`;
});
const kinds = computed(() => groups.value.map((entry) => (te(`person.kinds.${entry.role}`) ? t(`person.kinds.${entry.role}`) : entry.role)));
const profile = ref(null);
const expanded = ref(false);
const longBio = computed(() => (profile.value?.biography?.length ?? 0) > 420);
const groups = ref([]);
const isLoading = ref(true);
const failed = ref(false);
const notFound = ref(false);
let controller;
async function load() {
    controller?.abort();
    controller = new AbortController();
    isLoading.value = true;
    failed.value = false;
    notFound.value = false;
    groups.value = [];
    hasImage.value = false;
    profile.value = null;
    expanded.value = false;
    const [error, person] = await catchError(getPerson(routeName.value, controller.signal));
    if (error) {
        if (error.code === 'ERR_CANCELED')
            return;
        if (axios.isAxiosError(error) && error.response?.status === 404)
            notFound.value = true;
        else
            failed.value = true;
    }
    else {
        name.value = person.name;
        hasImage.value = person.hasImage;
        profile.value = person.profile;
        groups.value = person.groups;
    }
    isLoading.value = false;
}
watch(routeName, () => void load(), { immediate: true });
onBeforeUnmount(() => controller?.abort());
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(isLoading, {});
    __VLS_withDotValue(notFound, {});
    __VLS_withDotValue(failed, {});
    __VLS_withDotValue(isArtist, {});
    __VLS_withDotValue(profile, {});
    __VLS_withDotValue(kinds, {});
    __VLS_withDotValue(yearRange, {});
    __VLS_withDotValue(longBio, {});
    __VLS_withDotValue(expanded, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "min-h-screen overflow-x-hidden bg-flixer-background pb-24 font-sans text-flixer-text md:pb-12" },
    });
    /** @type {__VLS_StyleScopedClasses['min-h-screen']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-x-hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
    /** @type {__VLS_StyleScopedClasses['pb-24']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-sans']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:pb-12']} */ ;
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({
        ...{ class: "page-gutter pt-28 sm:pt-32" },
    });
    /** @type {__VLS_StyleScopedClasses['page-gutter']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-28']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:pt-32']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-col items-start gap-5 sm:flex-row sm:items-end sm:gap-8" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:flex-row']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:items-end']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:gap-8']} */ ;
    if (!isLoading.value && !notFound.value && !failed.value) {
        const __VLS_7 = PersonAvatar;
        // @ts-ignore
        const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
            // @ts-ignore
            personId: (__VLS_unwrap(routeName, {})), name: (__VLS_unwrap(name, {})), hasImage: (__VLS_unwrap(hasImage, {})), width: (256), fallback: (__VLS_unwrap(fallbackArt, {})), ...{ class: "shrink-0 rounded shadow-lg shadow-black/40" }, ...{ class: (isArtist.value ? 'size-40 sm:size-52' : 'aspect-[2/3] w-32 sm:w-44') },
        }));
        const __VLS_9 = __VLS_8({
            personId: (__VLS_unwrap(routeName, {})),
            name: (__VLS_unwrap(name, {})),
            hasImage: (__VLS_unwrap(hasImage, {})),
            width: (256),
            fallback: (__VLS_unwrap(fallbackArt, {})),
            ...{ class: "shrink-0 rounded shadow-lg shadow-black/40" },
            ...{ class: (isArtist.value ? 'size-40 sm:size-52' : 'aspect-[2/3] w-32 sm:w-44') },
        }, ...__VLS_functionalComponentArgsRest(__VLS_8));
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-black/40']} */ ;
    }
    else if (isLoading.value) {
        const __VLS_12 = Skeleton;
        // @ts-ignore
        const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
            // @ts-ignore
            ...{ class: "aspect-[2/3] w-32 shrink-0 rounded sm:w-44" },
        }));
        const __VLS_14 = __VLS_13({
            ...{ class: "aspect-[2/3] w-32 shrink-0 rounded sm:w-44" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_13));
        /** @type {__VLS_StyleScopedClasses['aspect-[2/3]']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-32']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:w-44']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "min-w-0" },
    });
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
        ...{ class: "break-words text-3xl font-bold text-white sm:text-5xl" },
    });
    /** @type {__VLS_StyleScopedClasses['break-words']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:text-5xl']} */ ;
    (__VLS_unwrap(name, {}));
    if (!isLoading.value && !notFound.value && !failed.value) {
        if (profile.value?.description) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mt-2 text-base text-flixer-text/90" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-base']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-text/90']} */ ;
            (profile.value.description);
        }
        if (kinds.value.length > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
                ...{ class: "mt-3 flex flex-wrap gap-2" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            const __VLS_17 = __VLS_tryAsConstant((kinds.value));
            for (const [kind] of __VLS_vFor(__VLS_nonNull(__VLS_17))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                    key: (kind),
                    ...{ class: "rounded-full border border-flixer-border bg-flixer-surface/60 px-3 py-1 text-xs font-medium text-white" },
                });
                /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
                /** @type {__VLS_StyleScopedClasses['border']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/60']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                (kind);
                // @ts-ignore
                [navLinks, isSigningOut, signOut, isLoading, isLoading, isLoading, notFound, notFound, failed, failed, routeName, name, name, hasImage, fallbackArt, isArtist, profile, profile, kinds, kinds,];
            }
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-3 text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('person.titleCount', { count: __VLS_unwrap(totalTitles, {}) }, __VLS_unwrap(totalTitles, {})));
        if (yearRange.value) {
            (__VLS_unwrap(t, {})('person.active', { range: yearRange.value }));
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-6" },
        'aria-live': "polite",
    });
    /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
    if (failed.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm text-red-400" },
            role: "alert",
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-400']} */ ;
        (__VLS_unwrap(t, {})('person.error'));
    }
    else if (isLoading.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            role: "status",
            'aria-label': (__VLS_unwrap(t, {})('common.loading')),
        });
        const __VLS_18 = Skeleton;
        // @ts-ignore
        const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
            // @ts-ignore
            ...{ class: "mb-4 h-5 w-24" },
        }));
        const __VLS_20 = __VLS_19({
            ...{ class: "mb-4 h-5 w-24" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_19));
        /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-24']} */ ;
        const __VLS_23 = CardGridSkeleton;
        // @ts-ignore
        const __VLS_24 = __VLS_asFunctionalComponent1(__VLS_23, new __VLS_23({
            // @ts-ignore
            count: (6),
        }));
        const __VLS_25 = __VLS_24({
            count: (6),
        }, ...__VLS_functionalComponentArgsRest(__VLS_24));
    }
    else if (notFound.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('person.notFound'));
    }
    else {
        if (profile.value?.biography) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
                ...{ class: "mb-10 max-w-3xl" },
                'aria-label': (__VLS_unwrap(t, {})('person.about')),
            });
            /** @type {__VLS_StyleScopedClasses['mb-10']} */ ;
            /** @type {__VLS_StyleScopedClasses['max-w-3xl']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
                ...{ class: "mb-3 text-lg font-semibold text-white" },
            });
            /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            (__VLS_unwrap(t, {})('person.about'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "whitespace-pre-line text-sm leading-relaxed text-flixer-text/90" },
                ...{ class: (longBio.value && !expanded.value ? 'line-clamp-5' : '') },
            });
            /** @type {__VLS_StyleScopedClasses['whitespace-pre-line']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['leading-relaxed']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-text/90']} */ ;
            (profile.value.biography);
            if (longBio.value) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!!(failed.value))
                                throw 0;
                            if (!!(isLoading.value))
                                throw 0;
                            if (!!(notFound.value))
                                throw 0;
                            if (!(profile.value?.biography))
                                throw 0;
                            if (!(longBio.value))
                                throw 0;
                            return (expanded.value = !expanded.value);
                            // @ts-ignore
                            [isLoading, notFound, failed, profile, profile, t, t, t, t, t, t, t, totalTitles, totalTitles, yearRange, yearRange, longBio, longBio, expanded, expanded, expanded,];
                        } },
                    type: "button",
                    ...{ class: "mt-2 text-sm font-medium text-white hover:underline" },
                    'aria-expanded': (expanded.value),
                });
                /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:underline']} */ ;
                (expanded.value ? __VLS_unwrap(t, {})('person.showLess') : __VLS_unwrap(t, {})('person.readMore'));
            }
            if (profile.value.source) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "mt-3 text-xs text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                if (profile.value.sourceUrl) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
                        href: (profile.value.sourceUrl),
                        target: "_blank",
                        rel: "noopener noreferrer",
                        ...{ class: "hover:underline" },
                    });
                    /** @type {__VLS_StyleScopedClasses['hover:underline']} */ ;
                    (__VLS_unwrap(t, {})('person.source', { source: profile.value.source }));
                }
                else {
                    (__VLS_unwrap(t, {})('person.source', { source: profile.value.source }));
                }
            }
        }
        const __VLS_28 = __VLS_tryAsConstant((__VLS_unwrap(groups, {})));
        for (const [group] of __VLS_vFor(__VLS_nonNull(__VLS_28))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
                key: (group.role),
                ...{ class: "mb-10" },
            });
            /** @type {__VLS_StyleScopedClasses['mb-10']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
                ...{ class: "mb-4 text-lg font-semibold text-white" },
            });
            /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            (__VLS_unwrap(te, {})(`person.roles.${group.role}`) ? __VLS_unwrap(t, {})(`person.roles.${group.role}`) : group.role);
            __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
                ...{ class: "grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-x-4 gap-y-6 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]" },
            });
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['grid-cols-[repeat(auto-fill,minmax(9rem,1fr))]']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-x-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-y-6']} */ ;
            /** @type {__VLS_StyleScopedClasses['sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]']} */ ;
            const __VLS_29 = __VLS_tryAsConstant((group.items));
            for (const [entry] of __VLS_vFor(__VLS_nonNull(__VLS_29))) {
                const __VLS_30 = MediaCard;
                // @ts-ignore
                const __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({
                    // @ts-ignore
                    key: (entry.id), ...{ class: "!w-auto" }, variant: (group.role === 'artist' ? 'square' : 'poster'), title: (entry.title), subtitle: ([entry.detail, entry.year].filter(Boolean).join(' · ') || undefined), itemId: (entry.id), imageIndex: (entry.poster ?? entry.backdrop), version: (entry.updatedAt),
                }));
                const __VLS_32 = __VLS_31({
                    key: (entry.id),
                    ...{ class: "!w-auto" },
                    variant: (group.role === 'artist' ? 'square' : 'poster'),
                    title: (entry.title),
                    subtitle: ([entry.detail, entry.year].filter(Boolean).join(' · ') || undefined),
                    itemId: (entry.id),
                    imageIndex: (entry.poster ?? entry.backdrop),
                    version: (entry.updatedAt),
                }, ...__VLS_functionalComponentArgsRest(__VLS_31));
                /** @type {__VLS_StyleScopedClasses['!w-auto']} */ ;
                // @ts-ignore
                [profile, profile, profile, profile, profile, t, t, t, t, t, expanded, expanded, groups, te,];
            }
            // @ts-ignore
            [];
        }
    }
    const __VLS_35 = MobileTabBar;
    // @ts-ignore
    const __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35({
        // @ts-ignore
        tabs: (__VLS_unwrap(mobileTabs, {})),
    }));
    const __VLS_37 = __VLS_36({
        tabs: (__VLS_unwrap(mobileTabs, {})),
    }, ...__VLS_functionalComponentArgsRest(__VLS_36));
    // @ts-ignore
    [mobileTabs,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
