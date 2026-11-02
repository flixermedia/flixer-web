import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AuthField from './AuthField.vue';
const { defineProps, defineEmits, } = {};
const __VLS_props = defineProps();
const { t } = useI18n();
const emit = defineEmits();
const username = ref('');
const displayName = ref('');
const email = ref('');
const password = ref('');
const isPasswordVisible = ref(false);
const passwordStrength = computed(() => {
    if (!password.value) {
        return { label: t('auth.passwordNotEntered'), level: 'empty', value: 0 };
    }
    const characterTypes = [/[a-z]/.test(password.value), /[A-Z]/.test(password.value), /\d/.test(password.value), /[^a-zA-Z0-9]/.test(password.value)].filter(Boolean).length;
    const score = Number(password.value.length >= 8) + Number(password.value.length >= 12) + Number(password.value.length >= 16) + Number(characterTypes >= 2) + Number(characterTypes >= 3) + Number(characterTypes >= 4);
    if (score <= 2) {
        return { label: t('auth.passwordWeak'), level: 'weak', value: 1 };
    }
    if (score === 3) {
        return { label: t('auth.passwordFair'), level: 'fair', value: 2 };
    }
    if (score === 4) {
        return { label: t('auth.passwordGood'), level: 'good', value: 3 };
    }
    return { label: t('auth.passwordStrong'), level: 'strong', value: 4 };
});
function handleSubmit() {
    emit('submit', {
        username: username.value,
        password: password.value,
        email: email.value,
        displayName: displayName.value,
    });
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
    __VLS_withDotValue(passwordStrength, {});
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
    (__VLS_unwrap(t, {})('auth.joinCommunity'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
        id: "registration-title",
        ...{ class: "mt-3 text-3xl font-semibold tracking-tight text-flixer-text sm:text-4xl" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-tight']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:text-4xl']} */ ;
    (__VLS_unwrap(t, {})('auth.createYourAccountTitle'));
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
    (__VLS_unwrap(t, {})('auth.registrationDescription'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (handleSubmit) },
        ...{ class: "mt-7 flex flex-col" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-7']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    const __VLS_0 = AuthField || AuthField;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        id: "registration-display-name", label: (__VLS_unwrap(t, {})('auth.displayName')),
    }));
    const __VLS_2 = __VLS_1({
        id: "registration-display-name",
        label: (__VLS_unwrap(t, {})('auth.displayName')),
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
            icon: "lucide:text", ...{ class: "ml-4 size-[18px] shrink-0 text-flixer-muted" }, 'aria-hidden': "true",
        }));
        const __VLS_9 = __VLS_8({
            icon: "lucide:text",
            ...{ class: "ml-4 size-[18px] shrink-0 text-flixer-muted" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_8));
        /** @type {__VLS_StyleScopedClasses['ml-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-[18px]']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        // @ts-ignore
        [t, t, t, t,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        id: "registration-display-name",
        value: (__VLS_unwrap(displayName, {})),
        type: "text",
        name: "displayName",
        placeholder: (__VLS_unwrap(t, {})('auth.displayNamePlaceholder')),
        autocomplete: "nickname",
        maxlength: "64",
        disabled: (__VLS_ctx.registrationEnabled !== true),
        ...{ class: "h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-flixer-text outline-none placeholder:text-flixer-muted/70 disabled:cursor-not-allowed" },
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
    /** @type {__VLS_StyleScopedClasses['disabled:cursor-not-allowed']} */ ;
    // @ts-ignore
    [t, displayName, registrationEnabled,];
    const __VLS_12 = AuthField || AuthField;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
        // @ts-ignore
        id: "registration-username", ...{ class: "mt-4" }, label: (__VLS_unwrap(t, {})('auth.username')),
    }));
    const __VLS_14 = __VLS_13({
        id: "registration-username",
        ...{ class: "mt-4" },
        label: (__VLS_unwrap(t, {})('auth.username')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
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
            icon: "lucide:user-round", ...{ class: "ml-4 size-[18px] shrink-0 text-flixer-muted" }, 'aria-hidden': "true",
        }));
        const __VLS_21 = __VLS_20({
            icon: "lucide:user-round",
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
        id: "registration-username",
        value: (__VLS_unwrap(username, {})),
        type: "text",
        name: "username",
        placeholder: (__VLS_unwrap(t, {})('auth.usernamePlaceholder')),
        autocomplete: "username",
        autocapitalize: "none",
        autocorrect: "off",
        spellcheck: "false",
        minlength: "3",
        maxlength: "64",
        pattern: "\u005b\u0061\u002d\u007a\u0041\u002d\u005a\u0030\u002d\u0039\u005f\u002e\u005c\u002d\u005d\u002b",
        disabled: (__VLS_ctx.registrationEnabled !== true),
        ...{ class: "h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-flixer-text outline-none placeholder:text-flixer-muted/70 disabled:cursor-not-allowed" },
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
    /** @type {__VLS_StyleScopedClasses['disabled:cursor-not-allowed']} */ ;
    // @ts-ignore
    [t, registrationEnabled, username,];
    const __VLS_24 = AuthField || AuthField;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
        // @ts-ignore
        id: "registration-email", ...{ class: "mt-4" }, label: (__VLS_unwrap(t, {})('auth.email')),
    }));
    const __VLS_26 = __VLS_25({
        id: "registration-email",
        ...{ class: "mt-4" },
        label: (__VLS_unwrap(t, {})('auth.email')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    var __VLS_27;
    const { default: __VLS_29 } = __VLS_nonNull(__VLS_27.slots);
    {
        const { icon: __VLS_30 } = __VLS_nonNull(__VLS_27.slots);
        let __VLS_31;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31({
            // @ts-ignore
            icon: "lucide:mail", ...{ class: "ml-4 size-[18px] shrink-0 text-flixer-muted" }, 'aria-hidden': "true",
        }));
        const __VLS_33 = __VLS_32({
            icon: "lucide:mail",
            ...{ class: "ml-4 size-[18px] shrink-0 text-flixer-muted" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_32));
        /** @type {__VLS_StyleScopedClasses['ml-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-[18px]']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        // @ts-ignore
        [t,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        id: "registration-email",
        type: "email",
        name: "email",
        placeholder: (__VLS_unwrap(t, {})('auth.emailPlaceholder')),
        autocomplete: "email",
        autocapitalize: "none",
        autocorrect: "off",
        spellcheck: "false",
        maxlength: "254",
        disabled: (__VLS_ctx.registrationEnabled !== true),
        ...{ class: "h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-flixer-text outline-none placeholder:text-flixer-muted/70 disabled:cursor-not-allowed" },
        required: true,
    });
    (__VLS_unwrap(email, {}));
    /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-transparent']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
    /** @type {__VLS_StyleScopedClasses['outline-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['placeholder:text-flixer-muted/70']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled:cursor-not-allowed']} */ ;
    // @ts-ignore
    [t, registrationEnabled, email,];
    const __VLS_36 = AuthField || AuthField;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36({
        // @ts-ignore
        id: "registration-password", ...{ class: "mt-4" }, label: (__VLS_unwrap(t, {})('auth.password')),
    }));
    const __VLS_38 = __VLS_37({
        id: "registration-password",
        ...{ class: "mt-4" },
        label: (__VLS_unwrap(t, {})('auth.password')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    var __VLS_39;
    const { default: __VLS_41 } = __VLS_nonNull(__VLS_39.slots);
    {
        const { icon: __VLS_42 } = __VLS_nonNull(__VLS_39.slots);
        let __VLS_43;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_44 = __VLS_asFunctionalComponent1(__VLS_43, new __VLS_43({
            // @ts-ignore
            icon: "lucide:lock-keyhole", ...{ class: "ml-4 size-[18px] shrink-0 text-flixer-muted" }, 'aria-hidden': "true",
        }));
        const __VLS_45 = __VLS_44({
            icon: "lucide:lock-keyhole",
            ...{ class: "ml-4 size-[18px] shrink-0 text-flixer-muted" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_44));
        /** @type {__VLS_StyleScopedClasses['ml-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-[18px]']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        // @ts-ignore
        [t,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        id: "registration-password",
        type: (isPasswordVisible.value ? 'text' : 'password'),
        name: "password",
        placeholder: (__VLS_unwrap(t, {})('auth.passwordMinimumPlaceholder')),
        autocomplete: "new-password",
        minlength: "8",
        maxlength: "128",
        disabled: (__VLS_ctx.registrationEnabled !== true),
        ...{ class: "h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-flixer-text outline-none placeholder:text-flixer-muted/70 disabled:cursor-not-allowed" },
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
    /** @type {__VLS_StyleScopedClasses['disabled:cursor-not-allowed']} */ ;
    {
        const { trailing: __VLS_48 } = __VLS_nonNull(__VLS_39.slots);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    return (isPasswordVisible.value = !isPasswordVisible.value);
                    // @ts-ignore
                    [t, registrationEnabled, isPasswordVisible, isPasswordVisible, isPasswordVisible, password,];
                } },
            ...{ class: "grid size-11 shrink-0 place-items-center rounded-r-lg text-flixer-muted transition hover:text-flixer-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-not-allowed" },
            type: "button",
            disabled: (__VLS_ctx.registrationEnabled !== true),
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
        let __VLS_49;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_50 = __VLS_asFunctionalComponent1(__VLS_49, new __VLS_49({
            // @ts-ignore
            icon: (isPasswordVisible.value ? 'lucide:eye-off' : 'lucide:eye'), ...{ class: "size-[18px]" }, 'aria-hidden': "true",
        }));
        const __VLS_51 = __VLS_50({
            icon: (isPasswordVisible.value ? 'lucide:eye-off' : 'lucide:eye'),
            ...{ class: "size-[18px]" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_50));
        /** @type {__VLS_StyleScopedClasses['size-[18px]']} */ ;
        // @ts-ignore
        [t, t, registrationEnabled, isPasswordVisible, isPasswordVisible,];
    }
    // @ts-ignore
    [];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-2.5" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-2.5']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex justify-between text-[10px] text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_unwrap(t, {})('auth.passwordStrength'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "font-semibold text-flixer-text/70" },
    });
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text/70']} */ ;
    (passwordStrength.value.label);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-2 grid grid-cols-4 gap-1.5" },
        role: "meter",
        'aria-label': (__VLS_unwrap(t, {})('auth.passwordStrength')),
        'aria-valuemin': "0",
        'aria-valuemax': "4",
        'aria-valuenow': (passwordStrength.value.value),
        'aria-valuetext': (__VLS_unwrap(t, {})('auth.passwordStrengthValue', { strength: passwordStrength.value.label })),
    });
    /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid-cols-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1.5']} */ ;
    const __VLS_54 = __VLS_tryAsConstant((4));
    for (const [segment] of __VLS_vFor(__VLS_nonNull(__VLS_54))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            key: (segment),
            ...{ class: "h-1 rounded bg-flixer-border transition-colors" },
            ...{ class: (segment <= passwordStrength.value.value
                    ? {
                        weak: 'bg-rose-400',
                        fair: 'bg-amber-400',
                        good: 'bg-emerald-400',
                        strong: 'bg-teal-300',
                    }[passwordStrength.value.level]
                    : '') },
        });
        /** @type {__VLS_StyleScopedClasses['h-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
        // @ts-ignore
        [t, t, t, passwordStrength, passwordStrength, passwordStrength, passwordStrength, passwordStrength,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-1.5 text-[10px] leading-4 text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
    /** @type {__VLS_StyleScopedClasses['leading-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('auth.passwordGuidance'));
    if (__VLS_ctx.registrationStatusError) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-3 text-xs leading-5 text-flixer-muted" },
            role: "status",
        });
        /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['leading-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_ctx.registrationStatusError);
    }
    else if (__VLS_ctx.registrationEnabled === false) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-3 text-xs leading-5 text-flixer-muted" },
            role: "status",
        });
        /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['leading-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('auth.registrationDisabled'));
    }
    else if (__VLS_ctx.registrationEnabled === null) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-3 text-xs leading-5 text-flixer-muted" },
            role: "status",
        });
        /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['leading-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('auth.checkingRegistration'));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ class: "mt-5 flex h-12 items-center justify-center gap-2 rounded bg-gradient-to-r from-flixer-primary to-flixer-secondary text-sm font-semibold text-white shadow-lg shadow-flixer-primary/20 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-wait disabled:opacity-60" },
        type: "submit",
        disabled: (__VLS_ctx.isSubmitting || __VLS_ctx.registrationEnabled !== true),
        'aria-busy': (__VLS_ctx.isSubmitting),
    });
    /** @type {__VLS_StyleScopedClasses['mt-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-12']} */ ;
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
    (__VLS_ctx.isSubmitting ? __VLS_unwrap(t, {})('auth.creatingAccount') : __VLS_unwrap(t, {})('auth.createAccount'));
    if (!__VLS_ctx.isSubmitting) {
        let __VLS_55;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_56 = __VLS_asFunctionalComponent1(__VLS_55, new __VLS_55({
            // @ts-ignore
            icon: "lucide:arrow-right", ...{ class: "size-[17px]" }, 'aria-hidden': "true",
        }));
        const __VLS_57 = __VLS_56({
            icon: "lucide:arrow-right",
            ...{ class: "size-[17px]" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_56));
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "my-6 flex items-center gap-3 text-[9px] font-semibold tracking-[0.16em] text-flixer-muted/70" },
    });
    /** @type {__VLS_StyleScopedClasses['my-6']} */ ;
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
    (__VLS_unwrap(t, {})('auth.aBetterWayToWatch'));
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
                [t, t, t, t, t, t, registrationEnabled, registrationEnabled, registrationEnabled, registrationStatusError, registrationStatusError, isSubmitting, isSubmitting, isSubmitting, isSubmitting, emit,];
            } },
        ...{ class: "flex w-full items-center gap-3 rounded border border-flixer-border bg-flixer-surface/50 p-3 text-left transition hover:-translate-y-px hover:border-flixer-accent/40 hover:bg-flixer-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" },
        type: "button",
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
    let __VLS_60;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_61 = __VLS_asFunctionalComponent1(__VLS_60, new __VLS_60({
        // @ts-ignore
        icon: "lucide:repeat", ...{ class: "size-[17px]" }, 'aria-hidden': "true",
    }));
    const __VLS_62 = __VLS_61({
        icon: "lucide:repeat",
        ...{ class: "size-[17px]" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_61));
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
    (__VLS_unwrap(t, {})('auth.alreadyHaveAccount'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "text-[11px] leading-5 text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['text-[11px]']} */ ;
    /** @type {__VLS_StyleScopedClasses['leading-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('auth.signInInstead'));
    let __VLS_65;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_66 = __VLS_asFunctionalComponent1(__VLS_65, new __VLS_65({
        // @ts-ignore
        icon: "lucide:arrow-right", ...{ class: "size-[17px] shrink-0 text-flixer-accent" }, 'aria-hidden': "true",
    }));
    const __VLS_67 = __VLS_66({
        icon: "lucide:arrow-right",
        ...{ class: "size-[17px] shrink-0 text-flixer-accent" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_66));
    /** @type {__VLS_StyleScopedClasses['size-[17px]']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
    // @ts-ignore
    [t, t,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};
