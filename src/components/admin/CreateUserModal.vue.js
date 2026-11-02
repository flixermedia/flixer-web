import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal';
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { createAdminUser } from '../../api';
import { notify } from '../../composables/notify';
import { describeRequestError } from '../../composables/useProfile';
import { catchError } from '../../utils/catchError';
import TextInput from '../ui/TextInput.vue';
import AdminToggle from './AdminToggle.vue';
const { defineOptions, } = {};
defineOptions({ modalGroup: 'default' });
const { close, confirm } = useModalContext();
const { t } = useI18n();
const busy = ref(false);
const form = reactive({ username: '', displayName: '', email: '', password: '', role: 'user' });
async function submit() {
    busy.value = true;
    try {
        const [error, created] = await catchError(createAdminUser({
            username: form.username.trim(),
            displayName: form.displayName.trim() || undefined,
            email: form.email.trim(),
            password: form.password,
            role: form.role,
        }));
        if (error) {
            console.error('[users] create failed', error);
            notify.error(describeRequestError(error, t('admin.users.createError')));
        }
        else {
            notify.success(t('admin.users.created', { name: created.displayName }));
            confirm(true);
        }
    }
    finally {
        busy.value = false;
    }
}
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(form, {});
    let __VLS_0;
    /** @ts-ignore @type { | typeof ModalRoot | typeof ModalRoot} */
    ModalRoot;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        ...{ class: "flex items-center justify-center p-4" },
    }));
    const __VLS_2 = __VLS_1({
        ...{ class: "flex items-center justify-center p-4" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    let __VLS_6;
    /** @ts-ignore @type { | typeof ModalContent | typeof ModalContent} */
    ModalContent;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
        // @ts-ignore
        ...{ class: "flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col rounded border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60" },
    }));
    const __VLS_8 = __VLS_7({
        ...{ class: "flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col rounded border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    /** @type {__VLS_StyleScopedClasses['flixer-modal-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-h-[calc(100dvh-2rem)]']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-black/60']} */ ;
    var __VLS_9;
    const { default: __VLS_11 } = __VLS_nonNull(__VLS_9.slots);
    let __VLS_12;
    /** @ts-ignore @type { | typeof ModalTitle | typeof ModalTitle} */
    ModalTitle;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
        // @ts-ignore
        ...{ class: "shrink-0 text-lg font-semibold" },
    }));
    const __VLS_14 = __VLS_13({
        ...{ class: "shrink-0 text-lg font-semibold" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    var __VLS_15;
    const { default: __VLS_17 } = __VLS_nonNull(__VLS_15.slots);
    (__VLS_unwrap(t, {})('admin.users.createTitle'));
    // @ts-ignore
    [t,];
    let __VLS_18;
    /** @ts-ignore @type { | typeof ModalDescription | typeof ModalDescription} */
    ModalDescription;
    // @ts-ignore
    const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
        // @ts-ignore
        ...{ class: "mt-1 shrink-0 text-sm leading-6 text-flixer-muted" },
    }));
    const __VLS_20 = __VLS_19({
        ...{ class: "mt-1 shrink-0 text-sm leading-6 text-flixer-muted" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_19));
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['leading-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    var __VLS_21;
    const { default: __VLS_23 } = __VLS_nonNull(__VLS_21.slots);
    (__VLS_unwrap(t, {})('admin.users.createDescription'));
    // @ts-ignore
    [t,];
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (submit) },
        ...{ class: "mt-5 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-h-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['overscroll-contain']} */ ;
    /** @type {__VLS_StyleScopedClasses['[scrollbar-width:none]']} */ ;
    /** @type {__VLS_StyleScopedClasses['[&::-webkit-scrollbar]:hidden']} */ ;
    const __VLS_24 = TextInput;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
        // @ts-ignore
        modelValue: (form.value.username), label: (__VLS_unwrap(t, {})('admin.users.username')), name: "username", required: true, minlength: "3", maxlength: "64", pattern: "\u005b\u0061\u002d\u007a\u0041\u002d\u005a\u0030\u002d\u0039\u005f\u002e\u005c\u002d\u005d\u002b", autocomplete: "off", autofocus: true,
    }));
    const __VLS_26 = __VLS_25({
        modelValue: (form.value.username),
        label: (__VLS_unwrap(t, {})('admin.users.username')),
        name: "username",
        required: true,
        minlength: "3",
        maxlength: "64",
        pattern: "\u005b\u0061\u002d\u007a\u0041\u002d\u005a\u0030\u002d\u0039\u005f\u002e\u005c\u002d\u005d\u002b",
        autocomplete: "off",
        autofocus: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
    const __VLS_29 = TextInput;
    // @ts-ignore
    const __VLS_30 = __VLS_asFunctionalComponent1(__VLS_29, new __VLS_29({
        // @ts-ignore
        modelValue: (form.value.displayName), label: (__VLS_unwrap(t, {})('admin.users.displayName')), name: "displayName", maxlength: "64", autocomplete: "off",
    }));
    const __VLS_31 = __VLS_30({
        modelValue: (form.value.displayName),
        label: (__VLS_unwrap(t, {})('admin.users.displayName')),
        name: "displayName",
        maxlength: "64",
        autocomplete: "off",
    }, ...__VLS_functionalComponentArgsRest(__VLS_30));
    const __VLS_34 = TextInput;
    // @ts-ignore
    const __VLS_35 = __VLS_asFunctionalComponent1(__VLS_34, new __VLS_34({
        // @ts-ignore
        modelValue: (form.value.email), label: (__VLS_unwrap(t, {})('admin.users.email')), type: "email", name: "email", required: true, maxlength: "254", autocomplete: "off",
    }));
    const __VLS_36 = __VLS_35({
        modelValue: (form.value.email),
        label: (__VLS_unwrap(t, {})('admin.users.email')),
        type: "email",
        name: "email",
        required: true,
        maxlength: "254",
        autocomplete: "off",
    }, ...__VLS_functionalComponentArgsRest(__VLS_35));
    const __VLS_39 = TextInput;
    // @ts-ignore
    const __VLS_40 = __VLS_asFunctionalComponent1(__VLS_39, new __VLS_39({
        // @ts-ignore
        modelValue: (form.value.password), label: (__VLS_unwrap(t, {})('admin.users.password')), hint: (__VLS_unwrap(t, {})('admin.users.passwordHint')), type: "password", name: "newUserPassword", required: true, minlength: "8", maxlength: "128", autocomplete: "new-password",
    }));
    const __VLS_41 = __VLS_40({
        modelValue: (form.value.password),
        label: (__VLS_unwrap(t, {})('admin.users.password')),
        hint: (__VLS_unwrap(t, {})('admin.users.passwordHint')),
        type: "password",
        name: "newUserPassword",
        required: true,
        minlength: "8",
        maxlength: "128",
        autocomplete: "new-password",
    }, ...__VLS_functionalComponentArgsRest(__VLS_40));
    const __VLS_44 = AdminToggle;
    // @ts-ignore
    const __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44({
        // @ts-ignore
        ...{ 'onUpdate:modelValue': {} }, modelValue: (form.value.role === 'admin'), label: (__VLS_unwrap(t, {})('admin.users.administrator')), description: (__VLS_unwrap(t, {})('admin.users.fullDashboardAccess')),
    }));
    const __VLS_46 = __VLS_45({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (form.value.role === 'admin'),
        label: (__VLS_unwrap(t, {})('admin.users.administrator')),
        description: (__VLS_unwrap(t, {})('admin.users.fullDashboardAccess')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_45));
    let __VLS_49;
    const __VLS_50 = {
        /** @type {typeof __VLS_49.'update:modelValue'} */
        'onUpdate:modelValue': (...[$event]) => {
            void $event;
            return (form.value.role = $event ? 'admin' : 'user');
            // @ts-ignore
            [t, t, t, t, t, t, t, form, form, form, form, form, form,];
        },
    };
    void __VLS_50;
    var __VLS_47;
    var __VLS_48;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-col-reverse gap-3 sm:flex-row sm:justify-end" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col-reverse']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:flex-row']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:justify-end']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                void $event;
                return (__VLS_unwrap(close, {})());
                // @ts-ignore
                [close,];
            } },
        type: "button",
        ...{ class: "flex h-11 items-center justify-center rounded border border-flixer-border px-6 text-sm font-semibold text-flixer-text transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" },
        disabled: (__VLS_unwrap(busy, {})),
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-11']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-white/5']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-offset-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    (__VLS_unwrap(t, {})('common.cancel'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        type: "submit",
        ...{ class: "flex h-11 items-center justify-center rounded bg-flixer-primary px-6 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:opacity-60" },
        disabled: (__VLS_unwrap(busy, {})),
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-11']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-primary']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:brightness-110']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-offset-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
    (__VLS_unwrap(t, {})('admin.users.create'));
    // @ts-ignore
    [t, t, busy, busy,];
    // @ts-ignore
    [];
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
