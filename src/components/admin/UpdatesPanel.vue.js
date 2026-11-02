import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { applyUpdates, getUpdateStatus, listSettings, updateSetting } from '../../api';
import { notify } from '../../composables/notify';
import { describeRequestError } from '../../composables/useProfile';
import { catchError } from '../../utils/catchError';
import AdminSection from './AdminSection.vue';
import AdminToggle from './AdminToggle.vue';
import StatusPill from './StatusPill.vue';
import { confirmAction } from '../../composables/confirm';
const POLL_MS = 4000;
const { t, locale } = useI18n();
const status = ref(null);
const isChecking = ref(false);
const isApplying = ref(false);
const checkEnabled = ref(true);
const autoUpdate = ref(false);
const updaterUrl = ref('');
const savedUrl = ref('');
let timer;
let unmounted = false;
const running = computed(() => status.value?.run?.status === 'running');
const canUpdate = computed(() => Boolean(status.value?.canApply) && (status.value?.updatesAvailable ?? 0) > 0 && !running.value && !isApplying.value);
const inputClass = 'w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm outline-none transition focus:border-flixer-accent';
const buttonClass = 'rounded bg-flixer-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60';
function tone(component) {
    if (!component.reachable)
        return 'bad';
    return component.updateAvailable ? 'warn' : 'good';
}
function label(component) {
    if (!component.reachable)
        return t('admin.updates.unreachable');
    if (!component.latest)
        return t('admin.updates.unknown');
    return component.updateAvailable ? t('admin.updates.available') : t('admin.updates.upToDate');
}
function formatTime(iso) {
    return iso ? new Date(iso).toLocaleString(locale.value, { dateStyle: 'medium', timeStyle: 'short' }) : t('admin.updates.never');
}
function formatSize(bytes) {
    return bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
// While an update runs the API restarts, so polling must keep going through failed requests.
function schedulePoll() {
    clearTimeout(timer);
    if (unmounted || !running.value)
        return;
    timer = setTimeout(async () => {
        await load(false, true);
        schedulePoll();
    }, POLL_MS);
}
async function load(refresh = false, quiet = false) {
    const [error, result] = await catchError(getUpdateStatus(refresh));
    if (error) {
        if (!quiet)
            notify.error(describeRequestError(error));
    }
    else {
        status.value = result;
    }
}
async function check() {
    isChecking.value = true;
    await load(true);
    isChecking.value = false;
    if (status.value?.updatesAvailable === 0)
        notify.success(t('admin.updates.allCurrent'));
}
async function updateAll() {
    if (!(await confirmAction(t('admin.updates.confirm'), {})))
        return;
    isApplying.value = true;
    try {
        const [error] = await catchError(applyUpdates());
        if (error) {
            notify.error(describeRequestError(error));
        }
        else {
            notify.success(t('admin.updates.started'));
            await load(false, true);
            schedulePoll();
        }
    }
    finally {
        isApplying.value = false;
    }
}
async function save(key, value, revert) {
    const [error] = await catchError(updateSetting(key, value));
    if (error) {
        revert();
        notify.error(describeRequestError(error));
    }
}
function setCheck(value) {
    const previous = checkEnabled.value;
    checkEnabled.value = value;
    void save('updates_check_enabled', value, () => (checkEnabled.value = previous));
}
function setAuto(value) {
    const previous = autoUpdate.value;
    autoUpdate.value = value;
    void save('updates_auto_update', value, () => (autoUpdate.value = previous));
}
async function saveUrl() {
    const [error] = await catchError(updateSetting('updates_updater_url', updaterUrl.value.trim()));
    if (error) {
        notify.error(describeRequestError(error));
    }
    else {
        savedUrl.value = updaterUrl.value.trim();
        notify.success(t('admin.updates.settings.save'));
    }
}
onMounted(async () => {
    await load(false);
    schedulePoll();
    const [error, settings] = await catchError(listSettings());
    if (error) {
        notify.error(describeRequestError(error));
    }
    else {
        const value = (key) => settings.find((setting) => setting.key === key)?.value;
        checkEnabled.value = value('updates_check_enabled') !== false;
        autoUpdate.value = value('updates_auto_update') === true;
        const url = value('updates_updater_url');
        updaterUrl.value = savedUrl.value = typeof url === 'string' ? url : '';
    }
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
    __VLS_withDotValue(isChecking, {});
    __VLS_withDotValue(canUpdate, {});
    __VLS_withDotValue(running, {});
    __VLS_withDotValue(isApplying, {});
    __VLS_withDotValue(status, {});
    __VLS_withDotValue(updaterUrl, {});
    __VLS_withDotValue(savedUrl, {});
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
        title: (__VLS_unwrap(t, {})('admin.updates.title')), description: (__VLS_unwrap(t, {})('admin.updates.description')),
    }));
    const __VLS_2 = __VLS_1({
        title: (__VLS_unwrap(t, {})('admin.updates.title')),
        description: (__VLS_unwrap(t, {})('admin.updates.description')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    {
        const { actions: __VLS_6 } = __VLS_nonNull(__VLS_3.slots);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (check) },
            type: "button",
            ...{ class: "rounded bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/15 disabled:opacity-60" },
            disabled: (isChecking.value || running.value),
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
        (isChecking.value ? __VLS_unwrap(t, {})('admin.updates.checking') : __VLS_unwrap(t, {})('admin.updates.check'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (updateAll) },
            type: "button",
            ...{ class: (__VLS_unwrap(buttonClass, {})) },
            disabled: (!canUpdate.value),
        });
        (running.value || isApplying.value ? __VLS_unwrap(t, {})('admin.updates.updating') : __VLS_unwrap(t, {})('admin.updates.updateAll'));
        // @ts-ignore
        [t, t, t, t, t, t, isChecking, isChecking, running, running, buttonClass, canUpdate, isApplying,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "overflow-x-auto" },
    });
    /** @type {__VLS_StyleScopedClasses['overflow-x-auto']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "w-full text-left text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({
        ...{ class: "text-xs uppercase tracking-wide text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "py-2 pr-4 font-medium" },
    });
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['pr-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    (__VLS_unwrap(t, {})('admin.updates.component'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "py-2 pr-4 font-medium" },
    });
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['pr-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    (__VLS_unwrap(t, {})('admin.updates.installed'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "py-2 pr-4 font-medium" },
    });
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['pr-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    (__VLS_unwrap(t, {})('admin.updates.latest'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "py-2 font-medium" },
    });
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({
        ...{ class: "divide-y divide-flixer-border" },
    });
    /** @type {__VLS_StyleScopedClasses['divide-y']} */ ;
    /** @type {__VLS_StyleScopedClasses['divide-flixer-border']} */ ;
    const __VLS_7 = __VLS_tryAsConstant((status.value?.components ?? []));
    for (const [component] of __VLS_vFor(__VLS_nonNull(__VLS_7))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (component.id),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "py-2.5 pr-4 font-medium" },
        });
        /** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['pr-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        (component.label);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "py-2.5 pr-4 font-mono text-xs" },
        });
        /** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['pr-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        (component.installed ?? '—');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "py-2.5 pr-4 font-mono text-xs" },
        });
        /** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['pr-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        (component.latest ?? '—');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "py-2.5 text-right" },
        });
        /** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        const __VLS_8 = StatusPill || StatusPill;
        // @ts-ignore
        const __VLS_9 = __VLS_asFunctionalComponent1(__VLS_8, new __VLS_8({
            // @ts-ignore
            tone: (tone(component)),
        }));
        const __VLS_10 = __VLS_9({
            tone: (tone(component)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_9));
        var __VLS_11;
        const { default: __VLS_13 } = __VLS_nonNull(__VLS_11.slots);
        (label(component));
        // @ts-ignore
        [t, t, t, status,];
        // @ts-ignore
        [];
    }
    if (status.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-3 text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.updates.lastChecked', { time: formatTime(status.value.lastCheckedAt) }));
    }
    if (status.value && !status.value.canApply) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-3 rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-amber-500/30']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-amber-500/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-amber-200']} */ ;
        (__VLS_unwrap(t, {})('admin.updates.notConfigured'));
    }
    else if (status.value && !status.value.updaterReachable) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-3 rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-amber-500/30']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-amber-500/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-amber-200']} */ ;
        (__VLS_unwrap(t, {})('admin.updates.unreachable'));
    }
    if (status.value?.run) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-4 rounded border px-3 py-2 text-sm" },
            ...{ class: (status.value.run.status === 'failed' || status.value.run.status === 'rollback_failed' ? 'border-red-500/40 bg-red-500/10' : status.value.run.status === 'rolled_back' ? 'border-amber-500/40 bg-amber-500/10' : status.value.run.status === 'running' ? 'border-flixer-accent/40 bg-flixer-accent/10' : 'border-emerald-500/30 bg-emerald-500/10') },
        });
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        if (status.value.run.status === 'running') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            (__VLS_unwrap(t, {})('admin.updates.run.running'));
            (__VLS_unwrap(t, {})(`admin.updates.run.steps.${status.value.run.step.split(':')[0]}`, { component: status.value.run.step.split(':')[1] ?? '' }));
        }
        else if (status.value.run.status === 'succeeded') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            (__VLS_unwrap(t, {})('admin.updates.run.succeeded'));
        }
        else if (status.value.run.status === 'rolled_back') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            (__VLS_unwrap(t, {})('admin.updates.run.rolledBack', { error: status.value.run.error ?? '' }));
        }
        else if (status.value.run.status === 'rollback_failed') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            (__VLS_unwrap(t, {})('admin.updates.run.rollbackFailed', { error: status.value.run.error ?? '' }));
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            (__VLS_unwrap(t, {})('admin.updates.run.failed', { error: status.value.run.error ?? '' }));
        }
        if (status.value.run.backup) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mt-1 text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.updates.run.backup', { name: status.value.run.backup }));
        }
    }
    // @ts-ignore
    [t, t, t, t, t, t, t, t, t, t, status, status, status, status, status, status, status, status, status, status, status, status, status, status, status, status, status, status, status, status, status, status,];
    const __VLS_14 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('admin.updates.settings.title')),
    }));
    const __VLS_16 = __VLS_15({
        title: (__VLS_unwrap(t, {})('admin.updates.settings.title')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_15));
    var __VLS_17;
    const { default: __VLS_19 } = __VLS_nonNull(__VLS_17.slots);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex max-w-xl flex-col gap-4" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-col divide-y divide-flixer-border" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['divide-y']} */ ;
    /** @type {__VLS_StyleScopedClasses['divide-flixer-border']} */ ;
    const __VLS_20 = AdminToggle;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
        // @ts-ignore
        ...{ 'onUpdate:modelValue': {} }, modelValue: (__VLS_unwrap(checkEnabled, {})), label: (__VLS_unwrap(t, {})('admin.updates.settings.check')), description: (__VLS_unwrap(t, {})('admin.updates.settings.checkHelp')),
    }));
    const __VLS_22 = __VLS_21({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (__VLS_unwrap(checkEnabled, {})),
        label: (__VLS_unwrap(t, {})('admin.updates.settings.check')),
        description: (__VLS_unwrap(t, {})('admin.updates.settings.checkHelp')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    let __VLS_25;
    const __VLS_26 = {
        /** @type {typeof __VLS_25.'update:modelValue'} */
        'onUpdate:modelValue': (setCheck),
    };
    void __VLS_26;
    var __VLS_23;
    var __VLS_24;
    const __VLS_27 = AdminToggle;
    // @ts-ignore
    const __VLS_28 = __VLS_asFunctionalComponent1(__VLS_27, new __VLS_27({
        // @ts-ignore
        ...{ 'onUpdate:modelValue': {} }, modelValue: (__VLS_unwrap(autoUpdate, {})), label: (__VLS_unwrap(t, {})('admin.updates.settings.auto')), description: (__VLS_unwrap(t, {})('admin.updates.settings.autoHelp')),
    }));
    const __VLS_29 = __VLS_28({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (__VLS_unwrap(autoUpdate, {})),
        label: (__VLS_unwrap(t, {})('admin.updates.settings.auto')),
        description: (__VLS_unwrap(t, {})('admin.updates.settings.autoHelp')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_28));
    let __VLS_32;
    const __VLS_33 = {
        /** @type {typeof __VLS_32.'update:modelValue'} */
        'onUpdate:modelValue': (setAuto),
    };
    void __VLS_33;
    var __VLS_30;
    var __VLS_31;
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (saveUrl) },
        ...{ class: "flex flex-col gap-1 text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "updater-url",
    });
    (__VLS_unwrap(t, {})('admin.updates.settings.url'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        id: "updater-url",
        placeholder: "http://updater:8093",
        ...{ class: (__VLS_unwrap(inputClass, {})) },
    });
    (updaterUrl.value);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        type: "submit",
        ...{ class: (__VLS_unwrap(buttonClass, {})) },
        ...{ class: "shrink-0" },
        disabled: (updaterUrl.value.trim() === savedUrl.value),
    });
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    (__VLS_unwrap(t, {})('admin.updates.settings.save'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "text-xs text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('admin.updates.settings.urlHelp'));
    // @ts-ignore
    [t, t, t, t, t, t, t, t, buttonClass, checkEnabled, autoUpdate, inputClass, updaterUrl, updaterUrl, savedUrl,];
    const __VLS_34 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_35 = __VLS_asFunctionalComponent1(__VLS_34, new __VLS_34({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('admin.updates.backups.title')), description: (__VLS_unwrap(t, {})('admin.updates.backups.help')),
    }));
    const __VLS_36 = __VLS_35({
        title: (__VLS_unwrap(t, {})('admin.updates.backups.title')),
        description: (__VLS_unwrap(t, {})('admin.updates.backups.help')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_35));
    var __VLS_37;
    const { default: __VLS_39 } = __VLS_nonNull(__VLS_37.slots);
    if (!status.value?.backups.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.updates.backups.empty'));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
            ...{ class: "divide-y divide-flixer-border text-sm" },
        });
        /** @type {__VLS_StyleScopedClasses['divide-y']} */ ;
        /** @type {__VLS_StyleScopedClasses['divide-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        const __VLS_40 = __VLS_tryAsConstant((status.value.backups));
        for (const [backup] of __VLS_vFor(__VLS_nonNull(__VLS_40))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                key: (backup.name),
                ...{ class: "flex items-center justify-between gap-3 py-2" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "truncate font-mono text-xs" },
            });
            /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            (backup.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "shrink-0 text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (formatSize(backup.sizeBytes));
            (formatTime(backup.createdAt));
            // @ts-ignore
            [t, t, t, status, status,];
        }
    }
    // @ts-ignore
    [];
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
