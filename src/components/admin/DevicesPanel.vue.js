import { onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { createApiKey, listApiKeys, listDevices, revokeApiKey, signOutDevice } from '../../api';
import { confirmAction } from '../../composables/confirm';
import { notify } from '../../composables/notify';
import { describeRequestError } from '../../composables/useProfile';
import { catchError } from '../../utils/catchError';
import { useLiveTopic } from '../../composables/useLive';
import AdminSection from './AdminSection.vue';
import StatusPill from './StatusPill.vue';
const { defineProps, withDefaults, } = {};
const { t, locale } = useI18n();
const devices = ref([]);
const __VLS_props = withDefaults(defineProps(), { part: undefined });
const apiKeys = ref([]);
const devicesError = ref('');
const keysError = ref('');
const signingOutId = ref(null);
const revokingId = ref(null);
const creating = ref(false);
const showForm = ref(false);
const newKeyName = ref('');
const createdKey = ref(null);
async function loadDevices() {
    const [error, result] = await catchError(listDevices());
    if (error) {
        devicesError.value = describeRequestError(error, t('admin.devices.loadError'));
    }
    else {
        devices.value = result;
        devicesError.value = '';
    }
}
async function loadKeys() {
    const [error, result] = await catchError(listApiKeys());
    if (error) {
        keysError.value = describeRequestError(error, t('admin.devices.keysLoadError'));
    }
    else {
        apiKeys.value = result;
        keysError.value = '';
    }
}
async function signOut(device) {
    if (!(await confirmAction(t('admin.devices.confirmSignOut', { device: `${device.app} · ${device.device}`, name: device.user.displayName }), { danger: true })))
        return;
    signingOutId.value = device.id;
    try {
        const [error] = await catchError(signOutDevice(device.id));
        if (error) {
            notify.error(describeRequestError(error, t('admin.devices.signOutError')));
        }
        else {
            notify.success(t('admin.devices.signOutSuccess'));
        }
    }
    finally {
        signingOutId.value = null;
        await loadDevices();
    }
}
async function create() {
    const name = newKeyName.value.trim();
    if (!name || creating.value)
        return;
    creating.value = true;
    try {
        const [error, key] = await catchError(createApiKey(name));
        if (error) {
            notify.error(describeRequestError(error, t('admin.devices.createError')));
        }
        else {
            createdKey.value = key;
            newKeyName.value = '';
            showForm.value = false;
            await loadKeys();
        }
    }
    finally {
        creating.value = false;
    }
}
async function revoke(key) {
    if (!(await confirmAction(t('admin.devices.confirmRevoke', { name: key.name }), { danger: true })))
        return;
    revokingId.value = key.id;
    try {
        const [error] = await catchError(revokeApiKey(key.id));
        if (error) {
            notify.error(describeRequestError(error, t('admin.devices.revokeError')));
        }
        else {
            if (createdKey.value?.id === key.id)
                createdKey.value = null;
            notify.success(t('admin.devices.revokeSuccess'));
        }
    }
    finally {
        revokingId.value = null;
        await loadKeys();
    }
}
async function copySecret() {
    if (!createdKey.value)
        return;
    const [error] = await catchError(navigator.clipboard.writeText(createdKey.value.secret));
    if (error) {
        notify.error(t('admin.devices.copyError'));
    }
    else {
        notify.success(t('admin.devices.copied'));
    }
}
const UNITS = [
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
];
function relativeTime(iso) {
    if (!iso)
        return t('admin.devices.never');
    const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
    if (Math.abs(seconds) < 60)
        return t('admin.devices.justNow');
    const [unit, size] = UNITS.find(([, s]) => Math.abs(seconds) >= s) ?? UNITS[2];
    return new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' }).format(Math.round(seconds / size), unit);
}
const formatDate = (iso) => new Date(iso).toLocaleDateString(locale.value, { dateStyle: 'medium' });
onMounted(() => {
    void loadDevices();
    void loadKeys();
});
const liveDevices = useLiveTopic('devices');
watch(liveDevices.data, (value) => {
    if (value)
        devices.value = value;
});
const __VLS_defaults = { part: undefined };
void __VLS_defaults;
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(devicesError, {});
    __VLS_withDotValue(signingOutId, {});
    __VLS_withDotValue(devices, {});
    __VLS_withDotValue(showForm, {});
    __VLS_withDotValue(creating, {});
    __VLS_withDotValue(newKeyName, {});
    __VLS_withDotValue(createdKey, {});
    __VLS_withDotValue(keysError, {});
    __VLS_withDotValue(revokingId, {});
    __VLS_withDotValue(apiKeys, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-col gap-6" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
    if (__VLS_ctx.part !== 'keys') {
        const __VLS_0 = AdminSection || AdminSection;
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
            // @ts-ignore
            title: (__VLS_unwrap(t, {})('admin.devices.title')), description: (__VLS_unwrap(t, {})('admin.devices.description')),
        }));
        const __VLS_2 = __VLS_1({
            title: (__VLS_unwrap(t, {})('admin.devices.title')),
            description: (__VLS_unwrap(t, {})('admin.devices.description')),
        }, ...__VLS_functionalComponentArgsRest(__VLS_1));
        var __VLS_3;
        const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
        if (devicesError.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                role: "alert",
                ...{ class: "mb-3 text-sm text-red-300" },
            });
            /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
            (devicesError.value);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "overflow-x-auto" },
        });
        /** @type {__VLS_StyleScopedClasses['overflow-x-auto']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
            ...{ class: "w-full min-w-160 text-left text-sm" },
        });
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['min-w-160']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({
            ...{ class: "text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "pb-2 font-medium" },
        });
        /** @type {__VLS_StyleScopedClasses['pb-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        (__VLS_unwrap(t, {})('admin.devices.device'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "pb-2 font-medium" },
        });
        /** @type {__VLS_StyleScopedClasses['pb-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        (__VLS_unwrap(t, {})('admin.devices.app'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "pb-2 font-medium" },
        });
        /** @type {__VLS_StyleScopedClasses['pb-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        (__VLS_unwrap(t, {})('admin.devices.user'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "pb-2 font-medium" },
        });
        /** @type {__VLS_StyleScopedClasses['pb-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        (__VLS_unwrap(t, {})('admin.devices.ipAddress'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "pb-2 font-medium" },
        });
        /** @type {__VLS_StyleScopedClasses['pb-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        (__VLS_unwrap(t, {})('admin.devices.lastSeen'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "pb-2" },
        });
        /** @type {__VLS_StyleScopedClasses['pb-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
        const __VLS_6 = __VLS_tryAsConstant((devices.value));
        for (const [d] of __VLS_vFor(__VLS_nonNull(__VLS_6))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (d.id),
                ...{ class: "border-t border-flixer-border" },
            });
            /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "py-3 font-medium" },
            });
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            (d.device);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (d.app);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (d.user.username);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "font-mono text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (d.ipAddress ?? '—');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (relativeTime(d.lastSeenAt));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-right" },
            });
            /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
            if (d.current) {
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
                (__VLS_unwrap(t, {})('admin.devices.thisDevice'));
                // @ts-ignore
                [part, t, t, t, t, t, t, t, t, devicesError, devicesError, devices,];
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!(__VLS_ctx.part !== 'keys'))
                                throw 0;
                            if (!!(d.current))
                                throw 0;
                            return (signOut(d));
                            // @ts-ignore
                            [];
                        } },
                    type: "button",
                    disabled: (signingOutId.value === d.id),
                    ...{ class: "rounded bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/30 disabled:opacity-50" },
                });
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-red-500/20']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-red-200']} */ ;
                /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:bg-red-500/30']} */ ;
                /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
                (__VLS_unwrap(t, {})('admin.devices.signOut'));
            }
            // @ts-ignore
            [t, signingOutId,];
        }
        if (devices.value.length === 0 && !devicesError.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                colspan: "6",
                ...{ class: "border-t border-flixer-border py-6 text-center text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-6']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.devices.emptyDevices'));
        }
        // @ts-ignore
        [t, devicesError, devices,];
    }
    if (__VLS_ctx.part !== 'devices') {
        const __VLS_13 = AdminSection || AdminSection;
        // @ts-ignore
        const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
            // @ts-ignore
            title: (__VLS_unwrap(t, {})('admin.devices.apiKeysTitle')), description: (__VLS_unwrap(t, {})('admin.devices.apiKeysDescription')),
        }));
        const __VLS_15 = __VLS_14({
            title: (__VLS_unwrap(t, {})('admin.devices.apiKeysTitle')),
            description: (__VLS_unwrap(t, {})('admin.devices.apiKeysDescription')),
        }, ...__VLS_functionalComponentArgsRest(__VLS_14));
        var __VLS_16;
        const { default: __VLS_18 } = __VLS_nonNull(__VLS_16.slots);
        {
            const { actions: __VLS_19 } = __VLS_nonNull(__VLS_16.slots);
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!(__VLS_ctx.part !== 'devices'))
                            throw 0;
                        return (showForm.value = !showForm.value);
                        // @ts-ignore
                        [part, t, t, showForm, showForm,];
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
            (__VLS_unwrap(t, {})('admin.devices.newApiKey'));
            // @ts-ignore
            [t,];
        }
        if (showForm.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
                ...{ onSubmit: (create) },
                ...{ class: "mb-4 flex flex-wrap items-end gap-3" },
            });
            /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-end']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "flex min-w-60 flex-1 flex-col gap-1 text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['min-w-60']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.devices.keyName'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                value: (newKeyName.value),
                type: "text",
                maxlength: "100",
                required: true,
                placeholder: (__VLS_unwrap(t, {})('admin.devices.keyNamePlaceholder')),
                ...{ class: "rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm text-flixer-text" },
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                type: "submit",
                disabled: (creating.value || !newKeyName.value.trim()),
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
            (__VLS_unwrap(t, {})('admin.devices.createKey'));
        }
        if (createdKey.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                role: "status",
                ...{ class: "mb-4 rounded border border-flixer-primary/50 bg-flixer-primary/10 p-4" },
            });
            /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-primary/50']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-primary/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-sm font-semibold" },
            });
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            (__VLS_unwrap(t, {})('admin.devices.keyCreatedTitle', { name: createdKey.value.name }));
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mt-1 text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.devices.keyCreatedWarning'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mt-3 flex flex-wrap items-center gap-2" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({
                ...{ class: "min-w-0 flex-1 break-all rounded bg-flixer-background px-3 py-2 font-mono text-xs" },
            });
            /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['break-all']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            (createdKey.value.secret);
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (copySecret) },
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
            (__VLS_unwrap(t, {})('admin.devices.copy'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!(__VLS_ctx.part !== 'devices'))
                            throw 0;
                        if (!(createdKey.value))
                            throw 0;
                        return (createdKey.value = null);
                        // @ts-ignore
                        [t, t, t, t, t, t, showForm, newKeyName, newKeyName, creating, createdKey, createdKey, createdKey, createdKey,];
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
            (__VLS_unwrap(t, {})('admin.devices.done'));
        }
        if (keysError.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                role: "alert",
                ...{ class: "mb-3 text-sm text-red-300" },
            });
            /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
            (keysError.value);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
            ...{ class: "grid gap-2" },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        const __VLS_20 = __VLS_tryAsConstant((apiKeys.value));
        for (const [k] of __VLS_vFor(__VLS_nonNull(__VLS_20))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                key: (k.id),
                ...{ class: "flex flex-wrap items-center justify-between gap-3 rounded border border-flixer-border bg-flixer-background/60 px-4 py-3" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-background/60']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-sm font-semibold" },
            });
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            (k.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "font-mono" },
            });
            /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
            (k.prefix);
            (__VLS_unwrap(t, {})('admin.devices.createdBy', { name: k.owner.displayName }));
            (__VLS_unwrap(t, {})('admin.devices.created'));
            (__VLS_unwrap(formatDate, {})(k.createdAt));
            (__VLS_unwrap(t, {})('admin.devices.used'));
            (relativeTime(k.lastUsedAt));
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!(__VLS_ctx.part !== 'devices'))
                            throw 0;
                        return (revoke(k));
                        // @ts-ignore
                        [t, t, t, t, keysError, keysError, apiKeys, formatDate,];
                    } },
                type: "button",
                disabled: (revokingId.value === k.id),
                ...{ class: "rounded bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/30 disabled:opacity-50" },
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-red-500/20']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-red-200']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-red-500/30']} */ ;
            /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
            (__VLS_unwrap(t, {})('admin.devices.revoke'));
            // @ts-ignore
            [t, revokingId,];
        }
        if (apiKeys.value.length === 0 && !keysError.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                ...{ class: "py-4 text-center text-sm text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['py-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.devices.emptyKeys'));
        }
        // @ts-ignore
        [t, keysError, apiKeys,];
    }
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __defaults: __VLS_defaults,
    __typeProps: {},
});
export default {};
