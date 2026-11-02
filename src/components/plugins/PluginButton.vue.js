import { computed, ref } from 'vue';
import { usePluginContext } from '../../composables/usePluginActions';
import { buttonClasses } from './classes';
const { defineProps, } = {};
const props = defineProps();
const context = usePluginContext();
const running = ref(false);
const disabled = computed(() => props.node.disabled === true || context.busy.value);
async function click() {
    running.value = true;
    try {
        await context.run(props.node.action, { confirm: props.node.confirm, danger: props.node.variant === 'danger' });
    }
    finally {
        running.value = false;
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
    __VLS_withDotValue(buttonClasses, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (click) },
        type: "button",
        ...{ class: (buttonClasses.value[__VLS_ctx.node.variant ?? 'quiet']) },
        disabled: (__VLS_unwrap(disabled, {})),
        'aria-busy': (__VLS_unwrap(running, {})),
    });
    (__VLS_ctx.node.label);
    // @ts-ignore
    [buttonClasses, node, node, disabled, running,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
