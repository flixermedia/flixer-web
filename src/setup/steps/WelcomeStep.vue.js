import { inject, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import SetupNotice from '../SetupNotice.vue';
import StepFrame from '../StepFrame.vue';
import { AVAILABLE_FLOWS } from '../registry';
import { describeFailure, setFlow } from '../setupApi';
import { WIZARD_KEY } from '../stepContract';
import { catchError } from '../../utils/catchError';
const { defineExpose, } = {};
const { t } = useI18n();
const wizard = inject(WIZARD_KEY);
const selected = ref(wizard.flow.value !== 'recovery' && AVAILABLE_FLOWS.includes(wizard.flow.value) ? wizard.flow.value : 'quick');
const message = ref('');
const options = [
    { flow: 'quick', available: AVAILABLE_FLOWS.includes('quick') },
    { flow: 'advanced', available: AVAILABLE_FLOWS.includes('advanced') },
];
async function submit() {
    message.value = '';
    const [flowError] = await catchError(setFlow(selected.value));
    if (flowError) {
        message.value = describeFailure(flowError, t('setup.errors.generic')).message;
        return false;
    }
    wizard.chooseFlow(selected.value);
    const [refreshError] = await catchError(wizard.refresh());
    if (refreshError) {
        message.value = describeFailure(refreshError, t('setup.errors.generic')).message;
        return false;
    }
    return true;
}
const __VLS_exposed = { submit };
defineExpose(__VLS_exposed);
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(selected, {});
    __VLS_withDotValue(message, {});
    const __VLS_0 = StepFrame || StepFrame;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('setup.welcome.title')), description: (__VLS_unwrap(t, {})('setup.welcome.description')),
    }));
    const __VLS_2 = __VLS_1({
        title: (__VLS_unwrap(t, {})('setup.welcome.title')),
        description: (__VLS_unwrap(t, {})('setup.welcome.description')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid gap-3" },
        role: "radiogroup",
        'aria-label': (__VLS_unwrap(t, {})('setup.welcome.choose')),
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    const __VLS_6 = __VLS_tryAsConstant((__VLS_unwrap(options, {})));
    for (const [option] of __VLS_vFor(__VLS_nonNull(__VLS_6))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    return (selected.value = option.flow);
                    // @ts-ignore
                    [t, t, t, options, selected,];
                } },
            key: (option.flow),
            type: "button",
            role: "radio",
            'aria-checked': (selected.value === option.flow),
            disabled: (!option.available),
            ...{ class: "rounded border p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-50" },
            ...{ class: (selected.value === option.flow ? 'border-flixer-accent bg-flixer-primary/10 ring-4 ring-flixer-primary/20' : 'border-flixer-border bg-flixer-surface/60 hover:border-flixer-accent/50') },
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:cursor-not-allowed']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "flex items-center justify-between gap-3" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-base font-semibold" },
        });
        /** @type {__VLS_StyleScopedClasses['text-base']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        (__VLS_unwrap(t, {})(`setup.welcome.${option.flow}.title`));
        if (!option.available) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "rounded-full border border-flixer-border px-2 py-0.5 text-[10px] font-semibold text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('setup.welcome.soon'));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "mt-1 block text-sm leading-6 text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['leading-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})(`setup.welcome.${option.flow}.description`));
        // @ts-ignore
        [t, t, t, selected, selected,];
    }
    if (message.value) {
        const __VLS_7 = SetupNotice || SetupNotice;
        // @ts-ignore
        const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
            // @ts-ignore
            kind: "error",
        }));
        const __VLS_9 = __VLS_8({
            kind: "error",
        }, ...__VLS_functionalComponentArgsRest(__VLS_8));
        var __VLS_10;
        const { default: __VLS_12 } = __VLS_nonNull(__VLS_10.slots);
        (message.value);
        // @ts-ignore
        [message, message,];
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
