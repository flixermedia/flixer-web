import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { getAdminActivity } from '../../api';
import AdminSection from './AdminSection.vue';
import AdminSkeleton from './AdminSkeleton.vue';
import StatusPill from './StatusPill.vue';
import { useActivityFormat } from '../../composables/useActivityFormat';
import { describeRequestError } from '../../composables/useProfile';
import { catchError } from '../../utils/catchError';
const PAGE_SIZE = 25;
const SORTS = ['recent', 'oldest', 'user', 'title'];
const TYPES = ['movie', 'episode', 'track', 'video'];
const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();
const { relativeTime, activityTitle, progressPercent } = useActivityFormat();
const single = (value) => (typeof value === 'string' ? value : '');
const filters = computed(() => ({
    search: single(route.query.search),
    user: single(route.query.user),
    type: single(route.query.type),
    status: single(route.query.status),
    from: single(route.query.from),
    to: single(route.query.to),
    sort: single(route.query.sort) || 'recent',
    page: Math.max(1, Number.parseInt(single(route.query.page), 10) || 1),
}));
const hasFilters = computed(() => Boolean(filters.value.search || filters.value.user || filters.value.type || filters.value.status || filters.value.from || filters.value.to));
const data = ref(null);
const loading = ref(true);
const error = ref('');
let requestId = 0;
async function load() {
    const current = ++requestId;
    loading.value = true;
    try {
        const [requestError, result] = await catchError(getAdminActivity({ ...filters.value, page: String(filters.value.page), pageSize: String(PAGE_SIZE) }));
        if (requestError) {
            if (current !== requestId)
                return;
            error.value = describeRequestError(requestError, t('admin.activity.loadError'));
        }
        else if (current === requestId) {
            data.value = result;
            error.value = '';
        }
    }
    finally {
        if (current === requestId)
            loading.value = false;
    }
}
// Filters live in the URL so a filtered view can be bookmarked or shared; changing one returns to the first page.
function setFilters(changes) {
    const next = {};
    for (const [key, value] of Object.entries({ ...route.query, ...('page' in changes ? {} : { page: undefined }), ...changes })) {
        const text = typeof value === 'number' ? String(value) : single(value);
        if (text !== '' && !(key === 'page' && text === '1') && !(key === 'sort' && text === 'recent'))
            next[key] = text;
    }
    void router.replace({ query: next });
}
const searchText = ref(filters.value.search);
let searchTimer;
watch(searchText, (value) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        if (value.trim() !== filters.value.search)
            setFilters({ search: value.trim() });
    }, 300);
});
watch(() => filters.value.search, (value) => {
    if (value !== searchText.value.trim())
        searchText.value = value;
});
onBeforeUnmount(() => clearTimeout(searchTimer));
watch(() => route.query, () => {
    if (route.name === 'admin-activity')
        void load();
}, { immediate: true });
function reset() {
    searchText.value = '';
    void router.replace({ query: {} });
}
const pageCount = computed(() => Math.max(1, Math.ceil((data.value?.total ?? 0) / PAGE_SIZE)));
const rangeStart = computed(() => ((data.value?.total ?? 0) === 0 ? 0 : (filters.value.page - 1) * PAGE_SIZE + 1));
const rangeEnd = computed(() => Math.min(data.value?.total ?? 0, filters.value.page * PAGE_SIZE));
const summaryCards = computed(() => [
    { label: t('admin.activity.summary.total'), value: data.value?.summary.total ?? 0 },
    { label: t('admin.activity.summary.finished'), value: data.value?.summary.finished ?? 0 },
    { label: t('admin.activity.summary.inProgress'), value: data.value?.summary.inProgress ?? 0 },
    { label: t('admin.activity.summary.users'), value: data.value?.summary.users ?? 0 },
]);
const fieldClass = 'h-10 w-full rounded border border-flixer-border bg-flixer-background px-3 text-sm text-flixer-text placeholder:text-flixer-muted focus-visible:outline-2 focus-visible:outline-flixer-accent scheme-dark';
const absoluteTime = (iso) => new Date(iso).toLocaleString(locale.value);
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(loading, {});
    __VLS_withDotValue(filters, {});
    __VLS_withDotValue(data, {});
    __VLS_withDotValue(hasFilters, {});
    __VLS_withDotValue(error, {});
    __VLS_withDotValue(rangeStart, {});
    __VLS_withDotValue(rangeEnd, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-col gap-6" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid grid-cols-2 gap-3 lg:grid-cols-4" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:grid-cols-4']} */ ;
    const __VLS_0 = __VLS_tryAsConstant((__VLS_unwrap(summaryCards, {})));
    for (const [card] of __VLS_vFor(__VLS_nonNull(__VLS_0))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (card.label),
            ...{ class: "admin-card p-5" },
        });
        /** @type {__VLS_StyleScopedClasses['admin-card']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-5']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (card.label);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-1 text-3xl font-semibold transition-opacity" },
            ...{ class: (loading.value ? 'opacity-50' : '') },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-opacity']} */ ;
        (card.value.toLocaleString(__VLS_unwrap(locale, {})));
        // @ts-ignore
        [summaryCards, loading, locale,];
    }
    const __VLS_1 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_2 = __VLS_asFunctionalComponent1(__VLS_1, new __VLS_1({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('admin.activity.title')), description: (__VLS_unwrap(t, {})('admin.activity.subtitle')),
    }));
    const __VLS_3 = __VLS_2({
        title: (__VLS_unwrap(t, {})('admin.activity.title')),
        description: (__VLS_unwrap(t, {})('admin.activity.subtitle')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_2));
    var __VLS_4;
    const { default: __VLS_6 } = __VLS_nonNull(__VLS_4.slots);
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: () => { } },
        ...{ class: "grid gap-3 sm:grid-cols-2 lg:grid-cols-6" },
        role: "search",
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:grid-cols-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "search",
        autocomplete: "off",
        placeholder: (__VLS_unwrap(t, {})('admin.activity.search')),
        'aria-label': (__VLS_unwrap(t, {})('admin.activity.search')),
        ...{ class: (__VLS_unwrap(fieldClass, {})) },
        ...{ class: "sm:col-span-2" },
    });
    (__VLS_unwrap(searchText, {}));
    /** @type {__VLS_StyleScopedClasses['sm:col-span-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (...[$event]) => {
                void $event;
                return (setFilters({ user: $event.target.value }));
                // @ts-ignore
                [t, t, t, t, fieldClass, searchText,];
            } },
        value: (filters.value.user),
        'aria-label': (__VLS_unwrap(t, {})('admin.activity.user')),
        ...{ class: (__VLS_unwrap(fieldClass, {})) },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    (__VLS_unwrap(t, {})('admin.activity.allUsers'));
    const __VLS_7 = __VLS_tryAsConstant((data.value?.users ?? []));
    for (const [user] of __VLS_vFor(__VLS_nonNull(__VLS_7))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (user.id),
            value: (user.id),
        });
        (user.name);
        // @ts-ignore
        [t, t, fieldClass, filters, data,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (...[$event]) => {
                void $event;
                return (setFilters({ type: $event.target.value }));
                // @ts-ignore
                [];
            } },
        value: (filters.value.type),
        'aria-label': (__VLS_unwrap(t, {})('admin.activity.type.label')),
        ...{ class: (__VLS_unwrap(fieldClass, {})) },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    (__VLS_unwrap(t, {})('admin.activity.type.all'));
    const __VLS_8 = __VLS_tryAsConstant((__VLS_unwrap(TYPES, {})));
    for (const [type] of __VLS_vFor(__VLS_nonNull(__VLS_8))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (type),
            value: (type),
        });
        (__VLS_unwrap(t, {})(`admin.activity.type.${type}`));
        // @ts-ignore
        [t, t, t, fieldClass, filters, TYPES,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (...[$event]) => {
                void $event;
                return (setFilters({ status: $event.target.value }));
                // @ts-ignore
                [];
            } },
        value: (filters.value.status),
        'aria-label': (__VLS_unwrap(t, {})('admin.activity.status.label')),
        ...{ class: (__VLS_unwrap(fieldClass, {})) },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    (__VLS_unwrap(t, {})('admin.activity.status.all'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "finished",
    });
    (__VLS_unwrap(t, {})('admin.activity.status.finished'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "in_progress",
    });
    (__VLS_unwrap(t, {})('admin.activity.status.inProgress'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (...[$event]) => {
                void $event;
                return (setFilters({ sort: $event.target.value }));
                // @ts-ignore
                [t, t, t, t, fieldClass, filters,];
            } },
        value: (filters.value.sort),
        'aria-label': (__VLS_unwrap(t, {})('admin.activity.sort.label')),
        ...{ class: (__VLS_unwrap(fieldClass, {})) },
    });
    const __VLS_9 = __VLS_tryAsConstant((__VLS_unwrap(SORTS, {})));
    for (const [sort] of __VLS_vFor(__VLS_nonNull(__VLS_9))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (sort),
            value: (sort),
        });
        (__VLS_unwrap(t, {})(`admin.activity.sort.${sort}`));
        // @ts-ignore
        [t, t, fieldClass, filters, SORTS,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "flex items-center gap-2 text-xs text-flixer-muted sm:col-span-1 lg:col-span-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:col-span-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:col-span-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "shrink-0" },
    });
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    (__VLS_unwrap(t, {})('admin.activity.from'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (...[$event]) => {
                void $event;
                return (setFilters({ from: $event.target.value }));
                // @ts-ignore
                [t,];
            } },
        type: "date",
        value: (filters.value.from),
        max: (filters.value.to || undefined),
        ...{ class: (__VLS_unwrap(fieldClass, {})) },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "flex items-center gap-2 text-xs text-flixer-muted sm:col-span-1 lg:col-span-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:col-span-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:col-span-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "shrink-0" },
    });
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    (__VLS_unwrap(t, {})('admin.activity.to'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (...[$event]) => {
                void $event;
                return (setFilters({ to: $event.target.value }));
                // @ts-ignore
                [t, fieldClass, filters, filters,];
            } },
        type: "date",
        value: (filters.value.to),
        min: (filters.value.from || undefined),
        ...{ class: (__VLS_unwrap(fieldClass, {})) },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-center sm:col-span-2 lg:col-span-2 lg:justify-end" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:col-span-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:col-span-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:justify-end']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (reset) },
        type: "button",
        disabled: (!hasFilters.value),
        ...{ class: "h-10 rounded border border-flixer-border px-4 text-sm font-semibold transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40" },
    });
    /** @type {__VLS_StyleScopedClasses['h-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-white/5']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled:cursor-not-allowed']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled:opacity-40']} */ ;
    (__VLS_unwrap(t, {})('admin.activity.reset'));
    if (loading.value && !data.value) {
        const __VLS_10 = AdminSkeleton;
        // @ts-ignore
        const __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({
            // @ts-ignore
            variant: "table", ...{ class: "mt-4" },
        }));
        const __VLS_12 = __VLS_11({
            variant: "table",
            ...{ class: "mt-4" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_11));
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    }
    if (error.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            role: "alert",
            ...{ class: "mt-4 rounded border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-red-400/30']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-red-500/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-200']} */ ;
        (error.value);
    }
    if (data.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-4 overflow-hidden rounded border border-flixer-border" },
            'aria-busy': (loading.value),
        });
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "hidden grid-cols-[12rem_1fr_6rem_12rem_9rem] gap-4 border-b border-flixer-border px-5 py-3 text-xs font-semibold uppercase tracking-wide text-flixer-muted md:grid" },
        });
        /** @type {__VLS_StyleScopedClasses['hidden']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid-cols-[12rem_1fr_6rem_12rem_9rem]']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:grid']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_unwrap(t, {})('admin.activity.columns.user'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_unwrap(t, {})('admin.activity.columns.title'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_unwrap(t, {})('admin.activity.columns.type'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_unwrap(t, {})('admin.activity.columns.progress'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-right" },
        });
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        (__VLS_unwrap(t, {})('admin.activity.columns.when'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
            ...{ class: "divide-y divide-flixer-border transition-opacity" },
            ...{ class: (loading.value && data.value ? 'opacity-50' : '') },
        });
        /** @type {__VLS_StyleScopedClasses['divide-y']} */ ;
        /** @type {__VLS_StyleScopedClasses['divide-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-opacity']} */ ;
        const __VLS_15 = __VLS_tryAsConstant((data.value?.items ?? []));
        for (const [entry, i] of __VLS_vFor(__VLS_nonNull(__VLS_15))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                key: (`${entry.at}-${i}`),
                ...{ class: "grid gap-x-4 gap-y-2 px-5 py-4 text-sm md:grid-cols-[12rem_1fr_6rem_12rem_9rem] md:items-center" },
            });
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-x-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-y-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-5']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['md:grid-cols-[12rem_1fr_6rem_12rem_9rem]']} */ ;
            /** @type {__VLS_StyleScopedClasses['md:items-center']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "truncate font-semibold" },
            });
            /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            (entry.user);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "min-w-0 truncate text-flixer-text/90" },
                title: (__VLS_unwrap(activityTitle, {})(entry)),
            });
            /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-text/90']} */ ;
            (__VLS_unwrap(activityTitle, {})(entry));
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})(`admin.activity.type.${entry.type}`));
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "flex items-center gap-3" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            if (entry.completed) {
                const __VLS_16 = StatusPill || StatusPill;
                // @ts-ignore
                const __VLS_17 = __VLS_asFunctionalComponent1(__VLS_16, new __VLS_16({
                    // @ts-ignore
                    tone: "good",
                }));
                const __VLS_18 = __VLS_17({
                    tone: "good",
                }, ...__VLS_functionalComponentArgsRest(__VLS_17));
                var __VLS_19;
                const { default: __VLS_21 } = __VLS_nonNull(__VLS_19.slots);
                (__VLS_unwrap(t, {})('admin.activity.status.finished'));
                // @ts-ignore
                [loading, loading, loading, t, t, t, t, t, t, t, t, fieldClass, filters, filters, data, data, data, data, hasFilters, error, error, activityTitle, activityTitle,];
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "h-1.5 w-24 shrink-0 overflow-hidden rounded bg-white/10" },
                    role: "progressbar",
                    'aria-valuenow': (__VLS_unwrap(progressPercent, {})(entry)),
                    'aria-valuemin': "0",
                    'aria-valuemax': "100",
                });
                /** @type {__VLS_StyleScopedClasses['h-1.5']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-24']} */ ;
                /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "block h-full rounded bg-linear-to-r from-flixer-primary to-flixer-cyan" },
                    ...{ style: ({ width: `${__VLS_unwrap(progressPercent, {})(entry)}%` }) },
                });
                /** @type {__VLS_StyleScopedClasses['block']} */ ;
                /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-linear-to-r']} */ ;
                /** @type {__VLS_StyleScopedClasses['from-flixer-primary']} */ ;
                /** @type {__VLS_StyleScopedClasses['to-flixer-cyan']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "text-xs text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (__VLS_unwrap(progressPercent, {})(entry));
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-xs text-flixer-muted md:text-right" },
                title: (__VLS_unwrap(absoluteTime, {})(entry.at)),
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            /** @type {__VLS_StyleScopedClasses['md:text-right']} */ ;
            (__VLS_unwrap(relativeTime, {})(entry.at));
            // @ts-ignore
            [progressPercent, progressPercent, progressPercent, absoluteTime, relativeTime,];
        }
        if (!loading.value && (data.value?.items.length ?? 0) === 0 && !error.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                ...{ class: "px-5 py-12 text-center text-sm text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['px-5']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-12']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (hasFilters.value ? __VLS_unwrap(t, {})('admin.activity.noMatches') : __VLS_unwrap(t, {})('admin.overview.noActivity'));
        }
    }
    if (data.value && data.value.total > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.nav, __VLS_intrinsics.nav)({
            ...{ class: "mt-4 flex flex-wrap items-center justify-between gap-3 text-sm" },
            'aria-label': (__VLS_unwrap(t, {})('admin.activity.pagination')),
        });
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.activity.range', { from: rangeStart.value.toLocaleString(__VLS_unwrap(locale, {})), to: rangeEnd.value.toLocaleString(__VLS_unwrap(locale, {})), total: data.value.total.toLocaleString(__VLS_unwrap(locale, {})) }));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex items-center gap-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!(data.value && data.value.total > 0))
                        throw 0;
                    return (setFilters({ page: filters.value.page - 1 }));
                    // @ts-ignore
                    [loading, locale, locale, locale, t, t, t, t, filters, data, data, data, data, hasFilters, error, rangeStart, rangeEnd,];
                } },
            type: "button",
            disabled: (filters.value.page <= 1),
            ...{ class: "h-10 rounded border border-flixer-border px-4 font-semibold transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40" },
        });
        /** @type {__VLS_StyleScopedClasses['h-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/5']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:cursor-not-allowed']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-40']} */ ;
        (__VLS_unwrap(t, {})('admin.activity.previous'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "px-2 text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.activity.pageOf', { page: filters.value.page, pages: __VLS_unwrap(pageCount, {}) }));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!(data.value && data.value.total > 0))
                        throw 0;
                    return (setFilters({ page: filters.value.page + 1 }));
                    // @ts-ignore
                    [t, t, filters, filters, filters, pageCount,];
                } },
            type: "button",
            disabled: (filters.value.page >= __VLS_unwrap(pageCount, {})),
            ...{ class: "h-10 rounded border border-flixer-border px-4 font-semibold transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40" },
        });
        /** @type {__VLS_StyleScopedClasses['h-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/5']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:cursor-not-allowed']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-40']} */ ;
        (__VLS_unwrap(t, {})('admin.activity.next'));
    }
    // @ts-ignore
    [t, filters, pageCount,];
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
