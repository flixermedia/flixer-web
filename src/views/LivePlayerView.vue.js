import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { getGuideChannelPlaybackInfo } from '../api/guide';
import PlayerSkeleton from '../components/player/PlayerSkeleton.vue';
import { takePendingLivePlayback } from '../composables/livePlayback';
import { useVideoOverlay } from '../composables/useVideoOverlay';
import { catchError } from '../utils/catchError';
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const videoOverlay = useVideoOverlay();
const playback = ref(null);
const loading = ref(true);
const error = ref('');
let loadSequence = 0;
const channelId = computed(() => String(route.params.channelId ?? ''));
async function openPlayer(next, id) {
    playback.value = next;
    videoOverlay.play({ id, title: next.mediaSource.title, livePlayback: next });
    const [navigationError] = await catchError(router.replace({ name: 'guide' }));
    if (navigationError)
        console.error('[live-player] failed to return to the guide', navigationError);
}
async function load(id) {
    const sequence = ++loadSequence;
    playback.value = null;
    error.value = '';
    loading.value = true;
    const pending = takePendingLivePlayback(id);
    if (pending) {
        await openPlayer(pending.playback, id);
        loading.value = false;
        return;
    }
    try {
        const next = await getGuideChannelPlaybackInfo(id);
        if (sequence === loadSequence)
            await openPlayer(next, id);
    }
    catch (cause) {
        if (sequence === loadSequence) {
            console.error('[live-player] failed to get live playback info', cause);
            error.value = t('epg.playbackError');
        }
    }
    finally {
        if (sequence === loadSequence)
            loading.value = false;
    }
}
function close() {
    void router.replace({ name: 'guide' });
}
watch(channelId, (id) => {
    if (id)
        void load(id);
}, { immediate: true });
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(loading, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({
        ...{ class: "theme-dark fixed inset-0 z-[100] bg-black" },
    });
    /** @type {__VLS_StyleScopedClasses['theme-dark']} */ ;
    /** @type {__VLS_StyleScopedClasses['fixed']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-[100]']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-black']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid size-full place-items-center p-6 text-center" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['size-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    if (loading.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        const __VLS_0 = PlayerSkeleton;
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        }));
        const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-4 text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('epg.openingPlayer'));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            role: "alert",
            ...{ class: "max-w-md text-sm text-red-200" },
        });
        /** @type {__VLS_StyleScopedClasses['max-w-md']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-200']} */ ;
        (__VLS_unwrap(error, {}));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (close) },
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
        (__VLS_unwrap(t, {})('player.back'));
    }
    // @ts-ignore
    [loading, t, t, error,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
