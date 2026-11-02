import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { availableLocales, localeCountry, localeName, setLocale } from '../../i18n';
import 'flag-icons/css/flag-icons.min.css';
const { defineOptions, } = {};
defineOptions({ modalGroup: 'default' });
const { close } = useModalContext();
const { t, locale } = useI18n();
const query = ref('');
const options = computed(() => availableLocales.map((code) => ({ code, name: localeName(code), country: localeCountry(code) })));
const filtered = computed(() => {
    const q = query.value.trim().toLowerCase();
    return q ? options.value.filter((o) => `${o.name} ${o.code}`.toLowerCase().includes(q)) : options.value;
});
async function select(code) {
    await setLocale(code);
    close();
}
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(locale, {});
    __VLS_withDotValue(filtered, {});
    let __VLS_0;
    /** @ts-ignore @type { | typeof ModalRoot | typeof ModalRoot} */
    ModalRoot;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        ...{ class: "flex items-center justify-center p-4" },
    }));
    const __VLS_2 = __VLS_1({
        ...{ class: "flex items-center justify-center p-4" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    let __VLS_6;
    /** @ts-ignore @type { | typeof ModalContent | typeof ModalContent} */
    ModalContent;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
        // @ts-ignore
        ...{ class: "flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col rounded border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60" },
    }));
    const __VLS_8 = __VLS_7({
        ...{ class: "flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col rounded border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    /** @type {__VLS_StyleScopedClasses['flixer-modal-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-h-[calc(100dvh-2rem)]']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-black/60']} */ ;
    var __VLS_9;
    const { default: __VLS_11 } = __VLS_nonNull(__VLS_9.slots);
    let __VLS_12;
    /** @ts-ignore @type { | typeof ModalTitle | typeof ModalTitle} */
    ModalTitle;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
        // @ts-ignore
        ...{ class: "shrink-0 text-lg font-semibold" },
    }));
    const __VLS_14 = __VLS_13({
        ...{ class: "shrink-0 text-lg font-semibold" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    var __VLS_15;
    const { default: __VLS_17 } = __VLS_nonNull(__VLS_15.slots);
    (__VLS_unwrap(t, {})('languageModal.title'));
    // @ts-ignore
    [t,];
    let __VLS_18;
    /** @ts-ignore @type { | typeof ModalDescription | typeof ModalDescription} */
    ModalDescription;
    // @ts-ignore
    const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
        // @ts-ignore
        ...{ class: "mt-1 shrink-0 text-sm leading-6 text-flixer-muted" },
    }));
    const __VLS_20 = __VLS_19({
        ...{ class: "mt-1 shrink-0 text-sm leading-6 text-flixer-muted" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_19));
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['leading-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    var __VLS_21;
    const { default: __VLS_23 } = __VLS_nonNull(__VLS_21.slots);
    (__VLS_unwrap(t, {})('languageModal.description'));
    // @ts-ignore
    [t,];
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "search",
        placeholder: (__VLS_unwrap(t, {})('languageModal.search')),
        'aria-label': (__VLS_unwrap(t, {})('languageModal.search')),
        autocomplete: "off",
        ...{ class: "mt-5 w-full shrink-0 rounded border border-flixer-border bg-flixer-background px-4 py-3 text-sm text-flixer-text placeholder:text-flixer-muted focus-visible:outline-2 focus-visible:outline-flixer-accent" },
    });
    (__VLS_unwrap(query, {}));
    /** @type {__VLS_StyleScopedClasses['mt-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
    /** @type {__VLS_StyleScopedClasses['placeholder:text-flixer-muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
        ...{ class: "mt-3 flex min-h-24 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain pr-1" },
        role: "radiogroup",
        'aria-label': (__VLS_unwrap(t, {})('languageModal.title')),
    });
    /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-h-24']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['overscroll-contain']} */ ;
    /** @type {__VLS_StyleScopedClasses['pr-1']} */ ;
    const __VLS_24 = __VLS_tryAsConstant((filtered.value));
    for (const [o] of __VLS_vFor(__VLS_nonNull(__VLS_24))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
            key: (o.code),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    return (select(o.code));
                    // @ts-ignore
                    [t, t, t, query, filtered,];
                } },
            type: "button",
            role: "radio",
            'aria-checked': (o.code === locale.value),
            ...{ class: "flex w-full items-center justify-between gap-3 rounded px-4 py-3 text-left text-sm transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-flixer-accent" },
            ...{ class: (o.code === locale.value ? 'bg-white/10 font-semibold text-white' : 'text-flixer-text') },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "flex min-w-0 items-center gap-3" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        if (o.country) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "fi shrink-0 rounded" },
                ...{ class: (`fi-${o.country}`) },
                'aria-hidden': "true",
            });
            /** @type {__VLS_StyleScopedClasses['fi']} */ ;
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        }
        else {
            let __VLS_25;
            /** @ts-ignore @type { | typeof __VLS_components.Icon} */
            Icon;
            // @ts-ignore
            const __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25({
                // @ts-ignore
                icon: "lucide:globe", ...{ class: "size-5 shrink-0" }, 'aria-hidden': "true",
            }));
            const __VLS_27 = __VLS_26({
                icon: "lucide:globe",
                ...{ class: "size-5 shrink-0" },
                'aria-hidden': "true",
            }, ...__VLS_functionalComponentArgsRest(__VLS_26));
            /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "truncate" },
        });
        /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
        (o.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (o.code);
        if (o.code === locale.value) {
            let __VLS_30;
            /** @ts-ignore @type { | typeof __VLS_components.Icon} */
            Icon;
            // @ts-ignore
            const __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({
                // @ts-ignore
                icon: "lucide:check", ...{ class: "size-4 shrink-0 text-flixer-accent" }, 'aria-hidden': "true",
            }));
            const __VLS_32 = __VLS_31({
                icon: "lucide:check",
                ...{ class: "size-4 shrink-0 text-flixer-accent" },
                'aria-hidden': "true",
            }, ...__VLS_functionalComponentArgsRest(__VLS_31));
            /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
        }
        // @ts-ignore
        [locale, locale, locale,];
    }
    if (filtered.value.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
            ...{ class: "px-4 py-6 text-center text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('languageModal.noResults'));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-4 shrink-0 text-xs text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('languageModal.help'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
        href: "https://hosted.weblate.org/projects/flixer/",
        target: "_blank",
        rel: "noopener",
        ...{ class: "text-flixer-accent hover:underline" },
    });
    /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:underline']} */ ;
    (__VLS_unwrap(t, {})('settings.language.weblate'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-5 flex shrink-0 justify-end" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                void $event;
                return (__VLS_unwrap(close, {})());
                // @ts-ignore
                [t, t, t, filtered, close,];
            } },
        type: "button",
        ...{ class: "flex h-11 items-center justify-center rounded border border-flixer-border px-6 text-sm font-semibold text-flixer-text transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-11']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-white/5']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-offset-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    (__VLS_unwrap(t, {})('languageModal.close'));
    // @ts-ignore
    [t,];
    // @ts-ignore
    [];
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
