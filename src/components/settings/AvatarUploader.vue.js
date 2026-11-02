import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { AVATAR_TYPES, MAX_AVATAR_BYTES, removeAvatar, uploadAvatar } from '../../api';
import { notify } from '../../composables/notify';
import { describeRequestError, useProfile } from '../../composables/useProfile';
import { catchError } from '../../utils/catchError';
import UserAvatar from '../ui/UserAvatar.vue';
const { profile, setProfile } = useProfile();
const { t } = useI18n();
const fileInput = ref(null);
const isBusy = ref(false);
async function handleFile(event) {
    const input = event.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
        return;
    }
    if (!AVATAR_TYPES.includes(file.type)) {
        notify.error(t('settings.avatar.invalidType'));
        return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
        notify.error(t('settings.avatar.tooLarge'));
        return;
    }
    isBusy.value = true;
    try {
        const [error, profile] = await catchError(uploadAvatar(file));
        if (error) {
            console.error('[settings] avatar upload failed', error);
            notify.error(describeRequestError(error, t('settings.avatar.uploadFailed')));
        }
        else {
            setProfile(profile);
            notify.success(t('settings.avatar.updated'));
        }
    }
    finally {
        isBusy.value = false;
    }
}
async function handleRemove() {
    isBusy.value = true;
    try {
        const [error, profile] = await catchError(removeAvatar());
        if (error) {
            console.error('[settings] avatar removal failed', error);
            notify.error(describeRequestError(error, t('settings.avatar.removeFailed')));
        }
        else {
            setProfile(profile);
            notify.success(t('settings.avatar.removed'));
        }
    }
    finally {
        isBusy.value = false;
    }
}
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(fileInput, {});
    __VLS_withDotValue(profile, {});
    __VLS_withDotValue(isBusy, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-center gap-5" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-5']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                void $event;
                return (fileInput.value?.click());
                // @ts-ignore
                [fileInput,];
            } },
        type: "button",
        ...{ class: "group relative size-20 shrink-0 overflow-hidden rounded text-3xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-wait" },
        'aria-label': (__VLS_unwrap(t, {})('settings.avatar.changeLabel')),
        disabled: (isBusy.value),
    });
    /** @type {__VLS_StyleScopedClasses['group']} */ ;
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['size-20']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-offset-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled:cursor-wait']} */ ;
    const __VLS_0 = UserAvatar;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        avatarUrl: (profile.value?.avatarUrl), name: (profile.value?.displayName),
    }));
    const __VLS_2 = __VLS_1({
        avatarUrl: (profile.value?.avatarUrl),
        name: (profile.value?.displayName),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
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
    (isBusy.value ? __VLS_unwrap(t, {})('settings.avatar.working') : __VLS_unwrap(t, {})('settings.avatar.change'));
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
                [fileInput, t, t, t, isBusy, isBusy, profile, profile,];
            } },
        type: "button",
        ...{ class: "flex h-10 items-center justify-center rounded border border-flixer-border px-4 text-sm font-semibold text-flixer-text transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-wait disabled:opacity-60" },
        disabled: (isBusy.value),
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-white/5']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-offset-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled:cursor-wait']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
    (profile.value?.avatarUrl ? __VLS_unwrap(t, {})('settings.avatar.changePicture') : __VLS_unwrap(t, {})('settings.avatar.uploadPicture'));
    if (profile.value?.avatarUrl) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (handleRemove) },
            type: "button",
            ...{ class: "flex h-10 items-center justify-center rounded px-4 text-sm font-semibold text-rose-200 transition hover:bg-rose-400/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300 disabled:cursor-wait disabled:opacity-60" },
            disabled: (isBusy.value),
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-rose-200']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-rose-400/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-offset-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-rose-300']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:cursor-wait']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
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
    // @ts-ignore
    [t, t, t, t, isBusy, isBusy, profile, profile,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
