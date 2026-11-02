import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import ListSkeleton from '../ui/ListSkeleton.vue';
import { listSettings, updateSetting } from '../../api';
import { notify } from '../../composables/notify';
import { describeRequestError } from '../../composables/useProfile';
import { catchError } from '../../utils/catchError';
const fields = [
    { key: 'registration_enabled', labelKey: 'settings.server.registrationEnabled', descriptionKey: 'settings.server.registrationDescription', type: 'boolean' },
    { key: 'server_name', labelKey: 'settings.server.serverName', descriptionKey: 'settings.server.serverNameDescription', type: 'text' },
    { key: 'server_address', labelKey: 'settings.server.serverAddress', descriptionKey: 'settings.server.serverAddressDescription', type: 'text' },
    { key: 'cache_path', labelKey: 'settings.server.cachePath', descriptionKey: 'settings.server.cachePathDescription', type: 'text' },
    { key: 'logs_path', labelKey: 'settings.server.logsPath', descriptionKey: 'settings.server.logsPathDescription', type: 'text' },
    { key: 'metadata_path', labelKey: 'settings.server.metadataPath', descriptionKey: 'settings.server.metadataPathDescription', type: 'text' },
];
const { t } = useI18n();
const values = ref({});
const isLoading = ref(true);
const savingKey = ref(null);
async function load() {
    try {
        const [error, settings] = await catchError(listSettings());
        if (error) {
            console.error('[settings] failed to load server settings', error);
            notify.error(describeRequestError(error, t('settings.server.loadFailed')));
        }
        else {
            values.value = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
        }
    }
    finally {
        isLoading.value = false;
    }
}
async function save(field, value) {
    savingKey.value = field.key;
    try {
        const [error, saved] = await catchError(updateSetting(field.key, value));
        if (error) {
            console.error('[settings] failed to save setting', field.key, error);
            notify.error(describeRequestError(error, t('settings.server.saveFailed')));
            await load();
        }
        else {
            values.value = { ...values.value, [field.key]: saved.value };
            notify.success(t('settings.server.saved', { setting: t(field.labelKey) }));
        }
    }
    finally {
        savingKey.value = null;
    }
}
function saveText(field, event) {
    const value = event.target.value.trim();
    if (value !== (values.value[field.key] ?? '')) {
        void save(field, value || null);
    }
}
onMounted(load);
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(isLoading, {});
    __VLS_withDotValue(values, {});
    __VLS_withDotValue(savingKey, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        'aria-labelledby': "server-heading",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
        id: "server-heading",
        ...{ class: "text-lg font-semibold" },
    });
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    (__VLS_unwrap(t, {})('settings.server.title'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-1 text-sm text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('settings.server.description'));
    if (isLoading.value) {
        const __VLS_0 = ListSkeleton;
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
            // @ts-ignore
            ...{ class: "mt-6" },
        }));
        const __VLS_2 = __VLS_1({
            ...{ class: "mt-6" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_1));
        /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
            ...{ class: "mt-6 flex max-w-2xl flex-col gap-3" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['max-w-2xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        const __VLS_5 = __VLS_tryAsConstant((__VLS_unwrap(fields, {})));
        for (const [field] of __VLS_vFor(__VLS_nonNull(__VLS_5))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                key: (field.key),
                ...{ class: "rounded border border-flixer-border bg-flixer-surface/50 p-4" },
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/50']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
            if (field.type === 'boolean') {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "flex items-center justify-between gap-4" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "text-sm font-semibold" },
                });
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                (__VLS_unwrap(t, {})(field.labelKey));
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "mt-0.5 text-xs text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-0.5']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (__VLS_unwrap(t, {})(field.descriptionKey));
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!!(isLoading.value))
                                throw 0;
                            if (!(field.type === 'boolean'))
                                throw 0;
                            return (save(field, values.value[field.key] !== true));
                            // @ts-ignore
                            [t, t, t, t, isLoading, fields, values,];
                        } },
                    type: "button",
                    role: "switch",
                    'aria-checked': (values.value[field.key] === true),
                    'aria-label': (__VLS_unwrap(t, {})(field.labelKey)),
                    ...{ class: "relative h-6 w-11 shrink-0 rounded-full transition disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
                    ...{ class: (values.value[field.key] === true ? 'bg-flixer-primary' : 'bg-white/20') },
                    disabled: (savingKey.value === field.key),
                });
                /** @type {__VLS_StyleScopedClasses['relative']} */ ;
                /** @type {__VLS_StyleScopedClasses['h-6']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-11']} */ ;
                /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
                /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                /** @type {__VLS_StyleScopedClasses['disabled:cursor-wait']} */ ;
                /** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "absolute left-0.5 top-0.5 size-5 rounded-full bg-white transition-transform" },
                    ...{ class: ({ 'translate-x-5': values.value[field.key] === true }) },
                });
                /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
                /** @type {__VLS_StyleScopedClasses['left-0.5']} */ ;
                /** @type {__VLS_StyleScopedClasses['top-0.5']} */ ;
                /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
                /** @type {__VLS_StyleScopedClasses['transition-transform']} */ ;
                /** @type {__VLS_StyleScopedClasses['translate-x-5']} */ ;
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                    ...{ class: "flex flex-col gap-2" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "text-sm font-semibold" },
                });
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                (__VLS_unwrap(t, {})(field.labelKey));
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "text-xs text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (__VLS_unwrap(t, {})(field.descriptionKey));
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    ...{ onChange: (...[$event]) => {
                            void $event;
                            if (!!(isLoading.value))
                                throw 0;
                            if (!!(field.type === 'boolean'))
                                throw 0;
                            return (saveText(field, $event));
                            // @ts-ignore
                            [t, t, t, values, values, values, savingKey,];
                        } },
                    type: "text",
                    value: (values.value[field.key] ?? ''),
                    disabled: (savingKey.value === field.key),
                    ...{ class: "h-11 rounded border border-flixer-border bg-flixer-background/60 px-3 text-sm text-flixer-text outline-none focus:border-flixer-accent/60 disabled:opacity-60" },
                });
                /** @type {__VLS_StyleScopedClasses['h-11']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['border']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-flixer-background/60']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
                /** @type {__VLS_StyleScopedClasses['outline-none']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus:border-flixer-accent/60']} */ ;
                /** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
            }
            // @ts-ignore
            [values, savingKey,];
        }
    }
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
