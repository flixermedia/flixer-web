import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { addMediaItemImage, getMediaItem, MEDIA_IMAGE_TYPES, refreshMediaItem, removeMediaItemImage, updateMediaItem } from '../../api';
import { confirmAction } from '../../composables/confirm';
import { notify } from '../../composables/notify';
import { describeRequestError } from '../../composables/useProfile';
import { catchError } from '../../utils/catchError';
import AuthImage from '../ui/AuthImage.vue';
import StatusPill from './StatusPill.vue';
import SubtitlePanel from './SubtitlePanel.vue';
const { defineProps, defineOptions, } = {};
const props = defineProps();
defineOptions({ modalGroup: 'default' });
const { close, confirm } = useModalContext();
const { t } = useI18n();
const ACCEPTED_IMAGES = 'image/png,image/jpeg,image/webp,image/gif';
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const COMMON_PROVIDER_IDS = ['tmdb', 'tvdb', 'imdb', 'omdb', 'anilist', 'anidb', 'mal', 'musicbrainz', 'discogs', 'audiodb'];
const item = ref(null);
const loadError = ref('');
const saveError = ref('');
const imageError = ref('');
const saving = ref(false);
const imageBusy = ref(false);
const changed = ref(false);
const newImageType = ref('poster');
const fileInput = ref(null);
const title = ref('');
const sortTitle = ref('');
const year = ref(null);
const seasonNumber = ref(null);
const episodeNumber = ref(null);
const episodeEndNumber = ref(null);
const overview = ref('');
const providerIds = ref({});
const newProviderName = ref('');
const inputClass = 'rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm text-flixer-text';
const hasSubtitles = computed(() => ['movie', 'episode', 'video'].includes(item.value?.type ?? ''));
const hasEpisodeNumbers = computed(() => item.value?.type === 'episode' || item.value?.type === 'track');
const hasSeasonNumber = computed(() => item.value?.type === 'season' || item.value?.type === 'episode');
const canSave = computed(() => title.value.trim().length > 0 && !saving.value);
const images = computed(() => item.value?.images ?? []);
const providerFields = computed(() => [...new Set([...COMMON_PROVIDER_IDS, ...Object.keys(providerIds.value)])]);
// A cleared number box is v-model.number's empty string; treat it as "no value".
function numberOrNull(value) {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
function applyDetail(detail) {
    item.value = detail;
    title.value = detail.title;
    sortTitle.value = detail.sortTitle ?? '';
    year.value = detail.year;
    seasonNumber.value = detail.seasonNumber;
    episodeNumber.value = detail.episodeNumber;
    episodeEndNumber.value = detail.episodeEndNumber;
    overview.value = typeof detail.metadata.overview === 'string' ? detail.metadata.overview : '';
    providerIds.value = { ...detail.providerIds };
}
function addProviderField() {
    const provider = newProviderName.value.trim().toLowerCase();
    if (!/^[a-z][a-z0-9_-]{0,31}$/.test(provider)) {
        saveError.value = t('admin.media.providerIdInvalid');
        return;
    }
    providerIds.value = { ...providerIds.value, [provider]: providerIds.value[provider] ?? '' };
    newProviderName.value = '';
    saveError.value = '';
}
async function load() {
    const [error, result] = await catchError(getMediaItem(props.itemId));
    if (error) {
        loadError.value = describeRequestError(error, t('admin.media.detailError'));
    }
    else {
        applyDetail(result);
    }
}
// Only send fields that changed so untouched ones stay owned by the indexer.
async function save() {
    if (!item.value || !canSave.value)
        return;
    const current = item.value;
    const changes = {};
    if (title.value.trim() !== current.title)
        changes.title = title.value.trim();
    if ((sortTitle.value.trim() || null) !== current.sortTitle)
        changes.sortTitle = sortTitle.value.trim() || null;
    if (numberOrNull(year.value) !== current.year)
        changes.year = numberOrNull(year.value);
    if (numberOrNull(seasonNumber.value) !== current.seasonNumber)
        changes.seasonNumber = numberOrNull(seasonNumber.value);
    if (numberOrNull(episodeNumber.value) !== current.episodeNumber)
        changes.episodeNumber = numberOrNull(episodeNumber.value);
    if (numberOrNull(episodeEndNumber.value) !== current.episodeEndNumber)
        changes.episodeEndNumber = numberOrNull(episodeEndNumber.value);
    const previousOverview = typeof current.metadata.overview === 'string' ? current.metadata.overview : '';
    if (overview.value !== previousOverview)
        changes.overview = overview.value.trim() || null;
    const providerChanges = {};
    for (const provider of providerFields.value) {
        const next = providerIds.value[provider]?.trim() ?? '';
        const previous = current.providerIds[provider] ?? '';
        if (next !== previous)
            providerChanges[provider] = next || null;
    }
    if (Object.keys(providerChanges).length > 0)
        changes.providerIds = providerChanges;
    if (Object.keys(changes).length === 0) {
        confirm(changed.value);
        return;
    }
    saving.value = true;
    saveError.value = '';
    try {
        const [error] = await catchError(updateMediaItem(current.id, changes));
        if (error) {
            saveError.value = describeRequestError(error, t('admin.media.saveError'));
        }
        else {
            if (changes.providerIds) {
                const [refreshError, refresh] = await catchError(refreshMediaItem(current.id, true));
                if (refreshError) {
                    notify.error(describeRequestError(refreshError, t('admin.media.providerIdRescanError')));
                }
                else if (refresh.alreadyQueued) {
                    notify.success(t('admin.media.rescanAlreadyQueued'));
                }
                else {
                    notify.success(t('admin.media.providerIdsSaved'));
                }
            }
            else {
                notify.success(t('admin.media.saved'));
            }
            confirm(true);
        }
    }
    finally {
        saving.value = false;
    }
}
async function onFileChosen(event) {
    const input = event.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !item.value)
        return;
    if (!ACCEPTED_IMAGES.split(',').includes(file.type)) {
        imageError.value = t('admin.media.imageInvalidType');
        return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
        imageError.value = t('admin.media.imageTooLarge');
        return;
    }
    imageBusy.value = true;
    imageError.value = '';
    try {
        const [error, detail] = await catchError(addMediaItemImage(item.value.id, newImageType.value, file));
        if (error) {
            imageError.value = describeRequestError(error, t('admin.media.imageAddError'));
        }
        else {
            item.value = detail;
            changed.value = true;
            notify.success(t('admin.media.imageAdded'));
        }
    }
    finally {
        imageBusy.value = false;
    }
}
async function removeImage(index) {
    if (!item.value || !(await confirmAction(t('admin.media.confirmRemoveImage'), { danger: true })))
        return;
    imageBusy.value = true;
    imageError.value = '';
    try {
        const [error, detail] = await catchError(removeMediaItemImage(item.value.id, index));
        if (error) {
            imageError.value = describeRequestError(error, t('admin.media.imageRemoveError'));
        }
        else {
            item.value = detail;
            changed.value = true;
            notify.success(t('admin.media.imageRemoved'));
        }
    }
    finally {
        imageBusy.value = false;
    }
}
function imageLabel(image) {
    const size = image.width && image.height ? ` · ${image.width}×${image.height}` : '';
    return `${t(`admin.media.imageTypes.${image.type}`, image.type)}${size}`;
}
void load();
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
    __VLS_withDotValue(item, {});
    __VLS_withDotValue(loadError, {});
    __VLS_withDotValue(hasSeasonNumber, {});
    __VLS_withDotValue(hasEpisodeNumbers, {});
    __VLS_withDotValue(providerIds, {});
    __VLS_withDotValue(fileInput, {});
    __VLS_withDotValue(imageError, {});
    __VLS_withDotValue(images, {});
    __VLS_withDotValue(hasSubtitles, {});
    __VLS_withDotValue(saveError, {});
    __VLS_withDotValue(canSave, {});
    __VLS_withDotValue(changed, {});
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
        ...{ class: "flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col rounded border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60" },
    }));
    const __VLS_8 = __VLS_7({
        ...{ class: "flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col rounded border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    /** @type {__VLS_StyleScopedClasses['flixer-modal-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-h-[calc(100dvh-2rem)]']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-3xl']} */ ;
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
    (item.value ? __VLS_unwrap(t, {})('admin.media.editTitle', { title: item.value.title }) : __VLS_unwrap(t, {})('admin.media.edit'));
    // @ts-ignore
    [item, item, t, t,];
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
    (__VLS_unwrap(t, {})('admin.media.modalDescription'));
    // @ts-ignore
    [t,];
    if (loadError.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            role: "alert",
            ...{ class: "mt-4 text-sm text-red-300" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
        (loadError.value);
    }
    else if (item.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
            ...{ onSubmit: (save) },
            id: "media-item-form",
            ...{ class: "mt-4 grid min-h-24 flex-1 gap-5 overflow-y-auto pr-1" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['min-h-24']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
        /** @type {__VLS_StyleScopedClasses['pr-1']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid gap-3 sm:grid-cols-2" },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "flex flex-col gap-1 text-xs text-flixer-muted sm:col-span-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:col-span-2']} */ ;
        (__VLS_unwrap(t, {})('admin.media.fieldTitle'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            value: (__VLS_unwrap(title, {})),
            type: "text",
            maxlength: "1000",
            required: true,
            ...{ class: (__VLS_unwrap(inputClass, {})) },
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "flex flex-col gap-1 text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.media.fieldSortTitle'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            value: (__VLS_unwrap(sortTitle, {})),
            type: "text",
            maxlength: "1000",
            ...{ class: (__VLS_unwrap(inputClass, {})) },
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "flex flex-col gap-1 text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.media.fieldYear'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "number",
            min: "0",
            ...{ class: (__VLS_unwrap(inputClass, {})) },
        });
        (__VLS_unwrap(year, {}));
        if (hasSeasonNumber.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "flex flex-col gap-1 text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.media.fieldSeason'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
                min: "0",
                ...{ class: (__VLS_unwrap(inputClass, {})) },
            });
            (__VLS_unwrap(seasonNumber, {}));
        }
        if (hasEpisodeNumbers.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "flex flex-col gap-1 text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.media.fieldEpisode'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
                min: "0",
                ...{ class: (__VLS_unwrap(inputClass, {})) },
            });
            (__VLS_unwrap(episodeNumber, {}));
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "flex flex-col gap-1 text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.media.fieldEpisodeEnd'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
                min: "0",
                ...{ class: (__VLS_unwrap(inputClass, {})) },
            });
            (__VLS_unwrap(episodeEndNumber, {}));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "flex flex-col gap-1 text-xs text-flixer-muted sm:col-span-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:col-span-2']} */ ;
        (__VLS_unwrap(t, {})('admin.media.fieldOverview'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
            value: (__VLS_unwrap(overview, {})),
            rows: "4",
            maxlength: "20000",
            ...{ class: (__VLS_unwrap(inputClass, {})) },
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            'aria-label': (__VLS_unwrap(t, {})('admin.media.providerIds')),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex flex-wrap items-end justify-between gap-3" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-end']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
            ...{ class: "text-xs font-semibold text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.media.providerIds'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex items-center gap-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onKeydown: (addProviderField) },
            value: (__VLS_unwrap(newProviderName, {})),
            type: "text",
            maxlength: "32",
            'aria-label': (__VLS_unwrap(t, {})('admin.media.providerIdName')),
            placeholder: (__VLS_unwrap(t, {})('admin.media.providerIdName')),
            ...{ class: (__VLS_unwrap(inputClass, {})) },
            ...{ class: "py-1 text-xs" },
        });
        /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (addProviderField) },
            type: "button",
            ...{ class: "rounded bg-white/10 px-3 py-1 text-xs font-semibold transition hover:bg-white/15" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
        (__VLS_unwrap(t, {})('admin.media.addProviderId'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-3 grid gap-3 sm:grid-cols-2" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
        const __VLS_24 = __VLS_tryAsConstant((__VLS_unwrap(providerFields, {})));
        for (const [provider] of __VLS_vFor(__VLS_nonNull(__VLS_24))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                key: (provider),
                ...{ class: "flex flex-col gap-1 text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (provider);
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                value: (providerIds.value[provider]),
                type: "text",
                maxlength: "256",
                'aria-label': (`${__VLS_unwrap(t, {})('admin.media.providerIds')} ${provider}`),
                ...{ class: (__VLS_unwrap(inputClass, {})) },
            });
            // @ts-ignore
            [item, t, t, t, t, t, t, t, t, t, t, t, t, t, loadError, loadError, title, inputClass, inputClass, inputClass, inputClass, inputClass, inputClass, inputClass, inputClass, inputClass, sortTitle, year, hasSeasonNumber, seasonNumber, hasEpisodeNumbers, episodeNumber, episodeEndNumber, overview, newProviderName, providerFields, providerIds,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            'aria-label': (__VLS_unwrap(t, {})('admin.media.images')),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex flex-wrap items-end justify-between gap-3" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-end']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
            ...{ class: "text-xs font-semibold text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.media.images'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex items-center gap-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
            value: (__VLS_unwrap(newImageType, {})),
            'aria-label': (__VLS_unwrap(t, {})('admin.media.imageType')),
            ...{ class: (__VLS_unwrap(inputClass, {})) },
            ...{ class: "py-1 text-xs" },
        });
        /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        const __VLS_25 = __VLS_tryAsConstant((__VLS_unwrap(MEDIA_IMAGE_TYPES, {})));
        for (const [option] of __VLS_vFor(__VLS_nonNull(__VLS_25))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                key: (option),
                value: (option),
            });
            (__VLS_unwrap(t, {})(`admin.media.imageTypes.${option}`));
            // @ts-ignore
            [t, t, t, t, inputClass, newImageType, MEDIA_IMAGE_TYPES,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!!(loadError.value))
                        throw 0;
                    if (!(item.value))
                        throw 0;
                    return (fileInput.value?.click());
                    // @ts-ignore
                    [fileInput,];
                } },
            type: "button",
            disabled: (__VLS_unwrap(imageBusy, {})),
            ...{ class: "rounded bg-white/10 px-3 py-1 text-xs font-semibold transition hover:bg-white/15 disabled:opacity-50" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
        (__VLS_unwrap(t, {})('admin.media.addImage'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onChange: (onFileChosen) },
            ref: "fileInput",
            type: "file",
            accept: (__VLS_unwrap(ACCEPTED_IMAGES, {})),
            ...{ class: "hidden" },
        });
        /** @type {__VLS_StyleScopedClasses['hidden']} */ ;
        if (imageError.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                role: "alert",
                ...{ class: "mt-2 text-xs text-red-300" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
            (imageError.value);
        }
        if (images.value.length) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
                ...{ class: "mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['sm:grid-cols-4']} */ ;
            const __VLS_26 = __VLS_tryAsConstant((images.value));
            for (const [image] of __VLS_vFor(__VLS_nonNull(__VLS_26))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                    key: (`${image.index}-${image.type}-${image.provider}-${image.width}`),
                    ...{ class: "flex flex-col gap-1" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "overflow-hidden rounded bg-white/5" },
                    ...{ class: (image.type === 'poster' ? 'aspect-[2/3]' : 'aspect-video') },
                });
                /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-white/5']} */ ;
                if (image.available) {
                    const __VLS_27 = AuthImage;
                    // @ts-ignore
                    const __VLS_28 = __VLS_asFunctionalComponent1(__VLS_27, new __VLS_27({
                        // @ts-ignore
                        itemId: (item.value.id), index: (image.index), version: (item.value.updatedAt), width: (480), alt: (imageLabel(image)),
                    }));
                    const __VLS_29 = __VLS_28({
                        itemId: (item.value.id),
                        index: (image.index),
                        version: (item.value.updatedAt),
                        width: (480),
                        alt: (imageLabel(image)),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_28));
                }
                else {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "flex h-full w-full items-center justify-center px-2 text-center text-[10px] text-flixer-muted" },
                    });
                    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                    /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
                    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
                    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
                    /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                    (__VLS_unwrap(t, {})('admin.media.imagePending'));
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "truncate text-[11px] text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-[11px]']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (imageLabel(image));
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "flex items-center justify-between gap-1 text-[11px] text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-[11px]']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                if (image.manual) {
                    const __VLS_32 = StatusPill || StatusPill;
                    // @ts-ignore
                    const __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({
                        // @ts-ignore
                        tone: "accent",
                    }));
                    const __VLS_34 = __VLS_33({
                        tone: "accent",
                    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
                    var __VLS_35;
                    const { default: __VLS_37 } = __VLS_nonNull(__VLS_35.slots);
                    (__VLS_unwrap(t, {})('admin.media.imageManual'));
                    // @ts-ignore
                    [item, item, t, t, t, imageBusy, ACCEPTED_IMAGES, imageError, imageError, images, images,];
                }
                else {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "truncate" },
                    });
                    /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                    (image.provider);
                }
                if (image.manual) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                void $event;
                                if (!!(loadError.value))
                                    throw 0;
                                if (!(item.value))
                                    throw 0;
                                if (!(images.value.length))
                                    throw 0;
                                if (!(image.manual))
                                    throw 0;
                                return (removeImage(image.index));
                                // @ts-ignore
                                [];
                            } },
                        type: "button",
                        disabled: (__VLS_unwrap(imageBusy, {})),
                        ...{ class: "text-red-300 hover:underline disabled:opacity-50" },
                    });
                    /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
                    /** @type {__VLS_StyleScopedClasses['hover:underline']} */ ;
                    /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
                    (__VLS_unwrap(t, {})('admin.media.removeImage'));
                }
                // @ts-ignore
                [t, imageBusy,];
            }
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mt-2 text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.media.noImages'));
        }
        if (hasSubtitles.value) {
            const __VLS_38 = SubtitlePanel;
            // @ts-ignore
            const __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38({
                // @ts-ignore
                itemId: (item.value.id),
            }));
            const __VLS_40 = __VLS_39({
                itemId: (item.value.id),
            }, ...__VLS_functionalComponentArgsRest(__VLS_39));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.dl, __VLS_intrinsics.dl)({
            ...{ class: "grid gap-1 text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex gap-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({});
        (__VLS_unwrap(t, {})('admin.media.path'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
            ...{ class: "min-w-0 break-all font-mono" },
        });
        /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['break-all']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
        (item.value.path);
        if (item.value.childCount > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            (__VLS_unwrap(t, {})('admin.media.children', { count: item.value.childCount }));
        }
        if (saveError.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                role: "alert",
                ...{ class: "text-sm text-red-300" },
            });
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
            (saveError.value);
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-5 flex shrink-0 justify-end gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    if (item.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            type: "submit",
            form: "media-item-form",
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
        (__VLS_unwrap(t, {})('admin.media.save'));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                void $event;
                return (changed.value ? __VLS_unwrap(confirm, {})(true) : __VLS_unwrap(close, {})());
                // @ts-ignore
                [item, item, item, item, item, t, t, t, t, hasSubtitles, saveError, saveError, canSave, changed, confirm, close,];
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
    (__VLS_unwrap(t, {})('admin.media.cancel'));
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
