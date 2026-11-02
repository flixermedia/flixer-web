import { openModal } from '@kolirt/vue-modal';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { createMediaLibrary, updateMediaLibrary } from '../../api';
import { notify } from '../../composables/notify';
import { describeRequestError } from '../../composables/useProfile';
import { catchError } from '../../utils/catchError';
import MediaFolderPicker from './MediaFolderPicker.vue';
const { defineProps, defineEmits, } = {};
const props = defineProps();
const emit = defineEmits();
const { t } = useI18n();
const TYPES = ['movies', 'tvshows', 'music', 'homevideos', 'mixed'];
const IMAGE_STORAGES = ['cache', 'alongside'];
const name = ref(props.library?.name ?? '');
const type = ref(props.library?.type ?? 'movies');
const folders = ref((props.library?.folders ?? []).map((folder) => ({ rootId: folder.rootId, path: folder.path, label: folder.location || folder.path })));
const imageStorage = ref(props.library?.imageStorage ?? 'cache');
const saving = ref(false);
const error = ref('');
const canSave = computed(() => name.value.trim().length > 0 && folders.value.length > 0 && !saving.value);
async function addFolder() {
    const pickedFolders = await openModal(MediaFolderPicker).catch(() => null);
    if (!pickedFolders)
        return;
    for (const folder of pickedFolders) {
        if (!folders.value.some((entry) => entry.rootId === folder.rootId && entry.path === folder.path))
            folders.value.push(folder);
    }
}
async function save() {
    if (!canSave.value)
        return;
    saving.value = true;
    error.value = '';
    const input = { name: name.value.trim(), type: type.value, imageStorage: imageStorage.value, folders: folders.value.map(({ rootId, path }) => ({ rootId, path })) };
    try {
        const [requestError, saved] = await catchError(props.library ? updateMediaLibrary(props.library.id, input) : createMediaLibrary(input));
        if (requestError) {
            error.value = describeRequestError(requestError, t('admin.libraries.saveError'));
        }
        else {
            notify.success(t(props.library ? 'admin.libraries.updated' : 'admin.libraries.created'));
            emit('saved', saved);
        }
    }
    finally {
        saving.value = false;
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
    __VLS_withDotValue(folders, {});
    __VLS_withDotValue(error, {});
    __VLS_withDotValue(canSave, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (save) },
        ...{ class: "grid gap-4" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid gap-3 sm:grid-cols-2" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "flex flex-col gap-1 text-xs text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('admin.libraries.name'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_unwrap(name, {})),
        type: "text",
        maxlength: "100",
        required: true,
        placeholder: (__VLS_unwrap(t, {})('admin.libraries.namePlaceholder')),
        ...{ class: "rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm text-flixer-text" },
    });
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "flex flex-col gap-1 text-xs text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('admin.libraries.contentType'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_unwrap(type, {})),
        ...{ class: "rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm text-flixer-text" },
    });
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
    const __VLS_0 = __VLS_tryAsConstant((__VLS_unwrap(TYPES, {})));
    for (const [option] of __VLS_vFor(__VLS_nonNull(__VLS_0))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (option),
            value: (option),
        });
        (__VLS_unwrap(t, {})(`admin.libraries.types.${option}`));
        // @ts-ignore
        [t, t, t, t, name, type, TYPES,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "flex flex-col gap-1 text-xs text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('admin.libraries.imageStorage'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_unwrap(imageStorage, {})),
        ...{ class: "rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm text-flixer-text" },
    });
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
    const __VLS_1 = __VLS_tryAsConstant((__VLS_unwrap(IMAGE_STORAGES, {})));
    for (const [option] of __VLS_vFor(__VLS_nonNull(__VLS_1))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (option),
            value: (option),
        });
        (__VLS_unwrap(t, {})(`admin.libraries.imageStorages.${option}`));
        // @ts-ignore
        [t, t, imageStorage, IMAGE_STORAGES,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs font-semibold text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('admin.libraries.folders'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
        ...{ class: "mt-2 grid gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    const __VLS_2 = __VLS_tryAsConstant((folders.value));
    for (const [folder, index] of __VLS_vFor(__VLS_nonNull(__VLS_2))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
            key: (`${folder.rootId}/${folder.path}`),
            ...{ class: "flex items-center justify-between gap-3 rounded bg-white/5 px-3 py-2 text-xs" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/5']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "min-w-0 truncate font-mono" },
        });
        /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
        (folder.label);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    return (folders.value.splice(index, 1));
                    // @ts-ignore
                    [t, folders, folders,];
                } },
            type: "button",
            ...{ class: "text-red-300 hover:underline" },
        });
        /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:underline']} */ ;
        (__VLS_unwrap(t, {})('admin.libraries.remove'));
        // @ts-ignore
        [t,];
    }
    if (folders.value.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
            ...{ class: "text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.libraries.noFolders'));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (addFolder) },
        type: "button",
        ...{ class: "mt-2 text-xs text-flixer-accent hover:underline" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:underline']} */ ;
    (__VLS_unwrap(t, {})('admin.libraries.addFolder'));
    if (error.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            role: "alert",
            ...{ class: "text-sm text-red-300" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
        (error.value);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        type: "submit",
        disabled: (!canSave.value),
        ...{ class: "rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-50" },
    });
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-primary']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-flixer-primary/80']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
    (__VLS_unwrap(t, {})('admin.libraries.save'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                void $event;
                return (__VLS_unwrap(emit, {})('cancel'));
                // @ts-ignore
                [t, t, t, folders, error, error, canSave, emit,];
            } },
        type: "button",
        ...{ class: "rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15" },
    });
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
    (__VLS_unwrap(t, {})('admin.libraries.cancel'));
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
