import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, useRoute } from 'vue-router';
import { createMediaRequest, deleteMediaRequest, getExternalMediaDetail, listRequestServices } from '../api';
import { describeRequestError, useProfile } from '../composables/useProfile';
import { notify } from '../composables/notify';
import { useRequestsConfig } from '../composables/useRequestsConfig';
import { useSignOut } from '../composables/useSignOut';
import ClampedText from '../components/ui/ClampedText.vue';
import Header from '../components/header/Header.vue';
import Skeleton from '../components/ui/Skeleton.vue';
import { getNavLinks } from '../composables/homeNav';
import { catchError } from '../utils/catchError';
const { t } = useI18n();
const route = useRoute();
const { isSigningOut, signOut } = useSignOut();
const config = useRequestsConfig();
const navLinks = computed(getNavLinks);
const { profile, load: loadProfile } = useProfile();
const detail = ref(null);
const loading = ref(true);
const submitting = ref(false);
const ownRequest = ref(null);
const selectedSeasons = ref([]);
const services = ref([]);
const serviceId = ref('');
const rootFolder = ref('');
const type = computed(() => route.params.type);
const id = computed(() => String(route.params.id));
const tv = computed(() => type.value === 'tv');
const selectedAll = computed(() => detail.value?.seasons?.every((season) => season.status === 'none' || selectedSeasons.value.includes(season.number)) ?? false);
const requestAllowed = computed(() => config.config.value?.enabled && config.config.value?.canRequest && (config.config.value?.quota.remaining === null || (config.config.value?.quota.remaining ?? 0) > 0));
const activeStatus = computed(() => ownRequest.value?.status ?? detail.value?.status ?? 'none');
async function load() {
    loading.value = true;
    try {
        const requestedType = type.value;
        if (!['movie', 'tv', 'music'].includes(requestedType)) {
            notify.error(describeRequestError(new Error('Invalid media type'), t('requests.detailError')));
            return;
        }
        const [error, value] = await catchError(getExternalMediaDetail(requestedType, id.value));
        if (error) {
            notify.error(describeRequestError(error, t('requests.detailError')));
            return;
        }
        detail.value = value;
        ownRequest.value = detail.value.requests.find((entry) => (entry.requestedBy.id === profile.value?.id || entry.id === detail.value?.requestId) && entry.status !== 'declined') ?? null;
        selectedSeasons.value = (detail.value.seasons ?? []).filter((season) => season.status === 'none').map((season) => season.number);
    }
    finally {
        loading.value = false;
    }
}
function toggleAll(checked) {
    selectedSeasons.value = checked ? (detail.value?.seasons ?? []).filter((season) => season.status === 'none').map((season) => season.number) : [];
}
async function submit() {
    if (!detail.value || !requestAllowed.value || submitting.value)
        return;
    submitting.value = true;
    try {
        const [error, request] = await catchError(createMediaRequest({ type: type.value, externalId: id.value, ...(tv.value && !selectedAll.value ? { seasons: selectedSeasons.value } : {}), ...(serviceId.value ? { serviceId: serviceId.value } : {}), ...(rootFolder.value.trim() ? { rootFolder: rootFolder.value.trim() } : {}) }));
        if (error) {
            notify.error(describeRequestError(error, t('requests.actionError')));
            return;
        }
        ownRequest.value = request;
        notify.success(t('requests.requested'));
        await config.refresh();
    }
    finally {
        submitting.value = false;
    }
}
async function cancelRequest() {
    if (!ownRequest.value)
        return;
    const [error] = await catchError(deleteMediaRequest(ownRequest.value.id));
    if (error) {
        notify.error(describeRequestError(error, t('requests.actionError')));
        return;
    }
    ownRequest.value = null;
    await load();
    await config.refresh();
}
onMounted(async () => {
    await Promise.all([config.load(), loadProfile()]);
    await load();
    if (config.config.value?.isAdmin)
        services.value = await listRequestServices().catch(() => []);
});
watch(() => [route.params.type, route.params.id], () => {
    void load();
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(loading, {});
    __VLS_withDotValue(detail, {});
    __VLS_withDotValue(requestAllowed, {});
    __VLS_withDotValue(activeStatus, {});
    __VLS_withDotValue(config, {});
    __VLS_withDotValue(submitting, {});
    __VLS_withDotValue(tv, {});
    __VLS_withDotValue(selectedSeasons, {});
    __VLS_withDotValue(ownRequest, {});
    __VLS_withDotValue(services, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "min-h-screen overflow-x-hidden bg-flixer-background pb-24 font-sans text-flixer-text md:pb-12" },
    });
    /** @type {__VLS_StyleScopedClasses['min-h-screen']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-x-hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
    /** @type {__VLS_StyleScopedClasses['pb-24']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-sans']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:pb-12']} */ ;
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
    if (loading.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({
            ...{ class: "page-gutter pt-32" },
            role: "status",
            'aria-label': (__VLS_unwrap(t, {})('common.loading')),
            'aria-busy': "true",
        });
        /** @type {__VLS_StyleScopedClasses['page-gutter']} */ ;
        /** @type {__VLS_StyleScopedClasses['pt-32']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex flex-col gap-6 sm:flex-row" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:flex-row']} */ ;
        const __VLS_7 = Skeleton;
        // @ts-ignore
        const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
            // @ts-ignore
            ...{ class: "aspect-[2/3] w-40 shrink-0 rounded sm:w-56" },
        }));
        const __VLS_9 = __VLS_8({
            ...{ class: "aspect-[2/3] w-40 shrink-0 rounded sm:w-56" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_8));
        /** @type {__VLS_StyleScopedClasses['aspect-[2/3]']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-40']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:w-56']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "min-w-0 flex-1 space-y-3" },
        });
        /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
        const __VLS_12 = Skeleton;
        // @ts-ignore
        const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
            // @ts-ignore
            ...{ class: "h-9 w-2/3" },
        }));
        const __VLS_14 = __VLS_13({
            ...{ class: "h-9 w-2/3" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_13));
        /** @type {__VLS_StyleScopedClasses['h-9']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-2/3']} */ ;
        const __VLS_17 = Skeleton;
        // @ts-ignore
        const __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({
            // @ts-ignore
            ...{ class: "h-4 w-1/3" },
        }));
        const __VLS_19 = __VLS_18({
            ...{ class: "h-4 w-1/3" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_18));
        /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-1/3']} */ ;
        const __VLS_22 = Skeleton;
        // @ts-ignore
        const __VLS_23 = __VLS_asFunctionalComponent1(__VLS_22, new __VLS_22({
            // @ts-ignore
            ...{ class: "mt-4 h-4 w-full" },
        }));
        const __VLS_24 = __VLS_23({
            ...{ class: "mt-4 h-4 w-full" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_23));
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        const __VLS_27 = Skeleton;
        // @ts-ignore
        const __VLS_28 = __VLS_asFunctionalComponent1(__VLS_27, new __VLS_27({
            // @ts-ignore
            ...{ class: "h-4 w-full" },
        }));
        const __VLS_29 = __VLS_28({
            ...{ class: "h-4 w-full" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_28));
        /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        const __VLS_32 = Skeleton;
        // @ts-ignore
        const __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({
            // @ts-ignore
            ...{ class: "h-4 w-4/5" },
        }));
        const __VLS_34 = __VLS_33({
            ...{ class: "h-4 w-4/5" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_33));
        /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-4/5']} */ ;
        const __VLS_37 = Skeleton;
        // @ts-ignore
        const __VLS_38 = __VLS_asFunctionalComponent1(__VLS_37, new __VLS_37({
            // @ts-ignore
            ...{ class: "mt-4 h-11 w-36 rounded" },
        }));
        const __VLS_39 = __VLS_38({
            ...{ class: "mt-4 h-11 w-36 rounded" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_38));
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-11']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-36']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    }
    else if (detail.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "relative overflow-hidden" },
            'aria-label': (detail.value.title),
        });
        /** @type {__VLS_StyleScopedClasses['relative']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
        if (detail.value.backdrop) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "absolute inset-0" },
            });
            /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
            /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
                src: (detail.value.backdrop),
                alt: "",
                ...{ class: "size-full object-cover object-top" },
            });
            /** @type {__VLS_StyleScopedClasses['size-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['object-cover']} */ ;
            /** @type {__VLS_StyleScopedClasses['object-top']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "absolute inset-0 bg-gradient-to-t from-flixer-background via-flixer-background/70 to-flixer-background/30" },
        });
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-gradient-to-t']} */ ;
        /** @type {__VLS_StyleScopedClasses['from-flixer-background']} */ ;
        /** @type {__VLS_StyleScopedClasses['via-flixer-background/70']} */ ;
        /** @type {__VLS_StyleScopedClasses['to-flixer-background/30']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "absolute inset-0 bg-gradient-to-r from-flixer-background/90 via-flixer-background/40 to-transparent" },
        });
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-gradient-to-r']} */ ;
        /** @type {__VLS_StyleScopedClasses['from-flixer-background/90']} */ ;
        /** @type {__VLS_StyleScopedClasses['via-flixer-background/40']} */ ;
        /** @type {__VLS_StyleScopedClasses['to-transparent']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "relative page-gutter flex flex-col gap-8 pb-10 pt-32 sm:flex-row sm:items-end sm:pt-44" },
        });
        /** @type {__VLS_StyleScopedClasses['relative']} */ ;
        /** @type {__VLS_StyleScopedClasses['page-gutter']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-8']} */ ;
        /** @type {__VLS_StyleScopedClasses['pb-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['pt-32']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:flex-row']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:items-end']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:pt-44']} */ ;
        if (detail.value.poster || !detail.value.backdrop) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "w-40 shrink-0 overflow-hidden rounded border border-flixer-border bg-flixer-surface shadow-2xl shadow-black/60 sm:w-56" },
                ...{ class: (detail.value.type === 'music' ? 'aspect-square' : 'aspect-[2/3]') },
            });
            /** @type {__VLS_StyleScopedClasses['w-40']} */ ;
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
            /** @type {__VLS_StyleScopedClasses['shadow-2xl']} */ ;
            /** @type {__VLS_StyleScopedClasses['shadow-black/60']} */ ;
            /** @type {__VLS_StyleScopedClasses['sm:w-56']} */ ;
            if (detail.value.poster) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
                    src: (detail.value.poster),
                    alt: (detail.value.title),
                    ...{ class: "size-full object-cover" },
                });
                /** @type {__VLS_StyleScopedClasses['size-full']} */ ;
                /** @type {__VLS_StyleScopedClasses['object-cover']} */ ;
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "grid size-full place-items-center p-4 text-center text-sm font-medium text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['grid']} */ ;
                /** @type {__VLS_StyleScopedClasses['size-full']} */ ;
                /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (detail.value.title);
            }
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "min-w-0 max-w-3xl" },
        });
        /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['max-w-3xl']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
            ...{ class: "mt-1 break-words text-4xl font-bold text-white drop-shadow-lg sm:text-5xl" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['break-words']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-4xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['drop-shadow-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:text-5xl']} */ ;
        (detail.value.title);
        if (detail.value.tagline) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mt-2 text-base italic text-flixer-text/80" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-base']} */ ;
            /** @type {__VLS_StyleScopedClasses['italic']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-text/80']} */ ;
            (detail.value.tagline);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-4 flex flex-wrap items-center gap-3 text-sm" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "font-medium text-white" },
        });
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        (__VLS_unwrap(t, {})(`home.itemType.${detail.value.type === 'tv' ? 'series' : detail.value.type === 'music' ? 'album' : 'movie'}`));
        if (detail.value.year) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (detail.value.year);
        }
        if (detail.value.runtimeMinutes) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (detail.value.runtimeMinutes);
        }
        if (detail.value.artist) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (detail.value.artist);
        }
        if (detail.value.rating) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (detail.value.rating.toFixed(1));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "rounded border border-flixer-accent/40 bg-flixer-accent/10 px-2 py-0.5 text-xs font-semibold text-flixer-accent" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-accent/40']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-accent/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
        (__VLS_unwrap(t, {})(`requests.status.${activeStatus.value}`));
        if (detail.value.genres.length) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
                ...{ class: "mt-3 flex flex-wrap gap-2" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            const __VLS_42 = __VLS_tryAsConstant((detail.value.genres));
            for (const [genre] of __VLS_vFor(__VLS_nonNull(__VLS_42))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                    key: (genre),
                    ...{ class: "rounded border border-white/20 bg-white/10 px-3 py-1 text-xs text-white" },
                });
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['border']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-white/20']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                (genre);
                // @ts-ignore
                [navLinks, isSigningOut, signOut, loading, t, t, t, detail, detail, detail, detail, detail, detail, detail, detail, detail, detail, detail, detail, detail, detail, detail, detail, detail, detail, detail, detail, detail, detail, detail, detail, detail, detail, activeStatus,];
            }
        }
        if (detail.value.overview) {
            const __VLS_43 = ClampedText;
            // @ts-ignore
            const __VLS_44 = __VLS_asFunctionalComponent1(__VLS_43, new __VLS_43({
                // @ts-ignore
                ...{ class: "mt-4" }, text: (detail.value.overview), title: (detail.value.title),
            }));
            const __VLS_45 = __VLS_44({
                ...{ class: "mt-4" },
                text: (detail.value.overview),
                title: (detail.value.title),
            }, ...__VLS_functionalComponentArgsRest(__VLS_44));
            /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mt-4 text-sm text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('mediaItem.noOverview'));
        }
        if (detail.value.cast.length) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mt-4 text-sm text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "font-medium text-flixer-text/80" },
            });
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-text/80']} */ ;
            (__VLS_unwrap(t, {})('requests.cast'));
            (detail.value.cast.join(' · '));
        }
        if (!requestAllowed.value && !detail.value.libraryItemId && (activeStatus.value === 'none' || activeStatus.value === 'declined')) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mt-4 max-w-xl rounded border border-amber-400/20 bg-amber-400/10 p-3 text-xs leading-5 text-amber-200" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['max-w-xl']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-amber-400/20']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-amber-400/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['leading-5']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-amber-200']} */ ;
            (config.value.config.value?.canRequest ? __VLS_unwrap(t, {})('requests.quotaReached') : __VLS_unwrap(t, {})('requests.notAllowed'));
        }
        else if (config.value.config.value?.quota.remaining !== null && config.value.config.value?.quota.remaining !== undefined && !detail.value.libraryItemId) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mt-4 text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('requests.quotaHint', { remaining: config.value.config.value.quota.remaining }));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-6 flex flex-wrap items-center gap-3" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        if (detail.value.libraryItemId) {
            let __VLS_48;
            /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
            RouterLink;
            // @ts-ignore
            const __VLS_49 = __VLS_asFunctionalComponent1(__VLS_48, new __VLS_48({
                // @ts-ignore
                to: ({ name: 'media-item', params: { id: detail.value.libraryItemId } }), ...{ class: "inline-flex items-center gap-2 rounded bg-white px-6 py-3 text-sm font-bold text-flixer-background transition hover:bg-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
            }));
            const __VLS_50 = __VLS_49({
                to: ({ name: 'media-item', params: { id: detail.value.libraryItemId } }),
                ...{ class: "inline-flex items-center gap-2 rounded bg-white px-6 py-3 text-sm font-bold text-flixer-background transition hover:bg-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_49));
            /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-background']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/85']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
            var __VLS_51;
            const { default: __VLS_53 } = __VLS_nonNull(__VLS_51.slots);
            let __VLS_54;
            /** @ts-ignore @type { | typeof __VLS_components.Icon} */
            Icon;
            // @ts-ignore
            const __VLS_55 = __VLS_asFunctionalComponent1(__VLS_54, new __VLS_54({
                // @ts-ignore
                icon: "lucide:play", ...{ class: "size-5" }, 'aria-hidden': "true",
            }));
            const __VLS_56 = __VLS_55({
                icon: "lucide:play",
                ...{ class: "size-5" },
                'aria-hidden': "true",
            }, ...__VLS_functionalComponentArgsRest(__VLS_55));
            /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
            (__VLS_unwrap(t, {})('requests.play'));
            // @ts-ignore
            [t, t, t, t, t, t, detail, detail, detail, detail, detail, detail, detail, detail, detail, activeStatus, activeStatus, requestAllowed, config, config, config, config,];
        }
        else if (activeStatus.value === 'none' || activeStatus.value === 'declined') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (submit) },
                type: "button",
                disabled: (!requestAllowed.value || submitting.value || (tv.value && selectedSeasons.value.length === 0)),
                ...{ class: "inline-flex items-center gap-2 rounded bg-white px-6 py-3 text-sm font-bold text-flixer-background transition hover:bg-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent disabled:cursor-not-allowed disabled:opacity-50" },
            });
            /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-background']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/85']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
            /** @type {__VLS_StyleScopedClasses['disabled:cursor-not-allowed']} */ ;
            /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
            let __VLS_59;
            /** @ts-ignore @type { | typeof __VLS_components.Icon} */
            Icon;
            // @ts-ignore
            const __VLS_60 = __VLS_asFunctionalComponent1(__VLS_59, new __VLS_59({
                // @ts-ignore
                icon: "lucide:plus", ...{ class: "size-5" }, 'aria-hidden': "true",
            }));
            const __VLS_61 = __VLS_60({
                icon: "lucide:plus",
                ...{ class: "size-5" },
                'aria-hidden': "true",
            }, ...__VLS_functionalComponentArgsRest(__VLS_60));
            /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
            (submitting.value ? __VLS_unwrap(t, {})('common.loading') : __VLS_unwrap(t, {})('requests.request'));
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                type: "button",
                disabled: true,
                'aria-disabled': "true",
                ...{ class: "inline-flex cursor-default items-center gap-2 rounded border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white/80" },
            });
            /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['cursor-default']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-white/30']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white/80']} */ ;
            (__VLS_unwrap(t, {})(`requests.status.${activeStatus.value}`));
        }
        if (ownRequest.value?.status === 'pending') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (cancelRequest) },
                type: "button",
                ...{ class: "inline-flex items-center gap-2 rounded border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
            });
            /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-white/30']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-5']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/20']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
            (__VLS_unwrap(t, {})('requests.cancelRequest'));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "space-y-10 pt-4" },
        });
        /** @type {__VLS_StyleScopedClasses['space-y-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['pt-4']} */ ;
        if (tv.value && detail.value.seasons?.length) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
                'aria-label': (__VLS_unwrap(t, {})('requests.seasons')),
                ...{ class: "page-gutter" },
            });
            /** @type {__VLS_StyleScopedClasses['page-gutter']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mb-3 flex flex-wrap items-center justify-between gap-3" },
            });
            /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
                ...{ class: "text-xl font-semibold text-white" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            (__VLS_unwrap(t, {})('requests.seasons'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "inline-flex cursor-pointer items-center gap-2 rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15" },
            });
            /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                ...{ onChange: (...[$event]) => {
                        void $event;
                        if (!!(loading.value))
                            throw 0;
                        if (!(detail.value))
                            throw 0;
                        if (!(tv.value && detail.value.seasons?.length))
                            throw 0;
                        return (toggleAll($event.target.checked));
                        // @ts-ignore
                        [t, t, t, t, t, t, detail, activeStatus, activeStatus, activeStatus, requestAllowed, submitting, submitting, tv, tv, selectedSeasons, ownRequest,];
                    } },
                type: "checkbox",
                ...{ class: "size-4 rounded accent-flixer-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" },
                checked: (__VLS_unwrap(selectedAll, {})),
                'aria-label': (__VLS_unwrap(t, {})('requests.selectAllSeasons')),
            });
            /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['accent-flixer-accent']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-offset-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
            (__VLS_unwrap(t, {})('requests.selectAllSeasons'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
                ...{ class: "divide-y divide-flixer-border overflow-hidden rounded border border-flixer-border bg-flixer-surface/40" },
            });
            /** @type {__VLS_StyleScopedClasses['divide-y']} */ ;
            /** @type {__VLS_StyleScopedClasses['divide-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/40']} */ ;
            const __VLS_64 = __VLS_tryAsConstant((detail.value.seasons));
            for (const [season] of __VLS_vFor(__VLS_nonNull(__VLS_64))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                    key: (season.number),
                    ...{ class: "flex items-center gap-3 p-3" },
                    ...{ class: (season.status !== 'none' ? 'opacity-60' : '') },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    type: "checkbox",
                    value: (season.number),
                    disabled: (season.status !== 'none'),
                    'aria-label': (season.name),
                    ...{ class: "size-4 shrink-0 rounded accent-flixer-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" },
                });
                (selectedSeasons.value);
                /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['accent-flixer-accent']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline-offset-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "min-w-0 flex-1" },
                });
                /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "block truncate text-sm font-semibold text-white" },
                });
                /** @type {__VLS_StyleScopedClasses['block']} */ ;
                /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                (season.name);
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "block text-xs text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['block']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (season.episodeCount);
                (__VLS_unwrap(t, {})('requests.episodes'));
                if (season.status !== 'none') {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "rounded border border-white/20 bg-white/10 px-2 py-0.5 text-xs text-white" },
                    });
                    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                    /** @type {__VLS_StyleScopedClasses['border']} */ ;
                    /** @type {__VLS_StyleScopedClasses['border-white/20']} */ ;
                    /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
                    /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
                    /** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                    (__VLS_unwrap(t, {})(`requests.status.${season.status}`));
                }
                // @ts-ignore
                [t, t, t, t, detail, selectedSeasons, selectedAll,];
            }
        }
        if (detail.value.tracklist?.length) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
                'aria-label': (__VLS_unwrap(t, {})('requests.tracklist')),
                ...{ class: "page-gutter" },
            });
            /** @type {__VLS_StyleScopedClasses['page-gutter']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
                ...{ class: "mb-3 text-xl font-semibold text-white" },
            });
            /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            (__VLS_unwrap(t, {})('requests.tracklist'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.ol, __VLS_intrinsics.ol)({
                ...{ class: "divide-y divide-flixer-border overflow-hidden rounded border border-flixer-border bg-flixer-surface/40" },
            });
            /** @type {__VLS_StyleScopedClasses['divide-y']} */ ;
            /** @type {__VLS_StyleScopedClasses['divide-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/40']} */ ;
            const __VLS_65 = __VLS_tryAsConstant((detail.value.tracklist));
            for (const [track, index] of __VLS_vFor(__VLS_nonNull(__VLS_65))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                    key: (track),
                    ...{ class: "flex gap-4 p-3 text-sm" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "w-6 text-right text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['w-6']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (index + 1);
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "text-white" },
                });
                /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                (track);
                // @ts-ignore
                [t, t, detail, detail,];
            }
        }
        if (config.value.config.value?.isAdmin && services.value.length) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
                'aria-label': (__VLS_unwrap(t, {})('requests.advanced')),
                ...{ class: "page-gutter" },
            });
            /** @type {__VLS_StyleScopedClasses['page-gutter']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
                ...{ class: "mb-3 text-xl font-semibold text-white" },
            });
            /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            (__VLS_unwrap(t, {})('requests.advanced'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "grid gap-4 rounded border border-flixer-border bg-flixer-surface/40 p-4 sm:grid-cols-2" },
            });
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/40']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "text-xs font-medium text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('requests.server'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                value: (__VLS_unwrap(serviceId, {})),
                ...{ class: "mt-1.5 w-full rounded border border-flixer-border bg-flixer-background px-4 py-3 text-sm text-flixer-text focus-visible:outline-2 focus-visible:outline-flixer-accent" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-1.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: "",
            });
            (__VLS_unwrap(t, {})('requests.defaultServer'));
            const __VLS_66 = __VLS_tryAsConstant((services.value));
            for (const [service] of __VLS_vFor(__VLS_nonNull(__VLS_66))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                    key: (service.id),
                    value: (service.id),
                });
                (service.name);
                // @ts-ignore
                [t, t, t, t, config, services, services, serviceId,];
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "text-xs font-medium text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('requests.rootFolder'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                ...{ class: "mt-1.5 w-full rounded border border-flixer-border bg-flixer-background px-4 py-3 text-sm text-flixer-text focus-visible:outline-2 focus-visible:outline-flixer-accent" },
            });
            (__VLS_unwrap(rootFolder, {}));
            /** @type {__VLS_StyleScopedClasses['mt-1.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        }
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "page-gutter pt-32 text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['page-gutter']} */ ;
        /** @type {__VLS_StyleScopedClasses['pt-32']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('requests.detailError'));
    }
    // @ts-ignore
    [t, t, rootFolder,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
