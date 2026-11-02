import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AdminSection from '../AdminSection.vue';
import { formatBytes } from './dashboardFormat';
const { defineProps, } = {};
const props = defineProps();
const { t } = useI18n();
const totalDisk = computed(() => props.overview.storage.disks.reduce((sum, disk) => sum + disk.totalBytes, 0));
const freeDisk = computed(() => props.overview.storage.disks.reduce((sum, disk) => sum + disk.freeBytes, 0));
const diskUsedPct = computed(() => (totalDisk.value > 0 ? Math.round(((totalDisk.value - freeDisk.value) / totalDisk.value) * 100) : 0));
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
    const __VLS_0 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('admin.overview.storageTitle')), description: (__VLS_unwrap(t, {})('admin.overview.storageDescription')), ...{ class: "h-full" },
    }));
    const __VLS_2 = __VLS_1({
        title: (__VLS_unwrap(t, {})('admin.overview.storageTitle')),
        description: (__VLS_unwrap(t, {})('admin.overview.storageDescription')),
        ...{ class: "h-full" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-2xl font-semibold" },
    });
    /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    (__VLS_unwrap(formatBytes, {})(__VLS_ctx.overview.storage.usedBytes));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "text-sm font-normal text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-normal']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('admin.overview.inLibraries'));
    if (__VLS_unwrap(totalDisk, {}) > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-3 h-2 overflow-hidden rounded-full bg-white/10" },
            role: "progressbar",
            'aria-valuenow': (__VLS_unwrap(diskUsedPct, {})),
            'aria-valuemin': "0",
            'aria-valuemax': "100",
        });
        /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "h-full rounded-full bg-linear-to-r from-flixer-primary to-flixer-cyan" },
            ...{ style: ({ width: `${__VLS_unwrap(diskUsedPct, {})}%` }) },
        });
        /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-linear-to-r']} */ ;
        /** @type {__VLS_StyleScopedClasses['from-flixer-primary']} */ ;
        /** @type {__VLS_StyleScopedClasses['to-flixer-cyan']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-2 text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.overview.diskFree', { free: __VLS_unwrap(formatBytes, {})(__VLS_unwrap(freeDisk, {})), total: __VLS_unwrap(formatBytes, {})(__VLS_unwrap(totalDisk, {})) }));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
        ...{ class: "mt-4 grid gap-2 text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    const __VLS_6 = __VLS_tryAsConstant((__VLS_ctx.overview.libraries));
    for (const [lib] of __VLS_vFor(__VLS_nonNull(__VLS_6))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
            key: (lib.id),
            ...{ class: "flex justify-between gap-4" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "truncate text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (lib.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "shrink-0 font-medium" },
        });
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        (__VLS_unwrap(formatBytes, {})(lib.sizeBytes));
        // @ts-ignore
        [t, t, t, t, formatBytes, formatBytes, formatBytes, formatBytes, overview, overview, totalDisk, totalDisk, diskUsedPct, diskUsedPct, freeDisk,];
    }
    if (__VLS_ctx.overview.libraries.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
            ...{ class: "text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.overview.noLibraries'));
    }
    // @ts-ignore
    [t, overview,];
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
