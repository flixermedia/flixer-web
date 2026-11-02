import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { changePassword } from '../../api';
import { notify } from '../../composables/notify';
import { describeRequestError } from '../../composables/useProfile';
import { catchError } from '../../utils/catchError';
import TextInput from '../ui/TextInput.vue';
const { t } = useI18n();
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const isSaving = ref(false);
async function save() {
    if (newPassword.value !== confirmPassword.value) {
        notify.error(t('settings.password.passwordsMismatch'));
        return;
    }
    isSaving.value = true;
    try {
        const [error] = await catchError(changePassword(currentPassword.value, newPassword.value));
        if (error) {
            console.error('[settings] password change failed', error);
            notify.error(describeRequestError(error, t('settings.password.changeFailed')));
        }
        else {
            currentPassword.value = '';
            newPassword.value = '';
            confirmPassword.value = '';
            notify.success(t('settings.password.changed'));
        }
    }
    finally {
        isSaving.value = false;
    }
}
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(isSaving, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        'aria-labelledby': "password-heading",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
        id: "password-heading",
        ...{ class: "text-lg font-semibold" },
    });
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    (__VLS_unwrap(t, {})('settings.password.title'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-1 text-sm text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('settings.password.description'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (save) },
        ...{ class: "mt-6 flex flex-col gap-5" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-5']} */ ;
    const __VLS_0 = TextInput;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        modelValue: (__VLS_unwrap(currentPassword, {})), label: (__VLS_unwrap(t, {})('settings.password.currentPassword')), type: "password", name: "currentPassword", autocomplete: "current-password", maxlength: "128", required: true,
    }));
    const __VLS_2 = __VLS_1({
        modelValue: (__VLS_unwrap(currentPassword, {})),
        label: (__VLS_unwrap(t, {})('settings.password.currentPassword')),
        type: "password",
        name: "currentPassword",
        autocomplete: "current-password",
        maxlength: "128",
        required: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    const __VLS_5 = TextInput;
    // @ts-ignore
    const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
        // @ts-ignore
        modelValue: (__VLS_unwrap(newPassword, {})), label: (__VLS_unwrap(t, {})('settings.password.newPassword')), type: "password", name: "newPassword", autocomplete: "new-password", minlength: "8", maxlength: "128", required: true,
    }));
    const __VLS_7 = __VLS_6({
        modelValue: (__VLS_unwrap(newPassword, {})),
        label: (__VLS_unwrap(t, {})('settings.password.newPassword')),
        type: "password",
        name: "newPassword",
        autocomplete: "new-password",
        minlength: "8",
        maxlength: "128",
        required: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_6));
    const __VLS_10 = TextInput;
    // @ts-ignore
    const __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({
        // @ts-ignore
        modelValue: (__VLS_unwrap(confirmPassword, {})), label: (__VLS_unwrap(t, {})('settings.password.confirmPassword')), type: "password", name: "confirmPassword", autocomplete: "new-password", minlength: "8", maxlength: "128", required: true,
    }));
    const __VLS_12 = __VLS_11({
        modelValue: (__VLS_unwrap(confirmPassword, {})),
        label: (__VLS_unwrap(t, {})('settings.password.confirmPassword')),
        type: "password",
        name: "confirmPassword",
        autocomplete: "new-password",
        minlength: "8",
        maxlength: "128",
        required: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_11));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        type: "submit",
        ...{ class: "flex h-12 w-fit items-center justify-center rounded bg-gradient-to-r from-flixer-primary to-flixer-secondary px-8 text-sm font-semibold text-white shadow-lg shadow-flixer-primary/20 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-wait disabled:opacity-60" },
        disabled: (isSaving.value),
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-fit']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-gradient-to-r']} */ ;
    /** @type {__VLS_StyleScopedClasses['from-flixer-primary']} */ ;
    /** @type {__VLS_StyleScopedClasses['to-flixer-secondary']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-flixer-primary/20']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:brightness-110']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-offset-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled:cursor-wait']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
    (isSaving.value ? __VLS_unwrap(t, {})('settings.password.changing') : __VLS_unwrap(t, {})('settings.password.title'));
    // @ts-ignore
    [t, t, t, t, t, t, t, currentPassword, newPassword, confirmPassword, isSaving, isSaving,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
