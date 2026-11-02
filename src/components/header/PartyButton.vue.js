import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useParty } from '../../composables/useParty';
import PartyPanel from '../party/PartyPanel.vue';
const { defineProps, } = {};
const __VLS_props = defineProps();
const { t } = useI18n();
const party = useParty();
const open = ref(false);
const root = ref(null);
const current = computed(() => party.party.value);
const reconnecting = computed(() => party.status.value === 'reconnecting');
const label = computed(() => (reconnecting.value ? t('party.reconnecting') : t(current.value?.kind === 'music' ? 'party.listeningTogether' : 'party.watchingTogether')));
function onDocumentClick(event) {
    if (open.value && root.value && !root.value.contains(event.target))
        open.value = false;
}
function onKey(event) {
    if (event.key === 'Escape')
        open.value = false;
}
onMounted(() => {
    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onKey);
});
onBeforeUnmount(() => {
    document.removeEventListener('click', onDocumentClick);
    document.removeEventListener('keydown', onKey);
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
    __VLS_withDotValue(current, {});
    __VLS_withDotValue(open, {});
    __VLS_withDotValue(reconnecting, {});
    void {};
    /** @type {__VLS_StyleScopedClasses['party-panel-enter-active']} */ ;
    /** @type {__VLS_StyleScopedClasses['party-panel-leave-active']} */ ;
    if (current.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ref: "root",
            ...{ class: "relative" },
        });
        /** @type {__VLS_StyleScopedClasses['relative']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!(current.value))
                        throw 0;
                    return (open.value = !open.value);
                    // @ts-ignore
                    [current, open, open,];
                } },
            type: "button",
            ...{ class: (__VLS_ctx.buttonClass) },
            'aria-label': (__VLS_unwrap(label, {})),
            title: (__VLS_unwrap(label, {})),
            'aria-haspopup': "dialog",
            'aria-expanded': (open.value),
        });
        let __VLS_0;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
            // @ts-ignore
            icon: "lucide:users-round", ...{ class: "size-5" }, 'aria-hidden': "true",
        }));
        const __VLS_2 = __VLS_1({
            icon: "lucide:users-round",
            ...{ class: "size-5" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1));
        /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "absolute right-1 top-1 grid min-w-4 place-items-center rounded px-1 text-[10px] font-bold leading-4 text-flixer-background" },
            ...{ class: (reconnecting.value ? 'bg-amber-400' : 'bg-flixer-accent') },
        });
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['right-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['top-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['min-w-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
        /** @type {__VLS_StyleScopedClasses['leading-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-background']} */ ;
        (current.value.members.length);
        let __VLS_5;
        /** @ts-ignore @type { | typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
        Transition;
        // @ts-ignore
        const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
            // @ts-ignore
            name: "party-panel",
        }));
        const __VLS_7 = __VLS_6({
            name: "party-panel",
        }, ...__VLS_functionalComponentArgsRest(__VLS_6));
        var __VLS_8;
        const { default: __VLS_10 } = __VLS_nonNull(__VLS_8.slots);
        if (open.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "theme-dark absolute right-0 top-12 z-50 w-64 max-w-[calc(100vw-2rem)] origin-top-right rounded border border-flixer-border bg-flixer-surface p-2 text-flixer-text shadow-2xl shadow-black/60" },
            });
            /** @type {__VLS_StyleScopedClasses['theme-dark']} */ ;
            /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
            /** @type {__VLS_StyleScopedClasses['right-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['top-12']} */ ;
            /** @type {__VLS_StyleScopedClasses['z-50']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-64']} */ ;
            /** @type {__VLS_StyleScopedClasses['max-w-[calc(100vw-2rem)]']} */ ;
            /** @type {__VLS_StyleScopedClasses['origin-top-right']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
            /** @type {__VLS_StyleScopedClasses['shadow-2xl']} */ ;
            /** @type {__VLS_StyleScopedClasses['shadow-black/60']} */ ;
            const __VLS_11 = PartyPanel;
            // @ts-ignore
            const __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11({
                // @ts-ignore
                ...{ 'onLeft': {} },
            }));
            const __VLS_13 = __VLS_12({
                ...{ 'onLeft': {} },
            }, ...__VLS_functionalComponentArgsRest(__VLS_12));
            let __VLS_16;
            const __VLS_17 = {
                /** @type {typeof __VLS_16.left} */
                onLeft: (...[$event]) => {
                    void $event;
                    if (!(current.value))
                        throw 0;
                    if (!(open.value))
                        throw 0;
                    return (open.value = false);
                    // @ts-ignore
                    [current, open, open, open, buttonClass, label, label, reconnecting,];
                },
            };
            void __VLS_17;
            var __VLS_14;
            var __VLS_15;
        }
        // @ts-ignore
        [];
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
