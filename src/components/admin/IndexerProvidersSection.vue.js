import { onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { INDEXER_PROVIDERS, listSettings, updateSetting } from '../../api';
import { notify } from '../../composables/notify';
import { describeRequestError } from '../../composables/useProfile';
import { catchError } from '../../utils/catchError';
import AdminSection from './AdminSection.vue';
import AdminToggle from './AdminToggle.vue';
const { t } = useI18n();
// The server returns this placeholder for a saved key; sending it back keeps the stored key.
const providers = reactive(Object.fromEntries(INDEXER_PROVIDERS.map((provider) => [provider.id, { enabled: provider.id === 'theintrodb' || provider.id === 'introdb', apiKey: '', hasKey: false }])));
const language = ref('en');
const loading = ref(true);
const saving = ref(false);
const error = ref('');
const inputClass = 'mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-flixer-text placeholder:text-flixer-muted/60 focus-visible:outline-2 focus-visible:outline-flixer-accent';
async function load() {
    try {
        const [requestError, settings] = await catchError(listSettings());
        if (requestError) {
            error.value = describeRequestError(requestError, t('admin.indexer.providersError'));
        }
        else {
            const stored = settings.find((setting) => setting.key === 'indexer_providers')?.value;
            for (const [id, provider] of Object.entries(stored ?? {})) {
                if (providers[id])
                    providers[id] = { enabled: provider.enabled, apiKey: '', hasKey: Boolean(provider.apiKey) };
            }
            const lang = settings.find((setting) => setting.key === 'indexer_language')?.value;
            if (typeof lang === 'string')
                language.value = lang;
            error.value = '';
        }
    }
    finally {
        loading.value = false;
    }
}
async function save() {
    saving.value = true;
    try {
        const value = {};
        for (const { id, keyed, optionalKey } of INDEXER_PROVIDERS) {
            const provider = providers[id];
            const entry = { enabled: provider.enabled };
            // An empty box leaves a saved key untouched; a typed key replaces it.
            if ((keyed || optionalKey) && provider.apiKey.trim())
                entry.apiKey = provider.apiKey.trim();
            else if ((keyed || optionalKey) && provider.hasKey)
                entry.apiKey = '********';
            value[id] = entry;
        }
        const [languageError] = await catchError(updateSetting('indexer_language', language.value.trim()));
        if (languageError) {
            notify.error(describeRequestError(languageError, t('admin.indexer.providersError')));
            return;
        }
        const [providersError] = await catchError(updateSetting('indexer_providers', value));
        if (providersError) {
            notify.error(describeRequestError(providersError, t('admin.indexer.providersError')));
            return;
        }
        notify.success(t('admin.indexer.providersSaved'));
        await load();
    }
    finally {
        saving.value = false;
    }
}
onMounted(load);
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(error, {});
    __VLS_withDotValue(providers, {});
    __VLS_withDotValue(saving, {});
    const __VLS_0 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('admin.indexer.providersTitle')), description: (__VLS_unwrap(t, {})('admin.indexer.providersDescription')),
    }));
    const __VLS_2 = __VLS_1({
        title: (__VLS_unwrap(t, {})('admin.indexer.providersTitle')),
        description: (__VLS_unwrap(t, {})('admin.indexer.providersDescription')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    if (error.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            role: "alert",
            ...{ class: "mb-4 text-sm text-red-300" },
        });
        /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
        (error.value);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
        ...{ class: "divide-y divide-flixer-border overflow-hidden rounded border border-flixer-border bg-flixer-background/40" },
    });
    /** @type {__VLS_StyleScopedClasses['divide-y']} */ ;
    /** @type {__VLS_StyleScopedClasses['divide-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-background/40']} */ ;
    const __VLS_6 = __VLS_tryAsConstant((__VLS_unwrap(INDEXER_PROVIDERS, {})));
    for (const [provider] of __VLS_vFor(__VLS_nonNull(__VLS_6))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
            key: (provider.id),
            ...{ class: "px-4 py-1" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
        const __VLS_7 = AdminToggle;
        // @ts-ignore
        const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
            // @ts-ignore
            modelValue: (providers.value[provider.id].enabled), label: (__VLS_unwrap(t, {})(`admin.indexer.providerNames.${provider.id}`)), description: (provider.keyed ? undefined : provider.optionalKey ? __VLS_unwrap(t, {})('admin.indexer.optionalKeyDescription') : __VLS_unwrap(t, {})('admin.indexer.noKeyNeeded')), badge: (provider.keyed ? __VLS_unwrap(t, {})('admin.indexer.keyRequired') : undefined),
        }));
        const __VLS_9 = __VLS_8({
            modelValue: (providers.value[provider.id].enabled),
            label: (__VLS_unwrap(t, {})(`admin.indexer.providerNames.${provider.id}`)),
            description: (provider.keyed ? undefined : provider.optionalKey ? __VLS_unwrap(t, {})('admin.indexer.optionalKeyDescription') : __VLS_unwrap(t, {})('admin.indexer.noKeyNeeded')),
            badge: (provider.keyed ? __VLS_unwrap(t, {})('admin.indexer.keyRequired') : undefined),
        }, ...__VLS_functionalComponentArgsRest(__VLS_8));
        if ((provider.keyed || provider.optionalKey) && providers.value[provider.id].enabled) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "pb-3" },
            });
            /** @type {__VLS_StyleScopedClasses['pb-3']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "password",
                autocomplete: "off",
                'aria-label': (`${__VLS_unwrap(t, {})(`admin.indexer.providerNames.${provider.id}`)} ${__VLS_unwrap(t, {})('admin.indexer.apiKey')}`),
                placeholder: (providers.value[provider.id].hasKey ? '••••••••' : __VLS_unwrap(t, {})('admin.indexer.apiKeyPlaceholder')),
                ...{ class: (__VLS_unwrap(inputClass, {})) },
            });
            (providers.value[provider.id].apiKey);
            if (providers.value[provider.id].hasKey) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "mt-1.5 text-xs text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-1.5']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (__VLS_unwrap(t, {})('admin.indexer.keyStored'));
            }
            else if (provider.keyed) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "mt-1.5 text-xs text-amber-300" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-1.5']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-amber-300']} */ ;
                (__VLS_unwrap(t, {})('admin.indexer.needsKey'));
            }
        }
        // @ts-ignore
        [t, t, t, t, t, t, t, t, t, t, t, error, error, INDEXER_PROVIDERS, providers, providers, providers, providers, providers, inputClass,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-5 flex flex-wrap items-end justify-between gap-4" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-end']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "block w-40 text-xs text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-40']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('admin.indexer.language'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_unwrap(language, {})),
        type: "text",
        maxlength: "10",
        ...{ class: (__VLS_unwrap(inputClass, {})) },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (save) },
        type: "button",
        disabled: (saving.value || __VLS_unwrap(loading, {})),
        ...{ class: "rounded bg-flixer-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-50" },
    });
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-primary']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-flixer-primary/80']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
    (__VLS_unwrap(t, {})('admin.indexer.saveProviders'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-2 text-xs text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('admin.indexer.languageHint'));
    // @ts-ignore
    [t, t, t, inputClass, language, saving, loading,];
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
