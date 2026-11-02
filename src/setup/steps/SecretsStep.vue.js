import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import SetupNotice from '../SetupNotice.vue';
import StepFrame from '../StepFrame.vue';
import { useStepForm } from '../useStepForm';
const { defineExpose, } = {};
const { t } = useI18n();
const { wizard, busy, message, save } = useStepForm('secrets');
const config = wizard.progress.value.config;
const regenerate = ref({ jwtSecret: false, appSecret: false });
const restart = ref([]);
const notice = ref('');
const secrets = ['jwtSecret', 'appSecret'];
const allLocked = computed(() => secrets.every((name) => config[name]?.locked));
async function submit() {
    const generate = secrets.filter((name) => regenerate.value[name] && !config[name]?.locked);
    // The server creates both secrets on first start, so leaving everything untouched is a valid choice.
    if (generate.length === 0)
        return true;
    const result = await save({ generate });
    if (result)
        regenerate.value = { jwtSecret: false, appSecret: false };
    restart.value = result?.restart ?? [];
    notice.value = result?.message ?? '';
    return result !== null && restart.value.length === 0;
}
const __VLS_exposed = { submit };
defineExpose(__VLS_exposed);
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(allLocked, {});
    __VLS_withDotValue(config, {});
    __VLS_withDotValue(regenerate, {});
    __VLS_withDotValue(notice, {});
    __VLS_withDotValue(restart, {});
    __VLS_withDotValue(message, {});
    const __VLS_0 = StepFrame || StepFrame;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('setup.secrets.title')), description: (__VLS_unwrap(t, {})('setup.secrets.description')),
    }));
    const __VLS_2 = __VLS_1({
        title: (__VLS_unwrap(t, {})('setup.secrets.title')),
        description: (__VLS_unwrap(t, {})('setup.secrets.description')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    if (allLocked.value) {
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
        [t, t, t, allLocked,];
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
            ...{ class: "flex flex-col gap-2" },
            'aria-busy': (__VLS_unwrap(busy, {})),
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        const __VLS_12 = __VLS_tryAsConstant((__VLS_unwrap(secrets, {})));
        for (const [name] of __VLS_vFor(__VLS_nonNull(__VLS_12))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                key: (name),
                ...{ class: "flex items-start justify-between gap-4 rounded border border-flixer-border bg-flixer-surface/60 px-4 py-3 text-sm" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/60']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "min-w-0" },
            });
            /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "font-semibold" },
            });
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            (__VLS_unwrap(t, {})(`setup.secrets.${name}`));
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (config.value[name]?.locked ? __VLS_unwrap(t, {})('setup.secrets.fromEnvironment') : config.value[name]?.set ? __VLS_unwrap(t, {})('setup.secrets.generated') : __VLS_unwrap(t, {})('setup.secrets.pending'));
            if (!config.value[name]?.locked) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                    ...{ class: "flex shrink-0 items-center gap-2 text-xs text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    type: "checkbox",
                    disabled: (__VLS_unwrap(busy, {})),
                });
                (regenerate.value[name]);
                (__VLS_unwrap(t, {})('setup.secrets.regenerate'));
            }
            // @ts-ignore
            [t, t, t, t, t, busy, busy, secrets, config, config, config, regenerate,];
        }
    }
    if (notice.value) {
        const __VLS_13 = SetupNotice || SetupNotice;
        // @ts-ignore
        const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
            // @ts-ignore
            kind: "info",
        }));
        const __VLS_15 = __VLS_14({
            kind: "info",
        }, ...__VLS_functionalComponentArgsRest(__VLS_14));
        var __VLS_16;
        const { default: __VLS_18 } = __VLS_nonNull(__VLS_16.slots);
        (notice.value);
        // @ts-ignore
        [notice, notice,];
    }
    if (restart.value.length) {
        const __VLS_19 = SetupNotice || SetupNotice;
        // @ts-ignore
        const __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({
            // @ts-ignore
            kind: "info",
        }));
        const __VLS_21 = __VLS_20({
            kind: "info",
        }, ...__VLS_functionalComponentArgsRest(__VLS_20));
        var __VLS_22;
        const { default: __VLS_24 } = __VLS_nonNull(__VLS_22.slots);
        (__VLS_unwrap(t, {})('setup.restartNeeded', { services: restart.value.join(', ') }));
        // @ts-ignore
        [t, restart, restart,];
    }
    if (message.value) {
        const __VLS_25 = SetupNotice || SetupNotice;
        // @ts-ignore
        const __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25({
            // @ts-ignore
            kind: "error",
        }));
        const __VLS_27 = __VLS_26({
            kind: "error",
        }, ...__VLS_functionalComponentArgsRest(__VLS_26));
        var __VLS_28;
        const { default: __VLS_30 } = __VLS_nonNull(__VLS_28.slots);
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
