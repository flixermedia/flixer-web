import { useI18n } from 'vue-i18n';
const { defineProps, defineEmits, } = {};
const { t } = useI18n();
const __VLS_props = defineProps();
const emit = defineEmits();
function formatDate(value) {
    return value ? new Date(value).toLocaleString() : t('settings.passkeys.never');
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
    if (__VLS_ctx.passkeys.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
            ...{ class: "flex flex-col gap-3" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        const __VLS_0 = __VLS_tryAsConstant((__VLS_ctx.passkeys));
        for (const [passkey] of __VLS_vFor(__VLS_nonNull(__VLS_0))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                key: (passkey.id),
                ...{ class: "flex items-center gap-4 rounded border border-flixer-border bg-flixer-surface/50 p-4" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/50']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "grid size-10 shrink-0 place-items-center rounded border border-flixer-accent/20 bg-flixer-primary/10 text-flixer-accent" },
                'aria-hidden': "true",
            });
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['size-10']} */ ;
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-accent/20']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-primary/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
            let __VLS_1;
            /** @ts-ignore @type { | typeof __VLS_components.Icon} */
            Icon;
            // @ts-ignore
            const __VLS_2 = __VLS_asFunctionalComponent1(__VLS_1, new __VLS_1({
                // @ts-ignore
                icon: "lucide:key-round", ...{ class: "size-5" }, 'aria-hidden': "true",
            }));
            const __VLS_3 = __VLS_2({
                icon: "lucide:key-round",
                ...{ class: "size-5" },
                'aria-hidden': "true",
            }, ...__VLS_functionalComponentArgsRest(__VLS_2));
            /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "min-w-0 flex-1" },
            });
            /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "truncate text-sm font-semibold text-flixer-text" },
            });
            /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
            (passkey.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mt-0.5 text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-0.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (passkey.deviceType === 'multiDevice' ? __VLS_unwrap(t, {})('settings.passkeys.synced') : __VLS_unwrap(t, {})('settings.passkeys.deviceBound'));
            if (passkey.transports.length) {
                (passkey.transports.join(', '));
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mt-0.5 text-xs text-flixer-muted/80" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-0.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted/80']} */ ;
            (__VLS_unwrap(t, {})('settings.passkeys.dateDetails', { added: formatDate(passkey.createdAt), lastUsed: formatDate(passkey.lastUsedAt) }));
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!(__VLS_ctx.passkeys.length))
                            throw 0;
                        return (__VLS_unwrap(emit, {})('remove', passkey));
                        // @ts-ignore
                        [passkeys, passkeys, t, t, t, emit,];
                    } },
                type: "button",
                ...{ class: "rounded border border-flixer-border px-3 py-2 text-xs font-semibold text-rose-300 transition hover:border-rose-300/40 hover:bg-rose-300/10 disabled:cursor-wait disabled:opacity-60" },
                disabled: (__VLS_ctx.deletingId === passkey.id),
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-rose-300']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:border-rose-300/40']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-rose-300/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['disabled:cursor-wait']} */ ;
            /** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
            (__VLS_ctx.deletingId === passkey.id ? __VLS_unwrap(t, {})('settings.passkeys.removing') : __VLS_unwrap(t, {})('settings.passkeys.remove'));
            // @ts-ignore
            [t, t, deletingId, deletingId,];
        }
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "rounded border border-dashed border-flixer-border p-6 text-center text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-dashed']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('settings.passkeys.empty'));
    }
    // @ts-ignore
    [t,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};
