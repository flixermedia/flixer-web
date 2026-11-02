import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { browserSupportsWebAuthn } from '@simplewebauthn/browser';
import { isNativeApp } from '../../platform/serverConnection';
import AuthField from './AuthField.vue';
const { defineProps, defineEmits, } = {};
const passkeysSupported = isNativeApp() || browserSupportsWebAuthn();
const { t } = useI18n();
const props = defineProps();
const emit = defineEmits();
const username = ref(props.initialUsername ?? '');
const password = ref('');
const isPasswordVisible = ref(false);
const rememberBiometric = ref(false);
watch(() => props.initialUsername, (value) => {
    if (!username.value && value)
        username.value = value;
});
function handleSubmit() {
    emit('submit', { username: username.value, password: password.value, rememberBiometric: rememberBiometric.value });
}
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(isPasswordVisible, {});
    __VLS_withDotValue(passkeysSupported, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        'data-haptic': true,
        ...{ class: "w-full" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "text-[9px] font-bold tracking-[0.2em] text-flixer-accent" },
    });
    /** @type {__VLS_StyleScopedClasses['text-[9px]']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-[0.2em]']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
    (__VLS_unwrap(t, {})('auth.loginEyebrow'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
        id: "login-title",
        ...{ class: "mt-3 text-3xl font-semibold tracking-tight text-flixer-text sm:text-4xl" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-tight']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:text-4xl']} */ ;
    (__VLS_unwrap(t, {})('auth.welcomeBack'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "text-flixer-accent" },
    });
    /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-2 text-sm text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('auth.signInDescription'));
    if (__VLS_ctx.sessionCheckUnavailable) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.output, __VLS_intrinsics.output)({
            ...{ class: "mt-4 block rounded border border-flixer-accent/20 bg-flixer-primary/10 px-4 py-3 text-sm leading-6 text-flixer-accent" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-accent/20']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-primary/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['leading-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
        (__VLS_unwrap(t, {})('auth.sessionCheckUnavailable'));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (handleSubmit) },
        ...{ class: "mt-8 flex flex-col" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    const __VLS_0 = AuthField || AuthField;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        id: "login-username", label: (__VLS_unwrap(t, {})('auth.username')),
    }));
    const __VLS_2 = __VLS_1({
        id: "login-username",
        label: (__VLS_unwrap(t, {})('auth.username')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    {
        const { icon: __VLS_6 } = __VLS_nonNull(__VLS_3.slots);
        let __VLS_7;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
            // @ts-ignore
            icon: "lucide:user-round", ...{ class: "ml-4 size-[18px] shrink-0 text-flixer-muted" }, 'aria-hidden': "true",
        }));
        const __VLS_9 = __VLS_8({
            icon: "lucide:user-round",
            ...{ class: "ml-4 size-[18px] shrink-0 text-flixer-muted" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_8));
        /** @type {__VLS_StyleScopedClasses['ml-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-[18px]']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        // @ts-ignore
        [t, t, t, t, t, sessionCheckUnavailable,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_unwrap(username, {})),
        type: "text",
        name: "username",
        'aria-label': (__VLS_unwrap(t, {})('auth.username')),
        placeholder: (__VLS_unwrap(t, {})('auth.usernamePlaceholder')),
        autocomplete: "username",
        autocapitalize: "none",
        autocorrect: "off",
        spellcheck: "false",
        minlength: "3",
        maxlength: "64",
        pattern: "\u005b\u0061\u002d\u007a\u0041\u002d\u005a\u0030\u002d\u0039\u005f\u002e\u005c\u002d\u005d\u002b",
        ...{ class: "h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-flixer-text outline-none placeholder:text-flixer-muted/70" },
        required: true,
    });
    /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-transparent']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
    /** @type {__VLS_StyleScopedClasses['outline-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['placeholder:text-flixer-muted/70']} */ ;
    // @ts-ignore
    [t, t, username,];
    const __VLS_12 = AuthField || AuthField;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
        // @ts-ignore
        id: "login-password", ...{ class: "mt-5" }, label: (__VLS_unwrap(t, {})('auth.password')),
    }));
    const __VLS_14 = __VLS_13({
        id: "login-password",
        ...{ class: "mt-5" },
        label: (__VLS_unwrap(t, {})('auth.password')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    /** @type {__VLS_StyleScopedClasses['mt-5']} */ ;
    var __VLS_15;
    const { default: __VLS_17 } = __VLS_nonNull(__VLS_15.slots);
    {
        const { icon: __VLS_18 } = __VLS_nonNull(__VLS_15.slots);
        let __VLS_19;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({
            // @ts-ignore
            icon: "lucide:lock-keyhole", ...{ class: "ml-4 size-[18px] shrink-0 text-flixer-muted" }, 'aria-hidden': "true",
        }));
        const __VLS_21 = __VLS_20({
            icon: "lucide:lock-keyhole",
            ...{ class: "ml-4 size-[18px] shrink-0 text-flixer-muted" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_20));
        /** @type {__VLS_StyleScopedClasses['ml-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-[18px]']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        // @ts-ignore
        [t,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: (isPasswordVisible.value ? 'text' : 'password'),
        name: "password",
        'aria-label': (__VLS_unwrap(t, {})('auth.password')),
        placeholder: (__VLS_unwrap(t, {})('auth.passwordPlaceholder')),
        autocomplete: "current-password",
        maxlength: "128",
        ...{ class: "h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-flixer-text outline-none placeholder:text-flixer-muted/70" },
        required: true,
    });
    (__VLS_unwrap(password, {}));
    /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-transparent']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
    /** @type {__VLS_StyleScopedClasses['outline-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['placeholder:text-flixer-muted/70']} */ ;
    {
        const { trailing: __VLS_24 } = __VLS_nonNull(__VLS_15.slots);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    return (isPasswordVisible.value = !isPasswordVisible.value);
                    // @ts-ignore
                    [t, t, isPasswordVisible, isPasswordVisible, isPasswordVisible, password,];
                } },
            ...{ class: "grid size-11 shrink-0 place-items-center rounded-r-lg text-flixer-muted transition hover:text-flixer-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-not-allowed" },
            type: "button",
            'aria-label': (isPasswordVisible.value ? __VLS_unwrap(t, {})('auth.hidePassword') : __VLS_unwrap(t, {})('auth.showPassword')),
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-11']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-r-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-flixer-accent']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-offset-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:cursor-not-allowed']} */ ;
        let __VLS_25;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25({
            // @ts-ignore
            icon: (isPasswordVisible.value ? 'lucide:eye-off' : 'lucide:eye'), ...{ class: "size-[18px]" }, 'aria-hidden': "true",
        }));
        const __VLS_27 = __VLS_26({
            icon: (isPasswordVisible.value ? 'lucide:eye-off' : 'lucide:eye'),
            ...{ class: "size-[18px]" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_26));
        /** @type {__VLS_StyleScopedClasses['size-[18px]']} */ ;
        // @ts-ignore
        [t, t, isPasswordVisible, isPasswordVisible,];
    }
    // @ts-ignore
    [];
    if (__VLS_ctx.canResend) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-3 text-sm" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!(__VLS_ctx.canResend))
                        throw 0;
                    return (__VLS_unwrap(emit, {})('resend'));
                    // @ts-ignore
                    [canResend, emit,];
                } },
            type: "button",
            ...{ class: "font-semibold text-flixer-accent underline-offset-4 hover:underline disabled:cursor-wait disabled:opacity-60" },
            disabled: (__VLS_ctx.isResending),
        });
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
        /** @type {__VLS_StyleScopedClasses['underline-offset-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:underline']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:cursor-wait']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
        (__VLS_ctx.isResending ? __VLS_unwrap(t, {})('auth.sending') : __VLS_unwrap(t, {})('auth.resendVerification'));
    }
    if (__VLS_ctx.biometricAvailable) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "mt-4 flex cursor-pointer items-start gap-3 text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "checkbox",
            ...{ class: "mt-0.5 size-4 accent-flixer-accent" },
        });
        (__VLS_unwrap(rememberBiometric, {}));
        /** @type {__VLS_StyleScopedClasses['mt-0.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['accent-flixer-accent']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_unwrap(t, {})('auth.enableBiometricLogin'));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-6 flex flex-col gap-3" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ class: "flex h-12 w-full items-center justify-center gap-2 rounded bg-gradient-to-r from-flixer-primary to-flixer-secondary text-sm font-semibold text-white shadow-lg shadow-flixer-primary/20 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-wait disabled:opacity-60" },
        type: "submit",
        disabled: (__VLS_ctx.isSubmitting),
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-gradient-to-r']} */ ;
    /** @type {__VLS_StyleScopedClasses['from-flixer-primary']} */ ;
    /** @type {__VLS_StyleScopedClasses['to-flixer-secondary']} */ ;
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.isSubmitting ? __VLS_unwrap(t, {})('auth.signingIn') : __VLS_unwrap(t, {})('auth.signInToFlixer'));
    if (!__VLS_ctx.isSubmitting) {
        let __VLS_30;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({
            // @ts-ignore
            icon: "lucide:arrow-right", ...{ class: "size-[17px]" }, 'aria-hidden': "true",
        }));
        const __VLS_32 = __VLS_31({
            icon: "lucide:arrow-right",
            ...{ class: "size-[17px]" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_31));
        /** @type {__VLS_StyleScopedClasses['size-[17px]']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" },
            'aria-hidden': "true",
        });
        /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-white/40']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-t-white']} */ ;
    }
    if (__VLS_ctx.biometricLoginAvailable) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!(__VLS_ctx.biometricLoginAvailable))
                        throw 0;
                    return (__VLS_unwrap(emit, {})('biometric'));
                    // @ts-ignore
                    [t, t, t, t, t, emit, isResending, isResending, biometricAvailable, rememberBiometric, isSubmitting, isSubmitting, isSubmitting, biometricLoginAvailable,];
                } },
            ...{ class: "flex h-12 w-full items-center justify-center gap-2 rounded border border-flixer-accent/40 bg-flixer-primary/10 text-sm font-semibold text-flixer-text transition hover:bg-flixer-primary/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-wait disabled:opacity-60" },
            type: "button",
            disabled: (__VLS_ctx.isSubmitting),
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-12']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-accent/40']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-primary/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-flixer-primary/20']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-offset-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:cursor-wait']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
        (__VLS_unwrap(t, {})('auth.signInWithBiometrics'));
    }
    if (passkeysSupported.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!(passkeysSupported.value))
                        throw 0;
                    return (__VLS_unwrap(emit, {})('passkey'));
                    // @ts-ignore
                    [t, emit, isSubmitting, passkeysSupported,];
                } },
            ...{ class: "flex h-12 w-full items-center justify-center gap-2 rounded border border-flixer-border bg-flixer-surface/50 text-sm font-semibold text-flixer-text transition hover:border-flixer-accent/40 hover:bg-flixer-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-wait disabled:opacity-60" },
            type: "button",
            disabled: (__VLS_ctx.isSubmitting),
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-12']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/50']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:border-flixer-accent/40']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-flixer-surface']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-offset-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:cursor-wait']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
        let __VLS_35;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35({
            // @ts-ignore
            icon: "lucide:key-round", ...{ class: "size-[17px]" }, 'aria-hidden': "true",
        }));
        const __VLS_37 = __VLS_36({
            icon: "lucide:key-round",
            ...{ class: "size-[17px]" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_36));
        /** @type {__VLS_StyleScopedClasses['size-[17px]']} */ ;
        (__VLS_unwrap(t, {})('auth.signInWithPasskey'));
    }
    if (__VLS_ctx.biometricLoginAvailable) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!(__VLS_ctx.biometricLoginAvailable))
                        throw 0;
                    return (__VLS_unwrap(emit, {})('forgetBiometric'));
                    // @ts-ignore
                    [t, emit, isSubmitting, biometricLoginAvailable,];
                } },
            ...{ class: "self-center text-xs text-flixer-muted underline underline-offset-4 hover:text-flixer-text" },
            type: "button",
            disabled: (__VLS_ctx.isSubmitting),
        });
        /** @type {__VLS_StyleScopedClasses['self-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        /** @type {__VLS_StyleScopedClasses['underline']} */ ;
        /** @type {__VLS_StyleScopedClasses['underline-offset-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-flixer-text']} */ ;
        (__VLS_unwrap(t, {})('auth.forgetBiometricLogin'));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "my-7 flex items-center gap-3 text-[9px] font-semibold tracking-[0.16em] text-flixer-muted/70" },
    });
    /** @type {__VLS_StyleScopedClasses['my-7']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-[9px]']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-[0.16em]']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted/70']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "h-px flex-1 bg-flixer-border" },
    });
    /** @type {__VLS_StyleScopedClasses['h-px']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-border']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_unwrap(t, {})('auth.madeForYourMoments'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "h-px flex-1 bg-flixer-border" },
    });
    /** @type {__VLS_StyleScopedClasses['h-px']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-border']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                void $event;
                return (__VLS_unwrap(emit, {})('switchMode'));
                // @ts-ignore
                [t, t, emit, isSubmitting,];
            } },
        ...{ class: "flex w-full items-center gap-3 rounded border border-flixer-border bg-flixer-surface/50 p-3 text-left transition hover:-translate-y-px hover:border-flixer-accent/40 hover:bg-flixer-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-not-allowed disabled:opacity-55" },
        type: "button",
        disabled: (__VLS_ctx.registrationEnabled !== true),
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/50']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:-translate-y-px']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:border-flixer-accent/40']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-flixer-surface']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-offset-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled:cursor-not-allowed']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled:opacity-55']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "grid size-[34px] shrink-0 place-items-center rounded border border-flixer-accent/20 bg-flixer-primary/10 text-flixer-accent" },
        'aria-hidden': "true",
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['size-[34px]']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-accent/20']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-primary/10']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
    let __VLS_40;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40({
        // @ts-ignore
        icon: "lucide:user-round-plus", ...{ class: "size-[17px]" }, 'aria-hidden': "true",
    }));
    const __VLS_42 = __VLS_41({
        icon: "lucide:user-round-plus",
        ...{ class: "size-[17px]" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_41));
    /** @type {__VLS_StyleScopedClasses['size-[17px]']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "flex min-w-0 flex-1 flex-col gap-0.5" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-0.5']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
        ...{ class: "text-xs font-semibold text-flixer-text/90" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text/90']} */ ;
    (__VLS_unwrap(t, {})('auth.newToFlixer'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "text-[11px] leading-5 text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['text-[11px]']} */ ;
    /** @type {__VLS_StyleScopedClasses['leading-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('auth.createYourAccount'));
    let __VLS_45;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_46 = __VLS_asFunctionalComponent1(__VLS_45, new __VLS_45({
        // @ts-ignore
        icon: "lucide:arrow-right", ...{ class: "size-[17px] shrink-0 text-flixer-accent" }, 'aria-hidden': "true",
    }));
    const __VLS_47 = __VLS_46({
        icon: "lucide:arrow-right",
        ...{ class: "size-[17px] shrink-0 text-flixer-accent" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_46));
    /** @type {__VLS_StyleScopedClasses['size-[17px]']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
    if (__VLS_ctx.registrationStatusError) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.output, __VLS_intrinsics.output)({
            ...{ class: "mt-3 text-center text-xs leading-5 text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['leading-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_ctx.registrationStatusError);
    }
    else if (__VLS_ctx.registrationEnabled === false) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.output, __VLS_intrinsics.output)({
            ...{ class: "mt-3 text-center text-xs leading-5 text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['leading-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('auth.registrationDisabled'));
    }
    else if (__VLS_ctx.registrationEnabled === null) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.output, __VLS_intrinsics.output)({
            ...{ class: "mt-3 text-center text-xs leading-5 text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['leading-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('auth.checkingRegistration'));
    }
    // @ts-ignore
    [t, t, t, t, registrationEnabled, registrationEnabled, registrationEnabled, registrationStatusError, registrationStatusError,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};
