import { openModal } from '@kolirt/vue-modal';
import { onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AdminSkeleton from './AdminSkeleton.vue';
import { deleteMediaLibrary, getIndexerStatus, listMediaLibraries, queueLibrarySegments, scanMediaLibrary, syncLibraryThemes } from '../../api';
import { confirmAction } from '../../composables/confirm';
import { notify } from '../../composables/notify';
import { useLiveTopic } from '../../composables/useLive';
import { describeRequestError } from '../../composables/useProfile';
import { catchError } from '../../utils/catchError';
import AdminSection from './AdminSection.vue';
import LibraryModal from './LibraryModal.vue';
import LibraryRescanModal from './LibraryRescanModal.vue';
import NetworkSharesSection from './NetworkSharesSection.vue';
import StatusPill from './StatusPill.vue';
const { t } = useI18n();
const libraries = ref([]);
const loading = ref(true);
const error = ref('');
const deletingId = ref(null);
const scans = ref({});
const indexerReachable = ref(true);
const scanningId = ref(null);
function isRunning(scan) {
    return scan?.state === 'scanning' || scan?.state === 'indexing';
}
function applyStatus(status) {
    indexerReachable.value = status.reachable;
    scans.value = Object.fromEntries(status.scans.map((scan) => [scan.libraryId, scan]));
}
async function pollScans() {
    const [error, status] = await catchError(getIndexerStatus());
    if (error) {
        indexerReachable.value = false;
    }
    else {
        applyStatus(status);
    }
}
async function scan(library, force, trickplayOnly = false) {
    scanningId.value = library.id;
    try {
        const [error] = await catchError(scanMediaLibrary(library.id, force, trickplayOnly));
        if (error) {
            notify.error(describeRequestError(error, t('admin.libraries.scanError')));
        }
        else {
            notify.success(t(trickplayOnly ? 'admin.libraries.trickplayStarted' : 'admin.libraries.scanStarted'));
            await pollScans();
        }
    }
    finally {
        scanningId.value = null;
    }
}
function scanLabel(scan) {
    return t(`admin.libraries.scanState.${scan.state}`, { done: scan.done, discovered: scan.discovered });
}
function scanPercent(scan) {
    if (scan.state === 'complete')
        return 100;
    return scan.discovered > 0 ? Math.min(100, Math.round(((scan.done + scan.failed) / scan.discovered) * 100)) : 0;
}
async function load() {
    try {
        const [requestError, result] = await catchError(listMediaLibraries());
        if (requestError) {
            error.value = describeRequestError(requestError, t('admin.libraries.loadError'));
        }
        else {
            libraries.value = result;
            error.value = '';
        }
    }
    finally {
        loading.value = false;
    }
}
async function openForm(library) {
    const saved = await openModal(LibraryModal, { props: { library: library ?? undefined } }).catch(() => false);
    if (saved)
        await load();
}
async function openRescan(library) {
    const selected = await openModal(LibraryRescanModal, { props: { library } }).catch(() => []);
    if (!selected.length)
        return;
    if (selected.includes('full')) {
        await scan(library, true);
        return;
    }
    scanningId.value = library.id;
    try {
        const jobs = selected.filter((job) => ['images', 'descriptions', 'fileData', 'lyrics'].includes(job));
        const actions = [];
        if (jobs.length > 0)
            actions.push(() => scanMediaLibrary(library.id, false, false, jobs));
        if (selected.includes('trickplay'))
            actions.push(() => scanMediaLibrary(library.id, false, true));
        if (selected.includes('themes'))
            actions.push(() => syncLibraryThemes(library.id));
        if (selected.includes('movieSegments'))
            actions.push(() => queueLibrarySegments(library.id, 'movie'));
        if (selected.includes('tvSegments'))
            actions.push(() => queueLibrarySegments(library.id, 'episode'));
        const results = await Promise.all(actions.map((action) => catchError(action())));
        const failures = results.filter(([requestError]) => requestError);
        for (const [requestError] of failures) {
            if (requestError)
                notify.error(describeRequestError(requestError, t('admin.libraries.rescanError')));
        }
        if (failures.length < actions.length) {
            notify.success(t('admin.libraries.rescanQueued', { count: actions.length - failures.length }));
            await pollScans();
        }
    }
    finally {
        scanningId.value = null;
    }
}
async function remove(library) {
    if (!(await confirmAction(t('admin.libraries.confirmDelete', { name: library.name }), { danger: true })))
        return;
    deletingId.value = library.id;
    try {
        const [error] = await catchError(deleteMediaLibrary(library.id));
        if (error) {
            notify.error(describeRequestError(error, t('admin.libraries.deleteError')));
        }
        else {
            notify.success(t('admin.libraries.deleted'));
        }
    }
    finally {
        deletingId.value = null;
        await load();
    }
}
onMounted(() => {
    void load();
    void pollScans();
});
const live = useLiveTopic('indexer');
watch(live.data, (status) => {
    if (status)
        applyStatus(status);
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(error, {});
    __VLS_withDotValue(indexerReachable, {});
    __VLS_withDotValue(loading, {});
    __VLS_withDotValue(libraries, {});
    __VLS_withDotValue(scanningId, {});
    __VLS_withDotValue(scans, {});
    __VLS_withDotValue(deletingId, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-col gap-6" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
    const __VLS_0 = NetworkSharesSection;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        ...{ 'onChanged': {} },
    }));
    const __VLS_2 = __VLS_1({
        ...{ 'onChanged': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    let __VLS_5;
    const __VLS_6 = {
        /** @type {typeof __VLS_5.changed} */
        onChanged: (load),
    };
    void __VLS_6;
    var __VLS_3;
    var __VLS_4;
    const __VLS_7 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('admin.libraries.title')), description: (__VLS_unwrap(t, {})('admin.libraries.description')),
    }));
    const __VLS_9 = __VLS_8({
        title: (__VLS_unwrap(t, {})('admin.libraries.title')),
        description: (__VLS_unwrap(t, {})('admin.libraries.description')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    var __VLS_10;
    const { default: __VLS_12 } = __VLS_nonNull(__VLS_10.slots);
    {
        const { actions: __VLS_13 } = __VLS_nonNull(__VLS_10.slots);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    return (openForm(null));
                    // @ts-ignore
                    [t, t,];
                } },
            type: "button",
            ...{ class: "rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80" },
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
        (__VLS_unwrap(t, {})('admin.libraries.addLibrary'));
        // @ts-ignore
        [t,];
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
    if (!indexerReachable.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mb-3 text-sm text-amber-300" },
        });
        /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-amber-300']} */ ;
        (__VLS_unwrap(t, {})('admin.libraries.indexerOffline'));
    }
    if (loading.value && libraries.value.length === 0) {
        const __VLS_14 = AdminSkeleton;
        // @ts-ignore
        const __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14({
            // @ts-ignore
            variant: "cards",
        }));
        const __VLS_16 = __VLS_15({
            variant: "cards",
        }, ...__VLS_functionalComponentArgsRest(__VLS_15));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
            ...{ class: "flex flex-col gap-3" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        const __VLS_19 = __VLS_tryAsConstant((libraries.value));
        for (const [lib] of __VLS_vFor(__VLS_nonNull(__VLS_19))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                key: (lib.id),
                ...{ class: "rounded border border-flixer-border bg-flixer-background/60 p-4" },
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-background/60']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex flex-wrap items-start justify-between gap-3" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-sm font-semibold" },
            });
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            (lib.name);
            const __VLS_20 = StatusPill || StatusPill;
            // @ts-ignore
            const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
                // @ts-ignore
                tone: "accent", ...{ class: "ml-2" },
            }));
            const __VLS_22 = __VLS_21({
                tone: "accent",
                ...{ class: "ml-2" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_21));
            /** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
            var __VLS_23;
            const { default: __VLS_25 } = __VLS_nonNull(__VLS_23.slots);
            (__VLS_unwrap(t, {})(`admin.libraries.types.${lib.type}`));
            // @ts-ignore
            [t, t, error, error, indexerReachable, loading, libraries, libraries,];
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex items-center gap-2" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!!(loading.value && libraries.value.length === 0))
                            throw 0;
                        return (scan(lib, false));
                        // @ts-ignore
                        [];
                    } },
                type: "button",
                disabled: (!indexerReachable.value || scanningId.value === lib.id || isRunning(scans.value[lib.id])),
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
            (__VLS_unwrap(t, {})('admin.libraries.scan'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!!(loading.value && libraries.value.length === 0))
                            throw 0;
                        return (openRescan(lib));
                        // @ts-ignore
                        [t, indexerReachable, scanningId, scans,];
                    } },
                type: "button",
                disabled: (!indexerReachable.value || scanningId.value === lib.id || isRunning(scans.value[lib.id])),
                ...{ class: "rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15 disabled:opacity-50" },
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
            /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
            (__VLS_unwrap(t, {})('admin.libraries.rescan'));
            if (lib.type !== 'music') {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!!(loading.value && libraries.value.length === 0))
                                throw 0;
                            if (!(lib.type !== 'music'))
                                throw 0;
                            return (scan(lib, false, true));
                            // @ts-ignore
                            [t, indexerReachable, scanningId, scans,];
                        } },
                    type: "button",
                    disabled: (!indexerReachable.value || scanningId.value === lib.id),
                    ...{ class: "rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15 disabled:opacity-50" },
                });
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
                /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
                (__VLS_unwrap(t, {})('admin.libraries.trickplay'));
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!!(loading.value && libraries.value.length === 0))
                            throw 0;
                        return (openForm(lib));
                        // @ts-ignore
                        [t, indexerReachable, scanningId,];
                    } },
                type: "button",
                ...{ class: "rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15" },
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
            (__VLS_unwrap(t, {})('admin.libraries.manage'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!!(loading.value && libraries.value.length === 0))
                            throw 0;
                        return (remove(lib));
                        // @ts-ignore
                        [t,];
                    } },
                type: "button",
                disabled: (deletingId.value === lib.id),
                ...{ class: "rounded bg-red-500/20 px-4 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/30 disabled:opacity-50" },
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
            /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
            (__VLS_unwrap(t, {})('admin.libraries.deleteLibrary'));
            if (scans.value[lib.id]) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "mt-3" },
                    role: "status",
                });
                /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "flex items-center justify-between text-xs text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: (scans.value[lib.id].state === 'failed' ? 'text-red-300' : '') },
                });
                (scanLabel(scans.value[lib.id]));
                if (scans.value[lib.id].failed > 0) {
                    (__VLS_unwrap(t, {})('admin.libraries.scanFailedItems', { failed: scans.value[lib.id].failed }));
                }
                if (isRunning(scans.value[lib.id])) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                    (scanPercent(scans.value[lib.id]));
                }
                if (isRunning(scans.value[lib.id])) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "mt-1 h-1.5 overflow-hidden rounded bg-white/10" },
                    });
                    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
                    /** @type {__VLS_StyleScopedClasses['h-1.5']} */ ;
                    /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
                    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                    /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "h-full bg-flixer-primary transition-all" },
                        ...{ style: ({ width: `${scanPercent(scans.value[lib.id])}%` }) },
                    });
                    /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
                    /** @type {__VLS_StyleScopedClasses['bg-flixer-primary']} */ ;
                    /** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
                }
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
                ...{ class: "mt-3 grid gap-1" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
            const __VLS_26 = __VLS_tryAsConstant((lib.folders));
            for (const [folder] of __VLS_vFor(__VLS_nonNull(__VLS_26))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                    key: (`${folder.rootId}/${folder.path}`),
                    ...{ class: "flex items-center gap-2 text-xs" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "truncate font-mono text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (folder.location);
                if (!folder.available) {
                    const __VLS_27 = StatusPill || StatusPill;
                    // @ts-ignore
                    const __VLS_28 = __VLS_asFunctionalComponent1(__VLS_27, new __VLS_27({
                        // @ts-ignore
                        tone: "bad",
                    }));
                    const __VLS_29 = __VLS_28({
                        tone: "bad",
                    }, ...__VLS_functionalComponentArgsRest(__VLS_28));
                    var __VLS_30;
                    const { default: __VLS_32 } = __VLS_nonNull(__VLS_30.slots);
                    (__VLS_unwrap(t, {})('admin.libraries.unavailable'));
                    // @ts-ignore
                    [t, t, t, scans, scans, scans, scans, scans, scans, scans, scans, scans, deletingId,];
                }
                // @ts-ignore
                [];
            }
            // @ts-ignore
            [];
        }
        if (!loading.value && libraries.value.length === 0 && !error.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                ...{ class: "rounded border border-dashed border-flixer-border p-6 text-center text-sm text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-dashed']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-6']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.libraries.empty'));
        }
    }
    // @ts-ignore
    [t, error, loading, libraries,];
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
