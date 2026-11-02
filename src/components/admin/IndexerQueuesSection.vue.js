import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { cancelActiveIndexerTasks, getIndexerStatus, INDEXER_QUEUES, setIndexerConcurrency, setIndexerQueuePaused } from '../../api';
import { notify } from '../../composables/notify';
import { describeRequestError } from '../../composables/useProfile';
import { catchError } from '../../utils/catchError';
import { useLiveTopic } from '../../composables/useLive';
import AdminSection from './AdminSection.vue';
import StatusPill from './StatusPill.vue';
import { confirmAction } from '../../composables/confirm';
const { t } = useI18n();
const status = ref(null);
const error = ref('');
const workers = reactive({});
const dirty = ref(false);
const saving = ref(false);
const busyQueue = ref(null);
const cancelling = ref(false);
const anyActive = computed(() => (status.value?.queues ?? []).some((entry) => entry.active + entry.pending > 0));
function statsFor(queue) {
    return status.value?.queues.find((entry) => entry.queue === queue);
}
function apply(next) {
    status.value = next;
    error.value = '';
    // Don't overwrite numbers the admin is typing.
    if (!dirty.value)
        for (const queue of INDEXER_QUEUES)
            workers[queue] = next.concurrency[queue];
}
async function refresh() {
    const [requestError, result] = await catchError(getIndexerStatus());
    if (requestError) {
        error.value = describeRequestError(requestError, t('admin.indexer.loadError'));
    }
    else {
        apply(result);
    }
}
async function togglePause(queue) {
    busyQueue.value = queue;
    try {
        const [error] = await catchError(setIndexerQueuePaused(queue, !statsFor(queue)?.paused));
        if (error)
            notify.error(describeRequestError(error, t('admin.indexer.queueError')));
    }
    finally {
        busyQueue.value = null;
    }
}
async function cancelRunning(queues) {
    if (!(await confirmAction(t(queues.length > 1 ? 'admin.indexer.cancelAllRunningConfirm' : 'admin.indexer.cancelRunningConfirm'), { danger: true })))
        return;
    cancelling.value = true;
    try {
        let n = 0;
        let requestError;
        // A second pass catches work that upstream tasks queued while they were being cancelled.
        for (let pass = 0; pass < (queues.length > 1 ? 2 : 1); pass++) {
            for (const queue of queues) {
                const [error, cancelled] = await catchError(cancelActiveIndexerTasks(queue));
                if (error) {
                    requestError = error;
                    break;
                }
                n += cancelled;
            }
            if (requestError)
                break;
        }
        if (requestError) {
            notify.error(describeRequestError(requestError, t('admin.indexer.queueError')));
        }
        else {
            notify.success(t('admin.indexer.cancelledRunning', { n }));
            await refresh();
        }
    }
    finally {
        cancelling.value = false;
    }
}
async function saveWorkers() {
    saving.value = true;
    try {
        const counts = {};
        for (const queue of INDEXER_QUEUES)
            if (typeof workers[queue] === 'number')
                counts[queue] = workers[queue];
        const [error, result] = await catchError(setIndexerConcurrency(counts));
        if (error) {
            notify.error(describeRequestError(error, t('admin.indexer.workersError')));
        }
        else {
            status.value = result;
            dirty.value = false;
            notify.success(t('admin.indexer.workersSaved'));
        }
    }
    finally {
        saving.value = false;
    }
}
onMounted(refresh);
const live = useLiveTopic('indexer');
watch(live.data, (value) => {
    if (value)
        apply(value);
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(cancelling, {});
    __VLS_withDotValue(anyActive, {});
    __VLS_withDotValue(status, {});
    __VLS_withDotValue(dirty, {});
    __VLS_withDotValue(saving, {});
    __VLS_withDotValue(error, {});
    __VLS_withDotValue(workers, {});
    __VLS_withDotValue(busyQueue, {});
    const __VLS_0 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('admin.indexer.queuesTitle')), description: (__VLS_unwrap(t, {})('admin.indexer.queuesDescription')),
    }));
    const __VLS_2 = __VLS_1({
        title: (__VLS_unwrap(t, {})('admin.indexer.queuesTitle')),
        description: (__VLS_unwrap(t, {})('admin.indexer.queuesDescription')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    {
        const { actions: __VLS_6 } = __VLS_nonNull(__VLS_3.slots);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    return (cancelRunning([...__VLS_unwrap(INDEXER_QUEUES, {})]));
                    // @ts-ignore
                    [t, t, INDEXER_QUEUES,];
                } },
            type: "button",
            disabled: (cancelling.value || !anyActive.value || !status.value?.reachable),
            ...{ class: "mr-2 rounded bg-red-500/20 px-4 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/30 disabled:opacity-50" },
        });
        /** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-red-500/20']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-200']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-red-500/30']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
        (__VLS_unwrap(t, {})('admin.indexer.cancelAllRunning'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (saveWorkers) },
            type: "button",
            disabled: (!dirty.value || saving.value || !status.value?.reachable),
            ...{ class: "rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-50" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-primary']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-flixer-primary/80']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
        (__VLS_unwrap(t, {})('admin.indexer.saveWorkers'));
        // @ts-ignore
        [t, t, cancelling, anyActive, status, status, dirty, saving,];
    }
    if (error.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            role: "alert",
            ...{ class: "mb-3 text-sm text-red-300" },
        });
        /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
        (error.value);
    }
    else if (status.value && !status.value.reachable) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            role: "alert",
            ...{ class: "mb-3 text-sm text-amber-300" },
        });
        /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-amber-300']} */ ;
        (__VLS_unwrap(t, {})('admin.indexer.offline'));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "overflow-x-auto" },
    });
    /** @type {__VLS_StyleScopedClasses['overflow-x-auto']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "w-full min-w-[40rem] text-left text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-[40rem]']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({
        ...{ class: "text-xs text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "py-2 pr-3 font-medium" },
    });
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['pr-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    (__VLS_unwrap(t, {})('admin.indexer.queue'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "py-2 pr-3 font-medium" },
    });
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['pr-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    (__VLS_unwrap(t, {})('admin.indexer.pending'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "py-2 pr-3 font-medium" },
    });
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['pr-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    (__VLS_unwrap(t, {})('admin.indexer.active'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "py-2 pr-3 font-medium" },
    });
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['pr-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    (__VLS_unwrap(t, {})('admin.indexer.retry'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "py-2 pr-3 font-medium" },
    });
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['pr-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    (__VLS_unwrap(t, {})('admin.indexer.failed'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "py-2 pr-3 font-medium" },
    });
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['pr-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    (__VLS_unwrap(t, {})('admin.indexer.workers'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "py-2 font-medium" },
    });
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    const __VLS_7 = __VLS_tryAsConstant((__VLS_unwrap(INDEXER_QUEUES, {})));
    for (const [queue] of __VLS_vFor(__VLS_nonNull(__VLS_7))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (queue),
            ...{ class: "border-t border-flixer-border" },
        });
        /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "py-2 pr-3" },
        });
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['pr-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "font-medium" },
        });
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        (__VLS_unwrap(t, {})(`admin.indexer.queueNames.${queue}`));
        const __VLS_8 = StatusPill || StatusPill;
        // @ts-ignore
        const __VLS_9 = __VLS_asFunctionalComponent1(__VLS_8, new __VLS_8({
            // @ts-ignore
            tone: (statsFor(queue)?.paused ? 'warn' : 'good'), ...{ class: "ml-2" },
        }));
        const __VLS_10 = __VLS_9({
            tone: (statsFor(queue)?.paused ? 'warn' : 'good'),
            ...{ class: "ml-2" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_9));
        /** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
        var __VLS_11;
        const { default: __VLS_13 } = __VLS_nonNull(__VLS_11.slots);
        (statsFor(queue)?.paused ? __VLS_unwrap(t, {})('admin.indexer.paused') : __VLS_unwrap(t, {})('admin.indexer.running'));
        // @ts-ignore
        [t, t, t, t, t, t, t, t, t, t, INDEXER_QUEUES, status, status, error, error,];
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "py-2 pr-3 tabular-nums" },
        });
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['pr-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['tabular-nums']} */ ;
        (statsFor(queue)?.pending ?? 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "py-2 pr-3 tabular-nums" },
        });
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['pr-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['tabular-nums']} */ ;
        (statsFor(queue)?.active ?? 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "py-2 pr-3 tabular-nums" },
        });
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['pr-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['tabular-nums']} */ ;
        (statsFor(queue)?.retry ?? 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "py-2 pr-3 tabular-nums" },
            ...{ class: ((statsFor(queue)?.archived ?? 0) > 0 ? 'text-red-300' : '') },
        });
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['pr-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['tabular-nums']} */ ;
        (statsFor(queue)?.archived ?? 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "py-2 pr-3" },
        });
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['pr-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onInput: (...[$event]) => {
                    void $event;
                    return (dirty.value = true);
                    // @ts-ignore
                    [dirty,];
                } },
            type: "number",
            min: "1",
            max: (status.value?.maxConcurrency ?? 64),
            'aria-label': (`${__VLS_unwrap(t, {})('admin.indexer.workers')} ${__VLS_unwrap(t, {})(`admin.indexer.queueNames.${queue}`)}`),
            ...{ class: "w-20 rounded border border-flixer-border bg-flixer-background px-2 py-1 text-sm text-flixer-text" },
        });
        (workers.value[queue]);
        /** @type {__VLS_StyleScopedClasses['w-20']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "py-2 text-right" },
        });
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    return (cancelRunning([queue]));
                    // @ts-ignore
                    [t, t, status, workers,];
                } },
            type: "button",
            disabled: (cancelling.value || (statsFor(queue)?.active ?? 0) + (statsFor(queue)?.pending ?? 0) === 0 || !status.value?.reachable),
            ...{ class: "mr-2 rounded bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-200 transition hover:bg-red-500/30 disabled:opacity-50" },
        });
        /** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-red-500/20']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-200']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-red-500/30']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
        (__VLS_unwrap(t, {})('admin.indexer.cancelRunning'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    return (togglePause(queue));
                    // @ts-ignore
                    [t, cancelling, status,];
                } },
            type: "button",
            disabled: (busyQueue.value === queue || !status.value?.reachable),
            ...{ class: "rounded bg-white/10 px-3 py-1 text-xs font-semibold transition hover:bg-white/15 disabled:opacity-50" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
        (statsFor(queue)?.paused ? __VLS_unwrap(t, {})('admin.indexer.resume') : __VLS_unwrap(t, {})('admin.indexer.pause'));
        // @ts-ignore
        [t, t, status, busyQueue,];
    }
    if (status.value?.maxConcurrency) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-2 text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.indexer.workersHint', { max: status.value.maxConcurrency }));
    }
    // @ts-ignore
    [t, status, status,];
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
