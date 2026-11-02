import { openModal } from '@kolirt/vue-modal';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { approveMediaRequest, declineMediaRequest, deleteMediaRequest, listMediaRequests, retryMediaRequest } from '../api';
import { notify } from '../composables/notify';
import { describeRequestError } from '../composables/useProfile';
import { useProfile } from '../composables/useProfile';
import { useRequestsConfig } from '../composables/useRequestsConfig';
import { useSignOut } from '../composables/useSignOut';
import DeclineRequestModal from '../components/DeclineRequestModal.vue';
import Header from '../components/header/Header.vue';
import MobileTabBar from '../components/home/MobileTabBar.vue';
import { getMobileTabs, getNavLinks } from '../composables/homeNav';
import { catchError } from '../utils/catchError';
const { t } = useI18n();
const { isSigningOut, signOut } = useSignOut();
const config = useRequestsConfig();
const { profile } = useProfile();
const navLinks = computed(getNavLinks);
const tabs = computed(getMobileTabs);
const isAdmin = ref(false);
const scope = ref('mine');
const status = ref('');
const type = ref('');
const rows = ref([]);
const total = ref(0);
const counts = ref({ pending: 0, approved: 0, declined: 0, failed: 0, available: 0 });
const busy = ref(false);
const limit = 24;
const offset = ref(0);
async function load(append = false) {
    busy.value = true;
    try {
        const [error, result] = await catchError(listMediaRequests({ scope: scope.value, status: status.value || undefined, type: type.value || undefined, offset: append ? offset.value : 0, limit }));
        if (error) {
            notify.error(describeRequestError(error, t('requests.loadError')));
            return;
        }
        rows.value = append ? [...rows.value, ...result.items] : result.items;
        total.value = result.total;
        counts.value = {
            pending: result.counts.pending ?? 0,
            approved: result.counts.approved ?? 0,
            declined: result.counts.declined ?? 0,
            failed: result.counts.failed ?? 0,
            available: result.counts.available ?? 0,
        };
        offset.value = rows.value.length;
    }
    finally {
        busy.value = false;
    }
}
async function action(row, kind) {
    let reason;
    if (kind === 'decline') {
        const answer = await openModal(DeclineRequestModal, { props: { title: row.title } }).catch(() => null);
        if (answer === null)
            return;
        reason = answer || undefined;
    }
    const operation = kind === 'approve' ? approveMediaRequest(row.id).then(() => undefined) :
        kind === 'decline' ? declineMediaRequest(row.id, reason).then(() => undefined) :
            kind === 'retry' ? retryMediaRequest(row.id).then(() => undefined) :
                deleteMediaRequest(row.id).then(() => undefined);
    const [error] = await catchError(operation);
    if (error) {
        notify.error(describeRequestError(error, t('requests.actionError')));
        return;
    }
    await load();
}
onMounted(async () => {
    await config.load();
    isAdmin.value = config.config.value?.isAdmin ?? profile.value?.role === 'admin';
    scope.value = isAdmin.value ? 'all' : 'mine';
    await load();
});
watch([scope, status, type], () => {
    void load();
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(isAdmin, {});
    __VLS_withDotValue(scope, {});
    __VLS_withDotValue(status, {});
    __VLS_withDotValue(counts, {});
    __VLS_withDotValue(busy, {});
    __VLS_withDotValue(rows, {});
    void {};
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "min-h-screen overflow-x-hidden bg-flixer-background pb-28 pt-24 text-flixer-text md:pb-12 md:pt-28" },
    });
    /** @type {__VLS_StyleScopedClasses['min-h-screen']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-x-hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
    /** @type {__VLS_StyleScopedClasses['pb-28']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-24']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:pb-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:pt-28']} */ ;
    const __VLS_0 = Header;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        ...{ 'onLogout': {} }, links: (__VLS_unwrap(navLinks, {})), isSigningOut: (__VLS_unwrap(isSigningOut, {})),
    }));
    const __VLS_2 = __VLS_1({
        ...{ 'onLogout': {} },
        links: (__VLS_unwrap(navLinks, {})),
        isSigningOut: (__VLS_unwrap(isSigningOut, {})),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    let __VLS_5;
    const __VLS_6 = {
        /** @type {typeof __VLS_5.logout} */
        onLogout: (__VLS_unwrap(signOut, {})),
    };
    void __VLS_6;
    var __VLS_3;
    var __VLS_4;
    __VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({
        ...{ class: "page-gutter mx-auto max-w-6xl" },
    });
    /** @type {__VLS_StyleScopedClasses['page-gutter']} */ ;
    /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-6xl']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
        ...{ class: "flex flex-wrap items-end justify-between gap-4 border-b border-flixer-border pb-5" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-end']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['pb-5']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs font-semibold uppercase tracking-[0.2em] text-flixer-accent" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-[0.2em]']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
    (__VLS_unwrap(t, {})('requests.title'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
        ...{ class: "mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-tight']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:text-4xl']} */ ;
    (isAdmin.value && scope.value === 'all' ? __VLS_unwrap(t, {})('requests.scope.all') : __VLS_unwrap(t, {})('requests.scope.mine'));
    if (isAdmin.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "inline-flex rounded border border-flixer-border bg-flixer-surface/70 p-1" },
            role: "group",
            'aria-label': (__VLS_unwrap(t, {})('requests.title')),
        });
        /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/70']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-1']} */ ;
        const __VLS_7 = __VLS_tryAsConstant(['all', 'mine']);
        for (const [tab] of __VLS_vFor(__VLS_nonNull(__VLS_7))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!(isAdmin.value))
                            throw 0;
                        return (scope.value = tab);
                        // @ts-ignore
                        [navLinks, isSigningOut, signOut, t, t, t, t, isAdmin, isAdmin, scope, scope,];
                    } },
                key: (tab),
                type: "button",
                ...{ class: "rounded px-3 py-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent sm:px-4 sm:text-sm" },
                ...{ class: (scope.value === tab ? 'bg-white text-flixer-background shadow' : 'text-flixer-muted hover:text-white') },
                'aria-pressed': (scope.value === tab),
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
            /** @type {__VLS_StyleScopedClasses['sm:px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['sm:text-sm']} */ ;
            (__VLS_unwrap(t, {})(`requests.scope.${tab}`));
            // @ts-ignore
            [t, scope, scope,];
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:flex-row']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:justify-between']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" },
        role: "group",
        'aria-label': (__VLS_unwrap(t, {})('requests.allStatuses')),
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-x-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['pb-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['[scrollbar-width:none]']} */ ;
    /** @type {__VLS_StyleScopedClasses['[&::-webkit-scrollbar]:hidden']} */ ;
    const __VLS_8 = __VLS_tryAsConstant(['', 'pending', 'approved', 'declined', 'failed', 'available']);
    for (const [entry] of __VLS_vFor(__VLS_nonNull(__VLS_8))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    return (status.value = entry);
                    // @ts-ignore
                    [t, status,];
                } },
            key: (entry),
            type: "button",
            ...{ class: "inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" },
            ...{ class: (status.value === entry ? 'border-white bg-white text-flixer-background' : 'border-flixer-border bg-flixer-surface/50 text-flixer-muted hover:border-white/30 hover:text-white') },
            'aria-pressed': (status.value === entry),
        });
        /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-offset-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (entry ? __VLS_unwrap(t, {})(`requests.status.${entry}`) : __VLS_unwrap(t, {})('requests.allStatuses'));
        if (entry) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "rounded-full px-1.5 py-0.5 text-[10px]" },
                ...{ class: (status.value === entry ? 'bg-black/10' : 'bg-white/10') },
            });
            /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-1.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
            (counts.value[entry]);
        }
        // @ts-ignore
        [t, t, status, status, status, counts,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "sr-only" },
        for: "request-type-filter",
    });
    /** @type {__VLS_StyleScopedClasses['sr-only']} */ ;
    (__VLS_unwrap(t, {})('requests.allTypes'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        id: "request-type-filter",
        value: (__VLS_unwrap(type, {})),
        ...{ class: "w-full rounded border border-flixer-border bg-flixer-surface px-3 py-2.5 text-sm text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent sm:w-44" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:w-44']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    (__VLS_unwrap(t, {})('requests.allTypes'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "movie",
    });
    (__VLS_unwrap(t, {})('home.itemType.movie'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "tv",
    });
    (__VLS_unwrap(t, {})('home.itemType.series'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "music",
    });
    (__VLS_unwrap(t, {})('home.itemType.album'));
    if (busy.value && !rows.value.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-6 space-y-3" },
            role: "status",
            'aria-label': (__VLS_unwrap(t, {})('common.loading')),
        });
        /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
        const __VLS_9 = __VLS_tryAsConstant((5));
        for (const [n] of __VLS_vFor(__VLS_nonNull(__VLS_9))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (n),
                ...{ class: "flex animate-pulse items-center gap-4 rounded border border-flixer-border bg-flixer-surface/50 p-3 sm:p-4" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/50']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['sm:p-4']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
                ...{ class: "h-20 w-14 shrink-0 rounded bg-white/[0.08]" },
            });
            /** @type {__VLS_StyleScopedClasses['h-20']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-14']} */ ;
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white/[0.08]']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "min-w-0 flex-1 space-y-3" },
            });
            /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
                ...{ class: "h-4 w-2/5 rounded bg-white/[0.08]" },
            });
            /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-2/5']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white/[0.08]']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
                ...{ class: "h-3 w-1/3 rounded bg-white/[0.06]" },
            });
            /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-1/3']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white/[0.06]']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
                ...{ class: "hidden h-8 w-28 rounded bg-white/[0.06] sm:block" },
            });
            /** @type {__VLS_StyleScopedClasses['hidden']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-8']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-28']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white/[0.06]']} */ ;
            /** @type {__VLS_StyleScopedClasses['sm:block']} */ ;
            // @ts-ignore
            [t, t, t, t, t, t, type, busy, rows,];
        }
    }
    else if (rows.value.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
            ...{ class: "mt-6 space-y-3" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
        const __VLS_10 = __VLS_tryAsConstant((rows.value));
        for (const [row] of __VLS_vFor(__VLS_nonNull(__VLS_10))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                key: (row.id),
                ...{ class: "group rounded border border-flixer-border bg-flixer-surface/50 p-3 transition hover:border-white/20 hover:bg-flixer-surface/80 sm:p-4" },
            });
            /** @type {__VLS_StyleScopedClasses['group']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/50']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:border-white/20']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-flixer-surface/80']} */ ;
            /** @type {__VLS_StyleScopedClasses['sm:p-4']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex flex-wrap items-center gap-3 sm:gap-4" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['sm:gap-4']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "relative h-20 w-14 shrink-0 overflow-hidden rounded border border-white/10 bg-flixer-background sm:h-24 sm:w-16" },
            });
            /** @type {__VLS_StyleScopedClasses['relative']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-20']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-14']} */ ;
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
            /** @type {__VLS_StyleScopedClasses['sm:h-24']} */ ;
            /** @type {__VLS_StyleScopedClasses['sm:w-16']} */ ;
            if (row.poster) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
                    src: (row.poster),
                    loading: "lazy",
                    alt: (row.title),
                    ...{ class: "size-full object-cover" },
                });
                /** @type {__VLS_StyleScopedClasses['size-full']} */ ;
                /** @type {__VLS_StyleScopedClasses['object-cover']} */ ;
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "grid size-full place-items-center p-1 text-center text-[10px] text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['grid']} */ ;
                /** @type {__VLS_StyleScopedClasses['size-full']} */ ;
                /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['p-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (row.title);
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.span)({
                ...{ class: "absolute inset-x-0 bottom-0 h-1" },
                ...{ class: (row.status === 'available' ? 'bg-emerald-400' : row.status === 'failed' || row.status === 'declined' ? 'bg-red-400' : row.status === 'approved' ? 'bg-flixer-accent' : 'bg-amber-300') },
            });
            /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
            /** @type {__VLS_StyleScopedClasses['inset-x-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['bottom-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-1']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "min-w-0 flex-1" },
            });
            /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex flex-wrap items-center gap-2" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
                ...{ class: "truncate text-sm font-semibold text-white sm:text-base" },
            });
            /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['sm:text-base']} */ ;
            (row.title);
            if (row.year) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "font-normal text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['font-normal']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (row.year);
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold text-white/80" },
            });
            /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white/[0.06]']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-2.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white/80']} */ ;
            (__VLS_unwrap(t, {})(`requests.status.${row.status}`));
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mt-1.5 truncate text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-1.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})(`home.itemType.${row.type === 'tv' ? 'series' : row.type === 'music' ? 'album' : 'movie'}`));
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                'aria-hidden': "true",
            });
            (row.serviceName || __VLS_unwrap(t, {})('requests.noService'));
            if (isAdmin.value) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    'aria-hidden': "true",
                });
                (row.requestedBy.displayName || row.requestedBy.username);
            }
            if (row.declineReason || row.error) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "mt-1 line-clamp-2 text-xs text-red-300" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['line-clamp-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
                (row.declineReason || row.error);
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end" },
                role: "group",
                'aria-label': (row.title),
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['sm:w-auto']} */ ;
            /** @type {__VLS_StyleScopedClasses['sm:justify-end']} */ ;
            if (isAdmin.value && scope.value === 'all') {
                if (row.status === 'pending') {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                void $event;
                                if (!!(busy.value && !rows.value.length))
                                    throw 0;
                                if (!(rows.value.length))
                                    throw 0;
                                if (!(isAdmin.value && scope.value === 'all'))
                                    throw 0;
                                if (!(row.status === 'pending'))
                                    throw 0;
                                return (action(row, 'approve'));
                                // @ts-ignore
                                [t, t, t, isAdmin, isAdmin, scope, rows, rows,];
                            } },
                        type: "button",
                        ...{ class: "rounded bg-flixer-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
                    });
                    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                    /** @type {__VLS_StyleScopedClasses['bg-flixer-primary']} */ ;
                    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
                    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                    /** @type {__VLS_StyleScopedClasses['hover:bg-flixer-primary/80']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
                    (__VLS_unwrap(t, {})('requests.actions.approve'));
                }
                if (row.status === 'pending') {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                void $event;
                                if (!!(busy.value && !rows.value.length))
                                    throw 0;
                                if (!(rows.value.length))
                                    throw 0;
                                if (!(isAdmin.value && scope.value === 'all'))
                                    throw 0;
                                if (!(row.status === 'pending'))
                                    throw 0;
                                return (action(row, 'decline'));
                                // @ts-ignore
                                [t,];
                            } },
                        type: "button",
                        ...{ class: "rounded border border-white/15 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
                    });
                    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                    /** @type {__VLS_StyleScopedClasses['border']} */ ;
                    /** @type {__VLS_StyleScopedClasses['border-white/15']} */ ;
                    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
                    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                    /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
                    (__VLS_unwrap(t, {})('requests.actions.decline'));
                }
                if (row.status === 'failed') {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                void $event;
                                if (!!(busy.value && !rows.value.length))
                                    throw 0;
                                if (!(rows.value.length))
                                    throw 0;
                                if (!(isAdmin.value && scope.value === 'all'))
                                    throw 0;
                                if (!(row.status === 'failed'))
                                    throw 0;
                                return (action(row, 'retry'));
                                // @ts-ignore
                                [t,];
                            } },
                        type: "button",
                        ...{ class: "rounded border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs font-semibold text-amber-100 transition hover:bg-amber-300/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
                    });
                    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                    /** @type {__VLS_StyleScopedClasses['border']} */ ;
                    /** @type {__VLS_StyleScopedClasses['border-amber-300/30']} */ ;
                    /** @type {__VLS_StyleScopedClasses['bg-amber-300/10']} */ ;
                    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
                    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-amber-100']} */ ;
                    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                    /** @type {__VLS_StyleScopedClasses['hover:bg-amber-300/20']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
                    (__VLS_unwrap(t, {})('requests.actions.retry'));
                }
            }
            if (row.status === 'pending' || isAdmin.value) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!!(busy.value && !rows.value.length))
                                throw 0;
                            if (!(rows.value.length))
                                throw 0;
                            if (!(row.status === 'pending' || isAdmin.value))
                                throw 0;
                            return (action(row, 'delete'));
                            // @ts-ignore
                            [t, isAdmin,];
                        } },
                    type: "button",
                    ...{ class: "rounded border border-white/10 px-3 py-2 text-xs font-medium text-flixer-muted transition hover:border-red-300/30 hover:text-red-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
                });
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['border']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:border-red-300/30']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:text-red-200']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
                (__VLS_unwrap(t, {})('requests.actions.delete'));
            }
            // @ts-ignore
            [t,];
        }
    }
    else if (!busy.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-8 rounded border border-dashed border-flixer-border bg-flixer-surface/30 px-5 py-14 text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-8']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-dashed']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/30']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-14']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mx-auto grid size-12 place-items-center rounded-full bg-white/[0.06] text-flixer-muted" },
            'aria-hidden': "true",
        });
        /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-12']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/[0.06]']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        let __VLS_11;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11({
            // @ts-ignore
            icon: "lucide:clipboard-list", ...{ class: "size-6" }, 'aria-hidden': "true",
        }));
        const __VLS_13 = __VLS_12({
            icon: "lucide:clipboard-list",
            ...{ class: "size-6" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_12));
        /** @type {__VLS_StyleScopedClasses['size-6']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-4 text-sm font-medium text-white" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        (__VLS_unwrap(t, {})('requests.empty'));
    }
    if (rows.value.length < __VLS_unwrap(total, {})) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-6 flex justify-center" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!(rows.value.length < __VLS_unwrap(total, {})))
                        throw 0;
                    return (load(true));
                    // @ts-ignore
                    [t, busy, rows, total,];
                } },
            type: "button",
            ...{ class: "rounded border border-flixer-border bg-flixer-surface px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent disabled:opacity-50" },
            disabled: (busy.value),
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
        (busy.value ? __VLS_unwrap(t, {})('common.loading') : __VLS_unwrap(t, {})('requests.loadMore'));
    }
    const __VLS_16 = MobileTabBar;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent1(__VLS_16, new __VLS_16({
        // @ts-ignore
        tabs: (__VLS_unwrap(tabs, {})),
    }));
    const __VLS_18 = __VLS_17({
        tabs: (__VLS_unwrap(tabs, {})),
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    // @ts-ignore
    [t, t, busy, busy, tabs,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
