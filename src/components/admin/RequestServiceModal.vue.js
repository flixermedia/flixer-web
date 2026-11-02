import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal';
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';
import { saveRequestService, testRequestService } from '../../api';
import { notify } from '../../composables/notify';
import { describeRequestError } from '../../composables/useProfile';
import { catchError } from '../../utils/catchError';
import TextInput from '../ui/TextInput.vue';
import AdminToggle from './AdminToggle.vue';
const { defineProps, defineOptions, } = {};
defineOptions({ modalGroup: 'default' });
const props = defineProps();
const { close, confirm } = useModalContext();
const { t } = useI18n();
const kindTypes = { radarr: ['movies', 'mixed'], sonarr: ['tvshows', 'mixed'], lidarr: ['music', 'mixed'] };
function compatibleFor(kind) {
    return props.libraries.filter((library) => kindTypes[kind].includes(library.type));
}
const selectClass = 'mt-1.5 w-full rounded border border-flixer-border bg-flixer-background px-4 py-3 text-sm text-flixer-text focus-visible:outline-2 focus-visible:outline-flixer-accent';
const labelClass = 'block text-xs font-medium text-flixer-muted';
const editingId = props.service?.id;
const draft = reactive(props.service
    ? (() => {
        const { id: _id, hasKey: _hasKey, ...input } = props.service;
        return { ...input, libraryId: props.service.libraryId ?? '', apiKey: '' };
    })()
    : { kind: 'sonarr', libraryId: compatibleFor('sonarr').length === 1 ? compatibleFor('sonarr')[0].id : '', name: '', url: '', enabled: true, isDefault: false, rootFolder: '', qualityProfileId: 0, metadataProfileId: null, languageProfileId: null, minimumAvailability: null, seasonFolders: true, tags: [], apiKey: '' });
const testResult = ref(null);
const testing = ref(false);
const saving = ref(false);
const compatibleLibraries = computed(() => compatibleFor(draft.kind));
const canSave = computed(() => Boolean(draft.name && draft.url && draft.libraryId && compatibleLibraries.value.some((library) => library.id === draft.libraryId)));
function changeKind(kind) {
    draft.kind = kind;
    const compatible = compatibleFor(kind);
    draft.libraryId = compatible.length === 1 ? compatible[0].id : '';
    testResult.value = null;
}
async function test() {
    testing.value = true;
    try {
        const [error, result] = await catchError(testRequestService({ kind: draft.kind, url: draft.url, apiKey: draft.apiKey ?? '', serviceId: editingId }));
        if (error) {
            notify.error(describeRequestError(error, t('admin.requests.testFailed')));
        }
        else {
            testResult.value = result;
            if (result.qualityProfiles.length && !result.qualityProfiles.some(({ id }) => id === draft.qualityProfileId))
                draft.qualityProfileId = result.qualityProfiles[0].id;
            if (result.rootFolders.length && !result.rootFolders.some(({ path }) => path === draft.rootFolder))
                draft.rootFolder = result.rootFolders[0].path;
            if (!result.ok)
                notify.error(result.error || t('admin.requests.testFailed'));
        }
    }
    finally {
        testing.value = false;
    }
}
async function save() {
    if (!canSave.value)
        return;
    saving.value = true;
    try {
        const [error] = await catchError(saveRequestService({ ...draft, apiKey: draft.apiKey || undefined }, editingId));
        if (error) {
            notify.error(describeRequestError(error, t('admin.requests.saveError')));
        }
        else {
            confirm(true);
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
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(editingId, {});
    __VLS_withDotValue(draft, {});
    __VLS_withDotValue(compatibleLibraries, {});
    __VLS_withDotValue(testResult, {});
    __VLS_withDotValue(testing, {});
    __VLS_withDotValue(saving, {});
    __VLS_withDotValue(canSave, {});
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
        ...{ class: "flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col rounded border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60" },
    }));
    const __VLS_8 = __VLS_7({
        ...{ class: "flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col rounded border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    /** @type {__VLS_StyleScopedClasses['flixer-modal-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-h-[calc(100dvh-2rem)]']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-2xl']} */ ;
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
        ...{ class: "shrink-0 text-lg font-semibold" },
    }));
    const __VLS_14 = __VLS_13({
        ...{ class: "shrink-0 text-lg font-semibold" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    var __VLS_15;
    const { default: __VLS_17 } = __VLS_nonNull(__VLS_15.slots);
    (editingId.value ? __VLS_unwrap(t, {})('admin.requests.editService') : __VLS_unwrap(t, {})('admin.requests.addService'));
    // @ts-ignore
    [editingId, t, t,];
    let __VLS_18;
    /** @ts-ignore @type { | typeof ModalDescription | typeof ModalDescription} */
    ModalDescription;
    // @ts-ignore
    const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
        // @ts-ignore
        ...{ class: "mt-1 shrink-0 text-sm leading-6 text-flixer-muted" },
    }));
    const __VLS_20 = __VLS_19({
        ...{ class: "mt-1 shrink-0 text-sm leading-6 text-flixer-muted" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_19));
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['leading-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    var __VLS_21;
    const { default: __VLS_23 } = __VLS_nonNull(__VLS_21.slots);
    (__VLS_unwrap(t, {})('admin.requests.servicesDescription'));
    // @ts-ignore
    [t,];
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (save) },
        ...{ class: "-mx-1 mt-5 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-1 overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" },
    });
    /** @type {__VLS_StyleScopedClasses['-mx-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-h-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['overscroll-contain']} */ ;
    /** @type {__VLS_StyleScopedClasses['[scrollbar-width:none]']} */ ;
    /** @type {__VLS_StyleScopedClasses['[&::-webkit-scrollbar]:hidden']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid gap-4 sm:grid-cols-2" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: (__VLS_unwrap(labelClass, {})) },
    });
    (__VLS_unwrap(t, {})('admin.requests.serviceKind'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (...[$event]) => {
                void $event;
                return (changeKind($event.target.value));
                // @ts-ignore
                [t, labelClass,];
            } },
        value: (draft.value.kind),
        ...{ class: (__VLS_unwrap(selectClass, {})) },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "sonarr",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "radarr",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "lidarr",
    });
    const __VLS_24 = TextInput;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
        // @ts-ignore
        modelValue: (draft.value.name), label: (__VLS_unwrap(t, {})('admin.requests.name')), name: "serviceName", required: true, maxlength: "100", autocomplete: "off",
    }));
    const __VLS_26 = __VLS_25({
        modelValue: (draft.value.name),
        label: (__VLS_unwrap(t, {})('admin.requests.name')),
        name: "serviceName",
        required: true,
        maxlength: "100",
        autocomplete: "off",
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
    const __VLS_29 = TextInput;
    // @ts-ignore
    const __VLS_30 = __VLS_asFunctionalComponent1(__VLS_29, new __VLS_29({
        // @ts-ignore
        modelValue: (draft.value.url), label: (__VLS_unwrap(t, {})('admin.requests.url')), type: "url", name: "serviceUrl", required: true, autocomplete: "off",
    }));
    const __VLS_31 = __VLS_30({
        modelValue: (draft.value.url),
        label: (__VLS_unwrap(t, {})('admin.requests.url')),
        type: "url",
        name: "serviceUrl",
        required: true,
        autocomplete: "off",
    }, ...__VLS_functionalComponentArgsRest(__VLS_30));
    const __VLS_34 = TextInput;
    // @ts-ignore
    const __VLS_35 = __VLS_asFunctionalComponent1(__VLS_34, new __VLS_34({
        // @ts-ignore
        modelValue: (draft.value.apiKey), label: (__VLS_unwrap(t, {})('admin.requests.apiKey')), type: "password", name: "serviceApiKey", placeholder: (editingId.value ? '••••••••' : ''), autocomplete: "new-password",
    }));
    const __VLS_36 = __VLS_35({
        modelValue: (draft.value.apiKey),
        label: (__VLS_unwrap(t, {})('admin.requests.apiKey')),
        type: "password",
        name: "serviceApiKey",
        placeholder: (editingId.value ? '••••••••' : ''),
        autocomplete: "new-password",
    }, ...__VLS_functionalComponentArgsRest(__VLS_35));
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: (__VLS_unwrap(labelClass, {})) },
    });
    (__VLS_unwrap(t, {})('admin.requests.library'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (draft.value.libraryId),
        required: true,
        disabled: (compatibleLibraries.value.length === 0),
        ...{ class: (__VLS_unwrap(selectClass, {})) },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
        disabled: true,
    });
    (__VLS_unwrap(t, {})('admin.requests.selectLibrary'));
    const __VLS_39 = __VLS_tryAsConstant((compatibleLibraries.value));
    for (const [library] of __VLS_vFor(__VLS_nonNull(__VLS_39))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (library.id),
            value: (library.id),
        });
        (library.name);
        if (library.type === 'mixed') {
            (__VLS_unwrap(t, {})('admin.requests.mixedLibrary'));
        }
        // @ts-ignore
        [editingId, t, t, t, t, t, t, labelClass, draft, draft, draft, draft, draft, selectClass, selectClass, compatibleLibraries, compatibleLibraries,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "mt-1.5 block text-[11px]" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-[11px]']} */ ;
    (__VLS_unwrap(t, {})('admin.requests.libraryHint'));
    if (compatibleLibraries.value.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "mt-2 block rounded border border-amber-300/20 bg-amber-300/[0.06] p-2.5 text-xs leading-5 text-amber-200" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-amber-300/20']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-amber-300/[0.06]']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-2.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['leading-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-amber-200']} */ ;
        (__VLS_unwrap(t, {})('admin.requests.noCompatibleLibrary'));
        let __VLS_40;
        /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
        RouterLink;
        // @ts-ignore
        const __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40({
            // @ts-ignore
            ...{ 'onClick': {} }, to: ({ name: 'admin', query: { tab: 'library' } }), ...{ class: "font-semibold underline underline-offset-2" },
        }));
        const __VLS_42 = __VLS_41({
            ...{ 'onClick': {} },
            to: ({ name: 'admin', query: { tab: 'library' } }),
            ...{ class: "font-semibold underline underline-offset-2" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_41));
        let __VLS_45;
        const __VLS_46 = {
            /** @type {typeof __VLS_45.click} */
            onClick: (...[$event]) => {
                void $event;
                if (!(compatibleLibraries.value.length === 0))
                    throw 0;
                return (__VLS_unwrap(close, {})());
                // @ts-ignore
                [t, t, compatibleLibraries, close,];
            },
        };
        void __VLS_46;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['underline']} */ ;
        /** @type {__VLS_StyleScopedClasses['underline-offset-2']} */ ;
        var __VLS_43;
        var __VLS_44;
        const { default: __VLS_47 } = __VLS_nonNull(__VLS_43.slots);
        (__VLS_unwrap(t, {})('admin.requests.goToLibraries'));
        // @ts-ignore
        [t,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid gap-4 sm:grid-cols-2" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: (__VLS_unwrap(labelClass, {})) },
    });
    (__VLS_unwrap(t, {})('admin.requests.qualityProfile'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (draft.value.qualityProfileId),
        ...{ class: (__VLS_unwrap(selectClass, {})) },
    });
    if (!testResult.value && draft.value.qualityProfileId) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: (draft.value.qualityProfileId),
        });
        (draft.value.qualityProfileId);
    }
    const __VLS_48 = __VLS_tryAsConstant((testResult.value?.qualityProfiles ?? []));
    for (const [entry] of __VLS_vFor(__VLS_nonNull(__VLS_48))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (entry.id),
            value: (entry.id),
        });
        (entry.name);
        // @ts-ignore
        [t, labelClass, draft, draft, draft, draft, selectClass, testResult, testResult,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: (__VLS_unwrap(labelClass, {})) },
    });
    (__VLS_unwrap(t, {})('admin.requests.rootFolder'));
    if (testResult.value?.rootFolders.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
            value: (draft.value.rootFolder),
            ...{ class: (__VLS_unwrap(selectClass, {})) },
        });
        const __VLS_49 = __VLS_tryAsConstant((testResult.value.rootFolders));
        for (const [entry] of __VLS_vFor(__VLS_nonNull(__VLS_49))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                key: (entry.path),
                value: (entry.path),
            });
            (entry.path);
            // @ts-ignore
            [t, labelClass, draft, selectClass, testResult, testResult,];
        }
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ class: (__VLS_unwrap(selectClass, {})) },
        });
        (draft.value.rootFolder);
    }
    if (draft.value.kind === 'lidarr') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: (__VLS_unwrap(labelClass, {})) },
        });
        (__VLS_unwrap(t, {})('admin.requests.metadataProfile'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
            value: (draft.value.metadataProfileId),
            ...{ class: (__VLS_unwrap(selectClass, {})) },
        });
        const __VLS_50 = __VLS_tryAsConstant((testResult.value?.metadataProfiles ?? []));
        for (const [entry] of __VLS_vFor(__VLS_nonNull(__VLS_50))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                key: (entry.id),
                value: (entry.id),
            });
            (entry.name);
            // @ts-ignore
            [t, labelClass, draft, draft, draft, selectClass, selectClass, testResult,];
        }
    }
    if (draft.value.kind === 'sonarr' && testResult.value?.languageProfiles.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: (__VLS_unwrap(labelClass, {})) },
        });
        (__VLS_unwrap(t, {})('admin.requests.languageProfile'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
            value: (draft.value.languageProfileId),
            ...{ class: (__VLS_unwrap(selectClass, {})) },
        });
        const __VLS_51 = __VLS_tryAsConstant((testResult.value.languageProfiles));
        for (const [entry] of __VLS_vFor(__VLS_nonNull(__VLS_51))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                key: (entry.id),
                value: (entry.id),
            });
            (entry.name);
            // @ts-ignore
            [t, labelClass, draft, draft, selectClass, testResult, testResult,];
        }
    }
    if (draft.value.kind === 'radarr') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: (__VLS_unwrap(labelClass, {})) },
        });
        (__VLS_unwrap(t, {})('admin.requests.minimumAvailability'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
            value: (draft.value.minimumAvailability),
            ...{ class: (__VLS_unwrap(selectClass, {})) },
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "announced",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "inCinemas",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "released",
        });
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    if (draft.value.kind === 'sonarr') {
        const __VLS_52 = AdminToggle;
        // @ts-ignore
        const __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52({
            // @ts-ignore
            modelValue: (draft.value.seasonFolders), label: (__VLS_unwrap(t, {})('admin.requests.seasonFolders')),
        }));
        const __VLS_54 = __VLS_53({
            modelValue: (draft.value.seasonFolders),
            label: (__VLS_unwrap(t, {})('admin.requests.seasonFolders')),
        }, ...__VLS_functionalComponentArgsRest(__VLS_53));
    }
    const __VLS_57 = AdminToggle;
    // @ts-ignore
    const __VLS_58 = __VLS_asFunctionalComponent1(__VLS_57, new __VLS_57({
        // @ts-ignore
        modelValue: (draft.value.isDefault), label: (__VLS_unwrap(t, {})('admin.requests.defaultService')),
    }));
    const __VLS_59 = __VLS_58({
        modelValue: (draft.value.isDefault),
        label: (__VLS_unwrap(t, {})('admin.requests.defaultService')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_58));
    const __VLS_62 = AdminToggle;
    // @ts-ignore
    const __VLS_63 = __VLS_asFunctionalComponent1(__VLS_62, new __VLS_62({
        // @ts-ignore
        modelValue: (draft.value.enabled), label: (__VLS_unwrap(t, {})('admin.requests.serviceEnabled')),
    }));
    const __VLS_64 = __VLS_63({
        modelValue: (draft.value.enabled),
        label: (__VLS_unwrap(t, {})('admin.requests.serviceEnabled')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_63));
    if (testResult.value?.ok && testResult.value.version) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "rounded border border-emerald-400/20 bg-emerald-400/[0.06] p-3 text-xs text-emerald-200" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-emerald-400/20']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-emerald-400/[0.06]']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-emerald-200']} */ ;
        (__VLS_unwrap(t, {})('admin.requests.connectionOk', { version: testResult.value.version }));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-col-reverse gap-3 sm:flex-row sm:justify-end" },
    });
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
                [t, t, t, t, t, labelClass, draft, draft, draft, draft, draft, draft, selectClass, close, testResult, testResult, testResult,];
            } },
        type: "button",
        ...{ class: "flex h-11 items-center justify-center rounded border border-flixer-border px-6 text-sm font-semibold text-flixer-text transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" },
        disabled: (saving.value),
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-11']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-white/5']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-offset-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    (__VLS_unwrap(t, {})('common.cancel'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (test) },
        type: "button",
        ...{ class: "flex h-11 items-center justify-center rounded border border-flixer-border px-6 text-sm font-semibold text-flixer-text transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:opacity-60" },
        disabled: (testing.value || !draft.value.url),
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-11']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-white/5']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-offset-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
    (testing.value ? __VLS_unwrap(t, {})('common.loading') : __VLS_unwrap(t, {})('admin.requests.testConnection'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        type: "submit",
        ...{ class: "flex h-11 items-center justify-center rounded bg-flixer-primary px-6 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:opacity-60" },
        disabled: (saving.value || !canSave.value),
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-11']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-primary']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:brightness-110']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-offset-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
    (__VLS_unwrap(t, {})('common.save'));
    // @ts-ignore
    [t, t, t, t, draft, saving, saving, testing, testing, canSave,];
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
