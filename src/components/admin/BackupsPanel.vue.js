import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { clearBackupPassphrase, createBackup, deleteBackup, getBackupDownloadUrl, getBackupStatus, restoreBackup, setBackupPassphrase, updateSetting, uploadBackup } from '../../api';
import { notify } from '../../composables/notify';
import { describeRequestError } from '../../composables/useProfile';
import { catchError } from '../../utils/catchError';
import AdminSection from './AdminSection.vue';
import AdminSkeleton from './AdminSkeleton.vue';
import StatusPill from './StatusPill.vue';
import { confirmAction } from '../../composables/confirm';
const POLL_MS = 3000;
const { t, te, locale } = useI18n();
const status = ref(null);
const loadError = ref('');
const isCreating = ref(false);
const uploadProgress = ref(null);
const fileInput = ref(null);
const schedule = ref('off');
const keep = ref(7);
const newPassphrase = ref('');
const isSavingPassphrase = ref(false);
const restoreTarget = ref(null);
const restorePassphrase = ref('');
const restoreConfirmed = ref(false);
const isRestoring = ref(false);
let timer;
let unmounted = false;
let wasRunning = false;
const running = computed(() => status.value?.run?.status === 'running');
const busy = computed(() => running.value || isCreating.value || isRestoring.value || uploadProgress.value !== null);
const ready = computed(() => status.value !== null);
const canRestore = computed(() => Boolean(status.value?.canRestore));
const scheduleDirty = computed(() => status.value !== null && (schedule.value !== status.value.schedule || keep.value !== status.value.keep));
const inputClass = 'w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm outline-none transition focus:border-flixer-accent';
const buttonClass = 'rounded bg-flixer-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60';
const quietButtonClass = 'rounded bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/15 disabled:opacity-60';
const dangerButtonClass = 'rounded bg-red-500/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-60';
function formatTime(iso) {
    return iso ? new Date(iso).toLocaleString(locale.value, { dateStyle: 'medium', timeStyle: 'short' }) : t('admin.backups.never');
}
function formatSize(bytes) {
    if (bytes >= 1073741824)
        return `${(bytes / 1073741824).toFixed(2)} GB`;
    if (bytes >= 1048576)
        return `${(bytes / 1048576).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
function componentLabel(id) {
    return te(`admin.backups.components.${id}`) ? t(`admin.backups.components.${id}`) : id;
}
function stepLabel(step) {
    return te(`admin.backups.steps.${step}`) ? t(`admin.backups.steps.${step}`) : step;
}
function adopt(next) {
    status.value = next;
    if (!scheduleDirty.value) {
        schedule.value = next.schedule;
        keep.value = next.keep;
    }
}
// A restore restarts the API, so polling has to ride out failed requests instead of reporting them.
function schedulePoll() {
    clearTimeout(timer);
    if (unmounted || !running.value)
        return;
    timer = setTimeout(async () => {
        await load(true);
        schedulePoll();
    }, POLL_MS);
}
async function load(quiet = false) {
    const [error, result] = await catchError(getBackupStatus());
    if (error) {
        if (!quiet)
            loadError.value = describeRequestError(error);
        return;
    }
    adopt(result);
    loadError.value = '';
    if (wasRunning && !running.value) {
        const run = status.value?.run;
        if (run?.status === 'succeeded')
            notify.success(t(run.kind === 'restore' ? 'admin.backups.run.restored' : 'admin.backups.run.created'));
    }
    wasRunning = running.value;
}
async function create() {
    isCreating.value = true;
    try {
        const [error] = await catchError(createBackup());
        if (error) {
            notify.error(describeRequestError(error));
        }
        else {
            notify.success(t('admin.backups.started'));
            await load(true);
            wasRunning = running.value;
            schedulePoll();
        }
    }
    finally {
        isCreating.value = false;
    }
}
async function download(backup) {
    const link = document.createElement('a');
    const [error, url] = await catchError(getBackupDownloadUrl(backup.name));
    if (error) {
        notify.error(describeRequestError(error));
    }
    else {
        link.href = url;
        link.download = backup.name;
        link.click();
    }
}
async function remove(backup) {
    if (!(await confirmAction(t('admin.backups.confirmDelete', { name: backup.name }), { danger: true })))
        return;
    const [error] = await catchError(deleteBackup(backup.name));
    if (error) {
        notify.error(describeRequestError(error));
    }
    else {
        await load(true);
    }
}
function pickFile() {
    fileInput.value?.click();
}
async function upload(event) {
    const input = event.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file)
        return;
    uploadProgress.value = 0;
    try {
        const [error] = await catchError(uploadBackup(file, (fraction) => (uploadProgress.value = fraction)));
        if (error) {
            notify.error(describeRequestError(error));
        }
        else {
            notify.success(t('admin.backups.uploaded'));
            await load(true);
        }
    }
    finally {
        uploadProgress.value = null;
    }
}
function openRestore(backup) {
    restoreTarget.value = backup;
    restorePassphrase.value = '';
    restoreConfirmed.value = false;
}
async function restore() {
    const target = restoreTarget.value;
    if (!target || !restoreConfirmed.value)
        return;
    isRestoring.value = true;
    try {
        const [error] = await catchError(restoreBackup(target.name, restorePassphrase.value));
        if (error) {
            notify.error(describeRequestError(error));
        }
        else {
            notify.success(t('admin.backups.restoreStarted'));
            restoreTarget.value = null;
            await load(true);
            wasRunning = true;
            schedulePoll();
        }
    }
    finally {
        isRestoring.value = false;
    }
}
async function saveSchedule() {
    const [scheduleError] = await catchError(updateSetting('backups_schedule', schedule.value));
    if (scheduleError) {
        notify.error(describeRequestError(scheduleError));
        return;
    }
    const [keepError] = await catchError(updateSetting('backups_keep', Math.trunc(Number(keep.value))));
    if (keepError) {
        notify.error(describeRequestError(keepError));
        return;
    }
    notify.success(t('admin.backups.schedule.saved'));
    await load(true);
}
async function savePassphrase() {
    isSavingPassphrase.value = true;
    try {
        const [error] = await catchError(setBackupPassphrase(newPassphrase.value));
        if (error) {
            notify.error(describeRequestError(error));
        }
        else {
            newPassphrase.value = '';
            notify.success(t('admin.backups.encryption.saved'));
            await load(true);
        }
    }
    finally {
        isSavingPassphrase.value = false;
    }
}
async function removePassphrase() {
    if (!(await confirmAction(t('admin.backups.encryption.confirmRemove'), { danger: true })))
        return;
    const [error] = await catchError(clearBackupPassphrase());
    if (error) {
        notify.error(describeRequestError(error));
    }
    else {
        notify.success(t('admin.backups.encryption.removed'));
        await load(true);
    }
}
onMounted(async () => {
    await load();
    wasRunning = running.value;
    schedulePoll();
});
onBeforeUnmount(() => {
    unmounted = true;
    clearTimeout(timer);
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(ready, {});
    __VLS_withDotValue(uploadProgress, {});
    __VLS_withDotValue(running, {});
    __VLS_withDotValue(status, {});
    __VLS_withDotValue(loadError, {});
    __VLS_withDotValue(canRestore, {});
    __VLS_withDotValue(restoreTarget, {});
    __VLS_withDotValue(restoreConfirmed, {});
    __VLS_withDotValue(isRestoring, {});
    __VLS_withDotValue(scheduleDirty, {});
    __VLS_withDotValue(newPassphrase, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-col gap-6" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
    const __VLS_0 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('admin.backups.title')), description: (__VLS_unwrap(t, {})('admin.backups.description')),
    }));
    const __VLS_2 = __VLS_1({
        title: (__VLS_unwrap(t, {})('admin.backups.title')),
        description: (__VLS_unwrap(t, {})('admin.backups.description')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    {
        const { actions: __VLS_6 } = __VLS_nonNull(__VLS_3.slots);
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onChange: (upload) },
            ref: "fileInput",
            type: "file",
            accept: ".flxbak",
            ...{ class: "hidden" },
        });
        /** @type {__VLS_StyleScopedClasses['hidden']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (pickFile) },
            type: "button",
            ...{ class: (__VLS_unwrap(quietButtonClass, {})) },
            disabled: (!ready.value || __VLS_unwrap(busy, {})),
        });
        (uploadProgress.value === null ? __VLS_unwrap(t, {})('admin.backups.upload') : __VLS_unwrap(t, {})('admin.backups.uploading', { percent: Math.round(uploadProgress.value * 100) }));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (create) },
            type: "button",
            ...{ class: (__VLS_unwrap(buttonClass, {})) },
            disabled: (!ready.value || __VLS_unwrap(busy, {})),
        });
        (running.value && status.value?.run?.kind === 'backup' ? __VLS_unwrap(t, {})('admin.backups.creating') : __VLS_unwrap(t, {})('admin.backups.create'));
        // @ts-ignore
        [t, t, t, t, t, t, quietButtonClass, ready, ready, busy, busy, uploadProgress, uploadProgress, buttonClass, running, status,];
    }
    if (loadError.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            role: "alert",
            ...{ class: "rounded border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-red-400/30']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-red-500/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-200']} */ ;
        (loadError.value);
    }
    else if (!status.value) {
        const __VLS_7 = AdminSkeleton;
        // @ts-ignore
        const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
            // @ts-ignore
            variant: "table",
        }));
        const __VLS_9 = __VLS_8({
            variant: "table",
        }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    }
    else {
        let __VLS_12;
        /** @ts-ignore @type { | typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
        Transition;
        // @ts-ignore
        const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
            // @ts-ignore
            enterActiveClass: "transition duration-200 ease-out", enterFromClass: "opacity-0", leaveActiveClass: "transition duration-150 ease-in", leaveToClass: "opacity-0",
        }));
        const __VLS_14 = __VLS_13({
            enterActiveClass: "transition duration-200 ease-out",
            enterFromClass: "opacity-0",
            leaveActiveClass: "transition duration-150 ease-in",
            leaveToClass: "opacity-0",
        }, ...__VLS_functionalComponentArgsRest(__VLS_13));
        var __VLS_15;
        const { default: __VLS_17 } = __VLS_nonNull(__VLS_15.slots);
        if (status.value.run) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mb-4 rounded border px-3 py-2 text-sm" },
                ...{ class: (status.value.run.status === 'failed' ? 'border-red-500/40 bg-red-500/10' : status.value.run.status === 'running' ? 'border-flixer-accent/40 bg-flixer-accent/10' : 'border-emerald-500/30 bg-emerald-500/10') },
                'aria-live': (status.value.run.status === 'running' ? 'polite' : undefined),
            });
            /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            if (status.value.run.status === 'running') {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
                (__VLS_unwrap(t, {})(`admin.backups.run.running.${status.value.run.kind}`));
                (stepLabel(status.value.run.step));
            }
            else if (status.value.run.status === 'succeeded') {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
                (__VLS_unwrap(t, {})(status.value.run.kind === 'restore' ? 'admin.backups.run.restored' : 'admin.backups.run.created'));
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
                (__VLS_unwrap(t, {})(`admin.backups.run.failed.${status.value.run.kind}`, { error: status.value.run.error ?? '' }));
            }
            if (status.value.run.kind === 'restore' && status.value.run.status === 'succeeded') {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "mt-1 text-xs text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (__VLS_unwrap(t, {})('admin.backups.run.signInAgain'));
            }
        }
        // @ts-ignore
        [t, t, t, t, status, status, status, status, status, status, status, status, status, status, status, status, status, status, loadError, loadError,];
        if (!status.value.canRestore) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mb-4 rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200" },
            });
            /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-amber-500/30']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-amber-500/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-amber-200']} */ ;
            (__VLS_unwrap(t, {})('admin.backups.restoreUnavailable'));
        }
        if (!status.value.backups.length) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-sm text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.backups.empty'));
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
                ...{ class: "divide-y divide-flixer-border text-sm" },
            });
            /** @type {__VLS_StyleScopedClasses['divide-y']} */ ;
            /** @type {__VLS_StyleScopedClasses['divide-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            const __VLS_18 = __VLS_tryAsConstant((status.value.backups));
            for (const [backup] of __VLS_vFor(__VLS_nonNull(__VLS_18))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                    key: (backup.name),
                    ...{ class: "flex flex-wrap items-center justify-between gap-3 py-3" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "min-w-0" },
                });
                /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "font-medium" },
                });
                /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
                (formatTime(backup.createdAt));
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "mt-0.5 truncate font-mono text-xs text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-0.5']} */ ;
                /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (backup.name);
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "mt-1.5 flex flex-wrap items-center gap-1.5" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-1.5']} */ ;
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-1.5']} */ ;
                const __VLS_19 = StatusPill || StatusPill;
                // @ts-ignore
                const __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({
                    // @ts-ignore
                    tone: (backup.encrypted ? 'good' : 'warn'),
                }));
                const __VLS_21 = __VLS_20({
                    tone: (backup.encrypted ? 'good' : 'warn'),
                }, ...__VLS_functionalComponentArgsRest(__VLS_20));
                var __VLS_22;
                const { default: __VLS_24 } = __VLS_nonNull(__VLS_22.slots);
                (backup.encrypted ? __VLS_unwrap(t, {})('admin.backups.encrypted') : __VLS_unwrap(t, {})('admin.backups.notEncrypted'));
                // @ts-ignore
                [t, t, t, t, status, status, status,];
                const __VLS_25 = __VLS_tryAsConstant((backup.components));
                for (const [component] of __VLS_vFor(__VLS_nonNull(__VLS_25))) {
                    const __VLS_26 = StatusPill || StatusPill;
                    // @ts-ignore
                    const __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({
                        // @ts-ignore
                        key: (component),
                    }));
                    const __VLS_28 = __VLS_27({
                        key: (component),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_27));
                    var __VLS_29;
                    const { default: __VLS_31 } = __VLS_nonNull(__VLS_29.slots);
                    (componentLabel(component));
                    // @ts-ignore
                    [];
                    // @ts-ignore
                    [];
                }
                if (backup.versions.flixer) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "text-xs text-flixer-muted" },
                    });
                    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                    (backup.versions.flixer);
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "flex shrink-0 items-center gap-2" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "mr-2 text-xs text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (formatSize(backup.size));
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!!(loadError.value))
                                throw 0;
                            if (!!(!status.value))
                                throw 0;
                            if (!!(!status.value.backups.length))
                                throw 0;
                            return (download(backup));
                            // @ts-ignore
                            [];
                        } },
                    type: "button",
                    ...{ class: (__VLS_unwrap(quietButtonClass, {})) },
                });
                (__VLS_unwrap(t, {})('admin.backups.download'));
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!!(loadError.value))
                                throw 0;
                            if (!!(!status.value))
                                throw 0;
                            if (!!(!status.value.backups.length))
                                throw 0;
                            return (openRestore(backup));
                            // @ts-ignore
                            [t, quietButtonClass,];
                        } },
                    type: "button",
                    ...{ class: (__VLS_unwrap(quietButtonClass, {})) },
                    disabled: (!canRestore.value || __VLS_unwrap(busy, {})),
                    title: (canRestore.value ? undefined : __VLS_unwrap(t, {})('admin.backups.restoreUnavailable')),
                });
                (__VLS_unwrap(t, {})('admin.backups.restore'));
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!!(loadError.value))
                                throw 0;
                            if (!!(!status.value))
                                throw 0;
                            if (!!(!status.value.backups.length))
                                throw 0;
                            return (remove(backup));
                            // @ts-ignore
                            [t, t, quietButtonClass, busy, canRestore, canRestore,];
                        } },
                    type: "button",
                    ...{ class: (__VLS_unwrap(quietButtonClass, {})) },
                    disabled: (!ready.value || __VLS_unwrap(busy, {})),
                });
                (__VLS_unwrap(t, {})('admin.backups.delete'));
                // @ts-ignore
                [t, quietButtonClass, ready, busy,];
            }
        }
    }
    // @ts-ignore
    [];
    let __VLS_32;
    /** @ts-ignore @type { | typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
    Transition;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({
        // @ts-ignore
        enterActiveClass: "transition duration-200 ease-out", enterFromClass: "opacity-0", leaveActiveClass: "transition duration-150 ease-in", leaveToClass: "opacity-0",
    }));
    const __VLS_34 = __VLS_33({
        enterActiveClass: "transition duration-200 ease-out",
        enterFromClass: "opacity-0",
        leaveActiveClass: "transition duration-150 ease-in",
        leaveToClass: "opacity-0",
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    var __VLS_35;
    const { default: __VLS_37 } = __VLS_nonNull(__VLS_35.slots);
    if (restoreTarget.value) {
        const __VLS_38 = AdminSection || AdminSection;
        // @ts-ignore
        const __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38({
            // @ts-ignore
            title: (__VLS_unwrap(t, {})('admin.backups.restoreTitle')), description: (__VLS_unwrap(t, {})('admin.backups.restoreDescription', { time: formatTime(restoreTarget.value.createdAt) })),
        }));
        const __VLS_40 = __VLS_39({
            title: (__VLS_unwrap(t, {})('admin.backups.restoreTitle')),
            description: (__VLS_unwrap(t, {})('admin.backups.restoreDescription', { time: formatTime(restoreTarget.value.createdAt) })),
        }, ...__VLS_functionalComponentArgsRest(__VLS_39));
        var __VLS_41;
        const { default: __VLS_43 } = __VLS_nonNull(__VLS_41.slots);
        __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
            ...{ onSubmit: (restore) },
            ...{ class: "flex max-w-xl flex-col gap-4 text-sm" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['max-w-xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-red-500/40']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-red-500/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-200']} */ ;
        (__VLS_unwrap(t, {})('admin.backups.restoreWarning'));
        if (restoreTarget.value.encrypted) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex flex-col gap-1" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                for: "restore-passphrase",
            });
            (__VLS_unwrap(t, {})('admin.backups.restorePassphrase'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                id: "restore-passphrase",
                type: "password",
                autocomplete: "off",
                ...{ class: (__VLS_unwrap(inputClass, {})) },
            });
            (__VLS_unwrap(restorePassphrase, {}));
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.backups.restorePassphraseHelp'));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "flex items-start gap-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "checkbox",
            ...{ class: "mt-0.5" },
        });
        (restoreConfirmed.value);
        /** @type {__VLS_StyleScopedClasses['mt-0.5']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_unwrap(t, {})('admin.backups.restoreConfirm'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex gap-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            type: "submit",
            ...{ class: (__VLS_unwrap(dangerButtonClass, {})) },
            disabled: (!restoreConfirmed.value || isRestoring.value || !canRestore.value || __VLS_unwrap(busy, {})),
        });
        (__VLS_unwrap(t, {})('admin.backups.restoreNow'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!(restoreTarget.value))
                        throw 0;
                    return (restoreTarget.value = null);
                    // @ts-ignore
                    [t, t, t, t, t, t, t, busy, canRestore, restoreTarget, restoreTarget, restoreTarget, restoreTarget, inputClass, restorePassphrase, restoreConfirmed, restoreConfirmed, dangerButtonClass, isRestoring,];
                } },
            type: "button",
            ...{ class: (__VLS_unwrap(quietButtonClass, {})) },
        });
        (__VLS_unwrap(t, {})('admin.backups.cancel'));
        // @ts-ignore
        [t, quietButtonClass,];
    }
    // @ts-ignore
    [];
    const __VLS_44 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('admin.backups.schedule.title')), description: (__VLS_unwrap(t, {})('admin.backups.schedule.description')),
    }));
    const __VLS_46 = __VLS_45({
        title: (__VLS_unwrap(t, {})('admin.backups.schedule.title')),
        description: (__VLS_unwrap(t, {})('admin.backups.schedule.description')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_45));
    var __VLS_47;
    const { default: __VLS_49 } = __VLS_nonNull(__VLS_47.slots);
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (saveSchedule) },
        ...{ class: "flex max-w-xl flex-col gap-4 text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid gap-4 sm:grid-cols-2" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-col gap-1" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "backup-schedule",
    });
    (__VLS_unwrap(t, {})('admin.backups.schedule.frequency'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        id: "backup-schedule",
        value: (__VLS_unwrap(schedule, {})),
        ...{ class: (__VLS_unwrap(inputClass, {})) },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "off",
    });
    (__VLS_unwrap(t, {})('admin.backups.schedule.off'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "daily",
    });
    (__VLS_unwrap(t, {})('admin.backups.schedule.daily'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "weekly",
    });
    (__VLS_unwrap(t, {})('admin.backups.schedule.weekly'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-col gap-1" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "backup-keep",
    });
    (__VLS_unwrap(t, {})('admin.backups.schedule.keep'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        id: "backup-keep",
        type: "number",
        min: "1",
        max: "60",
        step: "1",
        ...{ class: (__VLS_unwrap(inputClass, {})) },
    });
    (__VLS_unwrap(keep, {}));
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('admin.backups.schedule.help', { time: formatTime(status.value?.lastScheduledAt ?? null) }));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        type: "submit",
        ...{ class: (__VLS_unwrap(buttonClass, {})) },
        disabled: (!scheduleDirty.value),
    });
    (__VLS_unwrap(t, {})('admin.backups.schedule.save'));
    // @ts-ignore
    [t, t, t, t, t, t, t, t, t, buttonClass, status, inputClass, inputClass, schedule, keep, scheduleDirty,];
    const __VLS_50 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('admin.backups.encryption.title')), description: (__VLS_unwrap(t, {})('admin.backups.encryption.description')),
    }));
    const __VLS_52 = __VLS_51({
        title: (__VLS_unwrap(t, {})('admin.backups.encryption.title')),
        description: (__VLS_unwrap(t, {})('admin.backups.encryption.description')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_51));
    var __VLS_53;
    const { default: __VLS_55 } = __VLS_nonNull(__VLS_53.slots);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex max-w-xl flex-col gap-4 text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-center gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    const __VLS_56 = StatusPill || StatusPill;
    // @ts-ignore
    const __VLS_57 = __VLS_asFunctionalComponent1(__VLS_56, new __VLS_56({
        // @ts-ignore
        tone: (status.value?.passphraseSet ? 'good' : 'warn'),
    }));
    const __VLS_58 = __VLS_57({
        tone: (status.value?.passphraseSet ? 'good' : 'warn'),
    }, ...__VLS_functionalComponentArgsRest(__VLS_57));
    var __VLS_59;
    const { default: __VLS_61 } = __VLS_nonNull(__VLS_59.slots);
    (status.value?.passphraseSet ? __VLS_unwrap(t, {})('admin.backups.encryption.on') : __VLS_unwrap(t, {})('admin.backups.encryption.off'));
    // @ts-ignore
    [t, t, t, t, status, status,];
    if (status.value && !status.value.passphraseSet) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-amber-500/30']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-amber-500/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-amber-200']} */ ;
        (__VLS_unwrap(t, {})('admin.backups.encryption.offWarning'));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (savePassphrase) },
        ...{ class: "flex flex-col gap-1" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "backup-passphrase",
    });
    (status.value?.passphraseSet ? __VLS_unwrap(t, {})('admin.backups.encryption.change') : __VLS_unwrap(t, {})('admin.backups.encryption.set'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        id: "backup-passphrase",
        type: "password",
        autocomplete: "new-password",
        minlength: "8",
        maxlength: "256",
        disabled: (!ready.value),
        ...{ class: (__VLS_unwrap(inputClass, {})) },
    });
    (newPassphrase.value);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        type: "submit",
        ...{ class: (__VLS_unwrap(buttonClass, {})) },
        ...{ class: "shrink-0" },
        disabled: (!ready.value || newPassphrase.value.length < 8 || __VLS_unwrap(isSavingPassphrase, {})),
    });
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    (__VLS_unwrap(t, {})('admin.backups.encryption.save'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "text-xs text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('admin.backups.encryption.help'));
    if (status.value?.passphraseSet) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (removePassphrase) },
            type: "button",
            ...{ class: (__VLS_unwrap(quietButtonClass, {})) },
            disabled: (!ready.value),
        });
        (__VLS_unwrap(t, {})('admin.backups.encryption.remove'));
    }
    // @ts-ignore
    [t, t, t, t, t, t, quietButtonClass, ready, ready, ready, buttonClass, status, status, status, status, inputClass, newPassphrase, newPassphrase, isSavingPassphrase,];
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
