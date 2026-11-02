import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AdminSkeleton from './AdminSkeleton.vue';
import { listSettings, sendTestEmail, updateSetting } from '../../api';
import { notify } from '../../composables/notify';
import { describeRequestError } from '../../composables/useProfile';
import { catchError } from '../../utils/catchError';
import AdminSection from './AdminSection.vue';
import AdminToggle from './AdminToggle.vue';
const { t } = useI18n();
const form = reactive({ host: '', port: 587, secure: false, user: '', from: '', password: '' });
const saved = ref({ host: '', port: 587, secure: false, user: '', from: '' });
const passwordSet = ref(false);
const isLoading = ref(true);
const isSaving = ref(false);
const isTesting = ref(false);
const isConfigured = computed(() => saved.value.host !== '');
const inputClass = 'mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-flixer-text';
const button = 'rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60';
function text(value) {
    return typeof value === 'string' ? value : '';
}
async function load() {
    try {
        const [error, settings] = await catchError(listSettings());
        if (error) {
            console.error('[email] failed to load settings', error);
            notify.error(describeRequestError(error, t('admin.general.emailLoadFailed')));
        }
        else {
            const values = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
            const port = Number(values.smtp_port);
            saved.value = {
                host: text(values.smtp_host),
                port: Number.isInteger(port) && port > 0 ? port : 587,
                secure: values.smtp_secure === true,
                user: text(values.smtp_user),
                from: text(values.smtp_from),
            };
            Object.assign(form, saved.value, { password: '' });
            passwordSet.value = text(values.smtp_password) !== '';
        }
    }
    finally {
        isLoading.value = false;
    }
}
async function save() {
    if (!Number.isInteger(form.port) || form.port < 1 || form.port > 65535) {
        notify.error(t('admin.general.emailPortInvalid'));
        return;
    }
    const changes = [
        ['smtp_host', form.host.trim()],
        ['smtp_port', form.port],
        ['smtp_secure', form.secure],
        ['smtp_user', form.user.trim()],
        ['smtp_from', form.from.trim()],
    ];
    if (form.password)
        changes.push(['smtp_password', form.password]);
    isSaving.value = true;
    try {
        let requestError;
        for (const [key, value] of changes) {
            const [error] = await catchError(updateSetting(key, value));
            if (error) {
                requestError = error;
                break;
            }
        }
        if (requestError) {
            console.error('[email] failed to save settings', requestError);
            notify.error(describeRequestError(requestError, t('admin.general.emailSaveFailed')));
        }
        else {
            notify.success(t('admin.general.emailSaved'));
        }
    }
    finally {
        isSaving.value = false;
        await load();
    }
}
async function sendTest() {
    isTesting.value = true;
    try {
        const [error, result] = await catchError(sendTestEmail());
        if (error) {
            console.error('[email] test email failed', error);
            notify.error(describeRequestError(error, t('admin.general.testEmailFailed')));
        }
        else {
            notify.success(t('admin.general.testEmailSent', { email: result.sentTo }));
        }
    }
    finally {
        isTesting.value = false;
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
    __VLS_withDotValue(isTesting, {});
    __VLS_withDotValue(isConfigured, {});
    __VLS_withDotValue(form, {});
    __VLS_withDotValue(passwordSet, {});
    const __VLS_0 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('admin.general.emailTitle')), description: (__VLS_unwrap(t, {})('admin.general.emailDescription')),
    }));
    const __VLS_2 = __VLS_1({
        title: (__VLS_unwrap(t, {})('admin.general.emailTitle')),
        description: (__VLS_unwrap(t, {})('admin.general.emailDescription')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    {
        const { actions: __VLS_6 } = __VLS_nonNull(__VLS_3.slots);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (sendTest) },
            type: "button",
            ...{ class: "rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15 disabled:opacity-60" },
            disabled: (isLoading.value || isTesting.value || !isConfigured.value),
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
        (__VLS_unwrap(t, {})('admin.general.sendTestEmail'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (save) },
            type: "button",
            ...{ class: (__VLS_unwrap(button, {})) },
            disabled: (isLoading.value || __VLS_unwrap(isSaving, {})),
        });
        (__VLS_unwrap(t, {})('common.save'));
        // @ts-ignore
        [t, t, t, t, isLoading, isLoading, isTesting, isConfigured, button, isSaving,];
    }
    if (isLoading.value) {
        const __VLS_7 = AdminSkeleton;
        // @ts-ignore
        const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
            // @ts-ignore
            variant: "fields", rows: (5),
        }));
        const __VLS_9 = __VLS_8({
            variant: "fields",
            rows: (5),
        }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    }
    else {
        if (!isConfigured.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mb-3 text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.general.emailNotConfigured'));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid gap-4 md:grid-cols-3" },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:grid-cols-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.general.smtpHost'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            placeholder: "smtp.yourdomain.com",
            autocomplete: "off",
            ...{ class: (__VLS_unwrap(inputClass, {})) },
        });
        (form.value.host);
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.general.smtpPort'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "number",
            min: "1",
            max: "65535",
            ...{ class: (__VLS_unwrap(inputClass, {})) },
        });
        (form.value.port);
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.general.fromAddress'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            placeholder: "Flixer &lt;no-reply@yourdomain.com&gt;",
            autocomplete: "off",
            ...{ class: (__VLS_unwrap(inputClass, {})) },
        });
        (form.value.from);
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.general.smtpUser'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            autocomplete: "off",
            ...{ class: (__VLS_unwrap(inputClass, {})) },
        });
        (form.value.user);
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.general.smtpPassword'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "password",
            autocomplete: "new-password",
            placeholder: (passwordSet.value ? __VLS_unwrap(t, {})('admin.general.smtpPasswordSet') : ''),
            ...{ class: (__VLS_unwrap(inputClass, {})) },
        });
        (form.value.password);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-3" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
        const __VLS_12 = AdminToggle;
        // @ts-ignore
        const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
            // @ts-ignore
            modelValue: (form.value.secure), label: (__VLS_unwrap(t, {})('admin.general.smtpSecure')),
        }));
        const __VLS_14 = __VLS_13({
            modelValue: (form.value.secure),
            label: (__VLS_unwrap(t, {})('admin.general.smtpSecure')),
        }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    }
    // @ts-ignore
    [t, t, t, t, t, t, t, t, isLoading, isConfigured, inputClass, inputClass, inputClass, inputClass, inputClass, form, form, form, form, form, form, passwordSet,];
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
