import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { getSamplePlaybackInfo, getStreamInfo, listSampleVideos } from '../api';
import Header from '../components/header/Header.vue';
import VideoPlayer from '../components/player/VideoPlayer.vue';
import { useSignOut } from '../composables/useSignOut';
import { catchError } from '../utils/catchError';
const { t } = useI18n();
const { isSigningOut, signOut } = useSignOut();
const samples = ref([]);
const selectedId = ref('');
const playback = ref(null);
const info = ref(null);
const loading = ref(false);
const error = ref('');
const selectedTitle = computed(() => samples.value.find((sample) => sample.id === selectedId.value)?.title ?? '');
onMounted(async () => {
    const [loadError, list] = await catchError(listSampleVideos());
    if (loadError) {
        error.value = t('player.couldNotLoadSamples');
        return;
    }
    samples.value = list;
    selectedId.value = samples.value.find((sample) => sample.container === 'mkv')?.id ?? samples.value[0]?.id ?? '';
    await load();
});
async function load() {
    if (!selectedId.value)
        return;
    loading.value = true;
    error.value = '';
    try {
        const [playbackError, next] = await catchError(getSamplePlaybackInfo(selectedId.value));
        if (playbackError) {
            playback.value = null;
            info.value = null;
            error.value = t('player.couldNotGetStreamUrl');
            return;
        }
        const [streamError, streamInfo] = await catchError(getStreamInfo(next.mediaSource.streamUrl));
        if (streamError) {
            playback.value = null;
            info.value = null;
            error.value = t('player.couldNotGetStreamUrl');
            return;
        }
        info.value = streamInfo;
        playback.value = next;
    }
    finally {
        loading.value = false;
    }
}
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(error, {});
    __VLS_withDotValue(playback, {});
    __VLS_withDotValue(info, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "min-h-screen overflow-x-hidden bg-flixer-background font-sans text-flixer-text" },
    });
    /** @type {__VLS_StyleScopedClasses['min-h-screen']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-x-hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-sans']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
    const __VLS_0 = Header;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        ...{ 'onLogout': {} }, links: ([]), isSigningOut: (__VLS_unwrap(isSigningOut, {})),
    }));
    const __VLS_2 = __VLS_1({
        ...{ 'onLogout': {} },
        links: ([]),
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
        ...{ class: "page-gutter w-full pb-16 pt-28" },
    });
    /** @type {__VLS_StyleScopedClasses['page-gutter']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['pb-16']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-28']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
        ...{ class: "text-3xl font-semibold tracking-tight" },
    });
    /** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-tight']} */ ;
    (__VLS_unwrap(t, {})('player.testTitle'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-2 text-sm text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('player.testDescription'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-6" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (load) },
        value: (__VLS_unwrap(selectedId, {})),
        ...{ class: "min-w-72 rounded border border-flixer-border bg-flixer-surface px-3 py-2 text-sm" },
        disabled: (__VLS_unwrap(loading, {})),
    });
    /** @type {__VLS_StyleScopedClasses['min-w-72']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    const __VLS_7 = __VLS_tryAsConstant((__VLS_unwrap(samples, {})));
    for (const [sample] of __VLS_vFor(__VLS_nonNull(__VLS_7))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (sample.id),
            value: (sample.id),
        });
        (sample.title);
        (sample.container);
        // @ts-ignore
        [isSigningOut, signOut, t, t, selectedId, loading, samples,];
    }
    if (error.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-4 text-sm text-red-400" },
            role: "alert",
        });
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-400']} */ ;
        (error.value);
    }
    if (playback.value && info.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-6 h-[calc(100vh-14rem)] min-h-80 w-full overflow-hidden rounded border border-flixer-border bg-black" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-[calc(100vh-14rem)]']} */ ;
        /** @type {__VLS_StyleScopedClasses['min-h-80']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-black']} */ ;
        const __VLS_8 = VideoPlayer;
        // @ts-ignore
        const __VLS_9 = __VLS_asFunctionalComponent1(__VLS_8, new __VLS_8({
            // @ts-ignore
            streamUrl: (playback.value.mediaSource.streamUrl), info: (info.value), title: (__VLS_unwrap(selectedTitle, {})),
        }));
        const __VLS_10 = __VLS_9({
            streamUrl: (playback.value.mediaSource.streamUrl),
            info: (info.value),
            title: (__VLS_unwrap(selectedTitle, {})),
        }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    }
    if (playback.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-3 text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('player.testControls'));
        (__VLS_unwrap(t, {})('player.tokenExpires', { expiresAt: new Date(playback.value.expiresAt).toLocaleString() }));
    }
    // @ts-ignore
    [t, t, error, error, playback, playback, playback, playback, info, info, selectedTitle,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
