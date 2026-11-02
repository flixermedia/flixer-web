import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import TextInput from '../../components/ui/TextInput.vue';
import SetupNotice from '../SetupNotice.vue';
import StepFrame from '../StepFrame.vue';
import { useStepForm } from '../useStepForm';
const { defineExpose, } = {};
const { t } = useI18n();
const { wizard, verified, busy, message, fieldErrors, testResult, test, save, locked } = useStepForm('services');
const config = wizard.progress.value.config;
const indexerUrl = ref(config.indexerUrl?.value || config.indexerUrl?.default || 'http://localhost:8092');
const streamerInternalUrl = ref(config.streamerInternalUrl?.value || config.streamerInternalUrl?.default || 'http://localhost:8091');
const streamerPublicUrl = ref(config.streamerPublicUrl?.value ?? '');
const lockedNames = ['indexerUrl', 'streamerInternalUrl', 'streamerPublicUrl'].map((name) => locked(name));
const environmentLocked = computed(() => lockedNames.some((flag) => flag.value));
const canContinue = computed(() => environmentLocked.value || verified.value);
watch([indexerUrl, streamerInternalUrl, streamerPublicUrl], () => (verified.value = false));
function values() {
    return { indexerUrl: indexerUrl.value.trim(), streamerInternalUrl: streamerInternalUrl.value.trim(), streamerPublicUrl: streamerPublicUrl.value.trim() };
}
async function submit() {
    if (environmentLocked.value)
        return true;
    if (!(await test(values())))
        return false;
    return (await save(values())) !== null;
}
const __VLS_exposed = { submit, canContinue };
defineExpose(__VLS_exposed);
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(environmentLocked, {});
    __VLS_withDotValue(wizard, {});
    __VLS_withDotValue(fieldErrors, {});
    __VLS_withDotValue(busy, {});
    __VLS_withDotValue(indexerUrl, {});
    __VLS_withDotValue(streamerInternalUrl, {});
    __VLS_withDotValue(testResult, {});
    __VLS_withDotValue(message, {});
    const __VLS_0 = StepFrame || StepFrame;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('setup.services.title')), description: (__VLS_unwrap(t, {})('setup.services.description')),
    }));
    const __VLS_2 = __VLS_1({
        title: (__VLS_unwrap(t, {})('setup.services.title')),
        description: (__VLS_unwrap(t, {})('setup.services.description')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    if (environmentLocked.value) {
        const __VLS_6 = SetupNotice || SetupNotice;
        // @ts-ignore
        const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
            // @ts-ignore
            kind: "info",
        }));
        const __VLS_8 = __VLS_7({
            kind: "info",
        }, ...__VLS_functionalComponentArgsRest(__VLS_7));
        var __VLS_9;
        const { default: __VLS_11 } = __VLS_nonNull(__VLS_9.slots);
        (__VLS_unwrap(t, {})('setup.lockedByEnvironment'));
        // @ts-ignore
        [t, t, t, environmentLocked,];
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
            ...{ onSubmit: (...[$event]) => {
                    void $event;
                    if (!!(environmentLocked.value))
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
            modelValue: (indexerUrl.value), modelModifiers: { trim: true, }, label: (__VLS_unwrap(t, {})('setup.services.indexerUrl')), hint: (fieldErrors.value.indexerUrl), placeholder: "http:/*indexer:8092", *() { }
        } / autocomplete, "off", spellcheck, "false", disabled, (busy.value)));
    }
    ;
    const __VLS_14 = __VLS_13({
        modelValue: (indexerUrl.value),
        modelModifiers: { trim: true, },
        label: (__VLS_unwrap(t, {})('setup.services.indexerUrl')),
        hint: (fieldErrors.value.indexerUrl),
        placeholder: "http://indexer:8092",
        autocomplete: "off",
        spellcheck: "false",
        disabled: (busy.value),
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    const __VLS_17 = TextInput;
    // @ts-ignore
    const __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({
        // @ts-ignore
        modelValue: (streamerInternalUrl.value), modelModifiers: { trim: true, }, label: (__VLS_unwrap(t, {})('setup.services.streamerInternalUrl')), hint: (fieldErrors.value.streamerInternalUrl), placeholder: "http:/*streamer:8091", *() { }
    } / autocomplete, "off", spellcheck, "false", disabled, (busy.value)));
};
const __VLS_19 = __VLS_18({
    modelValue: (streamerInternalUrl.value),
    modelModifiers: { trim: true, },
    label: (__VLS_unwrap(t, {})('setup.services.streamerInternalUrl')),
    hint: (fieldErrors.value.streamerInternalUrl),
    placeholder: "http://streamer:8091",
    autocomplete: "off",
    spellcheck: "false",
    disabled: (busy.value),
}, ...__VLS_functionalComponentArgsRest(__VLS_18));
const __VLS_22 = TextInput;
// @ts-ignore
const __VLS_23 = __VLS_asFunctionalComponent1(__VLS_22, new __VLS_22({
    // @ts-ignore
    modelValue: (__VLS_unwrap(streamerPublicUrl, {})), modelModifiers: { trim: true, }, label: (__VLS_unwrap(t, {})('setup.services.streamerPublicUrl')), hint: (fieldErrors.value.streamerPublicUrl || __VLS_unwrap(t, {})('setup.services.streamerPublicHint')), placeholder: "Leave empty to use this site's address", autocomplete: "off", spellcheck: "false", disabled: (busy.value),
}));
const __VLS_24 = __VLS_23({
    modelValue: (__VLS_unwrap(streamerPublicUrl, {})),
    modelModifiers: { trim: true, },
    label: (__VLS_unwrap(t, {})('setup.services.streamerPublicUrl')),
    hint: (fieldErrors.value.streamerPublicUrl || __VLS_unwrap(t, {})('setup.services.streamerPublicHint')),
    placeholder: "Leave empty to use this site's address",
    autocomplete: "off",
    spellcheck: "false",
    disabled: (busy.value),
}, ...__VLS_functionalComponentArgsRest(__VLS_23));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            void $event;
            if (!!(environmentLocked.value))
                throw 0;
            return (__VLS_unwrap(test, {})(values()));
            // @ts-ignore
            [t, t, t, t, indexerUrl, fieldErrors, fieldErrors, fieldErrors, busy, busy, busy, streamerInternalUrl, streamerPublicUrl, test,];
        } },
    type: "button",
    ...{ class: "h-10 rounded border border-flixer-border px-4 text-sm font-semibold transition hover:border-flixer-accent/60 disabled:opacity-60" },
    disabled: (busy.value || !indexerUrl.value || !streamerInternalUrl.value),
});
/** @type {__VLS_StyleScopedClasses['h-10']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['transition']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:border-flixer-accent/60']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
(__VLS_unwrap(t, {})('setup.testConnection'));
if (testResult.value) {
    const __VLS_27 = SetupNotice || SetupNotice;
    // @ts-ignore
    const __VLS_28 = __VLS_asFunctionalComponent1(__VLS_27, new __VLS_27({
        // @ts-ignore
        kind: (testResult.value.ok ? 'success' : 'error'),
    }));
    const __VLS_29 = __VLS_28({
        kind: (testResult.value.ok ? 'success' : 'error'),
    }, ...__VLS_functionalComponentArgsRest(__VLS_28));
    var __VLS_30;
    const { default: __VLS_32 } = __VLS_nonNull(__VLS_30.slots);
    (testResult.value.ok ? __VLS_unwrap(t, {})('setup.connectionOk') : testResult.value.message || __VLS_unwrap(t, {})('setup.connectionFailed'));
    // @ts-ignore
    [t, t, t, indexerUrl, busy, streamerInternalUrl, testResult, testResult, testResult, testResult,];
}
if (message.value) {
    const __VLS_33 = SetupNotice || SetupNotice;
    // @ts-ignore
    const __VLS_34 = __VLS_asFunctionalComponent1(__VLS_33, new __VLS_33({
        // @ts-ignore
        kind: "error",
    }));
    const __VLS_35 = __VLS_34({
        kind: "error",
    }, ...__VLS_functionalComponentArgsRest(__VLS_34));
    var __VLS_36;
    const { default: __VLS_38 } = __VLS_nonNull(__VLS_36.slots);
    (message.value);
    // @ts-ignore
    [message, message,];
}
// @ts-ignore
[];
// @ts-ignore
[];
return {};
;
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    setup: () => __VLS_exposed,
});
export default {};
