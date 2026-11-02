import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useParty } from '../../composables/useParty';
import { notify } from '../../composables/notify';
import UserAvatar from '../ui/UserAvatar.vue';
import { catchError } from '../../utils/catchError';
const { defineEmits, } = {};
const emit = defineEmits();
const { t } = useI18n();
const party = useParty();
const busy = ref(false);
async function copyLink() {
    const [failure] = await catchError(navigator.clipboard.writeText(party.inviteLink()));
    if (failure) {
        notify.error(t('party.copyFailed'));
        return;
    }
    notify.success(t('party.linkCopied'));
}
async function leave() {
    busy.value = true;
    try {
        await party.leave();
        emit('left');
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
    __VLS_withDotValue(party, {});
    if (party.value.party.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            'aria-label': (__VLS_unwrap(t, {})('party.title')),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['pb-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['pt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('party.title'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "px-3 pb-2" },
        });
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['pb-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "truncate text-sm text-flixer-text" },
        });
        /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
        (party.value.party.value.item.title);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "truncate text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (party.value.isHost.value ? __VLS_unwrap(t, {})('party.youAreHost') : __VLS_unwrap(t, {})('party.hostedBy', { name: party.value.party.value.host.displayName }));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "my-2 border-t border-flixer-border" },
        });
        /** @type {__VLS_StyleScopedClasses['my-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['pb-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['pt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('party.members'));
        (party.value.party.value.members.length);
        __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
            'aria-label': (__VLS_unwrap(t, {})('party.members')),
        });
        const __VLS_0 = __VLS_tryAsConstant((party.value.party.value.members));
        for (const [member] of __VLS_vFor(__VLS_nonNull(__VLS_0))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                key: (member.id),
            });
            let __VLS_1;
            /** @ts-ignore @type { | typeof __VLS_components.RouterLink | typeof __VLS_components.RouterLink} */
            RouterLink;
            // @ts-ignore
            const __VLS_2 = __VLS_asFunctionalComponent1(__VLS_1, new __VLS_1({
                // @ts-ignore
                to: ({ name: 'profile', params: { username: member.username } }), ...{ class: "flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm text-flixer-text transition hover:bg-white/10" },
            }));
            const __VLS_3 = __VLS_2({
                to: ({ name: 'profile', params: { username: member.username } }),
                ...{ class: "flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm text-flixer-text transition hover:bg-white/10" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_2));
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
            var __VLS_4;
            const { default: __VLS_6 } = __VLS_nonNull(__VLS_4.slots);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "block size-6 shrink-0 overflow-hidden rounded" },
            });
            /** @type {__VLS_StyleScopedClasses['block']} */ ;
            /** @type {__VLS_StyleScopedClasses['size-6']} */ ;
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            const __VLS_7 = UserAvatar;
            // @ts-ignore
            const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
                // @ts-ignore
                avatarUrl: (member.avatarUrl), name: (member.displayName), ...{ class: "text-[10px]" },
            }));
            const __VLS_9 = __VLS_8({
                avatarUrl: (member.avatarUrl),
                name: (member.displayName),
                ...{ class: "text-[10px]" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_8));
            /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "truncate" },
            });
            /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
            (member.displayName);
            if (member.id === party.value.party.value.host.id) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "ml-auto text-xs text-flixer-accent" },
                });
                /** @type {__VLS_StyleScopedClasses['ml-auto']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
                (__VLS_unwrap(t, {})('party.host'));
            }
            // @ts-ignore
            [party, party, party, party, party, party, party, t, t, t, t, t, t, t,];
            // @ts-ignore
            [];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "my-2 border-t border-flixer-border" },
        });
        /** @type {__VLS_StyleScopedClasses['my-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (copyLink) },
            type: "button",
            ...{ class: "flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm text-flixer-text transition hover:bg-white/10" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
        (__VLS_unwrap(t, {})('party.copyLink'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (leave) },
            type: "button",
            ...{ class: "flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm text-flixer-text transition hover:bg-white/10 disabled:opacity-60" },
            disabled: (__VLS_unwrap(busy, {})),
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
        (party.value.isHost.value ? __VLS_unwrap(t, {})('party.end') : __VLS_unwrap(t, {})('party.leave'));
        if (party.value.isGuest.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "px-3 pb-2 pt-2 text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['pb-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['pt-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('party.guestHint'));
        }
    }
    // @ts-ignore
    [party, party, t, t, t, t, busy,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
});
export default {};
