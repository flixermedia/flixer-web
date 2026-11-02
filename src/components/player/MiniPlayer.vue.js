import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';
import { useAudioPlayer } from '../../composables/useAudioPlayer';
import { notify } from '../../composables/notify';
import { useParty } from '../../composables/useParty';
import AuthImage from '../ui/AuthImage.vue';
import { openModal } from '@kolirt/vue-modal';
import AddToPlaylistModal from '../AddToPlaylistModal.vue';
import { formatTime } from './formatTime';
import { catchError } from '../../utils/catchError';
const { t } = useI18n();
const player = useAudioPlayer();
const party = useParty();
const partyBusy = ref(false);
const hostingListen = computed(() => party.isHost.value && party.party.value?.kind === 'music');
// Guests follow the host, and a video party can't run alongside the music player.
const canParty = computed(() => !party.party.value || hostingListen.value);
const { current, isPlaying, isLoading, currentTime, duration, volume, shuffle, repeat, lyricsOpen } = player;
const visible = computed(() => current.value !== null && !lyricsOpen.value);
const progress = computed(() => (duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0));
// Lets pages reserve room so the bar never covers their last content.
watch(visible, (value) => document.documentElement.classList.toggle('has-mini-player', value), { immediate: true });
async function onParty() {
    if (partyBusy.value || !current.value)
        return;
    partyBusy.value = true;
    try {
        if (hostingListen.value) {
            const [error] = await catchError(Promise.resolve().then(() => navigator.clipboard.writeText(party.inviteLink())));
            if (error) {
                notify.error(t('party.copyFailed'));
                return;
            }
            notify.success(t('party.linkCopied'));
        }
        else {
            const [error, started] = await catchError(party.start(current.value.id));
            if (error) {
                notify.error(t('party.startFailed'));
                return;
            }
            if (!started)
                return;
        }
    }
    finally {
        partyBusy.value = false;
    }
}
function onSeek(event) {
    player.seek((Number(event.target.value) / 100) * duration.value);
}
function addCurrentToPlaylist() {
    if (current.value)
        void openModal(AddToPlaylistModal, { props: { itemId: current.value.id, title: current.value.title } }).catch(() => undefined);
}
function onVolume(event) {
    player.setVolume(Number(event.target.value));
}
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(visible, {});
    __VLS_withDotValue(current, {});
    __VLS_withDotValue(player, {});
    __VLS_withDotValue(shuffle, {});
    __VLS_withDotValue(isPlaying, {});
    __VLS_withDotValue(isLoading, {});
    __VLS_withDotValue(repeat, {});
    __VLS_withDotValue(canParty, {});
    __VLS_withDotValue(hostingListen, {});
    __VLS_withDotValue(lyricsOpen, {});
    if (visible.value && current.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            'data-haptic': true,
            ...{ class: "fixed inset-x-0 bottom-[calc(var(--tabbar-height,0px)+0.5rem)] z-40 px-2 md:bottom-0 md:px-0" },
            role: "region",
            'aria-label': (__VLS_unwrap(t, {})('music.player')),
        });
        /** @type {__VLS_StyleScopedClasses['fixed']} */ ;
        /** @type {__VLS_StyleScopedClasses['inset-x-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['bottom-[calc(var(--tabbar-height,0px)+0.5rem)]']} */ ;
        /** @type {__VLS_StyleScopedClasses['z-40']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:bottom-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:px-0']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "rounded border border-white/10 bg-flixer-surface/95 shadow-2xl shadow-black/60 backdrop-blur-xl md:rounded-none md:border-x-0 md:border-b-0" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/95']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-2xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-black/60']} */ ;
        /** @type {__VLS_StyleScopedClasses['backdrop-blur-xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:rounded-none']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:border-x-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:border-b-0']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mx-auto flex max-w-[110rem] items-center gap-3 p-2 md:gap-6 md:px-6" },
        });
        /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['max-w-[110rem]']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:gap-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:px-6']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex min-w-0 flex-1 items-center gap-3 md:w-1/4 md:flex-none" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:w-1/4']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:flex-none']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "size-12 shrink-0 overflow-hidden rounded bg-flixer-background" },
        });
        /** @type {__VLS_StyleScopedClasses['size-12']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
        if (current.value.art) {
            const __VLS_0 = AuthImage;
            // @ts-ignore
            const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
                // @ts-ignore
                scope: "library", itemId: (current.value.art.itemId), index: (current.value.art.index), version: (current.value.art.version), width: (96), alt: "",
            }));
            const __VLS_2 = __VLS_1({
                scope: "library",
                itemId: (current.value.art.itemId),
                index: (current.value.art.index),
                version: (current.value.art.version),
                width: (96),
                alt: "",
            }, ...__VLS_functionalComponentArgsRest(__VLS_1));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "min-w-0" },
        });
        /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
        if (current.value.albumId) {
            let __VLS_5;
            /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
            RouterLink;
            // @ts-ignore
            const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
                // @ts-ignore
                to: ({ name: 'media-item', params: { id: current.value.albumId } }), ...{ class: "block truncate text-sm font-semibold text-white hover:underline" },
            }));
            const __VLS_7 = __VLS_6({
                to: ({ name: 'media-item', params: { id: current.value.albumId } }),
                ...{ class: "block truncate text-sm font-semibold text-white hover:underline" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_6));
            /** @type {__VLS_StyleScopedClasses['block']} */ ;
            /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:underline']} */ ;
            var __VLS_8;
            const { default: __VLS_10 } = __VLS_nonNull(__VLS_8.slots);
            (current.value.title);
            // @ts-ignore
            [visible, current, current, current, current, current, current, current, current, t,];
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "truncate text-sm font-semibold text-white" },
            });
            /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            (current.value.title);
        }
        if (current.value.artist && current.value.artistId && !player.value.error.value) {
            let __VLS_11;
            /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
            RouterLink;
            // @ts-ignore
            const __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11({
                // @ts-ignore
                to: ({ name: 'person', params: { id: current.value.artistId } }), ...{ class: "block truncate text-xs text-flixer-muted hover:text-white hover:underline" },
            }));
            const __VLS_13 = __VLS_12({
                to: ({ name: 'person', params: { id: current.value.artistId } }),
                ...{ class: "block truncate text-xs text-flixer-muted hover:text-white hover:underline" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_12));
            /** @type {__VLS_StyleScopedClasses['block']} */ ;
            /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:underline']} */ ;
            var __VLS_14;
            const { default: __VLS_16 } = __VLS_nonNull(__VLS_14.slots);
            (current.value.artist);
            // @ts-ignore
            [current, current, current, current, current, player,];
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "truncate text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (player.value.error.value ? __VLS_unwrap(t, {})('music.error') : (current.value.artist ?? current.value.album ?? ''));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex flex-col items-center gap-1 md:flex-1" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:flex-1']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex items-center gap-1 sm:gap-3" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:gap-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!(visible.value && current.value))
                        throw 0;
                    return (player.value.toggleShuffle());
                    // @ts-ignore
                    [current, current, t, player, player,];
                } },
            type: "button",
            ...{ class: "hidden size-9 place-items-center rounded transition hover:bg-white/10 sm:grid" },
            ...{ class: (shuffle.value ? 'text-flixer-accent' : 'text-white') },
            'aria-pressed': (shuffle.value),
            'aria-label': (__VLS_unwrap(t, {})('music.shuffle')),
        });
        /** @type {__VLS_StyleScopedClasses['hidden']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-9']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:grid']} */ ;
        let __VLS_17;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({
            // @ts-ignore
            icon: "lucide:shuffle", ...{ class: "size-5" }, 'aria-hidden': "true",
        }));
        const __VLS_19 = __VLS_18({
            icon: "lucide:shuffle",
            ...{ class: "size-5" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_18));
        /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!(visible.value && current.value))
                        throw 0;
                    return (player.value.previous());
                    // @ts-ignore
                    [t, player, shuffle, shuffle,];
                } },
            type: "button",
            ...{ class: "grid size-9 place-items-center rounded text-white transition hover:bg-white/10" },
            'aria-label': (__VLS_unwrap(t, {})('music.previous')),
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-9']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
        let __VLS_22;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_23 = __VLS_asFunctionalComponent1(__VLS_22, new __VLS_22({
            // @ts-ignore
            icon: "lucide:skip-back", ...{ class: "size-5" }, 'aria-hidden': "true",
        }));
        const __VLS_24 = __VLS_23({
            icon: "lucide:skip-back",
            ...{ class: "size-5" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_23));
        /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!(visible.value && current.value))
                        throw 0;
                    return (player.value.toggle());
                    // @ts-ignore
                    [t, player,];
                } },
            type: "button",
            ...{ class: "grid size-10 place-items-center rounded bg-white text-flixer-background transition hover:bg-white/85" },
            'aria-label': (isPlaying.value ? __VLS_unwrap(t, {})('music.pause') : __VLS_unwrap(t, {})('music.play')),
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-background']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/85']} */ ;
        if (isLoading.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "size-4 animate-spin rounded-full border-2 border-flixer-background/30 border-t-flixer-background" },
                'aria-hidden': "true",
            });
            /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-background/30']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-t-flixer-background']} */ ;
        }
        else if (isPlaying.value) {
            let __VLS_27;
            /** @ts-ignore @type { | typeof __VLS_components.Icon} */
            Icon;
            // @ts-ignore
            const __VLS_28 = __VLS_asFunctionalComponent1(__VLS_27, new __VLS_27({
                // @ts-ignore
                icon: "lucide:pause", ...{ class: "size-5" }, 'aria-hidden': "true",
            }));
            const __VLS_29 = __VLS_28({
                icon: "lucide:pause",
                ...{ class: "size-5" },
                'aria-hidden': "true",
            }, ...__VLS_functionalComponentArgsRest(__VLS_28));
            /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
        }
        else {
            let __VLS_32;
            /** @ts-ignore @type { | typeof __VLS_components.Icon} */
            Icon;
            // @ts-ignore
            const __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({
                // @ts-ignore
                icon: "lucide:play", ...{ class: "size-5" }, 'aria-hidden': "true",
            }));
            const __VLS_34 = __VLS_33({
                icon: "lucide:play",
                ...{ class: "size-5" },
                'aria-hidden': "true",
            }, ...__VLS_functionalComponentArgsRest(__VLS_33));
            /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!(visible.value && current.value))
                        throw 0;
                    return (player.value.next());
                    // @ts-ignore
                    [t, t, player, isPlaying, isPlaying, isLoading,];
                } },
            type: "button",
            ...{ class: "grid size-9 place-items-center rounded text-white transition hover:bg-white/10 disabled:opacity-40" },
            disabled: (!player.value.hasNext.value),
            'aria-label': (__VLS_unwrap(t, {})('music.next')),
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-9']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-40']} */ ;
        let __VLS_37;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_38 = __VLS_asFunctionalComponent1(__VLS_37, new __VLS_37({
            // @ts-ignore
            icon: "lucide:skip-forward", ...{ class: "size-5" }, 'aria-hidden': "true",
        }));
        const __VLS_39 = __VLS_38({
            icon: "lucide:skip-forward",
            ...{ class: "size-5" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_38));
        /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!(visible.value && current.value))
                        throw 0;
                    return (player.value.cycleRepeat());
                    // @ts-ignore
                    [t, player, player,];
                } },
            type: "button",
            ...{ class: "hidden size-9 place-items-center rounded transition hover:bg-white/10 sm:grid" },
            ...{ class: (repeat.value === 'off' ? 'text-white' : 'text-flixer-accent') },
            'aria-label': (repeat.value === 'one' ? __VLS_unwrap(t, {})('music.repeatOne') : repeat.value === 'all' ? __VLS_unwrap(t, {})('music.repeatAll') : __VLS_unwrap(t, {})('music.repeat')),
        });
        /** @type {__VLS_StyleScopedClasses['hidden']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-9']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:grid']} */ ;
        let __VLS_42;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42({
            // @ts-ignore
            icon: (repeat.value === 'one' ? 'lucide:repeat-1' : 'lucide:repeat'), ...{ class: "size-5" }, 'aria-hidden': "true",
        }));
        const __VLS_44 = __VLS_43({
            icon: (repeat.value === 'one' ? 'lucide:repeat-1' : 'lucide:repeat'),
            ...{ class: "size-5" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_43));
        /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "hidden w-full max-w-xl items-center gap-2 text-xs text-flixer-muted sm:flex" },
        });
        /** @type {__VLS_StyleScopedClasses['hidden']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['max-w-xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:flex']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "w-10 text-right tabular-nums" },
        });
        /** @type {__VLS_StyleScopedClasses['w-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        /** @type {__VLS_StyleScopedClasses['tabular-nums']} */ ;
        (__VLS_unwrap(formatTime, {})(__VLS_unwrap(currentTime, {})));
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onInput: (onSeek) },
            type: "range",
            min: "0",
            max: "100",
            step: "0.1",
            ...{ class: "h-1 flex-1 cursor-pointer accent-flixer-accent" },
            'aria-label': (__VLS_unwrap(t, {})('music.seek')),
            value: (__VLS_unwrap(progress, {})),
        });
        /** @type {__VLS_StyleScopedClasses['h-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
        /** @type {__VLS_StyleScopedClasses['accent-flixer-accent']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "w-10 tabular-nums" },
        });
        /** @type {__VLS_StyleScopedClasses['w-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['tabular-nums']} */ ;
        (__VLS_unwrap(formatTime, {})(__VLS_unwrap(duration, {})));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex items-center justify-end gap-1 md:w-1/4" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:w-1/4']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (addCurrentToPlaylist) },
            type: "button",
            ...{ class: "grid size-9 place-items-center rounded text-white transition hover:bg-white/10" },
            'aria-label': (__VLS_unwrap(t, {})('social.addToPlaylistFor', { title: current.value.title })),
            title: (__VLS_unwrap(t, {})('social.addToPlaylist')),
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-9']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
        let __VLS_47;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_48 = __VLS_asFunctionalComponent1(__VLS_47, new __VLS_47({
            // @ts-ignore
            icon: "lucide:plus", ...{ class: "size-5" }, 'aria-hidden': "true",
        }));
        const __VLS_49 = __VLS_48({
            icon: "lucide:plus",
            ...{ class: "size-5" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_48));
        /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
        if (canParty.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (onParty) },
                type: "button",
                ...{ class: "grid size-9 place-items-center rounded transition hover:bg-white/10 disabled:opacity-60" },
                ...{ class: (hostingListen.value ? 'text-flixer-accent' : 'text-white') },
                disabled: (__VLS_unwrap(partyBusy, {})),
                'aria-label': (hostingListen.value ? __VLS_unwrap(t, {})('party.copyLink') : __VLS_unwrap(t, {})('party.startListen')),
                title: (hostingListen.value ? __VLS_unwrap(t, {})('party.copyLink') : __VLS_unwrap(t, {})('party.startListen')),
            });
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['size-9']} */ ;
            /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
            let __VLS_52;
            /** @ts-ignore @type { | typeof __VLS_components.Icon} */
            Icon;
            // @ts-ignore
            const __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52({
                // @ts-ignore
                icon: "lucide:users-round", ...{ class: "size-5" }, 'aria-hidden': "true",
            }));
            const __VLS_54 = __VLS_53({
                icon: "lucide:users-round",
                ...{ class: "size-5" },
                'aria-hidden': "true",
            }, ...__VLS_functionalComponentArgsRest(__VLS_53));
            /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!(visible.value && current.value))
                        throw 0;
                    return (lyricsOpen.value = true);
                    // @ts-ignore
                    [current, t, t, t, t, t, t, t, t, t, t, repeat, repeat, repeat, repeat, formatTime, formatTime, currentTime, progress, duration, canParty, hostingListen, hostingListen, hostingListen, partyBusy, lyricsOpen,];
                } },
            type: "button",
            ...{ class: "grid h-9 place-items-center rounded px-3 text-sm font-semibold text-white transition hover:bg-white/10" },
            'aria-label': (__VLS_unwrap(t, {})('music.lyrics')),
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-9']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
        let __VLS_57;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_58 = __VLS_asFunctionalComponent1(__VLS_57, new __VLS_57({
            // @ts-ignore
            icon: "lucide:list-music", ...{ class: "size-5 md:hidden" }, 'aria-hidden': "true",
        }));
        const __VLS_59 = __VLS_58({
            icon: "lucide:list-music",
            ...{ class: "size-5 md:hidden" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_58));
        /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:hidden']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "hidden md:inline" },
        });
        /** @type {__VLS_StyleScopedClasses['hidden']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:inline']} */ ;
        (__VLS_unwrap(t, {})('music.lyrics'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onInput: (onVolume) },
            type: "range",
            min: "0",
            max: "1",
            step: "0.01",
            ...{ class: "hidden h-1 w-24 cursor-pointer accent-flixer-accent lg:block" },
            'aria-label': (__VLS_unwrap(t, {})('music.volume')),
            value: (__VLS_unwrap(volume, {})),
        });
        /** @type {__VLS_StyleScopedClasses['hidden']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-24']} */ ;
        /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
        /** @type {__VLS_StyleScopedClasses['accent-flixer-accent']} */ ;
        /** @type {__VLS_StyleScopedClasses['lg:block']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!(visible.value && current.value))
                        throw 0;
                    return (player.value.stop());
                    // @ts-ignore
                    [t, t, t, player, volume,];
                } },
            type: "button",
            ...{ class: "grid size-9 place-items-center rounded text-flixer-muted transition hover:bg-white/10 hover:text-white" },
            'aria-label': (__VLS_unwrap(t, {})('music.close')),
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-9']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
        let __VLS_62;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_63 = __VLS_asFunctionalComponent1(__VLS_62, new __VLS_62({
            // @ts-ignore
            icon: "lucide:x", ...{ class: "size-4" }, 'aria-hidden': "true",
        }));
        const __VLS_64 = __VLS_63({
            icon: "lucide:x",
            ...{ class: "size-4" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_63));
        /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "h-0.5 bg-white/10 sm:hidden" },
            'aria-hidden': "true",
        });
        /** @type {__VLS_StyleScopedClasses['h-0.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:hidden']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "h-full bg-flixer-accent" },
            ...{ style: ({ width: `${__VLS_unwrap(progress, {})}%` }) },
        });
        /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-accent']} */ ;
    }
    // @ts-ignore
    [t, progress,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
