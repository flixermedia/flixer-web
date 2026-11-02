import { onMounted, onUnmounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { listAdminScheduledTasks, runAdminScheduledTask, saveAdminScheduledTaskSchedule, stopAdminScheduledTask } from '../../api';
import { describeRequestError } from '../../composables/useProfile';
import AdminSection from './AdminSection.vue';
import AdminToggle from './AdminToggle.vue';
import StatusPill from './StatusPill.vue';
const { t } = useI18n();
const tasks = ref([]);
const drafts = reactive({});
const dirty = new Set();
const loading = ref(true);
const refreshing = ref(false);
const loadError = ref('');
const actionError = ref('');
const busyId = ref(null);
const savingId = ref(null);
let refreshTimer;
const stateTone = {
    running: 'good',
    queued: 'accent',
    completed: 'good',
    failed: 'bad',
    cancelled: 'neutral',
    never: 'neutral',
};
const stateKeys = {
    running: 'admin.tasks.runningIndeterminate',
    queued: 'admin.tasks.queued',
    completed: 'admin.tasks.completed',
    failed: 'admin.tasks.failed',
    cancelled: 'admin.tasks.cancelled',
    never: 'admin.tasks.neverRun',
};
const categoryKeys = { Library: 'admin.tasks.libraryCategory', Maintenance: 'admin.tasks.maintenanceCategory' };
async function loadTasks() {
    if (refreshing.value)
        return;
    refreshing.value = true;
    loading.value = true;
    try {
        tasks.value = await listAdminScheduledTasks();
        for (const task of tasks.value) {
            if (!dirty.has(task.id))
                drafts[task.id] = { enabled: task.enabled, cron: task.cron };
        }
        loadError.value = '';
    }
    catch (error) {
        loadError.value = describeRequestError(error, t('admin.tasks.loadFailed'));
    }
    finally {
        loading.value = false;
        refreshing.value = false;
    }
}
function isDirty(task) {
    const draft = drafts[task.id];
    return !!draft && (draft.enabled !== task.enabled || draft.cron !== task.cron);
}
function updateDraft(task) {
    dirty.add(task.id);
}
async function saveSchedule(task) {
    const draft = drafts[task.id];
    if (!draft || !isDirty(task))
        return;
    const changes = { enabled: draft.enabled, cron: draft.cron };
    savingId.value = task.id;
    actionError.value = '';
    try {
        await saveAdminScheduledTaskSchedule(task.id, changes);
        if (draft.enabled === changes.enabled && draft.cron === changes.cron)
            dirty.delete(task.id);
        task.enabled = changes.enabled;
        task.cron = changes.cron;
        void loadTasks();
    }
    catch (error) {
        actionError.value = describeRequestError(error, t('admin.tasks.scheduleFailed'));
    }
    finally {
        savingId.value = null;
    }
}
async function runTask(task) {
    busyId.value = task.id;
    actionError.value = '';
    try {
        await runAdminScheduledTask(task.id);
        await loadTasks();
    }
    catch (error) {
        actionError.value = describeRequestError(error, t('admin.tasks.runFailed'));
    }
    finally {
        busyId.value = null;
    }
}
async function stopTask(task) {
    busyId.value = task.id;
    actionError.value = '';
    try {
        await stopAdminScheduledTask(task.id);
        await loadTasks();
    }
    catch (error) {
        actionError.value = describeRequestError(error, t('admin.tasks.stopFailed'));
    }
    finally {
        busyId.value = null;
    }
}
function formatLastRun(value) {
    if (!value)
        return t('admin.tasks.neverRun');
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
onMounted(() => {
    void loadTasks();
    refreshTimer = setInterval(() => void loadTasks(), 5_000);
});
onUnmounted(() => {
    if (refreshTimer)
        clearInterval(refreshTimer);
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(loadError, {});
    __VLS_withDotValue(actionError, {});
    __VLS_withDotValue(categoryKeys, {});
    __VLS_withDotValue(stateTone, {});
    __VLS_withDotValue(stateKeys, {});
    __VLS_withDotValue(busyId, {});
    __VLS_withDotValue(drafts, {});
    __VLS_withDotValue(savingId, {});
    __VLS_withDotValue(loading, {});
    __VLS_withDotValue(tasks, {});
    const __VLS_0 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('admin.tasks.title')), description: (__VLS_unwrap(t, {})('admin.tasks.description')),
    }));
    const __VLS_2 = __VLS_1({
        title: (__VLS_unwrap(t, {})('admin.tasks.title')),
        description: (__VLS_unwrap(t, {})('admin.tasks.description')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    if (loadError.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            role: "alert",
            ...{ class: "mb-3 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200" },
        });
        /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-red-500/30']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-red-500/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-200']} */ ;
        (loadError.value);
    }
    if (actionError.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            role: "alert",
            ...{ class: "mb-3 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200" },
        });
        /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-red-500/30']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-red-500/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-200']} */ ;
        (actionError.value);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
        ...{ class: "flex flex-col gap-4" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    const __VLS_6 = __VLS_tryAsConstant((tasks.value));
    for (const [task] of __VLS_vFor(__VLS_nonNull(__VLS_6))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
            key: (task.id),
            ...{ class: "rounded border border-flixer-border bg-flixer-background/60 p-4 transition-colors hover:border-flixer-accent/30 sm:p-5" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-background/60']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:border-flixer-accent/30']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:p-5']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:flex-row']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:items-start']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:justify-between']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "min-w-0" },
        });
        /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex flex-wrap items-center gap-x-3 gap-y-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-x-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-y-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
            ...{ class: "text-sm font-semibold tracking-tight sm:text-base" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['tracking-tight']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:text-base']} */ ;
        (task.name);
        const __VLS_7 = StatusPill || StatusPill;
        // @ts-ignore
        const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
            // @ts-ignore
            tone: "accent",
        }));
        const __VLS_9 = __VLS_8({
            tone: "accent",
        }, ...__VLS_functionalComponentArgsRest(__VLS_8));
        var __VLS_10;
        const { default: __VLS_12 } = __VLS_nonNull(__VLS_10.slots);
        (__VLS_unwrap(t, {})(categoryKeys.value[task.category]));
        // @ts-ignore
        [t, t, t, loadError, loadError, actionError, actionError, tasks, categoryKeys,];
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-1.5 max-w-2xl text-sm leading-5 text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['max-w-2xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['leading-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (task.description);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex shrink-0 items-center gap-2 self-start" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['self-start']} */ ;
        const __VLS_13 = StatusPill || StatusPill;
        // @ts-ignore
        const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
            // @ts-ignore
            tone: (stateTone.value[task.state]),
        }));
        const __VLS_15 = __VLS_14({
            tone: (stateTone.value[task.state]),
        }, ...__VLS_functionalComponentArgsRest(__VLS_14));
        var __VLS_16;
        const { default: __VLS_18 } = __VLS_nonNull(__VLS_16.slots);
        (task.state === 'running' && task.progress !== undefined ? __VLS_unwrap(t, {})('admin.tasks.running', { progress: task.progress }) : __VLS_unwrap(t, {})(stateKeys.value[task.state]));
        // @ts-ignore
        [t, t, stateTone, stateKeys,];
        if (task.state === 'running' || task.state === 'queued') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!(task.state === 'running' || task.state === 'queued'))
                            throw 0;
                        return (stopTask(task));
                        // @ts-ignore
                        [];
                    } },
                type: "button",
                disabled: (busyId.value === task.id),
                ...{ class: "inline-flex h-9 items-center justify-center rounded bg-red-500/15 px-4 text-xs font-semibold text-red-200 transition hover:bg-red-500/25 disabled:opacity-50" },
            });
            /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-9']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-red-500/15']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-red-200']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-red-500/25']} */ ;
            /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
            (__VLS_unwrap(t, {})('admin.tasks.stop'));
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!!(task.state === 'running' || task.state === 'queued'))
                            throw 0;
                        return (runTask(task));
                        // @ts-ignore
                        [t, busyId,];
                    } },
                type: "button",
                disabled: (busyId.value === task.id),
                ...{ class: "inline-flex h-9 items-center justify-center rounded bg-white/10 px-4 text-xs font-semibold transition hover:bg-white/15 disabled:opacity-50" },
            });
            /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-9']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
            /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
            (__VLS_unwrap(t, {})('admin.tasks.runNow'));
        }
        if (task.state === 'running' && task.progress !== undefined) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mt-3 h-1.5 overflow-hidden rounded bg-white/10" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-1.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "h-full rounded bg-flixer-primary" },
                ...{ style: ({ width: `${task.progress}%` }) },
            });
            /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-primary']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:grid-cols-[minmax(0,1fr)_auto]']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:items-center']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "min-w-0" },
        });
        /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onInput: (...[$event]) => {
                    void $event;
                    return (updateDraft(task));
                    // @ts-ignore
                    [t, busyId,];
                } },
            value: (drafts.value[task.id].cron),
            type: "text",
            maxlength: "128",
            'aria-label': (`${task.name} ${__VLS_unwrap(t, {})('admin.tasks.cron')}`),
            ...{ class: "h-10 w-full rounded border border-flixer-border bg-flixer-background px-3 font-mono text-sm text-flixer-text focus-visible:outline-2 focus-visible:outline-flixer-accent" },
        });
        /** @type {__VLS_StyleScopedClasses['h-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    return (saveSchedule(task));
                    // @ts-ignore
                    [t, drafts,];
                } },
            type: "button",
            disabled: (!isDirty(task) || savingId.value === task.id),
            ...{ class: "inline-flex h-10 w-full items-center justify-center rounded bg-white/10 px-4 text-sm font-semibold transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto" },
        });
        /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:cursor-not-allowed']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:w-auto']} */ ;
        (savingId.value === task.id ? __VLS_unwrap(t, {})('admin.tasks.saving') : __VLS_unwrap(t, {})('admin.tasks.saveSchedule'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-3" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-end']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-x-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-y-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "min-w-0 flex-1 text-xs" },
        });
        /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.tasks.lastRun'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "ml-1 font-medium text-flixer-text" },
        });
        /** @type {__VLS_StyleScopedClasses['ml-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
        (formatLastRun(task.lastRunAt));
        if (task.lastError) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                role: "status",
                ...{ class: "mt-2 break-words text-red-200" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['break-words']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-red-200']} */ ;
            (__VLS_unwrap(t, {})('admin.tasks.lastError'));
            (task.lastError);
        }
        const __VLS_19 = AdminToggle;
        // @ts-ignore
        const __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({
            // @ts-ignore
            ...{ 'onUpdate:modelValue': {} }, modelValue: (drafts.value[task.id].enabled), label: (__VLS_unwrap(t, {})('admin.tasks.enabled')), compact: true, ...{ class: "shrink-0" },
        }));
        const __VLS_21 = __VLS_20({
            ...{ 'onUpdate:modelValue': {} },
            modelValue: (drafts.value[task.id].enabled),
            label: (__VLS_unwrap(t, {})('admin.tasks.enabled')),
            compact: true,
            ...{ class: "shrink-0" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_20));
        let __VLS_24;
        const __VLS_25 = {
            /** @type {typeof __VLS_24.'update:modelValue'} */
            'onUpdate:modelValue': (...[$event]) => {
                void $event;
                return (updateDraft(task));
                // @ts-ignore
                [t, t, t, t, t, drafts, savingId, savingId,];
            },
        };
        void __VLS_25;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        var __VLS_22;
        var __VLS_23;
        // @ts-ignore
        [];
    }
    if (loading.value && tasks.value.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
            ...{ class: "rounded border border-flixer-border bg-flixer-background/60 p-5 text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-background/60']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.tasks.loading'));
    }
    else if (!loading.value && tasks.value.length === 0 && !loadError.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
            ...{ class: "rounded border border-dashed border-flixer-border p-8 text-center text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-dashed']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-8']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.tasks.empty'));
    }
    // @ts-ignore
    [t, t, loadError, tasks, tasks, loading, loading,];
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
