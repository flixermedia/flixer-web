import { openModal } from '@kolirt/vue-modal';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { listSettings } from '../../api';
import { describeRequestError } from '../../composables/useProfile';
import { catchError } from '../../utils/catchError';
import AdminSection from './AdminSection.vue';
import SubtitlesSettingsModal from './SubtitlesSettingsModal.vue';
const { t } = useI18n();
const stored = ref();
const loading = ref(true);
const error = ref('');
async function load() {
    try {
        const [requestError, settings] = await catchError(listSettings());
        if (requestError) {
            error.value = describeRequestError(requestError, t('admin.indexer.subtitles.error'));
        }
        else {
            stored.value = settings.find((setting) => setting.key === 'indexer_subtitles')?.value;
            error.value = '';
        }
    }
    finally {
        loading.value = false;
    }
}
async function configure() {
    const saved = await openModal(SubtitlesSettingsModal, { props: { stored: stored.value } }).catch(() => false);
    if (saved)
        await load();
}
onMounted(load);
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(error, {});
    __VLS_withDotValue(loading, {});
    __VLS_withDotValue(stored, {});
    const __VLS_0 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('admin.indexer.subtitles.title')), description: (__VLS_unwrap(t, {})('admin.indexer.subtitles.description')),
    }));
    const __VLS_2 = __VLS_1({
        title: (__VLS_unwrap(t, {})('admin.indexer.subtitles.title')),
        description: (__VLS_unwrap(t, {})('admin.indexer.subtitles.description')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    {
        const { actions: __VLS_6 } = __VLS_nonNull(__VLS_3.slots);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (configure) },
            type: "button",
            disabled: (loading.value),
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
        (__VLS_unwrap(t, {})('admin.indexer.subtitles.configure'));
        if (!error.value && !loading.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (stored.value?.apiKey ? __VLS_unwrap(t, {})('admin.indexer.subtitles.configured') : __VLS_unwrap(t, {})('admin.indexer.subtitles.notConfigured'));
        }
        // @ts-ignore
        [t, t, t, t, t, loading, loading, error, stored,];
    }
    if (error.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            role: "alert",
            ...{ class: "text-sm text-red-300" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
        (error.value);
    }
    // @ts-ignore
    [error, error,];
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
