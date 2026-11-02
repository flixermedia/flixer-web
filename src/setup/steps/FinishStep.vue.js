import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import SetupNotice from '../SetupNotice.vue';
import StepFrame from '../StepFrame.vue';
import { markSetupComplete } from '../setupGate';
import { clearRecoveryCode, completeSetup } from '../setupApi';
import { useStepForm } from '../useStepForm';
const { defineExpose, } = {};
const { t } = useI18n();
const router = useRouter();
const { wizard, busy, message, run } = useStepForm('finish');
const summary = computed(() => {
    const config = wizard.progress.value.config;
    // Quick setup saves the bundled Redis default when it finishes, so it counts as configured here.
    return [
        { label: t('setup.steps.database'), ok: config.databaseUrl?.set === true },
        { label: t('setup.steps.admin'), ok: wizard.progress.value.adminExists },
        { label: t('setup.steps.urls'), ok: config.publicUrl?.set === true },
        { label: t('setup.steps.redis'), ok: config.redisUrl?.set === true || (wizard.flow.value === 'quick' && Boolean(config.redisUrl?.default)) },
        ...(wizard.flow.value === 'advanced'
            ? [
                { label: t('setup.steps.services'), ok: config.indexerUrl?.set === true && config.streamerInternalUrl?.set === true },
                { label: t('setup.steps.secrets'), ok: config.jwtSecret?.set === true && config.appSecret?.set === true },
            ]
            : []),
    ];
});
async function submit() {
    const done = await run(async () => {
        await completeSetup();
        return true;
    });
    if (!done)
        return false;
    clearRecoveryCode();
    markSetupComplete();
    await router.replace({ name: 'home' });
    return false;
}
const __VLS_exposed = { submit };
defineExpose(__VLS_exposed);
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(message, {});
    const __VLS_0 = StepFrame || StepFrame;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('setup.finish_.title')), description: (__VLS_unwrap(t, {})('setup.finish_.description')),
    }));
    const __VLS_2 = __VLS_1({
        title: (__VLS_unwrap(t, {})('setup.finish_.title')),
        description: (__VLS_unwrap(t, {})('setup.finish_.description')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
        ...{ class: "flex flex-col gap-2" },
        'aria-busy': (__VLS_unwrap(busy, {})),
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    const __VLS_6 = __VLS_tryAsConstant((__VLS_unwrap(summary, {})));
    for (const [item] of __VLS_vFor(__VLS_nonNull(__VLS_6))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
            key: (item.label),
            ...{ class: "flex items-center justify-between rounded border border-flixer-border bg-flixer-surface/60 px-4 py-3 text-sm" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/60']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (item.label);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: (item.ok ? 'text-emerald-300' : 'text-amber-300') },
        });
        (item.ok ? __VLS_unwrap(t, {})('setup.finish_.configured') : __VLS_unwrap(t, {})('setup.finish_.missing'));
        // @ts-ignore
        [t, t, t, t, busy, summary,];
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
