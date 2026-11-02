import { computed, reactive, ref, useId } from 'vue';
import { useI18n } from 'vue-i18n';
import AdminToggle from '../admin/AdminToggle.vue';
import { usePluginContext } from '../../composables/usePluginActions';
import { coerceFormValues, initialFormValues } from '../../plugins/pageLogic';
import { buttonClasses, inputClass } from './classes';
const { defineProps, } = {};
const props = defineProps();
const { t } = useI18n();
const context = usePluginContext();
const idPrefix = useId();
const values = reactive(initialFormValues(props.node.fields));
const running = ref(false);
const inline = computed(() => props.node.layout === 'inline');
const fieldId = (name) => `${idPrefix}-${name}`;
const helpId = (name) => `${idPrefix}-${name}-help`;
async function submit() {
    running.value = true;
    try {
        const ok = await context.run(props.node.submit.action, { values: coerceFormValues(props.node.fields, values) });
        if (ok) {
            for (const field of props.node.fields)
                if (field.type === 'password')
                    values[field.name] = '';
        }
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
    __VLS_withDotValue(inline, {});
    __VLS_withDotValue(values, {});
    __VLS_withDotValue(buttonClasses, {});
    __VLS_withDotValue(context, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (submit) },
        ...{ class: (inline.value ? 'flex flex-wrap items-end gap-3' : 'grid gap-4 sm:grid-cols-2') },
    });
    const __VLS_0 = __VLS_tryAsConstant((__VLS_ctx.node.fields));
    for (const [field, index] of __VLS_vFor(__VLS_nonNull(__VLS_0))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.template)({
            key: (`${field.name}-${index}`),
        });
        if (field.type === 'hidden') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "hidden",
            });
            (values.value[field.name]);
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: ([inline.value ? 'min-w-40 flex-1' : field.type === 'textarea' || field.type === 'switch' || field.type === 'checkbox' ? 'sm:col-span-2' : '']) },
            });
            if (field.type === 'switch') {
                const __VLS_1 = AdminToggle;
                // @ts-ignore
                const __VLS_2 = __VLS_asFunctionalComponent1(__VLS_1, new __VLS_1({
                    // @ts-ignore
                    modelValue: values.value[field.name], label: (field.label ?? field.name), description: (field.help), ...{ class: ({ 'pointer-events-none opacity-60': field.disabled }) },
                }));
                const __VLS_3 = __VLS_2({
                    modelValue: values.value[field.name],
                    label: (field.label ?? field.name),
                    description: (field.help),
                    ...{ class: ({ 'pointer-events-none opacity-60': field.disabled }) },
                }, ...__VLS_functionalComponentArgsRest(__VLS_2));
                /** @type {__VLS_StyleScopedClasses['pointer-events-none']} */ ;
                /** @type {__VLS_StyleScopedClasses['opacity-60']} */ ;
            }
            else if (field.type === 'checkbox') {
                __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                    ...{ class: "flex items-start gap-2 text-sm" },
                    ...{ class: ({ 'opacity-60': field.disabled }) },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['opacity-60']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    type: "checkbox",
                    ...{ class: "mt-0.5 size-4 accent-flixer-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" },
                    disabled: (field.disabled),
                    'aria-describedby': (field.help ? __VLS_unwrap(helpId, {})(field.name) : undefined),
                });
                (values.value[field.name]);
                /** @type {__VLS_StyleScopedClasses['mt-0.5']} */ ;
                /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['accent-flixer-primary']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline-offset-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                (field.label);
            }
            else {
                if (field.label) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                        for: (__VLS_unwrap(fieldId, {})(field.name)),
                        ...{ class: "mb-1 block text-sm font-medium" },
                    });
                    /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
                    /** @type {__VLS_StyleScopedClasses['block']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
                    (field.label);
                    if (field.required) {
                        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                            ...{ class: "ml-0.5 text-red-300" },
                            'aria-hidden': "true",
                        });
                        /** @type {__VLS_StyleScopedClasses['ml-0.5']} */ ;
                        /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
                    }
                }
                if (field.type === 'select') {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                        id: (__VLS_unwrap(fieldId, {})(field.name)),
                        value: (values.value[field.name]),
                        ...{ class: (__VLS_unwrap(inputClass, {})) },
                        required: (field.required),
                        disabled: (field.disabled),
                        'aria-describedby': (field.help ? __VLS_unwrap(helpId, {})(field.name) : undefined),
                    });
                    if (field.placeholder) {
                        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                            value: "",
                        });
                        (field.placeholder);
                    }
                    const __VLS_6 = __VLS_tryAsConstant((field.options));
                    for (const [option] of __VLS_vFor(__VLS_nonNull(__VLS_6))) {
                        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                            key: (option.value),
                            value: (option.value),
                        });
                        (option.label);
                        // @ts-ignore
                        [inline, inline, node, values, values, values, values, helpId, helpId, fieldId, fieldId, inputClass,];
                    }
                }
                else if (field.type === 'textarea') {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea)({
                        id: (__VLS_unwrap(fieldId, {})(field.name)),
                        value: values.value[field.name],
                        rows: "4",
                        ...{ class: (__VLS_unwrap(inputClass, {})) },
                        placeholder: (field.placeholder),
                        required: (field.required),
                        disabled: (field.disabled),
                        'aria-describedby': (field.help ? __VLS_unwrap(helpId, {})(field.name) : undefined),
                    });
                }
                else {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                        id: (__VLS_unwrap(fieldId, {})(field.name)),
                        type: (field.type),
                        ...{ class: (__VLS_unwrap(inputClass, {})) },
                        placeholder: (field.type === 'password' && field.hasValue ? '••••••••' : field.placeholder),
                        required: (field.required && !(field.type === 'password' && field.hasValue)),
                        disabled: (field.disabled),
                        min: (field.type === 'number' ? field.min : undefined),
                        max: (field.type === 'number' ? field.max : undefined),
                        autocomplete: (field.type === 'password' ? 'new-password' : 'off'),
                        'aria-describedby': (field.help || (field.type === 'password' && field.hasValue) ? __VLS_unwrap(helpId, {})(field.name) : undefined),
                    });
                    (values.value[field.name]);
                }
            }
            if (field.type !== 'switch' && (field.help || (field.type === 'password' && field.hasValue))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    id: (__VLS_unwrap(helpId, {})(field.name)),
                    ...{ class: "mt-1 text-xs text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                if (field.type === 'password' && field.hasValue) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "mr-1 font-semibold text-emerald-300" },
                    });
                    /** @type {__VLS_StyleScopedClasses['mr-1']} */ ;
                    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-emerald-300']} */ ;
                    (__VLS_unwrap(t, {})('plugins.view.saved'));
                }
                (field.help);
            }
        }
        // @ts-ignore
        [values, values, helpId, helpId, helpId, fieldId, fieldId, inputClass, inputClass, t,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: (inline.value ? '' : 'sm:col-span-2') },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        type: "submit",
        ...{ class: (buttonClasses.value[__VLS_ctx.node.submit.variant ?? 'primary']) },
        disabled: (context.value.busy.value),
        'aria-busy': (__VLS_unwrap(running, {})),
    });
    (__VLS_ctx.node.submit.label);
    // @ts-ignore
    [inline, node, node, buttonClasses, context, running,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
