import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import TextInput from '../../components/ui/TextInput.vue';
import SetupNotice from '../SetupNotice.vue';
import StepFrame from '../StepFrame.vue';
import { useStepForm } from '../useStepForm';
const { defineExpose, } = {};
const { t } = useI18n();
const { wizard, busy, message, fieldErrors, save } = useStepForm('urls');
const config = wizard.progress.value.config;
// Anything the environment sets wins over the store, so there is nothing to ask for.
const environmentLocked = computed(() => ['publicUrl', 'appUrl', 'passkeyRpId', 'passkeyOrigins'].some((name) => config[name]?.locked));
const publicUrl = ref(config.publicUrl?.value || window.location.origin);
const advanced = computed(() => wizard.flow.value === 'advanced');
const appUrl = ref(config.appUrl?.value ?? '');
const passkeyRpId = ref(config.passkeyRpId?.value ?? '');
const passkeyOrigins = ref(config.passkeyOrigins?.value ?? '');
async function submit() {
    if (environmentLocked.value)
        return true;
    const values = { publicUrl: publicUrl.value.trim() };
    if (advanced.value)
        Object.assign(values, { appUrl: appUrl.value.trim(), passkeyRpId: passkeyRpId.value.trim(), passkeyOrigins: passkeyOrigins.value.trim() });
    return (await save(values)) !== null;
}
const __VLS_exposed = { submit };
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
    __VLS_withDotValue(advanced, {});
    __VLS_withDotValue(message, {});
    const __VLS_0 = StepFrame || StepFrame;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('setup.urls.title')), description: (__VLS_unwrap(t, {})('setup.urls.description')),
    }));
    const __VLS_2 = __VLS_1({
        title: (__VLS_unwrap(t, {})('setup.urls.title')),
        description: (__VLS_unwrap(t, {})('setup.urls.description')),
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
            modelValue: (__VLS_unwrap(publicUrl, {})), modelModifiers: { trim: true, }, label: (__VLS_unwrap(t, {})('setup.urls.publicUrl')), hint: (fieldErrors.value.publicUrl || fieldErrors.value.passkeyOrigins || fieldErrors.value.passkeyRpId || __VLS_unwrap(t, {})('setup.urls.hint')), placeholder: "https:/*flixer.example.com", *() { }
        } / autocomplete, "url", spellcheck, "false", disabled, (__VLS_unwrap(busy, {}))));
    }
    ;
    const __VLS_14 = __VLS_13({
        modelValue: (__VLS_unwrap(publicUrl, {})),
        modelModifiers: { trim: true, },
        label: (__VLS_unwrap(t, {})('setup.urls.publicUrl')),
        hint: (fieldErrors.value.publicUrl || fieldErrors.value.passkeyOrigins || fieldErrors.value.passkeyRpId || __VLS_unwrap(t, {})('setup.urls.hint')),
        placeholder: "https://flixer.example.com",
        autocomplete: "url",
        spellcheck: "false",
        disabled: (__VLS_unwrap(busy, {})),
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    if (advanced.value) {
        const __VLS_17 = TextInput;
        // @ts-ignore
        const __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({
            // @ts-ignore
            modelValue: (__VLS_unwrap(appUrl, {})), modelModifiers: { trim: true, }, label: (__VLS_unwrap(t, {})('setup.urls.appUrl')), hint: (fieldErrors.value.appUrl || __VLS_unwrap(t, {})('setup.urls.appUrlHint')), autocomplete: "off", spellcheck: "false", disabled: (__VLS_unwrap(busy, {})),
        }));
        const __VLS_19 = __VLS_18({
            modelValue: (__VLS_unwrap(appUrl, {})),
            modelModifiers: { trim: true, },
            label: (__VLS_unwrap(t, {})('setup.urls.appUrl')),
            hint: (fieldErrors.value.appUrl || __VLS_unwrap(t, {})('setup.urls.appUrlHint')),
            autocomplete: "off",
            spellcheck: "false",
            disabled: (__VLS_unwrap(busy, {})),
        }, ...__VLS_functionalComponentArgsRest(__VLS_18));
        const __VLS_22 = TextInput;
        // @ts-ignore
        const __VLS_23 = __VLS_asFunctionalComponent1(__VLS_22, new __VLS_22({
            // @ts-ignore
            modelValue: (__VLS_unwrap(passkeyRpId, {})), modelModifiers: { trim: true, }, label: (__VLS_unwrap(t, {})('setup.urls.passkeyRpId')), hint: (__VLS_unwrap(t, {})('setup.urls.passkeyRpIdHint')), autocomplete: "off", spellcheck: "false", disabled: (__VLS_unwrap(busy, {})),
        }));
        const __VLS_24 = __VLS_23({
            modelValue: (__VLS_unwrap(passkeyRpId, {})),
            modelModifiers: { trim: true, },
            label: (__VLS_unwrap(t, {})('setup.urls.passkeyRpId')),
            hint: (__VLS_unwrap(t, {})('setup.urls.passkeyRpIdHint')),
            autocomplete: "off",
            spellcheck: "false",
            disabled: (__VLS_unwrap(busy, {})),
        }, ...__VLS_functionalComponentArgsRest(__VLS_23));
        const __VLS_27 = TextInput;
        // @ts-ignore
        const __VLS_28 = __VLS_asFunctionalComponent1(__VLS_27, new __VLS_27({
            // @ts-ignore
            modelValue: (__VLS_unwrap(passkeyOrigins, {})), modelModifiers: { trim: true, }, label: (__VLS_unwrap(t, {})('setup.urls.passkeyOrigins')), hint: (__VLS_unwrap(t, {})('setup.urls.passkeyOriginsHint')), autocomplete: "off", spellcheck: "false", disabled: (__VLS_unwrap(busy, {})),
        }));
        const __VLS_29 = __VLS_28({
            modelValue: (__VLS_unwrap(passkeyOrigins, {})),
            modelModifiers: { trim: true, },
            label: (__VLS_unwrap(t, {})('setup.urls.passkeyOrigins')),
            hint: (__VLS_unwrap(t, {})('setup.urls.passkeyOriginsHint')),
            autocomplete: "off",
            spellcheck: "false",
            disabled: (__VLS_unwrap(busy, {})),
        }, ...__VLS_functionalComponentArgsRest(__VLS_28));
    }
};
if (message.value) {
    const __VLS_32 = SetupNotice || SetupNotice;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({
        // @ts-ignore
        kind: "error",
    }));
    const __VLS_34 = __VLS_33({
        kind: "error",
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    var __VLS_35;
    const { default: __VLS_37 } = __VLS_nonNull(__VLS_35.slots);
    (message.value);
    // @ts-ignore
    [t, t, t, t, t, t, t, t, publicUrl, fieldErrors, fieldErrors, fieldErrors, fieldErrors, busy, busy, busy, busy, advanced, appUrl, passkeyRpId, passkeyOrigins, message, message,];
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
