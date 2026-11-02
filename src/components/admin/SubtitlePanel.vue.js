import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AdminSkeleton from './AdminSkeleton.vue';
import { deleteItemSubtitle, downloadItemSubtitle, listItemSubtitles, searchItemSubtitles } from '../../api';
import { confirmAction } from '../../composables/confirm';
import { notify } from '../../composables/notify';
import { languageName } from '../../composables/subtitles';
import { describeRequestError } from '../../composables/useProfile';
import { catchError } from '../../utils/catchError';
const { defineProps, defineEmits, } = {};
const props = defineProps();
const emit = defineEmits();
const { t, locale } = useI18n();
const LANGUAGES = ['en', 'es', 'fr', 'de', 'it', 'pt-BR', 'pt-PT', 'nl', 'sv', 'no', 'da', 'fi', 'pl', 'cs', 'hu', 'ro', 'el', 'tr', 'ru', 'uk', 'ar', 'he', 'hi', 'th', 'vi', 'id', 'ja', 'ko', 'zh-CN', 'zh-TW'];
const tracks = ref([]);
const configured = ref(true);
const loading = ref(true);
const loadError = ref('');
const searching = ref(false);
const searched = ref(false);
const searchError = ref('');
const downloading = ref(null);
const results = ref([]);
const query = ref('');
const language = ref(LANGUAGES.find((code) => code.toLowerCase() === locale.value.toLowerCase()) ?? LANGUAGES.find((code) => code === locale.value.split('-')[0]) ?? 'en');
const languageOptions = computed(() => LANGUAGES.map((code) => ({ code, name: `${languageName(code, locale.value)} (${code})` })));
const inputClass = 'h-9 rounded border border-flixer-border bg-flixer-background px-3 text-sm text-flixer-text';
function trackLabel(track) {
    const name = languageName(track.language, locale.value);
    return track.label ? `${name} (${track.label})` : name;
}
async function load() {
    loading.value = true;
    loadError.value = '';
    try {
        const [error, data] = await catchError(listItemSubtitles(props.itemId));
        if (error) {
            loadError.value = describeRequestError(error, t('subtitles.loadError'));
        }
        else {
            tracks.value = data.tracks;
            configured.value = data.configured;
        }
    }
    finally {
        loading.value = false;
    }
}
async function search() {
    searching.value = true;
    searchError.value = '';
    try {
        const [error, found] = await catchError(searchItemSubtitles(props.itemId, { query: query.value.trim() || undefined, languages: [language.value] }));
        if (error) {
            results.value = [];
            searchError.value = describeRequestError(error, t('subtitles.searchError'));
        }
        else {
            results.value = found;
        }
    }
    finally {
        searched.value = true;
        searching.value = false;
    }
}
async function download(result) {
    downloading.value = result.fileId;
    try {
        const [error] = await catchError(downloadItemSubtitle(props.itemId, result.fileId, language.value));
        if (error) {
            notify.error(describeRequestError(error, t('subtitles.downloadError')));
        }
        else {
            notify.success(t('subtitles.downloaded'));
            await load();
            emit('changed');
        }
    }
    finally {
        downloading.value = null;
    }
}
async function remove(track) {
    if (!(await confirmAction(t('subtitles.confirmRemove', { file: track.file }), { danger: true })))
        return;
    const [error] = await catchError(deleteItemSubtitle(props.itemId, track.file));
    if (error) {
        notify.error(describeRequestError(error, t('subtitles.removeError')));
    }
    else {
        notify.success(t('subtitles.removed'));
        await load();
        emit('changed');
    }
}
onMounted(load);
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
    __VLS_withDotValue(loading, {});
    __VLS_withDotValue(loadError, {});
    __VLS_withDotValue(tracks, {});
    __VLS_withDotValue(configured, {});
    __VLS_withDotValue(searching, {});
    __VLS_withDotValue(searchError, {});
    __VLS_withDotValue(results, {});
    __VLS_withDotValue(downloading, {});
    __VLS_withDotValue(searched, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "grid gap-4" },
        'aria-label': (__VLS_unwrap(t, {})('subtitles.title')),
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
        ...{ class: "text-xs font-semibold text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('subtitles.title'));
    if (loading.value) {
        const __VLS_0 = AdminSkeleton;
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
            // @ts-ignore
            variant: "tracks",
        }));
        const __VLS_2 = __VLS_1({
            variant: "tracks",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    }
    else if (loadError.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            role: "alert",
            ...{ class: "text-xs text-red-300" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
        (loadError.value);
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mb-1 text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('subtitles.inFolder'));
        if (tracks.value.length) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
                ...{ class: "grid gap-1" },
            });
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
            const __VLS_5 = __VLS_tryAsConstant((tracks.value));
            for (const [track] of __VLS_vFor(__VLS_nonNull(__VLS_5))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                    key: (track.file),
                    ...{ class: "flex items-center justify-between gap-3 rounded bg-white/5 px-3 py-1.5 text-xs" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-white/5']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "min-w-0" },
                });
                /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "font-medium text-flixer-text" },
                });
                /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
                (trackLabel(track));
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "ml-2 break-all font-mono text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['break-all']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (track.file);
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!!(loading.value))
                                throw 0;
                            if (!!(loadError.value))
                                throw 0;
                            if (!(tracks.value.length))
                                throw 0;
                            return (remove(track));
                            // @ts-ignore
                            [t, t, t, loading, loadError, loadError, tracks, tracks,];
                        } },
                    type: "button",
                    ...{ class: "shrink-0 text-red-300 hover:underline" },
                });
                /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:underline']} */ ;
                (__VLS_unwrap(t, {})('subtitles.remove'));
                // @ts-ignore
                [t,];
            }
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('subtitles.none'));
        }
        if (!configured.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "rounded border border-flixer-border bg-white/5 px-3 py-2 text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white/5']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('subtitles.notConfigured'));
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
                ...{ onSubmit: (search) },
                ...{ class: "grid gap-3" },
            });
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex flex-wrap items-end gap-2" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-end']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "flex min-w-48 flex-1 flex-col gap-1 text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['min-w-48']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('subtitles.searchLabel'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                value: (__VLS_unwrap(query, {})),
                type: "text",
                maxlength: "200",
                placeholder: (__VLS_unwrap(t, {})('subtitles.searchPlaceholder')),
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
            (__VLS_unwrap(t, {})('subtitles.language'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                value: (__VLS_unwrap(language, {})),
                ...{ class: (__VLS_unwrap(inputClass, {})) },
            });
            const __VLS_6 = __VLS_tryAsConstant((__VLS_unwrap(languageOptions, {})));
            for (const [option] of __VLS_vFor(__VLS_nonNull(__VLS_6))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                    key: (option.code),
                    value: (option.code),
                });
                (option.name);
                // @ts-ignore
                [t, t, t, t, t, configured, query, inputClass, inputClass, language, languageOptions,];
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                type: "submit",
                disabled: (searching.value),
                ...{ class: "h-9 rounded bg-flixer-primary px-4 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-50" },
            });
            /** @type {__VLS_StyleScopedClasses['h-9']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-primary']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-flixer-primary/80']} */ ;
            /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
            (searching.value ? __VLS_unwrap(t, {})('subtitles.searching') : __VLS_unwrap(t, {})('subtitles.search'));
            if (searchError.value) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    role: "alert",
                    ...{ class: "text-xs text-red-300" },
                });
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
                (searchError.value);
            }
            else if (results.value.length) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
                    ...{ class: "grid max-h-72 gap-1 overflow-y-auto pr-1" },
                });
                /** @type {__VLS_StyleScopedClasses['grid']} */ ;
                /** @type {__VLS_StyleScopedClasses['max-h-72']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
                /** @type {__VLS_StyleScopedClasses['pr-1']} */ ;
                const __VLS_7 = __VLS_tryAsConstant((results.value));
                for (const [result] of __VLS_vFor(__VLS_nonNull(__VLS_7))) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                        key: (result.fileId),
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
                        ...{ class: "min-w-0" },
                    });
                    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "block break-all font-medium text-flixer-text" },
                    });
                    /** @type {__VLS_StyleScopedClasses['block']} */ ;
                    /** @type {__VLS_StyleScopedClasses['break-all']} */ ;
                    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
                    (result.release || result.fileName);
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "mt-0.5 flex flex-wrap gap-x-3 text-flixer-muted" },
                    });
                    /** @type {__VLS_StyleScopedClasses['mt-0.5']} */ ;
                    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
                    /** @type {__VLS_StyleScopedClasses['gap-x-3']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                    if (result.hashMatch) {
                        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                            ...{ class: "font-semibold text-flixer-accent" },
                        });
                        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                        /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
                        (__VLS_unwrap(t, {})('subtitles.exactMatch'));
                    }
                    if (result.hearingImpaired) {
                        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                        (__VLS_unwrap(t, {})('subtitles.hearingImpaired'));
                    }
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                    (__VLS_unwrap(t, {})('subtitles.downloads', { count: result.downloads }));
                    if (result.uploader) {
                        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                        (result.uploader);
                    }
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                void $event;
                                if (!!(loading.value))
                                    throw 0;
                                if (!!(loadError.value))
                                    throw 0;
                                if (!!(!configured.value))
                                    throw 0;
                                if (!!(searchError.value))
                                    throw 0;
                                if (!(results.value.length))
                                    throw 0;
                                return (download(result));
                                // @ts-ignore
                                [t, t, t, t, t, searching, searching, searchError, searchError, results, results,];
                            } },
                        type: "button",
                        disabled: (downloading.value !== null),
                        ...{ class: "shrink-0 rounded bg-white/10 px-3 py-1 font-semibold transition hover:bg-white/15 disabled:opacity-50" },
                    });
                    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                    /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
                    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
                    /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
                    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                    /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
                    /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
                    (downloading.value === result.fileId ? __VLS_unwrap(t, {})('subtitles.downloading') : __VLS_unwrap(t, {})('subtitles.download'));
                    // @ts-ignore
                    [t, t, downloading, downloading,];
                }
            }
            else if (searched.value && !searching.value) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "text-xs text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (__VLS_unwrap(t, {})('subtitles.noResults'));
            }
        }
    }
    // @ts-ignore
    [t, searching, searched,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};
