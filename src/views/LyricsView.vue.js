import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';
import AuthImage from '../components/ui/AuthImage.vue';
import Skeleton from '../components/ui/Skeleton.vue';
import { formatTime } from '../components/player/formatTime';
import { activeLineIndex } from '../composables/lrc';
import { useAudioPlayer } from '../composables/useAudioPlayer';
const { t } = useI18n();
const player = useAudioPlayer();
const { current, isPlaying, isLoading, currentTime, duration, lyrics, lyricsLoading, lyricsOpen } = player;
const lineRefs = ref([]);
const scroller = ref(null);
const progress = computed(() => (duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0));
const activeIndex = computed(() => (lyrics.value?.synced ? activeLineIndex(lyrics.value.lines, currentTime.value) : -1));
// Pauses auto-follow while the user scrolls by hand.
let manualScrollUntil = 0;
function close() {
    lyricsOpen.value = false;
}
function onKeydown(event) {
    if (event.key === 'Escape')
        close();
}
function onUserScroll() {
    manualScrollUntil = Date.now() + 4000;
}
function seekToLine(time) {
    if (time !== null)
        player.seek(time);
    manualScrollUntil = 0;
}
function onSeek(event) {
    player.seek((Number(event.target.value) / 100) * duration.value);
}
watch(activeIndex, async (index) => {
    if (index < 0 || Date.now() < manualScrollUntil)
        return;
    await nextTick();
    const box = scroller.value;
    const line = lineRefs.value[index];
    if (!box || !line)
        return;
    // Scroll only the lyrics box; scrollIntoView would also move the page on iOS.
    // Phones keep the current line near the top so the opening lines don't sit under a big gap.
    // Desktop keeps the current line near the top, level with the cover art.
    const desktop = window.matchMedia('(min-width: 768px)').matches;
    const top = desktop ? line.offsetTop - box.clientHeight * 0.1 : line.offsetTop - box.clientHeight * 0.3 + line.offsetHeight / 2;
    box.scrollTo({ top, behavior: 'smooth' });
});
watch(current, (track) => {
    if (!track)
        lyricsOpen.value = false;
}, { immediate: true });
onMounted(() => {
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeydown);
});
onBeforeUnmount(() => {
    document.body.style.overflow = '';
    window.removeEventListener('keydown', onKeydown);
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(current, {});
    __VLS_withDotValue(lyricsOpen, {});
    __VLS_withDotValue(lyricsLoading, {});
    __VLS_withDotValue(lyrics, {});
    __VLS_withDotValue(lineRefs, {});
    __VLS_withDotValue(activeIndex, {});
    __VLS_withDotValue(player, {});
    __VLS_withDotValue(isPlaying, {});
    __VLS_withDotValue(isLoading, {});
    if (current.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "theme-dark fixed inset-x-0 top-0 z-[60] flex h-[100dvh] flex-col overflow-hidden bg-flixer-background pt-[env(safe-area-inset-top)] text-flixer-text" },
        });
        /** @type {__VLS_StyleScopedClasses['theme-dark']} */ ;
        /** @type {__VLS_StyleScopedClasses['fixed']} */ ;
        /** @type {__VLS_StyleScopedClasses['inset-x-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['top-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['z-[60]']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-[100dvh]']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
        /** @type {__VLS_StyleScopedClasses['pt-[env(safe-area-inset-top)]']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
        if (current.value.art) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "pointer-events-none absolute inset-0 scale-125 opacity-30 blur-3xl" },
                'aria-hidden': "true",
            });
            /** @type {__VLS_StyleScopedClasses['pointer-events-none']} */ ;
            /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
            /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['scale-125']} */ ;
            /** @type {__VLS_StyleScopedClasses['opacity-30']} */ ;
            /** @type {__VLS_StyleScopedClasses['blur-3xl']} */ ;
            const __VLS_0 = AuthImage;
            // @ts-ignore
            const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
                // @ts-ignore
                scope: "library", itemId: (current.value.art.itemId), index: (current.value.art.index), version: (current.value.art.version), width: (128), alt: "",
            }));
            const __VLS_2 = __VLS_1({
                scope: "library",
                itemId: (current.value.art.itemId),
                index: (current.value.art.index),
                version: (current.value.art.version),
                width: (128),
                alt: "",
            }, ...__VLS_functionalComponentArgsRest(__VLS_1));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-flixer-background/60 to-flixer-background" },
        });
        /** @type {__VLS_StyleScopedClasses['pointer-events-none']} */ ;
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-gradient-to-b']} */ ;
        /** @type {__VLS_StyleScopedClasses['from-black/30']} */ ;
        /** @type {__VLS_StyleScopedClasses['via-flixer-background/60']} */ ;
        /** @type {__VLS_StyleScopedClasses['to-flixer-background']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
            ...{ class: "relative shrink-0 flex items-center justify-between p-4 md:px-8" },
        });
        /** @type {__VLS_StyleScopedClasses['relative']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:px-8']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (close) },
            type: "button",
            ...{ class: "inline-flex items-center gap-2 rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
        });
        /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/20']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        let __VLS_5;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
            // @ts-ignore
            icon: "lucide:chevron-down", ...{ class: "size-4" }, 'aria-hidden': "true",
        }));
        const __VLS_7 = __VLS_6({
            icon: "lucide:chevron-down",
            ...{ class: "size-4" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_6));
        /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
        (__VLS_unwrap(t, {})('music.closeLyrics'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({
            ...{ class: "relative flex min-h-0 flex-1 flex-col gap-6 px-4 md:flex-row md:items-start md:gap-12 md:pt-[12vh] md:px-12 lg:px-24" },
        });
        /** @type {__VLS_StyleScopedClasses['relative']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['min-h-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:flex-row']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:items-start']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:gap-12']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:pt-[12vh]']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:px-12']} */ ;
        /** @type {__VLS_StyleScopedClasses['lg:px-24']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex shrink-0 items-center gap-4 md:w-72 md:flex-col md:items-start lg:w-96" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:w-72']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:items-start']} */ ;
        /** @type {__VLS_StyleScopedClasses['lg:w-96']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "aspect-square w-20 shrink-0 overflow-hidden rounded border border-white/10 bg-flixer-surface shadow-2xl shadow-black/60 md:w-[min(100%,38vh)]" },
        });
        /** @type {__VLS_StyleScopedClasses['aspect-square']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-20']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-2xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-black/60']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:w-[min(100%,38vh)]']} */ ;
        if (current.value.art) {
            const __VLS_10 = AuthImage;
            // @ts-ignore
            const __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({
                // @ts-ignore
                scope: "library", itemId: (current.value.art.itemId), index: (current.value.art.index), version: (current.value.art.version), width: (512), alt: (current.value.album ?? current.value.title),
            }));
            const __VLS_12 = __VLS_11({
                scope: "library",
                itemId: (current.value.art.itemId),
                index: (current.value.art.index),
                version: (current.value.art.version),
                width: (512),
                alt: (current.value.album ?? current.value.title),
            }, ...__VLS_functionalComponentArgsRest(__VLS_11));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "min-w-0" },
        });
        /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
            ...{ class: "break-words text-xl font-bold text-white md:text-3xl" },
        });
        /** @type {__VLS_StyleScopedClasses['break-words']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:text-3xl']} */ ;
        (current.value.title);
        if (current.value.artist && current.value.artistId) {
            let __VLS_15;
            /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
            RouterLink;
            // @ts-ignore
            const __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
                // @ts-ignore
                ...{ 'onClick': {} }, to: ({ name: 'person', params: { id: current.value.artistId } }), ...{ class: "mt-1 block truncate text-sm text-flixer-text/90 hover:underline md:text-base" },
            }));
            const __VLS_17 = __VLS_16({
                ...{ 'onClick': {} },
                to: ({ name: 'person', params: { id: current.value.artistId } }),
                ...{ class: "mt-1 block truncate text-sm text-flixer-text/90 hover:underline md:text-base" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_16));
            let __VLS_20;
            const __VLS_21 = {
                /** @type {typeof __VLS_20.click} */
                onClick: (...[$event]) => {
                    void $event;
                    if (!(current.value))
                        throw 0;
                    if (!(current.value.artist && current.value.artistId))
                        throw 0;
                    return (lyricsOpen.value = false);
                    // @ts-ignore
                    [current, current, current, current, current, current, current, current, current, current, current, current, current, current, current, t, lyricsOpen,];
                },
            };
            void __VLS_21;
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['block']} */ ;
            /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-text/90']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:underline']} */ ;
            /** @type {__VLS_StyleScopedClasses['md:text-base']} */ ;
            var __VLS_18;
            var __VLS_19;
            const { default: __VLS_22 } = __VLS_nonNull(__VLS_18.slots);
            (current.value.artist);
            // @ts-ignore
            [current,];
        }
        if (current.value.album) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "truncate text-xs text-flixer-muted md:text-sm" },
            });
            /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            /** @type {__VLS_StyleScopedClasses['md:text-sm']} */ ;
            (current.value.album);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ onWheel: (onUserScroll) },
            ...{ onTouchmove: (onUserScroll) },
            ref: "scroller",
            ...{ class: "relative min-h-0 flex-1 self-stretch overflow-y-auto overscroll-contain pt-4 pb-[40vh] [scrollbar-width:none] md:pt-0 md:pb-[60vh] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)] md:[mask-image:linear-gradient(to_bottom,black,black_75%,transparent)]" },
            'aria-label': (__VLS_unwrap(t, {})('music.lyrics')),
        });
        /** @type {__VLS_StyleScopedClasses['relative']} */ ;
        /** @type {__VLS_StyleScopedClasses['min-h-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['self-stretch']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
        /** @type {__VLS_StyleScopedClasses['overscroll-contain']} */ ;
        /** @type {__VLS_StyleScopedClasses['pt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['pb-[40vh]']} */ ;
        /** @type {__VLS_StyleScopedClasses['[scrollbar-width:none]']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:pt-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:pb-[60vh]']} */ ;
        /** @type {__VLS_StyleScopedClasses['[&::-webkit-scrollbar]:hidden']} */ ;
        /** @type {__VLS_StyleScopedClasses['[mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:[mask-image:linear-gradient(to_bottom,black,black_75%,transparent)]']} */ ;
        if (lyricsLoading.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "w-full max-w-md space-y-4" },
                role: "status",
                'aria-label': (__VLS_unwrap(t, {})('music.loadingLyrics')),
            });
            /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['max-w-md']} */ ;
            /** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
            const __VLS_23 = __VLS_tryAsConstant((['w-3/4', 'w-full', 'w-2/3', 'w-5/6', 'w-1/2']));
            for (const [width] of __VLS_vFor(__VLS_nonNull(__VLS_23))) {
                const __VLS_24 = Skeleton;
                // @ts-ignore
                const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
                    // @ts-ignore
                    key: (width), ...{ class: "h-6" }, ...{ class: (width) },
                }));
                const __VLS_26 = __VLS_25({
                    key: (width),
                    ...{ class: "h-6" },
                    ...{ class: (width) },
                }, ...__VLS_functionalComponentArgsRest(__VLS_25));
                /** @type {__VLS_StyleScopedClasses['h-6']} */ ;
                // @ts-ignore
                [current, current, t, t, lyricsLoading,];
            }
        }
        else if (!lyrics.value || lyrics.value.lines.length === 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-lg text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('music.noLyrics'));
        }
        else {
            if (!lyrics.value.synced) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "mb-4 text-sm text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (__VLS_unwrap(t, {})('music.plainLyrics'));
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
                ...{ class: "space-y-3 md:space-y-5" },
            });
            /** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['md:space-y-5']} */ ;
            const __VLS_29 = __VLS_tryAsConstant((lyrics.value.lines));
            for (const [line, index] of __VLS_vFor(__VLS_nonNull(__VLS_29))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                    key: (index),
                    ref: ((el) => {
                        if (el)
                            lineRefs.value[index] = el;
                    }),
                });
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!(current.value))
                                throw 0;
                            if (!!(lyricsLoading.value))
                                throw 0;
                            if (!!(!lyrics.value || lyrics.value.lines.length === 0))
                                throw 0;
                            return (seekToLine(line.time));
                            // @ts-ignore
                            [t, t, lyrics, lyrics, lyrics, lyrics, lineRefs,];
                        } },
                    type: "button",
                    ...{ class: "block w-full origin-left text-left text-2xl font-bold leading-snug transition duration-300 md:text-4xl" },
                    ...{ class: (lyrics.value.synced ? (index === activeIndex.value ? 'scale-100 text-white' : index < activeIndex.value ? 'scale-95 text-white/30 hover:text-white/60' : 'scale-95 text-white/40 hover:text-white/70') : 'cursor-default text-white/80') },
                    disabled: (line.time === null),
                });
                /** @type {__VLS_StyleScopedClasses['block']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
                /** @type {__VLS_StyleScopedClasses['origin-left']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
                /** @type {__VLS_StyleScopedClasses['leading-snug']} */ ;
                /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                /** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
                /** @type {__VLS_StyleScopedClasses['md:text-4xl']} */ ;
                (line.text || '♪');
                // @ts-ignore
                [lyrics, activeIndex, activeIndex,];
            }
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.footer, __VLS_intrinsics.footer)({
            ...{ class: "relative shrink-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-12 lg:px-24" },
        });
        /** @type {__VLS_StyleScopedClasses['relative']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['pb-[max(1rem,env(safe-area-inset-bottom))]']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:px-12']} */ ;
        /** @type {__VLS_StyleScopedClasses['lg:px-24']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mx-auto flex max-w-3xl items-center gap-3 text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['max-w-3xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
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
            ...{ class: "mt-2 flex items-center justify-center gap-4" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!(current.value))
                        throw 0;
                    return (player.value.previous());
                    // @ts-ignore
                    [t, formatTime, formatTime, currentTime, progress, duration, player,];
                } },
            type: "button",
            ...{ class: "grid size-11 place-items-center rounded text-white transition hover:bg-white/10" },
            'aria-label': (__VLS_unwrap(t, {})('music.previous')),
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-11']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
        let __VLS_30;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({
            // @ts-ignore
            icon: "lucide:skip-back", ...{ class: "size-6" }, 'aria-hidden': "true",
        }));
        const __VLS_32 = __VLS_31({
            icon: "lucide:skip-back",
            ...{ class: "size-6" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_31));
        /** @type {__VLS_StyleScopedClasses['size-6']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!(current.value))
                        throw 0;
                    return (player.value.toggle());
                    // @ts-ignore
                    [t, player,];
                } },
            type: "button",
            ...{ class: "grid size-14 place-items-center rounded bg-white text-flixer-background transition hover:bg-white/85" },
            'aria-label': (isPlaying.value ? __VLS_unwrap(t, {})('music.pause') : __VLS_unwrap(t, {})('music.play')),
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-14']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-background']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/85']} */ ;
        if (isLoading.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "size-5 animate-spin rounded-full border-2 border-flixer-background/30 border-t-flixer-background" },
                'aria-hidden': "true",
            });
            /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
            /** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-background/30']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-t-flixer-background']} */ ;
        }
        else if (isPlaying.value) {
            let __VLS_35;
            /** @ts-ignore @type { | typeof __VLS_components.Icon} */
            Icon;
            // @ts-ignore
            const __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35({
                // @ts-ignore
                icon: "lucide:pause", ...{ class: "size-7" }, 'aria-hidden': "true",
            }));
            const __VLS_37 = __VLS_36({
                icon: "lucide:pause",
                ...{ class: "size-7" },
                'aria-hidden': "true",
            }, ...__VLS_functionalComponentArgsRest(__VLS_36));
            /** @type {__VLS_StyleScopedClasses['size-7']} */ ;
        }
        else {
            let __VLS_40;
            /** @ts-ignore @type { | typeof __VLS_components.Icon} */
            Icon;
            // @ts-ignore
            const __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40({
                // @ts-ignore
                icon: "lucide:play", ...{ class: "size-7" }, 'aria-hidden': "true",
            }));
            const __VLS_42 = __VLS_41({
                icon: "lucide:play",
                ...{ class: "size-7" },
                'aria-hidden': "true",
            }, ...__VLS_functionalComponentArgsRest(__VLS_41));
            /** @type {__VLS_StyleScopedClasses['size-7']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!(current.value))
                        throw 0;
                    return (player.value.next());
                    // @ts-ignore
                    [t, t, player, isPlaying, isPlaying, isLoading,];
                } },
            type: "button",
            ...{ class: "grid size-11 place-items-center rounded text-white transition hover:bg-white/10 disabled:opacity-40" },
            disabled: (!player.value.hasNext.value),
            'aria-label': (__VLS_unwrap(t, {})('music.next')),
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-11']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-40']} */ ;
        let __VLS_45;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_46 = __VLS_asFunctionalComponent1(__VLS_45, new __VLS_45({
            // @ts-ignore
            icon: "lucide:skip-forward", ...{ class: "size-6" }, 'aria-hidden': "true",
        }));
        const __VLS_47 = __VLS_46({
            icon: "lucide:skip-forward",
            ...{ class: "size-6" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_46));
        /** @type {__VLS_StyleScopedClasses['size-6']} */ ;
    }
    // @ts-ignore
    [t, player,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
