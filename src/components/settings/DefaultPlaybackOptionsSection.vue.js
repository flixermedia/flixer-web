import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { getPreferences, updatePreferences } from '../../api';
import { notify } from '../../composables/notify';
import { languageName } from '../../composables/subtitles';
import { describeRequestError } from '../../composables/useProfile';
import { catchError } from '../../utils/catchError';
const { t, locale } = useI18n();
const autoSkipIntroCredits = ref(true);
const savedAutoSkipIntroCredits = ref(true);
const audioLanguage = ref('');
const savedAudioLanguage = ref('');
const isLoading = ref(true);
const isSaving = ref(false);
const audioLanguages = computed(() => ['ar', 'cs', 'da', 'de', 'el', 'en', 'es', 'fi', 'fr', 'he', 'hi', 'hu', 'id', 'it', 'ja', 'ko', 'ms', 'nl', 'no', 'pl', 'pt', 'pt-BR', 'pt-PT', 'ro', 'ru', 'sv', 'th', 'tr', 'uk', 'vi', 'zh', 'zh-Hans', 'zh-Hant'].map((code) => ({ code, name: languageName(code, locale.value) })).sort((left, right) => left.name.localeCompare(right.name, locale.value)));
async function load() {
    const [error, preferences] = await catchError(getPreferences());
    if (error) {
        console.error('[settings] playback preferences load failed', error);
        notify.error(describeRequestError(error, t('settings.playback.loadFailed')));
        return;
    }
    autoSkipIntroCredits.value = preferences.autoSkipIntroCredits ?? true;
    savedAutoSkipIntroCredits.value = autoSkipIntroCredits.value;
    audioLanguage.value = preferences.audioLanguage ?? '';
    savedAudioLanguage.value = audioLanguage.value;
}
async function save() {
    isSaving.value = true;
    const [error] = await catchError(updatePreferences({ autoSkipIntroCredits: autoSkipIntroCredits.value }));
    if (error) {
        console.error('[settings] playback preferences update failed', error);
        autoSkipIntroCredits.value = savedAutoSkipIntroCredits.value;
        notify.error(describeRequestError(error, t('settings.playback.saveFailed')));
    }
    else {
        savedAutoSkipIntroCredits.value = autoSkipIntroCredits.value;
        notify.success(t('settings.playback.saved'));
    }
    isSaving.value = false;
}
async function saveAudioLanguage() {
    isSaving.value = true;
    const [error] = await catchError(updatePreferences({ audioLanguage: audioLanguage.value || null }));
    if (error) {
        console.error('[settings] default audio language update failed', error);
        audioLanguage.value = savedAudioLanguage.value;
        notify.error(describeRequestError(error, t('settings.playback.saveFailed')));
    }
    else {
        savedAudioLanguage.value = audioLanguage.value;
        notify.success(t('settings.playback.saved'));
    }
    isSaving.value = false;
}
onMounted(() => {
    void load().finally(() => {
        isLoading.value = false;
    });
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(isLoading, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        'aria-labelledby': "default-playback-heading",
        ...{ class: "max-w-2xl" },
    });
    /** @type {__VLS_StyleScopedClasses['max-w-2xl']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
        id: "default-playback-heading",
        ...{ class: "text-lg font-semibold" },
    });
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    (__VLS_unwrap(t, {})('settings.playback.title'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-1 text-sm text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('settings.playback.description'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "mt-6 block rounded border border-flixer-border bg-flixer-surface p-4" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "block text-sm font-medium" },
    });
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    (__VLS_unwrap(t, {})('settings.playback.audioLanguage'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "mt-1 block text-sm text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('settings.playback.audioLanguageDescription'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (saveAudioLanguage) },
        value: (__VLS_unwrap(audioLanguage, {})),
        ...{ class: "mt-3 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-flixer-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
        disabled: (isLoading.value || __VLS_unwrap(isSaving, {})),
    });
    /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    (__VLS_unwrap(t, {})('settings.playback.audioLanguageDefault'));
    const __VLS_0 = __VLS_tryAsConstant((__VLS_unwrap(audioLanguages, {})));
    for (const [language] of __VLS_vFor(__VLS_nonNull(__VLS_0))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (language.code),
            value: (language.code),
        });
        (language.name);
        // @ts-ignore
        [t, t, t, t, t, audioLanguage, isLoading, isSaving, audioLanguages,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "mt-6 flex items-start gap-3 rounded border border-flixer-border bg-flixer-surface p-4" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (save) },
        type: "checkbox",
        ...{ class: "mt-1 size-4 accent-flixer-primary" },
        disabled: (isLoading.value || __VLS_unwrap(isSaving, {})),
    });
    (__VLS_unwrap(autoSkipIntroCredits, {}));
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['accent-flixer-primary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "block text-sm font-medium" },
    });
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    (__VLS_unwrap(t, {})('settings.playback.autoSkipIntroCredits'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "mt-1 block text-sm text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('settings.playback.autoSkipIntroCreditsDescription'));
    // @ts-ignore
    [t, t, isLoading, isSaving, autoSkipIntroCredits,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
