import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { createGuideSource, deleteGuideSource, getAdminGuide, refreshGuideSource, updateGuideChannels, updateGuideSettings, updateGuideSource } from '../../api/guide';
import { describeRequestError } from '../../composables/useProfile';
import { catchError } from '../../utils/catchError';
const { t } = useI18n();
const data = ref(null);
const isLoading = ref(true);
const loadError = ref('');
const actionMessage = ref('');
const sourceDrafts = ref({});
const channelDrafts = ref({});
const regionalMergeThresholdPercent = ref(65);
const sourceKind = ref('epg');
const sourceName = ref('');
const sourceUrl = ref('');
const sourceBusy = ref('');
const sourceErrors = ref({});
const busyAction = ref('');
const channelSaveError = ref('');
const settingsSaveError = ref('');
const sortedChannels = computed(() => [...(data.value?.channels ?? [])].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)));
function installData(value) {
    data.value = value;
    sourceDrafts.value = Object.fromEntries(value.sources.map((source) => [source.id, { name: source.name, url: source.url, enabled: source.enabled, sortOrder: source.sortOrder }]));
    channelDrafts.value = Object.fromEntries(value.channels.map((channel) => [channel.id, { id: channel.id, enabled: channel.enabled, sortOrder: channel.sortOrder, iptvChannelId: channel.iptvChannelId }]));
    regionalMergeThresholdPercent.value = value.settings.regionalMergeThresholdPercent;
}
async function load() {
    isLoading.value = true;
    loadError.value = '';
    const [error, result] = await catchError(getAdminGuide());
    if (error) {
        loadError.value = describeRequestError(error, t('admin.guide.loadError'));
    }
    else {
        installData(result);
    }
    isLoading.value = false;
}
async function addSource() {
    if (!sourceName.value.trim() || !sourceUrl.value.trim() || sourceBusy.value)
        return;
    sourceBusy.value = 'new';
    sourceErrors.value = { ...sourceErrors.value, new: '' };
    const [error] = await catchError(createGuideSource({ kind: sourceKind.value, name: sourceName.value.trim(), url: sourceUrl.value.trim() }));
    if (error) {
        sourceErrors.value = { ...sourceErrors.value, new: describeRequestError(error, t('admin.guide.saveError')) };
    }
    else {
        sourceName.value = '';
        sourceUrl.value = '';
        actionMessage.value = t('admin.guide.sourceAdded');
        await load();
    }
    sourceBusy.value = '';
}
async function saveSource(source) {
    const draft = sourceDrafts.value[source.id];
    if (!draft || sourceBusy.value)
        return;
    sourceBusy.value = source.id;
    sourceErrors.value = { ...sourceErrors.value, [source.id]: '' };
    const [error] = await catchError(updateGuideSource(source.id, draft));
    if (error) {
        sourceErrors.value = { ...sourceErrors.value, [source.id]: describeRequestError(error, t('admin.guide.saveError')) };
    }
    else {
        actionMessage.value = t('admin.guide.sourceSaved');
        await load();
    }
    sourceBusy.value = '';
}
async function refreshSource(source) {
    if (sourceBusy.value)
        return;
    sourceBusy.value = source.id;
    sourceErrors.value = { ...sourceErrors.value, [source.id]: '' };
    const [error] = await catchError(refreshGuideSource(source.id));
    if (error) {
        sourceErrors.value = { ...sourceErrors.value, [source.id]: describeRequestError(error, t('admin.guide.refreshError')) };
    }
    else {
        actionMessage.value = t('admin.guide.sourceRefreshed');
        await load();
    }
    sourceBusy.value = '';
}
async function removeSource(source) {
    if (source.isDefault || sourceBusy.value || !window.confirm(t('admin.guide.confirmDelete', { name: source.name })))
        return;
    sourceBusy.value = source.id;
    sourceErrors.value = { ...sourceErrors.value, [source.id]: '' };
    const [error] = await catchError(deleteGuideSource(source.id));
    if (error) {
        sourceErrors.value = { ...sourceErrors.value, [source.id]: describeRequestError(error, t('admin.guide.deleteError')) };
    }
    else {
        actionMessage.value = t('admin.guide.sourceDeleted');
        await load();
    }
    sourceBusy.value = '';
}
function setIptvChannel(channelId, value) {
    const draft = channelDrafts.value[channelId];
    if (draft)
        draft.iptvChannelId = value || null;
}
async function saveChannels() {
    if (busyAction.value)
        return;
    busyAction.value = 'channels';
    channelSaveError.value = '';
    const channels = Object.values(channelDrafts.value);
    const [error] = await catchError(updateGuideChannels(channels));
    if (error) {
        channelSaveError.value = describeRequestError(error, t('admin.guide.saveError'));
    }
    else {
        actionMessage.value = t('admin.guide.channelsSaved');
        await load();
    }
    busyAction.value = '';
}
async function saveSettings() {
    if (busyAction.value)
        return;
    busyAction.value = 'settings';
    settingsSaveError.value = '';
    const [error] = await catchError(updateGuideSettings(regionalMergeThresholdPercent.value));
    if (error) {
        settingsSaveError.value = describeRequestError(error, t('admin.guide.saveError'));
    }
    else {
        actionMessage.value = t('admin.guide.settingsSaved');
        await load();
    }
    busyAction.value = '';
}
function channelMappingLabel(channelId) {
    if (!channelId)
        return t('admin.guide.automaticMapping');
    const channel = data.value?.iptvChannels.find((entry) => entry.id === channelId);
    return channel ? `${channel.sourceName} · ${channel.name}` : t('admin.guide.unknownMapping');
}
onMounted(() => void load());
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(loadError, {});
    __VLS_withDotValue(isLoading, {});
    __VLS_withDotValue(data, {});
    __VLS_withDotValue(sourceBusy, {});
    __VLS_withDotValue(sourceErrors, {});
    __VLS_withDotValue(sourceDrafts, {});
    __VLS_withDotValue(busyAction, {});
    __VLS_withDotValue(channelSaveError, {});
    __VLS_withDotValue(sortedChannels, {});
    __VLS_withDotValue(channelDrafts, {});
    __VLS_withDotValue(settingsSaveError, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "space-y-6" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "sr-only" },
        role: "status",
        'aria-live': "polite",
    });
    /** @type {__VLS_StyleScopedClasses['sr-only']} */ ;
    (__VLS_unwrap(actionMessage, {}));
    if (loadError.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            role: "alert",
            ...{ class: "rounded border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-red-400/30']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-red-500/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-200']} */ ;
        (loadError.value);
    }
    if (isLoading.value && !data.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "admin-card p-8 text-sm text-flixer-muted" },
            role: "status",
        });
        /** @type {__VLS_StyleScopedClasses['admin-card']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-8']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.guide.loading'));
    }
    else if (data.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "space-y-6" },
        });
        /** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "admin-card space-y-4 p-5 sm:p-6" },
        });
        /** @type {__VLS_StyleScopedClasses['admin-card']} */ ;
        /** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:p-6']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
            ...{ class: "text-lg font-semibold text-white" },
        });
        /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        (__VLS_unwrap(t, {})('admin.guide.sourcesTitle'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-1 text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.guide.sourcesDescription'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
            ...{ onSubmit: (addSource) },
            ...{ class: "grid gap-3 rounded border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[9rem_minmax(10rem,1fr)_minmax(14rem,2fr)_auto]" },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/[0.03]']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:grid-cols-[9rem_minmax(10rem,1fr)_minmax(14rem,2fr)_auto]']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "space-y-1 text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_unwrap(t, {})('admin.guide.sourceKind'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
            value: (__VLS_unwrap(sourceKind, {})),
            ...{ class: "h-10 w-full rounded border border-white/10 bg-flixer-surface px-3 text-sm text-white" },
        });
        /** @type {__VLS_StyleScopedClasses['h-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "epg",
        });
        (__VLS_unwrap(t, {})('admin.guide.epg'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "iptv",
        });
        (__VLS_unwrap(t, {})('admin.guide.iptv'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "space-y-1 text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_unwrap(t, {})('admin.guide.sourceName'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            required: true,
            maxlength: "120",
            ...{ class: "h-10 w-full rounded border border-white/10 bg-flixer-surface px-3 text-sm text-white" },
            placeholder: (__VLS_unwrap(t, {})('admin.guide.namePlaceholder')),
        });
        (__VLS_unwrap(sourceName, {}));
        /** @type {__VLS_StyleScopedClasses['h-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "space-y-1 text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_unwrap(t, {})('admin.guide.sourceUrl'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            required: true,
            type: "url",
            ...{ class: "h-10 w-full rounded border border-white/10 bg-flixer-surface px-3 text-sm text-white" },
            placeholder: (__VLS_unwrap(t, {})('admin.guide.urlPlaceholder')),
        });
        (__VLS_unwrap(sourceUrl, {}));
        /** @type {__VLS_StyleScopedClasses['h-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            type: "submit",
            ...{ class: "self-end rounded bg-flixer-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-flixer-secondary disabled:opacity-50" },
            disabled: (sourceBusy.value === 'new'),
        });
        /** @type {__VLS_StyleScopedClasses['self-end']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-primary']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-flixer-secondary']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
        (sourceBusy.value === 'new' ? __VLS_unwrap(t, {})('admin.guide.adding') : __VLS_unwrap(t, {})('admin.guide.addSource'));
        if (sourceErrors.value.new) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-sm text-red-300 md:col-span-full" },
                role: "alert",
            });
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
            /** @type {__VLS_StyleScopedClasses['md:col-span-full']} */ ;
            (sourceErrors.value.new);
        }
        if (data.value.sources.length === 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "rounded border border-white/10 p-4 text-sm text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.guide.noSources'));
        }
        const __VLS_0 = __VLS_tryAsConstant((data.value.sources));
        for (const [source] of __VLS_vFor(__VLS_nonNull(__VLS_0))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
                key: (source.id),
                ...{ class: "space-y-3 rounded border border-white/10 bg-white/[0.02] p-4" },
            });
            /** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white/[0.02]']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex flex-wrap items-center justify-between gap-2" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex items-center gap-2" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "rounded bg-flixer-accent/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-flixer-accent" },
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-accent/15']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
            /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
            /** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
            (__VLS_unwrap(t, {})(`admin.guide.${source.kind}`));
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.guide.sourceCounts', { channels: source.channelCount, programmes: source.programmeCount }));
            if (source.isDefault) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "rounded bg-white/10 px-2 py-1 text-[10px] font-semibold text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (__VLS_unwrap(t, {})('admin.guide.defaultSource'));
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "inline-flex items-center gap-2 text-sm text-white" },
            });
            /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "checkbox",
                ...{ class: "size-4 accent-flixer-accent" },
            });
            (sourceDrafts.value[source.id].enabled);
            /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['accent-flixer-accent']} */ ;
            (__VLS_unwrap(t, {})('admin.guide.enabled'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "grid gap-3 md:grid-cols-[minmax(10rem,1fr)_minmax(14rem,2fr)_6rem]" },
            });
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['md:grid-cols-[minmax(10rem,1fr)_minmax(14rem,2fr)_6rem]']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "space-y-1 text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (__VLS_unwrap(t, {})('admin.guide.sourceName'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                maxlength: "120",
                ...{ class: "h-10 w-full rounded border border-white/10 bg-flixer-surface px-3 text-sm text-white" },
            });
            (sourceDrafts.value[source.id].name);
            /** @type {__VLS_StyleScopedClasses['h-10']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "space-y-1 text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (__VLS_unwrap(t, {})('admin.guide.sourceUrl'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "url",
                ...{ class: "h-10 w-full rounded border border-white/10 bg-flixer-surface px-3 text-sm text-white" },
            });
            (sourceDrafts.value[source.id].url);
            /** @type {__VLS_StyleScopedClasses['h-10']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "space-y-1 text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (__VLS_unwrap(t, {})('admin.guide.sortOrder'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "number",
                min: "0",
                ...{ class: "h-10 w-full rounded border border-white/10 bg-flixer-surface px-3 text-sm text-white" },
            });
            (sourceDrafts.value[source.id].sortOrder);
            /** @type {__VLS_StyleScopedClasses['h-10']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex flex-wrap gap-2" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!!(isLoading.value && !data.value))
                            throw 0;
                        if (!(data.value))
                            throw 0;
                        return (saveSource(source));
                        // @ts-ignore
                        [actionMessage, loadError, loadError, isLoading, data, data, data, data, t, t, t, t, t, t, t, t, t, t, t, t, t, t, t, t, t, t, t, t, sourceKind, sourceName, sourceUrl, sourceBusy, sourceBusy, sourceErrors, sourceErrors, sourceDrafts, sourceDrafts, sourceDrafts, sourceDrafts,];
                    } },
                type: "button",
                ...{ class: "rounded bg-flixer-primary px-3 py-2 text-xs font-semibold text-white hover:bg-flixer-secondary disabled:opacity-50" },
                disabled: (sourceBusy.value !== ''),
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-primary']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-flixer-secondary']} */ ;
            /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
            (sourceBusy.value === source.id ? __VLS_unwrap(t, {})('admin.guide.saving') : __VLS_unwrap(t, {})('admin.guide.saveSource'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!!(isLoading.value && !data.value))
                            throw 0;
                        if (!(data.value))
                            throw 0;
                        return (refreshSource(source));
                        // @ts-ignore
                        [t, t, sourceBusy, sourceBusy,];
                    } },
                type: "button",
                ...{ class: "rounded border border-white/15 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-50" },
                disabled: (sourceBusy.value !== ''),
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-white/15']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
            (sourceBusy.value === source.id ? __VLS_unwrap(t, {})('admin.guide.refreshing') : __VLS_unwrap(t, {})('admin.guide.refresh'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!!(isLoading.value && !data.value))
                            throw 0;
                        if (!(data.value))
                            throw 0;
                        return (removeSource(source));
                        // @ts-ignore
                        [t, t, sourceBusy, sourceBusy,];
                    } },
                type: "button",
                ...{ class: "rounded border border-red-400/30 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/10 disabled:opacity-40" },
                disabled: (sourceBusy.value !== '' || source.isDefault),
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-red-400/30']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-red-200']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-red-500/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['disabled:opacity-40']} */ ;
            (__VLS_unwrap(t, {})('admin.guide.deleteSource'));
            if (source.lastRefreshedAt) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "self-center text-xs text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['self-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (__VLS_unwrap(t, {})('admin.guide.lastRefreshed', { time: new Date(source.lastRefreshedAt).toLocaleString() }));
            }
            if (source.lastError) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "rounded border border-red-400/20 bg-red-500/5 p-3 text-sm text-red-200" },
                    role: "alert",
                });
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['border']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-red-400/20']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-red-500/5']} */ ;
                /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-red-200']} */ ;
                (source.lastError);
            }
            if (sourceErrors.value[source.id]) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "text-sm text-red-300" },
                    role: "alert",
                });
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
                (sourceErrors.value[source.id]);
            }
            // @ts-ignore
            [t, t, sourceBusy, sourceErrors, sourceErrors,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "admin-card space-y-4 p-5 sm:p-6" },
        });
        /** @type {__VLS_StyleScopedClasses['admin-card']} */ ;
        /** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:p-6']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex flex-wrap items-start justify-between gap-4" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
            ...{ class: "text-lg font-semibold text-white" },
        });
        /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        (__VLS_unwrap(t, {})('admin.guide.channelsTitle'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-1 text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.guide.channelsDescription'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (saveChannels) },
            type: "button",
            ...{ class: "rounded bg-flixer-primary px-4 py-2 text-sm font-semibold text-white hover:bg-flixer-secondary disabled:opacity-50" },
            disabled: (busyAction.value !== ''),
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-primary']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-flixer-secondary']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
        (busyAction.value === 'channels' ? __VLS_unwrap(t, {})('admin.guide.saving') : __VLS_unwrap(t, {})('admin.guide.saveChannels'));
        if (channelSaveError.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                role: "alert",
                ...{ class: "text-sm text-red-300" },
            });
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
            (channelSaveError.value);
        }
        if (sortedChannels.value.length) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "overflow-x-auto" },
            });
            /** @type {__VLS_StyleScopedClasses['overflow-x-auto']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
                ...{ class: "w-full min-w-[46rem] border-collapse text-left text-sm" },
            });
            /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['min-w-[46rem]']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-collapse']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                ...{ class: "border-b border-white/10 text-xs uppercase tracking-wide text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
            /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
                ...{ class: "px-3 py-2 font-semibold" },
            });
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            (__VLS_unwrap(t, {})('admin.guide.channelName'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
                ...{ class: "px-3 py-2 font-semibold" },
            });
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            (__VLS_unwrap(t, {})('admin.guide.sourceName'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
                ...{ class: "px-3 py-2 font-semibold" },
            });
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            (__VLS_unwrap(t, {})('admin.guide.enabled'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
                ...{ class: "w-24 px-3 py-2 font-semibold" },
            });
            /** @type {__VLS_StyleScopedClasses['w-24']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            (__VLS_unwrap(t, {})('admin.guide.sortOrder'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
                ...{ class: "min-w-64 px-3 py-2 font-semibold" },
            });
            /** @type {__VLS_StyleScopedClasses['min-w-64']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            (__VLS_unwrap(t, {})('admin.guide.iptvMapping'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
            const __VLS_1 = __VLS_tryAsConstant((sortedChannels.value));
            for (const [channel] of __VLS_vFor(__VLS_nonNull(__VLS_1))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                    key: (channel.id),
                    ...{ class: "border-b border-white/[0.06] last:border-0" },
                });
                /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-white/[0.06]']} */ ;
                /** @type {__VLS_StyleScopedClasses['last:border-0']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                    ...{ class: "px-3 py-3" },
                });
                /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "flex items-center gap-2" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
                if (channel.icon) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
                        src: (channel.icon),
                        alt: "",
                        ...{ class: "size-8 rounded bg-white/5 object-contain p-1" },
                        loading: "lazy",
                    });
                    /** @type {__VLS_StyleScopedClasses['size-8']} */ ;
                    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                    /** @type {__VLS_StyleScopedClasses['bg-white/5']} */ ;
                    /** @type {__VLS_StyleScopedClasses['object-contain']} */ ;
                    /** @type {__VLS_StyleScopedClasses['p-1']} */ ;
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "min-w-0" },
                });
                /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "truncate font-medium text-white" },
                });
                /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                (channel.name);
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "truncate text-xs text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (channel.id);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                    ...{ class: "px-3 py-3 text-xs text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (channel.sourceName);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                    ...{ class: "px-3 py-3" },
                });
                /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    type: "checkbox",
                    ...{ class: "size-4 accent-flixer-accent" },
                    'aria-label': (__VLS_unwrap(t, {})('admin.guide.enableChannel', { channel: channel.name })),
                });
                (channelDrafts.value[channel.id].enabled);
                /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['accent-flixer-accent']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                    ...{ class: "px-3 py-3" },
                });
                /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    type: "number",
                    min: "0",
                    ...{ class: "h-9 w-20 rounded border border-white/10 bg-flixer-surface px-2 text-sm text-white" },
                    'aria-label': (__VLS_unwrap(t, {})('admin.guide.channelOrder', { channel: channel.name })),
                });
                (channelDrafts.value[channel.id].sortOrder);
                /** @type {__VLS_StyleScopedClasses['h-9']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-20']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['border']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                    ...{ class: "px-3 py-3" },
                });
                /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                    ...{ onChange: (...[$event]) => {
                            void $event;
                            if (!!(isLoading.value && !data.value))
                                throw 0;
                            if (!(data.value))
                                throw 0;
                            if (!(sortedChannels.value.length))
                                throw 0;
                            return (setIptvChannel(channel.id, $event.target.value));
                            // @ts-ignore
                            [t, t, t, t, t, t, t, t, t, t, t, busyAction, busyAction, channelSaveError, channelSaveError, sortedChannels, sortedChannels, channelDrafts, channelDrafts,];
                        } },
                    value: (channelDrafts.value[channel.id].iptvChannelId ?? ''),
                    ...{ class: "h-9 w-full rounded border border-white/10 bg-flixer-surface px-2 text-xs text-white" },
                    'aria-label': (__VLS_unwrap(t, {})('admin.guide.mapChannel', { channel: channel.name })),
                });
                /** @type {__VLS_StyleScopedClasses['h-9']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['border']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                    value: "",
                });
                (__VLS_unwrap(t, {})('admin.guide.automaticMapping'));
                const __VLS_2 = __VLS_tryAsConstant((data.value.iptvChannels));
                for (const [iptv] of __VLS_vFor(__VLS_nonNull(__VLS_2))) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                        key: (iptv.id),
                        value: (iptv.id),
                        disabled: (!iptv.playable),
                    });
                    (iptv.sourceName);
                    (iptv.name);
                    (iptv.playable ? '' : ` · ${__VLS_unwrap(t, {})('admin.guide.notPlayable')}`);
                    // @ts-ignore
                    [data, t, t, t, channelDrafts,];
                }
                if (!channel.iptvChannelId && channel.automaticIptvChannelId) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                        ...{ class: "mt-1 truncate text-[10px] text-flixer-muted" },
                    });
                    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
                    /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                    (__VLS_unwrap(t, {})('admin.guide.automaticSuggestion', { name: channelMappingLabel(channel.automaticIptvChannelId) }));
                }
                // @ts-ignore
                [t,];
            }
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "rounded border border-white/10 p-4 text-sm text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.guide.noChannels'));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "admin-card space-y-4 p-5 sm:p-6" },
        });
        /** @type {__VLS_StyleScopedClasses['admin-card']} */ ;
        /** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:p-6']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
            ...{ class: "text-lg font-semibold text-white" },
        });
        /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        (__VLS_unwrap(t, {})('admin.guide.settingsTitle'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-1 text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.guide.settingsDescription'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
            ...{ onSubmit: (saveSettings) },
            ...{ class: "flex flex-wrap items-end gap-3" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-end']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "space-y-1 text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_unwrap(t, {})('admin.guide.regionalThreshold'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "number",
            min: "1",
            max: "100",
            required: true,
            ...{ class: "h-10 w-32 rounded border border-white/10 bg-flixer-surface px-3 text-sm text-white" },
        });
        (__VLS_unwrap(regionalMergeThresholdPercent, {}));
        /** @type {__VLS_StyleScopedClasses['h-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-32']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "pb-2 text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['pb-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            type: "submit",
            ...{ class: "rounded bg-flixer-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-flixer-secondary disabled:opacity-50" },
            disabled: (busyAction.value !== ''),
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-primary']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-flixer-secondary']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
        (busyAction.value === 'settings' ? __VLS_unwrap(t, {})('admin.guide.saving') : __VLS_unwrap(t, {})('admin.guide.saveSettings'));
        if (settingsSaveError.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                role: "alert",
                ...{ class: "text-sm text-red-300" },
            });
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
            (settingsSaveError.value);
        }
    }
    if (loadError.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (load) },
            type: "button",
            ...{ class: "rounded bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
        (__VLS_unwrap(t, {})('admin.guide.retry'));
    }
    // @ts-ignore
    [loadError, t, t, t, t, t, t, t, busyAction, busyAction, regionalMergeThresholdPercent, settingsSaveError, settingsSaveError,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
