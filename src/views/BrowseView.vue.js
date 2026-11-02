import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { browseMedia, getPreferences, updatePreferences } from '../api';
import Header from '../components/header/Header.vue';
import MediaCard from '../components/home/MediaCard.vue';
import CardGridSkeleton from '../components/ui/CardGridSkeleton.vue';
import Skeleton from '../components/ui/Skeleton.vue';
import MobileTabBar from '../components/home/MobileTabBar.vue';
import { getMobileTabs, getNavLinks } from '../composables/homeNav';
import { notify } from '../composables/notify';
import { useInfiniteScroll } from '../composables/useInfiniteScroll';
import { describeRequestError } from '../composables/useProfile';
import { useSignOut } from '../composables/useSignOut';
import { catchError } from '../utils/catchError';
const { defineProps, } = {};
const props = defineProps();
const SORTS = ['added', 'title', 'year'];
const BROWSE_COLUMN_OPTIONS = [2, 3, 4, 5, 6, 7, 8];
const { t } = useI18n();
const { isSigningOut, signOut } = useSignOut();
const navLinks = computed(getNavLinks);
const mobileTabs = computed(getMobileTabs);
const sort = ref('added');
const browseColumns = ref(0);
const items = ref([]);
const total = ref(0);
const isLoading = ref(false);
const failed = ref(false);
let controller;
let savedBrowseColumns = 0;
let preferencesChanged = false;
let preferenceSaveQueue = Promise.resolve();
const heading = computed(() => t(`browse.${props.kind}`));
const gridStyle = computed(() => (browseColumns.value ? { '--browse-columns': browseColumns.value } : undefined));
const hasMore = computed(() => items.value.length < total.value);
const canLoadMore = computed(() => hasMore.value && !failed.value && !isLoading.value);
const { setSentinel, recheck } = useInfiniteScroll(() => void load(false), canLoadMore);
function subtitleOf(item) {
    return item.year ? String(item.year) : undefined;
}
async function loadPreferences() {
    const [error, preferences] = await catchError(getPreferences());
    if (error) {
        notify.error(describeRequestError(error, t('browse.preferenceLoadError')));
        return;
    }
    if (!preferencesChanged) {
        browseColumns.value = preferences.browseColumns ?? 0;
        savedBrowseColumns = browseColumns.value;
    }
}
function saveBrowseColumns() {
    preferencesChanged = true;
    const requestedColumns = browseColumns.value;
    preferenceSaveQueue = preferenceSaveQueue.then(async () => {
        const [error] = await catchError(updatePreferences({ browseColumns: requestedColumns || null }));
        if (error) {
            notify.error(describeRequestError(error, t('browse.preferenceSaveError')));
            if (browseColumns.value === requestedColumns)
                browseColumns.value = savedBrowseColumns;
            return;
        }
        savedBrowseColumns = requestedColumns;
    });
}
async function load(reset) {
    controller?.abort();
    controller = new AbortController();
    const offset = reset ? 0 : items.value.length;
    isLoading.value = true;
    failed.value = false;
    if (reset) {
        items.value = [];
        total.value = 0;
    }
    const [error, page] = await catchError(browseMedia(props.kind, sort.value, offset, controller.signal));
    if (error) {
        if (error.code === 'ERR_CANCELED')
            return;
        failed.value = true;
    }
    else {
        items.value = reset ? page.items : [...items.value, ...page.items];
        total.value = page.total;
    }
    isLoading.value = false;
    // The observer only fires on changes, so look again in case the grid still doesn't fill the screen.
    recheck();
}
watch([() => props.kind, sort], () => void load(true));
onMounted(() => {
    void load(true);
    void loadPreferences();
});
onBeforeUnmount(() => controller?.abort());
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
    __VLS_withDotValue(failed, {});
    __VLS_withDotValue(isLoading, {});
    __VLS_withDotValue(items, {});
    __VLS_withDotValue(browseColumns, {});
    __VLS_withDotValue(hasMore, {});
    void {};
    /** @type {__VLS_StyleScopedClasses['browse-grid-preferred']} */ ;
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
        ...{ class: "flex flex-wrap items-end justify-between gap-4" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-end']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
        ...{ class: "text-3xl font-bold text-white" },
    });
    /** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    (__VLS_unwrap(heading, {}));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-wrap gap-3" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "flex items-center gap-2 text-sm text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('browse.sortBy'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_unwrap(sort, {})),
        ...{ class: "rounded border border-flixer-border bg-flixer-surface px-3 py-2 text-sm text-white" },
    });
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    const __VLS_7 = __VLS_tryAsConstant((__VLS_unwrap(SORTS, {})));
    for (const [option] of __VLS_vFor(__VLS_nonNull(__VLS_7))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (option),
            value: (option),
        });
        (__VLS_unwrap(t, {})(`browse.sort.${option}`));
        // @ts-ignore
        [navLinks, isSigningOut, signOut, heading, t, t, sort, SORTS,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "flex items-center gap-2 text-sm text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('browse.columns'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (saveBrowseColumns) },
        value: (browseColumns.value),
        ...{ class: "rounded border border-flixer-border bg-flixer-surface px-3 py-2 text-sm text-white" },
    });
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (0),
    });
    (__VLS_unwrap(t, {})('browse.columnsAuto'));
    const __VLS_8 = __VLS_tryAsConstant((__VLS_unwrap(BROWSE_COLUMN_OPTIONS, {})));
    for (const [columns] of __VLS_vFor(__VLS_nonNull(__VLS_8))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (columns),
            value: (columns),
        });
        (__VLS_unwrap(t, {})('browse.columnOption', { count: columns }));
        // @ts-ignore
        [t, t, t, browseColumns, BROWSE_COLUMN_OPTIONS,];
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
        (__VLS_unwrap(t, {})('browse.error'));
    }
    else if (isLoading.value && items.value.length === 0) {
        const __VLS_9 = CardGridSkeleton;
        // @ts-ignore
        const __VLS_10 = __VLS_asFunctionalComponent1(__VLS_9, new __VLS_9({
            // @ts-ignore
            square: (__VLS_ctx.kind === 'music'),
        }));
        const __VLS_11 = __VLS_10({
            square: (__VLS_ctx.kind === 'music'),
        }, ...__VLS_functionalComponentArgsRest(__VLS_10));
    }
    else if (items.value.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('browse.empty'));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
            ...{ style: (__VLS_unwrap(gridStyle, {})) },
            ...{ class: (['grid gap-x-4 gap-y-6', browseColumns.value ? 'browse-grid-preferred' : 'grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]']) },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-x-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-y-6']} */ ;
        const __VLS_14 = __VLS_tryAsConstant((items.value));
        for (const [item] of __VLS_vFor(__VLS_nonNull(__VLS_14))) {
            const __VLS_15 = MediaCard;
            // @ts-ignore
            const __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
                // @ts-ignore
                key: (item.id), ...{ class: "!w-auto" }, variant: (__VLS_ctx.kind === 'music' ? 'square' : 'poster'), title: (item.title), subtitle: (subtitleOf(item)), itemId: (item.id), imageIndex: (item.poster ?? item.backdrop), version: (item.updatedAt),
            }));
            const __VLS_17 = __VLS_16({
                key: (item.id),
                ...{ class: "!w-auto" },
                variant: (__VLS_ctx.kind === 'music' ? 'square' : 'poster'),
                title: (item.title),
                subtitle: (subtitleOf(item)),
                itemId: (item.id),
                imageIndex: (item.poster ?? item.backdrop),
                version: (item.updatedAt),
            }, ...__VLS_functionalComponentArgsRest(__VLS_16));
            /** @type {__VLS_StyleScopedClasses['!w-auto']} */ ;
            // @ts-ignore
            [t, t, browseColumns, failed, isLoading, items, items, items, kind, kind, gridStyle,];
        }
        const __VLS_20 = __VLS_tryAsConstant((isLoading.value ? 6 : 0));
        for (const [n] of __VLS_vFor(__VLS_nonNull(__VLS_20))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                key: (`more-${n}`),
                'aria-hidden': "true",
            });
            const __VLS_21 = Skeleton;
            // @ts-ignore
            const __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21({
                // @ts-ignore
                ...{ class: (__VLS_ctx.kind === 'music' ? 'aspect-square' : 'aspect-[2/3]') }, ...{ class: "w-full rounded" },
            }));
            const __VLS_23 = __VLS_22({
                ...{ class: (__VLS_ctx.kind === 'music' ? 'aspect-square' : 'aspect-[2/3]') },
                ...{ class: "w-full rounded" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_22));
            /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            // @ts-ignore
            [isLoading, kind,];
        }
    }
    if (hasMore.value && !failed.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ref: (__VLS_unwrap(setSentinel, {})),
            ...{ class: "h-px" },
            'aria-hidden': "true",
        });
        /** @type {__VLS_StyleScopedClasses['h-px']} */ ;
    }
    const __VLS_26 = MobileTabBar;
    // @ts-ignore
    const __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({
        // @ts-ignore
        tabs: (__VLS_unwrap(mobileTabs, {})),
    }));
    const __VLS_28 = __VLS_27({
        tabs: (__VLS_unwrap(mobileTabs, {})),
    }, ...__VLS_functionalComponentArgsRest(__VLS_27));
    // @ts-ignore
    [failed, hasMore, setSentinel, mobileTabs,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
