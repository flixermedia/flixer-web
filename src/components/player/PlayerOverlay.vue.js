import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { getItemPlaybackInfo, getPreferences, getStreamInfo, getWatchProgress, saveWatchProgress, updatePreferences } from '../../api';
import { expectedPosition, useParty } from '../../composables/useParty';
import { notify } from '../../composables/notify';
import { useVideoOverlay } from '../../composables/useVideoOverlay';
import VideoPlayer from './VideoPlayer.vue';
import PlayerSkeleton from './PlayerSkeleton.vue';
import { isNativeApp } from '../../platform/serverConnection';
import { describeRequestError } from '../../composables/useProfile';
import { catchError } from '../../utils/catchError';
import { getGuideChannelPlaybackInfo } from '../../api/guide';
import LiveGuidePanel from './LiveGuidePanel.vue';
const { defineProps, defineEmits, withDefaults, } = {};
const NativeVideoPlayer = defineAsyncComponent(() => import('./NativeVideoPlayer.vue'));
const props = withDefaults(defineProps(), { autoplay: true, startMini: false });
const emit = defineEmits();
const { t } = useI18n();
const playback = ref(null);
const info = ref(null);
const autoSkipIntroCredits = ref(true);
const defaultAudioLanguage = ref('');
const error = ref('');
const liveTitle = ref(props.title);
const liveGuideOpen = ref(false);
const switchingChannelId = ref('');
const liveGuideError = ref('');
const startAt = ref(0);
const mini = ref(props.startMini);
const party = useParty();
const nativePlayback = isNativeApp();
const videoPlayer = ref();
const videoParty = computed(() => party.party.value?.kind === 'video');
// Guests follow the host, so their own controls are disabled.
const locked = computed(() => videoParty.value && party.isGuest.value);
const { play } = useVideoOverlay();
function isGuidePlayback(value) {
    return Boolean(value && 'playSessionId' in value);
}
const livePlayback = computed(() => (isGuidePlayback(playback.value) ? playback.value : null));
const isLive = computed(() => Boolean(livePlayback.value));
const currentTitle = computed(() => (isLive.value ? liveTitle.value : props.title));
/** Closing the player as host ends the party for everyone. */
function closeOverlay() {
    if (videoParty.value && party.isHost.value)
        void party.leave();
    emit('close');
}
const chapters = computed(() => (playback.value && 'chapters' in playback.value ? playback.value.chapters : []));
const segments = computed(() => (playback.value && 'segments' in playback.value ? playback.value.segments : []));
const nextEpisode = computed(() => (playback.value && 'nextEpisode' in playback.value ? playback.value.nextEpisode : null));
const container = computed(() => livePlayback.value?.mediaSource.container ?? 'm3u8');
const nextLabel = computed(() => {
    const next = nextEpisode.value;
    if (!next)
        return undefined;
    const code = next.seasonNumber != null && next.episodeNumber != null ? `S${next.seasonNumber}:E${next.episodeNumber} ` : '';
    return `${code}${next.title}`;
});
// Swapping the playing item reloads in place, so a corner player stays in the corner.
function playNext() {
    const next = nextEpisode.value;
    if (next)
        play({ id: next.id, title: next.title });
}
function onControl(state) {
    if (videoParty.value && party.isHost.value) {
        if (!party.sendVideoCommand({ action: state.action, position: state.position }, props.itemId))
            syncVideo();
    }
}
function syncVideo() {
    const state = party.latest.value;
    if (!videoParty.value || !state || !videoPlayer.value)
        return;
    videoPlayer.value.applyRemote({ playing: state.party.playing, position: expectedPosition(state) });
}
watch([() => party.latest.value, videoPlayer], syncVideo);
let partyBeat;
function onProgress(position, duration) {
    if (isLive.value)
        return;
    void saveWatchProgress(props.itemId, position, duration).catch(() => { });
}
// Explicit geometry in both states so the move to the corner can animate.
const frameStyle = computed(() => {
    if (!mini.value)
        return { top: '0px', left: '0px', width: '100vw', height: '100dvh' };
    const width = 'min(24rem, 70vw)';
    const height = `calc(${width} * 9 / 16)`;
    return { width, height, top: `calc(100dvh - ${height} - 1rem)`, left: `calc(100vw - ${width} - 1rem)` };
});
function setMini(value) {
    if (value && document.fullscreenElement)
        void document.exitFullscreen().catch(() => { });
    mini.value = value;
    if (value)
        liveGuideOpen.value = false;
    // The page behind a corner player stays scrollable.
    document.body.style.overflow = value ? '' : 'hidden';
}
async function switchLiveChannel(channel) {
    if (!channel.watchable || switchingChannelId.value)
        return;
    switchingChannelId.value = channel.id;
    liveGuideError.value = '';
    const [playbackError, nextPlayback] = await catchError(Promise.resolve().then(() => getGuideChannelPlaybackInfo(channel.id)));
    if (playbackError) {
        console.error('[player] live channel switch failed', playbackError);
        liveGuideError.value = describeRequestError(playbackError, t('player.liveGuidePlaybackError'));
    }
    else {
        playback.value = nextPlayback;
        liveTitle.value = channel.name;
        error.value = '';
    }
    switchingChannelId.value = '';
}
function onKeydown(event) {
    // While in browser fullscreen, Escape only leaves fullscreen.
    if (nativePlayback || event.key !== 'Escape' || document.fullscreenElement)
        return;
    if (mini.value)
        closeOverlay();
    else
        setMini(true);
}
async function load(itemId) {
    playback.value = null;
    info.value = null;
    error.value = '';
    startAt.value = 0;
    if (props.livePlayback) {
        playback.value = props.livePlayback;
        info.value = {
            playMethod: 'DirectPlay',
            source: { videoCodec: 'h264', audioCodec: 'aac', width: 0, height: 0, durationSeconds: 0 },
            availableHeights: [],
        };
        return;
    }
    const [playbackError, next] = await catchError(Promise.resolve().then(() => getItemPlaybackInfo(itemId)));
    if (playbackError) {
        if (itemId === props.itemId)
            error.value = t('player.couldNotGetStreamUrl');
        return;
    }
    const [streamError, streamInfo] = await catchError(Promise.resolve().then(() => getStreamInfo(next.mediaSource.streamUrl)));
    if (streamError) {
        if (itemId === props.itemId)
            error.value = t('player.couldNotGetStreamUrl');
        return;
    }
    // Resuming is best effort; playback still starts from the beginning if this fails.
    const resume = props.startAtSeconds ??
        (await getWatchProgress(itemId)
            .then((progress) => progress.positionSeconds)
            .catch(() => 0));
    if (itemId !== props.itemId)
        return;
    startAt.value = resume;
    info.value = streamInfo;
    playback.value = next;
}
async function loadPlaybackPreferences() {
    const [preferenceError, preferences] = await catchError(getPreferences());
    if (preferenceError) {
        console.error('[player] playback preferences load failed', preferenceError);
        notify.error(describeRequestError(preferenceError, t('settings.playback.loadFailed')));
        return;
    }
    autoSkipIntroCredits.value = preferences.autoSkipIntroCredits ?? true;
    defaultAudioLanguage.value = preferences.audioLanguage ?? '';
}
async function updateAutoSkipIntroCredits(enabled) {
    const previous = autoSkipIntroCredits.value;
    autoSkipIntroCredits.value = enabled;
    const [preferenceError] = await catchError(updatePreferences({ autoSkipIntroCredits: enabled }));
    if (preferenceError) {
        console.error('[player] playback preference update failed', preferenceError);
        autoSkipIntroCredits.value = previous;
        notify.error(describeRequestError(preferenceError, t('settings.playback.saveFailed')));
    }
}
watch(() => [props.itemId, props.startAtSeconds], () => void load(props.itemId));
onMounted(() => {
    document.body.style.overflow = mini.value ? '' : 'hidden';
    window.addEventListener('keydown', onKeydown);
    void loadPlaybackPreferences().then(() => load(props.itemId));
    partyBeat = setInterval(syncVideo, 5_000);
});
onBeforeUnmount(() => {
    document.body.style.overflow = '';
    clearInterval(partyBeat);
    window.removeEventListener('keydown', onKeydown);
});
const __VLS_defaults = { autoplay: true, startMini: false };
void __VLS_defaults;
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(mini, {});
    __VLS_withDotValue(playback, {});
    __VLS_withDotValue(info, {});
    __VLS_withDotValue(nativePlayback, {});
    __VLS_withDotValue(isLive, {});
    __VLS_withDotValue(error, {});
    __VLS_withDotValue(liveGuideOpen, {});
    __VLS_withDotValue(livePlayback, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "theme-dark fixed z-[100] overflow-hidden bg-black transition-[top,left,width,height,border-radius,box-shadow] duration-300 ease-in-out motion-reduce:transition-none" },
        ...{ class: (mini.value ? 'rounded shadow-2xl shadow-black/70 ring-1 ring-white/15' : '') },
        ...{ style: (__VLS_unwrap(frameStyle, {})) },
        role: "dialog",
        'aria-modal': (!mini.value),
        'aria-label': (__VLS_unwrap(currentTitle, {})),
    });
    /** @type {__VLS_StyleScopedClasses['theme-dark']} */ ;
    /** @type {__VLS_StyleScopedClasses['fixed']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-[100]']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-black']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-[top,left,width,height,border-radius,box-shadow]']} */ ;
    /** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['ease-in-out']} */ ;
    /** @type {__VLS_StyleScopedClasses['motion-reduce:transition-none']} */ ;
    if (playback.value && info.value && nativePlayback.value && !isLive.value) {
        let __VLS_0;
        /** @ts-ignore @type { | typeof NativeVideoPlayer} */
        NativeVideoPlayer;
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
            // @ts-ignore
            ...{ 'onBack': {} }, ...{ 'onError': {} }, ...{ 'onProgress': {} }, ...{ 'onControl': {} }, ...{ 'onNext': {} }, ref: "videoPlayer", locked: (__VLS_unwrap(locked, {})), streamUrl: (playback.value.mediaSource.streamUrl), container: (playback.value.mediaSource.container), info: (info.value), defaultAudioLanguage: (__VLS_unwrap(defaultAudioLanguage, {})), title: (__VLS_unwrap(currentTitle, {})), startAt: (__VLS_unwrap(startAt, {})), autoplay: (props.autoplay), nextLabel: (__VLS_unwrap(nextLabel, {})),
        }));
        const __VLS_2 = __VLS_1({
            ...{ 'onBack': {} },
            ...{ 'onError': {} },
            ...{ 'onProgress': {} },
            ...{ 'onControl': {} },
            ...{ 'onNext': {} },
            ref: "videoPlayer",
            locked: (__VLS_unwrap(locked, {})),
            streamUrl: (playback.value.mediaSource.streamUrl),
            container: (playback.value.mediaSource.container),
            info: (info.value),
            defaultAudioLanguage: (__VLS_unwrap(defaultAudioLanguage, {})),
            title: (__VLS_unwrap(currentTitle, {})),
            startAt: (__VLS_unwrap(startAt, {})),
            autoplay: (props.autoplay),
            nextLabel: (__VLS_unwrap(nextLabel, {})),
        }, ...__VLS_functionalComponentArgsRest(__VLS_1));
        let __VLS_5;
        const __VLS_6 = {
            /** @type {typeof __VLS_5.back} */
            onBack: (...[$event]) => {
                void $event;
                if (!(playback.value && info.value && nativePlayback.value && !isLive.value))
                    throw 0;
                return (closeOverlay());
                // @ts-ignore
                [mini, mini, frameStyle, currentTitle, currentTitle, playback, playback, playback, info, info, nativePlayback, isLive, locked, defaultAudioLanguage, startAt, nextLabel,];
            },
        };
        void __VLS_6;
        const __VLS_7 = {
            /** @type {typeof __VLS_5.error} */
            onError: (...[$event]) => {
                void $event;
                if (!(playback.value && info.value && nativePlayback.value && !isLive.value))
                    throw 0;
                return (error.value = $event);
                // @ts-ignore
                [error,];
            },
        };
        void __VLS_7;
        const __VLS_8 = {
            /** @type {typeof __VLS_5.progress} */
            onProgress: (onProgress),
        };
        void __VLS_8;
        const __VLS_9 = {
            /** @type {typeof __VLS_5.control} */
            onControl: (onControl),
        };
        void __VLS_9;
        const __VLS_10 = {
            /** @type {typeof __VLS_5.next} */
            onNext: (playNext),
        };
        void __VLS_10;
        var __VLS_3;
        var __VLS_4;
    }
    else if (playback.value && info.value) {
        const __VLS_11 = VideoPlayer;
        // @ts-ignore
        const __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11({
            // @ts-ignore
            ...{ 'onToggleMini': {} }, ...{ 'onToggleLiveGuide': {} }, ...{ 'onAutoSkipIntroCreditsChange': {} }, ...{ 'onBack': {} }, ...{ 'onError': {} }, ...{ 'onProgress': {} }, ...{ 'onControl': {} }, ...{ 'onNext': {} }, ref: "videoPlayer", live: (isLive.value), liveGuideOpen: (liveGuideOpen.value), container: (__VLS_unwrap(container, {})), locked: (__VLS_unwrap(locked, {})), streamUrl: (playback.value.mediaSource.streamUrl), info: (info.value), defaultAudioLanguage: (__VLS_unwrap(defaultAudioLanguage, {})), title: (__VLS_unwrap(currentTitle, {})), startAt: (__VLS_unwrap(startAt, {})), autoplay: (props.autoplay), chapters: (__VLS_unwrap(chapters, {})), segments: (__VLS_unwrap(segments, {})), autoSkipIntroCredits: (__VLS_unwrap(autoSkipIntroCredits, {})), nextLabel: (__VLS_unwrap(nextLabel, {})), showBack: true, allowMini: true, mini: (mini.value),
        }));
        const __VLS_13 = __VLS_12({
            ...{ 'onToggleMini': {} },
            ...{ 'onToggleLiveGuide': {} },
            ...{ 'onAutoSkipIntroCreditsChange': {} },
            ...{ 'onBack': {} },
            ...{ 'onError': {} },
            ...{ 'onProgress': {} },
            ...{ 'onControl': {} },
            ...{ 'onNext': {} },
            ref: "videoPlayer",
            live: (isLive.value),
            liveGuideOpen: (liveGuideOpen.value),
            container: (__VLS_unwrap(container, {})),
            locked: (__VLS_unwrap(locked, {})),
            streamUrl: (playback.value.mediaSource.streamUrl),
            info: (info.value),
            defaultAudioLanguage: (__VLS_unwrap(defaultAudioLanguage, {})),
            title: (__VLS_unwrap(currentTitle, {})),
            startAt: (__VLS_unwrap(startAt, {})),
            autoplay: (props.autoplay),
            chapters: (__VLS_unwrap(chapters, {})),
            segments: (__VLS_unwrap(segments, {})),
            autoSkipIntroCredits: (__VLS_unwrap(autoSkipIntroCredits, {})),
            nextLabel: (__VLS_unwrap(nextLabel, {})),
            showBack: true,
            allowMini: true,
            mini: (mini.value),
        }, ...__VLS_functionalComponentArgsRest(__VLS_12));
        let __VLS_16;
        const __VLS_17 = {
            /** @type {typeof __VLS_16.toggleMini} */
            onToggleMini: (...[$event]) => {
                void $event;
                if (!!(playback.value && info.value && nativePlayback.value && !isLive.value))
                    throw 0;
                if (!(playback.value && info.value))
                    throw 0;
                return (setMini(!mini.value));
                // @ts-ignore
                [mini, mini, currentTitle, playback, playback, info, info, isLive, locked, defaultAudioLanguage, startAt, nextLabel, liveGuideOpen, container, chapters, segments, autoSkipIntroCredits,];
            },
        };
        void __VLS_17;
        const __VLS_18 = {
            /** @type {typeof __VLS_16.toggleLiveGuide} */
            onToggleLiveGuide: (...[$event]) => {
                void $event;
                if (!!(playback.value && info.value && nativePlayback.value && !isLive.value))
                    throw 0;
                if (!(playback.value && info.value))
                    throw 0;
                return (liveGuideOpen.value = !liveGuideOpen.value);
                // @ts-ignore
                [liveGuideOpen, liveGuideOpen,];
            },
        };
        void __VLS_18;
        const __VLS_19 = {
            /** @type {typeof __VLS_16.autoSkipIntroCreditsChange} */
            onAutoSkipIntroCreditsChange: (updateAutoSkipIntroCredits),
        };
        void __VLS_19;
        const __VLS_20 = {
            /** @type {typeof __VLS_16.back} */
            onBack: (...[$event]) => {
                void $event;
                if (!!(playback.value && info.value && nativePlayback.value && !isLive.value))
                    throw 0;
                if (!(playback.value && info.value))
                    throw 0;
                return (closeOverlay());
                // @ts-ignore
                [];
            },
        };
        void __VLS_20;
        const __VLS_21 = {
            /** @type {typeof __VLS_16.error} */
            onError: (...[$event]) => {
                void $event;
                if (!!(playback.value && info.value && nativePlayback.value && !isLive.value))
                    throw 0;
                if (!(playback.value && info.value))
                    throw 0;
                return (error.value = $event);
                // @ts-ignore
                [error,];
            },
        };
        void __VLS_21;
        const __VLS_22 = {
            /** @type {typeof __VLS_16.progress} */
            onProgress: (onProgress),
        };
        void __VLS_22;
        const __VLS_23 = {
            /** @type {typeof __VLS_16.control} */
            onControl: (onControl),
        };
        void __VLS_23;
        const __VLS_24 = {
            /** @type {typeof __VLS_16.next} */
            onNext: (playNext),
        };
        void __VLS_24;
        var __VLS_14;
        var __VLS_15;
    }
    if (livePlayback.value && liveGuideOpen.value && !mini.value) {
        const __VLS_25 = LiveGuidePanel;
        // @ts-ignore
        const __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25({
            // @ts-ignore
            ...{ 'onClose': {} }, ...{ 'onSelectChannel': {} }, currentChannelId: (livePlayback.value.mediaSource.id), switchingChannelId: (__VLS_unwrap(switchingChannelId, {})), switchError: (__VLS_unwrap(liveGuideError, {})),
        }));
        const __VLS_27 = __VLS_26({
            ...{ 'onClose': {} },
            ...{ 'onSelectChannel': {} },
            currentChannelId: (livePlayback.value.mediaSource.id),
            switchingChannelId: (__VLS_unwrap(switchingChannelId, {})),
            switchError: (__VLS_unwrap(liveGuideError, {})),
        }, ...__VLS_functionalComponentArgsRest(__VLS_26));
        let __VLS_30;
        const __VLS_31 = {
            /** @type {typeof __VLS_30.close} */
            onClose: (...[$event]) => {
                void $event;
                if (!(livePlayback.value && liveGuideOpen.value && !mini.value))
                    throw 0;
                return (liveGuideOpen.value = false);
                // @ts-ignore
                [mini, liveGuideOpen, liveGuideOpen, livePlayback, livePlayback, switchingChannelId, liveGuideError,];
            },
        };
        void __VLS_31;
        const __VLS_32 = {
            /** @type {typeof __VLS_30.selectChannel} */
            onSelectChannel: (switchLiveChannel),
        };
        void __VLS_32;
        var __VLS_28;
        var __VLS_29;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "relative size-full" },
        });
        /** @type {__VLS_StyleScopedClasses['relative']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-full']} */ ;
        if (error.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "absolute inset-0 grid place-items-center p-6 text-center text-sm text-red-400" },
                role: "alert",
            });
            /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
            /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-6']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-red-400']} */ ;
            (error.value);
        }
        else {
            const __VLS_33 = PlayerSkeleton;
            // @ts-ignore
            const __VLS_34 = __VLS_asFunctionalComponent1(__VLS_33, new __VLS_33({
            // @ts-ignore
            }));
            const __VLS_35 = __VLS_34({}, ...__VLS_functionalComponentArgsRest(__VLS_34));
        }
    }
    if (error.value && playback.value && info.value && nativePlayback.value && !isLive.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "absolute inset-x-4 bottom-4 rounded bg-red-950/90 p-3 text-center text-sm text-red-100" },
            role: "alert",
        });
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['inset-x-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['bottom-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-red-950/90']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-100']} */ ;
        (error.value);
    }
    if ((!(playback.value && info.value) || (error.value && nativePlayback.value && !isLive.value)) && !mini.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!((!(playback.value && info.value) || (error.value && nativePlayback.value && !isLive.value)) && !mini.value))
                        throw 0;
                    return (closeOverlay());
                    // @ts-ignore
                    [mini, playback, playback, info, info, nativePlayback, nativePlayback, isLive, isLive, error, error, error, error, error,];
                } },
            type: "button",
            ...{ class: "absolute left-4 top-4 rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20" },
        });
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['left-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['top-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/20']} */ ;
        (__VLS_unwrap(t, {})('mediaItem.close'));
    }
    // @ts-ignore
    [t,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
export default {};
