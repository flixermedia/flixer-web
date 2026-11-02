import { openModal } from '@kolirt/vue-modal';
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { applyStep, describeFailure, getProgress, testStep } from '../../setup/setupApi';
import { getDatabaseTransferStatus, restoreDatabaseSourceWrites, startDatabaseTransfer } from '../../api/admin';
import DatabaseTransferConfirmModal from './DatabaseTransferConfirmModal.vue';
import AdminSection from './AdminSection.vue';
import { catchError } from '../../utils/catchError';
const { t } = useI18n();
const targets = [
    { id: 'database', entries: [{ field: 'databaseUrl', label: 'admin.connections.databaseUrl', placeholder: 'postgres://user@host:5432/flixer', prefill: false }] },
    { id: 'redis', entries: [{ field: 'redisUrl', label: 'admin.connections.redisUrl', placeholder: 'redis://host:6379', prefill: false }] },
    {
        id: 'services',
        entries: [
            { field: 'indexerUrl', label: 'admin.connections.indexerUrl', placeholder: 'http://localhost:8092', prefill: true },
            { field: 'streamerInternalUrl', label: 'admin.connections.streamerInternalUrl', placeholder: 'http://localhost:8091', prefill: true },
        ],
    },
];
const config = ref({});
const values = reactive({ databaseUrl: '', redisUrl: '', indexerUrl: '', streamerInternalUrl: '' });
const busy = ref(null);
const results = reactive({ database: null, redis: null, services: null });
const transfer = ref(null);
let transferTimer;
const inputClass = 'mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 font-mono text-sm text-flixer-text disabled:opacity-60';
const button = 'rounded border border-flixer-border px-4 py-1.5 text-xs font-semibold transition hover:border-flixer-accent/60 disabled:opacity-60';
const primary = 'rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60';
async function load() {
    const [error, progress] = await catchError(getProgress());
    if (error) {
        config.value = {};
    }
    else {
        config.value = progress.config;
    }
    for (const { entries } of targets) {
        for (const entry of entries) {
            if (entry.prefill)
                values[entry.field] = config.value[entry.field]?.value ?? config.value[entry.field]?.default ?? '';
        }
    }
}
onMounted(load);
onMounted(() => void refreshTransfer());
onBeforeUnmount(() => clearTimeout(transferTimer));
async function refreshTransfer() {
    const [error, status] = await catchError(getDatabaseTransferStatus());
    if (error) {
        results.database = { ok: false, text: describeFailure(error, t('admin.connections.transferFailed')).message };
        return;
    }
    transfer.value = status;
    clearTimeout(transferTimer);
    if (status.state === 'running')
        transferTimer = setTimeout(() => void refreshTransfer(), 2000);
}
function locked(target) {
    return target.entries.some((entry) => config.value[entry.field]?.locked);
}
function hint(entry) {
    const info = config.value[entry.field];
    if (info?.locked)
        return t('admin.connections.environment');
    return info?.set ? t('admin.connections.configured') : t('admin.connections.notConfigured');
}
function ready(target) {
    return target.entries.every((entry) => values[entry.field].trim() !== '');
}
function body(target, entries) {
    const fields = Object.fromEntries(entries.map((entry) => [entry.field, values[entry.field].trim()]));
    // The services step saves all three addresses, so the public streamer address is sent back unchanged.
    return target === 'services' ? { ...fields, streamerPublicUrl: config.value.streamerPublicUrl?.value ?? '' } : fields;
}
async function run(target, save) {
    busy.value = target.id;
    results[target.id] = null;
    try {
        const payload = body(target.id, target.entries);
        const [testError, tested] = await catchError(testStep(target.id, payload));
        if (testError) {
            const failure = describeFailure(testError, t('admin.connections.failed'));
            results[target.id] = { ok: false, text: target.entries.map((entry) => failure.fields[entry.field]).find(Boolean) || failure.message };
            return;
        }
        if (!tested.ok) {
            results[target.id] = { ok: false, text: tested.message || t('setup.connectionFailed') };
            return;
        }
        if (!save) {
            results[target.id] = { ok: true, text: t('setup.connectionOk') };
            return;
        }
        const [applyError, applied] = await catchError(applyStep(target.id, payload));
        if (applyError) {
            const failure = describeFailure(applyError, t('admin.connections.failed'));
            results[target.id] = { ok: false, text: target.entries.map((entry) => failure.fields[entry.field]).find(Boolean) || failure.message };
            return;
        }
        results[target.id] = { ok: true, text: applied.restart?.length ? t('admin.connections.saved', { services: applied.restart.join(', ') }) : t('admin.connections.savedNow') };
        for (const entry of target.entries)
            if (!entry.prefill)
                values[entry.field] = '';
        await load();
    }
    finally {
        busy.value = null;
    }
}
async function transferDatabase() {
    if (!values.databaseUrl.trim())
        return;
    const replaceTarget = await openModal(DatabaseTransferConfirmModal).catch(() => null);
    if (replaceTarget === null)
        return;
    busy.value = 'database';
    results.database = null;
    try {
        const [error, status] = await catchError(startDatabaseTransfer(values.databaseUrl.trim(), replaceTarget));
        if (error) {
            results.database = { ok: false, text: describeFailure(error, t('admin.connections.transferFailed')).message };
            return;
        }
        transfer.value = status;
        if (status.state === 'running')
            transferTimer = setTimeout(() => void refreshTransfer(), 2000);
    }
    finally {
        busy.value = null;
    }
}
async function restoreWrites() {
    busy.value = 'database';
    results.database = null;
    try {
        const [error, status] = await catchError(restoreDatabaseSourceWrites());
        if (error) {
            results.database = { ok: false, text: describeFailure(error, t('admin.connections.transferFailed')).message };
            return;
        }
        transfer.value = status;
    }
    finally {
        busy.value = null;
    }
}
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(values, {});
    __VLS_withDotValue(transfer, {});
    __VLS_withDotValue(busy, {});
    __VLS_withDotValue(results, {});
    const __VLS_0 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('admin.connections.title')), description: (__VLS_unwrap(t, {})('admin.connections.description')),
    }));
    const __VLS_2 = __VLS_1({
        title: (__VLS_unwrap(t, {})('admin.connections.title')),
        description: (__VLS_unwrap(t, {})('admin.connections.description')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid gap-6" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
    const __VLS_6 = __VLS_tryAsConstant((__VLS_unwrap(targets, {})));
    for (const [target] of __VLS_vFor(__VLS_nonNull(__VLS_6))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (target.id),
        });
        const __VLS_7 = __VLS_tryAsConstant((target.entries));
        for (const [entry] of __VLS_vFor(__VLS_nonNull(__VLS_7))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                key: (entry.field),
                ...{ class: "mt-2 block text-xs text-flixer-muted first:mt-0" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['block']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            /** @type {__VLS_StyleScopedClasses['first:mt-0']} */ ;
            (__VLS_unwrap(t, {})(entry.label));
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                value: (values.value[entry.field]),
                type: "text",
                autocomplete: "off",
                spellcheck: "false",
                placeholder: (entry.field === 'databaseUrl' ? (transfer.value?.currentDatabaseUrl ?? entry.placeholder) : entry.placeholder),
                disabled: (locked(target) || busy.value !== null),
                ...{ class: (__VLS_unwrap(inputClass, {})) },
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "mt-1 block" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['block']} */ ;
            (hint(entry));
            // @ts-ignore
            [t, t, t, targets, values, transfer, busy, inputClass,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-2 flex flex-wrap items-center gap-2" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    return (run(target, false));
                    // @ts-ignore
                    [];
                } },
            type: "button",
            ...{ class: (__VLS_unwrap(button, {})) },
            disabled: (!ready(target) || locked(target) || busy.value !== null),
        });
        (__VLS_unwrap(t, {})('admin.connections.test'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    return (run(target, true));
                    // @ts-ignore
                    [t, busy, button,];
                } },
            type: "button",
            ...{ class: (__VLS_unwrap(primary, {})) },
            disabled: (!ready(target) || locked(target) || busy.value !== null || (target.id === 'database' && (transfer.value?.sourceLocked || ['running', 'interrupted', 'completed'].includes(transfer.value?.state ?? 'idle')))),
        });
        (__VLS_unwrap(t, {})('admin.connections.save'));
        if (results.value[target.id]) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-xs" },
                ...{ class: (results.value[target.id].ok ? 'text-emerald-300' : 'text-red-300') },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            (results.value[target.id].text);
        }
        if (target.id === 'database') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mt-4 rounded border border-flixer-border bg-flixer-background/60 p-4" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-background/60']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-sm font-semibold text-flixer-text" },
            });
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
            (__VLS_unwrap(t, {})('admin.connections.transferTitle'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mt-1 text-xs leading-5 text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['leading-5']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.connections.transferDescription'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (transferDatabase) },
                type: "button",
                ...{ class: (__VLS_unwrap(primary, {})) },
                ...{ class: "mt-3" },
                disabled: (!values.value.databaseUrl.trim() || locked(target) || busy.value !== null || transfer.value?.sourceLocked || ['running', 'interrupted', 'completed'].includes(transfer.value?.state ?? 'idle')),
            });
            /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
            (transfer.value?.state === 'running' ? __VLS_unwrap(t, {})('admin.connections.transferring') : __VLS_unwrap(t, {})('admin.connections.transfer'));
            if (transfer.value && transfer.value.state !== 'idle') {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "mt-3 rounded bg-white/5 p-3 text-xs" },
                    'aria-live': "polite",
                });
                /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-white/5']} */ ;
                /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "font-semibold text-flixer-text" },
                });
                /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
                (transfer.value.phase);
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "mt-1 text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (transfer.value.message);
                if (transfer.value.sourceLocked && transfer.value.state !== 'completed') {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (restoreWrites) },
                        type: "button",
                        ...{ class: (__VLS_unwrap(button, {})) },
                        ...{ class: "mt-3" },
                        disabled: (busy.value !== null),
                    });
                    /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
                    (__VLS_unwrap(t, {})('admin.connections.restoreWrites'));
                }
            }
        }
        // @ts-ignore
        [t, t, t, t, t, t, values, transfer, transfer, transfer, transfer, transfer, transfer, transfer, transfer, transfer, transfer, transfer, busy, busy, busy, button, primary, primary, results, results, results,];
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
