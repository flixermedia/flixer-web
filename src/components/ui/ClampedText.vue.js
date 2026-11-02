import { openModal } from '@kolirt/vue-modal';
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import TextModal from './TextModal.vue';
const { defineProps, } = {};
const props = defineProps();
const { t } = useI18n();
const element = ref(null);
const overflowing = ref(false);
function measure() {
    const el = element.value;
    overflowing.value = el !== null && el.scrollHeight > el.clientHeight + 1;
}
let observer;
onMounted(() => {
    measure();
    if (element.value && typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(measure);
        observer.observe(element.value);
    }
});
onBeforeUnmount(() => observer?.disconnect());
watch(() => props.text, () => void nextTick(measure));
function open() {
    void openModal(TextModal, { props: { title: props.title, text: props.text } }).catch(() => undefined);
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
    __VLS_withDotValue(overflowing, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ref: "element",
        ...{ class: "line-clamp-4 whitespace-pre-line text-base leading-relaxed text-flixer-text/90" },
    });
    /** @type {__VLS_StyleScopedClasses['line-clamp-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['whitespace-pre-line']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-base']} */ ;
    /** @type {__VLS_StyleScopedClasses['leading-relaxed']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text/90']} */ ;
    (__VLS_ctx.text);
    if (overflowing.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (open) },
            type: "button",
            ...{ class: "mt-2 text-sm font-semibold text-flixer-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:underline']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-offset-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        (__VLS_unwrap(t, {})('common.readMore'));
    }
    // @ts-ignore
    [text, overflowing, t,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
