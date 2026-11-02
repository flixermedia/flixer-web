import { openModal } from '@kolirt/vue-modal';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AdminSkeleton from './AdminSkeleton.vue';
import { cancelIndexerTask, clearAllFailedIndexerTasks, clearFailedIndexerTasks, INDEXER_TASK_QUEUES, INDEXER_TASK_STATES, listIndexerTasks, retryIndexerTask } from '../../api';
import { notify } from '../../composables/notify';
import { describeRequestError } from '../../composables/useProfile';
import { catchError } from '../../utils/catchError';
import AdminSection from './AdminSection.vue';
import TaskLogsModal from './TaskLogsModal.vue';
import { confirmAction } from '../../composables/confirm';
const { t } = useI18n();
const queue = ref('identify');
const state = ref('archived');
const page = ref(1);
const tasks = ref([]);
const loading = ref(false);
const error = ref('');
const busyId = ref(null);
const clearing = ref(false);
const PAGE_SIZE = 20;
const inputClass = 'rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm text-flixer-text';
async function load() {
    loading.value = true;
    try {
        const [requestError, result] = await catchError(listIndexerTasks(queue.value, state.value, page.value, PAGE_SIZE));
        if (requestError) {
            tasks.value = [];
            error.value = describeRequestError(requestError, t('admin.indexer.tasksError'));
        }
        else {
            tasks.value = result;
            error.value = '';
        }
    }
    finally {
        loading.value = false;
    }
}
async function act(task, action) {
    busyId.value = task.id;
    try {
        const [error] = await catchError((action === 'cancel' ? cancelIndexerTask : retryIndexerTask)(task.queue, task.id));
        if (error) {
            notify.error(describeRequestError(error, t('admin.indexer.taskError')));
        }
        else {
            await load();
        }
    }
    finally {
        busyId.value = null;
    }
}
async function clearFailed() {
    if (!(await confirmAction(t('admin.indexer.clearFailedConfirm'), { danger: true })))
        return;
    clearing.value = true;
    try {
        const [error, n] = await catchError(clearFailedIndexerTasks(queue.value));
        if (error) {
            notify.error(describeRequestError(error, t('admin.indexer.taskError')));
        }
        else {
            notify.success(t('admin.indexer.clearedFailed', { n }));
            await load();
        }
    }
    finally {
        clearing.value = false;
    }
}
async function clearAllFailed() {
    if (!(await confirmAction(t('admin.indexer.clearAllFailedConfirm'), { danger: true })))
        return;
    clearing.value = true;
    try {
        const [error, n] = await catchError(clearAllFailedIndexerTasks());
        if (error) {
            notify.error(describeRequestError(error, t('admin.indexer.taskError')));
        }
        else {
            notify.success(t('admin.indexer.clearedAllFailed', { n }));
            await load();
        }
    }
    finally {
        clearing.value = false;
    }
}
function canCancel(task) {
    return task.state === 'pending' || task.state === 'active' || task.state === 'scheduled' || task.state === 'retry';
}
function canRetry(task) {
    return task.state === 'archived' || task.state === 'scheduled' || task.state === 'retry';
}
function canViewLogs(task) {
    return task.state === 'active' || task.state === 'retry' || task.state === 'archived';
}
function viewLogs(task) {
    void openModal(TaskLogsModal, { props: { queue: task.queue, id: task.id, title: describeTask(task) } }).catch(() => undefined);
}
function describeTask(task) {
    const subject = task.path || task.itemType || task.type;
    return task.libraryName ? `${task.libraryName} · ${subject}` : subject;
}
watch([queue, state], () => {
    page.value = 1;
    void load();
}, { immediate: true });
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(state, {});
    __VLS_withDotValue(clearing, {});
    __VLS_withDotValue(loading, {});
    __VLS_withDotValue(tasks, {});
    __VLS_withDotValue(error, {});
    __VLS_withDotValue(busyId, {});
    __VLS_withDotValue(PAGE_SIZE, {});
    __VLS_withDotValue(page, {});
    const __VLS_0 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('admin.indexer.tasksTitle')), description: (__VLS_unwrap(t, {})('admin.indexer.tasksDescription')),
    }));
    const __VLS_2 = __VLS_1({
        title: (__VLS_unwrap(t, {})('admin.indexer.tasksTitle')),
        description: (__VLS_unwrap(t, {})('admin.indexer.tasksDescription')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mb-3 flex flex-wrap gap-3" },
    });
    /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "flex flex-col gap-1 text-xs text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('admin.indexer.queue'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_unwrap(queue, {})),
        ...{ class: (__VLS_unwrap(inputClass, {})) },
    });
    const __VLS_6 = __VLS_tryAsConstant((__VLS_unwrap(INDEXER_TASK_QUEUES, {})));
    for (const [name] of __VLS_vFor(__VLS_nonNull(__VLS_6))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (name),
            value: (name),
        });
        (__VLS_unwrap(t, {})(`admin.indexer.queueNames.${name}`));
        // @ts-ignore
        [t, t, t, t, queue, inputClass, INDEXER_TASK_QUEUES,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "flex flex-col gap-1 text-xs text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('admin.indexer.state'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (state.value),
        ...{ class: (__VLS_unwrap(inputClass, {})) },
    });
    const __VLS_7 = __VLS_tryAsConstant((__VLS_unwrap(INDEXER_TASK_STATES, {})));
    for (const [name] of __VLS_vFor(__VLS_nonNull(__VLS_7))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (name),
            value: (name),
        });
        (__VLS_unwrap(t, {})(`admin.indexer.states.${name}`));
        // @ts-ignore
        [t, t, inputClass, state, INDEXER_TASK_STATES,];
    }
    if (state.value === 'archived') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (clearFailed) },
            type: "button",
            disabled: (clearing.value || loading.value || tasks.value.length === 0),
            ...{ class: "self-end rounded bg-red-500/20 px-3 py-1.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/30 disabled:opacity-50" },
        });
        /** @type {__VLS_StyleScopedClasses['self-end']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-red-500/20']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-200']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-red-500/30']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
        (__VLS_unwrap(t, {})('admin.indexer.clearFailed'));
    }
    if (state.value === 'archived') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (clearAllFailed) },
            type: "button",
            disabled: (clearing.value || loading.value),
            ...{ class: "self-end rounded bg-red-500/20 px-3 py-1.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/30 disabled:opacity-50" },
        });
        /** @type {__VLS_StyleScopedClasses['self-end']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-red-500/20']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-200']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-red-500/30']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
        (__VLS_unwrap(t, {})('admin.indexer.clearAllFailed'));
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
    if (loading.value && tasks.value.length === 0) {
        const __VLS_8 = AdminSkeleton;
        // @ts-ignore
        const __VLS_9 = __VLS_asFunctionalComponent1(__VLS_8, new __VLS_8({
            // @ts-ignore
            variant: "tasks",
        }));
        const __VLS_10 = __VLS_9({
            variant: "tasks",
        }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
            ...{ class: "flex flex-col gap-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        const __VLS_13 = __VLS_tryAsConstant((tasks.value));
        for (const [task] of __VLS_vFor(__VLS_nonNull(__VLS_13))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                key: (task.id),
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
                ...{ class: "truncate font-mono text-xs" },
            });
            /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            (describeTask(task));
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mt-1 text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (task.type);
            (__VLS_unwrap(t, {})('admin.indexer.attempts', { n: task.retried + 1, max: task.maxRetry + 1 }));
            if (task.lastError) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "mt-1 break-words text-xs text-red-300" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['break-words']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
                (task.lastError);
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex gap-2" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            if (canViewLogs(task)) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!!(loading.value && tasks.value.length === 0))
                                throw 0;
                            if (!(canViewLogs(task)))
                                throw 0;
                            return (viewLogs(task));
                            // @ts-ignore
                            [t, t, t, state, state, clearing, clearing, loading, loading, loading, tasks, tasks, tasks, error, error,];
                        } },
                    type: "button",
                    ...{ class: "rounded bg-white/10 px-3 py-1 text-xs font-semibold transition hover:bg-white/15" },
                });
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
                (__VLS_unwrap(t, {})('admin.indexer.viewLogs'));
            }
            if (canRetry(task)) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!!(loading.value && tasks.value.length === 0))
                                throw 0;
                            if (!(canRetry(task)))
                                throw 0;
                            return (act(task, 'retry'));
                            // @ts-ignore
                            [t,];
                        } },
                    type: "button",
                    disabled: (busyId.value === task.id),
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
                (__VLS_unwrap(t, {})('admin.indexer.retryTask'));
            }
            if (canCancel(task)) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!!(loading.value && tasks.value.length === 0))
                                throw 0;
                            if (!(canCancel(task)))
                                throw 0;
                            return (act(task, 'cancel'));
                            // @ts-ignore
                            [t, busyId,];
                        } },
                    type: "button",
                    disabled: (busyId.value === task.id),
                    ...{ class: "rounded bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-200 transition hover:bg-red-500/30 disabled:opacity-50" },
                });
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
                (__VLS_unwrap(t, {})('admin.indexer.cancelTask'));
            }
            // @ts-ignore
            [t, busyId,];
        }
        if (!loading.value && tasks.value.length === 0 && !error.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                ...{ class: "rounded border border-dashed border-flixer-border p-4 text-center text-sm text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-dashed']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.indexer.noTasks'));
        }
    }
    if (page.value > 1 || tasks.value.length === PAGE_SIZE.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-3 flex items-center gap-3 text-xs" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!(page.value > 1 || tasks.value.length === PAGE_SIZE.value))
                        throw 0;
                    return ((page.value--, load()));
                    // @ts-ignore
                    [t, loading, tasks, tasks, error, page, page, PAGE_SIZE,];
                } },
            type: "button",
            disabled: (page.value === 1 || loading.value),
            ...{ class: "rounded bg-white/10 px-3 py-1 font-semibold transition hover:bg-white/15 disabled:opacity-50" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
        (__VLS_unwrap(t, {})('admin.media.previous'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!(page.value > 1 || tasks.value.length === PAGE_SIZE.value))
                        throw 0;
                    return ((page.value++, load()));
                    // @ts-ignore
                    [t, loading, page, page,];
                } },
            type: "button",
            disabled: (tasks.value.length < PAGE_SIZE.value || loading.value),
            ...{ class: "rounded bg-white/10 px-3 py-1 font-semibold transition hover:bg-white/15 disabled:opacity-50" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
        (__VLS_unwrap(t, {})('admin.media.next'));
    }
    // @ts-ignore
    [t, loading, tasks, PAGE_SIZE,];
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
