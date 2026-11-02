import { openModal } from '@kolirt/vue-modal';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AdminSkeleton from './AdminSkeleton.vue';
import { listAdminUsers, listSettings, updateSetting } from '../../api';
import { notify } from '../../composables/notify';
import { describeRequestError } from '../../composables/useProfile';
import { catchError } from '../../utils/catchError';
import UserAvatar from '../ui/UserAvatar.vue';
import AdminSection from './AdminSection.vue';
import AdminToggle from './AdminToggle.vue';
import CreateUserModal from './CreateUserModal.vue';
import EditUserModal from './EditUserModal.vue';
import StatusPill from './StatusPill.vue';
const { t, locale } = useI18n();
const users = ref([]);
const isLoading = ref(true);
const loadError = ref('');
const query = ref('');
const registrationEnabled = ref(true);
const smtpConfigured = ref(false);
const verificationEnabled = ref(true);
const primaryButton = 'rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60';
const secondaryButton = 'rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15 disabled:opacity-60';
const filtered = computed(() => {
    const needle = query.value.trim().toLowerCase();
    return users.value.filter((user) => `${user.displayName} ${user.username} ${user.email ?? ''}`.toLowerCase().includes(needle));
});
const statusTone = { active: 'good', unverified: 'warn', disabled: 'bad' };
const statusOf = (user) => (user.disabled ? 'disabled' : !user.emailVerified ? 'unverified' : 'active');
const UNITS = [
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
];
function relativeTime(iso) {
    if (!iso)
        return t('admin.users.never');
    const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
    if (Math.abs(seconds) < 60)
        return t('admin.users.justNow');
    const [unit, size] = UNITS.find(([, s]) => Math.abs(seconds) >= s) ?? UNITS[2];
    return new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' }).format(Math.round(seconds / size), unit);
}
async function load() {
    try {
        const [error, result] = await catchError(Promise.all([listAdminUsers(), listSettings()]));
        if (error) {
            console.error('[users] failed to load', error);
            loadError.value = describeRequestError(error, t('admin.users.loadError'));
        }
        else {
            const [list, settings] = result;
            users.value = list;
            registrationEnabled.value = settings.find((setting) => setting.key === 'registration_enabled')?.value !== false;
            const host = settings.find((setting) => setting.key === 'smtp_host')?.value;
            smtpConfigured.value = typeof host === 'string' && host.trim() !== '';
            verificationEnabled.value = settings.find((setting) => setting.key === 'email_verification_required')?.value !== false;
            loadError.value = '';
        }
    }
    finally {
        isLoading.value = false;
    }
}
async function openEdit(user) {
    const refresh = await openModal(EditUserModal, { props: { user } }).catch(() => false);
    if (refresh)
        await load();
}
async function openCreate() {
    const refresh = await openModal(CreateUserModal).catch(() => false);
    if (refresh)
        await load();
}
async function setRegistration(enabled) {
    const previous = registrationEnabled.value;
    registrationEnabled.value = enabled;
    const [error] = await catchError(updateSetting('registration_enabled', enabled));
    if (error) {
        registrationEnabled.value = previous;
        notify.error(describeRequestError(error, t('admin.users.registrationError')));
    }
}
async function setVerification(enabled) {
    const previous = verificationEnabled.value;
    verificationEnabled.value = enabled;
    const [error] = await catchError(updateSetting('email_verification_required', enabled));
    if (error) {
        verificationEnabled.value = previous;
        notify.error(describeRequestError(error, t('admin.users.verificationError')));
    }
}
onMounted(load);
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(loadError, {});
    __VLS_withDotValue(isLoading, {});
    __VLS_withDotValue(statusTone, {});
    __VLS_withDotValue(filtered, {});
    __VLS_withDotValue(users, {});
    __VLS_withDotValue(smtpConfigured, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-col gap-6" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
    const __VLS_0 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('admin.users.title')), description: (__VLS_unwrap(t, {})('admin.users.description')),
    }));
    const __VLS_2 = __VLS_1({
        title: (__VLS_unwrap(t, {})('admin.users.title')),
        description: (__VLS_unwrap(t, {})('admin.users.description')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    {
        const { actions: __VLS_6 } = __VLS_nonNull(__VLS_3.slots);
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "search",
            placeholder: (__VLS_unwrap(t, {})('admin.users.searchPlaceholder')),
            ...{ class: "rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm" },
        });
        (__VLS_unwrap(query, {}));
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (openCreate) },
            type: "button",
            ...{ class: (__VLS_unwrap(primaryButton, {})) },
        });
        (__VLS_unwrap(t, {})('admin.users.addUser'));
        // @ts-ignore
        [t, t, t, t, query, primaryButton,];
    }
    if (loadError.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            role: "alert",
            ...{ class: "mb-3 text-sm text-red-300" },
        });
        /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
        (loadError.value);
    }
    if (isLoading.value) {
        const __VLS_7 = AdminSkeleton;
        // @ts-ignore
        const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
            // @ts-ignore
            variant: "table", rows: (3),
        }));
        const __VLS_9 = __VLS_8({
            variant: "table",
            rows: (3),
        }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "overflow-x-auto" },
        });
        /** @type {__VLS_StyleScopedClasses['overflow-x-auto']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
            ...{ class: "w-full min-w-160 text-left text-sm" },
        });
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['min-w-160']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({
            ...{ class: "text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "pb-2 font-medium" },
        });
        /** @type {__VLS_StyleScopedClasses['pb-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        (__VLS_unwrap(t, {})('admin.users.user'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "pb-2 font-medium" },
        });
        /** @type {__VLS_StyleScopedClasses['pb-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        (__VLS_unwrap(t, {})('admin.users.role'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "pb-2 font-medium" },
        });
        /** @type {__VLS_StyleScopedClasses['pb-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        (__VLS_unwrap(t, {})('admin.users.status'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "pb-2 font-medium" },
        });
        /** @type {__VLS_StyleScopedClasses['pb-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        (__VLS_unwrap(t, {})('admin.users.passkeys'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "pb-2 font-medium" },
        });
        /** @type {__VLS_StyleScopedClasses['pb-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        (__VLS_unwrap(t, {})('admin.users.lastActive'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "pb-2" },
        });
        /** @type {__VLS_StyleScopedClasses['pb-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
        const __VLS_12 = __VLS_tryAsConstant((filtered.value));
        for (const [user] of __VLS_vFor(__VLS_nonNull(__VLS_12))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (user.id),
                ...{ class: "border-t border-flixer-border" },
            });
            /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "py-3" },
            });
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex items-center gap-3" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "size-8 shrink-0 overflow-hidden rounded text-xs" },
            });
            /** @type {__VLS_StyleScopedClasses['size-8']} */ ;
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            const __VLS_13 = UserAvatar;
            // @ts-ignore
            const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
                // @ts-ignore
                avatarUrl: (user.avatarUrl), name: (user.displayName),
            }));
            const __VLS_15 = __VLS_14({
                avatarUrl: (user.avatarUrl),
                name: (user.displayName),
            }, ...__VLS_functionalComponentArgsRest(__VLS_14));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "font-medium" },
            });
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            (user.displayName);
            if (user.current) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "ml-1 text-xs font-normal text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['ml-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-normal']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (__VLS_unwrap(t, {})('admin.users.you'));
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (user.username);
            if (user.email) {
                (user.email);
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            const __VLS_18 = StatusPill || StatusPill;
            // @ts-ignore
            const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
                // @ts-ignore
                tone: (user.role === 'admin' ? 'accent' : 'neutral'),
            }));
            const __VLS_20 = __VLS_19({
                tone: (user.role === 'admin' ? 'accent' : 'neutral'),
            }, ...__VLS_functionalComponentArgsRest(__VLS_19));
            var __VLS_21;
            const { default: __VLS_23 } = __VLS_nonNull(__VLS_21.slots);
            (user.role === 'admin' ? __VLS_unwrap(t, {})('admin.users.administrator') : __VLS_unwrap(t, {})('admin.users.user'));
            // @ts-ignore
            [t, t, t, t, t, t, t, t, loadError, loadError, isLoading, filtered,];
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            const __VLS_24 = StatusPill || StatusPill;
            // @ts-ignore
            const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
                // @ts-ignore
                tone: (statusTone.value[__VLS_unwrap(statusOf, {})(user)]),
            }));
            const __VLS_26 = __VLS_25({
                tone: (statusTone.value[__VLS_unwrap(statusOf, {})(user)]),
            }, ...__VLS_functionalComponentArgsRest(__VLS_25));
            var __VLS_27;
            const { default: __VLS_29 } = __VLS_nonNull(__VLS_27.slots);
            (__VLS_unwrap(t, {})(`admin.users.statuses.${__VLS_unwrap(statusOf, {})(user)}`));
            // @ts-ignore
            [t, statusTone, statusOf, statusOf,];
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (user.passkeys);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (relativeTime(user.lastActiveAt));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "text-right" },
            });
            /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!!(isLoading.value))
                            throw 0;
                        return (openEdit(user));
                        // @ts-ignore
                        [];
                    } },
                type: "button",
                ...{ class: (__VLS_unwrap(secondaryButton, {})) },
            });
            (__VLS_unwrap(t, {})('admin.users.edit'));
            // @ts-ignore
            [t, secondaryButton,];
        }
        if (filtered.value.length === 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                colspan: "6",
                ...{ class: "py-6 text-center text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['py-6']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (users.value.length === 0 ? __VLS_unwrap(t, {})('admin.users.noUsers') : __VLS_unwrap(t, {})('admin.users.noSearchMatches'));
        }
    }
    // @ts-ignore
    [t, t, filtered, users,];
    const __VLS_30 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('admin.users.signUpPolicy')), description: (__VLS_unwrap(t, {})('admin.users.signUpPolicyDescription')),
    }));
    const __VLS_32 = __VLS_31({
        title: (__VLS_unwrap(t, {})('admin.users.signUpPolicy')),
        description: (__VLS_unwrap(t, {})('admin.users.signUpPolicyDescription')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_31));
    var __VLS_33;
    const { default: __VLS_35 } = __VLS_nonNull(__VLS_33.slots);
    const __VLS_36 = AdminToggle;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36({
        // @ts-ignore
        ...{ 'onUpdate:modelValue': {} }, modelValue: (__VLS_unwrap(registrationEnabled, {})), label: (__VLS_unwrap(t, {})('admin.users.allowPublicRegistration')), description: (__VLS_unwrap(t, {})('admin.users.publicRegistrationDescription')),
    }));
    const __VLS_38 = __VLS_37({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (__VLS_unwrap(registrationEnabled, {})),
        label: (__VLS_unwrap(t, {})('admin.users.allowPublicRegistration')),
        description: (__VLS_unwrap(t, {})('admin.users.publicRegistrationDescription')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    let __VLS_41;
    const __VLS_42 = {
        /** @type {typeof __VLS_41.'update:modelValue'} */
        'onUpdate:modelValue': (setRegistration),
    };
    void __VLS_42;
    var __VLS_39;
    var __VLS_40;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: ({ 'pointer-events-none opacity-60': !smtpConfigured.value }) },
    });
    /** @type {__VLS_StyleScopedClasses['pointer-events-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['opacity-60']} */ ;
    const __VLS_43 = AdminToggle;
    // @ts-ignore
    const __VLS_44 = __VLS_asFunctionalComponent1(__VLS_43, new __VLS_43({
        // @ts-ignore
        ...{ 'onUpdate:modelValue': {} }, modelValue: (__VLS_unwrap(verificationEnabled, {})), label: (__VLS_unwrap(t, {})('admin.users.requireEmailVerification')), description: (smtpConfigured.value ? __VLS_unwrap(t, {})('admin.users.requireEmailVerificationDescription') : __VLS_unwrap(t, {})('admin.users.emailVerificationOff')),
    }));
    const __VLS_45 = __VLS_44({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (__VLS_unwrap(verificationEnabled, {})),
        label: (__VLS_unwrap(t, {})('admin.users.requireEmailVerification')),
        description: (smtpConfigured.value ? __VLS_unwrap(t, {})('admin.users.requireEmailVerificationDescription') : __VLS_unwrap(t, {})('admin.users.emailVerificationOff')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_44));
    let __VLS_48;
    const __VLS_49 = {
        /** @type {typeof __VLS_48.'update:modelValue'} */
        'onUpdate:modelValue': (setVerification),
    };
    void __VLS_49;
    var __VLS_46;
    var __VLS_47;
    // @ts-ignore
    [t, t, t, t, t, t, t, registrationEnabled, smtpConfigured, smtpConfigured, verificationEnabled,];
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
