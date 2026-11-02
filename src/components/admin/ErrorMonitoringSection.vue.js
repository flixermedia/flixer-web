import * as Sentry from '@sentry/vue';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AdminSkeleton from './AdminSkeleton.vue';
import { listSettings, updateSetting } from '../../api';
import { notify } from '../../composables/notify';
import { describeRequestError } from '../../composables/useProfile';
import { catchError } from '../../utils/catchError';
import AdminSection from './AdminSection.vue';
import AdminToggle from './AdminToggle.vue';
const APPS = ['flixer', 'streamer', 'indexer', 'web'];
const { t } = useI18n();
const values = ref({});
const isLoading = ref(true);
const savingKey = ref(null);
const globalEnabled = computed(() => values.value.sentry_enabled === true);
async function load() {
    try {
        const [error, settings] = await catchError(listSettings());
        if (error) {
            console.error('[monitoring] failed to load settings', error);
            notify.error(describeRequestError(error, t('admin.monitoring.loadFailed')));
        }
        else {
            values.value = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
        }
    }
    finally {
        isLoading.value = false;
    }
}
async function save(key, value, label) {
    savingKey.value = key;
    try {
        const [error, saved] = await catchError(updateSetting(key, value));
        if (error) {
            console.error('[monitoring] failed to save setting', key, error);
            notify.error(describeRequestError(error, t('admin.monitoring.saveFailed')));
            await load();
        }
        else {
            values.value = { ...values.value, [key]: saved.value };
            notify.success(t('admin.monitoring.saved', { setting: label }));
        }
    }
    finally {
        savingKey.value = null;
    }
}
function saveDsn(app, event) {
    const input = event.target;
    const key = `sentry_${app}_dsn`;
    const value = input.value.trim();
    if (value === (values.value[key] ?? ''))
        return;
    if (value && !URL.canParse(value)) {
        notify.error(t('admin.monitoring.dsnInvalid'));
        input.value = values.value[key] ?? '';
        return;
    }
    void save(key, value || null, t('admin.monitoring.dsn', { app: t(`admin.monitoring.apps.${app}`) }));
}
async function sendTestAlert() {
    if (!Sentry.isInitialized()) {
        notify.error(t('admin.monitoring.testDisabled'));
        return;
    }
    Sentry.captureException(new Error(`Flixer web test alert (${new Date().toISOString()})`));
    await Sentry.flush(5_000);
    notify.success(t('admin.monitoring.testSent'));
}
onMounted(load);
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(isLoading, {});
    __VLS_withDotValue(savingKey, {});
    __VLS_withDotValue(globalEnabled, {});
    __VLS_withDotValue(values, {});
    const __VLS_0 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('admin.monitoring.title')), description: (__VLS_unwrap(t, {})('admin.monitoring.description')),
    }));
    const __VLS_2 = __VLS_1({
        title: (__VLS_unwrap(t, {})('admin.monitoring.title')),
        description: (__VLS_unwrap(t, {})('admin.monitoring.description')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    if (isLoading.value) {
        const __VLS_6 = AdminSkeleton;
        // @ts-ignore
        const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
            // @ts-ignore
            variant: "toggles", rows: (3),
        }));
        const __VLS_8 = __VLS_7({
            variant: "toggles",
            rows: (3),
        }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    }
    else {
        const __VLS_11 = AdminToggle;
        // @ts-ignore
        const __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11({
            // @ts-ignore
            ...{ 'onUpdate:modelValue': {} }, modelValue: (globalEnabled.value), label: (__VLS_unwrap(t, {})('admin.monitoring.global')), description: (__VLS_unwrap(t, {})('admin.monitoring.globalDescription')), ...{ class: ({ 'pointer-events-none opacity-60': savingKey.value === 'sentry_enabled' }) },
        }));
        const __VLS_13 = __VLS_12({
            ...{ 'onUpdate:modelValue': {} },
            modelValue: (globalEnabled.value),
            label: (__VLS_unwrap(t, {})('admin.monitoring.global')),
            description: (__VLS_unwrap(t, {})('admin.monitoring.globalDescription')),
            ...{ class: ({ 'pointer-events-none opacity-60': savingKey.value === 'sentry_enabled' }) },
        }, ...__VLS_functionalComponentArgsRest(__VLS_12));
        let __VLS_16;
        const __VLS_17 = {
            /** @type {typeof __VLS_16.'update:modelValue'} */
            'onUpdate:modelValue': (...[$event]) => {
                void $event;
                if (!!(isLoading.value))
                    throw 0;
                return (save('sentry_enabled', $event, __VLS_unwrap(t, {})('admin.monitoring.global')));
                // @ts-ignore
                [t, t, t, t, t, isLoading, globalEnabled, savingKey,];
            },
        };
        void __VLS_17;
        /** @type {__VLS_StyleScopedClasses['pointer-events-none']} */ ;
        /** @type {__VLS_StyleScopedClasses['opacity-60']} */ ;
        var __VLS_14;
        var __VLS_15;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-2 flex flex-col gap-4" },
            ...{ class: ({ 'opacity-60': !globalEnabled.value }) },
        });
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['opacity-60']} */ ;
        const __VLS_18 = __VLS_tryAsConstant((__VLS_unwrap(APPS, {})));
        for (const [app] of __VLS_vFor(__VLS_nonNull(__VLS_18))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (app),
                ...{ class: "rounded border border-flixer-border p-3" },
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
            const __VLS_19 = AdminToggle;
            // @ts-ignore
            const __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({
                // @ts-ignore
                ...{ 'onUpdate:modelValue': {} }, modelValue: (values.value[`sentry_${app}_enabled`] === true), label: (__VLS_unwrap(t, {})('admin.monitoring.appEnabled', { app: __VLS_unwrap(t, {})(`admin.monitoring.apps.${app}`) })), ...{ class: ({ 'pointer-events-none opacity-60': savingKey.value === `sentry_${app}_enabled` }) },
            }));
            const __VLS_21 = __VLS_20({
                ...{ 'onUpdate:modelValue': {} },
                modelValue: (values.value[`sentry_${app}_enabled`] === true),
                label: (__VLS_unwrap(t, {})('admin.monitoring.appEnabled', { app: __VLS_unwrap(t, {})(`admin.monitoring.apps.${app}`) })),
                ...{ class: ({ 'pointer-events-none opacity-60': savingKey.value === `sentry_${app}_enabled` }) },
            }, ...__VLS_functionalComponentArgsRest(__VLS_20));
            let __VLS_24;
            const __VLS_25 = {
                /** @type {typeof __VLS_24.'update:modelValue'} */
                'onUpdate:modelValue': (...[$event]) => {
                    void $event;
                    if (!!(isLoading.value))
                        throw 0;
                    return (save(`sentry_${app}_enabled`, $event, __VLS_unwrap(t, {})('admin.monitoring.appEnabled', { app: __VLS_unwrap(t, {})(`admin.monitoring.apps.${app}`) })));
                    // @ts-ignore
                    [t, t, t, t, globalEnabled, savingKey, APPS, values,];
                },
            };
            void __VLS_25;
            /** @type {__VLS_StyleScopedClasses['pointer-events-none']} */ ;
            /** @type {__VLS_StyleScopedClasses['opacity-60']} */ ;
            var __VLS_22;
            var __VLS_23;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "mt-1 block text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['block']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.monitoring.dsn', { app: __VLS_unwrap(t, {})(`admin.monitoring.apps.${app}`) }));
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                ...{ onChange: (...[$event]) => {
                        void $event;
                        if (!!(isLoading.value))
                            throw 0;
                        return (saveDsn(app, $event));
                        // @ts-ignore
                        [t, t,];
                    } },
                type: "text",
                value: (values.value[`sentry_${app}_dsn`] ?? ''),
                disabled: (savingKey.value === `sentry_${app}_dsn`),
                ...{ class: "mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 font-mono text-sm text-flixer-text disabled:opacity-60" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
            /** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
            // @ts-ignore
            [savingKey, values,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-4 flex flex-col gap-2" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.monitoring.testDescription'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (sendTestAlert) },
            type: "button",
            ...{ class: "self-start rounded border border-flixer-border px-3 py-2 text-sm text-flixer-text hover:bg-flixer-border/40" },
        });
        /** @type {__VLS_StyleScopedClasses['self-start']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-flixer-border/40']} */ ;
        (__VLS_unwrap(t, {})('admin.monitoring.test'));
    }
    // @ts-ignore
    [t, t,];
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
