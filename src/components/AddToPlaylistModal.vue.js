import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { addPlaylistItem, createPlaylist, getPlaylists, getPlaylistsContaining, removePlaylistItem } from '../api';
import { catchError } from '../utils/catchError';
const { defineProps, defineOptions, } = {};
defineOptions({ modalGroup: 'default' });
const props = defineProps();
const { close } = useModalContext();
const { t } = useI18n();
const added = ref(new Map());
const playlists = ref([]);
const selected = ref(new Set());
const name = ref('');
const busy = ref(false);
const error = ref(false);
async function load() {
    if (props.album) {
        const [failure, result] = await catchError(getPlaylists());
        if (failure) {
            error.value = true;
            return;
        }
        playlists.value = result.playlists;
        return;
    }
    const [failure, results] = await catchError(Promise.all([getPlaylists(), getPlaylistsContaining(props.itemId)]));
    if (failure) {
        error.value = true;
        return;
    }
    const [{ playlists: own }, { playlistIds }] = results;
    playlists.value = own;
    selected.value = new Set(playlistIds);
}
async function addAlbum(playlist) {
    if (busy.value)
        return;
    busy.value = true;
    error.value = false;
    try {
        const [failure, result] = await catchError(addPlaylistItem(playlist.id, props.itemId));
        if (failure) {
            error.value = true;
            return;
        }
        const { added: count } = result;
        added.value = new Map(added.value).set(playlist.id, count);
        playlist.trackCount += count;
    }
    finally {
        busy.value = false;
    }
}
async function toggle(playlist) {
    if (busy.value)
        return;
    busy.value = true;
    const wasSelected = selected.value.has(playlist.id);
    const next = new Set(selected.value);
    wasSelected ? next.delete(playlist.id) : next.add(playlist.id);
    selected.value = next;
    try {
        const [failure] = wasSelected ? await catchError(removePlaylistItem(playlist.id, props.itemId)) : await catchError(addPlaylistItem(playlist.id, props.itemId));
        if (failure) {
            selected.value = new Set(wasSelected ? [...selected.value, playlist.id] : [...selected.value].filter((id) => id !== playlist.id));
            error.value = true;
        }
    }
    finally {
        busy.value = false;
    }
}
async function create() {
    if (!name.value.trim() || busy.value)
        return;
    busy.value = true;
    error.value = false;
    try {
        const [createError, playlist] = await catchError(createPlaylist({ name: name.value.trim() }));
        if (createError) {
            error.value = true;
            return;
        }
        playlists.value = [playlist, ...playlists.value];
        const [addError, result] = await catchError(addPlaylistItem(playlist.id, props.itemId));
        if (addError) {
            error.value = true;
            return;
        }
        const { added: count } = result;
        if (props.album)
            added.value = new Map(added.value).set(playlist.id, count);
        else
            selected.value = new Set([...selected.value, playlist.id]);
        playlist.trackCount += count;
        name.value = '';
    }
    finally {
        busy.value = false;
    }
}
onMounted(() => void load());
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
    __VLS_withDotValue(error, {});
    __VLS_withDotValue(playlists, {});
    __VLS_withDotValue(added, {});
    __VLS_withDotValue(selected, {});
    __VLS_withDotValue(name, {});
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
    (__VLS_unwrap(t, {})('social.addToPlaylist'));
    // @ts-ignore
    [t,];
    let __VLS_18;
    /** @ts-ignore @type { | typeof ModalDescription | typeof ModalDescription} */
    ModalDescription;
    // @ts-ignore
    const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
        // @ts-ignore
        ...{ class: "mt-1 truncate text-sm text-flixer-muted" },
    }));
    const __VLS_20 = __VLS_19({
        ...{ class: "mt-1 truncate text-sm text-flixer-muted" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_19));
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    var __VLS_21;
    const { default: __VLS_23 } = __VLS_nonNull(__VLS_21.slots);
    (__VLS_ctx.title);
    // @ts-ignore
    [title,];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-4 min-h-0 space-y-1 overflow-y-auto p-1 -mx-1" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-h-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['-mx-1']} */ ;
    if (error.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mb-2 text-sm text-red-400" },
            role: "alert",
        });
        /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-400']} */ ;
        (__VLS_unwrap(t, {})('social.saveError'));
    }
    if (!playlists.value.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "px-2 py-3 text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('social.noPlaylists'));
    }
    if (__VLS_ctx.album) {
        const __VLS_24 = __VLS_tryAsConstant((playlists.value));
        for (const [playlist] of __VLS_vFor(__VLS_nonNull(__VLS_24))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!(__VLS_ctx.album))
                            throw 0;
                        return (addAlbum(playlist));
                        // @ts-ignore
                        [t, t, error, playlists, playlists, album,];
                    } },
                key: (playlist.id),
                type: "button",
                ...{ class: "flex w-full items-center gap-3 rounded px-3 py-3 text-left text-sm text-white transition motion-reduce:transition-none hover:bg-white/10 disabled:opacity-60" },
                disabled: (__VLS_unwrap(busy, {})),
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['motion-reduce:transition-none']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "min-w-0 flex-1 truncate" },
            });
            /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
            (playlist.name);
            if (added.value.has(playlist.id)) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "text-xs font-semibold text-emerald-300" },
                });
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-emerald-300']} */ ;
                (__VLS_unwrap(t, {})('social.albumAdded', { count: added.value.get(playlist.id) ?? 0 }));
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "text-xs text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (playlist.trackCount);
            }
            // @ts-ignore
            [t, busy, added, added,];
        }
    }
    const __VLS_25 = __VLS_tryAsConstant((__VLS_ctx.album ? [] : playlists.value));
    for (const [playlist] of __VLS_vFor(__VLS_nonNull(__VLS_25))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            key: (playlist.id),
            ...{ class: "flex cursor-pointer items-center gap-3 rounded px-3 py-3 text-sm text-white transition motion-reduce:transition-none hover:bg-white/10" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['motion-reduce:transition-none']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onChange: (...[$event]) => {
                    void $event;
                    return (toggle(playlist));
                    // @ts-ignore
                    [playlists, album,];
                } },
            type: "checkbox",
            ...{ class: "size-4 accent-flixer-accent" },
            checked: (selected.value.has(playlist.id)),
            disabled: (__VLS_unwrap(busy, {})),
        });
        /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['accent-flixer-accent']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "min-w-0 flex-1 truncate" },
        });
        /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
        (playlist.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (playlist.trackCount);
        // @ts-ignore
        [busy, selected,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (create) },
        ...{ class: "mt-4 flex gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        maxlength: "100",
        ...{ class: "min-w-0 flex-1 rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-flixer-accent" },
        placeholder: (__VLS_unwrap(t, {})('social.playlistName')),
        'aria-label': (__VLS_unwrap(t, {})('social.playlistName')),
    });
    (name.value);
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-flixer-accent']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        type: "submit",
        ...{ class: "rounded bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-50" },
        disabled: (!name.value.trim() || __VLS_unwrap(busy, {})),
    });
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
    (__VLS_unwrap(t, {})('social.create'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                void $event;
                return (__VLS_unwrap(close, {})());
                // @ts-ignore
                [t, t, t, busy, name, name, close,];
            } },
        type: "button",
        ...{ class: "mt-5 h-11 rounded border border-flixer-border px-4 text-sm font-semibold text-flixer-text hover:bg-white/5" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-11']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-white/5']} */ ;
    (__VLS_unwrap(t, {})('common.close'));
    // @ts-ignore
    [t,];
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
