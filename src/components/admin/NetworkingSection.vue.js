import { onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { applyStep, describeFailure, getProgress } from '../../setup/setupApi';
import { notify } from '../../composables/notify';
import AdminSection from './AdminSection.vue';
import AdminSkeleton from './AdminSkeleton.vue';
import { catchError } from '../../utils/catchError';
const FIELDS = ['publicUrl', 'appUrl', 'passkeyRpId', 'passkeyOrigins'];
const { t } = useI18n();
const config = ref({});
const form = reactive({ publicUrl: '', appUrl: '', passkeyRpId: '', passkeyOrigins: '' });
const errors = reactive({});
const isLoading = ref(true);
const isSaving = ref(false);
const inputClass = 'mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 font-mono text-sm text-flixer-text disabled:opacity-60';
const button = 'rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60';
const fields = [
    { id: 'publicUrl', label: 'admin.general.publicAddress', hint: 'admin.general.publicAddressHint', placeholder: 'https://flixer.example.com/api' },
    { id: 'appUrl', label: 'admin.general.appAddress', hint: 'admin.general.appAddressHint', placeholder: 'https://flixer.example.com' },
    { id: 'passkeyRpId', label: 'admin.general.passkeyDomain', hint: 'admin.general.passkeyDomainHint', placeholder: 'flixer.example.com' },
    { id: 'passkeyOrigins', label: 'admin.general.passkeyOrigins', hint: 'admin.general.passkeyOriginsHint', placeholder: 'https://flixer.example.com', wide: true },
];
async function load() {
    try {
        const [error, progress] = await catchError(getProgress());
        if (error) {
            console.error('[networking] failed to load addresses', error);
            notify.error(describeFailure(error, t('admin.general.networkingLoadFailed')).message);
        }
        else {
            config.value = progress.config;
            for (const field of FIELDS)
                form[field] = config.value[field]?.value ?? '';
        }
    }
    finally {
        isLoading.value = false;
    }
}
async function save() {
    for (const key of Object.keys(errors))
        delete errors[key];
    isSaving.value = true;
    try {
        const [error] = await catchError(applyStep('urls', { ...form }));
        if (error) {
            const failure = describeFailure(error, t('admin.general.networkingSaveFailed'));
            Object.assign(errors, failure.fields);
            notify.error(failure.message);
        }
        else {
            notify.success(t('admin.general.networkingSaved'));
            await load();
        }
    }
    finally {
        isSaving.value = false;
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
    __VLS_withDotValue(form, {});
    __VLS_withDotValue(config, {});
    __VLS_withDotValue(errors, {});
    const __VLS_0 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('admin.general.networkingTitle')), description: (__VLS_unwrap(t, {})('admin.general.networkingDescription')),
    }));
    const __VLS_2 = __VLS_1({
        title: (__VLS_unwrap(t, {})('admin.general.networkingTitle')),
        description: (__VLS_unwrap(t, {})('admin.general.networkingDescription')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    {
        const { actions: __VLS_6 } = __VLS_nonNull(__VLS_3.slots);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (save) },
            type: "button",
            ...{ class: (__VLS_unwrap(button, {})) },
            disabled: (isLoading.value || __VLS_unwrap(isSaving, {})),
        });
        (__VLS_unwrap(t, {})('common.save'));
        // @ts-ignore
        [t, t, t, button, isLoading, isSaving,];
    }
    if (isLoading.value) {
        const __VLS_7 = AdminSkeleton;
        // @ts-ignore
        const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
            // @ts-ignore
            variant: "fields", rows: (4),
        }));
        const __VLS_9 = __VLS_8({
            variant: "fields",
            rows: (4),
        }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid gap-4 md:grid-cols-2" },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:grid-cols-2']} */ ;
        const __VLS_12 = __VLS_tryAsConstant((__VLS_unwrap(fields, {})));
        for (const [field] of __VLS_vFor(__VLS_nonNull(__VLS_12))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                key: (field.id),
                ...{ class: "text-xs text-flixer-muted" },
                ...{ class: ({ 'md:col-span-2': field.wide }) },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            /** @type {__VLS_StyleScopedClasses['md:col-span-2']} */ ;
            (__VLS_unwrap(t, {})(field.label));
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                value: (form.value[field.id]),
                type: "text",
                autocomplete: "off",
                spellcheck: "false",
                placeholder: (field.placeholder),
                disabled: (config.value[field.id]?.locked),
                ...{ class: (__VLS_unwrap(inputClass, {})) },
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "mt-1 block" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['block']} */ ;
            (config.value[field.id]?.locked ? __VLS_unwrap(t, {})('admin.connections.environment') : __VLS_unwrap(t, {})(field.hint));
            if (errors.value[field.id]) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    role: "alert",
                    ...{ class: "mt-1 block text-red-300" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['block']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
                (errors.value[field.id]);
            }
            // @ts-ignore
            [t, t, t, isLoading, fields, form, config, config, inputClass, errors, errors,];
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
