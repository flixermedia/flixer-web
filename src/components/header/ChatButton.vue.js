import { onBeforeUnmount, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';
import { useChatUnread } from '../../composables/useChat';
const { defineProps, } = {};
const __VLS_props = defineProps();
const { t } = useI18n();
const chat = useChatUnread();
onMounted(chat.start);
onBeforeUnmount(chat.stop);
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
    __VLS_withDotValue(chat, {});
    let __VLS_0;
    /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
    RouterLink;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        to: "/chat", ...{ class: (__VLS_ctx.buttonClass) }, 'aria-label': (chat.value.unread.value ? __VLS_unwrap(t, {})('chat.unreadLabel', { count: chat.value.unread.value }) : __VLS_unwrap(t, {})('chat.title')), title: (__VLS_unwrap(t, {})('chat.title')),
    }));
    const __VLS_2 = __VLS_1({
        to: "/chat",
        ...{ class: (__VLS_ctx.buttonClass) },
        'aria-label': (chat.value.unread.value ? __VLS_unwrap(t, {})('chat.unreadLabel', { count: chat.value.unread.value }) : __VLS_unwrap(t, {})('chat.title')),
        title: (__VLS_unwrap(t, {})('chat.title')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    let __VLS_6;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
        // @ts-ignore
        icon: "lucide:message-circle", ...{ class: "size-5" }, 'aria-hidden': "true",
    }));
    const __VLS_8 = __VLS_7({
        icon: "lucide:message-circle",
        ...{ class: "size-5" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
    if (chat.value.unread.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "absolute right-1 top-1 grid min-w-4 place-items-center rounded bg-flixer-accent px-1 text-[10px] font-bold leading-4 text-flixer-background" },
        });
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['right-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['top-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['min-w-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-accent']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
        /** @type {__VLS_StyleScopedClasses['leading-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-background']} */ ;
        (chat.value.unread.value > 99 ? '99+' : chat.value.unread.value);
    }
    // @ts-ignore
    [buttonClass, chat, chat, chat, chat, chat, t, t, t,];
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
