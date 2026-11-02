import { openModal } from '@kolirt/vue-modal';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ListSkeleton from '../ui/ListSkeleton.vue';
import { useRouter } from 'vue-router';
import { clearAccessToken, updateProfile } from '../../api';
import { notify } from '../../composables/notify';
import { describeRequestError, useProfile } from '../../composables/useProfile';
import { catchError } from '../../utils/catchError';
import TextInput from '../ui/TextInput.vue';
import AvatarUploader from './AvatarUploader.vue';
import DeleteAccountModal from './DeleteAccountModal.vue';
import PasswordSection from './PasswordSection.vue';
import PrivacySection from './PrivacySection.vue';
const router = useRouter();
const { t } = useI18n();
const { profile, load, setProfile, clear } = useProfile();
async function confirmDeleteAccount() {
    const deleted = await openModal(DeleteAccountModal).catch(() => false);
    if (deleted) {
        clearAccessToken();
        clear();
        notify.success(t('settings.profile.accountDeleted'));
        await router.replace({ name: 'login' });
    }
}
const displayName = ref('');
const email = ref('');
const isLoading = ref(true);
const isSaving = ref(false);
watch(profile, (value) => {
    if (value) {
        displayName.value = value.displayName;
        email.value = value.email ?? '';
    }
}, { immediate: true });
void load(true).finally(() => {
    isLoading.value = false;
});
async function save() {
    isSaving.value = true;
    try {
        const changes = { displayName: displayName.value };
        if (email.value && email.value !== profile.value?.email) {
            changes.email = email.value;
        }
        const emailChanged = Boolean(changes.email);
        const [error, updated] = await catchError(updateProfile(changes));
        if (error) {
            console.error('[settings] profile update failed', error);
            notify.error(describeRequestError(error, t('settings.profile.updateFailed')));
        }
        else {
            setProfile(updated);
            email.value = updated.email ?? '';
            notify.success(emailChanged && updated.pendingEmail ? t('settings.profile.emailVerificationSent', { email: updated.pendingEmail }) : t('settings.profile.updated'));
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
    __VLS_withDotValue(isLoading, {});
    __VLS_withDotValue(profile, {});
    __VLS_withDotValue(isSaving, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-12" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:grid-cols-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:gap-12']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        'aria-labelledby': "profile-heading",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
        id: "profile-heading",
        ...{ class: "text-lg font-semibold" },
    });
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    (__VLS_unwrap(t, {})('settings.profile.title'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-1 text-sm text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('settings.profile.description'));
    if (isLoading.value && !profile.value) {
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
        __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
            ...{ onSubmit: (save) },
            ...{ class: "mt-6 flex flex-col gap-5" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-5']} */ ;
        const __VLS_5 = AvatarUploader;
        // @ts-ignore
        const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
        // @ts-ignore
        }));
        const __VLS_7 = __VLS_6({}, ...__VLS_functionalComponentArgsRest(__VLS_6));
        const __VLS_10 = TextInput;
        // @ts-ignore
        const __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({
            // @ts-ignore
            modelValue: (__VLS_unwrap(displayName, {})), label: (__VLS_unwrap(t, {})('settings.profile.displayName')), type: "text", maxlength: "64", required: true, autocomplete: "nickname",
        }));
        const __VLS_12 = __VLS_11({
            modelValue: (__VLS_unwrap(displayName, {})),
            label: (__VLS_unwrap(t, {})('settings.profile.displayName')),
            type: "text",
            maxlength: "64",
            required: true,
            autocomplete: "nickname",
        }, ...__VLS_functionalComponentArgsRest(__VLS_11));
        const __VLS_15 = TextInput;
        // @ts-ignore
        const __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
            // @ts-ignore
            modelValue: (profile.value?.username ?? ''), label: (__VLS_unwrap(t, {})('settings.profile.username')), type: "text", disabled: true,
        }));
        const __VLS_17 = __VLS_16({
            modelValue: (profile.value?.username ?? ''),
            label: (__VLS_unwrap(t, {})('settings.profile.username')),
            type: "text",
            disabled: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_16));
        const __VLS_20 = TextInput;
        // @ts-ignore
        const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
            // @ts-ignore
            modelValue: (__VLS_unwrap(email, {})), modelModifiers: { trim: true, }, label: (__VLS_unwrap(t, {})('settings.profile.email')), type: "email", maxlength: "254", autocomplete: "email", autocapitalize: "none", hint: (profile.value?.pendingEmail ? __VLS_unwrap(t, {})('settings.profile.pendingEmailHint', { email: profile.value.pendingEmail }) : undefined),
        }));
        const __VLS_22 = __VLS_21({
            modelValue: (__VLS_unwrap(email, {})),
            modelModifiers: { trim: true, },
            label: (__VLS_unwrap(t, {})('settings.profile.email')),
            type: "email",
            maxlength: "254",
            autocomplete: "email",
            autocapitalize: "none",
            hint: (profile.value?.pendingEmail ? __VLS_unwrap(t, {})('settings.profile.pendingEmailHint', { email: profile.value.pendingEmail }) : undefined),
        }, ...__VLS_functionalComponentArgsRest(__VLS_21));
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
        (isSaving.value ? __VLS_unwrap(t, {})('settings.profile.saving') : __VLS_unwrap(t, {})('common.save'));
    }
    const __VLS_25 = PasswordSection;
    // @ts-ignore
    const __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25({
    // @ts-ignore
    }));
    const __VLS_27 = __VLS_26({}, ...__VLS_functionalComponentArgsRest(__VLS_26));
    const __VLS_30 = PrivacySection;
    // @ts-ignore
    const __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({
    // @ts-ignore
    }));
    const __VLS_32 = __VLS_31({}, ...__VLS_functionalComponentArgsRest(__VLS_31));
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "rounded border border-rose-400/20 bg-rose-400/5 p-5 lg:col-span-2" },
        'aria-labelledby': "danger-heading",
    });
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-rose-400/20']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-rose-400/5']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:col-span-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
        id: "danger-heading",
        ...{ class: "text-lg font-semibold text-rose-200" },
    });
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-rose-200']} */ ;
    (__VLS_unwrap(t, {})('settings.profile.deleteAccountTitle'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-1 text-sm text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('settings.profile.deleteAccountDescription'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (confirmDeleteAccount) },
        type: "button",
        ...{ class: "mt-4 flex h-11 items-center justify-center rounded border border-rose-400/40 px-6 text-sm font-semibold text-rose-200 transition hover:bg-rose-400/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-11']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-rose-400/40']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-rose-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-rose-400/10']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-offset-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-rose-300']} */ ;
    (__VLS_unwrap(t, {})('settings.profile.deleteAccountButton'));
    // @ts-ignore
    [t, t, t, t, t, t, t, t, t, t, t, isLoading, profile, profile, profile, profile, displayName, email, isSaving, isSaving,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
