import { openModal } from '@kolirt/vue-modal';
import { onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AdminSkeleton from './AdminSkeleton.vue';
import { deleteNetworkShare, getNetworkShareSupport, listNetworkShares, reconnectNetworkShare } from '../../api';
import { confirmAction } from '../../composables/confirm';
import { notify } from '../../composables/notify';
import { describeRequestError } from '../../composables/useProfile';
import { useLiveTopic } from '../../composables/useLive';
import AdminSection from './AdminSection.vue';
import NetworkShareModal from './NetworkShareModal.vue';
import StatusPill from './StatusPill.vue';
import { catchError } from '../../utils/catchError';
const { defineEmits, } = {};
const emit = defineEmits();
const { t } = useI18n();
const shares = ref([]);
const loading = ref(true);
const error = ref('');
const busyId = ref(null);
// Hidden where the host cannot mount shares (Docker Desktop), unless shares already exist and need managing.
const supported = ref(true);
const TONES = { connected: 'good', connecting: 'warn', error: 'bad' };
async function load() {
    try {
        const [requestError, result] = await catchError(listNetworkShares());
        if (requestError) {
            error.value = describeRequestError(requestError, t('admin.networkShares.loadError'));
        }
        else {
            shares.value = result;
            error.value = '';
        }
    }
    finally {
        loading.value = false;
    }
}
async function openForm(share) {
    const saved = await openModal(NetworkShareModal, { props: { share: share ?? undefined } }).catch(() => false);
    if (!saved)
        return;
    await load();
    emit('changed');
}
async function reconnect(share) {
    busyId.value = share.id;
    try {
        const [requestError, result] = await catchError(reconnectNetworkShare(share.id));
        if (requestError) {
            notify.error(describeRequestError(requestError, t('admin.networkShares.reconnectError')));
        }
        else if (result.status === 'connected')
            notify.success(t('admin.networkShares.reconnected'));
        else
            notify.error(result.error || t('admin.networkShares.reconnectError'));
    }
    finally {
        busyId.value = null;
        await load();
        emit('changed');
    }
}
async function remove(share) {
    if (!(await confirmAction(t('admin.networkShares.confirmDelete', { name: share.name }), { danger: true })))
        return;
    busyId.value = share.id;
    try {
        const [requestError] = await catchError(deleteNetworkShare(share.id));
        if (requestError) {
            notify.error(describeRequestError(requestError, t('admin.networkShares.deleteError')));
        }
        else {
            notify.success(t('admin.networkShares.deleted'));
        }
    }
    finally {
        busyId.value = null;
        await load();
        emit('changed');
    }
}
onMounted(() => {
    void load();
    getNetworkShareSupport()
        .then((result) => (supported.value = result.supported))
        .catch(() => undefined);
});
const live = useLiveTopic('shares');
watch(live.data, (value) => {
    if (value)
        shares.value = value;
});
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(supported, {});
    __VLS_withDotValue(shares, {});
    __VLS_withDotValue(error, {});
    __VLS_withDotValue(loading, {});
    __VLS_withDotValue(TONES, {});
    __VLS_withDotValue(busyId, {});
    if (supported.value || shares.value.length > 0) {
        const __VLS_0 = AdminSection || AdminSection;
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
            // @ts-ignore
            title: (__VLS_unwrap(t, {})('admin.networkShares.title')), description: (__VLS_unwrap(t, {})('admin.networkShares.description')),
        }));
        const __VLS_2 = __VLS_1({
            title: (__VLS_unwrap(t, {})('admin.networkShares.title')),
            description: (__VLS_unwrap(t, {})('admin.networkShares.description')),
        }, ...__VLS_functionalComponentArgsRest(__VLS_1));
        var __VLS_3;
        const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
        {
            const { actions: __VLS_6 } = __VLS_nonNull(__VLS_3.slots);
            if (supported.value) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!(supported.value || shares.value.length > 0))
                                throw 0;
                            if (!(supported.value))
                                throw 0;
                            return (openForm(null));
                            // @ts-ignore
                            [supported, supported, shares, t, t,];
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
                (__VLS_unwrap(t, {})('admin.networkShares.add'));
            }
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
        if (loading.value && shares.value.length === 0) {
            const __VLS_7 = AdminSkeleton;
            // @ts-ignore
            const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
                // @ts-ignore
                variant: "cards",
            }));
            const __VLS_9 = __VLS_8({
                variant: "cards",
            }, ...__VLS_functionalComponentArgsRest(__VLS_8));
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
                ...{ class: "flex flex-col gap-3" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            const __VLS_12 = __VLS_tryAsConstant((shares.value));
            for (const [share] of __VLS_vFor(__VLS_nonNull(__VLS_12))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                    key: (share.id),
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
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "min-w-0" },
                });
                /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "text-sm font-semibold" },
                });
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                (share.name);
                const __VLS_13 = StatusPill || StatusPill;
                // @ts-ignore
                const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
                    // @ts-ignore
                    tone: (TONES.value[share.status]), ...{ class: "ml-2" },
                }));
                const __VLS_15 = __VLS_14({
                    tone: (TONES.value[share.status]),
                    ...{ class: "ml-2" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_14));
                /** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
                var __VLS_16;
                const { default: __VLS_18 } = __VLS_nonNull(__VLS_16.slots);
                (__VLS_unwrap(t, {})(`admin.networkShares.status.${share.status}`));
                // @ts-ignore
                [shares, shares, t, error, error, loading, TONES,];
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "mt-1 truncate font-mono text-xs text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (share.host);
                (share.share);
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "flex items-center gap-2" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!(supported.value || shares.value.length > 0))
                                throw 0;
                            if (!!(loading.value && shares.value.length === 0))
                                throw 0;
                            return (reconnect(share));
                            // @ts-ignore
                            [];
                        } },
                    type: "button",
                    disabled: (busyId.value === share.id),
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
                (__VLS_unwrap(t, {})('admin.networkShares.reconnect'));
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!(supported.value || shares.value.length > 0))
                                throw 0;
                            if (!!(loading.value && shares.value.length === 0))
                                throw 0;
                            return (openForm(share));
                            // @ts-ignore
                            [t, busyId,];
                        } },
                    type: "button",
                    disabled: (busyId.value === share.id),
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
                (__VLS_unwrap(t, {})('admin.networkShares.manage'));
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!(supported.value || shares.value.length > 0))
                                throw 0;
                            if (!!(loading.value && shares.value.length === 0))
                                throw 0;
                            return (remove(share));
                            // @ts-ignore
                            [t, busyId,];
                        } },
                    type: "button",
                    disabled: (busyId.value === share.id),
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
                (__VLS_unwrap(t, {})('admin.networkShares.delete'));
                if (share.status === 'error' && share.error) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                        ...{ class: "mt-2 text-xs text-red-300" },
                    });
                    /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
                    (share.error);
                }
                // @ts-ignore
                [t, busyId,];
            }
            if (!loading.value && shares.value.length === 0 && !error.value) {
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
                (__VLS_unwrap(t, {})('admin.networkShares.empty'));
            }
        }
        // @ts-ignore
        [shares, t, error, loading,];
    }
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
});
export default {};
