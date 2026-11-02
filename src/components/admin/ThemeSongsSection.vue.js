import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { listSettings, syncThemes, updateSetting } from '../../api';
import { notify } from '../../composables/notify';
import { describeRequestError } from '../../composables/useProfile';
import { catchError } from '../../utils/catchError';
import AdminSection from './AdminSection.vue';
import AdminToggle from './AdminToggle.vue';
const { t } = useI18n();
const enabled = ref(false);
const syncing = ref(false);
const loading = ref(true);
onMounted(async () => {
    try {
        const [error, settings] = await catchError(listSettings());
        if (error) {
            notify.error(describeRequestError(error, t('admin.themes.loadError')));
        }
        else {
            enabled.value = settings.find((entry) => entry.key === 'themes_enabled')?.value === true;
        }
    }
    finally {
        loading.value = false;
    }
});
async function setEnabled(value) {
    const previous = enabled.value;
    enabled.value = value;
    const [error] = await catchError(updateSetting('themes_enabled', value));
    if (error) {
        enabled.value = previous;
        notify.error(describeRequestError(error, t('admin.themes.saveError')));
    }
}
async function downloadExisting() {
    syncing.value = true;
    try {
        const [error, result] = await catchError(syncThemes());
        if (error) {
            notify.error(describeRequestError(error, t('admin.themes.syncError')));
        }
        else {
            notify.success(t('admin.themes.queued', { queued: result.queued, eligible: result.eligible }));
        }
    }
    finally {
        syncing.value = false;
    }
}
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(enabled, {});
    __VLS_withDotValue(loading, {});
    __VLS_withDotValue(syncing, {});
    const __VLS_0 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('admin.themes.title')), description: (__VLS_unwrap(t, {})('admin.themes.description')),
    }));
    const __VLS_2 = __VLS_1({
        title: (__VLS_unwrap(t, {})('admin.themes.title')),
        description: (__VLS_unwrap(t, {})('admin.themes.description')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    const __VLS_6 = AdminToggle;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
        // @ts-ignore
        ...{ 'onUpdate:modelValue': {} }, modelValue: (enabled.value), label: (__VLS_unwrap(t, {})('admin.themes.enabled')), description: (__VLS_unwrap(t, {})('admin.themes.toggleHint')),
    }));
    const __VLS_8 = __VLS_7({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (enabled.value),
        label: (__VLS_unwrap(t, {})('admin.themes.enabled')),
        description: (__VLS_unwrap(t, {})('admin.themes.toggleHint')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    let __VLS_11;
    const __VLS_12 = {
        /** @type {typeof __VLS_11.'update:modelValue'} */
        'onUpdate:modelValue': (setEnabled),
    };
    void __VLS_12;
    var __VLS_9;
    var __VLS_10;
    __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
        ...{ class: "mt-3 space-y-2 rounded border border-flixer-border bg-flixer-background/40 p-4 text-sm leading-6 text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-background/40']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['leading-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    (__VLS_unwrap(t, {})('admin.themes.attribution'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    (__VLS_unwrap(t, {})('admin.themes.downloadInfo'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    (__VLS_unwrap(t, {})('admin.themes.storageInfo'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-4 flex flex-wrap items-center gap-3" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (downloadExisting) },
        type: "button",
        disabled: (!enabled.value || loading.value || syncing.value),
        ...{ class: "rounded bg-flixer-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-flixer-primary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent disabled:cursor-not-allowed disabled:opacity-50" },
    });
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-primary']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-flixer-primary/80']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled:cursor-not-allowed']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
    (syncing.value ? __VLS_unwrap(t, {})('admin.themes.syncing') : __VLS_unwrap(t, {})('admin.themes.sync'));
    if (!enabled.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.themes.enableFirst'));
    }
    // @ts-ignore
    [t, t, t, t, t, t, t, t, t, t, enabled, enabled, enabled, loading, syncing, syncing,];
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
