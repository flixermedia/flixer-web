import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { ModalOverlay, ModalTarget } from '@kolirt/vue-modal';
import IdleSplash from './components/ui/IdleSplash.vue';
import OfflineBanner from './components/ui/OfflineBanner.vue';
import MiniPlayer from './components/player/MiniPlayer.vue';
import PlayerOverlay from './components/player/PlayerOverlay.vue';
import LyricsView from './views/LyricsView.vue';
import { useAudioPlayer } from './composables/useAudioPlayer';
import { useIdleSplash } from './composables/useIdleSplash';
import { useParty } from './composables/useParty';
import { useVideoOverlay } from './composables/useVideoOverlay';
import { getAccessToken } from './api';
const audio = useAudioPlayer();
const { lyricsOpen } = audio;
const party = useParty();
const { playing, close: closeVideo } = useVideoOverlay();
const idle = useIdleSplash(() => playing.value !== null);
if (getAccessToken())
    void party.resume();
if (Capacitor.isNativePlatform()) {
    void CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        if (!isActive)
            return;
        void audio.refreshNativePlayback().catch((error) => {
            console.error('Could not refresh native audio after resuming the app', error);
        });
        party.reconnect();
    }).catch((error) => {
        console.error('Could not listen for native app state changes', error);
    });
}
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(playing, {});
    __VLS_withDotValue(lyricsOpen, {});
    __VLS_withDotValue(idle, {});
    let __VLS_0;
    /** @ts-ignore @type { | typeof __VLS_components.RouterView | typeof __VLS_components.RouterView} */
    RouterView;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    // @ts-ignore
    }));
    const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
    var __VLS_3;
    {
        const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
        const [{ Component, route }] = __VLS_vSlot(__VLS_nonNull(__VLS_5));
        let __VLS_6;
        /** @ts-ignore @type { | typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
        Transition;
        // @ts-ignore
        const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
            // @ts-ignore
            name: "page", mode: "out-in",
        }));
        const __VLS_8 = __VLS_7({
            name: "page",
            mode: "out-in",
        }, ...__VLS_functionalComponentArgsRest(__VLS_7));
        var __VLS_9;
        const { default: __VLS_11 } = __VLS_nonNull(__VLS_9.slots);
        const __VLS_12 = (Component);
        // @ts-ignore
        const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
            // @ts-ignore
            key: (route.path),
        }));
        const __VLS_14 = __VLS_13({
            key: (route.path),
        }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    }
    const __VLS_17 = MiniPlayer;
    // @ts-ignore
    const __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({
    // @ts-ignore
    }));
    const __VLS_19 = __VLS_18({}, ...__VLS_functionalComponentArgsRest(__VLS_18));
    if (playing.value) {
        const __VLS_22 = PlayerOverlay;
        // @ts-ignore
        const __VLS_23 = __VLS_asFunctionalComponent1(__VLS_22, new __VLS_22({
            // @ts-ignore
            ...{ 'onClose': {} }, itemId: (playing.value.id), startAtSeconds: (playing.value.startAt), title: (playing.value.title), autoplay: (playing.value.autoplay), livePlayback: (playing.value.livePlayback), startMini: (playing.value.startMini),
        }));
        const __VLS_24 = __VLS_23({
            ...{ 'onClose': {} },
            itemId: (playing.value.id),
            startAtSeconds: (playing.value.startAt),
            title: (playing.value.title),
            autoplay: (playing.value.autoplay),
            livePlayback: (playing.value.livePlayback),
            startMini: (playing.value.startMini),
        }, ...__VLS_functionalComponentArgsRest(__VLS_23));
        let __VLS_27;
        const __VLS_28 = {
            /** @type {typeof __VLS_27.close} */
            onClose: (__VLS_unwrap(closeVideo, {})),
        };
        void __VLS_28;
        var __VLS_25;
        var __VLS_26;
    }
    let __VLS_29;
    /** @ts-ignore @type { | typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
    Transition;
    // @ts-ignore
    const __VLS_30 = __VLS_asFunctionalComponent1(__VLS_29, new __VLS_29({
        // @ts-ignore
        name: "lyrics",
    }));
    const __VLS_31 = __VLS_30({
        name: "lyrics",
    }, ...__VLS_functionalComponentArgsRest(__VLS_30));
    var __VLS_32;
    const { default: __VLS_34 } = __VLS_nonNull(__VLS_32.slots);
    if (lyricsOpen.value) {
        const __VLS_35 = LyricsView;
        // @ts-ignore
        const __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35({
        // @ts-ignore
        }));
        const __VLS_37 = __VLS_36({}, ...__VLS_functionalComponentArgsRest(__VLS_36));
    }
    // @ts-ignore
    [playing, playing, playing, playing, playing, playing, playing, closeVideo, lyricsOpen,];
    let __VLS_40;
    /** @ts-ignore @type { | typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
    Transition;
    // @ts-ignore
    const __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40({
        // @ts-ignore
        name: "idle",
    }));
    const __VLS_42 = __VLS_41({
        name: "idle",
    }, ...__VLS_functionalComponentArgsRest(__VLS_41));
    var __VLS_43;
    const { default: __VLS_45 } = __VLS_nonNull(__VLS_43.slots);
    if (idle.value.active.value) {
        const __VLS_46 = IdleSplash;
        // @ts-ignore
        const __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46({
        // @ts-ignore
        }));
        const __VLS_48 = __VLS_47({}, ...__VLS_functionalComponentArgsRest(__VLS_47));
    }
    // @ts-ignore
    [idle,];
    const __VLS_51 = OfflineBanner;
    // @ts-ignore
    const __VLS_52 = __VLS_asFunctionalComponent1(__VLS_51, new __VLS_51({
    // @ts-ignore
    }));
    const __VLS_53 = __VLS_52({}, ...__VLS_functionalComponentArgsRest(__VLS_52));
    let __VLS_56;
    /** @ts-ignore @type { | typeof ModalTarget | typeof ModalTarget} */
    ModalTarget;
    // @ts-ignore
    const __VLS_57 = __VLS_asFunctionalComponent1(__VLS_56, new __VLS_56({
        // @ts-ignore
        group: "default", ...{ class: "z-50" },
    }));
    const __VLS_58 = __VLS_57({
        group: "default",
        ...{ class: "z-50" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_57));
    /** @type {__VLS_StyleScopedClasses['z-50']} */ ;
    var __VLS_59;
    const { default: __VLS_61 } = __VLS_nonNull(__VLS_59.slots);
    let __VLS_62;
    /** @ts-ignore @type { | typeof ModalOverlay} */
    ModalOverlay;
    // @ts-ignore
    const __VLS_63 = __VLS_asFunctionalComponent1(__VLS_62, new __VLS_62({
        // @ts-ignore
        ...{ class: "flixer-modal-overlay" },
    }));
    const __VLS_64 = __VLS_63({
        ...{ class: "flixer-modal-overlay" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_63));
    /** @type {__VLS_StyleScopedClasses['flixer-modal-overlay']} */ ;
    // @ts-ignore
    [];
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
