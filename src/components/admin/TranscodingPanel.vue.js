import { onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { listSettings, updateSetting } from '../../api';
import { notify } from '../../composables/notify';
import { describeRequestError } from '../../composables/useProfile';
import { catchError } from '../../utils/catchError';
import AdminSection from './AdminSection.vue';
import AdminSkeleton from './AdminSkeleton.vue';
const HW_ACCEL = [
    { value: 'none', label: 'admin.transcoding.noneSoftware' },
    { value: 'nvenc', label: 'admin.transcoding.nvidiaNvenc' },
    { value: 'qsv', label: 'admin.transcoding.intelQuickSync' },
    { value: 'vaapi', label: 'admin.transcoding.vaapi' },
    { value: 'amf', label: 'admin.transcoding.amdAmf' },
];
const PRESETS = [
    ['ultrafast', 'presetUltrafast'],
    ['superfast', 'presetSuperfast'],
    ['veryfast', 'presetVeryfast'],
    ['faster', 'presetFaster'],
    ['fast', 'presetFast'],
    ['medium', 'presetMedium'],
    ['slow', 'presetSlow'],
];
const { t } = useI18n();
const form = reactive({ hwAccel: 'none', preset: 'veryfast', crf: 23, threads: 0, maxBitrateMbps: 0, maxConcurrent: '' });
const saved = ref({});
const isLoading = ref(true);
const isSaving = ref(false);
const inputClass = 'mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-flixer-text';
const button = 'rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60';
function number(value, fallback) {
    return typeof value === 'number' ? value : fallback;
}
async function load() {
    try {
        const [error, settings] = await catchError(listSettings());
        if (error) {
            console.error('[transcoding] failed to load settings', error);
            notify.error(describeRequestError(error, t('admin.transcoding.loadFailed')));
        }
        else {
            const values = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
            saved.value = values;
            form.hwAccel = typeof values.transcode_hw_accel === 'string' ? values.transcode_hw_accel : 'none';
            form.preset = typeof values.transcode_preset === 'string' ? values.transcode_preset : 'veryfast';
            form.crf = number(values.transcode_crf, 23);
            form.threads = number(values.transcode_threads, 0);
            form.maxBitrateMbps = number(values.transcode_max_bitrate_kbps, 0) / 1000;
            form.maxConcurrent = typeof values.transcode_max_concurrent === 'number' ? values.transcode_max_concurrent : '';
        }
    }
    finally {
        isLoading.value = false;
    }
}
function whole(value, min, max) {
    return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}
async function save() {
    const bitrate = Math.round(Number(form.maxBitrateMbps) * 1000);
    const concurrent = form.maxConcurrent === '' ? null : Number(form.maxConcurrent);
    if (!whole(Number(form.crf), 16, 32) || !whole(Number(form.threads), 0, 64) || !whole(bitrate, 0, 500_000) || (concurrent !== null && !whole(concurrent, 0, 100))) {
        notify.error(t('admin.transcoding.invalid'));
        return;
    }
    const changes = [
        ['transcode_hw_accel', form.hwAccel],
        ['transcode_preset', form.preset],
        ['transcode_crf', Number(form.crf)],
        ['transcode_threads', Number(form.threads)],
        ['transcode_max_bitrate_kbps', bitrate],
        ['transcode_max_concurrent', concurrent],
    ];
    isSaving.value = true;
    try {
        let requestError;
        for (const [key, value] of changes) {
            if (saved.value[key] !== value) {
                const [error] = await catchError(updateSetting(key, value));
                if (error) {
                    requestError = error;
                    break;
                }
            }
        }
        if (requestError) {
            console.error('[transcoding] failed to save settings', requestError);
            notify.error(describeRequestError(requestError, t('admin.transcoding.saveFailed')));
        }
        else {
            notify.success(t('admin.transcoding.saved'));
        }
    }
    finally {
        isSaving.value = false;
        await load();
    }
}
onMounted(load);
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(isLoading, {});
    __VLS_withDotValue(form, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-col gap-6" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
    const __VLS_0 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('admin.transcoding.title')), description: (__VLS_unwrap(t, {})('admin.transcoding.description')),
    }));
    const __VLS_2 = __VLS_1({
        title: (__VLS_unwrap(t, {})('admin.transcoding.title')),
        description: (__VLS_unwrap(t, {})('admin.transcoding.description')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    {
        const { actions: __VLS_6 } = __VLS_nonNull(__VLS_3.slots);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (save) },
            type: "button",
            ...{ class: (__VLS_unwrap(button, {})) },
            disabled: (isLoading.value || __VLS_unwrap(isSaving, {})),
        });
        (__VLS_unwrap(t, {})('common.save'));
        // @ts-ignore
        [t, t, t, button, isLoading, isSaving,];
    }
    if (isLoading.value) {
        const __VLS_7 = AdminSkeleton;
        // @ts-ignore
        const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
            // @ts-ignore
            variant: "fields", rows: (6),
        }));
        const __VLS_9 = __VLS_8({
            variant: "fields",
            rows: (6),
        }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid gap-x-8 gap-y-4 md:grid-cols-2" },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-x-8']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-y-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:grid-cols-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.transcoding.hardwareAcceleration'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
            value: (form.value.hwAccel),
            ...{ class: (__VLS_unwrap(inputClass, {})) },
        });
        const __VLS_12 = __VLS_tryAsConstant((__VLS_unwrap(HW_ACCEL, {})));
        for (const [option] of __VLS_vFor(__VLS_nonNull(__VLS_12))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                key: (option.value),
                value: (option.value),
            });
            (__VLS_unwrap(t, {})(option.label));
            // @ts-ignore
            [t, t, isLoading, form, inputClass, HW_ACCEL,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "mt-1 block" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        (__VLS_unwrap(t, {})('admin.transcoding.hardwareHint'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.transcoding.encoderPreset'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
            value: (form.value.preset),
            ...{ class: (__VLS_unwrap(inputClass, {})) },
        });
        const __VLS_13 = __VLS_tryAsConstant((__VLS_unwrap(PRESETS, {})));
        for (const [[value, key]] of __VLS_vFor(__VLS_nonNull(__VLS_13))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                key: (value),
                value: (value),
            });
            (__VLS_unwrap(t, {})(`admin.transcoding.${key}`));
            // @ts-ignore
            [t, t, t, form, inputClass, PRESETS,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "mt-1 block" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        (__VLS_unwrap(t, {})('admin.transcoding.presetHint'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.transcoding.concurrentTranscodes'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "number",
            min: "0",
            max: "100",
            ...{ class: (__VLS_unwrap(inputClass, {})) },
        });
        (form.value.maxConcurrent);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "mt-1 block" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        (__VLS_unwrap(t, {})('admin.transcoding.concurrentHint'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.transcoding.encodingThreads'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "number",
            min: "0",
            max: "64",
            ...{ class: (__VLS_unwrap(inputClass, {})) },
        });
        (form.value.threads);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "mt-1 block" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        (__VLS_unwrap(t, {})('admin.transcoding.threadsHint'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.transcoding.constantRateFactor'));
        (form.value.crf);
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "range",
            min: "16",
            max: "32",
            ...{ class: "mt-2 w-full accent-flixer-primary" },
        });
        (form.value.crf);
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['accent-flixer-primary']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "mt-1 block" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        (__VLS_unwrap(t, {})('admin.transcoding.crfHint'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.transcoding.maximumStreamingBitrate'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "number",
            min: "0",
            step: "0.5",
            ...{ class: (__VLS_unwrap(inputClass, {})) },
        });
        (form.value.maxBitrateMbps);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "mt-1 block" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        (__VLS_unwrap(t, {})('admin.transcoding.bitrateHint'));
    }
    // @ts-ignore
    [t, t, t, t, t, t, t, t, t, form, form, form, form, form, inputClass, inputClass, inputClass,];
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
