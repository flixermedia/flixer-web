import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal';
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { AVATAR_TYPES, MAX_AVATAR_BYTES, deleteAdminUser, removeAdminUserAvatar, revokeAdminUserSessions, setAdminUserAvatar, setAdminUserPassword, updateAdminUser } from '../../api';
import { confirmAction } from '../../composables/confirm';
import { notify } from '../../composables/notify';
import { describeRequestError, useProfile } from '../../composables/useProfile';
import { catchError } from '../../utils/catchError';
import TextInput from '../ui/TextInput.vue';
import UserAvatar from '../ui/UserAvatar.vue';
import AdminToggle from './AdminToggle.vue';
const { defineProps, defineOptions, } = {};
defineOptions({ modalGroup: 'default' });
const props = defineProps();
// Resolves true when the user list needs a refresh.
const { close, confirm } = useModalContext();
const { t } = useI18n();
const busy = ref(false);
const changed = ref(false);
const avatarUrl = ref(props.user.avatarUrl);
const fileInput = ref(null);
const { load: reloadProfile } = useProfile();
const activeSessions = ref(props.user.activeSessions);
const form = reactive({ displayName: props.user.displayName, email: props.user.email ?? '', role: props.user.role, enabled: !props.user.disabled, newPassword: '' });
const canSave = computed(() => !busy.value && form.displayName.trim() !== '');
const secondaryButton = 'flex h-11 items-center justify-center rounded border border-flixer-border px-5 text-sm font-semibold text-flixer-text transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:opacity-60';
const dangerButton = 'flex h-11 items-center justify-center rounded border border-rose-400/40 px-5 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300 disabled:opacity-60';
async function run(action, errorKey) {
    busy.value = true;
    try {
        const [error, result] = await catchError(action());
        if (error) {
            console.error('[users]', errorKey, error);
            notify.error(describeRequestError(error, t(errorKey)));
            return undefined;
        }
        return result;
    }
    finally {
        busy.value = false;
    }
}
async function applyAvatar(action, successKey, errorKey) {
    const updated = await run(action, errorKey);
    if (!updated)
        return;
    avatarUrl.value = updated.avatarUrl;
    changed.value = true;
    notify.success(t(successKey));
    if (props.user.current)
        void reloadProfile(true);
}
async function handleFile(event) {
    const input = event.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file)
        return;
    if (!AVATAR_TYPES.includes(file.type)) {
        notify.error(t('settings.avatar.invalidType'));
        return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
        notify.error(t('settings.avatar.tooLarge'));
        return;
    }
    await applyAvatar(() => setAdminUserAvatar(props.user.id, file), 'settings.avatar.updated', 'settings.avatar.uploadFailed');
}
async function removeAvatar() {
    await applyAvatar(() => removeAdminUserAvatar(props.user.id), 'settings.avatar.removed', 'settings.avatar.removeFailed');
}
async function save() {
    const changes = {};
    if (form.displayName.trim() !== props.user.displayName)
        changes.displayName = form.displayName.trim();
    if (form.email.trim().toLowerCase() !== (props.user.email ?? ''))
        changes.email = form.email.trim();
    if (!props.user.current) {
        if (form.role !== props.user.role)
            changes.role = form.role;
        if (form.enabled === props.user.disabled)
            changes.disabled = !form.enabled;
    }
    if (Object.keys(changes).length === 0) {
        confirm(changed.value);
        return;
    }
    const updated = await run(() => updateAdminUser(props.user.id, changes), 'admin.users.saveError');
    if (!updated)
        return;
    notify.success(t('admin.users.saved', { name: updated.displayName }));
    confirm(true);
}
async function savePassword() {
    if (form.newPassword.length < 8) {
        notify.error(t('admin.users.passwordTooShort'));
        return;
    }
    const done = await run(() => setAdminUserPassword(props.user.id, form.newPassword).then(() => true), 'admin.users.passwordError');
    if (!done)
        return;
    form.newPassword = '';
    activeSessions.value = 0;
    changed.value = true;
    notify.success(t('admin.users.passwordSaved'));
}
async function revokeSessions() {
    if (!(await confirmAction(t('admin.users.confirmRevoke', { name: props.user.displayName }), { danger: true })))
        return;
    const result = await run(() => revokeAdminUserSessions(props.user.id), 'admin.users.sessionsError');
    if (!result)
        return;
    activeSessions.value = 0;
    changed.value = true;
    notify.success(t('admin.users.sessionsRevoked', { count: result.revoked }));
}
async function remove() {
    if (!(await confirmAction(t('admin.users.confirmDelete', { name: props.user.displayName }), { danger: true })))
        return;
    const done = await run(() => deleteAdminUser(props.user.id).then(() => true), 'admin.users.deleteError');
    if (!done)
        return;
    notify.success(t('admin.users.deleted', { name: props.user.displayName }));
    confirm(true);
}
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(fileInput, {});
    __VLS_withDotValue(busy, {});
    __VLS_withDotValue(avatarUrl, {});
    __VLS_withDotValue(form, {});
    __VLS_withDotValue(changed, {});
    __VLS_withDotValue(canSave, {});
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
    (__VLS_unwrap(t, {})('admin.users.editTitle', { name: __VLS_ctx.user.displayName }));
    // @ts-ignore
    [t, user,];
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
    (__VLS_unwrap(t, {})('admin.users.editDescription'));
    // @ts-ignore
    [t,];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-5 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-h-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['overscroll-contain']} */ ;
    /** @type {__VLS_StyleScopedClasses['[scrollbar-width:none]']} */ ;
    /** @type {__VLS_StyleScopedClasses['[&::-webkit-scrollbar]:hidden']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-center gap-4" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                void $event;
                return (fileInput.value?.click());
                // @ts-ignore
                [fileInput,];
            } },
        type: "button",
        ...{ class: "group relative size-16 shrink-0 overflow-hidden rounded text-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-wait" },
        'aria-label': (__VLS_unwrap(t, {})('settings.avatar.changeLabel')),
        disabled: (busy.value),
    });
    /** @type {__VLS_StyleScopedClasses['group']} */ ;
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['size-16']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-offset-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled:cursor-wait']} */ ;
    const __VLS_24 = UserAvatar;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
        // @ts-ignore
        avatarUrl: (avatarUrl.value), name: (__VLS_ctx.user.displayName),
    }));
    const __VLS_26 = __VLS_25({
        avatarUrl: (avatarUrl.value),
        name: (__VLS_ctx.user.displayName),
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "absolute inset-0 grid place-items-center bg-black/55 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100" },
    });
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-black/55']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['opacity-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['group-hover:opacity-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['group-focus-visible:opacity-100']} */ ;
    (busy.value ? __VLS_unwrap(t, {})('settings.avatar.working') : __VLS_unwrap(t, {})('settings.avatar.change'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-col gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-wrap gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                void $event;
                return (fileInput.value?.click());
                // @ts-ignore
                [t, t, t, user, fileInput, busy, busy, avatarUrl,];
            } },
        type: "button",
        ...{ class: ([__VLS_unwrap(secondaryButton, {}), 'h-10 px-4']) },
        disabled: (busy.value),
    });
    /** @type {__VLS_StyleScopedClasses['h-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    (avatarUrl.value ? __VLS_unwrap(t, {})('settings.avatar.changePicture') : __VLS_unwrap(t, {})('settings.avatar.uploadPicture'));
    if (avatarUrl.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (removeAvatar) },
            type: "button",
            ...{ class: ([__VLS_unwrap(dangerButton, {}), 'h-10 border-transparent px-4']) },
            disabled: (busy.value),
        });
        /** @type {__VLS_StyleScopedClasses['h-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-transparent']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        (__VLS_unwrap(t, {})('settings.avatar.remove'));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('settings.avatar.fileRequirements'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (handleFile) },
        ref: "fileInput",
        type: "file",
        ...{ class: "hidden" },
        accept: "image/png,image/jpeg,image/webp,image/gif",
    });
    /** @type {__VLS_StyleScopedClasses['hidden']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (save) },
        id: "edit-user-form",
        ...{ class: "flex flex-col gap-4" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    const __VLS_29 = TextInput;
    // @ts-ignore
    const __VLS_30 = __VLS_asFunctionalComponent1(__VLS_29, new __VLS_29({
        // @ts-ignore
        modelValue: (form.value.displayName), label: (__VLS_unwrap(t, {})('admin.users.displayName')), name: "displayName", maxlength: "64", required: true,
    }));
    const __VLS_31 = __VLS_30({
        modelValue: (form.value.displayName),
        label: (__VLS_unwrap(t, {})('admin.users.displayName')),
        name: "displayName",
        maxlength: "64",
        required: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_30));
    const __VLS_34 = TextInput;
    // @ts-ignore
    const __VLS_35 = __VLS_asFunctionalComponent1(__VLS_34, new __VLS_34({
        // @ts-ignore
        modelValue: (form.value.email), label: (__VLS_unwrap(t, {})('admin.users.email')), type: "email", name: "email", maxlength: "254", autocomplete: "off",
    }));
    const __VLS_36 = __VLS_35({
        modelValue: (form.value.email),
        label: (__VLS_unwrap(t, {})('admin.users.email')),
        type: "email",
        name: "email",
        maxlength: "254",
        autocomplete: "off",
    }, ...__VLS_functionalComponentArgsRest(__VLS_35));
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('admin.users.username'));
    (__VLS_ctx.user.username);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs font-semibold text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('admin.users.access'));
    if (__VLS_ctx.user.current) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-1 text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.users.ownAccountNote'));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: ({ 'pointer-events-none opacity-60': __VLS_ctx.user.current }) },
    });
    /** @type {__VLS_StyleScopedClasses['pointer-events-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['opacity-60']} */ ;
    const __VLS_39 = AdminToggle;
    // @ts-ignore
    const __VLS_40 = __VLS_asFunctionalComponent1(__VLS_39, new __VLS_39({
        // @ts-ignore
        ...{ 'onUpdate:modelValue': {} }, modelValue: (form.value.role === 'admin'), label: (__VLS_unwrap(t, {})('admin.users.administrator')), description: (__VLS_unwrap(t, {})('admin.users.fullDashboardAccess')),
    }));
    const __VLS_41 = __VLS_40({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (form.value.role === 'admin'),
        label: (__VLS_unwrap(t, {})('admin.users.administrator')),
        description: (__VLS_unwrap(t, {})('admin.users.fullDashboardAccess')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_40));
    let __VLS_44;
    const __VLS_45 = {
        /** @type {typeof __VLS_44.'update:modelValue'} */
        'onUpdate:modelValue': (...[$event]) => {
            void $event;
            return (form.value.role = $event ? 'admin' : 'user');
            // @ts-ignore
            [t, t, t, t, t, t, t, t, t, t, t, user, user, user, busy, busy, avatarUrl, avatarUrl, secondaryButton, dangerButton, form, form, form, form,];
        },
    };
    void __VLS_45;
    var __VLS_42;
    var __VLS_43;
    const __VLS_46 = AdminToggle;
    // @ts-ignore
    const __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46({
        // @ts-ignore
        modelValue: (form.value.enabled), label: (__VLS_unwrap(t, {})('admin.users.accountEnabled')), description: (__VLS_unwrap(t, {})('admin.users.accountEnabledDescription')),
    }));
    const __VLS_48 = __VLS_47({
        modelValue: (form.value.enabled),
        label: (__VLS_unwrap(t, {})('admin.users.accountEnabled')),
        description: (__VLS_unwrap(t, {})('admin.users.accountEnabledDescription')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_47));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "border-t border-flixer-border pt-4" },
    });
    /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs font-semibold text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('admin.users.accountSection'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (savePassword) },
        ...{ class: "mt-2 flex items-end gap-3" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-end']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    const __VLS_51 = TextInput;
    // @ts-ignore
    const __VLS_52 = __VLS_asFunctionalComponent1(__VLS_51, new __VLS_51({
        // @ts-ignore
        modelValue: (form.value.newPassword), label: (__VLS_unwrap(t, {})('admin.users.newPassword')), type: "password", name: "newPassword", minlength: "8", maxlength: "128", autocomplete: "new-password", ...{ class: "flex-1" },
    }));
    const __VLS_53 = __VLS_52({
        modelValue: (form.value.newPassword),
        label: (__VLS_unwrap(t, {})('admin.users.newPassword')),
        type: "password",
        name: "newPassword",
        minlength: "8",
        maxlength: "128",
        autocomplete: "new-password",
        ...{ class: "flex-1" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_52));
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        type: "submit",
        ...{ class: ([__VLS_unwrap(secondaryButton, {}), 'h-12 shrink-0']) },
        disabled: (busy.value || !form.value.newPassword),
    });
    /** @type {__VLS_StyleScopedClasses['h-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    (__VLS_unwrap(t, {})('admin.users.setPassword'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-3 flex flex-wrap gap-3" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (revokeSessions) },
        type: "button",
        ...{ class: (__VLS_unwrap(secondaryButton, {})) },
        disabled: (busy.value),
    });
    (__VLS_unwrap(t, {})('admin.users.revokeSessions'));
    if (!__VLS_ctx.user.current) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (remove) },
            type: "button",
            ...{ class: (__VLS_unwrap(dangerButton, {})) },
            disabled: (busy.value),
        });
        (__VLS_unwrap(t, {})('admin.users.deleteUser'));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-2 text-xs text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('admin.users.activeSessions', { count: __VLS_unwrap(activeSessions, {}) }));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-5 flex shrink-0 flex-col-reverse gap-3 sm:flex-row sm:justify-end" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col-reverse']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:flex-row']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:justify-end']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                void $event;
                return (changed.value ? __VLS_unwrap(confirm, {})(true) : __VLS_unwrap(close, {})());
                // @ts-ignore
                [t, t, t, t, t, t, t, t, user, busy, busy, busy, secondaryButton, secondaryButton, dangerButton, form, form, form, activeSessions, changed, confirm, close,];
            } },
        type: "button",
        ...{ class: (__VLS_unwrap(secondaryButton, {})) },
        disabled: (busy.value),
    });
    (__VLS_unwrap(t, {})('common.cancel'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        type: "submit",
        form: "edit-user-form",
        ...{ class: "flex h-11 items-center justify-center rounded bg-flixer-primary px-6 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:opacity-60" },
        disabled: (!canSave.value),
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
    (__VLS_unwrap(t, {})('common.save'));
    // @ts-ignore
    [t, t, busy, secondaryButton, canSave,];
    // @ts-ignore
    [];
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
