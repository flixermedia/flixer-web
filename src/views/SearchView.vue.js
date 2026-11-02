import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { getSearchGenres, searchMedia, searchPluginSections, searchRequests } from '../api';
import { useRequestsConfig } from '../composables/useRequestsConfig';
import { pluginSearchType, sanitizeSearchSections, searchItemRoute } from '../plugins/searchSections';
import Header from '../components/header/Header.vue';
import MediaCard from '../components/home/MediaCard.vue';
import CardGridSkeleton from '../components/ui/CardGridSkeleton.vue';
import MobileTabBar from '../components/home/MobileTabBar.vue';
import { getMobileTabs, getNavLinks } from '../composables/homeNav';
import { useSignOut } from '../composables/useSignOut';
import { catchError } from '../utils/catchError';
const DEBOUNCE_MS = 250;
const MIN_LENGTH = 2;
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { isSigningOut, signOut } = useSignOut();
const requestsConfig = useRequestsConfig();
const externalResults = ref([]);
const pluginSections = ref([]);
const pluginItemCount = computed(() => pluginSections.value.reduce((sum, section) => sum + section.items.length, 0));
const navLinks = computed(getNavLinks);
const mobileTabs = computed(getMobileTabs);
const input = ref();
const searchBarRoot = ref();
const mobileFiltersOpen = ref(false);
const query = ref(typeof route.query.q === 'string' ? route.query.q : '');
const TYPES = ['', 'movie', 'series', 'album', 'video'];
const SORTS = ['relevance', 'title', 'year', 'added'];
const str = (value) => (typeof value === 'string' ? value : '');
const type = ref(str(route.query.type));
const genre = ref(str(route.query.genre));
const yearFrom = ref(str(route.query.from));
const yearTo = ref(str(route.query.to));
const sort = ref(SORTS.find((entry) => entry === route.query.sort) ?? 'relevance');
const unwatched = ref(route.query.unwatched === 'true');
const includeChildren = ref(route.query.includeChildren === 'true');
const genres = ref([]);
const showFilters = ref(Boolean(type.value || genre.value || yearFrom.value || yearTo.value || unwatched.value || includeChildren.value || route.query.sort));
function year(value) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed >= 1800 && parsed <= 2200 ? parsed : undefined;
}
const filters = computed(() => ({
    type: type.value || undefined,
    genre: genre.value || undefined,
    yearFrom: year(yearFrom.value),
    yearTo: year(yearTo.value),
    sort: sort.value,
    unwatched: unwatched.value ? 'true' : undefined,
    includeChildren: includeChildren.value || undefined,
}));
const hasFilters = computed(() => Boolean(type.value || genre.value || year(yearFrom.value) || year(yearTo.value) || unwatched.value));
const activeCount = computed(() => [type.value, genre.value, year(yearFrom.value), year(yearTo.value), unwatched.value, includeChildren.value].filter(Boolean).length);
const hasActivity = computed(() => trimmed.value.length > 0 || hasFilters.value);
function clearFilters() {
    type.value = '';
    genre.value = '';
    yearFrom.value = '';
    yearTo.value = '';
    unwatched.value = false;
    includeChildren.value = false;
    sort.value = 'relevance';
}
const results = ref([]);
const isLoading = ref(false);
const failed = ref(false);
let timer;
let controller;
const trimmed = computed(() => query.value.trim());
const tooShort = computed(() => trimmed.value.length < MIN_LENGTH && !(trimmed.value.length === 0 && hasFilters.value));
async function run(term) {
    controller?.abort();
    if (term.length < MIN_LENGTH && !(term.length === 0 && hasFilters.value)) {
        results.value = [];
        externalResults.value = [];
        pluginSections.value = [];
        isLoading.value = false;
        failed.value = false;
        return;
    }
    controller = new AbortController();
    isLoading.value = true;
    failed.value = false;
    const externalType = type.value === 'movie' ? 'movie' : type.value === 'series' ? 'tv' : type.value === 'album' ? 'music' : undefined;
    const externalAllowed = requestsConfig.config.value?.enabled && requestsConfig.config.value.canRequest && type.value !== 'video';
    const signal = controller.signal;
    const pluginType = pluginSearchType(type.value);
    const [error, data] = await catchError(Promise.all([searchMedia(term, filters.value, signal), externalAllowed ? searchRequests(term, externalType, signal).catch(() => []) : Promise.resolve([]), pluginType === null ? Promise.resolve([]) : searchPluginSections(term, pluginType, signal).then(sanitizeSearchSections, () => [])]));
    if (error) {
        if (error.code === 'ERR_CANCELED')
            return;
        failed.value = true;
        results.value = [];
        externalResults.value = [];
        pluginSections.value = [];
    }
    else {
        const [local, external, sections] = data;
        results.value = local;
        pluginSections.value = sections;
        const enabledTypes = requestsConfig.config.value;
        externalResults.value = external.filter((item) => (item.type === 'movie' ? enabledTypes?.movies : item.type === 'tv' ? enabledTypes?.tv : enabledTypes?.music));
    }
    isLoading.value = false;
}
watch([query, type, genre, yearFrom, yearTo, sort, unwatched, includeChildren], () => {
    clearTimeout(timer);
    const term = trimmed.value;
    const current = filters.value;
    const params = {};
    if (term)
        params.q = term;
    if (current.type)
        params.type = current.type;
    if (current.genre)
        params.genre = current.genre;
    if (current.yearFrom)
        params.from = String(current.yearFrom);
    if (current.yearTo)
        params.to = String(current.yearTo);
    if (current.sort && current.sort !== 'relevance')
        params.sort = current.sort;
    if (current.unwatched)
        params.unwatched = 'true';
    if (current.includeChildren)
        params.includeChildren = 'true';
    void router.replace({ name: 'search', query: params });
    timer = setTimeout(() => void run(term), DEBOUNCE_MS);
});
onMounted(() => {
    input.value?.focus();
    document.addEventListener('pointerdown', onSearchControlsPointerDown);
    document.addEventListener('keydown', onSearchControlsKeydown);
    void getSearchGenres()
        .then((list) => (genres.value = list))
        .catch(() => undefined);
    void requestsConfig.load().then(() => run(trimmed.value));
});
onBeforeUnmount(() => {
    clearTimeout(timer);
    controller?.abort();
    document.removeEventListener('pointerdown', onSearchControlsPointerDown);
    document.removeEventListener('keydown', onSearchControlsKeydown);
});
function onSearchControlsPointerDown(event) {
    if (mobileFiltersOpen.value && searchBarRoot.value && !searchBarRoot.value.contains(event.target)) {
        mobileFiltersOpen.value = false;
    }
}
function onSearchControlsKeydown(event) {
    if (event.key === 'Escape')
        mobileFiltersOpen.value = false;
}
function selectType(value) {
    type.value = value;
    mobileFiltersOpen.value = false;
}
function toggleMobileAdvancedFilters() {
    showFilters.value = !showFilters.value;
    mobileFiltersOpen.value = false;
}
function externalSubtitle(item) {
    const typeName = t(`home.itemType.${item.type === 'tv' ? 'series' : item.type === 'music' ? 'album' : 'movie'}`);
    return item.year ? `${typeName} · ${item.year}` : typeName;
}
function subtitleOf(item) {
    const type = t(`home.itemType.${item.type}`);
    return [type, item.year, item.searchContext].filter(Boolean).join(' · ');
}
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(hasActivity, {});
    __VLS_withDotValue(isLoading, {});
    __VLS_withDotValue(mobileFiltersOpen, {});
    __VLS_withDotValue(type, {});
    __VLS_withDotValue(activeCount, {});
    __VLS_withDotValue(showFilters, {});
    __VLS_withDotValue(hasFilters, {});
    __VLS_withDotValue(includeChildren, {});
    __VLS_withDotValue(sort, {});
    __VLS_withDotValue(tooShort, {});
    __VLS_withDotValue(results, {});
    __VLS_withDotValue(externalResults, {});
    __VLS_withDotValue(pluginItemCount, {});
    __VLS_withDotValue(failed, {});
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
        ...{ class: "page-gutter relative pt-28 sm:pt-32" },
    });
    /** @type {__VLS_StyleScopedClasses['page-gutter']} */ ;
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-28']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:pt-32']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "pointer-events-none absolute inset-x-0 top-0 -z-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_70%)]" },
        'aria-hidden': "true",
    });
    /** @type {__VLS_StyleScopedClasses['pointer-events-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-x-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['top-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['-z-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-80']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_70%)]']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "search-enter relative mx-auto flex max-w-3xl flex-col items-center text-center" },
        ...{ class: (hasActivity.value ? 'pt-0' : 'pt-6 sm:pt-12') },
        ...{ style: {} },
    });
    /** @type {__VLS_StyleScopedClasses['search-enter']} */ ;
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-3xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
        ...{ class: "text-3xl font-bold tracking-tight text-white transition-all duration-500 sm:text-5xl" },
        ...{ class: (hasActivity.value ? 'mb-4 !text-2xl sm:!text-3xl' : 'mb-6') },
    });
    /** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-tight']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
    /** @type {__VLS_StyleScopedClasses['duration-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:text-5xl']} */ ;
    (__VLS_unwrap(t, {})('search.label'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ref: "searchBarRoot",
        ...{ class: "relative w-full" },
    });
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (...[$event]) => {
                void $event;
                return (run(__VLS_unwrap(trimmed, {})));
                // @ts-ignore
                [navLinks, isSigningOut, signOut, hasActivity, hasActivity, t, trimmed,];
            } },
        role: "search",
        ...{ class: "group relative w-full" },
    });
    /** @type {__VLS_StyleScopedClasses['group']} */ ;
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    let __VLS_7;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        // @ts-ignore
        icon: "lucide:search", ...{ class: "pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-flixer-muted transition-colors group-focus-within:text-white" }, 'aria-hidden': "true",
    }));
    const __VLS_9 = __VLS_8({
        icon: "lucide:search",
        ...{ class: "pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-flixer-muted transition-colors group-focus-within:text-white" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    /** @type {__VLS_StyleScopedClasses['pointer-events-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['left-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['top-1/2']} */ ;
    /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['-translate-y-1/2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
    /** @type {__VLS_StyleScopedClasses['group-focus-within:text-white']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ref: "input",
        type: "search",
        maxlength: "100",
        autocomplete: "off",
        placeholder: (__VLS_unwrap(t, {})('search.placeholder')),
        'aria-label': (__VLS_unwrap(t, {})('search.label')),
        ...{ class: "w-full rounded border border-white/10 bg-white/[0.06] py-4 pl-14 pr-24 text-lg text-white shadow-lg shadow-black/30 backdrop-blur transition duration-300 placeholder:text-flixer-muted focus:border-white/40 focus:bg-white/10 focus:shadow-2xl focus:shadow-black/50 focus:outline-none sm:pr-14" },
    });
    (__VLS_unwrap(query, {}));
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white/[0.06]']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['pl-14']} */ ;
    /** @type {__VLS_StyleScopedClasses['pr-24']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-black/30']} */ ;
    /** @type {__VLS_StyleScopedClasses['backdrop-blur']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['placeholder:text-flixer-muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:border-white/40']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:bg-white/10']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:shadow-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:shadow-black/50']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:pr-14']} */ ;
    if (isLoading.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "absolute right-16 top-1/2 size-5 -translate-y-1/2 animate-spin rounded-full border-2 border-white/20 border-t-white sm:right-5" },
            role: "status",
            'aria-label': (__VLS_unwrap(t, {})('search.searching')),
        });
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['right-16']} */ ;
        /** @type {__VLS_StyleScopedClasses['top-1/2']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['-translate-y-1/2']} */ ;
        /** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-white/20']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-t-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:right-5']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                void $event;
                return (mobileFiltersOpen.value = !mobileFiltersOpen.value);
                // @ts-ignore
                [t, t, t, query, isLoading, mobileFiltersOpen, mobileFiltersOpen,];
            } },
        type: "button",
        ...{ class: "absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded text-flixer-muted transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent sm:hidden" },
        'aria-label': (__VLS_unwrap(t, {})('search.filters')),
        'aria-expanded': (mobileFiltersOpen.value),
        'aria-controls': "mobile-search-filters",
    });
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['right-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['top-1/2']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['size-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['-translate-y-1/2']} */ ;
    /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:hidden']} */ ;
    let __VLS_12;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
        // @ts-ignore
        icon: "lucide:sliders-horizontal", ...{ class: "size-5" }, 'aria-hidden': "true",
    }));
    const __VLS_14 = __VLS_13({
        icon: "lucide:sliders-horizontal",
        ...{ class: "size-5" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
    if (type.value || activeCount.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "absolute right-1.5 top-1.5 size-2 rounded-full bg-flixer-accent" },
        });
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['right-1.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['top-1.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-accent']} */ ;
    }
    if (mobileFiltersOpen.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            id: "mobile-search-filters",
            ...{ class: "absolute inset-x-0 top-full z-30 mt-2 rounded border border-white/10 bg-flixer-surface/95 p-3 text-left shadow-2xl shadow-black/60 backdrop-blur-xl sm:hidden" },
        });
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['inset-x-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['top-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['z-30']} */ ;
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/95']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-2xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-black/60']} */ ;
        /** @type {__VLS_StyleScopedClasses['backdrop-blur-xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:hidden']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid grid-cols-2 gap-2" },
            role: "group",
            'aria-label': (__VLS_unwrap(t, {})('search.type')),
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        const __VLS_17 = __VLS_tryAsConstant((__VLS_unwrap(TYPES, {})));
        for (const [entry] of __VLS_vFor(__VLS_nonNull(__VLS_17))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!(mobileFiltersOpen.value))
                            throw 0;
                        return (selectType(entry));
                        // @ts-ignore
                        [t, t, mobileFiltersOpen, mobileFiltersOpen, type, activeCount, TYPES,];
                    } },
                key: (entry),
                type: "button",
                'aria-pressed': (type.value === entry),
                ...{ class: "rounded border px-3 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
                ...{ class: (type.value === entry ? 'border-white bg-white text-flixer-background' : 'border-white/15 bg-white/5 text-white/80 hover:border-white/30 hover:bg-white/10') },
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
            (entry ? __VLS_unwrap(t, {})(`home.itemType.${entry}`) : __VLS_unwrap(t, {})('search.anyType'));
            // @ts-ignore
            [t, t, type, type,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (toggleMobileAdvancedFilters) },
            type: "button",
            ...{ class: "mt-3 flex w-full items-center justify-between rounded border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white/80 transition hover:border-white/30 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
            'aria-expanded': (showFilters.value),
        });
        /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-white/15']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/5']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white/80']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:border-white/30']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_unwrap(t, {})('search.filters'));
        if (activeCount.value > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "grid min-w-5 place-items-center rounded bg-white px-1 text-xs font-bold text-flixer-background" },
            });
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['min-w-5']} */ ;
            /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-background']} */ ;
            (activeCount.value);
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-4 hidden w-full flex-wrap items-center justify-center gap-2 sm:flex" },
        role: "group",
        'aria-label': (__VLS_unwrap(t, {})('search.type')),
    });
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:flex']} */ ;
    const __VLS_18 = __VLS_tryAsConstant((__VLS_unwrap(TYPES, {})));
    for (const [entry] of __VLS_vFor(__VLS_nonNull(__VLS_18))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    return (selectType(entry));
                    // @ts-ignore
                    [t, t, activeCount, activeCount, TYPES, showFilters,];
                } },
            key: (entry),
            type: "button",
            'aria-pressed': (type.value === entry),
            ...{ class: "rounded border px-3.5 py-1.5 text-sm font-medium transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
            ...{ class: (type.value === entry ? 'border-white bg-white text-flixer-background' : 'border-white/15 bg-white/5 text-white/80 hover:border-white/30 hover:bg-white/10') },
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['duration-200']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        (entry ? __VLS_unwrap(t, {})(`home.itemType.${entry}`) : __VLS_unwrap(t, {})('search.anyType'));
        // @ts-ignore
        [t, t, type, type,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                void $event;
                return (showFilters.value = !showFilters.value);
                // @ts-ignore
                [showFilters, showFilters,];
            } },
        type: "button",
        ...{ class: "ml-1 inline-flex items-center gap-1.5 rounded border border-white/15 bg-white/5 px-3.5 py-1.5 text-sm font-medium text-white/80 transition hover:border-white/30 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
        'aria-expanded': (showFilters.value),
    });
    /** @type {__VLS_StyleScopedClasses['ml-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-white/15']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white/5']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white/80']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:border-white/30']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    let __VLS_19;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({
        // @ts-ignore
        icon: "lucide:chevron-down", ...{ class: "size-4 transition-transform duration-300" }, ...{ class: (showFilters.value ? 'rotate-180' : '') }, 'aria-hidden': "true",
    }));
    const __VLS_21 = __VLS_20({
        icon: "lucide:chevron-down",
        ...{ class: "size-4 transition-transform duration-300" },
        ...{ class: (showFilters.value ? 'rotate-180' : '') },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_20));
    /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-transform']} */ ;
    /** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
    (__VLS_unwrap(t, {})('search.filters'));
    if (activeCount.value > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "grid min-w-5 place-items-center rounded bg-white px-1 text-xs font-bold text-flixer-background" },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['min-w-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-background']} */ ;
        (activeCount.value);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid w-full transition-[grid-template-rows,opacity] duration-300 ease-out" },
        ...{ class: (showFilters.value ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0') },
        inert: (!showFilters.value),
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-[grid-template-rows,opacity]']} */ ;
    /** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['ease-out']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "overflow-hidden" },
    });
    /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-4 grid gap-4 rounded border border-white/10 bg-white/[0.04] p-5 text-left backdrop-blur sm:grid-cols-2" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white/[0.04]']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['backdrop-blur']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "text-xs font-medium uppercase tracking-wide text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('search.genre'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_unwrap(genre, {})),
        ...{ class: "mt-1.5 w-full rounded border border-white/10 bg-flixer-background px-3 py-2.5 text-sm normal-case tracking-normal text-white transition focus:border-white/40 focus:outline-none" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['normal-case']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-normal']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:border-white/40']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    (__VLS_unwrap(t, {})('search.anyGenre'));
    const __VLS_24 = __VLS_tryAsConstant((__VLS_unwrap(genres, {})));
    for (const [entry] of __VLS_vFor(__VLS_nonNull(__VLS_24))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (entry),
            value: (entry),
        });
        (entry);
        // @ts-ignore
        [t, t, t, activeCount, activeCount, showFilters, showFilters, showFilters, showFilters, genre, genres,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "text-xs font-medium uppercase tracking-wide text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('search.sort'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (sort.value),
        ...{ class: "mt-1.5 w-full rounded border border-white/10 bg-flixer-background px-3 py-2.5 text-sm normal-case tracking-normal text-white transition focus:border-white/40 focus:outline-none" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['normal-case']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-normal']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:border-white/40']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
    const __VLS_25 = __VLS_tryAsConstant((__VLS_unwrap(SORTS, {})));
    for (const [entry] of __VLS_vFor(__VLS_nonNull(__VLS_25))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (entry),
            value: (entry),
        });
        (__VLS_unwrap(t, {})(`search.sorts.${entry}`));
        // @ts-ignore
        [t, t, sort, SORTS,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "text-xs font-medium uppercase tracking-wide text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('search.yearFrom'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "number",
        inputmode: "numeric",
        min: "1800",
        max: "2200",
        ...{ class: "mt-1.5 w-full rounded border border-white/10 bg-flixer-background px-3 py-2.5 text-sm normal-case tracking-normal text-white transition focus:border-white/40 focus:outline-none" },
    });
    (__VLS_unwrap(yearFrom, {}));
    /** @type {__VLS_StyleScopedClasses['mt-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['normal-case']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-normal']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:border-white/40']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "text-xs font-medium uppercase tracking-wide text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('search.yearTo'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "number",
        inputmode: "numeric",
        min: "1800",
        max: "2200",
        ...{ class: "mt-1.5 w-full rounded border border-white/10 bg-flixer-background px-3 py-2.5 text-sm normal-case tracking-normal text-white transition focus:border-white/40 focus:outline-none" },
    });
    (__VLS_unwrap(yearTo, {}));
    /** @type {__VLS_StyleScopedClasses['mt-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['normal-case']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-normal']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:border-white/40']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-wrap items-center justify-between gap-3 sm:col-span-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:col-span-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "flex cursor-pointer items-center gap-2.5 text-sm text-white" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "checkbox",
        ...{ class: "size-4 accent-flixer-accent" },
    });
    (__VLS_unwrap(unwatched, {}));
    /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['accent-flixer-accent']} */ ;
    (__VLS_unwrap(t, {})('search.unwatched'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "flex cursor-pointer items-center gap-2.5 text-sm text-white" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "checkbox",
        ...{ class: "size-4 accent-flixer-accent" },
    });
    (includeChildren.value);
    /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['accent-flixer-accent']} */ ;
    (__VLS_unwrap(t, {})('search.includeChildren'));
    if (hasFilters.value || includeChildren.value || sort.value !== 'relevance') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (clearFilters) },
            type: "button",
            ...{ class: "text-sm text-flixer-muted underline-offset-2 transition hover:text-white hover:underline" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        /** @type {__VLS_StyleScopedClasses['underline-offset-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:underline']} */ ;
        (__VLS_unwrap(t, {})('search.clear'));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mx-auto mt-10 max-w-[100rem]" },
        'aria-live': "polite",
    });
    /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-[100rem]']} */ ;
    if (tooShort.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-center text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('search.hint'));
    }
    else if (isLoading.value && results.value.length === 0 && externalResults.value.length === 0 && pluginItemCount.value === 0) {
        const __VLS_26 = CardGridSkeleton;
        // @ts-ignore
        const __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({
        // @ts-ignore
        }));
        const __VLS_28 = __VLS_27({}, ...__VLS_functionalComponentArgsRest(__VLS_27));
    }
    else if (failed.value && results.value.length === 0 && externalResults.value.length === 0 && pluginItemCount.value === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-center text-sm text-red-400" },
            role: "alert",
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-400']} */ ;
        (__VLS_unwrap(t, {})('search.error'));
    }
    if (!tooShort.value && !isLoading.value && results.value.length === 0 && externalResults.value.length === 0 && pluginItemCount.value === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-center text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('search.noResults', { query: __VLS_unwrap(trimmed, {}) }));
    }
    if (results.value.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: (isLoading.value ? 'opacity-60' : '') },
            ...{ class: "transition-opacity duration-200" },
        });
        /** @type {__VLS_StyleScopedClasses['transition-opacity']} */ ;
        /** @type {__VLS_StyleScopedClasses['duration-200']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
            ...{ class: "mb-5 text-lg font-semibold text-white" },
        });
        /** @type {__VLS_StyleScopedClasses['mb-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        (__VLS_unwrap(t, {})('search.results', { count: results.value.length, query: __VLS_unwrap(trimmed, {}) }));
        let __VLS_31;
        /** @ts-ignore @type { | typeof __VLS_components.TransitionGroup | typeof __VLS_components.TransitionGroup} */
        TransitionGroup;
        // @ts-ignore
        const __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31({
            // @ts-ignore
            tag: "ul", name: "result", ...{ class: "relative grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-x-4 gap-y-6 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]" },
        }));
        const __VLS_33 = __VLS_32({
            tag: "ul",
            name: "result",
            ...{ class: "relative grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-x-4 gap-y-6 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_32));
        /** @type {__VLS_StyleScopedClasses['relative']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid-cols-[repeat(auto-fill,minmax(9rem,1fr))]']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-x-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-y-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]']} */ ;
        var __VLS_34;
        const { default: __VLS_36 } = __VLS_nonNull(__VLS_34.slots);
        const __VLS_37 = __VLS_tryAsConstant((results.value));
        for (const [item, index] of __VLS_vFor(__VLS_nonNull(__VLS_37))) {
            const __VLS_38 = MediaCard;
            // @ts-ignore
            const __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38({
                // @ts-ignore
                key: (item.id), ...{ class: "!w-auto" }, ...{ style: ({ '--i': Math.min(index, 14) }) }, variant: (item.type === 'album' ? 'square' : 'poster'), title: (item.title), subtitle: (subtitleOf(item)), itemId: (item.id), imageIndex: (item.poster ?? item.backdrop), version: (item.updatedAt),
            }));
            const __VLS_40 = __VLS_39({
                key: (item.id),
                ...{ class: "!w-auto" },
                ...{ style: ({ '--i': Math.min(index, 14) }) },
                variant: (item.type === 'album' ? 'square' : 'poster'),
                title: (item.title),
                subtitle: (subtitleOf(item)),
                itemId: (item.id),
                imageIndex: (item.poster ?? item.backdrop),
                version: (item.updatedAt),
            }, ...__VLS_functionalComponentArgsRest(__VLS_39));
            /** @type {__VLS_StyleScopedClasses['!w-auto']} */ ;
            // @ts-ignore
            [t, t, t, t, t, t, t, t, t, trimmed, trimmed, isLoading, isLoading, isLoading, sort, yearFrom, yearTo, unwatched, includeChildren, includeChildren, hasFilters, tooShort, tooShort, results, results, results, results, results, results, externalResults, externalResults, externalResults, pluginItemCount, pluginItemCount, pluginItemCount, failed,];
        }
        // @ts-ignore
        [];
    }
    if (externalResults.value.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "mt-9 rounded border border-flixer-border bg-flixer-surface/35 p-4 sm:mt-12 sm:p-6" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-9']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/35']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:mt-12']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:p-6']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mb-5 flex flex-wrap items-end justify-between gap-3" },
        });
        /** @type {__VLS_StyleScopedClasses['mb-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-end']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs font-semibold uppercase tracking-[0.16em] text-flixer-accent" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['tracking-[0.16em]']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
        (__VLS_unwrap(t, {})('requests.discover'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
            ...{ class: "mt-1 text-lg font-semibold text-white sm:text-xl" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:text-xl']} */ ;
        (__VLS_unwrap(t, {})('requests.notInLibrary'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/[0.05]']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-2.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (externalResults.value.length);
        __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
            ...{ class: "grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-x-3 gap-y-5 sm:grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] sm:gap-x-4" },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))]']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-x-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-y-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:gap-x-4']} */ ;
        const __VLS_43 = __VLS_tryAsConstant((externalResults.value));
        for (const [item] of __VLS_vFor(__VLS_nonNull(__VLS_43))) {
            const __VLS_44 = MediaCard;
            // @ts-ignore
            const __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44({
                // @ts-ignore
                key: (`${item.source}:${item.type}:${item.id}`), ...{ class: "!w-auto" }, variant: (item.type === 'music' ? 'square' : 'poster'), title: (item.title), subtitle: (externalSubtitle(item)), posterUrl: (item.poster), requestStatus: (item.status), to: ({ name: 'request-item', params: { type: item.type, id: item.id } }),
            }));
            const __VLS_46 = __VLS_45({
                key: (`${item.source}:${item.type}:${item.id}`),
                ...{ class: "!w-auto" },
                variant: (item.type === 'music' ? 'square' : 'poster'),
                title: (item.title),
                subtitle: (externalSubtitle(item)),
                posterUrl: (item.poster),
                requestStatus: (item.status),
                to: ({ name: 'request-item', params: { type: item.type, id: item.id } }),
            }, ...__VLS_functionalComponentArgsRest(__VLS_45));
            /** @type {__VLS_StyleScopedClasses['!w-auto']} */ ;
            // @ts-ignore
            [t, t, externalResults, externalResults, externalResults,];
        }
    }
    const __VLS_49 = __VLS_tryAsConstant((__VLS_unwrap(pluginSections, {})));
    for (const [section] of __VLS_vFor(__VLS_nonNull(__VLS_49))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            key: (section.pluginId + section.title),
            ...{ class: "mt-9 rounded border border-flixer-border bg-flixer-surface/35 p-4 sm:mt-12 sm:p-6" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-9']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/35']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:mt-12']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:p-6']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mb-5 flex flex-wrap items-end justify-between gap-3" },
        });
        /** @type {__VLS_StyleScopedClasses['mb-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-end']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
            ...{ class: "text-lg font-semibold text-white sm:text-xl" },
        });
        /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:text-xl']} */ ;
        (section.title);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/[0.05]']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-2.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (section.items.length);
        __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
            ...{ class: "grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-x-3 gap-y-5 sm:grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] sm:gap-x-4" },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))]']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-x-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-y-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:gap-x-4']} */ ;
        const __VLS_50 = __VLS_tryAsConstant((section.items));
        for (const [item, index] of __VLS_vFor(__VLS_nonNull(__VLS_50))) {
            const __VLS_51 = MediaCard;
            // @ts-ignore
            const __VLS_52 = __VLS_asFunctionalComponent1(__VLS_51, new __VLS_51({
                // @ts-ignore
                key: (index), ...{ class: "!w-auto" }, variant: (item.shape), title: (item.title), subtitle: (item.subtitle), posterUrl: (item.poster), badge: (item.badge), to: (__VLS_unwrap(searchItemRoute, {})(section.pluginId, item)),
            }));
            const __VLS_53 = __VLS_52({
                key: (index),
                ...{ class: "!w-auto" },
                variant: (item.shape),
                title: (item.title),
                subtitle: (item.subtitle),
                posterUrl: (item.poster),
                badge: (item.badge),
                to: (__VLS_unwrap(searchItemRoute, {})(section.pluginId, item)),
            }, ...__VLS_functionalComponentArgsRest(__VLS_52));
            /** @type {__VLS_StyleScopedClasses['!w-auto']} */ ;
            // @ts-ignore
            [pluginSections, searchItemRoute,];
        }
        // @ts-ignore
        [];
    }
    const __VLS_56 = MobileTabBar;
    // @ts-ignore
    const __VLS_57 = __VLS_asFunctionalComponent1(__VLS_56, new __VLS_56({
        // @ts-ignore
        tabs: (__VLS_unwrap(mobileTabs, {})),
    }));
    const __VLS_58 = __VLS_57({
        tabs: (__VLS_unwrap(mobileTabs, {})),
    }, ...__VLS_functionalComponentArgsRest(__VLS_57));
    // @ts-ignore
    [mobileTabs,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
