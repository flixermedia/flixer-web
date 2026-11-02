import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { getPluginSettings, updatePluginSettings } from '../../api';
import { notify } from '../../composables/notify';
import { describeRequestError } from '../../composables/useProfile';
import { catchError } from '../../utils/catchError';
import AdminSection from './AdminSection.vue';
const { defineProps, defineEmits, } = {};
const props = defineProps();
const emit = defineEmits();
const { t } = useI18n();
const schema = ref(null);
const values = ref({});
const arrayText = ref({});
const loading = ref(true);
const saving = ref(false);
const error = ref('');
const inputClass = 'w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm outline-none focus:border-flixer-accent';
const buttonClass = 'rounded bg-flixer-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60';
const quietButtonClass = 'rounded border border-flixer-border px-3 py-2 text-sm font-semibold transition hover:bg-white/5 disabled:opacity-60';
const isSecret = (property) => property.writeOnly === true || property['x-flixer-secret'] === true;
function apply(result) {
    schema.value = result.schema;
    values.value = { ...result.values };
    arrayText.value = {};
    for (const [name, property] of Object.entries(result.schema?.properties ?? {})) {
        if (!(name in values.value) && property.default !== undefined)
            values.value[name] = property.default;
        if (property.type === 'array') {
            const value = values.value[name];
            arrayText.value[name] = Array.isArray(value) ? value.join(', ') : '';
        }
    }
}
async function load() {
    loading.value = true;
    error.value = '';
    try {
        const [requestError, result] = await catchError(getPluginSettings(props.pluginId));
        if (requestError) {
            error.value = describeRequestError(requestError);
        }
        else {
            apply(result);
        }
    }
    finally {
        loading.value = false;
    }
}
async function save() {
    if (!schema.value)
        return;
    const nextValues = {};
    const secrets = {};
    for (const [name, property] of Object.entries(schema.value.properties)) {
        const value = values.value[name];
        if (isSecret(property))
            secrets[name] = typeof value === 'string' ? value : '';
        else if (property.type === 'array') {
            const items = (arrayText.value[name] ?? '')
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean);
            nextValues[name] = property.items?.type === 'string' ? items : items.map(Number);
        }
        else if (property.type === 'integer' || property.type === 'number')
            nextValues[name] = value === '' ? undefined : Number(value);
        else
            nextValues[name] = value;
    }
    saving.value = true;
    try {
        const [error, result] = await catchError(updatePluginSettings(props.pluginId, { values: nextValues, secrets }));
        if (error) {
            notify.error(describeRequestError(error));
        }
        else {
            apply(result);
            notify.success(t('admin.plugins.settingsSaved'));
        }
    }
    finally {
        saving.value = false;
    }
}
onMounted(load);
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(error, {});
    __VLS_withDotValue(loading, {});
    __VLS_withDotValue(schema, {});
    __VLS_withDotValue(values, {});
    __VLS_withDotValue(arrayText, {});
    __VLS_withDotValue(saving, {});
    const __VLS_0 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        title: (__VLS_ctx.title), description: (__VLS_ctx.description),
    }));
    const __VLS_2 = __VLS_1({
        title: (__VLS_ctx.title),
        description: (__VLS_ctx.description),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    if (error.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            role: "alert",
            ...{ class: "text-sm text-red-300" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
        (error.value);
    }
    else if (loading.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('common.loading'));
    }
    else if (schema.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
            ...{ onSubmit: (save) },
            ...{ class: "grid gap-4 md:grid-cols-2" },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:grid-cols-2']} */ ;
        const __VLS_6 = __VLS_tryAsConstant((schema.value.properties));
        for (const [property, name] of __VLS_vFor(__VLS_nonNull(__VLS_6))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                key: (name),
                ...{ class: "grid content-start gap-1 text-sm" },
            });
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['content-start']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (property.title || name);
            if (property.description) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "text-xs text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (property.description);
            }
            if (property.enum) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                    value: (values.value[name]),
                    ...{ class: (__VLS_unwrap(inputClass, {})) },
                });
                const __VLS_7 = __VLS_tryAsConstant((property.enum));
                for (const [option] of __VLS_vFor(__VLS_nonNull(__VLS_7))) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                        key: (String(option)),
                        value: (option),
                    });
                    (option);
                    // @ts-ignore
                    [title, description, error, error, loading, t, schema, schema, values, inputClass,];
                }
            }
            else if (property.type === 'boolean') {
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    type: "checkbox",
                    ...{ class: "h-4 w-4 accent-flixer-accent" },
                });
                (values.value[name]);
                /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['accent-flixer-accent']} */ ;
            }
            else if (property.type === 'array') {
                __VLS_asFunctionalElement1(__VLS_intrinsics.textarea)({
                    value: (arrayText.value[name]),
                    ...{ class: (__VLS_unwrap(inputClass, {})) },
                    rows: "2",
                    placeholder: (__VLS_unwrap(t, {})('admin.plugins.listPlaceholder')),
                });
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    ...{ class: (__VLS_unwrap(inputClass, {})) },
                    type: (__VLS_unwrap(isSecret, {})(property) ? 'password' : property.type === 'integer' || property.type === 'number' ? 'number' : property.format === 'uri' ? 'url' : 'text'),
                    autocomplete: (__VLS_unwrap(isSecret, {})(property) ? 'new-password' : 'off'),
                });
                (values.value[name]);
            }
            // @ts-ignore
            [t, values, values, inputClass, inputClass, arrayText, isSecret, isSecret,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex items-center gap-2 md:col-span-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:col-span-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ class: (__VLS_unwrap(buttonClass, {})) },
            type: "submit",
            disabled: (saving.value),
        });
        (saving.value ? __VLS_unwrap(t, {})('admin.plugins.savingSettings') : __VLS_unwrap(t, {})('admin.plugins.saveSettings'));
        if (__VLS_ctx.closable) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!!(error.value))
                            throw 0;
                        if (!!(loading.value))
                            throw 0;
                        if (!(schema.value))
                            throw 0;
                        if (!(__VLS_ctx.closable))
                            throw 0;
                        return (__VLS_unwrap(emit, {})('close'));
                        // @ts-ignore
                        [t, t, buttonClass, saving, saving, closable, emit,];
                    } },
                ...{ class: (__VLS_unwrap(quietButtonClass, {})) },
                type: "button",
            });
            (__VLS_unwrap(t, {})('common.cancel'));
        }
    }
    // @ts-ignore
    [t, quietButtonClass,];
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};
