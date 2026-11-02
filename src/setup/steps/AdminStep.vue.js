import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { getAccessToken, register, saveAccessToken } from '../../api';
import TextInput from '../../components/ui/TextInput.vue';
import SetupNotice from '../SetupNotice.vue';
import StepFrame from '../StepFrame.vue';
import { useStepForm } from '../useStepForm';
const { defineExpose, } = {};
const { t } = useI18n();
const { wizard, busy, message, save, run } = useStepForm('admin');
const exists = wizard.progress.value.adminExists && getAccessToken() !== null;
const username = ref('');
const displayName = ref('');
const email = ref('');
const password = ref('');
const confirm = ref('');
async function submit() {
    if (exists)
        return (await save({})) !== null;
    if (password.value !== confirm.value) {
        message.value = t('setup.admin.mismatch');
        return false;
    }
    const created = await run(() => register(username.value.trim(), password.value, email.value.trim(), displayName.value.trim() || undefined));
    if (!created)
        return false;
    if (!('accessToken' in created)) {
        message.value = t('setup.admin.verification');
        return false;
    }
    saveAccessToken(created.accessToken);
    return (await save({})) !== null;
}
const __VLS_exposed = { submit };
defineExpose(__VLS_exposed);
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(exists, {});
    __VLS_withDotValue(wizard, {});
    __VLS_withDotValue(message, {});
    const __VLS_0 = StepFrame || StepFrame;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('setup.admin.title')), description: (__VLS_unwrap(t, {})('setup.admin.description')),
    }));
    const __VLS_2 = __VLS_1({
        title: (__VLS_unwrap(t, {})('setup.admin.title')),
        description: (__VLS_unwrap(t, {})('setup.admin.description')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    if (exists.value) {
        const __VLS_6 = SetupNotice || SetupNotice;
        // @ts-ignore
        const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
            // @ts-ignore
            kind: "success",
        }));
        const __VLS_8 = __VLS_7({
            kind: "success",
        }, ...__VLS_functionalComponentArgsRest(__VLS_7));
        var __VLS_9;
        const { default: __VLS_11 } = __VLS_nonNull(__VLS_9.slots);
        (__VLS_unwrap(t, {})('setup.admin.exists'));
        // @ts-ignore
        [t, t, t, exists,];
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
            ...{ onSubmit: (...[$event]) => {
                    void $event;
                    if (!!(exists.value))
                        throw 0;
                    return (wizard.value.advance());
                    // @ts-ignore
                    [wizard,];
                } },
            ...{ class: "flex flex-col gap-4" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
        const __VLS_12 = TextInput;
        // @ts-ignore
        const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
            // @ts-ignore
            modelValue: (__VLS_unwrap(username, {})), modelModifiers: { trim: true, }, label: (__VLS_unwrap(t, {})('auth.username')), autocomplete: "username", autocapitalize: "none", spellcheck: "false", maxlength: "64", disabled: (__VLS_unwrap(busy, {})),
        }));
        const __VLS_14 = __VLS_13({
            modelValue: (__VLS_unwrap(username, {})),
            modelModifiers: { trim: true, },
            label: (__VLS_unwrap(t, {})('auth.username')),
            autocomplete: "username",
            autocapitalize: "none",
            spellcheck: "false",
            maxlength: "64",
            disabled: (__VLS_unwrap(busy, {})),
        }, ...__VLS_functionalComponentArgsRest(__VLS_13));
        const __VLS_17 = TextInput;
        // @ts-ignore
        const __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({
            // @ts-ignore
            modelValue: (__VLS_unwrap(displayName, {})), label: (__VLS_unwrap(t, {})('auth.displayName')), autocomplete: "nickname", maxlength: "64", disabled: (__VLS_unwrap(busy, {})),
        }));
        const __VLS_19 = __VLS_18({
            modelValue: (__VLS_unwrap(displayName, {})),
            label: (__VLS_unwrap(t, {})('auth.displayName')),
            autocomplete: "nickname",
            maxlength: "64",
            disabled: (__VLS_unwrap(busy, {})),
        }, ...__VLS_functionalComponentArgsRest(__VLS_18));
        const __VLS_22 = TextInput;
        // @ts-ignore
        const __VLS_23 = __VLS_asFunctionalComponent1(__VLS_22, new __VLS_22({
            // @ts-ignore
            modelValue: (__VLS_unwrap(email, {})), modelModifiers: { trim: true, }, type: "email", label: (__VLS_unwrap(t, {})('auth.email')), autocomplete: "email", maxlength: "254", disabled: (__VLS_unwrap(busy, {})),
        }));
        const __VLS_24 = __VLS_23({
            modelValue: (__VLS_unwrap(email, {})),
            modelModifiers: { trim: true, },
            type: "email",
            label: (__VLS_unwrap(t, {})('auth.email')),
            autocomplete: "email",
            maxlength: "254",
            disabled: (__VLS_unwrap(busy, {})),
        }, ...__VLS_functionalComponentArgsRest(__VLS_23));
        const __VLS_27 = TextInput;
        // @ts-ignore
        const __VLS_28 = __VLS_asFunctionalComponent1(__VLS_27, new __VLS_27({
            // @ts-ignore
            modelValue: (__VLS_unwrap(password, {})), type: "password", label: (__VLS_unwrap(t, {})('auth.password')), hint: (__VLS_unwrap(t, {})('auth.passwordGuidance')), autocomplete: "new-password", minlength: "8", maxlength: "128", disabled: (__VLS_unwrap(busy, {})),
        }));
        const __VLS_29 = __VLS_28({
            modelValue: (__VLS_unwrap(password, {})),
            type: "password",
            label: (__VLS_unwrap(t, {})('auth.password')),
            hint: (__VLS_unwrap(t, {})('auth.passwordGuidance')),
            autocomplete: "new-password",
            minlength: "8",
            maxlength: "128",
            disabled: (__VLS_unwrap(busy, {})),
        }, ...__VLS_functionalComponentArgsRest(__VLS_28));
        const __VLS_32 = TextInput;
        // @ts-ignore
        const __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({
            // @ts-ignore
            modelValue: (__VLS_unwrap(confirm, {})), type: "password", label: (__VLS_unwrap(t, {})('setup.admin.confirm')), autocomplete: "new-password", maxlength: "128", disabled: (__VLS_unwrap(busy, {})),
        }));
        const __VLS_34 = __VLS_33({
            modelValue: (__VLS_unwrap(confirm, {})),
            type: "password",
            label: (__VLS_unwrap(t, {})('setup.admin.confirm')),
            autocomplete: "new-password",
            maxlength: "128",
            disabled: (__VLS_unwrap(busy, {})),
        }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    }
    if (message.value) {
        const __VLS_37 = SetupNotice || SetupNotice;
        // @ts-ignore
        const __VLS_38 = __VLS_asFunctionalComponent1(__VLS_37, new __VLS_37({
            // @ts-ignore
            kind: "error",
        }));
        const __VLS_39 = __VLS_38({
            kind: "error",
        }, ...__VLS_functionalComponentArgsRest(__VLS_38));
        var __VLS_40;
        const { default: __VLS_42 } = __VLS_nonNull(__VLS_40.slots);
        (message.value);
        // @ts-ignore
        [t, t, t, t, t, t, username, busy, busy, busy, busy, busy, displayName, email, password, confirm, message, message,];
    }
    // @ts-ignore
    [];
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    setup: () => __VLS_exposed,
});
export default {};
