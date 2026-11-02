import { onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { listSettings, updateSetting } from '../../api';
import { notify } from '../../composables/notify';
import { describeRequestError } from '../../composables/useProfile';
import { catchError } from '../../utils/catchError';
import AdminSection from './AdminSection.vue';
import AdminSkeleton from './AdminSkeleton.vue';
const { t } = useI18n();
const form = reactive({ name: '', banner: '' });
const saved = reactive({ name: '', banner: '' });
const isLoading = ref(true);
const isSaving = ref(false);
const inputClass = 'mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-flixer-text';
const button = 'rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60';
function text(value) {
    return typeof value === 'string' ? value : '';
}
async function load() {
    try {
        const [error, settings] = await catchError(listSettings());
        if (error) {
            console.error('[server] failed to load settings', error);
            notify.error(describeRequestError(error, t('admin.general.serverLoadFailed')));
        }
        else {
            const values = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
            saved.name = text(values.server_name);
            saved.banner = text(values.login_banner);
            Object.assign(form, { name: saved.name, banner: saved.banner });
        }
    }
    finally {
        isLoading.value = false;
    }
}
async function save() {
    isSaving.value = true;
    try {
        let requestError;
        if (form.name.trim() !== saved.name) {
            ;
            [requestError] = await catchError(updateSetting('server_name', form.name.trim() || null));
        }
        if (!requestError && form.banner.trim() !== saved.banner) {
            ;
            [requestError] = await catchError(updateSetting('login_banner', form.banner.trim()));
        }
        if (requestError) {
            console.error('[server] failed to save settings', requestError);
            notify.error(describeRequestError(requestError, t('admin.general.serverSaveFailed')));
        }
        else {
            notify.success(t('admin.general.serverSaved'));
        }
    }
    finally {
        isSaving.value = false;
        await load();
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
    const __VLS_0 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('admin.general.title')), description: (__VLS_unwrap(t, {})('admin.general.description')),
    }));
    const __VLS_2 = __VLS_1({
        title: (__VLS_unwrap(t, {})('admin.general.title')),
        description: (__VLS_unwrap(t, {})('admin.general.description')),
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
            variant: "fields", rows: (2),
        }));
        const __VLS_9 = __VLS_8({
            variant: "fields",
            rows: (2),
        }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid gap-4" },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.general.serverName'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            maxlength: "100",
            autocomplete: "off",
            ...{ class: (__VLS_unwrap(inputClass, {})) },
        });
        (form.value.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.general.loginBanner'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
            value: (form.value.banner),
            rows: "3",
            maxlength: "500",
            ...{ class: (__VLS_unwrap(inputClass, {})) },
            placeholder: (__VLS_unwrap(t, {})('admin.general.loginBannerPlaceholder')),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "mt-1 block" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        (__VLS_unwrap(t, {})('admin.general.loginBannerHint'));
    }
    // @ts-ignore
    [t, t, t, t, isLoading, inputClass, inputClass, form, form,];
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
