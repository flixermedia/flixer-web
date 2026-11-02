import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { addChatMembers, createChatGroup, getProfiles, startDirectChat } from '../../api';
import { describeRequestError, useProfile } from '../../composables/useProfile';
import UserAvatar from '../ui/UserAvatar.vue';
import { catchError } from '../../utils/catchError';
const { defineProps, defineOptions, } = {};
defineOptions({ modalGroup: 'default' });
const props = defineProps();
const { close, confirm } = useModalContext();
const { t } = useI18n();
const { profile } = useProfile();
const mode = ref('direct');
const query = ref('');
const people = ref([]);
const loading = ref(true);
const selected = ref([]);
const name = ref('');
const busy = ref(false);
const error = ref('');
let timer;
let searchId = 0;
const adding = computed(() => props.addTo !== undefined);
const multi = computed(() => adding.value || mode.value === 'group');
const visible = computed(() => people.value.filter((person) => person.username !== profile.value?.username && !props.addTo?.usernames.includes(person.username)));
const canSubmit = computed(() => !busy.value && selected.value.length > 0 && (adding.value || name.value.trim().length > 0));
async function search() {
    const current = ++searchId;
    loading.value = true;
    try {
        const [failure, result] = await catchError(getProfiles(query.value.trim() || undefined));
        if (failure) {
            if (current === searchId)
                error.value = t('chat.loadError');
            return;
        }
        if (current === searchId)
            people.value = result.profiles;
    }
    finally {
        if (current === searchId)
            loading.value = false;
    }
}
watch(query, () => {
    if (timer)
        clearTimeout(timer);
    timer = setTimeout(() => void search(), 250);
}, { immediate: true });
watch(mode, () => (selected.value = []));
onBeforeUnmount(() => {
    searchId++;
    if (timer)
        clearTimeout(timer);
});
async function run(action) {
    if (busy.value)
        return;
    busy.value = true;
    error.value = '';
    try {
        const [failure, result] = await catchError(action());
        if (failure) {
            error.value = describeRequestError(failure, t('chat.createError'));
            return;
        }
        confirm(result);
    }
    finally {
        busy.value = false;
    }
}
function pick(person) {
    if (!multi.value) {
        void run(() => startDirectChat(person.username));
        return;
    }
    selected.value = selected.value.includes(person.username) ? selected.value.filter((entry) => entry !== person.username) : [...selected.value, person.username];
}
function submit() {
    if (!canSubmit.value)
        return;
    const usernames = selected.value;
    void run(() => (props.addTo ? addChatMembers(props.addTo.id, usernames) : createChatGroup(name.value.trim(), usernames)));
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
    __VLS_withDotValue(adding, {});
    __VLS_withDotValue(mode, {});
    __VLS_withDotValue(loading, {});
    __VLS_withDotValue(visible, {});
    __VLS_withDotValue(multi, {});
    __VLS_withDotValue(selected, {});
    __VLS_withDotValue(error, {});
    __VLS_withDotValue(canSubmit, {});
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
        ...{ class: "text-lg font-semibold text-white" },
    }));
    const __VLS_14 = __VLS_13({
        ...{ class: "text-lg font-semibold text-white" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    var __VLS_15;
    const { default: __VLS_17 } = __VLS_nonNull(__VLS_15.slots);
    (adding.value ? __VLS_unwrap(t, {})('chat.addPeople') : __VLS_unwrap(t, {})('chat.newChat'));
    // @ts-ignore
    [adding, t, t,];
    let __VLS_18;
    /** @ts-ignore @type { | typeof ModalDescription | typeof ModalDescription} */
    ModalDescription;
    // @ts-ignore
    const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
        // @ts-ignore
        ...{ class: "mt-1 text-sm text-flixer-muted" },
    }));
    const __VLS_20 = __VLS_19({
        ...{ class: "mt-1 text-sm text-flixer-muted" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_19));
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    var __VLS_21;
    const { default: __VLS_23 } = __VLS_nonNull(__VLS_21.slots);
    (adding.value ? __VLS_unwrap(t, {})('chat.addPeopleHint') : mode.value === 'direct' ? __VLS_unwrap(t, {})('chat.directHint') : __VLS_unwrap(t, {})('chat.groupHint'));
    // @ts-ignore
    [adding, t, t, t, mode,];
    if (!adding.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-4 grid grid-cols-2 gap-1 rounded bg-white/5 p-1 text-sm font-semibold" },
            role: "tablist",
        });
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/5']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        const __VLS_24 = __VLS_tryAsConstant(['direct', 'group']);
        for (const [option] of __VLS_vFor(__VLS_nonNull(__VLS_24))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!(!adding.value))
                            throw 0;
                        return (mode.value = option);
                        // @ts-ignore
                        [adding, mode,];
                    } },
                key: (option),
                type: "button",
                role: "tab",
                'aria-selected': (mode.value === option),
                ...{ class: "rounded px-3 py-1.5 transition motion-reduce:transition-none" },
                ...{ class: (mode.value === option ? 'bg-white text-flixer-background' : 'text-flixer-muted hover:text-white') },
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['motion-reduce:transition-none']} */ ;
            (__VLS_unwrap(t, {})(option === 'direct' ? 'chat.direct' : 'chat.group'));
            // @ts-ignore
            [t, mode, mode,];
        }
    }
    if (!adding.value && mode.value === 'group') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            maxlength: "60",
            ...{ class: "mt-4 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-white placeholder:text-flixer-muted focus:outline-none focus:ring-2 focus:ring-flixer-accent" },
            placeholder: (__VLS_unwrap(t, {})('chat.groupName')),
            'aria-label': (__VLS_unwrap(t, {})('chat.groupName')),
        });
        (__VLS_unwrap(name, {}));
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['placeholder:text-flixer-muted']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus:ring-flixer-accent']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "search",
        ...{ class: "mt-3 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-white placeholder:text-flixer-muted focus:outline-none focus:ring-2 focus:ring-flixer-accent" },
        placeholder: (__VLS_unwrap(t, {})('chat.searchPeople')),
        'aria-label': (__VLS_unwrap(t, {})('chat.searchPeople')),
    });
    (__VLS_unwrap(query, {}));
    /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['placeholder:text-flixer-muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-flixer-accent']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
        ...{ class: "mt-3 min-h-40 flex-1 space-y-0.5 overflow-y-auto" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-h-40']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-y-0.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
    if (loading.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
            ...{ class: "px-2 py-6 text-center text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('common.loading'));
    }
    else if (!visible.value.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
            ...{ class: "px-2 py-6 text-center text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('chat.noPeople'));
    }
    const __VLS_25 = __VLS_tryAsConstant((loading.value ? [] : visible.value));
    for (const [person] of __VLS_vFor(__VLS_nonNull(__VLS_25))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
            key: (person.username),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    return (pick(person));
                    // @ts-ignore
                    [adding, t, t, t, t, t, t, mode, name, query, loading, loading, visible, visible,];
                } },
            type: "button",
            ...{ class: "flex w-full items-center gap-3 rounded px-2 py-2 text-left transition motion-reduce:transition-none hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
            'aria-pressed': (multi.value ? selected.value.includes(person.username) : undefined),
            disabled: (__VLS_unwrap(busy, {})),
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['motion-reduce:transition-none']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "block size-9 shrink-0 overflow-hidden rounded" },
        });
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-9']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        const __VLS_26 = UserAvatar;
        // @ts-ignore
        const __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({
            // @ts-ignore
            avatarUrl: (person.avatarUrl), name: (person.displayName),
        }));
        const __VLS_28 = __VLS_27({
            avatarUrl: (person.avatarUrl),
            name: (person.displayName),
        }, ...__VLS_functionalComponentArgsRest(__VLS_27));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "min-w-0 flex-1 truncate text-sm font-medium text-white" },
        });
        /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        (person.displayName);
        if (multi.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "grid size-5 shrink-0 place-items-center rounded border" },
                ...{ class: (selected.value.includes(person.username) ? 'border-flixer-accent bg-flixer-accent text-flixer-background' : 'border-white/30') },
                'aria-hidden': "true",
            });
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            if (selected.value.includes(person.username)) {
                let __VLS_31;
                /** @ts-ignore @type { | typeof __VLS_components.Icon} */
                Icon;
                // @ts-ignore
                const __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31({
                    // @ts-ignore
                    icon: "lucide:check", ...{ class: "size-3.5" }, 'aria-hidden': "true",
                }));
                const __VLS_33 = __VLS_32({
                    icon: "lucide:check",
                    ...{ class: "size-3.5" },
                    'aria-hidden': "true",
                }, ...__VLS_functionalComponentArgsRest(__VLS_32));
                /** @type {__VLS_StyleScopedClasses['size-3.5']} */ ;
            }
        }
        // @ts-ignore
        [multi, multi, selected, selected, selected, busy,];
    }
    if (error.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-2 text-sm text-red-400" },
            role: "alert",
        });
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-400']} */ ;
        (error.value);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col-reverse']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:flex-row']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:justify-end']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                void $event;
                return (__VLS_unwrap(close, {})());
                // @ts-ignore
                [error, error, close,];
            } },
        type: "button",
        ...{ class: "h-11 rounded border border-flixer-border px-5 text-sm font-semibold hover:bg-white/5" },
    });
    /** @type {__VLS_StyleScopedClasses['h-11']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-white/5']} */ ;
    (__VLS_unwrap(t, {})('common.cancel'));
    if (multi.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (submit) },
            type: "button",
            ...{ class: "h-11 rounded bg-white px-5 text-sm font-bold text-flixer-background transition hover:bg-white/85 disabled:opacity-50" },
            disabled: (!canSubmit.value),
        });
        /** @type {__VLS_StyleScopedClasses['h-11']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-background']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/85']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
        (adding.value ? __VLS_unwrap(t, {})('chat.add') : __VLS_unwrap(t, {})('chat.createGroup'));
    }
    // @ts-ignore
    [adding, t, t, t, multi, canSubmit,];
    // @ts-ignore
    [];
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
