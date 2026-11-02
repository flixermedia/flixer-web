import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useLiveTopic } from '../../composables/useLive';
import { useI18n } from 'vue-i18n';
import AdminSkeleton from './AdminSkeleton.vue';
import { cancelStreamSession, listStreamSessions } from '../../api';
import { confirmAction } from '../../composables/confirm';
import { notify } from '../../composables/notify';
import { describeRequestError } from '../../composables/useProfile';
import { catchError } from '../../utils/catchError';
const { t } = useI18n();
const data = ref(null);
const loadError = ref('');
const cancellingId = ref(null);
const expandedId = ref(null);
const now = ref(Date.now());
let timer;
let loading = false;
const sessions = computed(() => data.value?.sessions ?? []);
const modeKeys = {
    DirectPlay: 'admin.streams.directPlay',
    DirectStream: 'admin.streams.remux',
    Transcode: 'admin.streams.transcode',
};
async function load() {
    if (loading)
        return;
    loading = true;
    try {
        const [error, result] = await catchError(listStreamSessions());
        if (error) {
            loadError.value = describeRequestError(error, t('admin.streams.loadError'));
        }
        else {
            data.value = result;
            loadError.value = '';
        }
    }
    finally {
        now.value = Date.now();
        loading = false;
    }
}
async function cancel(session) {
    const who = session.user?.displayName ?? t('admin.streams.thisViewer');
    if (!(await confirmAction(t('admin.streams.confirmCancel', { file: session.file, name: who }), { danger: true })))
        return;
    cancellingId.value = session.id;
    try {
        const [error] = await catchError(cancelStreamSession(session.id));
        if (error) {
            notify.error(describeRequestError(error, t('admin.streams.cancelError')));
        }
        else {
            notify.success(t('admin.streams.cancelSuccess'));
        }
    }
    finally {
        cancellingId.value = null;
        await load();
    }
}
function formatBytes(bytes) {
    if (bytes < 1024 * 1024)
        return `${Math.round(bytes / 1024)} KB`;
    if (bytes < 1024 ** 3)
        return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}
function formatClock(seconds) {
    const total = Math.max(0, Math.floor(seconds));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}
function elapsed(from) {
    return formatClock((now.value - new Date(from).getTime()) / 1000);
}
function quality(session) {
    const target = session.height || session.source.height;
    return target ? `${target}p` : t('admin.streams.original');
}
const live = useLiveTopic('streams');
watch(live.data, (value) => {
    if (!value)
        return;
    data.value = value;
    loadError.value = '';
    now.value = Date.now();
});
onMounted(() => {
    void load();
    // Only advances the elapsed clock; data arrives over the WebSocket.
    timer = setInterval(() => {
        now.value = Date.now();
    }, 1000);
});
onBeforeUnmount(() => clearInterval(timer));
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(data, {});
    __VLS_withDotValue(loadError, {});
    __VLS_withDotValue(sessions, {});
    __VLS_withDotValue(cancellingId, {});
    __VLS_withDotValue(modeKeys, {});
    __VLS_withDotValue(expandedId, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        'aria-labelledby': "streams-heading",
        ...{ class: "admin-card p-3" },
    });
    /** @type {__VLS_StyleScopedClasses['admin-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-wrap items-center justify-between gap-3" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
        id: "streams-heading",
        ...{ class: "text-base font-semibold" },
    });
    /** @type {__VLS_StyleScopedClasses['text-base']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    (__VLS_unwrap(t, {})('admin.streams.title'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-1 text-sm text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('admin.streams.description'));
    if (data.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "rounded bg-white/10 px-3 py-1 text-xs font-semibold" },
            'aria-live': "polite",
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        (data.value.maxTranscodes > 0 ? __VLS_unwrap(t, {})('admin.streams.slotUsage', { active: data.value.activeTranscodes, max: data.value.maxTranscodes }) : __VLS_unwrap(t, {})('admin.streams.slotUsageUnlimited', { active: data.value.activeTranscodes }));
    }
    if (loadError.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-2 text-sm text-red-300" },
            role: "alert",
        });
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
        (loadError.value);
    }
    else if (!data.value) {
        const __VLS_0 = AdminSkeleton;
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
            // @ts-ignore
            variant: "cards", ...{ class: "mt-2" },
        }));
        const __VLS_2 = __VLS_1({
            variant: "cards",
            ...{ class: "mt-2" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_1));
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
    }
    else if (!data.value.transcodingAvailable) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-2 text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.streams.ffmpegUnavailable'));
    }
    else if (sessions.value.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-2 text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.streams.noSessions'));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
            ...{ class: "mt-2 flex flex-col gap-2" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        const __VLS_5 = __VLS_tryAsConstant((sessions.value));
        for (const [session] of __VLS_vFor(__VLS_nonNull(__VLS_5))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                key: (session.id),
                ...{ class: "rounded border border-flixer-border bg-flixer-background/60 p-3" },
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-background/60']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex flex-wrap items-start justify-between gap-3" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "min-w-0" },
            });
            /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "truncate text-sm font-semibold" },
                title: (session.file),
            });
            /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            (session.file);
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mt-1 text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (session.user?.displayName ?? __VLS_unwrap(t, {})('admin.streams.unknownUser'));
            if (session.user) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                (session.user.username);
            }
            (session.remoteAddr || __VLS_unwrap(t, {})('admin.streams.unknownAddress'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex items-center gap-2" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "rounded px-2.5 py-1 text-xs font-semibold" },
                ...{ class: (session.running ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-flixer-muted') },
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-2.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            (session.running ? __VLS_unwrap(t, {})('admin.streams.encoding') : __VLS_unwrap(t, {})('admin.streams.idle'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!!(loadError.value))
                            throw 0;
                        if (!!(!data.value))
                            throw 0;
                        if (!!(!data.value.transcodingAvailable))
                            throw 0;
                        if (!!(sessions.value.length === 0))
                            throw 0;
                        return (cancel(session));
                        // @ts-ignore
                        [t, t, t, t, t, t, t, t, t, t, data, data, data, data, data, data, data, loadError, loadError, sessions, sessions,];
                    } },
                type: "button",
                ...{ class: "rounded bg-red-500/20 px-4 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/30 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" },
                disabled: (cancellingId.value === session.id),
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-red-500/20']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-red-200']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-red-500/30']} */ ;
            /** @type {__VLS_StyleScopedClasses['disabled:cursor-wait']} */ ;
            /** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-offset-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
            (cancellingId.value === session.id ? __VLS_unwrap(t, {})('admin.streams.cancelling') : __VLS_unwrap(t, {})('admin.streams.cancelStream'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.dl, __VLS_intrinsics.dl)({
                ...{ class: "mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-x-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-y-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['sm:grid-cols-4']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
                ...{ class: "text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.streams.method'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
                ...{ class: "font-medium" },
            });
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            (__VLS_unwrap(t, {})(modeKeys.value[session.mode] ?? session.mode));
            (session.delivery === 'hls' ? __VLS_unwrap(t, {})('admin.streams.hls') : __VLS_unwrap(t, {})('admin.streams.mp4Webm'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
                ...{ class: "text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.streams.quality'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
                ...{ class: "font-medium" },
            });
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            (quality(session));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
                ...{ class: "text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.streams.position'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
                ...{ class: "font-medium" },
            });
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            (formatClock(session.positionSeconds));
            (formatClock(session.source.durationSeconds));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
                ...{ class: "text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.streams.runningFor'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
                ...{ class: "font-medium" },
            });
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            (elapsed(session.startedAt));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
                ...{ class: "text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.streams.sent'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
                ...{ class: "font-medium" },
            });
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            (formatBytes(session.bytesSent));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
                ...{ class: "text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.streams.source'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
                ...{ class: "font-medium" },
            });
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            (session.source.videoCodec);
            (session.source.width);
            (session.source.height);
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!!(loadError.value))
                            throw 0;
                        if (!!(!data.value))
                            throw 0;
                        if (!!(!data.value.transcodingAvailable))
                            throw 0;
                        if (!!(sessions.value.length === 0))
                            throw 0;
                        return (expandedId.value = expandedId.value === session.id ? null : session.id);
                        // @ts-ignore
                        [t, t, t, t, t, t, t, t, t, t, t, cancellingId, cancellingId, modeKeys, expandedId, expandedId,];
                    } },
                type: "button",
                ...{ class: "mt-3 text-xs text-flixer-muted underline-offset-2 hover:text-flixer-text hover:underline" },
                'aria-expanded': (expandedId.value === session.id),
            });
            /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            /** @type {__VLS_StyleScopedClasses['underline-offset-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:text-flixer-text']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:underline']} */ ;
            (expandedId.value === session.id ? __VLS_unwrap(t, {})('admin.streams.hideDetails') : __VLS_unwrap(t, {})('admin.streams.showDetails'));
            if (expandedId.value === session.id) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.dl, __VLS_intrinsics.dl)({
                    ...{ class: "mt-2 grid gap-2 text-xs" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['grid']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
                    ...{ class: "text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (__VLS_unwrap(t, {})('admin.streams.sessionId'));
                __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
                    ...{ class: "break-all font-mono" },
                });
                /** @type {__VLS_StyleScopedClasses['break-all']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
                (session.id);
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
                    ...{ class: "text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (__VLS_unwrap(t, {})('admin.streams.ffmpegPid'));
                __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
                    ...{ class: "font-mono" },
                });
                /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
                (session.pid ?? __VLS_unwrap(t, {})('admin.streams.noPid'));
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
                    ...{ class: "text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (__VLS_unwrap(t, {})('admin.streams.audioCodec'));
                __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({});
                (session.source.audioCodec ?? __VLS_unwrap(t, {})('admin.streams.none'));
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
                    ...{ class: "text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (__VLS_unwrap(t, {})('admin.streams.lastActivity'));
                __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({});
                (new Date(session.lastActivityAt).toLocaleTimeString());
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
                    ...{ class: "text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (__VLS_unwrap(t, {})('admin.streams.client'));
                __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
                    ...{ class: "break-all" },
                });
                /** @type {__VLS_StyleScopedClasses['break-all']} */ ;
                (session.userAgent || __VLS_unwrap(t, {})('admin.streams.unknown'));
            }
            // @ts-ignore
            [t, t, t, t, t, t, t, t, t, t, expandedId, expandedId, expandedId,];
        }
    }
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
