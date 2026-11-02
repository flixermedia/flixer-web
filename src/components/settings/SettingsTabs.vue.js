import { RouterLink } from 'vue-router';
import { useI18n } from 'vue-i18n';
const { defineProps, defineEmits, withDefaults, } = {};
const __VLS_props = withDefaults(defineProps(), { background: true });
const emit = defineEmits();
const { t } = useI18n();
const baseClass = 'shrink-0 rounded px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent';
const idleClass = 'text-flixer-text/70 hover:text-white';
function isExternal(url) {
    return /^[a-z][a-z\d+.-]*:/i.test(url) || url.startsWith('//');
}
const __VLS_defaults = { background: true };
void __VLS_defaults;
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex gap-1 overflow-x-auto rounded p-1" },
        ...{ class: (__VLS_ctx.background && 'bg-white/5') },
        role: "tablist",
        'aria-label': (__VLS_unwrap(t, {})('settings.tabs.ariaLabel')),
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-x-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-1']} */ ;
    const __VLS_0 = __VLS_tryAsConstant((__VLS_ctx.tabs));
    for (const [tab] of __VLS_vFor(__VLS_nonNull(__VLS_0))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.template)({
            key: (tab.id),
        });
        if (tab.url && isExternal(tab.url)) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
                href: (tab.url),
                ...{ class: ([__VLS_unwrap(baseClass, {}), __VLS_unwrap(idleClass, {})]) },
            });
            (tab.label);
        }
        else if (tab.url) {
            let __VLS_1;
            /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
            RouterLink;
            // @ts-ignore
            const __VLS_2 = __VLS_asFunctionalComponent1(__VLS_1, new __VLS_1({
                // @ts-ignore
                to: (tab.url), ...{ class: ([__VLS_unwrap(baseClass, {}), __VLS_unwrap(idleClass, {})]) },
            }));
            const __VLS_3 = __VLS_2({
                to: (tab.url),
                ...{ class: ([__VLS_unwrap(baseClass, {}), __VLS_unwrap(idleClass, {})]) },
            }, ...__VLS_functionalComponentArgsRest(__VLS_2));
            var __VLS_4;
            const { default: __VLS_6 } = __VLS_nonNull(__VLS_4.slots);
            (tab.label);
            // @ts-ignore
            [background, t, tabs, baseClass, baseClass, idleClass, idleClass,];
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!!(tab.url && isExternal(tab.url)))
                            throw 0;
                        if (!!(tab.url))
                            throw 0;
                        return (__VLS_unwrap(emit, {})('update:modelValue', tab.id));
                        // @ts-ignore
                        [emit,];
                    } },
                type: "button",
                role: "tab",
                'aria-selected': (tab.id === __VLS_ctx.modelValue),
                ...{ class: ([__VLS_unwrap(baseClass, {}), tab.id === __VLS_ctx.modelValue ? 'bg-white/15 text-white' : __VLS_unwrap(idleClass, {})]) },
            });
            (tab.label);
        }
        // @ts-ignore
        [baseClass, idleClass, modelValue, modelValue,];
    }
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
export default {};
