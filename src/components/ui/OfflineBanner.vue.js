import { useOnlineStatus } from '../../composables/useOnlineStatus';
import { useI18n } from 'vue-i18n';
const { isOnline } = useOnlineStatus();
const { t } = useI18n();
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(isOnline, {});
    if (!isOnline.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            role: "status",
            ...{ class: "fixed inset-x-0 bottom-0 z-60 flex items-center justify-center gap-2 border-t border-amber-400/30 bg-amber-950/95 px-4 py-3 text-center text-sm text-amber-100 backdrop-blur" },
        });
        /** @type {__VLS_StyleScopedClasses['fixed']} */ ;
        /** @type {__VLS_StyleScopedClasses['inset-x-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['bottom-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['z-60']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-amber-400/30']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-amber-950/95']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-amber-100']} */ ;
        /** @type {__VLS_StyleScopedClasses['backdrop-blur']} */ ;
        let __VLS_0;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
            // @ts-ignore
            icon: "lucide:wifi-off", ...{ class: "size-4 shrink-0" }, 'aria-hidden': "true",
        }));
        const __VLS_2 = __VLS_1({
            icon: "lucide:wifi-off",
            ...{ class: "size-4 shrink-0" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1));
        /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_unwrap(t, {})('ui.offlineBanner'));
    }
    // @ts-ignore
    [isOnline, t,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
