import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useLiveLogs } from '../../composables/useLiveLogs';
import AdminSection from './AdminSection.vue';
import StatusPill from './StatusPill.vue';
const { t } = useI18n();
const { entries, status, paused, pause, resume, clear } = useLiveLogs();
const level = ref('all');
const search = ref('');
const listEl = ref(null);
const levels = ['debug', 'info', 'warn', 'error'];
const tone = { debug: 'neutral', info: 'neutral', warn: 'warn', error: 'bad' };
const visible = computed(() => {
    const q = search.value.trim().toLowerCase();
    return entries.value.filter((l) => (level.value === 'all' || l.level === level.value) &&
        (!q || l.message.toLowerCase().includes(q) || l.source.toLowerCase().includes(q) || l.app.toLowerCase().includes(q)));
});
const statusTone = computed(() => (status.value === 'live' ? 'accent' : status.value === 'connecting' ? 'neutral' : 'bad'));
const statusLabel = computed(() => (paused.value && status.value === 'live' ? t('admin.logs.paused') : t(`admin.logs.${status.value}`)));
const formatTime = (iso) => new Date(iso).toLocaleTimeString();
const formatFields = (fields) => Object.entries(fields ?? {})
    .map(([key, value]) => `${key}=${typeof value === 'string' ? value : JSON.stringify(value)}`)
    .join(' ');
const origin = (l) => l.app;
const detail = (l) => [l.source && l.source !== l.app ? `source=${l.source}` : '', formatFields(l.fields)].filter(Boolean).join(' ');
watch(() => visible.value.length, async () => {
    const el = listEl.value;
    if (!el)
        return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    await nextTick();
    if (nearBottom)
        el.scrollTop = el.scrollHeight;
});
function download() {
    const text = visible.value.map((l) => `${l.time} [${l.level.toUpperCase()}] ${origin(l)} ${l.message} ${detail(l)}`.trimEnd()).join('\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `flixer-logs-${new Date().toISOString()}.log`;
    a.click();
    URL.revokeObjectURL(url);
}
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(paused, {});
    __VLS_withDotValue(tone, {});
    __VLS_withDotValue(visible, {});
    const __VLS_0 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('admin.logs.title')), description: (__VLS_unwrap(t, {})('admin.logs.description')),
    }));
    const __VLS_2 = __VLS_1({
        title: (__VLS_unwrap(t, {})('admin.logs.title')),
        description: (__VLS_unwrap(t, {})('admin.logs.description')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    {
        const { actions: __VLS_6 } = __VLS_nonNull(__VLS_3.slots);
        const __VLS_7 = StatusPill || StatusPill;
        // @ts-ignore
        const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
            // @ts-ignore
            tone: (__VLS_unwrap(statusTone, {})),
        }));
        const __VLS_9 = __VLS_8({
            tone: (__VLS_unwrap(statusTone, {})),
        }, ...__VLS_functionalComponentArgsRest(__VLS_8));
        var __VLS_10;
        const { default: __VLS_12 } = __VLS_nonNull(__VLS_10.slots);
        (__VLS_unwrap(statusLabel, {}));
        // @ts-ignore
        [t, t, statusTone, statusLabel,];
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "search",
            placeholder: (__VLS_unwrap(t, {})('admin.logs.search')),
            'aria-label': (__VLS_unwrap(t, {})('admin.logs.search')),
            ...{ class: "rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm" },
        });
        (__VLS_unwrap(search, {}));
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
            value: (__VLS_unwrap(level, {})),
            'aria-label': (__VLS_unwrap(t, {})('admin.logs.logLevel')),
            ...{ class: "rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "all",
        });
        (__VLS_unwrap(t, {})('admin.logs.all'));
        const __VLS_13 = __VLS_tryAsConstant((__VLS_unwrap(levels, {})));
        for (const [l] of __VLS_vFor(__VLS_nonNull(__VLS_13))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                key: (l),
                value: (l),
            });
            (__VLS_unwrap(t, {})(`admin.logs.${l}`));
            // @ts-ignore
            [t, t, t, t, t, search, level, levels,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    return (paused.value ? __VLS_unwrap(resume, {})() : __VLS_unwrap(pause, {})());
                    // @ts-ignore
                    [paused, resume, pause,];
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
        (paused.value ? __VLS_unwrap(t, {})('admin.logs.resume') : __VLS_unwrap(t, {})('admin.logs.pause'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_unwrap(clear, {})) },
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
        (__VLS_unwrap(t, {})('admin.logs.clear'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (download) },
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
        (__VLS_unwrap(t, {})('admin.logs.download'));
        // @ts-ignore
        [t, t, t, t, paused, clear,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
        ref: "listEl",
        ...{ class: "max-h-[32rem] divide-y divide-flixer-border overflow-y-auto font-mono text-xs" },
    });
    /** @type {__VLS_StyleScopedClasses['max-h-[32rem]']} */ ;
    /** @type {__VLS_StyleScopedClasses['divide-y']} */ ;
    /** @type {__VLS_StyleScopedClasses['divide-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    const __VLS_14 = __VLS_tryAsConstant((visible.value));
    for (const [l] of __VLS_vFor(__VLS_nonNull(__VLS_14))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
            key: (l.id),
            ...{ class: "flex flex-wrap items-center gap-3 py-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(formatTime, {})(l.time));
        const __VLS_15 = StatusPill || StatusPill;
        // @ts-ignore
        const __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
            // @ts-ignore
            tone: (tone.value[l.level]),
        }));
        const __VLS_17 = __VLS_16({
            tone: (tone.value[l.level]),
        }, ...__VLS_functionalComponentArgsRest(__VLS_16));
        var __VLS_18;
        const { default: __VLS_20 } = __VLS_nonNull(__VLS_18.slots);
        (__VLS_unwrap(t, {})(`admin.logs.${l.level}`));
        // @ts-ignore
        [t, visible, formatTime, tone,];
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-flixer-cyan" },
        });
        /** @type {__VLS_StyleScopedClasses['text-flixer-cyan']} */ ;
        (__VLS_unwrap(origin, {})(l));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "min-w-0 flex-1 whitespace-pre-wrap break-words" },
        });
        /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['whitespace-pre-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['break-words']} */ ;
        (l.message);
        if (__VLS_unwrap(detail, {})(l)) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(detail, {})(l));
        }
        // @ts-ignore
        [origin, detail, detail,];
    }
    if (visible.value.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
            ...{ class: "py-6 text-center text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['py-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.logs.empty'));
    }
    // @ts-ignore
    [t, visible,];
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
