import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AdminSection from '../AdminSection.vue';
import StatusPill from '../StatusPill.vue';
import { formatUptime } from './dashboardFormat';
const { defineProps, } = {};
const props = defineProps();
const { t } = useI18n();
const info = computed(() => {
    const server = props.overview.server;
    const streamer = server.streamer;
    const transcodes = !streamer.reachable ? '—' : streamer.transcodingAvailable ? `${streamer.activeTranscodes} / ${streamer.maxTranscodes || '∞'}` : t('admin.overview.unavailable');
    return [
        [t('admin.overview.serverName'), server.name],
        [t('admin.overview.flixerVersion'), server.version],
        [t('admin.overview.operatingSystem'), server.os],
        ['Node.js', server.node],
        [t('admin.overview.uptime'), formatUptime(server.uptimeSeconds)],
        [t('admin.overview.activeStreams'), streamer.reachable ? `${streamer.sessions}` : '—'],
        [t('admin.overview.transcodes'), transcodes],
    ];
});
const services = computed(() => [
    { name: t('admin.overview.streamer'), ok: props.overview.server.streamer.reachable },
    { name: t('admin.overview.indexer'), ok: props.overview.server.indexer.reachable },
]);
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
        title: (__VLS_unwrap(t, {})('admin.overview.serverTitle')), description: (__VLS_unwrap(t, {})('admin.overview.serverDescription')), compact: true, ...{ class: "h-full" },
    }));
    const __VLS_2 = __VLS_1({
        title: (__VLS_unwrap(t, {})('admin.overview.serverTitle')),
        description: (__VLS_unwrap(t, {})('admin.overview.serverDescription')),
        compact: true,
        ...{ class: "h-full" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    {
        const { actions: __VLS_6 } = __VLS_nonNull(__VLS_3.slots);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex gap-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        const __VLS_7 = __VLS_tryAsConstant((__VLS_unwrap(services, {})));
        for (const [service] of __VLS_vFor(__VLS_nonNull(__VLS_7))) {
            const __VLS_8 = StatusPill || StatusPill;
            // @ts-ignore
            const __VLS_9 = __VLS_asFunctionalComponent1(__VLS_8, new __VLS_8({
                // @ts-ignore
                key: (service.name), tone: (service.ok ? 'good' : 'bad'),
            }));
            const __VLS_10 = __VLS_9({
                key: (service.name),
                tone: (service.ok ? 'good' : 'bad'),
            }, ...__VLS_functionalComponentArgsRest(__VLS_9));
            var __VLS_11;
            const { default: __VLS_13 } = __VLS_nonNull(__VLS_11.slots);
            (service.name);
            // @ts-ignore
            [t, t, services,];
            // @ts-ignore
            [];
        }
        // @ts-ignore
        [];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.dl, __VLS_intrinsics.dl)({
        ...{ class: "grid gap-y-1 text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-y-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    const __VLS_14 = __VLS_tryAsConstant((__VLS_unwrap(info, {})));
    for (const [[k, v]] of __VLS_vFor(__VLS_nonNull(__VLS_14))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (k),
            ...{ class: "flex justify-between gap-4" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
            ...{ class: "text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (k);
        __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
            ...{ class: "truncate text-right font-medium" },
        });
        /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        (v);
        // @ts-ignore
        [info,];
    }
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
