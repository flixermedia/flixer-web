import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useFavorites } from '../../composables/useFavorites';
const { defineProps, } = {};
const props = defineProps();
const { t } = useI18n();
const favorites = useFavorites();
onMounted(() => void favorites.load().catch(() => undefined));
function toggle() {
    void favorites.toggle(props.itemId).catch(() => undefined);
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
    __VLS_withDotValue(favorites, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (toggle) },
        type: "button",
        ...{ class: "shrink-0 transition motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
        ...{ class: ([__VLS_ctx.compact ? 'grid size-10 place-items-center rounded bg-white/10 text-white hover:bg-white/20' : 'inline-flex h-12 w-12 items-center justify-center rounded border border-white/30 bg-white/10 text-white hover:bg-white/20', favorites.value.isFavorite(__VLS_ctx.itemId) ? 'text-rose-400' : __VLS_ctx.compact ? '' : 'text-white/70']) },
        'aria-label': (__VLS_unwrap(t, {})(favorites.value.isFavorite(__VLS_ctx.itemId) ? 'social.removeFavorite' : 'social.addFavorite')),
        'aria-pressed': (favorites.value.isFavorite(__VLS_ctx.itemId)),
        title: (__VLS_unwrap(t, {})(favorites.value.isFavorite(__VLS_ctx.itemId) ? 'social.removeFavorite' : 'social.addFavorite')),
    });
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['motion-reduce:transition-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    let __VLS_0;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        icon: (favorites.value.isFavorite(__VLS_ctx.itemId) ? 'lucide:heart' : 'lucide:heart'), ...{ class: "size-5" }, ...{ class: (favorites.value.isFavorite(__VLS_ctx.itemId) ? 'fill-current' : 'fill-none') }, 'aria-hidden': "true",
    }));
    const __VLS_2 = __VLS_1({
        icon: (favorites.value.isFavorite(__VLS_ctx.itemId) ? 'lucide:heart' : 'lucide:heart'),
        ...{ class: "size-5" },
        ...{ class: (favorites.value.isFavorite(__VLS_ctx.itemId) ? 'fill-current' : 'fill-none') },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
    // @ts-ignore
    [compact, compact, favorites, favorites, favorites, favorites, favorites, favorites, itemId, itemId, itemId, itemId, itemId, itemId, t, t,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
