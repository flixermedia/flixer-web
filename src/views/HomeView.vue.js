import HeroCarousel from '../components/home/HeroCarousel.vue';
import Header from '../components/header/Header.vue';
import MediaCard from '../components/home/MediaCard.vue';
import MediaRow from '../components/home/MediaRow.vue';
import HomeSkeleton from '../components/home/HomeSkeleton.vue';
import MobileTabBar from '../components/home/MobileTabBar.vue';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { getHomeContent, setItemWatched } from '../api';
import { getMobileTabs, getNavLinks } from '../composables/homeNav';
import { notify } from '../composables/notify';
import { useSignOut } from '../composables/useSignOut';
import { catchError } from '../utils/catchError';
const { t } = useI18n();
const { isSigningOut, signOut } = useSignOut();
const navLinks = computed(getNavLinks);
const mobileTabs = computed(getMobileTabs);
const content = ref(null);
const isLoading = ref(true);
const loadFailed = ref(false);
const isEmpty = computed(() => {
    const home = content.value;
    return !!home && home.libraries.length === 0 && home.featured.length === 0 && home.recentMovies.length === 0 && home.recentShows.length === 0 && home.recentAlbums.length === 0;
});
// Libraries open the section that matches their content type.
function libraryRoute(type) {
    if (type === 'tvshows')
        return '/tv';
    if (type === 'music')
        return '/music';
    return '/movies';
}
async function markWatched(id) {
    const [error] = await catchError(setItemWatched(id, true));
    if (error) {
        notify.error(t('home.loadError'));
        return;
    }
    const home = content.value;
    if (!home)
        return;
    home.continueWatching = home.continueWatching.filter((entry) => entry.id !== id);
    home.recentMovies = home.recentMovies.filter((entry) => entry.id !== id);
    home.recentShows = home.recentShows.filter((entry) => entry.id !== id);
    home.featured = home.featured.filter((entry) => entry.id !== id);
}
async function load() {
    isLoading.value = true;
    loadFailed.value = false;
    try {
        const [error, home] = await catchError(getHomeContent());
        if (error) {
            loadFailed.value = true;
            notify.error(t('home.loadError'));
            return;
        }
        content.value = home;
    }
    finally {
        isLoading.value = false;
    }
}
onMounted(load);
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(content, {});
    __VLS_withDotValue(isLoading, {});
    __VLS_withDotValue(loadFailed, {});
    __VLS_withDotValue(isEmpty, {});
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({});
    if (content.value && content.value.featured.length > 0) {
        const __VLS_7 = HeroCarousel;
        // @ts-ignore
        const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
            // @ts-ignore
            items: (content.value.featured),
        }));
        const __VLS_9 = __VLS_8({
            items: (content.value.featured),
        }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "h-24 sm:h-28" },
        });
        /** @type {__VLS_StyleScopedClasses['h-24']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:h-28']} */ ;
    }
    if (isLoading.value) {
        const __VLS_12 = HomeSkeleton;
        // @ts-ignore
        const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
        // @ts-ignore
        }));
        const __VLS_14 = __VLS_13({}, ...__VLS_functionalComponentArgsRest(__VLS_13));
    }
    else if (loadFailed.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "page-gutter py-10" },
        });
        /** @type {__VLS_StyleScopedClasses['page-gutter']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-10']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('home.loadError'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (load) },
            type: "button",
            ...{ class: "mt-3 rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
        (__VLS_unwrap(t, {})('home.retry'));
    }
    else if (isEmpty.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "page-gutter py-10" },
        });
        /** @type {__VLS_StyleScopedClasses['page-gutter']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-10']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
            ...{ class: "text-xl font-semibold text-white" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        (__VLS_unwrap(t, {})('home.emptyTitle'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-2 max-w-xl text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['max-w-xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('home.emptyBody'));
    }
    else if (content.value) {
        let __VLS_17;
        /** @ts-ignore @type { | typeof __VLS_components.TransitionGroup | typeof __VLS_components.TransitionGroup} */
        TransitionGroup;
        // @ts-ignore
        const __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({
            // @ts-ignore
            tag: "div", name: "home-row", ...{ class: "relative flex flex-col gap-8 pt-2" },
        }));
        const __VLS_19 = __VLS_18({
            tag: "div",
            name: "home-row",
            ...{ class: "relative flex flex-col gap-8 pt-2" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_18));
        /** @type {__VLS_StyleScopedClasses['relative']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-8']} */ ;
        /** @type {__VLS_StyleScopedClasses['pt-2']} */ ;
        var __VLS_20;
        const { default: __VLS_22 } = __VLS_nonNull(__VLS_20.slots);
        if (content.value.libraries.length > 0) {
            const __VLS_23 = MediaRow || MediaRow;
            // @ts-ignore
            const __VLS_24 = __VLS_asFunctionalComponent1(__VLS_23, new __VLS_23({
                // @ts-ignore
                key: "libraries", title: (__VLS_unwrap(t, {})('home.myMedia')),
            }));
            const __VLS_25 = __VLS_24({
                key: "libraries",
                title: (__VLS_unwrap(t, {})('home.myMedia')),
            }, ...__VLS_functionalComponentArgsRest(__VLS_24));
            var __VLS_26;
            const { default: __VLS_28 } = __VLS_nonNull(__VLS_26.slots);
            const __VLS_29 = __VLS_tryAsConstant((content.value.libraries));
            for (const [library] of __VLS_vFor(__VLS_nonNull(__VLS_29))) {
                const __VLS_30 = MediaCard;
                // @ts-ignore
                const __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({
                    // @ts-ignore
                    key: (library.id), variant: "library", title: (library.name), to: (libraryRoute(library.type)), itemId: (library.cover?.itemId), imageIndex: (library.cover?.index), version: (library.cover?.updatedAt),
                }));
                const __VLS_32 = __VLS_31({
                    key: (library.id),
                    variant: "library",
                    title: (library.name),
                    to: (libraryRoute(library.type)),
                    itemId: (library.cover?.itemId),
                    imageIndex: (library.cover?.index),
                    version: (library.cover?.updatedAt),
                }, ...__VLS_functionalComponentArgsRest(__VLS_31));
                // @ts-ignore
                [navLinks, isSigningOut, signOut, content, content, content, content, content, content, isLoading, loadFailed, t, t, t, t, t, isEmpty,];
            }
            // @ts-ignore
            [];
        }
        if (content.value.continueWatching.length > 0) {
            const __VLS_35 = MediaRow || MediaRow;
            // @ts-ignore
            const __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35({
                // @ts-ignore
                key: "continue", title: (__VLS_unwrap(t, {})('home.continueWatching')),
            }));
            const __VLS_37 = __VLS_36({
                key: "continue",
                title: (__VLS_unwrap(t, {})('home.continueWatching')),
            }, ...__VLS_functionalComponentArgsRest(__VLS_36));
            var __VLS_38;
            const { default: __VLS_40 } = __VLS_nonNull(__VLS_38.slots);
            const __VLS_41 = __VLS_tryAsConstant((content.value.continueWatching));
            for (const [entry] of __VLS_vFor(__VLS_nonNull(__VLS_41))) {
                const __VLS_42 = MediaCard;
                // @ts-ignore
                const __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42({
                    // @ts-ignore
                    ...{ 'onWatched': {} }, key: (entry.id), variant: "landscape", title: (entry.title), subtitle: (entry.subtitle ?? undefined), to: ({ name: 'media-item', params: { id: entry.id } }), itemId: (entry.imageItemId), imageIndex: (entry.imageIndex), version: (entry.imageUpdatedAt), progress: (entry.progress), markable: true,
                }));
                const __VLS_44 = __VLS_43({
                    ...{ 'onWatched': {} },
                    key: (entry.id),
                    variant: "landscape",
                    title: (entry.title),
                    subtitle: (entry.subtitle ?? undefined),
                    to: ({ name: 'media-item', params: { id: entry.id } }),
                    itemId: (entry.imageItemId),
                    imageIndex: (entry.imageIndex),
                    version: (entry.imageUpdatedAt),
                    progress: (entry.progress),
                    markable: true,
                }, ...__VLS_functionalComponentArgsRest(__VLS_43));
                let __VLS_47;
                const __VLS_48 = {
                    /** @type {typeof __VLS_47.watched} */
                    onWatched: (...[$event]) => {
                        void $event;
                        if (!!(isLoading.value))
                            throw 0;
                        if (!!(loadFailed.value))
                            throw 0;
                        if (!!(isEmpty.value))
                            throw 0;
                        if (!(content.value))
                            throw 0;
                        if (!(content.value.continueWatching.length > 0))
                            throw 0;
                        return (markWatched(entry.id));
                        // @ts-ignore
                        [content, content, t,];
                    },
                };
                void __VLS_48;
                var __VLS_45;
                var __VLS_46;
                // @ts-ignore
                [];
            }
            // @ts-ignore
            [];
        }
        if (content.value.recentMovies.length > 0) {
            const __VLS_49 = MediaRow || MediaRow;
            // @ts-ignore
            const __VLS_50 = __VLS_asFunctionalComponent1(__VLS_49, new __VLS_49({
                // @ts-ignore
                key: "movies", title: (__VLS_unwrap(t, {})('home.recentMovies')),
            }));
            const __VLS_51 = __VLS_50({
                key: "movies",
                title: (__VLS_unwrap(t, {})('home.recentMovies')),
            }, ...__VLS_functionalComponentArgsRest(__VLS_50));
            var __VLS_52;
            const { default: __VLS_54 } = __VLS_nonNull(__VLS_52.slots);
            const __VLS_55 = __VLS_tryAsConstant((content.value.recentMovies));
            for (const [item] of __VLS_vFor(__VLS_nonNull(__VLS_55))) {
                const __VLS_56 = MediaCard;
                // @ts-ignore
                const __VLS_57 = __VLS_asFunctionalComponent1(__VLS_56, new __VLS_56({
                    // @ts-ignore
                    ...{ 'onWatched': {} }, key: (item.id), title: (item.title), subtitle: (item.year ? String(item.year) : undefined), itemId: (item.id), imageIndex: (item.poster), version: (item.updatedAt), markable: true,
                }));
                const __VLS_58 = __VLS_57({
                    ...{ 'onWatched': {} },
                    key: (item.id),
                    title: (item.title),
                    subtitle: (item.year ? String(item.year) : undefined),
                    itemId: (item.id),
                    imageIndex: (item.poster),
                    version: (item.updatedAt),
                    markable: true,
                }, ...__VLS_functionalComponentArgsRest(__VLS_57));
                let __VLS_61;
                const __VLS_62 = {
                    /** @type {typeof __VLS_61.watched} */
                    onWatched: (...[$event]) => {
                        void $event;
                        if (!!(isLoading.value))
                            throw 0;
                        if (!!(loadFailed.value))
                            throw 0;
                        if (!!(isEmpty.value))
                            throw 0;
                        if (!(content.value))
                            throw 0;
                        if (!(content.value.recentMovies.length > 0))
                            throw 0;
                        return (markWatched(item.id));
                        // @ts-ignore
                        [content, content, t,];
                    },
                };
                void __VLS_62;
                var __VLS_59;
                var __VLS_60;
                // @ts-ignore
                [];
            }
            // @ts-ignore
            [];
        }
        if (content.value.recentShows.length > 0) {
            const __VLS_63 = MediaRow || MediaRow;
            // @ts-ignore
            const __VLS_64 = __VLS_asFunctionalComponent1(__VLS_63, new __VLS_63({
                // @ts-ignore
                key: "shows", title: (__VLS_unwrap(t, {})('home.recentTvShows')),
            }));
            const __VLS_65 = __VLS_64({
                key: "shows",
                title: (__VLS_unwrap(t, {})('home.recentTvShows')),
            }, ...__VLS_functionalComponentArgsRest(__VLS_64));
            var __VLS_66;
            const { default: __VLS_68 } = __VLS_nonNull(__VLS_66.slots);
            const __VLS_69 = __VLS_tryAsConstant((content.value.recentShows));
            for (const [item] of __VLS_vFor(__VLS_nonNull(__VLS_69))) {
                const __VLS_70 = MediaCard;
                // @ts-ignore
                const __VLS_71 = __VLS_asFunctionalComponent1(__VLS_70, new __VLS_70({
                    // @ts-ignore
                    ...{ 'onWatched': {} }, key: (item.id), title: (item.title), subtitle: (item.year ? String(item.year) : undefined), itemId: (item.id), imageIndex: (item.poster), version: (item.updatedAt), markable: true,
                }));
                const __VLS_72 = __VLS_71({
                    ...{ 'onWatched': {} },
                    key: (item.id),
                    title: (item.title),
                    subtitle: (item.year ? String(item.year) : undefined),
                    itemId: (item.id),
                    imageIndex: (item.poster),
                    version: (item.updatedAt),
                    markable: true,
                }, ...__VLS_functionalComponentArgsRest(__VLS_71));
                let __VLS_75;
                const __VLS_76 = {
                    /** @type {typeof __VLS_75.watched} */
                    onWatched: (...[$event]) => {
                        void $event;
                        if (!!(isLoading.value))
                            throw 0;
                        if (!!(loadFailed.value))
                            throw 0;
                        if (!!(isEmpty.value))
                            throw 0;
                        if (!(content.value))
                            throw 0;
                        if (!(content.value.recentShows.length > 0))
                            throw 0;
                        return (markWatched(item.id));
                        // @ts-ignore
                        [content, content, t,];
                    },
                };
                void __VLS_76;
                var __VLS_73;
                var __VLS_74;
                // @ts-ignore
                [];
            }
            // @ts-ignore
            [];
        }
        if (content.value.recentAlbums.length > 0) {
            const __VLS_77 = MediaRow || MediaRow;
            // @ts-ignore
            const __VLS_78 = __VLS_asFunctionalComponent1(__VLS_77, new __VLS_77({
                // @ts-ignore
                key: "music", title: (__VLS_unwrap(t, {})('home.recentMusic')),
            }));
            const __VLS_79 = __VLS_78({
                key: "music",
                title: (__VLS_unwrap(t, {})('home.recentMusic')),
            }, ...__VLS_functionalComponentArgsRest(__VLS_78));
            var __VLS_80;
            const { default: __VLS_82 } = __VLS_nonNull(__VLS_80.slots);
            const __VLS_83 = __VLS_tryAsConstant((content.value.recentAlbums));
            for (const [item] of __VLS_vFor(__VLS_nonNull(__VLS_83))) {
                const __VLS_84 = MediaCard;
                // @ts-ignore
                const __VLS_85 = __VLS_asFunctionalComponent1(__VLS_84, new __VLS_84({
                    // @ts-ignore
                    key: (item.id), variant: "square", title: (item.title), subtitle: (item.year ? String(item.year) : undefined), itemId: (item.id), imageIndex: (item.poster), version: (item.updatedAt),
                }));
                const __VLS_86 = __VLS_85({
                    key: (item.id),
                    variant: "square",
                    title: (item.title),
                    subtitle: (item.year ? String(item.year) : undefined),
                    itemId: (item.id),
                    imageIndex: (item.poster),
                    version: (item.updatedAt),
                }, ...__VLS_functionalComponentArgsRest(__VLS_85));
                // @ts-ignore
                [content, content, t,];
            }
            // @ts-ignore
            [];
        }
        // @ts-ignore
        [];
    }
    const __VLS_89 = MobileTabBar;
    // @ts-ignore
    const __VLS_90 = __VLS_asFunctionalComponent1(__VLS_89, new __VLS_89({
        // @ts-ignore
        tabs: (__VLS_unwrap(mobileTabs, {})),
    }));
    const __VLS_91 = __VLS_90({
        tabs: (__VLS_unwrap(mobileTabs, {})),
    }, ...__VLS_functionalComponentArgsRest(__VLS_90));
    // @ts-ignore
    [mobileTabs,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
