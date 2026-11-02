import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
const { defineProps, } = {};
const props = defineProps();
const { t, locale } = useI18n();
const cards = computed(() => {
    const counts = props.overview.counts;
    return [
        { label: t('admin.overview.movies'), value: counts.movies },
        { label: t('admin.overview.series'), value: counts.series },
        { label: t('admin.overview.episodes'), value: counts.episodes },
        { label: t('admin.overview.tracks'), value: counts.tracks },
        { label: t('admin.overview.users'), value: counts.users },
    ];
});
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid grid-cols-2 gap-3 lg:grid-cols-5" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:grid-cols-5']} */ ;
    const __VLS_0 = __VLS_tryAsConstant((__VLS_unwrap(cards, {})));
    for (const [card] of __VLS_vFor(__VLS_nonNull(__VLS_0))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (card.label),
            ...{ class: "admin-card admin-stat px-5 py-4" },
        });
        /** @type {__VLS_StyleScopedClasses['admin-card']} */ ;
        /** @type {__VLS_StyleScopedClasses['admin-stat']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-4']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs font-medium uppercase tracking-wider text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (card.label);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-2 bg-linear-to-br from-white to-flixer-accent bg-clip-text text-3xl font-semibold tabular-nums text-transparent" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-linear-to-br']} */ ;
        /** @type {__VLS_StyleScopedClasses['from-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['to-flixer-accent']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-clip-text']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['tabular-nums']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-transparent']} */ ;
        (card.value.toLocaleString(__VLS_unwrap(locale, {})));
        // @ts-ignore
        [cards, locale,];
    }
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
