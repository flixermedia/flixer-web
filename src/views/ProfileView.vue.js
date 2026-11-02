import { openModal } from '@kolirt/vue-modal';
import axios from 'axios';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { acceptFriend, getSocialProfile, removeFriend, requestFriend, startDirectChat } from '../api';
import Header from '../components/header/Header.vue';
import MediaCard from '../components/home/MediaCard.vue';
import MobileTabBar from '../components/home/MobileTabBar.vue';
import AuthImage from '../components/ui/AuthImage.vue';
import PlaylistEditorModal from '../components/PlaylistEditorModal.vue';
import FriendInviteModal from '../components/social/FriendInviteModal.vue';
import UserAvatar from '../components/ui/UserAvatar.vue';
import { getMobileTabs, getNavLinks } from '../composables/homeNav';
import { notify } from '../composables/notify';
import { useAudioPlayer } from '../composables/useAudioPlayer';
import { useParty } from '../composables/useParty';
import { useSignOut } from '../composables/useSignOut';
import { catchError } from '../utils/catchError';
const { t } = useI18n();
const openingChat = ref(false);
const friendBusy = ref(false);
const route = useRoute();
const router = useRouter();
const { isSigningOut, signOut } = useSignOut();
const navLinks = computed(getNavLinks);
const mobileTabs = computed(getMobileTabs);
const profile = ref(null);
const loading = ref(true);
const failed = ref(false);
const notFound = ref(false);
const filter = ref('all');
const player = useAudioPlayer();
let pollTimer;
let generation = 0;
const username = computed(() => String(route.params.username ?? ''));
const favoriteGroups = computed(() => [
    { type: 'movie', label: 'movies' },
    { type: 'series', label: 'tv' },
    { type: 'album', label: 'albums' },
    { type: 'track', label: 'songs' },
    { type: 'video', label: 'videos' },
]
    .map((group) => ({ ...group, items: profile.value?.favorites.filter((item) => item.type === group.type) ?? [] }))
    .filter((group) => group.items.length > 0));
const stats = computed(() => [
    { label: t('social.recentlyWatched'), value: profile.value?.recentlyWatched.length ?? 0 },
    { label: t('social.recentlyListened'), value: profile.value?.recentlyListened.length ?? 0 },
    { label: t('social.favorites'), value: profile.value?.favorites.length ?? 0 },
    { label: t('social.playlists'), value: profile.value?.playlists.length ?? 0 },
]);
const visibleGroups = computed(() => (filter.value === 'all' ? favoriteGroups.value : favoriteGroups.value.filter((group) => group.type === filter.value)));
async function load() {
    const current = ++generation;
    failed.value = false;
    notFound.value = false;
    if (!profile.value)
        loading.value = true;
    try {
        const [error, result] = await catchError(getSocialProfile(username.value));
        if (error) {
            if (current !== generation)
                return;
            notFound.value = axios.isAxiosError(error) && error.response?.status === 404;
            if (notFound.value)
                profile.value = null;
            failed.value = !notFound.value;
            return;
        }
        if (current !== generation)
            return;
        profile.value = result;
        document.title = `${result.displayName} · Flixer`;
    }
    finally {
        if (current === generation)
            loading.value = false;
    }
}
async function shareProfile() {
    await openModal(FriendInviteModal, { props: { username: username.value } }).catch(() => undefined);
}
function asQueueTrack(item) {
    return { id: item.id, title: item.title, artist: item.subtitle, artistId: null, album: null, albumId: null, art: item.imageIndex === null ? null : { itemId: item.imageItemId, index: item.imageIndex, version: item.imageUpdatedAt } };
}
const party = useParty();
const joiningParty = ref(false);
async function messageUser() {
    if (!profile.value || openingChat.value)
        return;
    openingChat.value = true;
    try {
        const [error, conversation] = await catchError(startDirectChat(profile.value.username));
        if (error) {
            notify.error(t('chat.messageFailed'));
            return;
        }
        const [navigationError] = await catchError(router.push({ name: 'chat', params: { id: conversation.id } }));
        if (navigationError)
            notify.error(t('chat.messageFailed'));
    }
    finally {
        openingChat.value = false;
    }
}
async function changeFriendship() {
    const person = profile.value;
    if (!person || person.isSelf || friendBusy.value)
        return;
    friendBusy.value = true;
    try {
        const operation = person.friendship === 'incoming' ? acceptFriend(person.username).then(() => undefined) : person.friendship === 'none' ? requestFriend(person.username).then(() => undefined) : removeFriend(person.username).then(() => undefined);
        const [error] = await catchError(operation);
        if (error) {
            notify.error(t('social.friendActionFailed'));
            return;
        }
        await load();
    }
    finally {
        friendBusy.value = false;
    }
}
async function joinParty(id) {
    joiningParty.value = true;
    try {
        const [error] = await catchError(party.join(id));
        if (error) {
            notify.error(error instanceof Error ? error.message : t('party.joinFailed'));
            await load();
        }
    }
    finally {
        joiningParty.value = false;
    }
}
function playListened(index) {
    if (!profile.value)
        return;
    player.playQueue(profile.value.recentlyListened.map(asQueueTrack), index);
}
async function createPlaylist() {
    const result = await openModal(PlaylistEditorModal).catch(() => null);
    if (result) {
        await router.push({ name: 'playlist', params: { id: result.id } });
        await load();
    }
}
function cardSubtitle(item) {
    const parts = [item.subtitle, item.year].filter(Boolean).map(String);
    return [...new Set(parts)].join(' · ');
}
function sectionTitle(key) {
    return t(`social.${key}`);
}
watch(username, () => {
    profile.value = null;
    void load();
}, { immediate: true });
onMounted(() => {
    pollTimer = setInterval(() => void load(), 30_000);
});
onBeforeUnmount(() => {
    generation++;
    if (pollTimer)
        clearInterval(pollTimer);
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(loading, {});
    __VLS_withDotValue(profile, {});
    __VLS_withDotValue(notFound, {});
    __VLS_withDotValue(failed, {});
    __VLS_withDotValue(party, {});
    __VLS_withDotValue(favoriteGroups, {});
    __VLS_withDotValue(filter, {});
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
    if (loading.value && !profile.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm text-flixer-muted" },
            role: "status",
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('common.loading'));
    }
    else if (notFound.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "mx-auto max-w-2xl rounded border border-flixer-border bg-flixer-surface p-8 text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
        /** @type {__VLS_StyleScopedClasses['max-w-2xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-8']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
            ...{ class: "text-xl font-semibold text-white" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        (__VLS_unwrap(t, {})('social.profilePrivate'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-2 text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('social.profilePrivateDescription'));
        let __VLS_7;
        /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
        RouterLink;
        // @ts-ignore
        const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
            // @ts-ignore
            to: "/people", ...{ class: "mt-4 inline-block text-sm text-flixer-accent hover:underline" },
        }));
        const __VLS_9 = __VLS_8({
            to: "/people",
            ...{ class: "mt-4 inline-block text-sm text-flixer-accent hover:underline" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_8));
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['inline-block']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:underline']} */ ;
        var __VLS_10;
        const { default: __VLS_12 } = __VLS_nonNull(__VLS_10.slots);
        (__VLS_unwrap(t, {})('social.people'));
        // @ts-ignore
        [navLinks, isSigningOut, signOut, loading, profile, t, t, t, t, notFound,];
    }
    else if (failed.value && !profile.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "text-sm text-red-400" },
            role: "alert",
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-400']} */ ;
        (__VLS_unwrap(t, {})('social.loadError'));
    }
    else if (profile.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
            ...{ class: "rounded border border-white/10 bg-flixer-surface/60" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/60']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:flex-row']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:p-6']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "size-24 shrink-0 overflow-hidden rounded shadow-lg shadow-black/40 sm:size-32" },
        });
        /** @type {__VLS_StyleScopedClasses['size-24']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-black/40']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:size-32']} */ ;
        const __VLS_13 = UserAvatar;
        // @ts-ignore
        const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
            // @ts-ignore
            avatarUrl: (profile.value.avatarUrl), name: (profile.value.displayName), ...{ class: "text-3xl" },
        }));
        const __VLS_15 = __VLS_14({
            avatarUrl: (profile.value.avatarUrl),
            name: (profile.value.displayName),
            ...{ class: "text-3xl" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_14));
        /** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
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
        (profile.value.displayName);
        if (profile.value.hidden) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "rounded bg-amber-300/10 px-2 py-0.5 text-xs font-semibold text-amber-100" },
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-amber-300/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-amber-100']} */ ;
            (__VLS_unwrap(t, {})('social.hidden'));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-1 text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (profile.value.username);
        (__VLS_unwrap(t, {})('social.joined', { date: new Date(profile.value.joinedAt).toLocaleDateString() }));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-4 flex flex-wrap gap-2" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        if (profile.value.isSelf) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (createPlaylist) },
                type: "button",
                ...{ class: "rounded bg-white px-4 py-2 text-sm font-bold text-flixer-background transition hover:bg-white/85" },
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
            (__VLS_unwrap(t, {})('social.createPlaylist'));
        }
        if (profile.value.isSelf) {
            let __VLS_18;
            /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
            RouterLink;
            // @ts-ignore
            const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
                // @ts-ignore
                to: ({ name: 'settings' }), ...{ class: "rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20" },
            }));
            const __VLS_20 = __VLS_19({
                to: ({ name: 'settings' }),
                ...{ class: "rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_19));
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/20']} */ ;
            var __VLS_21;
            const { default: __VLS_23 } = __VLS_nonNull(__VLS_21.slots);
            (__VLS_unwrap(t, {})('social.editProfile'));
            // @ts-ignore
            [profile, profile, profile, profile, profile, profile, profile, profile, profile, profile, t, t, t, t, t, failed,];
        }
        if (!profile.value.isSelf) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (messageUser) },
                type: "button",
                ...{ class: "rounded bg-white px-4 py-2 text-sm font-bold text-flixer-background transition hover:bg-white/85 disabled:opacity-60" },
                disabled: (__VLS_unwrap(openingChat, {})),
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
            /** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
            (__VLS_unwrap(t, {})('chat.message'));
        }
        if (!profile.value.isSelf) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (changeFriendship) },
                type: "button",
                ...{ class: "rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-60" },
                disabled: (__VLS_unwrap(friendBusy, {})),
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
            /** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
            (__VLS_unwrap(t, {})(`social.friendActions.${profile.value.friendship}`));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (shareProfile) },
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
        (__VLS_unwrap(t, {})('social.shareProfile'));
        if (profile.value.party || profile.value.nowPlaying) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex w-full min-w-0 flex-col gap-2 sm:ml-auto sm:w-72 sm:shrink-0 sm:self-start" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['sm:ml-auto']} */ ;
            /** @type {__VLS_StyleScopedClasses['sm:w-72']} */ ;
            /** @type {__VLS_StyleScopedClasses['sm:shrink-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['sm:self-start']} */ ;
            if (profile.value.party) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "flex w-full min-w-0 items-center gap-3 rounded border border-emerald-400/30 bg-emerald-400/10 p-3" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
                /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['border']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-emerald-400/30']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-emerald-400/10']} */ ;
                /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "min-w-0 flex-1" },
                });
                /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-300" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
                /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-emerald-300']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span)({
                    ...{ class: "size-2 shrink-0 animate-pulse rounded-full bg-emerald-400 motion-reduce:animate-none" },
                    'aria-hidden': "true",
                });
                /** @type {__VLS_StyleScopedClasses['size-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-emerald-400']} */ ;
                /** @type {__VLS_StyleScopedClasses['motion-reduce:animate-none']} */ ;
                (__VLS_unwrap(t, {})(profile.value.party.kind === 'music' ? 'party.listeningTogether' : 'party.watchingTogether'));
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "mt-1 truncate text-sm font-semibold text-white" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                (profile.value.party.title);
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "text-xs text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (__VLS_unwrap(t, {})('party.inThisParty', { count: profile.value.party.memberCount }));
                if (!profile.value.isSelf && party.value.party.value?.id !== profile.value.party.id) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                void $event;
                                if (!!(loading.value && !profile.value))
                                    throw 0;
                                if (!!(notFound.value))
                                    throw 0;
                                if (!!(failed.value && !profile.value))
                                    throw 0;
                                if (!(profile.value))
                                    throw 0;
                                if (!(profile.value.party || profile.value.nowPlaying))
                                    throw 0;
                                if (!(profile.value.party))
                                    throw 0;
                                if (!(!profile.value.isSelf && party.value.party.value?.id !== profile.value.party.id))
                                    throw 0;
                                return (joinParty(profile.value.party.id));
                                // @ts-ignore
                                [profile, profile, profile, profile, profile, profile, profile, profile, profile, profile, profile, profile, t, t, t, t, t, openingChat, friendBusy, party,];
                            } },
                        type: "button",
                        ...{ class: "shrink-0 rounded bg-white px-3 py-2 text-xs font-bold text-flixer-background transition hover:bg-white/85 disabled:opacity-60" },
                        disabled: (__VLS_unwrap(joiningParty, {})),
                    });
                    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                    /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
                    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
                    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-flixer-background']} */ ;
                    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                    /** @type {__VLS_StyleScopedClasses['hover:bg-white/85']} */ ;
                    /** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
                    (__VLS_unwrap(t, {})('party.join'));
                }
            }
            if (profile.value.nowPlaying) {
                let __VLS_24;
                /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
                RouterLink;
                // @ts-ignore
                const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
                    // @ts-ignore
                    to: ({ name: 'media-item', params: { id: profile.value.nowPlaying.item.id } }), ...{ class: "flex w-full min-w-0 items-center gap-3 rounded bg-white/5 p-3 transition hover:bg-white/10" }, 'aria-live': "polite",
                }));
                const __VLS_26 = __VLS_25({
                    to: ({ name: 'media-item', params: { id: profile.value.nowPlaying.item.id } }),
                    ...{ class: "flex w-full min-w-0 items-center gap-3 rounded bg-white/5 p-3 transition hover:bg-white/10" },
                    'aria-live': "polite",
                }, ...__VLS_functionalComponentArgsRest(__VLS_25));
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
                /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-white/5']} */ ;
                /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
                var __VLS_27;
                const { default: __VLS_29 } = __VLS_nonNull(__VLS_27.slots);
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "relative size-14 shrink-0 overflow-hidden rounded bg-flixer-surface" },
                });
                /** @type {__VLS_StyleScopedClasses['relative']} */ ;
                /** @type {__VLS_StyleScopedClasses['size-14']} */ ;
                /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
                if (profile.value.nowPlaying.item.imageIndex !== null) {
                    const __VLS_30 = AuthImage;
                    // @ts-ignore
                    const __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({
                        // @ts-ignore
                        scope: "library", itemId: (profile.value.nowPlaying.item.imageItemId), index: (profile.value.nowPlaying.item.imageIndex), version: (profile.value.nowPlaying.item.imageUpdatedAt), width: (120), alt: (profile.value.nowPlaying.item.title),
                    }));
                    const __VLS_32 = __VLS_31({
                        scope: "library",
                        itemId: (profile.value.nowPlaying.item.imageItemId),
                        index: (profile.value.nowPlaying.item.imageIndex),
                        version: (profile.value.nowPlaying.item.imageUpdatedAt),
                        width: (120),
                        alt: (profile.value.nowPlaying.item.title),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_31));
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "min-w-0" },
                });
                /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-300" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
                /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-emerald-300']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span)({
                    ...{ class: "size-2 shrink-0 animate-pulse rounded-full bg-emerald-400 motion-reduce:animate-none" },
                    'aria-hidden': "true",
                });
                /** @type {__VLS_StyleScopedClasses['size-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-emerald-400']} */ ;
                /** @type {__VLS_StyleScopedClasses['motion-reduce:animate-none']} */ ;
                (profile.value.nowPlaying.kind === 'watching' ? __VLS_unwrap(t, {})('social.nowWatching') : __VLS_unwrap(t, {})('social.nowListening'));
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "mt-1 truncate text-sm font-semibold text-white" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                (profile.value.nowPlaying.item.title);
                if (profile.value.nowPlaying.item.subtitle) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                        ...{ class: "truncate text-xs text-flixer-muted" },
                    });
                    /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                    (profile.value.nowPlaying.item.subtitle);
                }
                // @ts-ignore
                [profile, profile, profile, profile, profile, profile, profile, profile, profile, profile, profile, t, t, t, joiningParty,];
            }
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.dl, __VLS_intrinsics.dl)({
            ...{ class: "grid grid-cols-2 divide-white/10 border-t border-white/10 sm:grid-cols-4 sm:divide-x" },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['divide-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:grid-cols-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:divide-x']} */ ;
        const __VLS_35 = __VLS_tryAsConstant((__VLS_unwrap(stats, {})));
        for (const [stat] of __VLS_vFor(__VLS_nonNull(__VLS_35))) {
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
            [stats,];
        }
        if (failed.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mt-4 text-sm text-red-400" },
                role: "alert",
            });
            /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-red-400']} */ ;
            (__VLS_unwrap(t, {})('social.loadError'));
        }
        if (profile.value.recentlyWatched.length) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
                ...{ class: "mt-10" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-10']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
                ...{ class: "mb-4 text-xl font-bold tracking-tight text-white" },
            });
            /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
            /** @type {__VLS_StyleScopedClasses['tracking-tight']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            (sectionTitle('recentlyWatched'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
                ...{ class: "grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-4 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]" },
            });
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['grid-cols-[repeat(auto-fill,minmax(9rem,1fr))]']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]']} */ ;
            const __VLS_36 = __VLS_tryAsConstant((profile.value.recentlyWatched));
            for (const [item] of __VLS_vFor(__VLS_nonNull(__VLS_36))) {
                const __VLS_37 = MediaCard;
                // @ts-ignore
                const __VLS_38 = __VLS_asFunctionalComponent1(__VLS_37, new __VLS_37({
                    // @ts-ignore
                    key: (item.id), ...{ class: "!w-auto" }, title: (item.title), subtitle: (cardSubtitle(item)), itemId: (item.imageItemId), imageIndex: (item.imageIndex), version: (item.imageUpdatedAt), to: ({ name: 'media-item', params: { id: item.id } }),
                }));
                const __VLS_39 = __VLS_38({
                    key: (item.id),
                    ...{ class: "!w-auto" },
                    title: (item.title),
                    subtitle: (cardSubtitle(item)),
                    itemId: (item.imageItemId),
                    imageIndex: (item.imageIndex),
                    version: (item.imageUpdatedAt),
                    to: ({ name: 'media-item', params: { id: item.id } }),
                }, ...__VLS_functionalComponentArgsRest(__VLS_38));
                /** @type {__VLS_StyleScopedClasses['!w-auto']} */ ;
                // @ts-ignore
                [profile, profile, t, failed,];
            }
        }
        if (profile.value.recentlyListened.length) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
                ...{ class: "mt-10" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-10']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
                ...{ class: "mb-2 text-xl font-bold tracking-tight text-white" },
            });
            /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
            /** @type {__VLS_StyleScopedClasses['tracking-tight']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            (sectionTitle('recentlyListened'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.ol, __VLS_intrinsics.ol)({});
            const __VLS_42 = __VLS_tryAsConstant((profile.value.recentlyListened));
            for (const [item, index] of __VLS_vFor(__VLS_nonNull(__VLS_42))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                    key: (item.id),
                    ...{ class: "group flex items-center gap-3 rounded px-2 py-2 transition motion-reduce:transition-none hover:bg-white/10" },
                });
                /** @type {__VLS_StyleScopedClasses['group']} */ ;
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                /** @type {__VLS_StyleScopedClasses['motion-reduce:transition-none']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "w-5 shrink-0 text-center text-sm tabular-nums text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['w-5']} */ ;
                /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['tabular-nums']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (index + 1);
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!!(loading.value && !profile.value))
                                throw 0;
                            if (!!(notFound.value))
                                throw 0;
                            if (!!(failed.value && !profile.value))
                                throw 0;
                            if (!(profile.value))
                                throw 0;
                            if (!(profile.value.recentlyListened.length))
                                throw 0;
                            return (playListened(index));
                            // @ts-ignore
                            [profile, profile,];
                        } },
                    type: "button",
                    ...{ class: "relative size-11 shrink-0 overflow-hidden rounded bg-flixer-surface" },
                    'aria-label': (__VLS_unwrap(t, {})('social.playTrackFrom', { title: item.title })),
                });
                /** @type {__VLS_StyleScopedClasses['relative']} */ ;
                /** @type {__VLS_StyleScopedClasses['size-11']} */ ;
                /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
                if (item.imageIndex !== null) {
                    const __VLS_43 = AuthImage;
                    // @ts-ignore
                    const __VLS_44 = __VLS_asFunctionalComponent1(__VLS_43, new __VLS_43({
                        // @ts-ignore
                        scope: "library", itemId: (item.imageItemId), index: (item.imageIndex), version: (item.imageUpdatedAt), width: (96), alt: (item.title),
                    }));
                    const __VLS_45 = __VLS_44({
                        scope: "library",
                        itemId: (item.imageItemId),
                        index: (item.imageIndex),
                        version: (item.imageUpdatedAt),
                        width: (96),
                        alt: (item.title),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_44));
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "absolute inset-0 grid place-items-center bg-black/55 text-white opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100" },
                });
                /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
                /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['grid']} */ ;
                /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-black/55']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                /** @type {__VLS_StyleScopedClasses['opacity-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                /** @type {__VLS_StyleScopedClasses['group-hover:opacity-100']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:opacity-100']} */ ;
                let __VLS_48;
                /** @ts-ignore @type { | typeof __VLS_components.Icon} */
                Icon;
                // @ts-ignore
                const __VLS_49 = __VLS_asFunctionalComponent1(__VLS_48, new __VLS_48({
                    // @ts-ignore
                    icon: "lucide:play", ...{ class: "size-5" }, 'aria-hidden': "true",
                }));
                const __VLS_50 = __VLS_49({
                    icon: "lucide:play",
                    ...{ class: "size-5" },
                    'aria-hidden': "true",
                }, ...__VLS_functionalComponentArgsRest(__VLS_49));
                /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
                let __VLS_53;
                /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
                RouterLink;
                // @ts-ignore
                const __VLS_54 = __VLS_asFunctionalComponent1(__VLS_53, new __VLS_53({
                    // @ts-ignore
                    to: ({ name: 'media-item', params: { id: item.id } }), ...{ class: "min-w-0 flex-1" },
                }));
                const __VLS_55 = __VLS_54({
                    to: ({ name: 'media-item', params: { id: item.id } }),
                    ...{ class: "min-w-0 flex-1" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_54));
                /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
                var __VLS_56;
                const { default: __VLS_58 } = __VLS_nonNull(__VLS_56.slots);
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "truncate text-sm font-semibold text-white" },
                });
                /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                (item.title);
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "truncate text-xs text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (item.subtitle);
                // @ts-ignore
                [t,];
                if (item.at) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.time, __VLS_intrinsics.time)({
                        ...{ class: "hidden shrink-0 text-xs text-flixer-muted sm:block" },
                        datetime: (item.at),
                    });
                    /** @type {__VLS_StyleScopedClasses['hidden']} */ ;
                    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                    /** @type {__VLS_StyleScopedClasses['sm:block']} */ ;
                    (new Date(item.at).toLocaleDateString());
                }
                // @ts-ignore
                [];
            }
        }
        if (favoriteGroups.value.length) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
                ...{ class: "mt-10" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-10']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
                ...{ class: "mb-3 text-xl font-bold tracking-tight text-white" },
            });
            /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
            /** @type {__VLS_StyleScopedClasses['tracking-tight']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            (sectionTitle('favorites'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mb-5 flex flex-wrap gap-2" },
                role: "group",
                'aria-label': (sectionTitle('favorites')),
            });
            /** @type {__VLS_StyleScopedClasses['mb-5']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            const __VLS_59 = __VLS_tryAsConstant(([{ type: 'all', label: __VLS_unwrap(t, {})('social.all') }, ...favoriteGroups.value.map((group) => ({ type: group.type, label: sectionTitle(group.label) }))]));
            for (const [chip] of __VLS_vFor(__VLS_nonNull(__VLS_59))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!!(loading.value && !profile.value))
                                throw 0;
                            if (!!(notFound.value))
                                throw 0;
                            if (!!(failed.value && !profile.value))
                                throw 0;
                            if (!(profile.value))
                                throw 0;
                            if (!(favoriteGroups.value.length))
                                throw 0;
                            return (filter.value = chip.type);
                            // @ts-ignore
                            [t, favoriteGroups, favoriteGroups, filter,];
                        } },
                    key: (chip.type),
                    type: "button",
                    ...{ class: "rounded-full px-3.5 py-1.5 text-xs font-semibold transition" },
                    ...{ class: (filter.value === chip.type ? 'bg-white text-flixer-background' : 'bg-white/10 text-white hover:bg-white/20') },
                    'aria-pressed': (filter.value === chip.type),
                });
                /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-3.5']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                (chip.label);
                // @ts-ignore
                [filter, filter,];
            }
            const __VLS_60 = __VLS_tryAsConstant((__VLS_unwrap(visibleGroups, {})));
            for (const [group] of __VLS_vFor(__VLS_nonNull(__VLS_60))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    key: (group.type),
                    ...{ class: "mb-6" },
                });
                /** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
                    ...{ class: "mb-3 text-sm font-semibold uppercase tracking-wide text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
                /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (sectionTitle(group.label));
                __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
                    ...{ class: "grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-4 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]" },
                });
                /** @type {__VLS_StyleScopedClasses['grid']} */ ;
                /** @type {__VLS_StyleScopedClasses['grid-cols-[repeat(auto-fill,minmax(9rem,1fr))]']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]']} */ ;
                const __VLS_61 = __VLS_tryAsConstant((group.items));
                for (const [item] of __VLS_vFor(__VLS_nonNull(__VLS_61))) {
                    const __VLS_62 = MediaCard;
                    // @ts-ignore
                    const __VLS_63 = __VLS_asFunctionalComponent1(__VLS_62, new __VLS_62({
                        // @ts-ignore
                        key: (item.id), ...{ class: "!w-auto" }, variant: (group.type === 'album' || group.type === 'track' ? 'square' : 'poster'), title: (item.title), subtitle: (cardSubtitle(item)), itemId: (item.imageItemId), imageIndex: (item.imageIndex), version: (item.imageUpdatedAt), to: ({ name: 'media-item', params: { id: item.id } }),
                    }));
                    const __VLS_64 = __VLS_63({
                        key: (item.id),
                        ...{ class: "!w-auto" },
                        variant: (group.type === 'album' || group.type === 'track' ? 'square' : 'poster'),
                        title: (item.title),
                        subtitle: (cardSubtitle(item)),
                        itemId: (item.imageItemId),
                        imageIndex: (item.imageIndex),
                        version: (item.imageUpdatedAt),
                        to: ({ name: 'media-item', params: { id: item.id } }),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_63));
                    /** @type {__VLS_StyleScopedClasses['!w-auto']} */ ;
                    // @ts-ignore
                    [visibleGroups,];
                }
                // @ts-ignore
                [];
            }
        }
        if (profile.value.playlists.length) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
                ...{ class: "mt-10" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-10']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
                ...{ class: "mb-4 text-xl font-bold tracking-tight text-white" },
            });
            /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
            /** @type {__VLS_StyleScopedClasses['tracking-tight']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            (sectionTitle('playlists'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
                ...{ class: "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" },
            });
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['lg:grid-cols-3']} */ ;
            const __VLS_67 = __VLS_tryAsConstant((profile.value.playlists));
            for (const [playlist] of __VLS_vFor(__VLS_nonNull(__VLS_67))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                    key: (playlist.id),
                    ...{ class: "rounded bg-white/5 transition hover:bg-white/10" },
                });
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-white/5']} */ ;
                /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
                let __VLS_68;
                /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
                RouterLink;
                // @ts-ignore
                const __VLS_69 = __VLS_asFunctionalComponent1(__VLS_68, new __VLS_68({
                    // @ts-ignore
                    to: ({ name: 'playlist', params: { id: playlist.id } }), ...{ class: "flex items-center gap-4 p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
                }));
                const __VLS_70 = __VLS_69({
                    to: ({ name: 'playlist', params: { id: playlist.id } }),
                    ...{ class: "flex items-center gap-4 p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_69));
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
                var __VLS_71;
                const { default: __VLS_73 } = __VLS_nonNull(__VLS_71.slots);
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "size-16 shrink-0 overflow-hidden rounded bg-flixer-background shadow-lg" },
                });
                /** @type {__VLS_StyleScopedClasses['size-16']} */ ;
                /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
                /** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
                if (playlist.cover) {
                    const __VLS_74 = AuthImage;
                    // @ts-ignore
                    const __VLS_75 = __VLS_asFunctionalComponent1(__VLS_74, new __VLS_74({
                        // @ts-ignore
                        scope: "library", itemId: (playlist.cover.itemId), index: (playlist.cover.index), version: (playlist.cover.updatedAt), width: (160), alt: (playlist.name),
                    }));
                    const __VLS_76 = __VLS_75({
                        scope: "library",
                        itemId: (playlist.cover.itemId),
                        index: (playlist.cover.index),
                        version: (playlist.cover.updatedAt),
                        width: (160),
                        alt: (playlist.name),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_75));
                }
                else {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "grid size-full place-items-center text-xs text-flixer-muted" },
                    });
                    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
                    /** @type {__VLS_StyleScopedClasses['size-full']} */ ;
                    /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
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
                (playlist.name);
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "block text-xs text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['block']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (__VLS_unwrap(t, {})('social.trackCount', { count: playlist.trackCount }));
                (playlist.isPublic ? __VLS_unwrap(t, {})('social.public') : __VLS_unwrap(t, {})('social.private'));
                // @ts-ignore
                [profile, profile, t, t, t,];
                // @ts-ignore
                [];
            }
        }
        if (!profile.value.recentlyWatched.length && !profile.value.recentlyListened.length && !profile.value.favorites.length && !profile.value.playlists.length) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mt-8 text-sm text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-8']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('social.nothingToShow'));
        }
    }
    const __VLS_79 = MobileTabBar;
    // @ts-ignore
    const __VLS_80 = __VLS_asFunctionalComponent1(__VLS_79, new __VLS_79({
        // @ts-ignore
        tabs: (__VLS_unwrap(mobileTabs, {})),
    }));
    const __VLS_81 = __VLS_80({
        tabs: (__VLS_unwrap(mobileTabs, {})),
    }, ...__VLS_functionalComponentArgsRest(__VLS_80));
    // @ts-ignore
    [profile, profile, profile, profile, t, mobileTabs,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
