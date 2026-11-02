import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { getMediaSearchAdminStatus, getMediaSearchTask, rebuildMediaSearchIndex, resetMediaSearchIndex, saveMediaSearchAdminSettings } from '../../api/admin';
import { confirmAction } from '../../composables/confirm';
import { notify } from '../../composables/notify';
import { describeRequestError } from '../../composables/useProfile';
import { catchError } from '../../utils/catchError';
import AdminSection from './AdminSection.vue';
import AdminSkeleton from './AdminSkeleton.vue';
import AdminToggle from './AdminToggle.vue';
import StatusPill from './StatusPill.vue';
const { t } = useI18n();
const status = ref(null);
const form = reactive({
    enabled: true,
    customUrl: '',
});
const isLoading = ref(true);
const isSaving = ref(false);
const isRefreshing = ref(false);
const isRebuilding = ref(false);
const isResetting = ref(false);
const selectedTask = ref(null);
const isLoadingTask = ref(false);
const taskDetailError = ref('');
let taskRefreshTimer;
let taskDetailTimer;
const inputClass = 'mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 font-mono text-sm text-flixer-text';
const button = 'rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60';
const connectionTone = computed(() => (status.value?.connected === true ? 'good' : status.value?.connected === false ? 'bad' : 'neutral'));
const connectionLabel = computed(() => (status.value?.connected === true ? t('admin.search.connected') : status.value?.connected === false ? t('admin.search.disconnected') : status.value?.enabled ? t('admin.search.notChecked') : t('admin.search.disabled')));
function taskTone(taskStatus) {
    if (taskStatus === 'succeeded')
        return 'good';
    if (taskStatus === 'failed' || taskStatus === 'canceled')
        return 'bad';
    if (taskStatus === 'enqueued' || taskStatus === 'processing')
        return 'accent';
    return 'neutral';
}
function formatTaskDate(value) {
    if (!value)
        return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
function scheduleTaskRefresh() {
    if (taskRefreshTimer)
        clearTimeout(taskRefreshTimer);
    if (!status.value?.tasks.some((task) => task.status === 'enqueued' || task.status === 'processing'))
        return;
    taskRefreshTimer = setTimeout(async () => {
        await loadStatus();
    }, 5000);
}
function scheduleTaskDetailRefresh(uid) {
    if (taskDetailTimer)
        clearTimeout(taskDetailTimer);
    if (!selectedTask.value || selectedTask.value.uid !== uid || !['enqueued', 'processing'].includes(selectedTask.value.status))
        return;
    taskDetailTimer = setTimeout(() => void loadTaskDetails(uid), 2000);
}
async function loadTaskDetails(uid) {
    if (selectedTask.value?.uid !== uid)
        return;
    isLoadingTask.value = true;
    const [error, result] = await catchError(getMediaSearchTask(uid));
    if (selectedTask.value?.uid !== uid)
        return;
    if (error) {
        console.error(`[admin search] failed to load Meilisearch task ${uid}`, error);
        taskDetailError.value = describeRequestError(error, t('admin.search.taskDetailsError'));
        isLoadingTask.value = false;
        return;
    }
    selectedTask.value = result;
    taskDetailError.value = '';
    isLoadingTask.value = false;
    scheduleTaskDetailRefresh(uid);
}
function openTask(task) {
    if (taskDetailTimer)
        clearTimeout(taskDetailTimer);
    selectedTask.value = { ...task, details: null };
    taskDetailError.value = '';
    void loadTaskDetails(task.uid);
}
function closeTask() {
    if (taskDetailTimer)
        clearTimeout(taskDetailTimer);
    taskDetailTimer = undefined;
    selectedTask.value = null;
    taskDetailError.value = '';
}
async function loadStatus(updateForm = false) {
    const [error, result] = await catchError(getMediaSearchAdminStatus());
    if (error) {
        console.error('[admin search] failed to load Meilisearch status', error);
        if (updateForm)
            notify.error(describeRequestError(error, t('admin.search.loadError')));
    }
    else {
        status.value = result;
        scheduleTaskRefresh();
        if (updateForm) {
            form.enabled = result.enabled;
            form.customUrl = result.customUrl;
        }
    }
}
async function refresh() {
    isRefreshing.value = true;
    try {
        await loadStatus();
    }
    finally {
        isRefreshing.value = false;
    }
}
async function save() {
    isSaving.value = true;
    try {
        const [error, result] = await catchError(saveMediaSearchAdminSettings(form));
        if (error) {
            console.error('[admin search] failed to save Meilisearch settings', error);
            notify.error(describeRequestError(error, t('admin.search.saveError')));
        }
        else {
            status.value = result;
            form.enabled = result.enabled;
            form.customUrl = result.customUrl;
            notify.success(t('admin.search.saved'));
        }
    }
    finally {
        isSaving.value = false;
    }
}
async function rebuild() {
    if (!(await confirmAction(t('admin.search.confirmRebuild'))))
        return;
    isRebuilding.value = true;
    try {
        const [error, result] = await catchError(rebuildMediaSearchIndex());
        if (error) {
            console.error('[admin search] failed to queue an index rebuild', error);
            notify.error(describeRequestError(error, t('admin.search.rebuildError')));
        }
        else {
            notify.success(t(result.queued ? 'admin.search.rebuildQueued' : 'admin.search.rebuildAlreadyQueued'));
            await loadStatus();
        }
    }
    finally {
        isRebuilding.value = false;
    }
}
async function resetAndRebuild() {
    if (!(await confirmAction(t('admin.search.confirmReset'))))
        return;
    isResetting.value = true;
    try {
        const [error, result] = await catchError(resetMediaSearchIndex());
        if (error) {
            console.error('[admin search] failed to reset the Meilisearch index', error);
            notify.error(describeRequestError(error, t('admin.search.resetError')));
        }
        else {
            notify.success(t(result.queued ? 'admin.search.resetQueued' : 'admin.search.resetAlreadyQueued'));
            await loadStatus();
        }
    }
    finally {
        isResetting.value = false;
    }
}
onMounted(async () => {
    try {
        await loadStatus(true);
    }
    finally {
        isLoading.value = false;
    }
});
onBeforeUnmount(() => {
    if (taskRefreshTimer)
        clearTimeout(taskRefreshTimer);
    if (taskDetailTimer)
        clearTimeout(taskDetailTimer);
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(isLoading, {});
    __VLS_withDotValue(isRefreshing, {});
    __VLS_withDotValue(isSaving, {});
    __VLS_withDotValue(form, {});
    __VLS_withDotValue(status, {});
    __VLS_withDotValue(isRebuilding, {});
    __VLS_withDotValue(isResetting, {});
    __VLS_withDotValue(selectedTask, {});
    __VLS_withDotValue(taskDetailError, {});
    __VLS_withDotValue(isLoadingTask, {});
    const __VLS_0 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('admin.search.title')), description: (__VLS_unwrap(t, {})('admin.search.description')),
    }));
    const __VLS_2 = __VLS_1({
        title: (__VLS_unwrap(t, {})('admin.search.title')),
        description: (__VLS_unwrap(t, {})('admin.search.description')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    {
        const { actions: __VLS_6 } = __VLS_nonNull(__VLS_3.slots);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (refresh) },
            type: "button",
            ...{ class: "rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15 disabled:opacity-60" },
            disabled: (isLoading.value || isRefreshing.value),
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
        (isRefreshing.value ? __VLS_unwrap(t, {})('admin.search.refreshing') : __VLS_unwrap(t, {})('admin.search.refresh'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (save) },
            type: "button",
            ...{ class: (__VLS_unwrap(button, {})) },
            disabled: (isLoading.value || isSaving.value),
        });
        (isSaving.value ? __VLS_unwrap(t, {})('admin.search.saving') : __VLS_unwrap(t, {})('common.save'));
        // @ts-ignore
        [t, t, t, t, t, t, isLoading, isLoading, isRefreshing, isRefreshing, button, isSaving, isSaving,];
    }
    if (isLoading.value) {
        const __VLS_7 = AdminSkeleton;
        // @ts-ignore
        const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
            // @ts-ignore
            variant: "fields", rows: (3),
        }));
        const __VLS_9 = __VLS_8({
            variant: "fields",
            rows: (3),
        }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    }
    else {
        const __VLS_12 = AdminToggle;
        // @ts-ignore
        const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
            // @ts-ignore
            modelValue: (form.value.enabled), label: (__VLS_unwrap(t, {})('admin.search.enabled')), description: (__VLS_unwrap(t, {})('admin.search.enabledHelp')),
        }));
        const __VLS_14 = __VLS_13({
            modelValue: (form.value.enabled),
            label: (__VLS_unwrap(t, {})('admin.search.enabled')),
            description: (__VLS_unwrap(t, {})('admin.search.enabledHelp')),
        }, ...__VLS_functionalComponentArgsRest(__VLS_13));
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "mt-4 block text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.search.urlLabel'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "url",
            autocomplete: "url",
            spellcheck: "false",
            placeholder: (__VLS_unwrap(t, {})('admin.search.urlPlaceholder')),
            ...{ class: (__VLS_unwrap(inputClass, {})) },
        });
        (form.value.customUrl);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "mt-1 block" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        (__VLS_unwrap(t, {})('admin.search.urlHelp'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-5 rounded border border-flixer-border bg-white/[0.03] p-4" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/[0.03]']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex flex-wrap items-center justify-between gap-3" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
            ...{ class: "text-sm font-semibold" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        (__VLS_unwrap(t, {})('admin.search.statusTitle'));
        const __VLS_17 = StatusPill || StatusPill;
        // @ts-ignore
        const __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({
            // @ts-ignore
            tone: (__VLS_unwrap(connectionTone, {})),
        }));
        const __VLS_19 = __VLS_18({
            tone: (__VLS_unwrap(connectionTone, {})),
        }, ...__VLS_functionalComponentArgsRest(__VLS_18));
        var __VLS_20;
        const { default: __VLS_22 } = __VLS_nonNull(__VLS_20.slots);
        (__VLS_unwrap(connectionLabel, {}));
        // @ts-ignore
        [t, t, t, t, t, t, isLoading, form, form, inputClass, connectionTone, connectionLabel,];
        if (!status.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                role: "alert",
                ...{ class: "mt-3 text-sm text-red-300" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
            (__VLS_unwrap(t, {})('admin.search.statusUnavailable'));
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.dl, __VLS_intrinsics.dl)({
                ...{ class: "mt-3 grid gap-3 text-sm sm:grid-cols-2" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
                ...{ class: "text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.search.effectiveUrl'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
                ...{ class: "mt-1 break-all font-mono text-xs" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['break-all']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            (status.value.url);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
                ...{ class: "text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.search.urlSource'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
                ...{ class: "mt-1" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            (__VLS_unwrap(t, {})(`admin.search.sources.${status.value.urlSource}`));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
                ...{ class: "text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.search.index'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
                ...{ class: "mt-1" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            (status.value.indexExists === true ? __VLS_unwrap(t, {})('admin.search.indexReady') : status.value.indexExists === false ? __VLS_unwrap(t, {})('admin.search.indexMissing') : __VLS_unwrap(t, {})('admin.search.notChecked'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
                ...{ class: "text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.search.documents'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
                ...{ class: "mt-1" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            (status.value.documentCount ?? '—');
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
                ...{ class: "text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.search.outboxPending'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
                ...{ class: "mt-1" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            (status.value.outboxPending);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
                ...{ class: "text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.search.outboxFailed'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
                ...{ class: "mt-1" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            (status.value.outboxFailed);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
                ...{ class: "text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.search.apiKey'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
                ...{ class: "mt-1" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            (status.value.apiKeyConfigured ? __VLS_unwrap(t, {})('admin.search.apiKeyConfigured') : __VLS_unwrap(t, {})('admin.search.apiKeyMissing'));
            if (status.value.error) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    role: "alert",
                    ...{ class: "mt-3 break-words text-sm text-red-300" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['break-words']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
                (status.value.error);
            }
            if (status.value.lastOutboxError) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "mt-3 break-words text-xs text-amber-300" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['break-words']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-amber-300']} */ ;
                (__VLS_unwrap(t, {})('admin.search.lastOutboxError'));
                (status.value.lastOutboxError);
            }
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-4 rounded border border-flixer-border bg-white/[0.03] p-4" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/[0.03]']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
            ...{ class: "text-sm font-semibold" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        (__VLS_unwrap(t, {})('admin.search.tasksTitle'));
        if (status.value?.tasksError) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                role: "alert",
                ...{ class: "mt-3 break-words text-sm text-red-300" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['break-words']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
            (__VLS_unwrap(t, {})('admin.search.tasksError'));
            (status.value.tasksError);
        }
        else if (!status.value?.tasks.length) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mt-3 text-sm text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.search.noTasks'));
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
                ...{ class: "mt-3 divide-y divide-flixer-border" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['divide-y']} */ ;
            /** @type {__VLS_StyleScopedClasses['divide-flixer-border']} */ ;
            const __VLS_23 = __VLS_tryAsConstant((status.value?.tasks ?? []));
            for (const [task] of __VLS_vFor(__VLS_nonNull(__VLS_23))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                    key: (task.uid),
                    ...{ class: "py-3 first:pt-0 last:pb-0" },
                });
                /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['first:pt-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['last:pb-0']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "flex flex-wrap items-center justify-between gap-2" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "font-mono text-xs text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (__VLS_unwrap(t, {})('admin.search.taskId', { id: task.uid }));
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "flex items-center gap-2" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
                const __VLS_24 = StatusPill || StatusPill;
                // @ts-ignore
                const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
                    // @ts-ignore
                    tone: (taskTone(task.status)),
                }));
                const __VLS_26 = __VLS_25({
                    tone: (taskTone(task.status)),
                }, ...__VLS_functionalComponentArgsRest(__VLS_25));
                var __VLS_27;
                const { default: __VLS_29 } = __VLS_nonNull(__VLS_27.slots);
                (task.status);
                // @ts-ignore
                [t, t, t, t, t, t, t, t, t, t, t, t, t, t, t, t, t, t, t, status, status, status, status, status, status, status, status, status, status, status, status, status, status, status, status, status,];
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!!(isLoading.value))
                                throw 0;
                            if (!!(status.value?.tasksError))
                                throw 0;
                            if (!!(!status.value?.tasks.length))
                                throw 0;
                            return (openTask(task));
                            // @ts-ignore
                            [];
                        } },
                    type: "button",
                    ...{ class: "rounded bg-white/10 px-2.5 py-1 text-xs font-semibold transition hover:bg-white/15" },
                });
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-2.5']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
                (__VLS_unwrap(t, {})('admin.search.viewTask'));
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "mt-1 text-sm" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                (task.type);
                __VLS_asFunctionalElement1(__VLS_intrinsics.dl, __VLS_intrinsics.dl)({
                    ...{ class: "mt-2 grid gap-2 text-xs sm:grid-cols-3" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['grid']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['sm:grid-cols-3']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
                    ...{ class: "text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (__VLS_unwrap(t, {})('admin.search.taskEnqueued'));
                __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
                    ...{ class: "mt-0.5" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-0.5']} */ ;
                (formatTaskDate(task.enqueuedAt));
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
                    ...{ class: "text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (__VLS_unwrap(t, {})('admin.search.taskStarted'));
                __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
                    ...{ class: "mt-0.5" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-0.5']} */ ;
                (formatTaskDate(task.startedAt));
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
                    ...{ class: "text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (__VLS_unwrap(t, {})('admin.search.taskDuration'));
                __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
                    ...{ class: "mt-0.5" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-0.5']} */ ;
                (task.duration ?? '—');
                if (task.error?.message) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                        role: "alert",
                        ...{ class: "mt-2 break-words text-xs text-red-300" },
                    });
                    /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
                    /** @type {__VLS_StyleScopedClasses['break-words']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
                    (task.error.message);
                }
                // @ts-ignore
                [t, t, t, t,];
            }
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-4 flex flex-wrap items-center justify-between gap-3" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.search.rebuildHelp'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex flex-wrap gap-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (resetAndRebuild) },
            type: "button",
            ...{ class: "rounded border border-red-400/40 bg-red-400/10 px-4 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-400/20 disabled:opacity-60" },
            disabled: (isRebuilding.value || isResetting.value || !form.value.enabled),
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-red-400/40']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-red-400/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-200']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-red-400/20']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
        (isResetting.value ? __VLS_unwrap(t, {})('admin.search.resetting') : __VLS_unwrap(t, {})('admin.search.reset'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (rebuild) },
            type: "button",
            ...{ class: "rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15 disabled:opacity-60" },
            disabled: (isRebuilding.value || isResetting.value || !form.value.enabled),
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
        (isRebuilding.value ? __VLS_unwrap(t, {})('admin.search.rebuilding') : __VLS_unwrap(t, {})('admin.search.rebuild'));
    }
    // @ts-ignore
    [t, t, t, t, t, form, form, isRebuilding, isRebuilding, isRebuilding, isResetting, isResetting, isResetting,];
    if (selectedTask.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ onClick: (closeTask) },
            ...{ onKeydown: (closeTask) },
            ...{ class: "fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4" },
        });
        /** @type {__VLS_StyleScopedClasses['fixed']} */ ;
        /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['z-[80]']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-black/70']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "theme-dark max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded border border-flixer-border bg-flixer-surface p-5 shadow-2xl" },
            role: "dialog",
            'aria-modal': "true",
            'aria-label': (__VLS_unwrap(t, {})('admin.search.taskDetailsTitle', { id: selectedTask.value.uid })),
        });
        /** @type {__VLS_StyleScopedClasses['theme-dark']} */ ;
        /** @type {__VLS_StyleScopedClasses['max-h-[85vh]']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['max-w-2xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-2xl']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
            ...{ class: "flex items-start justify-between gap-4" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
            ...{ class: "text-lg font-semibold" },
        });
        /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        (__VLS_unwrap(t, {})('admin.search.taskDetailsTitle', { id: selectedTask.value.uid }));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-2 flex items-center gap-2" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        const __VLS_30 = StatusPill || StatusPill;
        // @ts-ignore
        const __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({
            // @ts-ignore
            tone: (taskTone(selectedTask.value.status)),
        }));
        const __VLS_32 = __VLS_31({
            tone: (taskTone(selectedTask.value.status)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_31));
        var __VLS_33;
        const { default: __VLS_35 } = __VLS_nonNull(__VLS_33.slots);
        (selectedTask.value.status);
        // @ts-ignore
        [t, t, selectedTask, selectedTask, selectedTask, selectedTask, selectedTask,];
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (selectedTask.value.type);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (closeTask) },
            type: "button",
            ...{ class: "rounded bg-white/10 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/15" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
        (__VLS_unwrap(t, {})('common.close'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-4 rounded border border-flixer-border bg-white/[0.03] p-3 text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/[0.03]']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.search.taskDetailsNotice'));
        if (taskDetailError.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                role: "alert",
                ...{ class: "mt-4 break-words text-sm text-red-300" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['break-words']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
            (taskDetailError.value);
        }
        else if (isLoadingTask.value && !selectedTask.value.details) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mt-4 text-sm text-flixer-muted" },
                role: "status",
            });
            /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.search.taskDetailsLoading'));
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.dl, __VLS_intrinsics.dl)({
                ...{ class: "mt-4 grid gap-3 text-sm sm:grid-cols-2" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
                ...{ class: "text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.search.taskEnqueued'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
                ...{ class: "mt-1" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            (formatTaskDate(selectedTask.value.enqueuedAt));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
                ...{ class: "text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.search.taskStarted'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
                ...{ class: "mt-1" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            (formatTaskDate(selectedTask.value.startedAt));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
                ...{ class: "text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.search.taskFinished'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
                ...{ class: "mt-1" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            (formatTaskDate(selectedTask.value.finishedAt));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
                ...{ class: "text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.search.taskDuration'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
                ...{ class: "mt-1" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            (selectedTask.value.duration ?? '—');
            if (selectedTask.value.error) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "mt-4 rounded border border-red-400/30 bg-red-400/10 p-3" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['border']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-red-400/30']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-red-400/10']} */ ;
                /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
                    ...{ class: "text-sm font-semibold text-red-200" },
                });
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-red-200']} */ ;
                (__VLS_unwrap(t, {})('admin.search.taskFailure'));
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "mt-2 break-words text-xs text-red-200" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['break-words']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-red-200']} */ ;
                (selectedTask.value.error.message);
                if (selectedTask.value.error.code || selectedTask.value.error.type) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.dl, __VLS_intrinsics.dl)({
                        ...{ class: "mt-3 grid gap-2 text-xs sm:grid-cols-2" },
                    });
                    /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
                    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
                    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                    /** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
                    if (selectedTask.value.error.code) {
                        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                        __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
                            ...{ class: "text-red-200/70" },
                        });
                        /** @type {__VLS_StyleScopedClasses['text-red-200/70']} */ ;
                        (__VLS_unwrap(t, {})('admin.search.taskErrorCode'));
                        __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
                            ...{ class: "mt-0.5 font-mono" },
                        });
                        /** @type {__VLS_StyleScopedClasses['mt-0.5']} */ ;
                        /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
                        (selectedTask.value.error.code);
                    }
                    if (selectedTask.value.error.type) {
                        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                        __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
                            ...{ class: "text-red-200/70" },
                        });
                        /** @type {__VLS_StyleScopedClasses['text-red-200/70']} */ ;
                        (__VLS_unwrap(t, {})('admin.search.taskErrorType'));
                        __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
                            ...{ class: "mt-0.5 font-mono" },
                        });
                        /** @type {__VLS_StyleScopedClasses['mt-0.5']} */ ;
                        /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
                        (selectedTask.value.error.type);
                    }
                }
                if (selectedTask.value.error.link) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
                        href: (selectedTask.value.error.link),
                        target: "_blank",
                        rel: "noopener noreferrer",
                        ...{ class: "mt-3 inline-block text-xs text-red-200 underline" },
                    });
                    /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
                    /** @type {__VLS_StyleScopedClasses['inline-block']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-red-200']} */ ;
                    /** @type {__VLS_StyleScopedClasses['underline']} */ ;
                    (__VLS_unwrap(t, {})('admin.search.taskErrorDocs'));
                }
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mt-4" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex items-center justify-between gap-3" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
                ...{ class: "text-sm font-semibold" },
            });
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            (__VLS_unwrap(t, {})('admin.search.taskDetailsData'));
            if (isLoadingTask.value) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "text-xs text-flixer-muted" },
                    role: "status",
                });
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (__VLS_unwrap(t, {})('admin.search.taskDetailsRefreshing'));
            }
            if (selectedTask.value.details && Object.keys(selectedTask.value.details).length) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.pre, __VLS_intrinsics.pre)({
                    ...{ class: "mt-2 max-h-80 overflow-auto rounded border border-flixer-border bg-black/30 p-3 text-xs text-flixer-text" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['max-h-80']} */ ;
                /** @type {__VLS_StyleScopedClasses['overflow-auto']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['border']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-black/30']} */ ;
                /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
                (JSON.stringify(selectedTask.value.details, null, 2));
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "mt-2 text-xs text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (__VLS_unwrap(t, {})('admin.search.taskDetailsEmpty'));
            }
        }
    }
    // @ts-ignore
    [t, t, t, t, t, t, t, t, t, t, t, t, t, t, selectedTask, selectedTask, selectedTask, selectedTask, selectedTask, selectedTask, selectedTask, selectedTask, selectedTask, selectedTask, selectedTask, selectedTask, selectedTask, selectedTask, selectedTask, selectedTask, selectedTask, selectedTask, selectedTask, taskDetailError, taskDetailError, isLoadingTask, isLoadingTask,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
