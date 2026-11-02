import { openModal } from '@kolirt/vue-modal';
import { computed, ref, shallowRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, useRoute } from 'vue-router';
import { getItemDetail, getItemPlaybackInfo, getTrickplay, setItemWatched } from '../api';
import SubtitleModal from '../components/admin/SubtitleModal.vue';
import ClampedText from '../components/ui/ClampedText.vue';
import Header from '../components/header/Header.vue';
import PersonAvatar from '../components/ui/PersonAvatar.vue';
import Skeleton from '../components/ui/Skeleton.vue';
import MediaRow from '../components/home/MediaRow.vue';
import { thumbnailAt } from '../composables/trickplay';
import MobileTabBar from '../components/home/MobileTabBar.vue';
import { useVideoOverlay } from '../composables/useVideoOverlay';
import MusicBanner from '../components/ui/MusicBanner.vue';
import AuthImage from '../components/ui/AuthImage.vue';
import FavoriteToggle from '../components/ui/FavoriteToggle.vue';
import { useParty } from '../composables/useParty';
import { notify } from '../composables/notify';
import AddToPlaylistModal from '../components/AddToPlaylistModal.vue';
import { getMobileTabs, getNavLinks } from '../composables/homeNav';
import { useAudioPlayer } from '../composables/useAudioPlayer';
import { useProfile } from '../composables/useProfile';
import { useSignOut } from '../composables/useSignOut';
import { catchError } from '../utils/catchError';
import { useThemeMusic } from '../composables/useThemeMusic';
const { t, te } = useI18n();
const route = useRoute();
const { profile } = useProfile();
const isAdmin = computed(() => profile.value?.role === 'admin');
const { isSigningOut, signOut } = useSignOut();
const navLinks = computed(getNavLinks);
const mobileTabs = computed(getMobileTabs);
const item = ref(null);
const themeMusic = useThemeMusic(computed(() => item.value?.id), computed(() => item.value !== null && ['movie', 'series'].includes(item.value.type)));
const isLoading = ref(true);
const failure = ref(null);
const activeSeason = ref(0);
const isShow = computed(() => item.value?.type === 'series');
const isPortraitOnly = computed(() => item.value !== null && item.value.backdrop === null);
const seasons = computed(() => (isShow.value ? (item.value?.children ?? []) : []));
const episodes = computed(() => {
    if (!item.value)
        return [];
    if (isShow.value)
        return seasons.value[activeSeason.value]?.episodes ?? [];
    return item.value.children;
});
const listTitle = computed(() => {
    if (!item.value)
        return '';
    if (item.value.type === 'album')
        return t('mediaItem.tracks');
    return t('mediaItem.episodes');
});
const ratings = computed(() => Object.entries(item.value?.ratings ?? {}).filter(([, value]) => Number.isFinite(value) && value > 0));
const PLAYABLE = ['movie', 'episode', 'video'];
const videoOverlay = useVideoOverlay();
const canManageSubtitles = computed(() => isAdmin.value && item.value !== null && PLAYABLE.includes(item.value.type));
function manageSubtitles() {
    if (!item.value)
        return;
    void openModal(SubtitleModal, { props: { itemId: item.value.id, title: item.value.title } }).catch(() => undefined);
}
const showTitle = computed(() => {
    const current = item.value;
    if (!current)
        return null;
    if (current.type === 'series')
        return current.title;
    return current.series?.title ?? (current.parent?.type === 'series' ? current.parent.title : null);
});
function playerTitle(entry, seasonNumber = entry.seasonNumber) {
    if (!showTitle.value)
        return entry.title;
    const code = seasonNumber !== null && entry.episodeNumber !== null ? `S${seasonNumber}E${entry.episodeNumber}` : '';
    return [showTitle.value, code, entry.title].filter(Boolean).join(' · ');
}
// A series plays its first episode.
const playTarget = computed(() => {
    const current = item.value;
    if (!current)
        return null;
    if (PLAYABLE.includes(current.type))
        return { id: current.id, title: playerTitle(current) };
    if (current.type === 'series') {
        const season = current.children.find((entry) => (entry.episodes?.length ?? 0) > 0);
        const first = season?.episodes?.[0];
        return first ? { id: first.id, title: playerTitle(first, first.seasonNumber ?? season?.seasonNumber ?? null) } : null;
    }
    return null;
});
function play(target) {
    themeMusic.stop();
    videoOverlay.play(target);
}
const audioPlayer = useAudioPlayer();
const isAlbum = computed(() => item.value?.type === 'album');
const isTrack = computed(() => item.value?.type === 'track');
const isMusic = computed(() => isAlbum.value || isTrack.value);
const usesBanner = computed(() => isMusic.value && item.value !== null && item.value.backdrop === null);
const FAVORITABLE = ['movie', 'series', 'album', 'track', 'video'];
const canFavorite = computed(() => !!item.value && FAVORITABLE.includes(item.value.type));
const party = useParty();
const partyItemId = computed(() => (isTrack.value ? (item.value?.id ?? null) : (playTarget.value?.id ?? null)));
const partyBusy = ref(false);
async function startParty() {
    const id = partyItemId.value;
    if (!id || partyBusy.value)
        return;
    partyBusy.value = true;
    try {
        const [error, started] = await catchError(party.start(id));
        if (error) {
            notify.error(t('party.startFailed'));
            return;
        }
        if (!started)
            return;
        if (isTrack.value)
            await playTrackPage();
        else if (playTarget.value)
            play(playTarget.value);
    }
    finally {
        partyBusy.value = false;
    }
}
function addToPlaylist(id, title, album = false) {
    void openModal(AddToPlaylistModal, { props: { itemId: id, title, album } }).catch(() => undefined);
}
// Tracks have no artwork of their own, so they show their album's cover.
const trackAlbumArt = ref(null);
const cover = computed(() => {
    const current = item.value;
    if (!current)
        return null;
    if (current.type === 'track')
        return trackAlbumArt.value;
    return current.poster !== null ? { itemId: current.id, index: current.poster, version: current.updatedAt } : null;
});
function queueTrack(track, album) {
    return {
        id: track.id,
        title: track.title,
        artist: album.artist,
        artistId: album.artistId,
        album: album.title,
        albumId: album.id,
        art: album.poster !== null ? { itemId: album.id, index: album.poster, version: album.updatedAt } : null,
    };
}
function playAlbum(startId) {
    const album = item.value;
    if (!album)
        return;
    const tracks = album.children.map((track) => queueTrack(track, album));
    audioPlayer.playQueue(tracks, Math.max(0, tracks.findIndex((track) => track.id === startId)));
}
// A track page queues its whole album, starting at that track.
async function playTrackPage() {
    const track = item.value;
    if (!track)
        return;
    if (track.parent?.type === 'album') {
        const [error, album] = await catchError(getItemDetail(track.parent.id));
        if (!error) {
            const tracks = album.children.map((entry) => queueTrack(entry, album));
            const start = tracks.findIndex((entry) => entry.id === track.id);
            if (start >= 0)
                return audioPlayer.playQueue(tracks, start);
        }
        // Fall through to playing the single track if the album request failed.
    }
    audioPlayer.playQueue([queueTrack(track, track)]);
}
const quality = computed(() => {
    const tech = item.value?.technical;
    if (!tech)
        return [];
    const resolution = tech.height ? `${tech.height}p` : null;
    return [resolution, tech.hdr, tech.videoCodec?.toUpperCase(), tech.audioCodec?.toUpperCase(), tech.container?.toUpperCase()].filter((value) => !!value);
});
// Chapter cards borrow the seek-preview sheets; without them the cards stay plain.
const trickplay = shallowRef(null);
const CHAPTER_THUMB_WIDTH = 256;
watch(() => (item.value && PLAYABLE.includes(item.value.type) && item.value.chapters.length > 0 ? item.value.id : null), async (id) => {
    trickplay.value = null;
    if (!id)
        return;
    const [playbackError, playback] = await catchError(getItemPlaybackInfo(id));
    if (playbackError)
        return; // Cards fall back to a plain background.
    const [trickplayError, loaded] = await catchError(getTrickplay(playback.mediaSource.streamUrl));
    if (trickplayError)
        return; // Cards fall back to a plain background.
    if (item.value?.id === id)
        trickplay.value = loaded;
}, { immediate: true });
function chapterThumbStyle(startMs) {
    const sheets = trickplay.value;
    if (!sheets)
        return {};
    const place = thumbnailAt(sheets.manifest, startMs / 1000 + 1, CHAPTER_THUMB_WIDTH);
    return {
        backgroundImage: `url(${sheets.sheetUrl(place.sheet)})`,
        backgroundSize: `${(place.sheetWidth / place.width) * 100}% ${(place.sheetHeight / place.height) * 100}%`,
        backgroundPosition: `${place.width === place.sheetWidth ? 0 : (place.x / (place.sheetWidth - place.width)) * 100}% ${place.height === place.sheetHeight ? 0 : (place.y / (place.sheetHeight - place.height)) * 100}%`,
    };
}
function chapterTime(ms) {
    const total = Math.floor(ms / 1000);
    const hours = Math.floor(total / 3600);
    const rest = String(Math.floor((total % 3600) / 60)).padStart(hours > 0 ? 2 : 1, '0');
    const seconds = String(total % 60).padStart(2, '0');
    return hours > 0 ? `${hours}:${rest}:${seconds}` : `${rest}:${seconds}`;
}
function runtime(minutes) {
    if (!minutes)
        return '';
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return hours > 0 ? `${hours}h ${rest}m` : `${rest}m`;
}
function seasonLabel(season) {
    return season.seasonNumber === 0 ? t('mediaItem.specials') : t('mediaItem.season', { number: season.seasonNumber ?? '?' });
}
function episodeLabel(episode) {
    const number = episode.episodeNumber;
    return number === null ? episode.title : `${number}. ${episode.title}`;
}
const WATCHABLE = ['movie', 'episode', 'video'];
const canMarkWatched = computed(() => item.value !== null && [...WATCHABLE, 'series'].includes(item.value.type));
// A series counts as watched once every episode is.
const itemWatched = computed(() => {
    const current = item.value;
    if (!current)
        return false;
    if (current.type !== 'series')
        return current.watched;
    const all = current.children.flatMap((season) => season.episodes ?? []);
    return all.length > 0 && all.every((episode) => episode.watched);
});
async function toggleWatched(id, watched) {
    const [updateError] = await catchError(setItemWatched(id, watched));
    if (updateError)
        return; // Leave the current state; the user can retry.
    const [loadError, fresh] = await catchError(getItemDetail(String(route.params.id)));
    if (loadError)
        return; // Leave the current state; the user can retry.
    item.value = fresh;
}
async function load(id) {
    themeMusic.stop();
    isLoading.value = true;
    failure.value = null;
    activeSeason.value = 0;
    try {
        const [error, loaded] = await catchError(getItemDetail(id));
        if (error) {
            item.value = null;
            failure.value = error.response?.status === 404 ? 'missing' : 'error';
            return;
        }
        item.value = loaded;
        document.title = `${loaded.title} · Flixer`;
        trackAlbumArt.value = null;
        if (loaded.type === 'track' && loaded.parent?.type === 'album') {
            const albumId = loaded.parent.id;
            void getItemDetail(albumId)
                .then((album) => {
                if (item.value?.id === id && album.poster !== null)
                    trackAlbumArt.value = { itemId: album.id, index: album.poster, version: album.updatedAt };
            })
                .catch(() => undefined);
        }
    }
    finally {
        isLoading.value = false;
    }
}
watch(() => route.params.id, (id) => {
    if (typeof id === 'string')
        void load(id);
}, { immediate: true });
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(isLoading, {});
    __VLS_withDotValue(failure, {});
    __VLS_withDotValue(route, {});
    __VLS_withDotValue(item, {});
    __VLS_withDotValue(isMusic, {});
    __VLS_withDotValue(usesBanner, {});
    __VLS_withDotValue(isPortraitOnly, {});
    __VLS_withDotValue(cover, {});
    __VLS_withDotValue(themeMusic, {});
    __VLS_withDotValue(quality, {});
    __VLS_withDotValue(isAlbum, {});
    __VLS_withDotValue(isTrack, {});
    __VLS_withDotValue(playTarget, {});
    __VLS_withDotValue(canFavorite, {});
    __VLS_withDotValue(partyItemId, {});
    __VLS_withDotValue(canMarkWatched, {});
    __VLS_withDotValue(itemWatched, {});
    __VLS_withDotValue(canManageSubtitles, {});
    __VLS_withDotValue(PLAYABLE, {});
    __VLS_withDotValue(isShow, {});
    __VLS_withDotValue(seasons, {});
    __VLS_withDotValue(activeSeason, {});
    __VLS_withDotValue(episodes, {});
    __VLS_withDotValue(WATCHABLE, {});
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
    if (isLoading.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "page-gutter pt-32" },
            role: "status",
            'aria-label': (__VLS_unwrap(t, {})('mediaItem.loading')),
            'aria-busy': "true",
        });
        /** @type {__VLS_StyleScopedClasses['page-gutter']} */ ;
        /** @type {__VLS_StyleScopedClasses['pt-32']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex flex-col gap-6 sm:flex-row" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:flex-row']} */ ;
        const __VLS_7 = Skeleton;
        // @ts-ignore
        const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
            // @ts-ignore
            ...{ class: "aspect-[2/3] w-40 shrink-0 rounded sm:w-56" },
        }));
        const __VLS_9 = __VLS_8({
            ...{ class: "aspect-[2/3] w-40 shrink-0 rounded sm:w-56" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_8));
        /** @type {__VLS_StyleScopedClasses['aspect-[2/3]']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-40']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:w-56']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "min-w-0 flex-1 space-y-3" },
        });
        /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
        const __VLS_12 = Skeleton;
        // @ts-ignore
        const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
            // @ts-ignore
            ...{ class: "h-9 w-2/3" },
        }));
        const __VLS_14 = __VLS_13({
            ...{ class: "h-9 w-2/3" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_13));
        /** @type {__VLS_StyleScopedClasses['h-9']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-2/3']} */ ;
        const __VLS_17 = Skeleton;
        // @ts-ignore
        const __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({
            // @ts-ignore
            ...{ class: "h-4 w-1/3" },
        }));
        const __VLS_19 = __VLS_18({
            ...{ class: "h-4 w-1/3" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_18));
        /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-1/3']} */ ;
        const __VLS_22 = Skeleton;
        // @ts-ignore
        const __VLS_23 = __VLS_asFunctionalComponent1(__VLS_22, new __VLS_22({
            // @ts-ignore
            ...{ class: "mt-4 h-4 w-full" },
        }));
        const __VLS_24 = __VLS_23({
            ...{ class: "mt-4 h-4 w-full" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_23));
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        const __VLS_27 = Skeleton;
        // @ts-ignore
        const __VLS_28 = __VLS_asFunctionalComponent1(__VLS_27, new __VLS_27({
            // @ts-ignore
            ...{ class: "h-4 w-full" },
        }));
        const __VLS_29 = __VLS_28({
            ...{ class: "h-4 w-full" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_28));
        /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        const __VLS_32 = Skeleton;
        // @ts-ignore
        const __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({
            // @ts-ignore
            ...{ class: "h-4 w-4/5" },
        }));
        const __VLS_34 = __VLS_33({
            ...{ class: "h-4 w-4/5" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_33));
        /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-4/5']} */ ;
        const __VLS_37 = Skeleton;
        // @ts-ignore
        const __VLS_38 = __VLS_asFunctionalComponent1(__VLS_37, new __VLS_37({
            // @ts-ignore
            ...{ class: "mt-4 h-11 w-36 rounded" },
        }));
        const __VLS_39 = __VLS_38({
            ...{ class: "mt-4 h-11 w-36 rounded" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_38));
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-11']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-36']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    }
    else if (failure.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "page-gutter pt-32" },
        });
        /** @type {__VLS_StyleScopedClasses['page-gutter']} */ ;
        /** @type {__VLS_StyleScopedClasses['pt-32']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
            ...{ class: "text-2xl font-semibold text-white" },
        });
        /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        (failure.value === 'missing' ? __VLS_unwrap(t, {})('mediaItem.notFound') : __VLS_unwrap(t, {})('mediaItem.loadError'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-4 flex gap-3" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        let __VLS_42;
        /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
        RouterLink;
        // @ts-ignore
        const __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42({
            // @ts-ignore
            to: "/", ...{ class: "rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white transition motion-reduce:transition-none hover:bg-white/15" },
        }));
        const __VLS_44 = __VLS_43({
            to: "/",
            ...{ class: "rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white transition motion-reduce:transition-none hover:bg-white/15" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_43));
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['motion-reduce:transition-none']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
        var __VLS_45;
        const { default: __VLS_47 } = __VLS_nonNull(__VLS_45.slots);
        (__VLS_unwrap(t, {})('mediaItem.backHome'));
        // @ts-ignore
        [navLinks, isSigningOut, signOut, isLoading, t, t, t, t, failure, failure,];
        if (failure.value === 'error') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!!(isLoading.value))
                            throw 0;
                        if (!(failure.value))
                            throw 0;
                        if (!(failure.value === 'error'))
                            throw 0;
                        return (load(String(route.value.params.id)));
                        // @ts-ignore
                        [failure, route,];
                    } },
                type: "button",
                ...{ class: "rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white transition motion-reduce:transition-none hover:bg-white/15" },
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['motion-reduce:transition-none']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
            (__VLS_unwrap(t, {})('home.retry'));
        }
    }
    else if (item.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "relative overflow-hidden" },
            'aria-label': (item.value.title),
        });
        /** @type {__VLS_StyleScopedClasses['relative']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
        if (item.value.backdrop !== null) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "absolute inset-0" },
            });
            /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
            /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
            const __VLS_48 = AuthImage;
            // @ts-ignore
            const __VLS_49 = __VLS_asFunctionalComponent1(__VLS_48, new __VLS_48({
                // @ts-ignore
                scope: "library", itemId: (item.value.id), index: (item.value.backdrop), version: (item.value.updatedAt), width: (1600), alt: "", imgClass: "size-full object-cover object-top",
            }));
            const __VLS_50 = __VLS_49({
                scope: "library",
                itemId: (item.value.id),
                index: (item.value.backdrop),
                version: (item.value.updatedAt),
                width: (1600),
                alt: "",
                imgClass: "size-full object-cover object-top",
            }, ...__VLS_functionalComponentArgsRest(__VLS_49));
        }
        else if (isMusic.value) {
            const __VLS_53 = MusicBanner;
            // @ts-ignore
            const __VLS_54 = __VLS_asFunctionalComponent1(__VLS_53, new __VLS_53({
                // @ts-ignore
                seed: (item.value.id),
            }));
            const __VLS_55 = __VLS_54({
                seed: (item.value.id),
            }, ...__VLS_functionalComponentArgsRest(__VLS_54));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "absolute inset-0 bg-gradient-to-t from-flixer-background" },
            ...{ class: (usesBanner.value ? 'via-flixer-background/10 to-transparent' : 'via-flixer-background/70 to-flixer-background/30') },
        });
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-gradient-to-t']} */ ;
        /** @type {__VLS_StyleScopedClasses['from-flixer-background']} */ ;
        if (!usesBanner.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "absolute inset-0 bg-gradient-to-r from-flixer-background/90 via-flixer-background/40 to-transparent" },
            });
            /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
            /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-gradient-to-r']} */ ;
            /** @type {__VLS_StyleScopedClasses['from-flixer-background/90']} */ ;
            /** @type {__VLS_StyleScopedClasses['via-flixer-background/40']} */ ;
            /** @type {__VLS_StyleScopedClasses['to-transparent']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "relative page-gutter flex flex-col gap-8 pb-10 pt-32 sm:flex-row sm:items-end sm:pt-44" },
            ...{ class: (isPortraitOnly.value && !usesBanner.value ? 'bg-flixer-surface/20' : '') },
        });
        /** @type {__VLS_StyleScopedClasses['relative']} */ ;
        /** @type {__VLS_StyleScopedClasses['page-gutter']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-8']} */ ;
        /** @type {__VLS_StyleScopedClasses['pb-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['pt-32']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:flex-row']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:items-end']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:pt-44']} */ ;
        if (isMusic.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "aspect-square w-40 shrink-0 overflow-hidden rounded border border-flixer-border bg-flixer-surface shadow-2xl shadow-black/60 sm:w-56" },
            });
            /** @type {__VLS_StyleScopedClasses['aspect-square']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-40']} */ ;
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
            /** @type {__VLS_StyleScopedClasses['shadow-2xl']} */ ;
            /** @type {__VLS_StyleScopedClasses['shadow-black/60']} */ ;
            /** @type {__VLS_StyleScopedClasses['sm:w-56']} */ ;
            if (cover.value) {
                const __VLS_58 = AuthImage;
                // @ts-ignore
                const __VLS_59 = __VLS_asFunctionalComponent1(__VLS_58, new __VLS_58({
                    // @ts-ignore
                    scope: "library", itemId: (cover.value.itemId), index: (cover.value.index), version: (cover.value.version), width: (320), alt: (item.value.title),
                }));
                const __VLS_60 = __VLS_59({
                    scope: "library",
                    itemId: (cover.value.itemId),
                    index: (cover.value.index),
                    version: (cover.value.version),
                    width: (320),
                    alt: (item.value.title),
                }, ...__VLS_functionalComponentArgsRest(__VLS_59));
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "grid size-full place-items-center p-4 text-center text-sm font-medium text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['grid']} */ ;
                /** @type {__VLS_StyleScopedClasses['size-full']} */ ;
                /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (item.value.title);
            }
        }
        else if (item.value.poster !== null || item.value.backdrop === null) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "aspect-[2/3] w-40 shrink-0 overflow-hidden rounded border border-flixer-border bg-flixer-surface shadow-2xl shadow-black/60 sm:w-56" },
            });
            /** @type {__VLS_StyleScopedClasses['aspect-[2/3]']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-40']} */ ;
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
            /** @type {__VLS_StyleScopedClasses['shadow-2xl']} */ ;
            /** @type {__VLS_StyleScopedClasses['shadow-black/60']} */ ;
            /** @type {__VLS_StyleScopedClasses['sm:w-56']} */ ;
            if (item.value.poster !== null) {
                const __VLS_63 = AuthImage;
                // @ts-ignore
                const __VLS_64 = __VLS_asFunctionalComponent1(__VLS_63, new __VLS_63({
                    // @ts-ignore
                    scope: "library", itemId: (item.value.id), index: (item.value.poster), version: (item.value.updatedAt), width: (320), alt: (item.value.title),
                }));
                const __VLS_65 = __VLS_64({
                    scope: "library",
                    itemId: (item.value.id),
                    index: (item.value.poster),
                    version: (item.value.updatedAt),
                    width: (320),
                    alt: (item.value.title),
                }, ...__VLS_functionalComponentArgsRest(__VLS_64));
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "grid size-full place-items-center p-4 text-center text-sm font-medium text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['grid']} */ ;
                /** @type {__VLS_StyleScopedClasses['size-full']} */ ;
                /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (item.value.title);
            }
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "min-w-0 max-w-3xl" },
        });
        /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['max-w-3xl']} */ ;
        if (item.value.parent) {
            let __VLS_68;
            /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
            RouterLink;
            // @ts-ignore
            const __VLS_69 = __VLS_asFunctionalComponent1(__VLS_68, new __VLS_68({
                // @ts-ignore
                to: ({ name: 'media-item', params: { id: item.value.parent.id } }), ...{ class: "text-sm font-medium text-flixer-accent hover:underline" },
            }));
            const __VLS_70 = __VLS_69({
                to: ({ name: 'media-item', params: { id: item.value.parent.id } }),
                ...{ class: "text-sm font-medium text-flixer-accent hover:underline" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_69));
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:underline']} */ ;
            var __VLS_71;
            const { default: __VLS_73 } = __VLS_nonNull(__VLS_71.slots);
            (item.value.parent.title);
            // @ts-ignore
            [t, item, item, item, item, item, item, item, item, item, item, item, item, item, item, item, item, item, item, item, item, isMusic, isMusic, usesBanner, usesBanner, usesBanner, isPortraitOnly, cover, cover, cover, cover,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex flex-wrap items-center gap-3" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
            ...{ class: "mt-1 break-words text-4xl font-bold text-white drop-shadow-lg sm:text-5xl" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['break-words']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-4xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['drop-shadow-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:text-5xl']} */ ;
        (item.value.title);
        if (themeMusic.value.available.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (themeMusic.value.toggle) },
                type: "button",
                ...{ class: "mt-1 grid size-10 shrink-0 place-items-center rounded-full border border-white/20 bg-black/35 text-white/80 backdrop-blur transition motion-reduce:transition-none hover:border-white/40 hover:bg-black/55 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" },
                'aria-label': (__VLS_unwrap(t, {})(themeMusic.value.playing.value ? 'mediaItem.themeMusicStop' : 'mediaItem.themeMusicPlay')),
                'aria-pressed': (themeMusic.value.playing.value),
                title: (__VLS_unwrap(t, {})(themeMusic.value.playing.value ? 'mediaItem.themeMusicStop' : 'mediaItem.themeMusicPlay')),
            });
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['size-10']} */ ;
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-white/20']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-black/35']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white/80']} */ ;
            /** @type {__VLS_StyleScopedClasses['backdrop-blur']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['motion-reduce:transition-none']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:border-white/40']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-black/55']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-offset-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
            let __VLS_74;
            /** @ts-ignore @type { | typeof __VLS_components.Icon} */
            Icon;
            // @ts-ignore
            const __VLS_75 = __VLS_asFunctionalComponent1(__VLS_74, new __VLS_74({
                // @ts-ignore
                icon: (themeMusic.value.playing.value ? 'lucide:pause' : 'lucide:volume-2'), ...{ class: "size-5" }, 'aria-hidden': "true",
            }));
            const __VLS_76 = __VLS_75({
                icon: (themeMusic.value.playing.value ? 'lucide:pause' : 'lucide:volume-2'),
                ...{ class: "size-5" },
                'aria-hidden': "true",
            }, ...__VLS_functionalComponentArgsRest(__VLS_75));
            /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
        }
        if (item.value.tagline) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mt-2 text-base italic text-flixer-text/80" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-base']} */ ;
            /** @type {__VLS_StyleScopedClasses['italic']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-text/80']} */ ;
            (item.value.tagline);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-4 flex flex-wrap items-center gap-3 text-sm" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "font-medium text-white" },
        });
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        (__VLS_unwrap(t, {})(`home.itemType.${item.value.type}`));
        if (item.value.year) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (item.value.year);
        }
        if (item.value.rating) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "rounded border border-white/40 px-1.5 py-0.5 text-xs" },
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-white/40']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-1.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            (item.value.rating);
        }
        if (item.value.runtimeMinutes) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (runtime(item.value.runtimeMinutes));
        }
        if (item.value.artist && item.value.artistId) {
            let __VLS_79;
            /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
            RouterLink;
            // @ts-ignore
            const __VLS_80 = __VLS_asFunctionalComponent1(__VLS_79, new __VLS_79({
                // @ts-ignore
                to: ({ name: 'person', params: { id: item.value.artistId } }), ...{ class: "text-flixer-muted hover:text-white hover:underline" },
            }));
            const __VLS_81 = __VLS_80({
                to: ({ name: 'person', params: { id: item.value.artistId } }),
                ...{ class: "text-flixer-muted hover:text-white hover:underline" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_80));
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:underline']} */ ;
            var __VLS_82;
            const { default: __VLS_84 } = __VLS_nonNull(__VLS_82.slots);
            (item.value.artist);
            // @ts-ignore
            [t, t, t, item, item, item, item, item, item, item, item, item, item, item, item, item, item, themeMusic, themeMusic, themeMusic, themeMusic, themeMusic, themeMusic,];
        }
        const __VLS_85 = __VLS_tryAsConstant((__VLS_unwrap(ratings, {})));
        for (const [[source, value]] of __VLS_vFor(__VLS_nonNull(__VLS_85))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                key: (source),
                ...{ class: "text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (source.toUpperCase());
            (value.toFixed(1));
            // @ts-ignore
            [ratings,];
        }
        if (item.value.genres.length > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
                ...{ class: "mt-3 flex flex-wrap gap-2" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            const __VLS_86 = __VLS_tryAsConstant((item.value.genres));
            for (const [genre] of __VLS_vFor(__VLS_nonNull(__VLS_86))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                    key: (genre),
                    ...{ class: "rounded border border-white/20 bg-white/10 px-3 py-1 text-xs text-white" },
                });
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['border']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-white/20']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                (genre);
                // @ts-ignore
                [item, item,];
            }
        }
        if (item.value.overview) {
            const __VLS_87 = ClampedText;
            // @ts-ignore
            const __VLS_88 = __VLS_asFunctionalComponent1(__VLS_87, new __VLS_87({
                // @ts-ignore
                ...{ class: "mt-4" }, text: (item.value.overview), title: (item.value.title),
            }));
            const __VLS_89 = __VLS_88({
                ...{ class: "mt-4" },
                text: (item.value.overview),
                title: (item.value.title),
            }, ...__VLS_functionalComponentArgsRest(__VLS_88));
            /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mt-4 text-sm text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('mediaItem.noOverview'));
        }
        if (quality.value.length > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mt-4 text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (quality.value.join(' · '));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-6 flex flex-wrap items-center gap-3" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        if (isAlbum.value && item.value.children.length > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!!(isLoading.value))
                            throw 0;
                        if (!!(failure.value))
                            throw 0;
                        if (!(item.value))
                            throw 0;
                        if (!(isAlbum.value && item.value.children.length > 0))
                            throw 0;
                        return (playAlbum());
                        // @ts-ignore
                        [t, item, item, item, item, quality, quality, isAlbum,];
                    } },
                type: "button",
                ...{ class: "inline-flex items-center gap-2 rounded bg-white px-6 py-3 text-sm font-bold text-flixer-background transition motion-reduce:transition-none hover:bg-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
            });
            /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-background']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['motion-reduce:transition-none']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/85']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
            let __VLS_92;
            /** @ts-ignore @type { | typeof __VLS_components.Icon} */
            Icon;
            // @ts-ignore
            const __VLS_93 = __VLS_asFunctionalComponent1(__VLS_92, new __VLS_92({
                // @ts-ignore
                icon: "lucide:play", ...{ class: "size-5" }, 'aria-hidden': "true",
            }));
            const __VLS_94 = __VLS_93({
                icon: "lucide:play",
                ...{ class: "size-5" },
                'aria-hidden': "true",
            }, ...__VLS_functionalComponentArgsRest(__VLS_93));
            /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
            (__VLS_unwrap(t, {})('music.playAlbum'));
        }
        else if (isTrack.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!!(isLoading.value))
                            throw 0;
                        if (!!(failure.value))
                            throw 0;
                        if (!(item.value))
                            throw 0;
                        if (!!(isAlbum.value && item.value.children.length > 0))
                            throw 0;
                        if (!(isTrack.value))
                            throw 0;
                        return (playTrackPage());
                        // @ts-ignore
                        [t, isTrack,];
                    } },
                type: "button",
                ...{ class: "inline-flex items-center gap-2 rounded bg-white px-6 py-3 text-sm font-bold text-flixer-background transition motion-reduce:transition-none hover:bg-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
            });
            /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-background']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['motion-reduce:transition-none']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/85']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
            let __VLS_97;
            /** @ts-ignore @type { | typeof __VLS_components.Icon} */
            Icon;
            // @ts-ignore
            const __VLS_98 = __VLS_asFunctionalComponent1(__VLS_97, new __VLS_97({
                // @ts-ignore
                icon: "lucide:play", ...{ class: "size-5" }, 'aria-hidden': "true",
            }));
            const __VLS_99 = __VLS_98({
                icon: "lucide:play",
                ...{ class: "size-5" },
                'aria-hidden': "true",
            }, ...__VLS_functionalComponentArgsRest(__VLS_98));
            /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
            (__VLS_unwrap(t, {})('mediaItem.play'));
        }
        if (playTarget.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!!(isLoading.value))
                            throw 0;
                        if (!!(failure.value))
                            throw 0;
                        if (!(item.value))
                            throw 0;
                        if (!(playTarget.value))
                            throw 0;
                        return (play(playTarget.value));
                        // @ts-ignore
                        [t, playTarget, playTarget,];
                    } },
                type: "button",
                ...{ class: "inline-flex items-center gap-2 rounded bg-white px-6 py-3 text-sm font-bold text-flixer-background transition motion-reduce:transition-none hover:bg-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
            });
            /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-background']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['motion-reduce:transition-none']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/85']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
            let __VLS_102;
            /** @ts-ignore @type { | typeof __VLS_components.Icon} */
            Icon;
            // @ts-ignore
            const __VLS_103 = __VLS_asFunctionalComponent1(__VLS_102, new __VLS_102({
                // @ts-ignore
                icon: "lucide:play", ...{ class: "size-5" }, 'aria-hidden': "true",
            }));
            const __VLS_104 = __VLS_103({
                icon: "lucide:play",
                ...{ class: "size-5" },
                'aria-hidden': "true",
            }, ...__VLS_functionalComponentArgsRest(__VLS_103));
            /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
            (__VLS_unwrap(t, {})('mediaItem.play'));
        }
        if (canFavorite.value) {
            const __VLS_107 = FavoriteToggle;
            // @ts-ignore
            const __VLS_108 = __VLS_asFunctionalComponent1(__VLS_107, new __VLS_107({
                // @ts-ignore
                itemId: (item.value.id),
            }));
            const __VLS_109 = __VLS_108({
                itemId: (item.value.id),
            }, ...__VLS_functionalComponentArgsRest(__VLS_108));
        }
        if (partyItemId.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (startParty) },
                type: "button",
                ...{ class: "inline-flex items-center gap-2 rounded border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition motion-reduce:transition-none hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent disabled:cursor-wait disabled:opacity-60" },
                disabled: (__VLS_unwrap(partyBusy, {})),
            });
            /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-white/30']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-5']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['motion-reduce:transition-none']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/20']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
            /** @type {__VLS_StyleScopedClasses['disabled:cursor-wait']} */ ;
            /** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
            (__VLS_unwrap(t, {})(isTrack.value ? 'party.startListen' : 'party.startWatch'));
        }
        if (isMusic.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!!(isLoading.value))
                            throw 0;
                        if (!!(failure.value))
                            throw 0;
                        if (!(item.value))
                            throw 0;
                        if (!(isMusic.value))
                            throw 0;
                        return (addToPlaylist(item.value.id, item.value.title, isAlbum.value));
                        // @ts-ignore
                        [t, t, item, item, item, isMusic, isAlbum, isTrack, canFavorite, partyItemId, partyBusy,];
                    } },
                type: "button",
                ...{ class: "inline-flex items-center gap-2 rounded border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition motion-reduce:transition-none hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
            });
            /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-white/30']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-5']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['motion-reduce:transition-none']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/20']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
            (__VLS_unwrap(t, {})('social.addToPlaylist'));
        }
        if (canMarkWatched.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!!(isLoading.value))
                            throw 0;
                        if (!!(failure.value))
                            throw 0;
                        if (!(item.value))
                            throw 0;
                        if (!(canMarkWatched.value))
                            throw 0;
                        return (toggleWatched(item.value.id, !itemWatched.value));
                        // @ts-ignore
                        [t, item, canMarkWatched, itemWatched,];
                    } },
                type: "button",
                ...{ class: "inline-flex items-center gap-2 rounded border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition motion-reduce:transition-none hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
                'aria-pressed': (itemWatched.value),
            });
            /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-white/30']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-5']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['motion-reduce:transition-none']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/20']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
            (itemWatched.value ? __VLS_unwrap(t, {})('mediaItem.markUnwatched') : __VLS_unwrap(t, {})('mediaItem.markWatched'));
        }
        if (canManageSubtitles.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (manageSubtitles) },
                type: "button",
                ...{ class: "inline-flex items-center gap-2 rounded border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition motion-reduce:transition-none hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
            });
            /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-white/30']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-5']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['motion-reduce:transition-none']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/20']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
            let __VLS_112;
            /** @ts-ignore @type { | typeof __VLS_components.Icon} */
            Icon;
            // @ts-ignore
            const __VLS_113 = __VLS_asFunctionalComponent1(__VLS_112, new __VLS_112({
                // @ts-ignore
                icon: "lucide:captions", ...{ class: "size-5" }, 'aria-hidden': "true",
            }));
            const __VLS_114 = __VLS_113({
                icon: "lucide:captions",
                ...{ class: "size-5" },
                'aria-hidden': "true",
            }, ...__VLS_functionalComponentArgsRest(__VLS_113));
            /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
            (__VLS_unwrap(t, {})('subtitles.manage'));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "space-y-10 pt-4" },
        });
        /** @type {__VLS_StyleScopedClasses['space-y-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['pt-4']} */ ;
        if (playTarget.value && item.value.chapters.length > 0 && PLAYABLE.value.includes(item.value.type)) {
            const __VLS_117 = MediaRow || MediaRow;
            // @ts-ignore
            const __VLS_118 = __VLS_asFunctionalComponent1(__VLS_117, new __VLS_117({
                // @ts-ignore
                title: (__VLS_unwrap(t, {})('mediaItem.chapters')),
            }));
            const __VLS_119 = __VLS_118({
                title: (__VLS_unwrap(t, {})('mediaItem.chapters')),
            }, ...__VLS_functionalComponentArgsRest(__VLS_118));
            var __VLS_120;
            const { default: __VLS_122 } = __VLS_nonNull(__VLS_120.slots);
            const __VLS_123 = __VLS_tryAsConstant((item.value.chapters));
            for (const [chapter, index] of __VLS_vFor(__VLS_nonNull(__VLS_123))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                    key: (chapter.startMs),
                    ...{ class: "shrink-0 snap-start" },
                });
                /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['snap-start']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!!(isLoading.value))
                                throw 0;
                            if (!!(failure.value))
                                throw 0;
                            if (!(item.value))
                                throw 0;
                            if (!(playTarget.value && item.value.chapters.length > 0 && PLAYABLE.value.includes(item.value.type)))
                                throw 0;
                            return (play({ ...playTarget.value, startAt: chapter.startMs / 1000 }));
                            // @ts-ignore
                            [t, t, t, t, item, item, item, playTarget, playTarget, itemWatched, itemWatched, canManageSubtitles, PLAYABLE,];
                        } },
                    type: "button",
                    ...{ class: "group relative block aspect-video w-56 overflow-hidden rounded border border-flixer-border bg-flixer-surface text-left transition duration-300 hover:-translate-y-1 hover:border-white/30 hover:shadow-xl hover:shadow-black/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent sm:w-64" },
                    ...{ style: (chapterThumbStyle(chapter.startMs)) },
                });
                /** @type {__VLS_StyleScopedClasses['group']} */ ;
                /** @type {__VLS_StyleScopedClasses['relative']} */ ;
                /** @type {__VLS_StyleScopedClasses['block']} */ ;
                /** @type {__VLS_StyleScopedClasses['aspect-video']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-56']} */ ;
                /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['border']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
                /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                /** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:-translate-y-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:border-white/30']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:shadow-xl']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:shadow-black/50']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline-offset-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
                /** @type {__VLS_StyleScopedClasses['sm:w-64']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span)({
                    ...{ class: "absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" },
                });
                /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
                /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-gradient-to-t']} */ ;
                /** @type {__VLS_StyleScopedClasses['from-black/85']} */ ;
                /** @type {__VLS_StyleScopedClasses['via-black/20']} */ ;
                /** @type {__VLS_StyleScopedClasses['to-transparent']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "absolute inset-x-0 bottom-0 p-3" },
                });
                /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
                /** @type {__VLS_StyleScopedClasses['inset-x-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['bottom-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "block truncate text-sm font-semibold text-white" },
                });
                /** @type {__VLS_StyleScopedClasses['block']} */ ;
                /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                (chapter.title || __VLS_unwrap(t, {})('mediaItem.chapterN', { n: index + 1 }));
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "block font-mono text-xs text-white/70" },
                });
                /** @type {__VLS_StyleScopedClasses['block']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-white/70']} */ ;
                (chapterTime(chapter.startMs));
                // @ts-ignore
                [t,];
            }
            // @ts-ignore
            [];
        }
        if (isShow.value && seasons.value.length > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
                'aria-label': (__VLS_unwrap(t, {})('mediaItem.seasons')),
                ...{ class: "page-gutter" },
            });
            /** @type {__VLS_StyleScopedClasses['page-gutter']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
                ...{ class: "mb-3 text-xl font-semibold text-white" },
            });
            /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            (__VLS_unwrap(t, {})('mediaItem.seasons'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex flex-wrap gap-2" },
                role: "tablist",
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            const __VLS_124 = __VLS_tryAsConstant((seasons.value));
            for (const [season, index] of __VLS_vFor(__VLS_nonNull(__VLS_124))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!!(isLoading.value))
                                throw 0;
                            if (!!(failure.value))
                                throw 0;
                            if (!(item.value))
                                throw 0;
                            if (!(isShow.value && seasons.value.length > 0))
                                throw 0;
                            return (activeSeason.value = index);
                            // @ts-ignore
                            [t, t, isShow, seasons, seasons, activeSeason,];
                        } },
                    key: (season.id),
                    type: "button",
                    role: "tab",
                    'aria-selected': (index === activeSeason.value),
                    ...{ class: "rounded px-4 py-2 text-sm font-semibold transition" },
                    ...{ class: (index === activeSeason.value ? 'bg-white text-flixer-background' : 'bg-white/10 text-white hover:bg-white/15') },
                });
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                (seasonLabel(season));
                // @ts-ignore
                [activeSeason, activeSeason,];
            }
        }
        if (episodes.value.length > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
                'aria-label': (__VLS_unwrap(listTitle, {})),
                ...{ class: "page-gutter" },
            });
            /** @type {__VLS_StyleScopedClasses['page-gutter']} */ ;
            if (!isShow.value) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
                    ...{ class: "mb-3 text-xl font-semibold text-white" },
                });
                /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                (__VLS_unwrap(listTitle, {}));
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
                ...{ class: "divide-y divide-flixer-border overflow-hidden rounded border border-flixer-border bg-flixer-surface/40" },
            });
            /** @type {__VLS_StyleScopedClasses['divide-y']} */ ;
            /** @type {__VLS_StyleScopedClasses['divide-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/40']} */ ;
            const __VLS_125 = __VLS_tryAsConstant((episodes.value));
            for (const [episode] of __VLS_vFor(__VLS_nonNull(__VLS_125))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                    key: (episode.id),
                    ...{ class: "flex items-center transition motion-reduce:transition-none hover:bg-white/5" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                /** @type {__VLS_StyleScopedClasses['motion-reduce:transition-none']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:bg-white/5']} */ ;
                let __VLS_126;
                /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
                RouterLink;
                // @ts-ignore
                const __VLS_127 = __VLS_asFunctionalComponent1(__VLS_126, new __VLS_126({
                    // @ts-ignore
                    to: ({ name: 'media-item', params: { id: episode.id } }), ...{ class: "flex min-w-0 flex-1 items-center gap-4 p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
                }));
                const __VLS_128 = __VLS_127({
                    to: ({ name: 'media-item', params: { id: episode.id } }),
                    ...{ class: "flex min-w-0 flex-1 items-center gap-4 p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_127));
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
                var __VLS_129;
                const { default: __VLS_131 } = __VLS_nonNull(__VLS_129.slots);
                if (episode.type !== 'track') {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "aspect-video w-32 shrink-0 overflow-hidden rounded bg-flixer-surface sm:w-44" },
                    });
                    /** @type {__VLS_StyleScopedClasses['aspect-video']} */ ;
                    /** @type {__VLS_StyleScopedClasses['w-32']} */ ;
                    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                    /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
                    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                    /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
                    /** @type {__VLS_StyleScopedClasses['sm:w-44']} */ ;
                    if (episode.thumb !== null) {
                        const __VLS_132 = AuthImage;
                        // @ts-ignore
                        const __VLS_133 = __VLS_asFunctionalComponent1(__VLS_132, new __VLS_132({
                            // @ts-ignore
                            scope: "library", itemId: (episode.id), index: (episode.thumb), version: (episode.updatedAt), width: (320), alt: "",
                        }));
                        const __VLS_134 = __VLS_133({
                            scope: "library",
                            itemId: (episode.id),
                            index: (episode.thumb),
                            version: (episode.updatedAt),
                            width: (320),
                            alt: "",
                        }, ...__VLS_functionalComponentArgsRest(__VLS_133));
                    }
                }
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
                (episodeLabel(episode));
                if (episode.runtimeMinutes) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                        ...{ class: "text-xs text-flixer-muted" },
                    });
                    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                    (runtime(episode.runtimeMinutes));
                }
                if (episode.overview) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                        ...{ class: "mt-1 line-clamp-2 text-xs text-flixer-text/80" },
                    });
                    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
                    /** @type {__VLS_StyleScopedClasses['line-clamp-2']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-flixer-text/80']} */ ;
                    (episode.overview);
                }
                // @ts-ignore
                [isShow, episodes, episodes, listTitle, listTitle,];
                if (WATCHABLE.value.includes(episode.type)) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                void $event;
                                if (!!(isLoading.value))
                                    throw 0;
                                if (!!(failure.value))
                                    throw 0;
                                if (!(item.value))
                                    throw 0;
                                if (!(episodes.value.length > 0))
                                    throw 0;
                                if (!(WATCHABLE.value.includes(episode.type)))
                                    throw 0;
                                return (toggleWatched(episode.id, !episode.watched));
                                // @ts-ignore
                                [WATCHABLE,];
                            } },
                        type: "button",
                        ...{ class: "mr-2 grid size-10 shrink-0 place-items-center rounded transition motion-reduce:transition-none hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
                        ...{ class: (episode.watched ? 'text-flixer-accent' : 'text-white/50') },
                        'aria-pressed': (episode.watched),
                        'aria-label': (episode.watched ? __VLS_unwrap(t, {})('mediaItem.markUnwatched') : __VLS_unwrap(t, {})('mediaItem.markWatched')),
                        title: (episode.watched ? __VLS_unwrap(t, {})('mediaItem.markUnwatched') : __VLS_unwrap(t, {})('mediaItem.markWatched')),
                    });
                    /** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
                    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
                    /** @type {__VLS_StyleScopedClasses['size-10']} */ ;
                    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                    /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
                    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                    /** @type {__VLS_StyleScopedClasses['motion-reduce:transition-none']} */ ;
                    /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
                    let __VLS_137;
                    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
                    Icon;
                    // @ts-ignore
                    const __VLS_138 = __VLS_asFunctionalComponent1(__VLS_137, new __VLS_137({
                        // @ts-ignore
                        icon: "lucide:check", ...{ class: "size-5" }, 'aria-hidden': "true",
                    }));
                    const __VLS_139 = __VLS_138({
                        icon: "lucide:check",
                        ...{ class: "size-5" },
                        'aria-hidden': "true",
                    }, ...__VLS_functionalComponentArgsRest(__VLS_138));
                    /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
                }
                if (episode.type === 'track') {
                    const __VLS_142 = FavoriteToggle;
                    // @ts-ignore
                    const __VLS_143 = __VLS_asFunctionalComponent1(__VLS_142, new __VLS_142({
                        // @ts-ignore
                        itemId: (episode.id), compact: (true), ...{ class: "mr-1" },
                    }));
                    const __VLS_144 = __VLS_143({
                        itemId: (episode.id),
                        compact: (true),
                        ...{ class: "mr-1" },
                    }, ...__VLS_functionalComponentArgsRest(__VLS_143));
                    /** @type {__VLS_StyleScopedClasses['mr-1']} */ ;
                }
                if (episode.type === 'track') {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                void $event;
                                if (!!(isLoading.value))
                                    throw 0;
                                if (!!(failure.value))
                                    throw 0;
                                if (!(item.value))
                                    throw 0;
                                if (!(episodes.value.length > 0))
                                    throw 0;
                                if (!(episode.type === 'track'))
                                    throw 0;
                                return (addToPlaylist(episode.id, episode.title));
                                // @ts-ignore
                                [t, t, t, t,];
                            } },
                        type: "button",
                        ...{ class: "mr-1 grid size-10 shrink-0 place-items-center rounded bg-white/10 text-white transition motion-reduce:transition-none hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
                        'aria-label': (__VLS_unwrap(t, {})('social.addToPlaylistFor', { title: episode.title })),
                        title: (__VLS_unwrap(t, {})('social.addToPlaylist')),
                    });
                    /** @type {__VLS_StyleScopedClasses['mr-1']} */ ;
                    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
                    /** @type {__VLS_StyleScopedClasses['size-10']} */ ;
                    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                    /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
                    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                    /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                    /** @type {__VLS_StyleScopedClasses['motion-reduce:transition-none']} */ ;
                    /** @type {__VLS_StyleScopedClasses['hover:bg-white/20']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
                    let __VLS_147;
                    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
                    Icon;
                    // @ts-ignore
                    const __VLS_148 = __VLS_asFunctionalComponent1(__VLS_147, new __VLS_147({
                        // @ts-ignore
                        icon: "lucide:plus", ...{ class: "size-5" }, 'aria-hidden': "true",
                    }));
                    const __VLS_149 = __VLS_148({
                        icon: "lucide:plus",
                        ...{ class: "size-5" },
                        'aria-hidden': "true",
                    }, ...__VLS_functionalComponentArgsRest(__VLS_148));
                    /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
                }
                if (episode.type === 'track') {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                void $event;
                                if (!!(isLoading.value))
                                    throw 0;
                                if (!!(failure.value))
                                    throw 0;
                                if (!(item.value))
                                    throw 0;
                                if (!(episodes.value.length > 0))
                                    throw 0;
                                if (!(episode.type === 'track'))
                                    throw 0;
                                return (playAlbum(episode.id));
                                // @ts-ignore
                                [t, t,];
                            } },
                        type: "button",
                        ...{ class: "mr-3 grid size-10 shrink-0 place-items-center rounded bg-white/10 text-white transition motion-reduce:transition-none hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
                        'aria-label': (__VLS_unwrap(t, {})('music.playTrack', { title: episode.title })),
                    });
                    /** @type {__VLS_StyleScopedClasses['mr-3']} */ ;
                    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
                    /** @type {__VLS_StyleScopedClasses['size-10']} */ ;
                    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                    /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
                    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                    /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                    /** @type {__VLS_StyleScopedClasses['motion-reduce:transition-none']} */ ;
                    /** @type {__VLS_StyleScopedClasses['hover:bg-white/20']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
                    let __VLS_152;
                    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
                    Icon;
                    // @ts-ignore
                    const __VLS_153 = __VLS_asFunctionalComponent1(__VLS_152, new __VLS_152({
                        // @ts-ignore
                        icon: "lucide:play", ...{ class: "size-5" }, 'aria-hidden': "true",
                    }));
                    const __VLS_154 = __VLS_153({
                        icon: "lucide:play",
                        ...{ class: "size-5" },
                        'aria-hidden': "true",
                    }, ...__VLS_functionalComponentArgsRest(__VLS_153));
                    /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
                }
                else if (PLAYABLE.value.includes(episode.type)) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                void $event;
                                if (!!(isLoading.value))
                                    throw 0;
                                if (!!(failure.value))
                                    throw 0;
                                if (!(item.value))
                                    throw 0;
                                if (!(episodes.value.length > 0))
                                    throw 0;
                                if (!!(episode.type === 'track'))
                                    throw 0;
                                if (!(PLAYABLE.value.includes(episode.type)))
                                    throw 0;
                                return (play({ id: episode.id, title: playerTitle(episode, episode.seasonNumber ?? item.value.seasonNumber ?? seasons.value[activeSeason.value]?.seasonNumber ?? null) }));
                                // @ts-ignore
                                [t, item, PLAYABLE, seasons, activeSeason,];
                            } },
                        type: "button",
                        ...{ class: "mr-3 grid size-10 shrink-0 place-items-center rounded bg-white/10 text-white transition motion-reduce:transition-none hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
                        'aria-label': (`${__VLS_unwrap(t, {})('mediaItem.play')} ${episode.title}`),
                    });
                    /** @type {__VLS_StyleScopedClasses['mr-3']} */ ;
                    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
                    /** @type {__VLS_StyleScopedClasses['size-10']} */ ;
                    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                    /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
                    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                    /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                    /** @type {__VLS_StyleScopedClasses['motion-reduce:transition-none']} */ ;
                    /** @type {__VLS_StyleScopedClasses['hover:bg-white/20']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
                    let __VLS_157;
                    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
                    Icon;
                    // @ts-ignore
                    const __VLS_158 = __VLS_asFunctionalComponent1(__VLS_157, new __VLS_157({
                        // @ts-ignore
                        icon: "lucide:play", ...{ class: "size-5" }, 'aria-hidden': "true",
                    }));
                    const __VLS_159 = __VLS_158({
                        icon: "lucide:play",
                        ...{ class: "size-5" },
                        'aria-hidden': "true",
                    }, ...__VLS_functionalComponentArgsRest(__VLS_158));
                    /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
                }
                // @ts-ignore
                [t,];
            }
        }
        if (item.value.cast.length > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
                'aria-label': (__VLS_unwrap(t, {})('mediaItem.cast')),
                ...{ class: "page-gutter" },
            });
            /** @type {__VLS_StyleScopedClasses['page-gutter']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
                ...{ class: "mb-3 text-xl font-semibold text-white" },
            });
            /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            (__VLS_unwrap(t, {})('mediaItem.cast'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
                ...{ class: "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" },
            });
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['sm:grid-cols-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['lg:grid-cols-4']} */ ;
            const __VLS_162 = __VLS_tryAsConstant((item.value.cast));
            for (const [person] of __VLS_vFor(__VLS_nonNull(__VLS_162))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                    key: (`${person.name}-${person.role}`),
                    ...{ class: "flex items-center gap-3 rounded border border-flixer-border bg-flixer-surface/40 px-3 py-2" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['border']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/40']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
                const __VLS_163 = PersonAvatar;
                // @ts-ignore
                const __VLS_164 = __VLS_asFunctionalComponent1(__VLS_163, new __VLS_163({
                    // @ts-ignore
                    personId: (person.id), name: (person.name), hasImage: (person.hasImage), width: (40), ...{ class: "size-10 shrink-0 rounded" },
                }));
                const __VLS_165 = __VLS_164({
                    personId: (person.id),
                    name: (person.name),
                    hasImage: (person.hasImage),
                    width: (40),
                    ...{ class: "size-10 shrink-0 rounded" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_164));
                /** @type {__VLS_StyleScopedClasses['size-10']} */ ;
                /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "min-w-0" },
                });
                /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
                let __VLS_168;
                /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
                RouterLink;
                // @ts-ignore
                const __VLS_169 = __VLS_asFunctionalComponent1(__VLS_168, new __VLS_168({
                    // @ts-ignore
                    to: ({ name: 'person', params: { id: person.id } }), ...{ class: "block truncate text-sm font-medium text-white hover:underline" },
                }));
                const __VLS_170 = __VLS_169({
                    to: ({ name: 'person', params: { id: person.id } }),
                    ...{ class: "block truncate text-sm font-medium text-white hover:underline" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_169));
                /** @type {__VLS_StyleScopedClasses['block']} */ ;
                /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:underline']} */ ;
                var __VLS_171;
                const { default: __VLS_173 } = __VLS_nonNull(__VLS_171.slots);
                (person.name);
                // @ts-ignore
                [t, t, item, item,];
                if (person.role) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                        ...{ class: "truncate text-xs text-flixer-muted" },
                    });
                    /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                    (person.role);
                }
                // @ts-ignore
                [];
            }
        }
        if (item.value.crew.length > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
                'aria-label': (__VLS_unwrap(t, {})('mediaItem.crew')),
                ...{ class: "page-gutter" },
            });
            /** @type {__VLS_StyleScopedClasses['page-gutter']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
                ...{ class: "mb-3 text-xl font-semibold text-white" },
            });
            /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            (__VLS_unwrap(t, {})('mediaItem.crew'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
                ...{ class: "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" },
            });
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['sm:grid-cols-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['lg:grid-cols-4']} */ ;
            const __VLS_174 = __VLS_tryAsConstant((item.value.crew));
            for (const [person] of __VLS_vFor(__VLS_nonNull(__VLS_174))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                    key: (`${person.name}-${person.role}`),
                    ...{ class: "flex items-center gap-3 rounded border border-flixer-border bg-flixer-surface/40 px-3 py-2" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['border']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/40']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
                const __VLS_175 = PersonAvatar;
                // @ts-ignore
                const __VLS_176 = __VLS_asFunctionalComponent1(__VLS_175, new __VLS_175({
                    // @ts-ignore
                    personId: (person.id), name: (person.name), hasImage: (person.hasImage), width: (40), ...{ class: "size-10 shrink-0 rounded" },
                }));
                const __VLS_177 = __VLS_176({
                    personId: (person.id),
                    name: (person.name),
                    hasImage: (person.hasImage),
                    width: (40),
                    ...{ class: "size-10 shrink-0 rounded" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_176));
                /** @type {__VLS_StyleScopedClasses['size-10']} */ ;
                /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "min-w-0" },
                });
                /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
                let __VLS_180;
                /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
                RouterLink;
                // @ts-ignore
                const __VLS_181 = __VLS_asFunctionalComponent1(__VLS_180, new __VLS_180({
                    // @ts-ignore
                    to: ({ name: 'person', params: { id: person.id } }), ...{ class: "block truncate text-sm font-medium text-white hover:underline" },
                }));
                const __VLS_182 = __VLS_181({
                    to: ({ name: 'person', params: { id: person.id } }),
                    ...{ class: "block truncate text-sm font-medium text-white hover:underline" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_181));
                /** @type {__VLS_StyleScopedClasses['block']} */ ;
                /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:underline']} */ ;
                var __VLS_183;
                const { default: __VLS_185 } = __VLS_nonNull(__VLS_183.slots);
                (person.name);
                // @ts-ignore
                [t, t, item, item,];
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "truncate text-xs text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (__VLS_unwrap(te, {})(`person.roles.${person.role}`) ? __VLS_unwrap(t, {})(`person.roles.${person.role}`) : person.role);
                // @ts-ignore
                [t, te,];
            }
        }
        if (item.value.studios.length > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
                ...{ class: "page-gutter" },
            });
            /** @type {__VLS_StyleScopedClasses['page-gutter']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
                ...{ class: "mb-1 text-sm font-semibold uppercase tracking-wide text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
            /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('mediaItem.studios'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-sm text-flixer-text/90" },
            });
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-text/90']} */ ;
            (item.value.studios.join(', '));
        }
    }
    const __VLS_186 = MobileTabBar;
    // @ts-ignore
    const __VLS_187 = __VLS_asFunctionalComponent1(__VLS_186, new __VLS_186({
        // @ts-ignore
        tabs: (__VLS_unwrap(mobileTabs, {})),
    }));
    const __VLS_188 = __VLS_187({
        tabs: (__VLS_unwrap(mobileTabs, {})),
    }, ...__VLS_functionalComponentArgsRest(__VLS_187));
    // @ts-ignore
    [t, item, item, mobileTabs,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
