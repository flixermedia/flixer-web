import { openModal } from '@kolirt/vue-modal';
import axios from 'axios';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { deletePlaylist, getPlaylist, removePlaylistItem, reorderPlaylist } from '../api';
import ConfirmModal from '../components/ui/ConfirmModal.vue';
import AuthImage from '../components/ui/AuthImage.vue';
import Header from '../components/header/Header.vue';
import MobileTabBar from '../components/home/MobileTabBar.vue';
import ClampedText from '../components/ui/ClampedText.vue';
import UserAvatar from '../components/ui/UserAvatar.vue';
import MusicBanner from '../components/ui/MusicBanner.vue';
import PlaylistEditorModal from '../components/PlaylistEditorModal.vue';
import { getMobileTabs, getNavLinks } from '../composables/homeNav';
import { useAudioPlayer } from '../composables/useAudioPlayer';
import { useSignOut } from '../composables/useSignOut';
import { catchError } from '../utils/catchError';
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { isSigningOut, signOut } = useSignOut();
const navLinks = computed(getNavLinks);
const mobileTabs = computed(getMobileTabs);
const player = useAudioPlayer();
const playlist = ref(null);
const loading = ref(true);
const missing = ref(false);
const failed = ref(false);
const busy = ref(null);
const tracks = computed(() => playlist.value?.tracks ?? []);
const totalSeconds = computed(() => tracks.value.reduce((sum, track) => sum + (track.durationSeconds ?? 0), 0));
const stats = computed(() => [
    { label: t('social.tracks'), value: tracks.value.length },
    { label: t('social.duration'), value: formatTotal(totalSeconds.value) },
    { label: t('social.artists'), value: new Set(tracks.value.map((track) => track.artist ?? track.subtitle).filter(Boolean)).size },
    { label: t('social.albums'), value: new Set(tracks.value.map((track) => track.album).filter(Boolean)).size },
]);
function formatDuration(seconds) {
    if (!seconds)
        return '';
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}
function formatTotal(seconds) {
    const minutes = Math.round(seconds / 60);
    return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
}
function shuffle() {
    const queue = tracks.value.map(asQueueTrack);
    for (let i = queue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [queue[i], queue[j]] = [queue[j], queue[i]];
    }
    player.playQueue(queue, 0);
}
const owner = computed(() => playlist.value?.isOwner ?? false);
async function load() {
    loading.value = true;
    missing.value = false;
    failed.value = false;
    try {
        const [error, value] = await catchError(getPlaylist(String(route.params.id)));
        if (error) {
            playlist.value = null;
            missing.value = axios.isAxiosError(error) && error.response?.status === 404;
            failed.value = !missing.value;
        }
        else {
            playlist.value = value;
            document.title = `${value.name} · Flixer`;
        }
    }
    finally {
        loading.value = false;
    }
}
function asQueueTrack(track) {
    return { id: track.id, title: track.title, artist: track.artist ?? track.subtitle, artistId: null, album: track.album, albumId: track.albumId, art: track.imageIndex === null ? null : { itemId: track.imageItemId, index: track.imageIndex, version: track.imageUpdatedAt } };
}
function playFrom(index = 0) {
    player.playQueue(tracks.value.map(asQueueTrack), index);
}
async function edit() {
    if (!playlist.value)
        return;
    const result = await openModal(PlaylistEditorModal, { props: { playlist: playlist.value } }).catch(() => null);
    if (result)
        await load();
}
async function confirm(message, label) {
    return openModal(ConfirmModal, { props: { message, confirmLabel: label, danger: true } }).catch(() => false);
}
async function removeTrack(track) {
    if (!playlist.value || busy.value)
        return;
    const ok = await confirm(t('social.removeTrackConfirm', { title: track.title }), t('social.removeTrack'));
    if (!ok)
        return;
    busy.value = track.id;
    try {
        const [error] = await catchError(removePlaylistItem(playlist.value.id, track.id));
        if (error) {
            failed.value = true;
            return;
        }
        playlist.value.tracks = playlist.value.tracks.filter((entry) => entry.id !== track.id);
        playlist.value.trackCount = playlist.value.tracks.length;
        playlist.value.durationSeconds = playlist.value.tracks.reduce((total, entry) => total + (entry.durationSeconds ?? 0), 0);
    }
    finally {
        busy.value = null;
    }
}
async function move(index, direction) {
    if (!playlist.value || !owner.value || busy.value)
        return;
    const target = index + direction;
    if (target < 0 || target >= tracks.value.length)
        return;
    const previous = [...playlist.value.tracks];
    const reordered = [...previous];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    playlist.value.tracks = reordered.map((track, position) => ({ ...track, position }));
    busy.value = 'order';
    try {
        const [error] = await catchError(reorderPlaylist(playlist.value.id, playlist.value.tracks.map((track) => track.id)));
        if (error) {
            playlist.value.tracks = previous;
            failed.value = true;
        }
    }
    finally {
        busy.value = null;
    }
}
async function removePlaylist() {
    if (!playlist.value || !(await confirm(t('social.deletePlaylistConfirm', { name: playlist.value.name }), t('social.deletePlaylist'))))
        return;
    const [error] = await catchError(deletePlaylist(playlist.value.id));
    if (error) {
        failed.value = true;
        return;
    }
    const [navigationError] = await catchError(router.push({ name: 'home' }));
    if (navigationError)
        failed.value = true;
}
watch(() => route.params.id, () => void load(), { immediate: true });
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(loading, {});
    __VLS_withDotValue(missing, {});
    __VLS_withDotValue(failed, {});
    __VLS_withDotValue(playlist, {});
    __VLS_withDotValue(tracks, {});
    __VLS_withDotValue(owner, {});
    __VLS_withDotValue(busy, {});
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
    if (loading.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm text-flixer-muted" },
            role: "status",
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('common.loading'));
    }
    else if (missing.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "mx-auto max-w-2xl rounded border border-flixer-border bg-flixer-surface p-6 text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
        /** @type {__VLS_StyleScopedClasses['max-w-2xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
            ...{ class: "text-xl font-semibold text-white" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        (__VLS_unwrap(t, {})('social.playlistNotFound'));
        let __VLS_7;
        /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
        RouterLink;
        // @ts-ignore
        const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
            // @ts-ignore
            to: "/", ...{ class: "mt-4 inline-block text-sm text-flixer-accent hover:underline" },
        }));
        const __VLS_9 = __VLS_8({
            to: "/",
            ...{ class: "mt-4 inline-block text-sm text-flixer-accent hover:underline" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_8));
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['inline-block']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:underline']} */ ;
        var __VLS_10;
        const { default: __VLS_12 } = __VLS_nonNull(__VLS_10.slots);
        (__VLS_unwrap(t, {})('mediaItem.backHome'));
        // @ts-ignore
        [navLinks, isSigningOut, signOut, loading, t, t, t, missing,];
    }
    else if (failed.value && !playlist.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "mx-auto max-w-2xl rounded border border-flixer-border bg-flixer-surface p-6 text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
        /** @type {__VLS_StyleScopedClasses['max-w-2xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm text-red-400" },
            role: "alert",
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-400']} */ ;
        (__VLS_unwrap(t, {})('social.loadError'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (load) },
            type: "button",
            ...{ class: "mt-4 rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15" },
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
        (__VLS_unwrap(t, {})('home.retry'));
    }
    else if (playlist.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "space-y-6" },
        });
        /** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
            ...{ class: "relative overflow-hidden rounded border border-white/10 bg-flixer-surface/60" },
        });
        /** @type {__VLS_StyleScopedClasses['relative']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/60']} */ ;
        const __VLS_13 = MusicBanner;
        // @ts-ignore
        const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
            // @ts-ignore
            seed: (playlist.value.id),
        }));
        const __VLS_15 = __VLS_14({
            seed: (playlist.value.id),
        }, ...__VLS_functionalComponentArgsRest(__VLS_14));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "absolute inset-0 bg-gradient-to-t from-flixer-background/80 via-flixer-background/30 to-transparent" },
            'aria-hidden': "true",
        });
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-gradient-to-t']} */ ;
        /** @type {__VLS_StyleScopedClasses['from-flixer-background/80']} */ ;
        /** @type {__VLS_StyleScopedClasses['via-flixer-background/30']} */ ;
        /** @type {__VLS_StyleScopedClasses['to-transparent']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6" },
        });
        /** @type {__VLS_StyleScopedClasses['relative']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:flex-row']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:p-6']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "size-32 shrink-0 overflow-hidden rounded bg-flixer-background shadow-lg shadow-black/40 sm:size-40" },
        });
        /** @type {__VLS_StyleScopedClasses['size-32']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-black/40']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:size-40']} */ ;
        if (playlist.value.cover) {
            const __VLS_18 = AuthImage;
            // @ts-ignore
            const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
                // @ts-ignore
                scope: "library", itemId: (playlist.value.cover.itemId), index: (playlist.value.cover.index), version: (playlist.value.cover.updatedAt), width: (320), alt: (playlist.value.name),
            }));
            const __VLS_20 = __VLS_19({
                scope: "library",
                itemId: (playlist.value.cover.itemId),
                index: (playlist.value.cover.index),
                version: (playlist.value.cover.updatedAt),
                width: (320),
                alt: (playlist.value.name),
            }, ...__VLS_functionalComponentArgsRest(__VLS_19));
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "grid size-full place-items-center text-3xl text-flixer-muted" },
                'aria-hidden': "true",
            });
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['size-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "min-w-0 flex-1" },
        });
        /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex flex-wrap items-center gap-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
            ...{ class: "break-words text-2xl font-bold tracking-tight text-white sm:text-4xl" },
        });
        /** @type {__VLS_StyleScopedClasses['break-words']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
        /** @type {__VLS_StyleScopedClasses['tracking-tight']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:text-4xl']} */ ;
        (playlist.value.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "rounded bg-white/10 px-2 py-0.5 text-xs font-semibold text-white/80" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white/80']} */ ;
        (playlist.value.isPublic ? __VLS_unwrap(t, {})('social.public') : __VLS_unwrap(t, {})('social.private'));
        let __VLS_23;
        /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
        RouterLink;
        // @ts-ignore
        const __VLS_24 = __VLS_asFunctionalComponent1(__VLS_23, new __VLS_23({
            // @ts-ignore
            to: ({ name: 'profile', params: { username: playlist.value.owner.username } }), ...{ class: "mt-2 inline-flex items-center gap-2 text-sm text-flixer-muted hover:text-white" },
        }));
        const __VLS_25 = __VLS_24({
            to: ({ name: 'profile', params: { username: playlist.value.owner.username } }),
            ...{ class: "mt-2 inline-flex items-center gap-2 text-sm text-flixer-muted hover:text-white" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_24));
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
        var __VLS_26;
        const { default: __VLS_28 } = __VLS_nonNull(__VLS_26.slots);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "block size-6 shrink-0 overflow-hidden rounded" },
        });
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        const __VLS_29 = UserAvatar;
        // @ts-ignore
        const __VLS_30 = __VLS_asFunctionalComponent1(__VLS_29, new __VLS_29({
            // @ts-ignore
            avatarUrl: (playlist.value.owner.avatarUrl), name: (playlist.value.owner.displayName), ...{ class: "text-xs" },
        }));
        const __VLS_31 = __VLS_30({
            avatarUrl: (playlist.value.owner.avatarUrl),
            name: (playlist.value.owner.displayName),
            ...{ class: "text-xs" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_30));
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "font-medium text-white" },
        });
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        (playlist.value.owner.displayName);
        // @ts-ignore
        [t, t, t, t, failed, playlist, playlist, playlist, playlist, playlist, playlist, playlist, playlist, playlist, playlist, playlist, playlist, playlist, playlist,];
        if (playlist.value.description) {
            const __VLS_34 = ClampedText;
            // @ts-ignore
            const __VLS_35 = __VLS_asFunctionalComponent1(__VLS_34, new __VLS_34({
                // @ts-ignore
                text: (playlist.value.description), title: (playlist.value.name), ...{ class: "mt-3 max-w-2xl text-sm text-flixer-text/90" },
            }));
            const __VLS_36 = __VLS_35({
                text: (playlist.value.description),
                title: (playlist.value.name),
                ...{ class: "mt-3 max-w-2xl text-sm text-flixer-text/90" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_35));
            /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['max-w-2xl']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-text/90']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-4 flex flex-wrap gap-2" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!!(loading.value))
                        throw 0;
                    if (!!(missing.value))
                        throw 0;
                    if (!!(failed.value && !playlist.value))
                        throw 0;
                    if (!(playlist.value))
                        throw 0;
                    return (playFrom());
                    // @ts-ignore
                    [playlist, playlist, playlist,];
                } },
            type: "button",
            ...{ class: "rounded bg-white px-4 py-2 text-sm font-bold text-flixer-background transition hover:bg-white/85 disabled:opacity-50" },
            disabled: (!tracks.value.length),
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-background']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/85']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
        (__VLS_unwrap(t, {})('social.playAll'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (shuffle) },
            type: "button",
            ...{ class: "rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-50" },
            disabled: (tracks.value.length < 2),
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/20']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
        (__VLS_unwrap(t, {})('social.shuffle'));
        if (owner.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (edit) },
                type: "button",
                ...{ class: "rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20" },
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/20']} */ ;
            (__VLS_unwrap(t, {})('social.editPlaylist'));
        }
        if (owner.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (removePlaylist) },
                type: "button",
                ...{ class: "rounded bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/25" },
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-red-500/15']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-red-200']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-red-500/25']} */ ;
            (__VLS_unwrap(t, {})('social.deletePlaylist'));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.dl, __VLS_intrinsics.dl)({
            ...{ class: "relative grid grid-cols-2 divide-white/10 border-t border-white/10 bg-black/25 backdrop-blur-sm sm:grid-cols-4 sm:divide-x" },
        });
        /** @type {__VLS_StyleScopedClasses['relative']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['divide-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-black/25']} */ ;
        /** @type {__VLS_StyleScopedClasses['backdrop-blur-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:grid-cols-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:divide-x']} */ ;
        const __VLS_39 = __VLS_tryAsConstant((__VLS_unwrap(stats, {})));
        for (const [stat] of __VLS_vFor(__VLS_nonNull(__VLS_39))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (stat.label),
                ...{ class: "px-5 py-3" },
            });
            /** @type {__VLS_StyleScopedClasses['px-5']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
                ...{ class: "text-xl font-bold tabular-nums text-white" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
            /** @type {__VLS_StyleScopedClasses['tabular-nums']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            (stat.value);
            __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
                ...{ class: "text-xs uppercase tracking-wide text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
            /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (stat.label);
            // @ts-ignore
            [t, t, t, t, tracks, tracks, owner, owner, stats,];
        }
        if (failed.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-sm text-red-400" },
                role: "alert",
            });
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-red-400']} */ ;
            (__VLS_unwrap(t, {})('social.saveError'));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            'aria-label': (__VLS_unwrap(t, {})('social.tracks')),
        });
        if (!tracks.value.length) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "rounded border border-white/10 bg-white/5 p-6 text-center text-sm text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white/5']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-6']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('social.emptyPlaylist'));
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "overflow-hidden rounded border border-white/10" },
            });
            /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "grid grid-cols-[2rem_minmax(0,1fr)_3rem] gap-3 border-b border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-flixer-muted md:grid-cols-[2rem_minmax(0,2fr)_minmax(0,1.5fr)_3rem_auto]" },
            });
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['grid-cols-[2rem_minmax(0,1fr)_3rem]']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white/5']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
            /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            /** @type {__VLS_StyleScopedClasses['md:grid-cols-[2rem_minmax(0,2fr)_minmax(0,1.5fr)_3rem_auto]']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (__VLS_unwrap(t, {})('social.title'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "hidden md:block" },
            });
            /** @type {__VLS_StyleScopedClasses['hidden']} */ ;
            /** @type {__VLS_StyleScopedClasses['md:block']} */ ;
            (__VLS_unwrap(t, {})('social.album'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-right" },
            });
            /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
            (__VLS_unwrap(t, {})('social.duration'));
            if (owner.value) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span)({
                    ...{ class: "hidden w-24 md:block" },
                });
                /** @type {__VLS_StyleScopedClasses['hidden']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-24']} */ ;
                /** @type {__VLS_StyleScopedClasses['md:block']} */ ;
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.ol, __VLS_intrinsics.ol)({
                ...{ class: "divide-y divide-white/5" },
            });
            /** @type {__VLS_StyleScopedClasses['divide-y']} */ ;
            /** @type {__VLS_StyleScopedClasses['divide-white/5']} */ ;
            const __VLS_40 = __VLS_tryAsConstant((tracks.value));
            for (const [track, index] of __VLS_vFor(__VLS_nonNull(__VLS_40))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                    key: (track.id),
                    ...{ class: "group grid grid-cols-[2rem_minmax(0,1fr)_3rem] items-center gap-3 px-3 py-2 transition motion-reduce:transition-none hover:bg-white/10 md:grid-cols-[2rem_minmax(0,2fr)_minmax(0,1.5fr)_3rem_auto]" },
                });
                /** @type {__VLS_StyleScopedClasses['group']} */ ;
                /** @type {__VLS_StyleScopedClasses['grid']} */ ;
                /** @type {__VLS_StyleScopedClasses['grid-cols-[2rem_minmax(0,1fr)_3rem]']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                /** @type {__VLS_StyleScopedClasses['motion-reduce:transition-none']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
                /** @type {__VLS_StyleScopedClasses['md:grid-cols-[2rem_minmax(0,2fr)_minmax(0,1.5fr)_3rem_auto]']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!!(loading.value))
                                throw 0;
                            if (!!(missing.value))
                                throw 0;
                            if (!!(failed.value && !playlist.value))
                                throw 0;
                            if (!(playlist.value))
                                throw 0;
                            if (!!(!tracks.value.length))
                                throw 0;
                            return (playFrom(index));
                            // @ts-ignore
                            [t, t, t, t, t, t, failed, tracks, tracks, owner,];
                        } },
                    type: "button",
                    ...{ class: "grid size-8 place-items-center rounded text-xs tabular-nums text-flixer-muted hover:text-white" },
                    'aria-label': (__VLS_unwrap(t, {})('social.playTrackFrom', { title: track.title })),
                });
                /** @type {__VLS_StyleScopedClasses['grid']} */ ;
                /** @type {__VLS_StyleScopedClasses['size-8']} */ ;
                /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['tabular-nums']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "group-hover:hidden" },
                });
                /** @type {__VLS_StyleScopedClasses['group-hover:hidden']} */ ;
                (index + 1);
                let __VLS_41;
                /** @ts-ignore @type { | typeof __VLS_components.Icon} */
                Icon;
                // @ts-ignore
                const __VLS_42 = __VLS_asFunctionalComponent1(__VLS_41, new __VLS_41({
                    // @ts-ignore
                    icon: "lucide:play", ...{ class: "hidden size-4 text-white group-hover:block" }, 'aria-hidden': "true",
                }));
                const __VLS_43 = __VLS_42({
                    icon: "lucide:play",
                    ...{ class: "hidden size-4 text-white group-hover:block" },
                    'aria-hidden': "true",
                }, ...__VLS_functionalComponentArgsRest(__VLS_42));
                /** @type {__VLS_StyleScopedClasses['hidden']} */ ;
                /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                /** @type {__VLS_StyleScopedClasses['group-hover:block']} */ ;
                let __VLS_46;
                /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
                RouterLink;
                // @ts-ignore
                const __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46({
                    // @ts-ignore
                    to: ({ name: 'media-item', params: { id: track.id } }), ...{ class: "flex min-w-0 items-center gap-3" },
                }));
                const __VLS_48 = __VLS_47({
                    to: ({ name: 'media-item', params: { id: track.id } }),
                    ...{ class: "flex min-w-0 items-center gap-3" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_47));
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
                var __VLS_49;
                const { default: __VLS_51 } = __VLS_nonNull(__VLS_49.slots);
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "block size-10 shrink-0 overflow-hidden rounded bg-flixer-surface" },
                });
                /** @type {__VLS_StyleScopedClasses['block']} */ ;
                /** @type {__VLS_StyleScopedClasses['size-10']} */ ;
                /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
                if (track.imageIndex !== null) {
                    const __VLS_52 = AuthImage;
                    // @ts-ignore
                    const __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52({
                        // @ts-ignore
                        scope: "library", itemId: (track.imageItemId), index: (track.imageIndex), version: (track.imageUpdatedAt), width: (80), alt: (track.title),
                    }));
                    const __VLS_54 = __VLS_53({
                        scope: "library",
                        itemId: (track.imageItemId),
                        index: (track.imageIndex),
                        version: (track.imageUpdatedAt),
                        width: (80),
                        alt: (track.title),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_53));
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "min-w-0" },
                });
                /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "block truncate text-sm font-semibold text-white" },
                });
                /** @type {__VLS_StyleScopedClasses['block']} */ ;
                /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                (track.title);
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "block truncate text-xs text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['block']} */ ;
                /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (track.artist ?? track.subtitle);
                // @ts-ignore
                [t,];
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "hidden truncate text-sm text-flixer-muted md:block" },
                });
                /** @type {__VLS_StyleScopedClasses['hidden']} */ ;
                /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                /** @type {__VLS_StyleScopedClasses['md:block']} */ ;
                (track.album);
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "text-right text-xs tabular-nums text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['tabular-nums']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (formatDuration(track.durationSeconds));
                if (owner.value) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "flex w-24 justify-end gap-1 md:opacity-0 md:transition md:group-hover:opacity-100 md:focus-within:opacity-100" },
                    });
                    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                    /** @type {__VLS_StyleScopedClasses['w-24']} */ ;
                    /** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
                    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
                    /** @type {__VLS_StyleScopedClasses['md:opacity-0']} */ ;
                    /** @type {__VLS_StyleScopedClasses['md:transition']} */ ;
                    /** @type {__VLS_StyleScopedClasses['md:group-hover:opacity-100']} */ ;
                    /** @type {__VLS_StyleScopedClasses['md:focus-within:opacity-100']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                void $event;
                                if (!!(loading.value))
                                    throw 0;
                                if (!!(missing.value))
                                    throw 0;
                                if (!!(failed.value && !playlist.value))
                                    throw 0;
                                if (!(playlist.value))
                                    throw 0;
                                if (!!(!tracks.value.length))
                                    throw 0;
                                if (!(owner.value))
                                    throw 0;
                                return (move(index, -1));
                                // @ts-ignore
                                [owner,];
                            } },
                        type: "button",
                        ...{ class: "grid size-7 place-items-center rounded text-flixer-muted hover:bg-white/10 hover:text-white disabled:opacity-40" },
                        disabled: (index === 0 || busy.value === 'order'),
                        'aria-label': (__VLS_unwrap(t, {})('social.moveUp')),
                    });
                    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
                    /** @type {__VLS_StyleScopedClasses['size-7']} */ ;
                    /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
                    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                    /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
                    /** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
                    /** @type {__VLS_StyleScopedClasses['disabled:opacity-40']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                void $event;
                                if (!!(loading.value))
                                    throw 0;
                                if (!!(missing.value))
                                    throw 0;
                                if (!!(failed.value && !playlist.value))
                                    throw 0;
                                if (!(playlist.value))
                                    throw 0;
                                if (!!(!tracks.value.length))
                                    throw 0;
                                if (!(owner.value))
                                    throw 0;
                                return (move(index, 1));
                                // @ts-ignore
                                [t, busy,];
                            } },
                        type: "button",
                        ...{ class: "grid size-7 place-items-center rounded text-flixer-muted hover:bg-white/10 hover:text-white disabled:opacity-40" },
                        disabled: (index === tracks.value.length - 1 || busy.value === 'order'),
                        'aria-label': (__VLS_unwrap(t, {})('social.moveDown')),
                    });
                    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
                    /** @type {__VLS_StyleScopedClasses['size-7']} */ ;
                    /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
                    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                    /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
                    /** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
                    /** @type {__VLS_StyleScopedClasses['disabled:opacity-40']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                void $event;
                                if (!!(loading.value))
                                    throw 0;
                                if (!!(missing.value))
                                    throw 0;
                                if (!!(failed.value && !playlist.value))
                                    throw 0;
                                if (!(playlist.value))
                                    throw 0;
                                if (!!(!tracks.value.length))
                                    throw 0;
                                if (!(owner.value))
                                    throw 0;
                                return (removeTrack(track));
                                // @ts-ignore
                                [t, tracks, busy,];
                            } },
                        type: "button",
                        ...{ class: "grid size-7 place-items-center rounded text-flixer-muted hover:bg-red-500/15 hover:text-red-200" },
                        disabled: (busy.value === track.id),
                        'aria-label': (__VLS_unwrap(t, {})('social.removeTrack')),
                    });
                    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
                    /** @type {__VLS_StyleScopedClasses['size-7']} */ ;
                    /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
                    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                    /** @type {__VLS_StyleScopedClasses['hover:bg-red-500/15']} */ ;
                    /** @type {__VLS_StyleScopedClasses['hover:text-red-200']} */ ;
                }
                // @ts-ignore
                [t, busy,];
            }
        }
    }
    const __VLS_57 = MobileTabBar;
    // @ts-ignore
    const __VLS_58 = __VLS_asFunctionalComponent1(__VLS_57, new __VLS_57({
        // @ts-ignore
        tabs: (__VLS_unwrap(mobileTabs, {})),
    }));
    const __VLS_59 = __VLS_58({
        tabs: (__VLS_unwrap(mobileTabs, {})),
    }, ...__VLS_functionalComponentArgsRest(__VLS_58));
    // @ts-ignore
    [mobileTabs,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
