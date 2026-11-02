import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import TextInput from '../components/ui/TextInput.vue';
import SetupNotice from './SetupNotice.vue';
const { defineProps, defineEmits, } = {};
const __VLS_props = defineProps();
const emit = defineEmits();
const { t } = useI18n();
const code = ref('');
const busy = ref(false);
async function send() {
    if (!code.value.trim() || busy.value)
        return;
    busy.value = true;
    try {
        emit('submit', code.value);
    }
    finally {
        busy.value = false;
    }
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
    __VLS_withDotValue(code, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (send) },
        ...{ class: "flex w-full max-w-md flex-col gap-4" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
        ...{ class: "text-2xl font-semibold" },
    });
    /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    (__VLS_ctx.title ?? __VLS_unwrap(t, {})('setup.recovery.title'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_ctx.description ?? __VLS_unwrap(t, {})('setup.recovery.description'));
    const __VLS_0 = TextInput;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        modelValue: (code.value), modelModifiers: { trim: true, }, label: (__VLS_unwrap(t, {})('setup.recovery.code')), hint: (__VLS_ctx.hint ?? __VLS_unwrap(t, {})('setup.recovery.hint')), placeholder: "ABCD-EFGH-JKMN-PQRS", autocomplete: "off", spellcheck: "false", autocapitalize: "characters",
    }));
    const __VLS_2 = __VLS_1({
        modelValue: (code.value),
        modelModifiers: { trim: true, },
        label: (__VLS_unwrap(t, {})('setup.recovery.code')),
        hint: (__VLS_ctx.hint ?? __VLS_unwrap(t, {})('setup.recovery.hint')),
        placeholder: "ABCD-EFGH-JKMN-PQRS",
        autocomplete: "off",
        spellcheck: "false",
        autocapitalize: "characters",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    if (__VLS_ctx.message) {
        const __VLS_5 = SetupNotice || SetupNotice;
        // @ts-ignore
        const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
            // @ts-ignore
            kind: "error",
        }));
        const __VLS_7 = __VLS_6({
            kind: "error",
        }, ...__VLS_functionalComponentArgsRest(__VLS_6));
        var __VLS_8;
        const { default: __VLS_10 } = __VLS_nonNull(__VLS_8.slots);
        (__VLS_ctx.message);
        // @ts-ignore
        [title, t, t, t, t, description, code, hint, message, message,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        type: "submit",
        ...{ class: "h-11 rounded bg-flixer-primary px-6 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60" },
        disabled: (!code.value.trim() || __VLS_unwrap(busy, {})),
    });
    /** @type {__VLS_StyleScopedClasses['h-11']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-primary']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:brightness-110']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
    (__VLS_unwrap(t, {})('setup.continue'));
    // @ts-ignore
    [t, code, busy,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};
