import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { getGuide } from '../../api/guide';
const { defineProps, defineEmits, } = {};
const props = defineProps();
const emit = defineEmits();
const { t, locale } = useI18n();
const data = ref(null);
const now = ref(Date.now());
const loading = ref(false);
const loadingMore = ref(false);
const error = ref('');
const query = ref('');
const failedImages = ref(new Set());
let controller;
let clockTimer;
const channels = computed(() => {
    const search = query.value.trim().toLocaleLowerCase(locale.value);
    return (data.value?.channels ?? []).filter((channel) => !search || `${channel.name} ${channel.alternateNames.join(' ')}`.toLocaleLowerCase(locale.value).includes(search));
});
const hasMore = computed(() => Boolean(data.value && data.value.channels.length < data.value.totalChannels));
const programmesByChannel = computed(() => {
    const result = new Map();
    for (const programme of data.value?.programmes ?? []) {
        const channelProgrammes = result.get(programme.channelId) ?? [];
        channelProgrammes.push(programme);
        result.set(programme.channelId, channelProgrammes);
    }
    return result;
});
const currentChannel = computed(() => data.value?.channels.find((channel) => channel.id === props.currentChannelId));
const currentProgramme = computed(() => programmeNow(props.currentChannelId));
const nextProgramme = computed(() => programmeNext(props.currentChannelId));
function programmeNow(channelId) {
    return programmesByChannel.value.get(channelId)?.find((programme) => programme.start <= now.value && programme.stop > now.value);
}
function programmeNext(channelId) {
    return programmesByChannel.value
        .get(channelId)
        ?.filter((programme) => programme.start > now.value)
        .sort((left, right) => left.start - right.start)[0];
}
function formatTime(timestamp) {
    return new Intl.DateTimeFormat(locale.value, { hour: 'numeric', minute: '2-digit' }).format(timestamp);
}
function programmeProgress(programme) {
    return Math.max(0, Math.min(100, ((now.value - programme.start) / (programme.stop - programme.start)) * 100));
}
function imageFailed(channelId) {
    failedImages.value = new Set(failedImages.value).add(channelId);
}
function guideWindow() {
    const from = now.value - 2 * 60 * 60_000;
    return { from: new Date(from), to: new Date(from + 26 * 60 * 60_000) };
}
async function loadFirstPage() {
    controller?.abort();
    controller = new AbortController();
    const activeController = controller;
    loading.value = true;
    loadingMore.value = false;
    error.value = '';
    data.value = null;
    try {
        const { from, to } = guideWindow();
        data.value = await getGuide(from, to, 0, activeController.signal, 50);
        if (activeController.signal.aborted)
            return;
        while (data.value.channels.length < data.value.totalChannels && !data.value.channels.some((channel) => channel.id === props.currentChannelId)) {
            const previousChannelCount = data.value.channels.length;
            await loadNextPage(activeController);
            if (activeController.signal.aborted || error.value || !data.value || data.value.channels.length <= previousChannelCount)
                return;
        }
    }
    catch (cause) {
        if (activeController.signal.aborted)
            return;
        console.error('[live-guide] failed to load guide channels', cause);
        error.value = t('player.liveGuideLoadError');
    }
    finally {
        if (!activeController.signal.aborted)
            loading.value = false;
    }
}
async function loadNextPage(activeController = controller) {
    if (!data.value || !activeController || loadingMore.value || !hasMore.value)
        return;
    const offset = data.value.channels.length;
    loadingMore.value = true;
    try {
        const { from, to } = guideWindow();
        const page = await getGuide(from, to, offset, activeController.signal, 50);
        if (activeController.signal.aborted || activeController !== controller)
            return;
        const programmes = new Map(data.value.programmes.map((programme) => [`${programme.channelId}:${programme.start}`, programme]));
        for (const programme of page.programmes)
            programmes.set(`${programme.channelId}:${programme.start}`, programme);
        data.value = {
            ...data.value,
            channels: [...data.value.channels, ...page.channels],
            programmes: [...programmes.values()],
        };
    }
    catch (cause) {
        if (activeController.signal.aborted)
            return;
        console.error('[live-guide] failed to load more guide channels', cause);
        error.value = t('player.liveGuideLoadError');
    }
    finally {
        if (!activeController.signal.aborted && activeController === controller)
            loadingMore.value = false;
    }
}
function retry() {
    void loadFirstPage();
}
watch(() => props.currentChannelId, (channelId) => {
    if (!data.value || data.value.channels.some((channel) => channel.id === channelId))
        return;
    void loadFirstPage();
});
onMounted(() => {
    void loadFirstPage();
    clockTimer = setInterval(() => {
        now.value = Date.now();
    }, 30_000);
});
onBeforeUnmount(() => {
    controller?.abort();
    if (clockTimer)
        clearInterval(clockTimer);
});
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
    __VLS_withDotValue(data, {});
    __VLS_withDotValue(currentChannel, {});
    __VLS_withDotValue(failedImages, {});
    __VLS_withDotValue(currentProgramme, {});
    __VLS_withDotValue(nextProgramme, {});
    __VLS_withDotValue(loading, {});
    __VLS_withDotValue(error, {});
    __VLS_withDotValue(channels, {});
    __VLS_withDotValue(hasMore, {});
    __VLS_withDotValue(loadingMore, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.aside, __VLS_intrinsics.aside)({
        ...{ class: "absolute inset-0 z-30 flex flex-col border-l border-white/10 bg-flixer-background/95 text-flixer-text shadow-2xl shadow-black/60 backdrop-blur-xl sm:inset-y-4 sm:left-auto sm:right-4 sm:w-[26rem] sm:rounded sm:border" },
    });
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-30']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-l']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-background/95']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-black/60']} */ ;
    /** @type {__VLS_StyleScopedClasses['backdrop-blur-xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:inset-y-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:left-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:right-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:w-[26rem]']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:border']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
        ...{ class: "flex shrink-0 items-center gap-3 border-b border-white/10 px-4 py-3" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid size-9 place-items-center rounded bg-flixer-accent/15 text-flixer-accent" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['size-9']} */ ;
    /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-accent/15']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
    let __VLS_0;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        icon: "lucide:tv", ...{ class: "size-5" }, 'aria-hidden': "true",
    }));
    const __VLS_2 = __VLS_1({
        icon: "lucide:tv",
        ...{ class: "size-5" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "min-w-0 flex-1" },
    });
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
        ...{ class: "truncate text-sm font-semibold text-white" },
    });
    /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    (__VLS_unwrap(t, {})('player.liveGuide'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "truncate text-xs text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('player.liveGuideChannels', { count: data.value?.totalChannels ?? 0 }));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                void $event;
                return (__VLS_unwrap(emit, {})('close'));
                // @ts-ignore
                [t, t, data, emit,];
            } },
        type: "button",
        ...{ class: "grid size-9 place-items-center rounded text-flixer-muted transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-flixer-accent" },
        'aria-label': (__VLS_unwrap(t, {})('player.closeLiveGuide')),
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['size-9']} */ ;
    /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    let __VLS_5;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
        // @ts-ignore
        icon: "lucide:x", ...{ class: "size-5" }, 'aria-hidden': "true",
    }));
    const __VLS_7 = __VLS_6({
        icon: "lucide:x",
        ...{ class: "size-5" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_6));
    /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
    if (currentChannel.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "shrink-0 border-b border-white/10 bg-white/[0.03] p-4" },
        });
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/[0.03]']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex items-center gap-3" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid size-11 shrink-0 place-items-center overflow-hidden rounded border border-white/10 bg-white/5" },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-11']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/5']} */ ;
        if (currentChannel.value.icon && !failedImages.value.has(currentChannel.value.id)) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
                ...{ onError: (...[$event]) => {
                        void $event;
                        if (!(currentChannel.value))
                            throw 0;
                        if (!(currentChannel.value.icon && !failedImages.value.has(currentChannel.value.id)))
                            throw 0;
                        return (imageFailed(currentChannel.value.id));
                        // @ts-ignore
                        [t, currentChannel, currentChannel, currentChannel, currentChannel, failedImages,];
                    } },
                src: (currentChannel.value.icon),
                alt: (__VLS_unwrap(t, {})('epg.channelLogo', { channel: currentChannel.value.name })),
                ...{ class: "size-full object-contain p-1" },
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
            (currentChannel.value.name.slice(0, 2).toUpperCase());
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "min-w-0 flex-1" },
        });
        /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-[10px] font-semibold uppercase tracking-[0.16em] text-flixer-accent" },
        });
        /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['tracking-[0.16em]']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
        (__VLS_unwrap(t, {})('player.liveGuideNowOn'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
            ...{ class: "truncate text-sm font-semibold text-white" },
        });
        /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        (currentChannel.value.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-200" },
        });
        /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-red-500/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-200']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "size-1.5 animate-pulse rounded-full bg-red-400" },
        });
        /** @type {__VLS_StyleScopedClasses['size-1.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-red-400']} */ ;
        (__VLS_unwrap(t, {})('epg.live'));
        if (currentProgramme.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mt-4" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex items-start justify-between gap-3" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({
                ...{ class: "min-w-0 flex-1 text-base font-semibold leading-5 text-white" },
            });
            /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-base']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['leading-5']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            (currentProgramme.value.title);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "shrink-0 text-[11px] tabular-nums text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-[11px]']} */ ;
            /** @type {__VLS_StyleScopedClasses['tabular-nums']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (formatTime(currentProgramme.value.start));
            (formatTime(currentProgramme.value.stop));
            if (currentProgramme.value.subtitle) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "mt-1 text-xs text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (currentProgramme.value.subtitle);
            }
            if (currentProgramme.value.description) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "mt-2 line-clamp-3 text-xs leading-5 text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['line-clamp-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['leading-5']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (currentProgramme.value.description);
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mt-3 h-1 overflow-hidden rounded-full bg-white/10" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "h-full rounded-full bg-flixer-accent" },
                ...{ style: ({ width: `${programmeProgress(currentProgramme.value)}%` }) },
            });
            /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-accent']} */ ;
            if (nextProgramme.value) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "mt-3 truncate text-xs text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "font-semibold text-flixer-accent" },
                });
                /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
                (__VLS_unwrap(t, {})('epg.nextUp'));
                (formatTime(nextProgramme.value.start));
                (nextProgramme.value.title);
            }
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mt-3 text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('epg.noLiveProgramme'));
        }
        if (!currentProgramme.value && nextProgramme.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mt-3 truncate text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "font-semibold text-flixer-accent" },
            });
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
            (__VLS_unwrap(t, {})('epg.nextUp'));
            (formatTime(nextProgramme.value.start));
            (nextProgramme.value.title);
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "shrink-0 px-4 py-3" },
    });
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "relative block" },
    });
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "sr-only" },
    });
    /** @type {__VLS_StyleScopedClasses['sr-only']} */ ;
    (__VLS_unwrap(t, {})('player.liveGuideSearch'));
    let __VLS_10;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({
        // @ts-ignore
        icon: "lucide:search", ...{ class: "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-flixer-muted" }, 'aria-hidden': "true",
    }));
    const __VLS_12 = __VLS_11({
        icon: "lucide:search",
        ...{ class: "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-flixer-muted" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_11));
    /** @type {__VLS_StyleScopedClasses['pointer-events-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['left-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['top-1/2']} */ ;
    /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['-translate-y-1/2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "search",
        placeholder: (__VLS_unwrap(t, {})('player.liveGuideSearch')),
        ...{ class: "h-10 w-full rounded border border-white/10 bg-white/[0.04] pl-9 pr-3 text-sm text-white outline-none placeholder:text-flixer-muted focus:border-flixer-accent/70 focus:ring-2 focus:ring-flixer-accent/20" },
    });
    (__VLS_unwrap(query, {}));
    /** @type {__VLS_StyleScopedClasses['h-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white/[0.04]']} */ ;
    /** @type {__VLS_StyleScopedClasses['pl-9']} */ ;
    /** @type {__VLS_StyleScopedClasses['pr-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['outline-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['placeholder:text-flixer-muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:border-flixer-accent/70']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-flixer-accent/20']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-3" },
        'aria-label': (__VLS_unwrap(t, {})('player.liveGuideChannels', { count: data.value?.totalChannels ?? 0 })),
    });
    /** @type {__VLS_StyleScopedClasses['min-h-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['overscroll-contain']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['pb-3']} */ ;
    if (loading.value && !data.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid min-h-40 place-items-center text-center text-xs text-flixer-muted" },
            role: "status",
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['min-h-40']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        let __VLS_15;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
            // @ts-ignore
            icon: "lucide:loader-circle", ...{ class: "mx-auto size-6 animate-spin text-flixer-accent" }, 'aria-hidden': "true",
        }));
        const __VLS_17 = __VLS_16({
            icon: "lucide:loader-circle",
            ...{ class: "mx-auto size-6 animate-spin text-flixer-accent" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_16));
        /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-3" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
        (__VLS_unwrap(t, {})('epg.loading'));
    }
    else if (error.value && !data.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid min-h-40 place-items-center p-4 text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['min-h-40']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            role: "alert",
            ...{ class: "text-xs text-red-200" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-200']} */ ;
        (error.value);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (retry) },
            type: "button",
            ...{ class: "mt-3 rounded bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
        (__VLS_unwrap(t, {})('epg.retry'));
    }
    else if (channels.value.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "p-6 text-center text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['p-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('epg.noResults'));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "space-y-1" },
        });
        /** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
        const __VLS_20 = __VLS_tryAsConstant((channels.value));
        for (const [channel] of __VLS_vFor(__VLS_nonNull(__VLS_20))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!!(loading.value && !data.value))
                            throw 0;
                        if (!!(error.value && !data.value))
                            throw 0;
                        if (!!(channels.value.length === 0))
                            throw 0;
                        return (__VLS_unwrap(emit, {})('select-channel', channel));
                        // @ts-ignore
                        [t, t, t, t, t, t, t, t, t, t, t, t, data, data, data, emit, currentChannel, currentChannel, currentChannel, currentChannel, currentProgramme, currentProgramme, currentProgramme, currentProgramme, currentProgramme, currentProgramme, currentProgramme, currentProgramme, currentProgramme, currentProgramme, nextProgramme, nextProgramme, nextProgramme, nextProgramme, nextProgramme, nextProgramme, query, loading, error, error, channels, channels,];
                    } },
                key: (channel.id),
                type: "button",
                disabled: (!channel.watchable || Boolean(__VLS_ctx.switchingChannelId)),
                ...{ class: "flex w-full items-center gap-3 rounded px-2.5 py-2 text-left transition hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-flixer-accent disabled:cursor-not-allowed disabled:opacity-50" },
                ...{ class: (channel.id === __VLS_ctx.currentChannelId ? 'bg-flixer-accent/10 ring-1 ring-flixer-accent/30' : '') },
                'aria-current': (channel.id === __VLS_ctx.currentChannelId ? 'true' : undefined),
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-2.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/[0.06]']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
            /** @type {__VLS_StyleScopedClasses['disabled:cursor-not-allowed']} */ ;
            /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
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
            if (channel.icon && !failedImages.value.has(channel.id)) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
                    ...{ onError: (...[$event]) => {
                            void $event;
                            if (!!(loading.value && !data.value))
                                throw 0;
                            if (!!(error.value && !data.value))
                                throw 0;
                            if (!!(channels.value.length === 0))
                                throw 0;
                            if (!(channel.icon && !failedImages.value.has(channel.id)))
                                throw 0;
                            return (imageFailed(channel.id));
                            // @ts-ignore
                            [failedImages, switchingChannelId, currentChannelId, currentChannelId,];
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
                    ...{ class: "text-[10px] font-bold text-white/70" },
                });
                /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-white/70']} */ ;
                (channel.name.slice(0, 2).toUpperCase());
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "min-w-0 flex-1" },
            });
            /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "flex items-center gap-2" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "truncate text-xs font-semibold text-white" },
            });
            /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            (channel.name);
            if (channel.id === __VLS_ctx.currentChannelId) {
                let __VLS_21;
                /** @ts-ignore @type { | typeof __VLS_components.Icon} */
                Icon;
                // @ts-ignore
                const __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21({
                    // @ts-ignore
                    icon: "lucide:volume-2", ...{ class: "size-3.5 shrink-0 text-flixer-accent" }, 'aria-label': (__VLS_unwrap(t, {})('player.liveGuideCurrentlyPlaying')),
                }));
                const __VLS_23 = __VLS_22({
                    icon: "lucide:volume-2",
                    ...{ class: "size-3.5 shrink-0 text-flixer-accent" },
                    'aria-label': (__VLS_unwrap(t, {})('player.liveGuideCurrentlyPlaying')),
                }, ...__VLS_functionalComponentArgsRest(__VLS_22));
                /** @type {__VLS_StyleScopedClasses['size-3.5']} */ ;
                /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
            }
            else if (__VLS_ctx.switchingChannelId === channel.id) {
                let __VLS_26;
                /** @ts-ignore @type { | typeof __VLS_components.Icon} */
                Icon;
                // @ts-ignore
                const __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({
                    // @ts-ignore
                    icon: "lucide:loader-circle", ...{ class: "size-3.5 shrink-0 animate-spin text-flixer-accent" }, 'aria-label': (__VLS_unwrap(t, {})('player.liveGuideSwitching')),
                }));
                const __VLS_28 = __VLS_27({
                    icon: "lucide:loader-circle",
                    ...{ class: "size-3.5 shrink-0 animate-spin text-flixer-accent" },
                    'aria-label': (__VLS_unwrap(t, {})('player.liveGuideSwitching')),
                }, ...__VLS_functionalComponentArgsRest(__VLS_27));
                /** @type {__VLS_StyleScopedClasses['size-3.5']} */ ;
                /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "mt-0.5 block truncate text-[11px] text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-0.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['block']} */ ;
            /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-[11px]']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (programmeNow(channel.id)?.title ?? __VLS_unwrap(t, {})('epg.noLiveProgramme'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "shrink-0 text-[10px] text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (programmeNow(channel.id) ? __VLS_unwrap(t, {})('epg.live') : '');
            // @ts-ignore
            [t, t, t, t, t, switchingChannelId, currentChannelId,];
        }
        if (__VLS_ctx.switchError) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                role: "alert",
                ...{ class: "mx-2 rounded bg-red-500/10 p-2 text-xs text-red-200" },
            });
            /** @type {__VLS_StyleScopedClasses['mx-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-red-500/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-red-200']} */ ;
            (__VLS_ctx.switchError);
        }
        if (error.value && data.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                role: "alert",
                ...{ class: "mx-2 rounded bg-red-500/10 p-2 text-xs text-red-200" },
            });
            /** @type {__VLS_StyleScopedClasses['mx-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-red-500/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-red-200']} */ ;
            (error.value);
        }
        if (hasMore.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!!(loading.value && !data.value))
                            throw 0;
                        if (!!(error.value && !data.value))
                            throw 0;
                        if (!!(channels.value.length === 0))
                            throw 0;
                        if (!(hasMore.value))
                            throw 0;
                        return (loadNextPage());
                        // @ts-ignore
                        [data, error, error, switchError, switchError, hasMore,];
                    } },
                type: "button",
                disabled: (loadingMore.value),
                ...{ class: "flex min-h-10 w-full items-center justify-center gap-2 rounded text-xs font-semibold text-flixer-accent transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['min-h-10']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/[0.06]']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
            if (loadingMore.value) {
                let __VLS_31;
                /** @ts-ignore @type { | typeof __VLS_components.Icon} */
                Icon;
                // @ts-ignore
                const __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31({
                    // @ts-ignore
                    icon: "lucide:loader-circle", ...{ class: "size-3.5 animate-spin" }, 'aria-hidden': "true",
                }));
                const __VLS_33 = __VLS_32({
                    icon: "lucide:loader-circle",
                    ...{ class: "size-3.5 animate-spin" },
                    'aria-hidden': "true",
                }, ...__VLS_functionalComponentArgsRest(__VLS_32));
                /** @type {__VLS_StyleScopedClasses['size-3.5']} */ ;
                /** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
            }
            (loadingMore.value ? __VLS_unwrap(t, {})('epg.loading') : __VLS_unwrap(t, {})('player.liveGuideLoadMore'));
        }
    }
    // @ts-ignore
    [t, t, loadingMore, loadingMore, loadingMore,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};
