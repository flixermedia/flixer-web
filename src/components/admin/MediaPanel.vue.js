import { openModal } from '@kolirt/vue-modal';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import Skeleton from '../ui/Skeleton.vue';
import { deleteMediaItem, getMediaItem, listMediaItems, listMediaLibraries, MEDIA_ITEM_TYPES, rebuildMediaSearchIndex, refreshMediaItem } from '../../api';
import { confirmAction } from '../../composables/confirm';
import { notify } from '../../composables/notify';
import { useInfiniteScroll } from '../../composables/useInfiniteScroll';
import { describeRequestError } from '../../composables/useProfile';
import { catchError } from '../../utils/catchError';
import AdminSection from './AdminSection.vue';
import AuthImage from '../ui/AuthImage.vue';
import MediaItemModal from './MediaItemModal.vue';
import StatusPill from './StatusPill.vue';
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const PAGE_SIZE = 25;
const SEARCH_DEBOUNCE_MS = 300;
const CONTAINER_TYPES = ['series', 'season', 'album'];
const libraries = ref([]);
const albumPosters = ref({});
const seriesPosters = ref({});
const result = ref({
    items: [],
    total: 0,
    page: 1,
    size: PAGE_SIZE,
    categoryCounts: { movies: 0, tvShows: 0, music: 0 },
});
const loading = ref(true);
const error = ref('');
function queryText(key) {
    const value = route.query[key];
    return typeof value === 'string' ? value : '';
}
// The browsing position lives in the URL, so a refresh or a shared link returns to the same place.
const libraryId = ref(queryText('mlib'));
const CATEGORY_TYPES = ['movies', 'tvShows', 'music'];
function mediaTypeFilter(value) {
    if (CATEGORY_TYPES.includes(value))
        return value;
    return MEDIA_ITEM_TYPES.includes(value) ? value : '';
}
const type = ref(mediaTypeFilter(queryText('mtype')));
const search = ref(queryText('mq'));
const page = ref(1);
const parent = ref(queryText('mparent') ? { id: queryText('mparent'), title: queryText('mparentTitle') } : null);
const deletingId = ref(null);
const rebuildingSearchIndex = ref(false);
const failedReset = ref(true);
let searchTimer;
let requestId = 0;
let pushNextQuery = false;
const hasMore = computed(() => result.value.items.length < result.value.total);
const hasFilters = computed(() => Boolean(libraryId.value || type.value || search.value.trim() || parent.value));
const canLoadMore = computed(() => hasMore.value && hasFilters.value && !loading.value && !error.value);
const inputClass = 'rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm text-flixer-text';
const groups = computed(() => {
    const grouped = [
        { id: 'movies', title: t('admin.media.groups.movies'), items: [] },
        { id: 'tvShows', title: t('admin.media.groups.tvShows'), items: [] },
        { id: 'music', title: t('admin.media.groups.music'), items: [] },
    ];
    for (const item of result.value.items) {
        if (item.type === 'movie' || item.type === 'video')
            grouped[0].items.push(item);
        else if (item.type === 'series' || item.type === 'season' || item.type === 'episode')
            grouped[1].items.push(item);
        else if (item.type === 'album' || item.type === 'track')
            grouped[2].items.push(item);
    }
    return grouped.filter((group) => group.items.length > 0);
});
function posterSource(item) {
    if (item.poster !== null)
        return { itemId: item.id, index: item.poster };
    const albumPoster = item.parentId ? albumPosters.value[item.parentId] : undefined;
    if (item.type === 'track' && item.parentId && albumPoster !== null && albumPoster !== undefined) {
        return { itemId: item.parentId, index: albumPoster };
    }
    const seriesPoster = seriesPosters.value[item.id];
    return item.type === 'episode' && seriesPoster !== null && seriesPoster !== undefined
        ? { itemId: seriesPoster.itemId, index: seriesPoster.index }
        : null;
}
async function loadRelatedPosters(items, current, reset) {
    const parentIds = [...new Set(items.flatMap((item) => item.type === 'track' && item.poster === null && item.parentId ? [item.parentId] : []))];
    const episodeIds = items.filter((item) => item.type === 'episode' && item.poster === null).map((item) => item.id);
    const albumCache = reset ? {} : albumPosters.value;
    const seriesCache = reset ? {} : seriesPosters.value;
    const missingAlbums = parentIds.filter((id) => !Object.hasOwn(albumCache, id));
    const missingEpisodes = episodeIds.filter((id) => !Object.hasOwn(seriesCache, id));
    const seriesLookups = new Map();
    function findSeriesArtwork(id, ancestors = new Set()) {
        if (ancestors.has(id))
            return Promise.resolve({ error: null, artwork: null });
        const cached = seriesLookups.get(id);
        if (cached)
            return cached;
        const nextAncestors = new Set(ancestors).add(id);
        const lookup = (async () => {
            const [error, ancestor] = await catchError(getMediaItem(id));
            if (error)
                return { error, artwork: null };
            if (ancestor.type === 'series') {
                const poster = ancestor.images.find((image) => image.type === 'poster' && image.available);
                return { error: null, artwork: poster ? { itemId: ancestor.id, index: poster.index } : null };
            }
            return ancestor.parent ? findSeriesArtwork(ancestor.parent.id, nextAncestors) : { error: null, artwork: null };
        })();
        seriesLookups.set(id, lookup);
        return lookup;
    }
    const [albumLookups, episodeLookups] = await Promise.all([
        Promise.all(missingAlbums.map(async (id) => {
            const [error, album] = await catchError(getMediaItem(id));
            if (error)
                return { id, error, index: null };
            const poster = album.type === 'album' ? album.images.find((image) => image.type === 'poster' && image.available) : undefined;
            return { id, error: null, index: poster?.index ?? null };
        })),
        Promise.all(missingEpisodes.map(async (id) => {
            const summary = items.find((item) => item.id === id);
            if (!summary?.parentId)
                return { id, error: null, artwork: null };
            const { error, artwork } = await findSeriesArtwork(summary.parentId);
            return { id, error, artwork };
        })),
    ]);
    if (current !== requestId)
        return;
    const nextAlbumPosters = reset ? {} : { ...albumPosters.value };
    for (const { id, index } of albumLookups)
        nextAlbumPosters[id] = index;
    albumPosters.value = nextAlbumPosters;
    const nextSeriesPosters = reset ? {} : { ...seriesPosters.value };
    for (const { id, artwork } of episodeLookups)
        nextSeriesPosters[id] = artwork;
    seriesPosters.value = nextSeriesPosters;
    const failure = [...albumLookups, ...episodeLookups].find((lookup) => lookup.error)?.error;
    if (failure)
        notify.error(describeRequestError(failure, t('admin.media.posterLoadError')));
}
async function load(reset = true) {
    if (!reset && loading.value)
        return;
    const current = ++requestId;
    const nextPage = reset ? 1 : page.value + 1;
    failedReset.value = reset;
    loading.value = true;
    error.value = '';
    try {
        const [requestError, data] = await catchError(listMediaItems({
            libraryId: libraryId.value || undefined,
            type: type.value || undefined,
            parentId: parent.value?.id,
            search: search.value.trim() || undefined,
            page: nextPage,
            size: PAGE_SIZE,
        }));
        if (requestError) {
            if (current === requestId)
                error.value = describeRequestError(requestError, t('admin.media.loadError'));
        }
        else if (current === requestId) {
            // Ignore a slow response that a newer filter has already replaced.
            await loadRelatedPosters(data.items, current, reset);
            if (current !== requestId)
                return;
            result.value = reset ? data : { ...data, items: [...result.value.items, ...data.items] };
            page.value = nextPage;
        }
    }
    finally {
        if (current === requestId) {
            loading.value = false;
            recheck();
        }
    }
}
const { setSentinel, recheck } = useInfiniteScroll(() => void load(false), canLoadMore);
function openChildren(item) {
    pushNextQuery = true;
    parent.value = { id: item.id, title: item.title };
    type.value = '';
    search.value = '';
    page.value = 1;
}
async function edit(item) {
    const refresh = await openModal(MediaItemModal, { props: { itemId: item.id } }).catch(() => false);
    if (refresh)
        await load();
}
async function rescan(item) {
    if (CONTAINER_TYPES.includes(item.type) && !(await confirmAction(t('admin.media.confirmRescan', { title: item.title }))))
        return;
    const [error, refresh] = await catchError(refreshMediaItem(item.id));
    if (error) {
        notify.error(describeRequestError(error, t('admin.media.rescanError')));
    }
    else {
        notify.success(t(refresh.alreadyQueued ? 'admin.media.rescanAlreadyQueued' : 'admin.media.rescanQueued'));
    }
}
async function remove(item) {
    if (!(await confirmAction(t('admin.media.confirmDelete', { title: item.title }), { danger: true })))
        return;
    deletingId.value = item.id;
    try {
        const [error] = await catchError(deleteMediaItem(item.id));
        if (error) {
            notify.error(describeRequestError(error, t('admin.media.deleteError')));
        }
        else {
            notify.success(t('admin.media.deleted'));
        }
    }
    finally {
        deletingId.value = null;
        await load();
    }
}
async function rebuildSearchIndex() {
    if (!(await confirmAction(t('admin.media.confirmSearchRebuild'))))
        return;
    rebuildingSearchIndex.value = true;
    const [error, result] = await catchError(rebuildMediaSearchIndex());
    rebuildingSearchIndex.value = false;
    if (error) {
        notify.error(describeRequestError(error, t('admin.media.searchRebuildError')));
    }
    else {
        notify.success(t(result.queued ? 'admin.media.searchRebuildQueued' : 'admin.media.searchRebuildAlreadyQueued'));
    }
}
function subtitle(item) {
    const parts = [];
    if (item.seasonNumber !== null && item.type !== 'series')
        parts.push(`S${item.seasonNumber}`);
    if (item.episodeNumber !== null)
        parts.push(`E${item.episodeNumber}`);
    return parts.join(' ');
}
watch([libraryId, type], () => {
    page.value = 1;
    void load();
});
watch(parent, () => void load());
watch(search, () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        page.value = 1;
        void load();
    }, SEARCH_DEBOUNCE_MS);
});
watch(() => [queryText('mlib'), queryText('mtype'), queryText('mq'), queryText('mparent'), queryText('mparentTitle')], ([nextLibraryId, nextType, nextSearch, nextParentId, nextParentTitle]) => {
    libraryId.value = nextLibraryId;
    type.value = mediaTypeFilter(nextType);
    search.value = nextSearch;
    parent.value = nextParentId ? { id: nextParentId, title: nextParentTitle } : null;
});
function syncQuery() {
    const query = { ...route.query };
    const state = {
        mlib: libraryId.value || undefined,
        mtype: type.value || undefined,
        mq: search.value.trim() || undefined,
        mparent: parent.value?.id,
        mparentTitle: parent.value?.title,
    };
    for (const [key, value] of Object.entries(state)) {
        if (value === undefined)
            delete query[key];
        else
            query[key] = value;
    }
    if (JSON.stringify(query) !== JSON.stringify(route.query)) {
        if (pushNextQuery) {
            pushNextQuery = false;
            void router.push({ query });
        }
        else {
            void router.replace({ query });
        }
    }
}
watch([libraryId, type, search, parent], syncQuery);
onMounted(async () => {
    syncQuery();
    void load(true);
    const [error, result] = await catchError(listMediaLibraries());
    if (!error)
        libraries.value = result;
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(rebuildingSearchIndex, {});
    __VLS_withDotValue(result, {});
    __VLS_withDotValue(parent, {});
    __VLS_withDotValue(error, {});
    __VLS_withDotValue(loading, {});
    __VLS_withDotValue(type, {});
    __VLS_withDotValue(CONTAINER_TYPES, {});
    __VLS_withDotValue(deletingId, {});
    __VLS_withDotValue(hasFilters, {});
    __VLS_withDotValue(hasMore, {});
    void {};
    /** @type {__VLS_StyleScopedClasses['media-result-enter-active']} */ ;
    /** @type {__VLS_StyleScopedClasses['media-result-appear-active']} */ ;
    /** @type {__VLS_StyleScopedClasses['media-result-move']} */ ;
    const __VLS_0 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('admin.media.title')), description: (__VLS_unwrap(t, {})('admin.media.description')),
    }));
    const __VLS_2 = __VLS_1({
        title: (__VLS_unwrap(t, {})('admin.media.title')),
        description: (__VLS_unwrap(t, {})('admin.media.description')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    {
        const { actions: __VLS_6 } = __VLS_nonNull(__VLS_3.slots);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (rebuildSearchIndex) },
            type: "button",
            disabled: (rebuildingSearchIndex.value),
            ...{ class: "rounded bg-white/10 px-3 py-2 text-xs font-semibold transition hover:bg-white/15 disabled:opacity-50" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
        (__VLS_unwrap(t, {})(rebuildingSearchIndex.value ? 'admin.media.searchRebuilding' : 'admin.media.searchRebuild'));
        // @ts-ignore
        [t, t, t, rebuildingSearchIndex, rebuildingSearchIndex,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-wrap items-end gap-3" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-end']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "flex min-w-48 flex-1 flex-col gap-1 text-xs text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-48']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('admin.media.search'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "relative" },
    });
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "search",
        ...{ class: (`${__VLS_unwrap(inputClass, {})} w-full !pr-28`) },
    });
    (__VLS_unwrap(search, {}));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        'aria-live': "polite",
        ...{ class: "pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded bg-white/10 px-2 py-0.5 text-[11px] text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['pointer-events-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['right-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['top-1/2']} */ ;
    /** @type {__VLS_StyleScopedClasses['-translate-y-1/2']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-[11px]']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('admin.media.total', { count: result.value.total }));
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "flex flex-col gap-1 text-xs text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('admin.media.libraryFilter'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_unwrap(libraryId, {})),
        ...{ class: (__VLS_unwrap(inputClass, {})) },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    (__VLS_unwrap(t, {})('admin.media.allLibraries'));
    const __VLS_7 = __VLS_tryAsConstant((__VLS_unwrap(libraries, {})));
    for (const [library] of __VLS_vFor(__VLS_nonNull(__VLS_7))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (library.id),
            value: (library.id),
        });
        (library.name);
        // @ts-ignore
        [t, t, t, t, inputClass, inputClass, search, result, libraryId, libraries,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "flex flex-col gap-1 text-xs text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('admin.media.typeFilter'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (type.value),
        ...{ class: (__VLS_unwrap(inputClass, {})) },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    (__VLS_unwrap(t, {})('admin.media.allTypes'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "movies",
    });
    (__VLS_unwrap(t, {})('admin.media.groups.movies'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "tvShows",
    });
    (__VLS_unwrap(t, {})('admin.media.groups.tvShows'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "music",
    });
    (__VLS_unwrap(t, {})('admin.media.groups.music'));
    const __VLS_8 = __VLS_tryAsConstant((__VLS_unwrap(MEDIA_ITEM_TYPES, {})));
    for (const [option] of __VLS_vFor(__VLS_nonNull(__VLS_8))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (option),
            value: (option),
        });
        (__VLS_unwrap(t, {})(`admin.media.types.${option}`));
        // @ts-ignore
        [t, t, t, t, t, t, inputClass, type, MEDIA_ITEM_TYPES,];
    }
    if (parent.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-4 flex items-center gap-3 text-sm" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.media.showingChildren', { title: parent.value.title }));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!(parent.value))
                        throw 0;
                    return (parent.value = null);
                    // @ts-ignore
                    [t, parent, parent, parent,];
                } },
            type: "button",
            ...{ class: "text-xs text-flixer-accent hover:underline" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:underline']} */ ;
        (__VLS_unwrap(t, {})('admin.media.clearParent'));
    }
    // @ts-ignore
    [t,];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mx-5 flex flex-col gap-10" },
    });
    /** @type {__VLS_StyleScopedClasses['mx-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-10']} */ ;
    if (error.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            role: "alert",
            ...{ class: "flex flex-wrap items-center gap-3 text-sm text-red-300" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
        (error.value);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!(error.value))
                        throw 0;
                    return (load(__VLS_unwrap(failedReset, {})));
                    // @ts-ignore
                    [error, error, failedReset,];
                } },
            type: "button",
            ...{ class: "rounded bg-white/10 px-3 py-1 text-xs font-semibold text-flixer-text transition hover:bg-white/15" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
        (__VLS_unwrap(t, {})('admin.media.retry'));
    }
    if (loading.value && result.value.items.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6" },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:grid-cols-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:grid-cols-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['xl:grid-cols-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['2xl:grid-cols-6']} */ ;
        const __VLS_9 = __VLS_tryAsConstant((6));
        for (const [n] of __VLS_vFor(__VLS_nonNull(__VLS_9))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (`skeleton-${n}`),
                ...{ class: "overflow-hidden rounded border border-flixer-border bg-flixer-background/60" },
                role: "status",
                'aria-label': (__VLS_unwrap(t, {})('common.loading')),
                'aria-busy': "true",
            });
            /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-background/60']} */ ;
            const __VLS_10 = Skeleton;
            // @ts-ignore
            const __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({
                // @ts-ignore
                ...{ class: "aspect-[2/3] w-full" },
            }));
            const __VLS_12 = __VLS_11({
                ...{ class: "aspect-[2/3] w-full" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_11));
            /** @type {__VLS_StyleScopedClasses['aspect-[2/3]']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "space-y-3 p-3" },
            });
            /** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
            const __VLS_15 = Skeleton;
            // @ts-ignore
            const __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
                // @ts-ignore
                ...{ class: "h-4 w-4/5" },
            }));
            const __VLS_17 = __VLS_16({
                ...{ class: "h-4 w-4/5" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_16));
            /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-4/5']} */ ;
            const __VLS_20 = Skeleton;
            // @ts-ignore
            const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
                // @ts-ignore
                ...{ class: "h-3 w-2/5" },
            }));
            const __VLS_22 = __VLS_21({
                ...{ class: "h-3 w-2/5" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_21));
            /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-2/5']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "grid grid-cols-2 gap-2" },
            });
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            const __VLS_25 = Skeleton;
            // @ts-ignore
            const __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25({
                // @ts-ignore
                ...{ class: "h-7 rounded" },
            }));
            const __VLS_27 = __VLS_26({
                ...{ class: "h-7 rounded" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_26));
            /** @type {__VLS_StyleScopedClasses['h-7']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            const __VLS_30 = Skeleton;
            // @ts-ignore
            const __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({
                // @ts-ignore
                ...{ class: "h-7 rounded" },
            }));
            const __VLS_32 = __VLS_31({
                ...{ class: "h-7 rounded" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_31));
            /** @type {__VLS_StyleScopedClasses['h-7']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            // @ts-ignore
            [t, t, result, loading,];
        }
    }
    else if (result.value.items.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: (loading.value ? 'opacity-60' : '') },
            ...{ class: "flex flex-col gap-10 transition-opacity duration-200" },
            'aria-busy': (loading.value),
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-opacity']} */ ;
        /** @type {__VLS_StyleScopedClasses['duration-200']} */ ;
        const __VLS_35 = __VLS_tryAsConstant((__VLS_unwrap(groups, {})));
        for (const [group] of __VLS_vFor(__VLS_nonNull(__VLS_35))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
                key: (group.id),
                ...{ class: "space-y-3" },
            });
            /** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex items-center gap-3 border-b border-flixer-border pb-2" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['pb-2']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
                ...{ class: "text-lg font-semibold tracking-tight" },
            });
            /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['tracking-tight']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!!(loading.value && result.value.items.length === 0))
                            throw 0;
                        if (!(result.value.items.length > 0))
                            throw 0;
                        return (type.value = type.value === group.id ? '' : group.id);
                        // @ts-ignore
                        [result, type, type, loading, loading, groups,];
                    } },
                type: "button",
                ...{ class: "flex items-center gap-3 rounded text-left transition hover:text-flixer-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
                'aria-pressed': (type.value === group.id),
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:text-flixer-accent']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
            (group.title);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (result.value.categoryCounts[group.id]);
            let __VLS_36;
            /** @ts-ignore @type { | typeof __VLS_components.TransitionGroup | typeof __VLS_components.TransitionGroup} */
            TransitionGroup;
            // @ts-ignore
            const __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36({
                // @ts-ignore
                tag: "div", name: "media-result", appear: true, ...{ class: "relative grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6" },
            }));
            const __VLS_38 = __VLS_37({
                tag: "div",
                name: "media-result",
                appear: true,
                ...{ class: "relative grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_37));
            /** @type {__VLS_StyleScopedClasses['relative']} */ ;
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['sm:grid-cols-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['md:grid-cols-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['xl:grid-cols-5']} */ ;
            /** @type {__VLS_StyleScopedClasses['2xl:grid-cols-6']} */ ;
            var __VLS_39;
            const { default: __VLS_41 } = __VLS_nonNull(__VLS_39.slots);
            const __VLS_42 = __VLS_tryAsConstant((group.items));
            for (const [item, index] of __VLS_vFor(__VLS_nonNull(__VLS_42))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
                    key: (item.id),
                    ...{ style: ({ '--i': Math.min(index, 14) }) },
                    ...{ class: "flex h-full min-w-0 flex-col overflow-hidden rounded border border-flixer-border bg-flixer-background/60 transition-colors hover:border-flixer-accent/40 hover:bg-flixer-background" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
                /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
                /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['border']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-flixer-background/60']} */ ;
                /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:border-flixer-accent/40']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:bg-flixer-background']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "relative overflow-hidden bg-white/5" },
                    ...{ class: (item.type === 'album' ? 'aspect-square' : 'aspect-[2/3]') },
                });
                /** @type {__VLS_StyleScopedClasses['relative']} */ ;
                /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-white/5']} */ ;
                if (posterSource(item)) {
                    const __VLS_43 = AuthImage;
                    // @ts-ignore
                    const __VLS_44 = __VLS_asFunctionalComponent1(__VLS_43, new __VLS_43({
                        // @ts-ignore
                        itemId: (posterSource(item)?.itemId ?? item.id), index: (posterSource(item)?.index ?? 0), width: (300), alt: (item.title), version: (item.updatedAt),
                    }));
                    const __VLS_45 = __VLS_44({
                        itemId: (posterSource(item)?.itemId ?? item.id),
                        index: (posterSource(item)?.index ?? 0),
                        width: (300),
                        alt: (item.title),
                        version: (item.updatedAt),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_44));
                }
                else {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "flex size-full items-center justify-center px-2 text-center text-xs text-flixer-muted" },
                    });
                    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                    /** @type {__VLS_StyleScopedClasses['size-full']} */ ;
                    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
                    /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                    (__VLS_unwrap(t, {})('admin.media.noPoster'));
                }
                const __VLS_48 = StatusPill || StatusPill;
                // @ts-ignore
                const __VLS_49 = __VLS_asFunctionalComponent1(__VLS_48, new __VLS_48({
                    // @ts-ignore
                    tone: "accent", ...{ class: "absolute right-2 top-2 !bg-flixer-primary/90 !px-2 !py-0.5 !text-white shadow" },
                }));
                const __VLS_50 = __VLS_49({
                    tone: "accent",
                    ...{ class: "absolute right-2 top-2 !bg-flixer-primary/90 !px-2 !py-0.5 !text-white shadow" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_49));
                /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
                /** @type {__VLS_StyleScopedClasses['right-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['top-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['!bg-flixer-primary/90']} */ ;
                /** @type {__VLS_StyleScopedClasses['!px-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['!py-0.5']} */ ;
                /** @type {__VLS_StyleScopedClasses['!text-white']} */ ;
                /** @type {__VLS_StyleScopedClasses['shadow']} */ ;
                var __VLS_51;
                const { default: __VLS_53 } = __VLS_nonNull(__VLS_51.slots);
                (__VLS_unwrap(t, {})(`admin.media.types.${item.type}`));
                // @ts-ignore
                [t, t, result, type,];
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent px-3 pb-3 pt-12 text-white" },
                });
                /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
                /** @type {__VLS_StyleScopedClasses['inset-x-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['bottom-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-gradient-to-t']} */ ;
                /** @type {__VLS_StyleScopedClasses['from-black']} */ ;
                /** @type {__VLS_StyleScopedClasses['via-black/80']} */ ;
                /** @type {__VLS_StyleScopedClasses['to-transparent']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['pb-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['pt-12']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
                    ...{ class: "truncate text-sm font-semibold" },
                    title: (item.title),
                });
                /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                (item.title);
                if (item.year) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "ml-1 font-normal text-white/70" },
                    });
                    /** @type {__VLS_StyleScopedClasses['ml-1']} */ ;
                    /** @type {__VLS_StyleScopedClasses['font-normal']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-white/70']} */ ;
                    (item.year);
                }
                if (subtitle(item) || item.edited || Object.keys(item.providerIds).length === 0) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                        ...{ class: "mt-1 flex min-h-5 flex-wrap items-center gap-1.5 text-xs text-white/75" },
                    });
                    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
                    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                    /** @type {__VLS_StyleScopedClasses['min-h-5']} */ ;
                    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
                    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                    /** @type {__VLS_StyleScopedClasses['gap-1.5']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-white/75']} */ ;
                    if (subtitle(item)) {
                        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                        (subtitle(item));
                    }
                    if (item.edited) {
                        const __VLS_54 = StatusPill || StatusPill;
                        // @ts-ignore
                        const __VLS_55 = __VLS_asFunctionalComponent1(__VLS_54, new __VLS_54({
                            // @ts-ignore
                            tone: "neutral",
                        }));
                        const __VLS_56 = __VLS_55({
                            tone: "neutral",
                        }, ...__VLS_functionalComponentArgsRest(__VLS_55));
                        var __VLS_57;
                        const { default: __VLS_59 } = __VLS_nonNull(__VLS_57.slots);
                        (__VLS_unwrap(t, {})('admin.media.edited'));
                        // @ts-ignore
                        [t,];
                    }
                    if (Object.keys(item.providerIds).length === 0) {
                        const __VLS_60 = StatusPill || StatusPill;
                        // @ts-ignore
                        const __VLS_61 = __VLS_asFunctionalComponent1(__VLS_60, new __VLS_60({
                            // @ts-ignore
                            tone: "warn",
                        }));
                        const __VLS_62 = __VLS_61({
                            tone: "warn",
                        }, ...__VLS_functionalComponentArgsRest(__VLS_61));
                        var __VLS_63;
                        const { default: __VLS_65 } = __VLS_nonNull(__VLS_63.slots);
                        (__VLS_unwrap(t, {})('admin.media.unidentified'));
                        // @ts-ignore
                        [t,];
                    }
                }
                if (item.parentTitle) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                        ...{ class: "mt-1 truncate text-xs text-white/70" },
                        title: (item.parentTitle),
                    });
                    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
                    /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-white/70']} */ ;
                    (item.parentTitle);
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "mt-1 truncate font-mono text-[10px] text-white/60" },
                    title: (item.path),
                });
                /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-white/60']} */ ;
                (item.path);
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "flex items-center justify-center gap-1 p-1.5" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['p-1.5']} */ ;
                if (CONTAINER_TYPES.value.includes(item.type)) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                void $event;
                                if (!!(loading.value && result.value.items.length === 0))
                                    throw 0;
                                if (!(result.value.items.length > 0))
                                    throw 0;
                                if (!(CONTAINER_TYPES.value.includes(item.type)))
                                    throw 0;
                                return (openChildren(item));
                                // @ts-ignore
                                [CONTAINER_TYPES,];
                            } },
                        type: "button",
                        'aria-label': (__VLS_unwrap(t, {})('admin.media.browseChildren')),
                        title: (__VLS_unwrap(t, {})('admin.media.browseChildren')),
                        ...{ class: "flex h-8 min-w-0 flex-1 items-center justify-center rounded bg-white/10 text-flixer-text transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
                    });
                    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                    /** @type {__VLS_StyleScopedClasses['h-8']} */ ;
                    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
                    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
                    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
                    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                    /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
                    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                    /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
                    let __VLS_66;
                    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
                    Icon;
                    // @ts-ignore
                    const __VLS_67 = __VLS_asFunctionalComponent1(__VLS_66, new __VLS_66({
                        // @ts-ignore
                        icon: "lucide:folder-open", ...{ class: "size-4" }, 'aria-hidden': "true",
                    }));
                    const __VLS_68 = __VLS_67({
                        icon: "lucide:folder-open",
                        ...{ class: "size-4" },
                        'aria-hidden': "true",
                    }, ...__VLS_functionalComponentArgsRest(__VLS_67));
                    /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!!(loading.value && result.value.items.length === 0))
                                throw 0;
                            if (!(result.value.items.length > 0))
                                throw 0;
                            return (edit(item));
                            // @ts-ignore
                            [t, t,];
                        } },
                    type: "button",
                    'aria-label': (__VLS_unwrap(t, {})('admin.media.edit')),
                    title: (__VLS_unwrap(t, {})('admin.media.edit')),
                    ...{ class: "flex h-8 min-w-0 flex-1 items-center justify-center rounded bg-white/10 text-flixer-text transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['h-8']} */ ;
                /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
                /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
                let __VLS_71;
                /** @ts-ignore @type { | typeof __VLS_components.Icon} */
                Icon;
                // @ts-ignore
                const __VLS_72 = __VLS_asFunctionalComponent1(__VLS_71, new __VLS_71({
                    // @ts-ignore
                    icon: "lucide:pencil", ...{ class: "size-4" }, 'aria-hidden': "true",
                }));
                const __VLS_73 = __VLS_72({
                    icon: "lucide:pencil",
                    ...{ class: "size-4" },
                    'aria-hidden': "true",
                }, ...__VLS_functionalComponentArgsRest(__VLS_72));
                /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!!(loading.value && result.value.items.length === 0))
                                throw 0;
                            if (!(result.value.items.length > 0))
                                throw 0;
                            return (rescan(item));
                            // @ts-ignore
                            [t, t,];
                        } },
                    type: "button",
                    'aria-label': (__VLS_unwrap(t, {})('admin.media.rescan')),
                    title: (__VLS_unwrap(t, {})('admin.media.rescan')),
                    ...{ class: "flex h-8 min-w-0 flex-1 items-center justify-center rounded bg-white/10 text-flixer-text transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['h-8']} */ ;
                /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
                /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
                let __VLS_76;
                /** @ts-ignore @type { | typeof __VLS_components.Icon} */
                Icon;
                // @ts-ignore
                const __VLS_77 = __VLS_asFunctionalComponent1(__VLS_76, new __VLS_76({
                    // @ts-ignore
                    icon: "lucide:refresh-cw", ...{ class: "size-4" }, 'aria-hidden': "true",
                }));
                const __VLS_78 = __VLS_77({
                    icon: "lucide:refresh-cw",
                    ...{ class: "size-4" },
                    'aria-hidden': "true",
                }, ...__VLS_functionalComponentArgsRest(__VLS_77));
                /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!!(loading.value && result.value.items.length === 0))
                                throw 0;
                            if (!(result.value.items.length > 0))
                                throw 0;
                            return (remove(item));
                            // @ts-ignore
                            [t, t,];
                        } },
                    type: "button",
                    disabled: (deletingId.value === item.id),
                    'aria-label': (__VLS_unwrap(t, {})('admin.media.delete')),
                    title: (__VLS_unwrap(t, {})('admin.media.delete')),
                    ...{ class: "flex h-8 min-w-0 flex-1 items-center justify-center rounded bg-red-500/20 text-red-200 transition hover:bg-red-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent disabled:opacity-50" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['h-8']} */ ;
                /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-red-500/20']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-red-200']} */ ;
                /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:bg-red-500/30']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
                /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
                let __VLS_81;
                /** @ts-ignore @type { | typeof __VLS_components.Icon} */
                Icon;
                // @ts-ignore
                const __VLS_82 = __VLS_asFunctionalComponent1(__VLS_81, new __VLS_81({
                    // @ts-ignore
                    icon: "lucide:trash-2", ...{ class: "size-4" }, 'aria-hidden': "true",
                }));
                const __VLS_83 = __VLS_82({
                    icon: "lucide:trash-2",
                    ...{ class: "size-4" },
                    'aria-hidden': "true",
                }, ...__VLS_functionalComponentArgsRest(__VLS_82));
                /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
                // @ts-ignore
                [t, t, deletingId,];
            }
            // @ts-ignore
            [];
            // @ts-ignore
            [];
        }
    }
    else if (!error.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "rounded border border-dashed border-flixer-border p-8 text-center text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-dashed']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-8']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (hasFilters.value ? __VLS_unwrap(t, {})('admin.media.noResults') : __VLS_unwrap(t, {})('admin.media.empty'));
    }
    if (hasMore.value && hasFilters.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ref: (__VLS_unwrap(setSentinel, {})),
            ...{ class: "flex min-h-10 items-center justify-center" },
            'aria-live': "polite",
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['min-h-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
        if (loading.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                role: "status",
                ...{ class: "flex items-center gap-2 text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            let __VLS_86;
            /** @ts-ignore @type { | typeof __VLS_components.Icon} */
            Icon;
            // @ts-ignore
            const __VLS_87 = __VLS_asFunctionalComponent1(__VLS_86, new __VLS_86({
                // @ts-ignore
                icon: "lucide:loader-circle", ...{ class: "size-4 animate-spin motion-reduce:animate-none" }, 'aria-hidden': "true",
            }));
            const __VLS_88 = __VLS_87({
                icon: "lucide:loader-circle",
                ...{ class: "size-4 animate-spin motion-reduce:animate-none" },
                'aria-hidden': "true",
            }, ...__VLS_functionalComponentArgsRest(__VLS_87));
            /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
            /** @type {__VLS_StyleScopedClasses['motion-reduce:animate-none']} */ ;
            (__VLS_unwrap(t, {})('common.loading'));
        }
    }
    // @ts-ignore
    [t, t, t, error, loading, hasFilters, hasFilters, hasMore, setSentinel,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
