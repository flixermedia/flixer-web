import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import TextInput from '../ui/TextInput.vue';
const { defineProps, defineEmits, } = {};
const __VLS_props = defineProps();
const emit = defineEmits();
const { t } = useI18n();
const name = ref('');
function handleSubmit() {
    emit('add', name.value);
    name.value = '';
}
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (handleSubmit) },
        ...{ class: "flex flex-col gap-3 sm:flex-row sm:items-start" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:flex-row']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:items-start']} */ ;
    const __VLS_0 = TextInput;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        modelValue: (__VLS_unwrap(name, {})), modelModifiers: { trim: true, }, ...{ class: "flex-1" }, type: "text", maxlength: "64", 'aria-label': (__VLS_unwrap(t, {})('settings.passkeys.nameLabel')), placeholder: (__VLS_unwrap(t, {})('settings.passkeys.namePlaceholder')),
    }));
    const __VLS_2 = __VLS_1({
        modelValue: (__VLS_unwrap(name, {})),
        modelModifiers: { trim: true, },
        ...{ class: "flex-1" },
        type: "text",
        maxlength: "64",
        'aria-label': (__VLS_unwrap(t, {})('settings.passkeys.nameLabel')),
        placeholder: (__VLS_unwrap(t, {})('settings.passkeys.namePlaceholder')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        type: "submit",
        ...{ class: "flex h-12 shrink-0 items-center justify-center gap-2 rounded bg-gradient-to-r from-flixer-primary to-flixer-secondary px-6 text-sm font-semibold text-white shadow-lg shadow-flixer-primary/20 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-wait disabled:opacity-60" },
        disabled: (__VLS_ctx.isRegistering),
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-gradient-to-r']} */ ;
    /** @type {__VLS_StyleScopedClasses['from-flixer-primary']} */ ;
    /** @type {__VLS_StyleScopedClasses['to-flixer-secondary']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-flixer-primary/20']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:brightness-110']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-offset-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled:cursor-wait']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
    if (__VLS_ctx.isRegistering) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" },
            'aria-hidden': "true",
        });
        /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-white/40']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-t-white']} */ ;
    }
    (__VLS_ctx.isRegistering ? __VLS_unwrap(t, {})('settings.passkeys.waitingForDevice') : __VLS_unwrap(t, {})('settings.passkeys.add'));
    // @ts-ignore
    [name, t, t, t, t, isRegistering, isRegistering, isRegistering,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};
