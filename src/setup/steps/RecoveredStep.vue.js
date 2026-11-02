import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import StepFrame from '../StepFrame.vue';
import { clearRecoveryCode } from '../setupApi';
import { markSetupComplete } from '../setupGate';
const { defineExpose, } = {};
const { t } = useI18n();
const router = useRouter();
async function submit() {
    clearRecoveryCode();
    markSetupComplete();
    await router.replace({ name: 'login' });
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
    const __VLS_0 = StepFrame;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('setup.recovered.title')), description: (__VLS_unwrap(t, {})('setup.recovered.description')),
    }));
    const __VLS_2 = __VLS_1({
        title: (__VLS_unwrap(t, {})('setup.recovered.title')),
        description: (__VLS_unwrap(t, {})('setup.recovered.description')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    // @ts-ignore
    [t, t,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    setup: () => __VLS_exposed,
});
export default {};
