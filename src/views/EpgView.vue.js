import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Header from '../components/header/Header.vue';
import MobileTabBar from '../components/home/MobileTabBar.vue';
import { getGuide, getGuideChannelPlaybackInfo, GUIDE_CHANNEL_PAGE_SIZE } from '../api/guide';
import { programmeProgress, programmesInWindow, visibleGuideTimeChunks } from '../api/epg';
import { getMobileTabs, getNavLinks } from '../composables/homeNav';
import { useInfiniteScroll } from '../composables/useInfiniteScroll';
import { useSignOut } from '../composables/useSignOut';
import { useVideoOverlay } from '../composables/useVideoOverlay';
import { catchError } from '../utils/catchError';
const HALF_HOUR = 30 * 60_000;
const GUIDE_DAY_COUNT = 7;
const WINDOW_LENGTH = GUIDE_DAY_COUNT * 24 * 60 * 60_000;
const GUIDE_TIME_CHUNK_MS = 6 * 60 * 60_000;
const SLOT_WIDTH = 144;
const FAVORITES_KEY = 'flixer.epg.favorites';
const PRIMARY_CHANNELS = ['bbc one london', 'bbc two', 'itv1', 'channel 4', 'channel 5', 'bbc three', 'itv2', 'e4', 'sky news', 'bbc news'];
const { t, locale } = useI18n();
const { isSigningOut, signOut } = useSignOut();
const videoOverlay = useVideoOverlay();
const navLinks = computed(getNavLinks);
const mobileTabs = computed(getMobileTabs);
const data = ref(null);
const loading = ref(true);
const loadingMore = ref(false);
const loadingTime = ref(false);
const loadError = ref('');
const loadMoreError = ref('');
const timeLoadError = ref('');
const query = ref('');
const category = ref('');
const favoritesOnly = ref(false);
const favorites = ref(readStoredSet(FAVORITES_KEY));
const selectedProgramme = ref(null);
const actionMessage = ref('');
const playbackError = ref('');
const now = ref(Date.now());
const guideStart = ref(roundToGuideStart(new Date()));
const imageFailures = ref(new Set());
const openingChannelId = ref('');
const guideScroller = ref(null);
let controller;
let clockTimer;
let guideGeneration = 0;
let scrollFrame;
const loadedSlices = new Set();
const loadedTimeChunks = new Set();
const loadedChannelOffsets = new Set();
const inFlightSlices = new Map();
function readStoredSet(key) {
    try {
        const stored = JSON.parse(localStorage.getItem(key) ?? '[]');
        return Array.isArray(stored) ? new Set(stored.filter((value) => typeof value === 'string')) : new Set();
    }
    catch (error) {
        console.error(`[guide] couldn't read ${key}`, error);
        return new Set();
    }
}
function roundToGuideStart(date) {
    const result = new Date(date);
    result.setSeconds(0, 0);
    result.setMinutes(Math.floor(result.getMinutes() / 30) * 30 - 30);
    return result;
}
function localDayKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function formatTime(timestamp, options = { hour: 'numeric', minute: '2-digit' }) {
    return new Intl.DateTimeFormat(locale.value, options).format(timestamp);
}
function isDayStart(timestamp) {
    const date = new Date(timestamp);
    return date.getHours() === 0 && date.getMinutes() === 0;
}
function formatDay(timestamp) {
    return formatTime(timestamp, { weekday: 'short', month: 'short', day: 'numeric' });
}
function channelOrder(name) {
    const normalized = name.toLowerCase();
    const index = PRIMARY_CHANNELS.findIndex((entry) => normalized === entry || normalized.startsWith(`${entry} `));
    return index < 0 ? PRIMARY_CHANNELS.length : index;
}
const channels = computed(() => {
    if (!data.value)
        return [];
    return [...data.value.channels].sort((a, b) => a.sortOrder - b.sortOrder || channelOrder(a.name) - channelOrder(b.name) || a.name.localeCompare(b.name, locale.value));
});
const programmesByChannel = computed(() => {
    const index = new Map();
    for (const programme of data.value?.programmes ?? []) {
        const entries = index.get(programme.channelId) ?? [];
        entries.push(programme);
        index.set(programme.channelId, entries);
    }
    return index;
});
const windowEnd = computed(() => guideStart.value.getTime() + WINDOW_LENGTH);
const windowProgrammes = computed(() => programmesInWindow(data.value?.programmes ?? [], guideStart.value.getTime(), windowEnd.value));
const categories = computed(() => {
    const counts = new Map();
    for (const programme of windowProgrammes.value) {
        if (programme.category)
            counts.set(programme.category, (counts.get(programme.category) ?? 0) + 1);
    }
    return [...counts]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], locale.value))
        .slice(0, 16)
        .map(([name]) => name);
});
const filteredChannels = computed(() => {
    const needle = query.value.trim().toLocaleLowerCase(locale.value);
    return channels.value.filter((channel) => {
        if (favoritesOnly.value && !favorites.value.has(channel.id))
            return false;
        const listings = programmesInWindow(programmesByChannel.value.get(channel.id) ?? [], guideStart.value.getTime(), windowEnd.value);
        if (category.value && !listings.some((programme) => programme.category === category.value))
            return false;
        if (needle && !`${channel.name} ${channel.alternateNames.join(' ')}`.toLocaleLowerCase(locale.value).includes(needle) && !listings.some((programme) => `${programme.title} ${programme.subtitle ?? ''}`.toLocaleLowerCase(locale.value).includes(needle))) {
            return false;
        }
        return true;
    });
});
const visibleChannels = computed(() => filteredChannels.value);
const guideDays = computed(() => {
    const today = new Date(now.value);
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: GUIDE_DAY_COUNT }, (_, index) => {
        const date = new Date(today);
        date.setDate(date.getDate() + index);
        return date;
    });
});
const isToday = computed(() => localDayKey(guideStart.value) === localDayKey(new Date(now.value)));
const timeSlots = computed(() => Array.from({ length: WINDOW_LENGTH / HALF_HOUR }, (_, index) => guideStart.value.getTime() + index * HALF_HOUR));
const nowPosition = computed(() => {
    if (!isToday.value || now.value < guideStart.value.getTime() || now.value > windowEnd.value)
        return undefined;
    return ((now.value - guideStart.value.getTime()) / WINDOW_LENGTH) * 100;
});
const featuredProgramme = computed(() => {
    const active = data.value?.programmes.filter((programme) => programme.start <= now.value && programme.stop > now.value) ?? [];
    return active.sort((a, b) => channelOrder(data.value?.channels.find((channel) => channel.id === a.channelId)?.name ?? '') - channelOrder(data.value?.channels.find((channel) => channel.id === b.channelId)?.name ?? ''))[0];
});
const featuredChannel = computed(() => data.value?.channels.find((channel) => channel.id === featuredProgramme.value?.channelId));
const showingChannels = computed(() => filteredChannels.value.length);
const canLoadMoreChannels = computed(() => Boolean(data.value && data.value.channels.length < data.value.totalChannels && !loading.value && !loadingMore.value && !loadError.value && !loadMoreError.value));
const { setSentinel, recheck } = useInfiniteScroll(() => void loadNextPage(), canLoadMoreChannels);
const channelPageOffsets = computed(() => (data.value ? Array.from({ length: Math.ceil(data.value.channels.length / GUIDE_CHANNEL_PAGE_SIZE) }, (_, index) => index * GUIDE_CHANNEL_PAGE_SIZE) : []));
function programmesFor(channel) {
    return programmesInWindow(programmesByChannel.value.get(channel.id) ?? [], guideStart.value.getTime(), windowEnd.value);
}
function programmeStyle(programme) {
    const left = Math.max(programme.start, guideStart.value.getTime());
    const right = Math.min(programme.stop, windowEnd.value);
    return {
        left: `${((left - guideStart.value.getTime()) / WINDOW_LENGTH) * 100}%`,
        width: `${((right - left) / WINDOW_LENGTH) * 100}%`,
    };
}
function isOnNow(programme) {
    return programme.start <= now.value && programme.stop > now.value;
}
function programmeHoverStyle(programme) {
    const visibleStart = Math.max(programme.start, guideStart.value.getTime());
    const visibleStop = Math.min(programme.stop, windowEnd.value);
    const visibleDuration = visibleStop - visibleStart;
    const elapsed = Math.max(0, Math.min(now.value - visibleStart, visibleDuration));
    const progress = isOnNow(programme) && visibleDuration > 0 ? (elapsed / visibleDuration) * 100 : 100;
    return { '--hover-progress': `${progress}%` };
}
function dayName(date, index) {
    if (index === 0)
        return t('epg.today');
    if (index === 1)
        return t('epg.tomorrow');
    return new Intl.DateTimeFormat(locale.value, { weekday: 'short' }).format(date);
}
function selectDay(date) {
    const next = new Date(date);
    next.setHours(guideStart.value.getHours(), guideStart.value.getMinutes(), 0, 0);
    guideStart.value = next;
}
function shiftWindow(minutes) {
    guideStart.value = new Date(guideStart.value.getTime() + minutes * 60_000);
}
function jumpToNow() {
    now.value = Date.now();
    guideStart.value = roundToGuideStart(new Date(now.value));
}
function toggleFavorite(channel) {
    const next = new Set(favorites.value);
    if (next.has(channel.id))
        next.delete(channel.id);
    else
        next.add(channel.id);
    favorites.value = next;
    actionMessage.value = t(next.has(channel.id) ? 'epg.favoriteAdded' : 'epg.favoriteRemoved', { channel: channel.name });
    try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify([...next]));
    }
    catch (error) {
        console.error('[guide] couldn’t save favourite channels', error);
        actionMessage.value = t('epg.preferenceSaveError');
    }
}
function programmeKey(programme) {
    return `${programme.channelId}:${programme.start}`;
}
function markImageFailed(channelId) {
    imageFailures.value = new Set(imageFailures.value).add(channelId);
}
async function watchChannel(channel) {
    if (!channel.watchable || openingChannelId.value)
        return;
    playbackError.value = '';
    openingChannelId.value = channel.id;
    const [error, playback] = await catchError(getGuideChannelPlaybackInfo(channel.id));
    if (error) {
        console.error('[guide] failed to start live playback', error);
        playbackError.value = t('epg.playbackError');
        openingChannelId.value = '';
        return;
    }
    videoOverlay.play({ id: channel.id, title: channel.name, livePlayback: playback });
    openingChannelId.value = '';
}
async function load() {
    controller?.abort();
    controller = new AbortController();
    const activeController = controller;
    const generation = ++guideGeneration;
    loading.value = true;
    loadingMore.value = false;
    loadingTime.value = false;
    loadError.value = '';
    loadMoreError.value = '';
    timeLoadError.value = '';
    loadedSlices.clear();
    loadedTimeChunks.clear();
    loadedChannelOffsets.clear();
    data.value = null;
    try {
        const page = await requestGuideSlice(0, 0, activeController, generation);
        if (activeController.signal.aborted || controller !== activeController)
            return;
        data.value = page;
        loadedSlices.add('0:0');
        loadedTimeChunks.add(0);
        loadedChannelOffsets.add(0);
    }
    catch (error) {
        if (activeController.signal.aborted)
            return;
        console.error('[guide] failed to load programme guide', error);
        loadError.value = t('epg.loadError');
    }
    finally {
        if (!activeController.signal.aborted) {
            loading.value = false;
            void nextTick(loadVisibleTimeChunks);
        }
    }
}
function requestGuideSlice(chunkIndex, offset, activeController, generation) {
    const sliceKey = `${chunkIndex}:${offset}`;
    const requestKey = `${generation}:${sliceKey}`;
    const existing = inFlightSlices.get(requestKey);
    if (existing)
        return existing;
    const from = guideStart.value.getTime() + chunkIndex * GUIDE_TIME_CHUNK_MS;
    const to = Math.min(from + GUIDE_TIME_CHUNK_MS, windowEnd.value);
    const request = getGuide(new Date(from), new Date(to), offset, activeController.signal).finally(() => {
        if (inFlightSlices.get(requestKey) === request)
            inFlightSlices.delete(requestKey);
        if (generation === guideGeneration) {
            loadingTime.value = [...inFlightSlices.keys()].some((key) => key.startsWith(`${generation}:`));
        }
    });
    inFlightSlices.set(requestKey, request);
    if (generation === guideGeneration)
        loadingTime.value = true;
    return request;
}
async function loadSlices(slices, activeController, generation) {
    const pending = slices.filter(({ chunkIndex, offset }) => !loadedSlices.has(`${chunkIndex}:${offset}`));
    if (pending.length === 0)
        return;
    const pages = await Promise.all(pending.map(async ({ chunkIndex, offset }) => ({
        chunkIndex,
        offset,
        page: await requestGuideSlice(chunkIndex, offset, activeController, generation),
    })));
    if (activeController.signal.aborted || controller !== activeController || generation !== guideGeneration)
        return;
    const current = data.value;
    if (!current) {
        const initial = pages.find(({ chunkIndex, offset }) => chunkIndex === 0 && offset === 0);
        if (!initial)
            return;
        data.value = initial.page;
        loadedChannelOffsets.add(0);
        loadedTimeChunks.add(0);
        loadedSlices.add('0:0');
        return;
    }
    const channels = [...current.channels];
    const programmes = new Map(current.programmes.map((programme) => [programmeKey(programme), programme]));
    for (const { chunkIndex, offset, page } of pages) {
        const key = `${chunkIndex}:${offset}`;
        if (loadedSlices.has(key))
            continue;
        if (!loadedChannelOffsets.has(offset)) {
            channels.push(...page.channels);
            loadedChannelOffsets.add(offset);
        }
        for (const programme of page.programmes)
            programmes.set(programmeKey(programme), programme);
        loadedSlices.add(key);
        if (offset === 0)
            loadedTimeChunks.add(chunkIndex);
    }
    data.value = { ...current, channels, programmes: [...programmes.values()] };
    recheck();
}
async function loadVisibleTimeChunks() {
    const element = guideScroller.value;
    const activeController = controller;
    if (!element || !activeController || !data.value || loading.value)
        return;
    const generation = guideGeneration;
    const timelineWidth = timeSlots.value.length * SLOT_WIDTH;
    const chunks = visibleGuideTimeChunks(element.scrollLeft, element.clientWidth, timelineWidth, WINDOW_LENGTH, GUIDE_TIME_CHUNK_MS);
    const slices = chunks.flatMap((chunkIndex) => channelPageOffsets.value.map((offset) => ({ chunkIndex, offset })));
    if (!slices.some(({ chunkIndex, offset }) => !loadedSlices.has(`${chunkIndex}:${offset}`)))
        return;
    timeLoadError.value = '';
    try {
        await loadSlices(slices, activeController, generation);
    }
    catch (error) {
        if (activeController.signal.aborted)
            return;
        console.error('[guide] failed to load programmes for the visible time range', error);
        timeLoadError.value = t('epg.loadError');
    }
}
function onGuideScroll() {
    if (scrollFrame !== undefined)
        return;
    scrollFrame = requestAnimationFrame(() => {
        scrollFrame = undefined;
        void loadVisibleTimeChunks();
    });
}
async function loadNextPage() {
    if (!data.value || !controller || loadingMore.value || data.value.channels.length >= data.value.totalChannels)
        return;
    const activeController = controller;
    const generation = guideGeneration;
    const offset = data.value.channels.length;
    loadingMore.value = true;
    loadMoreError.value = '';
    try {
        const slices = [...loadedTimeChunks].sort((a, b) => a - b).map((chunkIndex) => ({ chunkIndex, offset }));
        await loadSlices(slices, activeController, generation);
        if (!activeController.signal.aborted)
            void loadVisibleTimeChunks();
    }
    catch (error) {
        if (activeController.signal.aborted)
            return;
        console.error('[guide] failed to load the next channel page', error);
        loadMoreError.value = t('epg.loadError');
    }
    finally {
        if (!activeController.signal.aborted)
            loadingMore.value = false;
        recheck();
    }
}
function retryVisibleTimeChunks() {
    timeLoadError.value = '';
    void loadVisibleTimeChunks();
}
async function scanFilteredChannels() {
    while ((query.value.trim() || category.value || favoritesOnly.value) && canLoadMoreChannels.value) {
        await loadNextPage();
    }
}
watch(guideStart, () => {
    selectedProgramme.value = null;
    void load();
});
watch([query, category, favoritesOnly], () => {
    recheck();
    void scanFilteredChannels();
});
watch([data, loadingMore], () => {
    recheck();
    if (query.value.trim() || category.value || favoritesOnly.value)
        void scanFilteredChannels();
}, { flush: 'post' });
onMounted(() => {
    void load();
    clockTimer = setInterval(() => {
        now.value = Date.now();
    }, 30_000);
});
onBeforeUnmount(() => {
    controller?.abort();
    if (scrollFrame !== undefined)
        cancelAnimationFrame(scrollFrame);
    if (clockTimer)
        clearInterval(clockTimer);
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(playbackError, {});
    __VLS_withDotValue(data, {});
    __VLS_withDotValue(featuredProgramme, {});
    __VLS_withDotValue(featuredChannel, {});
    __VLS_withDotValue(loading, {});
    __VLS_withDotValue(guideStart, {});
    __VLS_withDotValue(locale, {});
    __VLS_withDotValue(favoritesOnly, {});
    __VLS_withDotValue(showingChannels, {});
    __VLS_withDotValue(loadError, {});
    __VLS_withDotValue(filteredChannels, {});
    __VLS_withDotValue(timeSlots, {});
    __VLS_withDotValue(nowPosition, {});
    __VLS_withDotValue(imageFailures, {});
    __VLS_withDotValue(favorites, {});
    __VLS_withDotValue(selectedProgramme, {});
    __VLS_withDotValue(openingChannelId, {});
    __VLS_withDotValue(loadingTime, {});
    __VLS_withDotValue(timeLoadError, {});
    __VLS_withDotValue(canLoadMoreChannels, {});
    __VLS_withDotValue(loadingMore, {});
    __VLS_withDotValue(loadMoreError, {});
    void {};
    /** @type {__VLS_StyleScopedClasses['guide-channel-heading']} */ ;
    /** @type {__VLS_StyleScopedClasses['guide-channel']} */ ;
    /** @type {__VLS_StyleScopedClasses['guide-time-track']} */ ;
    /** @type {__VLS_StyleScopedClasses['guide-channel-heading']} */ ;
    /** @type {__VLS_StyleScopedClasses['guide-time-track']} */ ;
    /** @type {__VLS_StyleScopedClasses['guide-channel']} */ ;
    /** @type {__VLS_StyleScopedClasses['guide-track']} */ ;
    /** @type {__VLS_StyleScopedClasses['programme-hover-indicator']} */ ;
    /** @type {__VLS_StyleScopedClasses['group']} */ ;
    /** @type {__VLS_StyleScopedClasses['programme-hover-indicator']} */ ;
    /** @type {__VLS_StyleScopedClasses['guide-layout']} */ ;
    /** @type {__VLS_StyleScopedClasses['guide-channel']} */ ;
    /** @type {__VLS_StyleScopedClasses['guide-details-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['programme-hover-indicator']} */ ;
    /** @type {__VLS_StyleScopedClasses['guide-details-enter-active']} */ ;
    /** @type {__VLS_StyleScopedClasses['guide-details-leave-active']} */ ;
    /** @type {__VLS_StyleScopedClasses['guide-details-fade-enter-active']} */ ;
    /** @type {__VLS_StyleScopedClasses['guide-details-fade-leave-active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "min-h-screen overflow-x-clip bg-flixer-background pb-24 font-sans text-flixer-text md:pb-12" },
    });
    /** @type {__VLS_StyleScopedClasses['min-h-screen']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-x-clip']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
    /** @type {__VLS_StyleScopedClasses['pb-24']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-sans']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:pb-12']} */ ;
    const __VLS_0 = Header;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        ...{ 'onLogout': {} }, links: (__VLS_unwrap(navLinks, {})), isSigningOut: (__VLS_unwrap(isSigningOut, {})), disableScrollCollapse: (true),
    }));
    const __VLS_2 = __VLS_1({
        ...{ 'onLogout': {} },
        links: (__VLS_unwrap(navLinks, {})),
        isSigningOut: (__VLS_unwrap(isSigningOut, {})),
        disableScrollCollapse: (true),
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
        ...{ class: "page-gutter pt-20 sm:pt-24" },
    });
    /** @type {__VLS_StyleScopedClasses['page-gutter']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-20']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:pt-24']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "sr-only" },
        role: "status",
        'aria-live': "polite",
    });
    /** @type {__VLS_StyleScopedClasses['sr-only']} */ ;
    (__VLS_unwrap(actionMessage, {}));
    if (playbackError.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            role: "alert",
            ...{ class: "mb-4 rounded border border-red-400/20 bg-red-500/5 p-3 text-sm text-red-200" },
        });
        /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-red-400/20']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-red-500/5']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-200']} */ ;
        (playbackError.value);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "mb-5 flex flex-wrap items-center justify-between gap-4" },
    });
    /** @type {__VLS_StyleScopedClasses['mb-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "min-w-0" },
    });
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-[10px] font-semibold tracking-[0.18em] text-flixer-accent" },
    });
    /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-[0.18em]']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
    (__VLS_unwrap(t, {})('epg.eyebrow'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
        ...{ class: "mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-tight']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:text-3xl']} */ ;
    (__VLS_unwrap(t, {})('epg.title'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-1 text-xs text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('epg.feed'));
    if (data.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        if (data.value.sources.length) {
            (data.value.sources.map((source) => source.name).join(', '));
        }
        (__VLS_unwrap(t, {})('epg.channels', { count: data.value.channels.length }));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex min-w-0 flex-1 items-center gap-3 rounded border border-white/10 bg-flixer-surface/60 px-3 py-2 sm:max-w-lg" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/60']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:max-w-lg']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-flixer-accent/10 px-2 py-1 text-[10px] font-bold tracking-wider text-flixer-accent" },
    });
    /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-accent/10']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "size-1.5 rounded-full bg-flixer-accent" },
    });
    /** @type {__VLS_StyleScopedClasses['size-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-accent']} */ ;
    (__VLS_unwrap(t, {})('epg.onNow'));
    if (featuredProgramme.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "min-w-0 flex-1" },
        });
        /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "truncate text-sm font-semibold text-white" },
        });
        /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        (featuredProgramme.value.title);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "truncate text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (featuredChannel.value?.name);
        (formatTime(featuredProgramme.value.start));
        (formatTime(featuredProgramme.value.stop));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-1.5 h-0.5 overflow-hidden rounded-full bg-white/10" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-0.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "h-full rounded-full bg-flixer-accent transition-[width]" },
            ...{ style: ({ width: `${__VLS_unwrap(programmeProgress, {})(featuredProgramme.value, __VLS_unwrap(now, {}))}%` }) },
        });
        /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-accent']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-[width]']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "min-w-0 flex-1 truncate text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (loading.value ? __VLS_unwrap(t, {})('epg.loading') : __VLS_unwrap(t, {})('epg.noLiveProgramme'));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (jumpToNow) },
        type: "button",
        ...{ class: "grid size-9 shrink-0 place-items-center rounded bg-white/5 text-flixer-muted transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
        'aria-label': (__VLS_unwrap(t, {})('epg.now')),
        title: (__VLS_unwrap(t, {})('epg.now')),
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['size-9']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white/5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    let __VLS_7;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        // @ts-ignore
        icon: "lucide:radio", ...{ class: "size-4 text-flixer-accent" }, 'aria-hidden': "true",
    }));
    const __VLS_9 = __VLS_8({
        icon: "lucide:radio",
        ...{ class: "size-4 text-flixer-accent" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        'aria-label': (__VLS_unwrap(t, {})('epg.title')),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-col gap-5" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-5']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-col justify-between gap-5 xl:flex-row xl:items-end" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['xl:flex-row']} */ ;
    /** @type {__VLS_StyleScopedClasses['xl:items-end']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs font-semibold tracking-[0.18em] text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-[0.18em]']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('epg.scheduleEyebrow'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-3 flex flex-wrap gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    const __VLS_12 = __VLS_tryAsConstant((__VLS_unwrap(guideDays, {})));
    for (const [day, index] of __VLS_vFor(__VLS_nonNull(__VLS_12))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    return (selectDay(day));
                    // @ts-ignore
                    [navLinks, isSigningOut, signOut, actionMessage, playbackError, playbackError, t, t, t, t, t, t, t, t, t, t, t, data, data, data, data, featuredProgramme, featuredProgramme, featuredProgramme, featuredProgramme, featuredProgramme, featuredChannel, programmeProgress, now, loading, guideDays,];
                } },
            key: (localDayKey(day)),
            type: "button",
            ...{ class: "min-w-[5.5rem] rounded border px-3 py-2 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
            ...{ class: (localDayKey(day) === localDayKey(guideStart.value) ? 'border-flixer-accent/70 bg-flixer-accent/15 text-white' : 'border-white/10 bg-white/[0.03] text-flixer-muted hover:border-white/20 hover:text-white') },
            'aria-pressed': (localDayKey(day) === localDayKey(guideStart.value)),
        });
        /** @type {__VLS_StyleScopedClasses['min-w-[5.5rem]']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "block text-xs font-semibold" },
        });
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        (dayName(day, index));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "mt-1 block text-xs opacity-70" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['opacity-70']} */ ;
        (new Intl.DateTimeFormat(locale.value, { month: 'short', day: 'numeric' }).format(day));
        // @ts-ignore
        [guideStart, guideStart, locale,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-col gap-3 sm:flex-row sm:items-center" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:flex-row']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:items-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "relative min-w-0 flex-1 sm:min-w-64" },
    });
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:min-w-64']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "sr-only" },
    });
    /** @type {__VLS_StyleScopedClasses['sr-only']} */ ;
    (__VLS_unwrap(t, {})('epg.searchLabel'));
    let __VLS_13;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
        // @ts-ignore
        icon: "lucide:search", ...{ class: "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-flixer-muted" }, 'aria-hidden': "true",
    }));
    const __VLS_15 = __VLS_14({
        icon: "lucide:search",
        ...{ class: "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-flixer-muted" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_14));
    /** @type {__VLS_StyleScopedClasses['pointer-events-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['left-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['top-1/2']} */ ;
    /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['-translate-y-1/2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "search",
        placeholder: (__VLS_unwrap(t, {})('epg.search')),
        ...{ class: "h-11 w-full rounded border border-white/10 bg-flixer-surface pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-flixer-muted focus:border-flixer-accent/70 focus:ring-2 focus:ring-flixer-accent/20" },
    });
    (__VLS_unwrap(query, {}));
    /** @type {__VLS_StyleScopedClasses['h-11']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
    /** @type {__VLS_StyleScopedClasses['pl-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['pr-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['outline-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['placeholder:text-flixer-muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:border-flixer-accent/70']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-flixer-accent/20']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "sr-only" },
        for: "epg-category",
    });
    /** @type {__VLS_StyleScopedClasses['sr-only']} */ ;
    (__VLS_unwrap(t, {})('epg.categoryLabel'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        id: "epg-category",
        value: (__VLS_unwrap(category, {})),
        ...{ class: "h-11 rounded border border-white/10 bg-flixer-surface px-3 text-sm text-white outline-none focus:border-flixer-accent/70 focus:ring-2 focus:ring-flixer-accent/20" },
    });
    /** @type {__VLS_StyleScopedClasses['h-11']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['outline-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:border-flixer-accent/70']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-flixer-accent/20']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    (__VLS_unwrap(t, {})('epg.allCategories'));
    const __VLS_18 = __VLS_tryAsConstant((__VLS_unwrap(categories, {})));
    for (const [option] of __VLS_vFor(__VLS_nonNull(__VLS_18))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (option),
            value: (option),
        });
        (option);
        // @ts-ignore
        [t, t, t, t, query, category, categories,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                void $event;
                return (favoritesOnly.value = !favoritesOnly.value);
                // @ts-ignore
                [favoritesOnly, favoritesOnly,];
            } },
        type: "button",
        ...{ class: "inline-flex h-11 items-center justify-center gap-2 rounded border px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
        ...{ class: (favoritesOnly.value ? 'border-flixer-accent/60 bg-flixer-accent/15 text-white' : 'border-white/10 bg-white/[0.03] text-flixer-muted hover:text-white') },
        'aria-pressed': (favoritesOnly.value),
    });
    /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-11']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    let __VLS_19;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({
        // @ts-ignore
        icon: "lucide:star", ...{ class: "size-4" }, ...{ class: (favoritesOnly.value ? 'fill-flixer-accent text-flixer-accent' : '') }, 'aria-hidden': "true",
    }));
    const __VLS_21 = __VLS_20({
        icon: "lucide:star",
        ...{ class: "size-4" },
        ...{ class: (favoritesOnly.value ? 'fill-flixer-accent text-flixer-accent' : '') },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_20));
    /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
    (__VLS_unwrap(t, {})('epg.favorites'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-wrap items-center justify-between gap-3 rounded border border-white/10 bg-flixer-surface/50 px-3 py-2.5" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/50']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-center gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                void $event;
                return (shiftWindow(-30));
                // @ts-ignore
                [t, favoritesOnly, favoritesOnly, favoritesOnly,];
            } },
        type: "button",
        ...{ class: "grid size-9 place-items-center rounded text-flixer-muted transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
        'aria-label': (__VLS_unwrap(t, {})('epg.previous')),
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['size-9']} */ ;
    /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    let __VLS_24;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
        // @ts-ignore
        icon: "lucide:chevron-left", ...{ class: "size-5" }, 'aria-hidden': "true",
    }));
    const __VLS_26 = __VLS_25({
        icon: "lucide:chevron-left",
        ...{ class: "size-5" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
    /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "min-w-36 text-center text-sm font-semibold text-white" },
    });
    /** @type {__VLS_StyleScopedClasses['min-w-36']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    (formatTime(guideStart.value.getTime(), { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }));
    (formatTime(__VLS_unwrap(windowEnd, {}), { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                void $event;
                return (shiftWindow(30));
                // @ts-ignore
                [t, guideStart, windowEnd,];
            } },
        type: "button",
        ...{ class: "grid size-9 place-items-center rounded text-flixer-muted transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
        'aria-label': (__VLS_unwrap(t, {})('epg.next')),
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['size-9']} */ ;
    /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    let __VLS_29;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_30 = __VLS_asFunctionalComponent1(__VLS_29, new __VLS_29({
        // @ts-ignore
        icon: "lucide:chevron-right", ...{ class: "size-5" }, 'aria-hidden': "true",
    }));
    const __VLS_31 = __VLS_30({
        icon: "lucide:chevron-right",
        ...{ class: "size-5" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_30));
    /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "hidden text-xs text-flixer-muted sm:inline" },
    });
    /** @type {__VLS_StyleScopedClasses['hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:inline']} */ ;
    (__VLS_unwrap(t, {})('epg.timeZone'));
    if (data.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('epg.showingChannels', { shown: showingChannels.value.toLocaleString(locale.value), total: data.value.totalChannels.toLocaleString(locale.value) }));
    }
    if (loading.value && !data.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-4 grid min-h-64 place-items-center rounded border border-white/10 bg-flixer-surface/40 p-8 text-center" },
            role: "status",
            'aria-busy': "true",
        });
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['min-h-64']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/40']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-8']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        let __VLS_34;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_35 = __VLS_asFunctionalComponent1(__VLS_34, new __VLS_34({
            // @ts-ignore
            icon: "lucide:loader-circle", ...{ class: "mx-auto size-8 animate-spin text-flixer-accent motion-reduce:animate-none" }, 'aria-hidden': "true",
        }));
        const __VLS_36 = __VLS_35({
            icon: "lucide:loader-circle",
            ...{ class: "mx-auto size-8 animate-spin text-flixer-accent motion-reduce:animate-none" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_35));
        /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-8']} */ ;
        /** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
        /** @type {__VLS_StyleScopedClasses['motion-reduce:animate-none']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-4 text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('epg.loading'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-2 text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('epg.feedNote'));
    }
    else if (loadError.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-4 rounded border border-red-400/20 bg-red-500/5 p-8 text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-red-400/20']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-red-500/5']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-8']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        let __VLS_39;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_40 = __VLS_asFunctionalComponent1(__VLS_39, new __VLS_39({
            // @ts-ignore
            icon: "lucide:cloud-off", ...{ class: "mx-auto size-8 text-red-300" }, 'aria-hidden': "true",
        }));
        const __VLS_41 = __VLS_40({
            icon: "lucide:cloud-off",
            ...{ class: "mx-auto size-8 text-red-300" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_40));
        /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-8']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-3 text-sm text-red-200" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-200']} */ ;
        (loadError.value);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (load) },
            type: "button",
            ...{ class: "mt-4 rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        (__VLS_unwrap(t, {})('epg.retry'));
    }
    else {
        if (favoritesOnly.value && filteredChannels.value.length === 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mt-4 rounded border border-white/10 bg-flixer-surface/40 p-10 text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/40']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-10']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            let __VLS_44;
            /** @ts-ignore @type { | typeof __VLS_components.Icon} */
            Icon;
            // @ts-ignore
            const __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44({
                // @ts-ignore
                icon: "lucide:star", ...{ class: "mx-auto size-8 text-flixer-accent" }, 'aria-hidden': "true",
            }));
            const __VLS_46 = __VLS_45({
                icon: "lucide:star",
                ...{ class: "mx-auto size-8 text-flixer-accent" },
                'aria-hidden': "true",
            }, ...__VLS_functionalComponentArgsRest(__VLS_45));
            /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
            /** @type {__VLS_StyleScopedClasses['size-8']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mt-3 text-sm text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('epg.favoriteEmpty'));
        }
        else if (filteredChannels.value.length === 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mt-4 rounded border border-white/10 bg-flixer-surface/40 p-10 text-center text-sm text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/40']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-10']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('epg.noResults'));
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "guide-frame mt-4 rounded border border-white/10 bg-flixer-surface/50 shadow-xl shadow-black/10" },
            });
            /** @type {__VLS_StyleScopedClasses['guide-frame']} */ ;
            /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/50']} */ ;
            /** @type {__VLS_StyleScopedClasses['shadow-xl']} */ ;
            /** @type {__VLS_StyleScopedClasses['shadow-black/10']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ onScroll: (onGuideScroll) },
                ref: "guideScroller",
                ...{ class: "guide-scroll overflow-x-auto overscroll-x-contain" },
            });
            /** @type {__VLS_StyleScopedClasses['guide-scroll']} */ ;
            /** @type {__VLS_StyleScopedClasses['overflow-x-auto']} */ ;
            /** @type {__VLS_StyleScopedClasses['overscroll-x-contain']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "guide-layout min-w-max" },
                ...{ style: ({ '--guide-width': `${timeSlots.value.length * __VLS_unwrap(SLOT_WIDTH, {})}px`, '--slot-count': timeSlots.value.length }) },
            });
            /** @type {__VLS_StyleScopedClasses['guide-layout']} */ ;
            /** @type {__VLS_StyleScopedClasses['min-w-max']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "guide-channel-heading sticky left-0 z-20 flex items-end border-b border-r border-white/10 bg-flixer-surface px-4 pb-3 pt-4" },
            });
            /** @type {__VLS_StyleScopedClasses['guide-channel-heading']} */ ;
            /** @type {__VLS_StyleScopedClasses['sticky']} */ ;
            /** @type {__VLS_StyleScopedClasses['left-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['z-20']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-end']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-r']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['pb-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['pt-4']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-xs font-semibold uppercase tracking-wider text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
            /** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('epg.channelsHeading'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "guide-time-track relative flex border-b border-r border-white/10 bg-flixer-surface text-xs font-medium text-flixer-muted" },
                ...{ style: ({ width: `${timeSlots.value.length * __VLS_unwrap(SLOT_WIDTH, {})}px` }) },
            });
            /** @type {__VLS_StyleScopedClasses['guide-time-track']} */ ;
            /** @type {__VLS_StyleScopedClasses['relative']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-r']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            const __VLS_49 = __VLS_tryAsConstant((timeSlots.value));
            for (const [slot, index] of __VLS_vFor(__VLS_nonNull(__VLS_49))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    key: (slot),
                    ...{ class: "relative flex h-14 shrink-0 flex-col justify-center border-r border-white/[0.07] px-3" },
                    ...{ class: (isDayStart(slot) ? 'border-l border-l-flixer-accent/40 bg-white/[0.03]' : '') },
                    ...{ style: ({ width: `${__VLS_unwrap(SLOT_WIDTH, {})}px` }) },
                });
                /** @type {__VLS_StyleScopedClasses['relative']} */ ;
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['h-14']} */ ;
                /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
                /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-r']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-white/[0.07]']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
                if (isDayStart(slot)) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "inline-flex w-fit items-center gap-1 rounded bg-flixer-accent/10 px-1 py-0.5 text-[9px] font-semibold leading-3 text-flixer-accent" },
                    });
                    /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
                    /** @type {__VLS_StyleScopedClasses['w-fit']} */ ;
                    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
                    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                    /** @type {__VLS_StyleScopedClasses['bg-flixer-accent/10']} */ ;
                    /** @type {__VLS_StyleScopedClasses['px-1']} */ ;
                    /** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-[9px]']} */ ;
                    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                    /** @type {__VLS_StyleScopedClasses['leading-3']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "size-1 rounded-full bg-flixer-accent" },
                    });
                    /** @type {__VLS_StyleScopedClasses['size-1']} */ ;
                    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
                    /** @type {__VLS_StyleScopedClasses['bg-flixer-accent']} */ ;
                    (formatDay(slot));
                }
                else {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                    (formatTime(slot, { hour: 'numeric', minute: '2-digit' }));
                }
                if (index === 0) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "absolute bottom-1 left-0 text-[9px] uppercase tracking-wider opacity-60" },
                    });
                    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
                    /** @type {__VLS_StyleScopedClasses['bottom-1']} */ ;
                    /** @type {__VLS_StyleScopedClasses['left-0']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-[9px]']} */ ;
                    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
                    /** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
                    /** @type {__VLS_StyleScopedClasses['opacity-60']} */ ;
                    (__VLS_unwrap(t, {})('epg.halfHour'));
                }
                // @ts-ignore
                [t, t, t, t, t, t, t, t, t, t, data, data, data, loading, locale, locale, favoritesOnly, showingChannels, loadError, loadError, filteredChannels, filteredChannels, timeSlots, timeSlots, timeSlots, timeSlots, SLOT_WIDTH, SLOT_WIDTH, SLOT_WIDTH,];
            }
            if (nowPosition.value !== undefined) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "pointer-events-none absolute bottom-0 top-0 z-10 w-px bg-flixer-accent shadow-[0_0_10px_rgba(129,140,248,0.8)]" },
                    ...{ style: ({ left: `${nowPosition.value}%` }) },
                });
                /** @type {__VLS_StyleScopedClasses['pointer-events-none']} */ ;
                /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
                /** @type {__VLS_StyleScopedClasses['bottom-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['top-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['z-10']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-px']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-flixer-accent']} */ ;
                /** @type {__VLS_StyleScopedClasses['shadow-[0_0_10px_rgba(129,140,248,0.8)]']} */ ;
            }
            const __VLS_50 = __VLS_tryAsConstant((__VLS_unwrap(visibleChannels, {})));
            for (const [channel] of __VLS_vFor(__VLS_nonNull(__VLS_50))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.template)({
                    key: (channel.id),
                });
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "guide-channel sticky left-0 z-10 flex min-w-0 items-center gap-3 border-b border-r border-white/[0.07] bg-flixer-surface/95 px-3 py-2 backdrop-blur" },
                });
                /** @type {__VLS_StyleScopedClasses['guide-channel']} */ ;
                /** @type {__VLS_StyleScopedClasses['sticky']} */ ;
                /** @type {__VLS_StyleScopedClasses['left-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['z-10']} */ ;
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-r']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-white/[0.07]']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/95']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['backdrop-blur']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "grid size-10 shrink-0 place-items-center overflow-hidden rounded border border-white/10 bg-white/5" },
                });
                /** @type {__VLS_StyleScopedClasses['grid']} */ ;
                /** @type {__VLS_StyleScopedClasses['size-10']} */ ;
                /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['border']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-white/5']} */ ;
                if (channel.icon && !imageFailures.value.has(channel.id)) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
                        ...{ onError: (...[$event]) => {
                                void $event;
                                if (!!(loading.value && !data.value))
                                    throw 0;
                                if (!!(loadError.value))
                                    throw 0;
                                if (!!(favoritesOnly.value && filteredChannels.value.length === 0))
                                    throw 0;
                                if (!!(filteredChannels.value.length === 0))
                                    throw 0;
                                if (!(channel.icon && !imageFailures.value.has(channel.id)))
                                    throw 0;
                                return (markImageFailed(channel.id));
                                // @ts-ignore
                                [nowPosition, nowPosition, visibleChannels, imageFailures,];
                            } },
                        src: (channel.icon),
                        alt: (__VLS_unwrap(t, {})('epg.channelLogo', { channel: channel.name })),
                        ...{ class: "size-full object-contain p-1" },
                        loading: "lazy",
                    });
                    /** @type {__VLS_StyleScopedClasses['size-full']} */ ;
                    /** @type {__VLS_StyleScopedClasses['object-contain']} */ ;
                    /** @type {__VLS_StyleScopedClasses['p-1']} */ ;
                }
                else {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "text-xs font-bold text-white/80" },
                    });
                    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-white/80']} */ ;
                    (channel.name.slice(0, 2).toUpperCase());
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "min-w-0 flex-1" },
                });
                /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "block truncate text-xs font-semibold text-white sm:text-sm" },
                    title: (channel.name),
                });
                /** @type {__VLS_StyleScopedClasses['block']} */ ;
                /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                /** @type {__VLS_StyleScopedClasses['sm:text-sm']} */ ;
                (channel.name);
                if (channel.alternateNames.length) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "mt-0.5 block truncate text-[9px] text-flixer-muted" },
                        title: (channel.alternateNames.join(' · ')),
                    });
                    /** @type {__VLS_StyleScopedClasses['mt-0.5']} */ ;
                    /** @type {__VLS_StyleScopedClasses['block']} */ ;
                    /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-[9px]']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                    (channel.alternateNames.join(' · '));
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!!(loading.value && !data.value))
                                throw 0;
                            if (!!(loadError.value))
                                throw 0;
                            if (!!(favoritesOnly.value && filteredChannels.value.length === 0))
                                throw 0;
                            if (!!(filteredChannels.value.length === 0))
                                throw 0;
                            return (toggleFavorite(channel));
                            // @ts-ignore
                            [t,];
                        } },
                    type: "button",
                    ...{ class: "grid size-8 shrink-0 place-items-center rounded text-flixer-muted transition hover:bg-white/10 hover:text-flixer-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
                    'aria-label': (__VLS_unwrap(t, {})(favorites.value.has(channel.id) ? 'epg.unfavorite' : 'epg.favorite', { channel: channel.name })),
                    'aria-pressed': (favorites.value.has(channel.id)),
                });
                /** @type {__VLS_StyleScopedClasses['grid']} */ ;
                /** @type {__VLS_StyleScopedClasses['size-8']} */ ;
                /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:text-flixer-accent']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
                let __VLS_51;
                /** @ts-ignore @type { | typeof __VLS_components.Icon} */
                Icon;
                // @ts-ignore
                const __VLS_52 = __VLS_asFunctionalComponent1(__VLS_51, new __VLS_51({
                    // @ts-ignore
                    icon: "lucide:star", ...{ class: "size-4" }, ...{ class: (favorites.value.has(channel.id) ? 'fill-amber-300 text-amber-300' : '') }, 'aria-hidden': "true",
                }));
                const __VLS_53 = __VLS_52({
                    icon: "lucide:star",
                    ...{ class: "size-4" },
                    ...{ class: (favorites.value.has(channel.id) ? 'fill-amber-300 text-amber-300' : '') },
                    'aria-hidden': "true",
                }, ...__VLS_functionalComponentArgsRest(__VLS_52));
                /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "guide-track relative border-b border-white/[0.07] bg-[linear-gradient(to_right,rgba(255,255,255,.025)_1px,transparent_1px)]" },
                    ...{ style: ({ backgroundSize: `${100 / timeSlots.value.length}% 100%` }) },
                });
                /** @type {__VLS_StyleScopedClasses['guide-track']} */ ;
                /** @type {__VLS_StyleScopedClasses['relative']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-white/[0.07]']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-[linear-gradient(to_right,rgba(255,255,255,.025)_1px,transparent_1px)]']} */ ;
                if (nowPosition.value !== undefined) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "pointer-events-none absolute inset-y-0 z-[1] w-px bg-flixer-accent/50" },
                        ...{ style: ({ left: `${nowPosition.value}%` }) },
                    });
                    /** @type {__VLS_StyleScopedClasses['pointer-events-none']} */ ;
                    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
                    /** @type {__VLS_StyleScopedClasses['inset-y-0']} */ ;
                    /** @type {__VLS_StyleScopedClasses['z-[1]']} */ ;
                    /** @type {__VLS_StyleScopedClasses['w-px']} */ ;
                    /** @type {__VLS_StyleScopedClasses['bg-flixer-accent/50']} */ ;
                }
                const __VLS_56 = __VLS_tryAsConstant((programmesFor(channel)));
                for (const [programme] of __VLS_vFor(__VLS_nonNull(__VLS_56))) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                void $event;
                                if (!!(loading.value && !data.value))
                                    throw 0;
                                if (!!(loadError.value))
                                    throw 0;
                                if (!!(favoritesOnly.value && filteredChannels.value.length === 0))
                                    throw 0;
                                if (!!(filteredChannels.value.length === 0))
                                    throw 0;
                                return (selectedProgramme.value = programme);
                                // @ts-ignore
                                [t, timeSlots, nowPosition, nowPosition, favorites, favorites, favorites, selectedProgramme,];
                            } },
                        key: (programmeKey(programme)),
                        type: "button",
                        ...{ class: "group absolute inset-y-1 z-[2] overflow-hidden border px-3 py-2 text-left transition hover:z-[3] hover:brightness-110 focus-visible:z-[4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white" },
                        ...{ class: (isOnNow(programme) ? 'border-flixer-accent/70 bg-flixer-primary/35 shadow-[inset_0_0_0_1px_rgba(129,140,248,.12)]' : 'border-white/10 bg-white/[0.055] hover:border-white/25') },
                        ...{ style: (programmeStyle(programme)) },
                        'aria-label': (`${programme.title}, ${formatTime(programme.start)} to ${formatTime(programme.stop)}${programme.subtitle ? `, ${programme.subtitle}` : ''}`),
                    });
                    /** @type {__VLS_StyleScopedClasses['group']} */ ;
                    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
                    /** @type {__VLS_StyleScopedClasses['inset-y-1']} */ ;
                    /** @type {__VLS_StyleScopedClasses['z-[2]']} */ ;
                    /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
                    /** @type {__VLS_StyleScopedClasses['border']} */ ;
                    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
                    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
                    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                    /** @type {__VLS_StyleScopedClasses['hover:z-[3]']} */ ;
                    /** @type {__VLS_StyleScopedClasses['hover:brightness-110']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:z-[4]']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-white']} */ ;
                    if (isOnNow(programme)) {
                        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                            ...{ class: "flex items-center gap-1 text-[9px] font-bold tracking-wider text-flixer-accent" },
                        });
                        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                        /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
                        /** @type {__VLS_StyleScopedClasses['text-[9px]']} */ ;
                        /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
                        /** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
                        /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
                        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                            ...{ class: "size-1.5 rounded-full bg-flixer-accent" },
                        });
                        /** @type {__VLS_StyleScopedClasses['size-1.5']} */ ;
                        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
                        /** @type {__VLS_StyleScopedClasses['bg-flixer-accent']} */ ;
                        (__VLS_unwrap(t, {})('epg.live'));
                    }
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "mt-0.5 block truncate text-xs font-semibold leading-4 text-white" },
                    });
                    /** @type {__VLS_StyleScopedClasses['mt-0.5']} */ ;
                    /** @type {__VLS_StyleScopedClasses['block']} */ ;
                    /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                    /** @type {__VLS_StyleScopedClasses['leading-4']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                    (programme.title);
                    if (programme.subtitle) {
                        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                            ...{ class: "mt-1 block truncate text-[10px] text-flixer-muted" },
                        });
                        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
                        /** @type {__VLS_StyleScopedClasses['block']} */ ;
                        /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                        /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
                        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                        (programme.subtitle);
                    }
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "programme-hover-indicator absolute inset-x-0 bottom-0 h-0.5 origin-left bg-flixer-accent" },
                        ...{ style: (programmeHoverStyle(programme)) },
                    });
                    /** @type {__VLS_StyleScopedClasses['programme-hover-indicator']} */ ;
                    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
                    /** @type {__VLS_StyleScopedClasses['inset-x-0']} */ ;
                    /** @type {__VLS_StyleScopedClasses['bottom-0']} */ ;
                    /** @type {__VLS_StyleScopedClasses['h-0.5']} */ ;
                    /** @type {__VLS_StyleScopedClasses['origin-left']} */ ;
                    /** @type {__VLS_StyleScopedClasses['bg-flixer-accent']} */ ;
                    // @ts-ignore
                    [t,];
                }
                let __VLS_57;
                /** @ts-ignore @type { | typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
                Transition;
                // @ts-ignore
                const __VLS_58 = __VLS_asFunctionalComponent1(__VLS_57, new __VLS_57({
                    // @ts-ignore
                    name: "guide-details",
                }));
                const __VLS_59 = __VLS_58({
                    name: "guide-details",
                }, ...__VLS_functionalComponentArgsRest(__VLS_58));
                var __VLS_60;
                const { default: __VLS_62 } = __VLS_nonNull(__VLS_60.slots);
                if (selectedProgramme.value?.channelId === channel.id) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        key: (channel.id),
                        ...{ class: "guide-details-row border-b border-white/10" },
                        'aria-live': "polite",
                    });
                    /** @type {__VLS_StyleScopedClasses['guide-details-row']} */ ;
                    /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
                    /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
                        ...{ class: "guide-details-content border-l-2 border-flixer-accent bg-linear-to-r from-flixer-primary/15 via-flixer-surface/95 to-flixer-surface px-4 py-4 sm:px-6" },
                    });
                    /** @type {__VLS_StyleScopedClasses['guide-details-content']} */ ;
                    /** @type {__VLS_StyleScopedClasses['border-l-2']} */ ;
                    /** @type {__VLS_StyleScopedClasses['border-flixer-accent']} */ ;
                    /** @type {__VLS_StyleScopedClasses['bg-linear-to-r']} */ ;
                    /** @type {__VLS_StyleScopedClasses['from-flixer-primary/15']} */ ;
                    /** @type {__VLS_StyleScopedClasses['via-flixer-surface/95']} */ ;
                    /** @type {__VLS_StyleScopedClasses['to-flixer-surface']} */ ;
                    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
                    /** @type {__VLS_StyleScopedClasses['py-4']} */ ;
                    /** @type {__VLS_StyleScopedClasses['sm:px-6']} */ ;
                    let __VLS_63;
                    /** @ts-ignore @type { | typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
                    Transition;
                    // @ts-ignore
                    const __VLS_64 = __VLS_asFunctionalComponent1(__VLS_63, new __VLS_63({
                        // @ts-ignore
                        name: "guide-details-fade", mode: "out-in",
                    }));
                    const __VLS_65 = __VLS_64({
                        name: "guide-details-fade",
                        mode: "out-in",
                    }, ...__VLS_functionalComponentArgsRest(__VLS_64));
                    var __VLS_66;
                    const { default: __VLS_68 } = __VLS_nonNull(__VLS_66.slots);
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        key: (programmeKey(selectedProgramme.value)),
                        ...{ class: "flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6" },
                    });
                    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
                    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
                    /** @type {__VLS_StyleScopedClasses['sm:flex-row']} */ ;
                    /** @type {__VLS_StyleScopedClasses['sm:items-center']} */ ;
                    /** @type {__VLS_StyleScopedClasses['sm:gap-6']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "min-w-0 flex-1" },
                    });
                    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
                    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                        ...{ class: "text-[10px] font-semibold tracking-[0.16em] text-flixer-accent" },
                    });
                    /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
                    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                    /** @type {__VLS_StyleScopedClasses['tracking-[0.16em]']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
                    (__VLS_unwrap(t, {})(isOnNow(selectedProgramme.value) ? 'epg.onNow' : 'epg.programmeDetails'));
                    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
                        ...{ class: "mt-1 text-lg font-bold text-white" },
                    });
                    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
                    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                    (selectedProgramme.value.title);
                    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                        ...{ class: "mt-1 text-xs text-flixer-muted" },
                    });
                    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                    (channel.name);
                    (formatTime(selectedProgramme.value.start));
                    (formatTime(selectedProgramme.value.stop));
                    if (selectedProgramme.value.category) {
                        (selectedProgramme.value.category);
                    }
                    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                        ...{ class: "line-clamp-3 min-w-0 flex-1 text-sm leading-5 text-flixer-muted" },
                    });
                    /** @type {__VLS_StyleScopedClasses['line-clamp-3']} */ ;
                    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
                    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                    /** @type {__VLS_StyleScopedClasses['leading-5']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                    (selectedProgramme.value.description || __VLS_unwrap(t, {})('epg.noDescription'));
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "flex shrink-0 items-center gap-3" },
                    });
                    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                void $event;
                                if (!!(loading.value && !data.value))
                                    throw 0;
                                if (!!(loadError.value))
                                    throw 0;
                                if (!!(favoritesOnly.value && filteredChannels.value.length === 0))
                                    throw 0;
                                if (!!(filteredChannels.value.length === 0))
                                    throw 0;
                                if (!(selectedProgramme.value?.channelId === channel.id))
                                    throw 0;
                                return (watchChannel(channel));
                                // @ts-ignore
                                [t, t, selectedProgramme, selectedProgramme, selectedProgramme, selectedProgramme, selectedProgramme, selectedProgramme, selectedProgramme, selectedProgramme, selectedProgramme,];
                            } },
                        type: "button",
                        disabled: (!channel.watchable || openingChannelId.value === channel.id),
                        title: (channel.watchable ? __VLS_unwrap(t, {})('epg.watchLive') : __VLS_unwrap(t, {})('epg.watchUnavailable')),
                        ...{ class: "inline-flex min-h-9 items-center gap-2 rounded border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent disabled:cursor-not-allowed disabled:opacity-50" },
                    });
                    /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
                    /** @type {__VLS_StyleScopedClasses['min-h-9']} */ ;
                    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
                    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                    /** @type {__VLS_StyleScopedClasses['border']} */ ;
                    /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
                    /** @type {__VLS_StyleScopedClasses['bg-white/5']} */ ;
                    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                    /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
                    /** @type {__VLS_StyleScopedClasses['disabled:cursor-not-allowed']} */ ;
                    /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
                    let __VLS_69;
                    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
                    Icon;
                    // @ts-ignore
                    const __VLS_70 = __VLS_asFunctionalComponent1(__VLS_69, new __VLS_69({
                        // @ts-ignore
                        icon: (openingChannelId.value === channel.id ? 'lucide:loader-circle' : 'lucide:play'), ...{ class: "size-3.5 text-flixer-accent" }, ...{ class: (openingChannelId.value === channel.id && 'animate-spin') }, 'aria-hidden': "true",
                    }));
                    const __VLS_71 = __VLS_70({
                        icon: (openingChannelId.value === channel.id ? 'lucide:loader-circle' : 'lucide:play'),
                        ...{ class: "size-3.5 text-flixer-accent" },
                        ...{ class: (openingChannelId.value === channel.id && 'animate-spin') },
                        'aria-hidden': "true",
                    }, ...__VLS_functionalComponentArgsRest(__VLS_70));
                    /** @type {__VLS_StyleScopedClasses['size-3.5']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
                    (__VLS_unwrap(t, {})(openingChannelId.value === channel.id ? 'epg.openingPlayer' : 'epg.watchLive'));
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                void $event;
                                if (!!(loading.value && !data.value))
                                    throw 0;
                                if (!!(loadError.value))
                                    throw 0;
                                if (!!(favoritesOnly.value && filteredChannels.value.length === 0))
                                    throw 0;
                                if (!!(filteredChannels.value.length === 0))
                                    throw 0;
                                if (!(selectedProgramme.value?.channelId === channel.id))
                                    throw 0;
                                return (selectedProgramme.value = null);
                                // @ts-ignore
                                [t, t, t, selectedProgramme, openingChannelId, openingChannelId, openingChannelId, openingChannelId,];
                            } },
                        type: "button",
                        ...{ class: "grid size-9 place-items-center rounded text-flixer-muted transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
                        'aria-label': (__VLS_unwrap(t, {})('epg.closeDetails')),
                    });
                    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
                    /** @type {__VLS_StyleScopedClasses['size-9']} */ ;
                    /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
                    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                    /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
                    /** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
                    let __VLS_74;
                    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
                    Icon;
                    // @ts-ignore
                    const __VLS_75 = __VLS_asFunctionalComponent1(__VLS_74, new __VLS_74({
                        // @ts-ignore
                        icon: "lucide:x", ...{ class: "size-4" }, 'aria-hidden': "true",
                    }));
                    const __VLS_76 = __VLS_75({
                        icon: "lucide:x",
                        ...{ class: "size-4" },
                        'aria-hidden': "true",
                    }, ...__VLS_functionalComponentArgsRest(__VLS_75));
                    /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
                    // @ts-ignore
                    [t,];
                }
                // @ts-ignore
                [];
                // @ts-ignore
                [];
            }
        }
        if (loadingTime.value || timeLoadError.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mt-2 flex min-h-8 items-center justify-center gap-2 text-xs text-flixer-muted" },
                'aria-live': "polite",
            });
            /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['min-h-8']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            if (loadingTime.value) {
                let __VLS_79;
                /** @ts-ignore @type { | typeof __VLS_components.Icon} */
                Icon;
                // @ts-ignore
                const __VLS_80 = __VLS_asFunctionalComponent1(__VLS_79, new __VLS_79({
                    // @ts-ignore
                    icon: "lucide:loader-circle", ...{ class: "size-3.5 animate-spin text-flixer-accent" }, 'aria-hidden': "true",
                }));
                const __VLS_81 = __VLS_80({
                    icon: "lucide:loader-circle",
                    ...{ class: "size-3.5 animate-spin text-flixer-accent" },
                    'aria-hidden': "true",
                }, ...__VLS_functionalComponentArgsRest(__VLS_80));
                /** @type {__VLS_StyleScopedClasses['size-3.5']} */ ;
                /** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
            }
            if (loadingTime.value) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                (__VLS_unwrap(t, {})('epg.loading'));
            }
            if (timeLoadError.value) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    role: "alert",
                });
                (timeLoadError.value);
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (retryVisibleTimeChunks) },
                    type: "button",
                    ...{ class: "font-semibold text-flixer-accent hover:text-white" },
                });
                /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
                (__VLS_unwrap(t, {})('epg.retry'));
            }
        }
        if (canLoadMoreChannels.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ref: (__VLS_unwrap(setSentinel, {})),
                ...{ class: "grid min-h-12 place-items-center" },
                'aria-live': "polite",
            });
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['min-h-12']} */ ;
            /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
            if (loadingMore.value) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "text-xs text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (__VLS_unwrap(t, {})('epg.loading'));
            }
            else if (loadMoreError.value) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (loadNextPage) },
                    type: "button",
                    ...{ class: "text-xs font-semibold text-flixer-accent hover:text-white" },
                });
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
                (__VLS_unwrap(t, {})('epg.retry'));
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "h-px" },
                });
                /** @type {__VLS_StyleScopedClasses['h-px']} */ ;
            }
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.footer, __VLS_intrinsics.footer)({
        ...{ class: "mt-5 flex flex-col gap-1 text-xs text-flixer-muted sm:flex-row sm:items-center sm:justify-between" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:flex-row']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:justify-between']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
        ...{ class: "inline-flex w-fit items-center gap-1.5 hover:text-white" },
        href: "https://github.com/dp247/Freeview-EPG",
        target: "_blank",
        rel: "noreferrer",
    });
    /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-fit']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
    let __VLS_84;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_85 = __VLS_asFunctionalComponent1(__VLS_84, new __VLS_84({
        // @ts-ignore
        icon: "lucide:external-link", ...{ class: "size-3.5" }, 'aria-hidden': "true",
    }));
    const __VLS_86 = __VLS_85({
        icon: "lucide:external-link",
        ...{ class: "size-3.5" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_85));
    /** @type {__VLS_StyleScopedClasses['size-3.5']} */ ;
    (__VLS_unwrap(t, {})('epg.source'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_unwrap(t, {})('epg.updated'));
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
    [t, t, t, t, t, t, loadingTime, loadingTime, loadingTime, timeLoadError, timeLoadError, timeLoadError, canLoadMoreChannels, setSentinel, loadingMore, loadMoreError, mobileTabs,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
