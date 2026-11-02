import { browserSupportsWebAuthn } from '@simplewebauthn/browser';
import { openModal } from '@kolirt/vue-modal';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import ListSkeleton from '../ui/ListSkeleton.vue';
import { listPasskeys, registerPasskey, setPasskeyRequired } from '../../api';
import { notify } from '../../composables/notify';
import { describeRequestError, useProfile } from '../../composables/useProfile';
import { catchError } from '../../utils/catchError';
import AddPasskeyForm from './AddPasskeyForm.vue';
import AddPasskeyModal from './AddPasskeyModal.vue';
import DisablePasskeyRequiredModal from './DisablePasskeyRequiredModal.vue';
import PasskeyList from './PasskeyList.vue';
import RemovePasskeyModal from './RemovePasskeyModal.vue';
const { profile, load: loadProfile, setProfile } = useProfile();
const { t } = useI18n();
const isTogglingRequired = ref(false);
const passkeyRequired = computed(() => profile.value?.passkeyRequired === true);
async function handleToggleRequired() {
    if (passkeyRequired.value) {
        const updated = await openModal(DisablePasskeyRequiredModal).catch(() => null);
        if (updated) {
            setProfile(updated);
            notify.success(t('settings.passkeys.noLongerRequired'));
        }
        return;
    }
    isTogglingRequired.value = true;
    try {
        const [toggleError, updated] = await catchError(setPasskeyRequired(true));
        if (toggleError) {
            notify.error(describeError(toggleError));
        }
        else {
            setProfile(updated);
            notify.success(t('settings.passkeys.nowRequired'));
        }
    }
    finally {
        isTogglingRequired.value = false;
    }
}
const supported = browserSupportsWebAuthn();
const passkeys = ref([]);
const isLoading = ref(true);
const isRegistering = ref(false);
const deletingId = ref(null);
function describeError(error) {
    console.error('[settings] passkey error', error);
    if (error instanceof Error && error.name === 'NotAllowedError') {
        return t('settings.passkeys.errors.requestCancelled', { message: error.message });
    }
    if (error instanceof Error && error.name === 'InvalidStateError') {
        return t('settings.passkeys.errors.alreadyRegistered');
    }
    return describeRequestError(error, t('settings.passkeys.errors.requestFailed'));
}
async function load() {
    try {
        const [error, result] = await catchError(listPasskeys());
        if (error) {
            notify.error(describeError(error));
        }
        else {
            passkeys.value = result;
        }
    }
    finally {
        isLoading.value = false;
    }
}
async function handleAdd(name) {
    const options = await openModal(AddPasskeyModal).catch(() => null);
    if (!options) {
        return;
    }
    isRegistering.value = true;
    try {
        const [error, passkey] = await catchError(registerPasskey(options, name));
        if (error) {
            notify.error(describeError(error));
        }
        else {
            passkeys.value = [passkey, ...passkeys.value];
            notify.success(t('settings.passkeys.added', { name: passkey.name }));
        }
    }
    finally {
        isRegistering.value = false;
    }
}
async function handleRemove(passkey) {
    const removed = await openModal(RemovePasskeyModal, { props: { passkeyId: passkey.id, passkeyName: passkey.name } }).catch(() => false);
    if (!removed) {
        return;
    }
    passkeys.value = passkeys.value.filter((item) => item.id !== passkey.id);
    notify.success(t('settings.passkeys.removed'));
    if (passkeys.value.length === 0) {
        void loadProfile(true);
    }
}
onMounted(() => {
    void loadProfile(true);
    void load();
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(isLoading, {});
    __VLS_withDotValue(passkeys, {});
    __VLS_withDotValue(passkeyRequired, {});
    __VLS_withDotValue(isTogglingRequired, {});
    __VLS_withDotValue(profile, {});
    __VLS_withDotValue(supported, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        'aria-labelledby': "passkeys-heading",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
        id: "passkeys-heading",
        ...{ class: "text-lg font-semibold" },
    });
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    (__VLS_unwrap(t, {})('settings.tabs.passkeys'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-1 text-sm text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('settings.passkeys.description'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-6 flex flex-col gap-8" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-8']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-center justify-between gap-4 rounded border border-flixer-border bg-flixer-surface/60 p-4" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/60']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
        id: "passkey-required-label",
        ...{ class: "text-sm font-semibold" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    (__VLS_unwrap(t, {})('settings.passkeys.requiredTitle'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-1 text-sm text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('settings.passkeys.requiredDescription'));
    if (!isLoading.value && passkeys.value.length === 0 && !passkeyRequired.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-1 text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('settings.passkeys.addBeforeRequired'));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (handleToggleRequired) },
        ...{ class: "relative block shrink-0 cursor-pointer rounded-full border transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-not-allowed disabled:opacity-50" },
        ...{ class: (passkeyRequired.value ? 'border-flixer-primary bg-flixer-primary' : 'border-flixer-muted/50 bg-flixer-border') },
        ...{ style: {} },
        type: "button",
        role: "switch",
        'aria-labelledby': "passkey-required-label",
        'aria-checked': (passkeyRequired.value),
        disabled: (isTogglingRequired.value || !profile.value || (!passkeyRequired.value && passkeys.value.length === 0)),
    });
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-offset-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled:cursor-not-allowed']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "absolute rounded-full bg-white shadow transition-all" },
        ...{ style: ({ top: '0.1875rem', width: '1rem', height: '1rem', left: passkeyRequired.value ? '1.5rem' : '0.1875rem' }) },
    });
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    if (!supported.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "rounded border border-rose-300/30 bg-rose-300/10 p-3 text-sm text-rose-200" },
            role: "alert",
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-rose-300/30']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-rose-300/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-rose-200']} */ ;
        (__VLS_unwrap(t, {})('settings.passkeys.unsupported'));
    }
    else {
        const __VLS_0 = AddPasskeyForm;
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
            // @ts-ignore
            ...{ 'onAdd': {} }, isRegistering: (__VLS_unwrap(isRegistering, {})),
        }));
        const __VLS_2 = __VLS_1({
            ...{ 'onAdd': {} },
            isRegistering: (__VLS_unwrap(isRegistering, {})),
        }, ...__VLS_functionalComponentArgsRest(__VLS_1));
        let __VLS_5;
        const __VLS_6 = {
            /** @type {typeof __VLS_5.add} */
            onAdd: (handleAdd),
        };
        void __VLS_6;
        var __VLS_3;
        var __VLS_4;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    if (isLoading.value) {
        const __VLS_7 = ListSkeleton;
        // @ts-ignore
        const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        // @ts-ignore
        }));
        const __VLS_9 = __VLS_8({}, ...__VLS_functionalComponentArgsRest(__VLS_8));
    }
    else {
        const __VLS_12 = PasskeyList;
        // @ts-ignore
        const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
            // @ts-ignore
            ...{ 'onRemove': {} }, passkeys: (passkeys.value), deletingId: (__VLS_unwrap(deletingId, {})),
        }));
        const __VLS_14 = __VLS_13({
            ...{ 'onRemove': {} },
            passkeys: (passkeys.value),
            deletingId: (__VLS_unwrap(deletingId, {})),
        }, ...__VLS_functionalComponentArgsRest(__VLS_13));
        let __VLS_17;
        const __VLS_18 = {
            /** @type {typeof __VLS_17.remove} */
            onRemove: (handleRemove),
        };
        void __VLS_18;
        var __VLS_15;
        var __VLS_16;
    }
    // @ts-ignore
    [t, t, t, t, t, t, isLoading, isLoading, passkeys, passkeys, passkeys, passkeyRequired, passkeyRequired, passkeyRequired, passkeyRequired, passkeyRequired, isTogglingRequired, profile, supported, isRegistering, deletingId,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
