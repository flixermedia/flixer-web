import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { createFriendInvite } from '../../api';
import { catchError } from '../../utils/catchError';
const { defineProps, defineOptions, } = {};
defineOptions({ modalGroup: 'default' });
const props = defineProps();
const { close } = useModalContext();
const { t } = useI18n();
const router = useRouter();
const mode = ref('once');
const duration = ref(24);
const durationUnit = ref('hours');
const link = ref('');
const busy = ref(false);
const error = ref(false);
const copied = ref(false);
const shareAvailable = computed(() => Capacitor.isNativePlatform() || typeof navigator.share === 'function');
async function createLink() {
    if (busy.value)
        return;
    busy.value = true;
    error.value = false;
    try {
        const expiresInHours = mode.value === 'expires' ? duration.value * (durationUnit.value === 'days' ? 24 : 1) : undefined;
        const [failure, invite] = await catchError(createFriendInvite(props.username, {
            mode: mode.value,
            expiresInHours,
        }));
        if (failure) {
            error.value = true;
            return;
        }
        link.value = new URL(router.resolve({ name: 'friend-invite', params: { token: invite.token } }).href, window.location.origin).toString();
    }
    finally {
        busy.value = false;
    }
}
async function copyLink() {
    const [failure] = await catchError(navigator.clipboard.writeText(link.value));
    if (failure) {
        error.value = true;
        return;
    }
    copied.value = true;
}
async function shareLink() {
    const [cause] = Capacitor.isNativePlatform() ? await catchError(Share.share({ title: t('social.shareProfile'), url: link.value, dialogTitle: t('social.shareProfile') }).then(() => undefined)) : await catchError(navigator.share({ title: t('social.shareProfile'), url: link.value }));
    if (cause) {
        if (cause.name === 'AbortError')
            return;
        error.value = true;
    }
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
    __VLS_withDotValue(link, {});
    __VLS_withDotValue(durationUnit, {});
    __VLS_withDotValue(mode, {});
    __VLS_withDotValue(duration, {});
    __VLS_withDotValue(error, {});
    __VLS_withDotValue(busy, {});
    __VLS_withDotValue(shareAvailable, {});
    __VLS_withDotValue(copied, {});
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
        ...{ class: "flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-y-auto rounded border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60" },
    }));
    const __VLS_8 = __VLS_7({
        ...{ class: "flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-y-auto rounded border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    /** @type {__VLS_StyleScopedClasses['flixer-modal-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-h-[calc(100dvh-2rem)]']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
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
        ...{ class: "text-lg font-semibold text-white" },
    }));
    const __VLS_14 = __VLS_13({
        ...{ class: "text-lg font-semibold text-white" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    var __VLS_15;
    const { default: __VLS_17 } = __VLS_nonNull(__VLS_15.slots);
    (__VLS_unwrap(t, {})('social.friendInvite.title'));
    // @ts-ignore
    [t,];
    let __VLS_18;
    /** @ts-ignore @type { | typeof ModalDescription | typeof ModalDescription} */
    ModalDescription;
    // @ts-ignore
    const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
        // @ts-ignore
        ...{ class: "mt-1 text-sm leading-6 text-flixer-muted" },
    }));
    const __VLS_20 = __VLS_19({
        ...{ class: "mt-1 text-sm leading-6 text-flixer-muted" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_19));
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['leading-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    var __VLS_21;
    const { default: __VLS_23 } = __VLS_nonNull(__VLS_21.slots);
    (__VLS_unwrap(t, {})('social.friendInvite.optionsDescription'));
    // @ts-ignore
    [t,];
    if (!link.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-5 space-y-3" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "flex cursor-pointer items-start gap-3 rounded border border-flixer-border p-3 hover:bg-white/5" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/5']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "radio",
            value: "once",
            ...{ class: "mt-1 accent-flixer-accent" },
        });
        (mode.value);
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['accent-flixer-accent']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "block text-sm font-semibold text-white" },
        });
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        (__VLS_unwrap(t, {})('social.friendInvite.once'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "mt-1 block text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('social.friendInvite.onceDescription'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "flex cursor-pointer items-start gap-3 rounded border border-flixer-border p-3 hover:bg-white/5" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/5']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "radio",
            value: "unlimited",
            ...{ class: "mt-1 accent-flixer-accent" },
        });
        (mode.value);
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['accent-flixer-accent']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "block text-sm font-semibold text-white" },
        });
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        (__VLS_unwrap(t, {})('social.friendInvite.unlimited'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "mt-1 block text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('social.friendInvite.unlimitedDescription'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "block cursor-pointer rounded border border-flixer-border p-3 hover:bg-white/5" },
        });
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/5']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "flex items-start gap-3" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "radio",
            value: "expires",
            ...{ class: "mt-1 accent-flixer-accent" },
        });
        (mode.value);
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['accent-flixer-accent']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "block text-sm font-semibold text-white" },
        });
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        (__VLS_unwrap(t, {})('social.friendInvite.expires'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "mt-1 block text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('social.friendInvite.expiresDescription'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "mt-3 flex items-center gap-2 pl-6" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['pl-6']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "number",
            min: "1",
            max: (durationUnit.value === 'days' ? 365 : 8760),
            ...{ class: "w-24 rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-flixer-accent" },
            'aria-label': (__VLS_unwrap(t, {})('social.friendInvite.duration')),
            disabled: (mode.value !== 'expires'),
        });
        (duration.value);
        /** @type {__VLS_StyleScopedClasses['w-24']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus:ring-flixer-accent']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
            value: (durationUnit.value),
            ...{ class: "rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-flixer-accent" },
            'aria-label': (__VLS_unwrap(t, {})('social.friendInvite.durationUnit')),
            disabled: (mode.value !== 'expires'),
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus:ring-flixer-accent']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "hours",
        });
        (__VLS_unwrap(t, {})('social.friendInvite.hours'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "days",
        });
        (__VLS_unwrap(t, {})('social.friendInvite.days'));
        if (mode.value === 'expires' && (!Number.isInteger(duration.value) || duration.value < 1 || duration.value > (durationUnit.value === 'days' ? 365 : 8760))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-sm text-red-400" },
                role: "alert",
            });
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-red-400']} */ ;
            (__VLS_unwrap(t, {})('social.friendInvite.durationInvalid'));
        }
        if (error.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-sm text-red-400" },
                role: "alert",
            });
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-red-400']} */ ;
            (__VLS_unwrap(t, {})('social.friendInvite.createFailed'));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col-reverse']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['pt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:flex-row']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:justify-end']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!(!link.value))
                        throw 0;
                    return (__VLS_unwrap(close, {})());
                    // @ts-ignore
                    [t, t, t, t, t, t, t, t, t, t, t, t, link, mode, mode, mode, mode, mode, mode, durationUnit, durationUnit, durationUnit, duration, duration, duration, duration, error, close,];
                } },
            type: "button",
            ...{ class: "h-11 rounded border border-flixer-border px-5 text-sm font-semibold hover:bg-white/5" },
        });
        /** @type {__VLS_StyleScopedClasses['h-11']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/5']} */ ;
        (__VLS_unwrap(t, {})('common.cancel'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (createLink) },
            type: "button",
            ...{ class: "h-11 rounded bg-white px-5 text-sm font-bold text-flixer-background disabled:opacity-50" },
            disabled: (busy.value || (mode.value === 'expires' && (!Number.isInteger(duration.value) || duration.value < 1 || duration.value > (durationUnit.value === 'days' ? 365 : 8760)))),
        });
        /** @type {__VLS_StyleScopedClasses['h-11']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-background']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
        (busy.value ? __VLS_unwrap(t, {})('social.saving') : __VLS_unwrap(t, {})('social.friendInvite.createLink'));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-5 space-y-4" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "block space-y-2 text-sm font-medium text-white" },
        });
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_unwrap(t, {})('social.friendInvite.link'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            value: (link.value),
            readonly: true,
            ...{ class: "w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-flixer-accent" },
        });
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus:ring-flixer-accent']} */ ;
        if (error.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-sm text-red-400" },
                role: "alert",
            });
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-red-400']} */ ;
            (__VLS_unwrap(t, {})('social.friendInvite.shareFailed'));
        }
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
                    if (!!(!link.value))
                        throw 0;
                    return (__VLS_unwrap(close, {})());
                    // @ts-ignore
                    [t, t, t, t, t, link, mode, durationUnit, duration, duration, duration, error, close, busy, busy,];
                } },
            type: "button",
            ...{ class: "h-11 rounded border border-flixer-border px-5 text-sm font-semibold hover:bg-white/5" },
        });
        /** @type {__VLS_StyleScopedClasses['h-11']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/5']} */ ;
        (__VLS_unwrap(t, {})('common.close'));
        if (shareAvailable.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (shareLink) },
                type: "button",
                ...{ class: "h-11 rounded border border-flixer-border px-5 text-sm font-semibold hover:bg-white/5" },
            });
            /** @type {__VLS_StyleScopedClasses['h-11']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-5']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/5']} */ ;
            (__VLS_unwrap(t, {})('social.friendInvite.share'));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (copyLink) },
            type: "button",
            ...{ class: "h-11 rounded bg-white px-5 text-sm font-bold text-flixer-background" },
        });
        /** @type {__VLS_StyleScopedClasses['h-11']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-background']} */ ;
        (copied.value ? __VLS_unwrap(t, {})('social.friendInvite.copied') : __VLS_unwrap(t, {})('social.friendInvite.copyLink'));
    }
    // @ts-ignore
    [t, t, t, t, shareAvailable, copied,];
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
