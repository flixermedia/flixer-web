import { computed, onBeforeUnmount, provide, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { callPluginOperation } from '../api';
import Header from '../components/header/Header.vue';
import MobileTabBar from '../components/home/MobileTabBar.vue';
import PluginNode from '../components/plugins/PluginNode.vue';
import { getMobileTabs, getNavLinks } from '../composables/homeNav';
import { pluginViewContextKey, usePluginActions } from '../composables/usePluginActions';
import { usePluginPages } from '../composables/usePluginPages';
import { describeRequestError } from '../composables/useProfile';
import { useSignOut } from '../composables/useSignOut';
import { applyQuery, queryFromRoute, resolveNav } from '../plugins/pageLogic';
import { sanitizePageResponse } from '../plugins/viewSchema';
import { catchError } from '../utils/catchError';
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { isSigningOut, signOut } = useSignOut();
const { pages } = usePluginPages();
const navLinks = computed(getNavLinks);
const mobileTabs = computed(getMobileTabs);
const pluginId = computed(() => String(route.params.pluginId ?? ''));
const pageId = computed(() => String(route.params.pageId ?? ''));
const query = computed(() => queryFromRoute(route.query));
const queryKey = computed(() => JSON.stringify(Object.entries(query.value).sort(([a], [b]) => a.localeCompare(b))));
const page = ref(null);
const loading = ref(false);
const errorMessage = ref('');
let sequence = 0;
const listedTitle = computed(() => pages.value.find((entry) => entry.pluginId === pluginId.value && entry.id === pageId.value)?.title);
const title = computed(() => page.value?.title || listedTitle.value || '');
async function load() {
    const current = ++sequence;
    loading.value = true;
    errorMessage.value = '';
    try {
        const [error, raw] = await catchError(callPluginOperation(pluginId.value, 'page', { page: pageId.value, query: query.value }));
        if (error) {
            if (current !== sequence)
                return;
            page.value = null;
            errorMessage.value = describeRequestError(error, t('plugins.view.loadError'));
            return;
        }
        if (current !== sequence)
            return;
        let result;
        try {
            result = sanitizePageResponse(raw);
        }
        catch (error) {
            page.value = null;
            errorMessage.value = describeRequestError(error, t('plugins.view.loadError'));
            return;
        }
        if (!result) {
            page.value = null;
            errorMessage.value = t('plugins.view.invalid');
            return;
        }
        page.value = result;
    }
    finally {
        if (current === sequence)
            loading.value = false;
    }
}
function applyTitle() {
    const base = t('router.defaultTitle');
    document.title = title.value ? `${title.value} · ${base}` : base;
}
function push(next) {
    void router.push({ query: next });
}
function navigate(nav) {
    push(resolveNav(query.value, nav));
}
const actions = usePluginActions({ pluginId: () => pluginId.value, navigate, reload: () => void load() });
const context = {
    query,
    busy: actions.busy,
    run: actions.run,
    patchQuery: (patch, reset) => push(applyQuery(query.value, patch, reset)),
};
provide(pluginViewContextKey, context);
watch([pluginId, pageId], () => {
    page.value = null;
});
watch([pluginId, pageId, queryKey], () => void load(), { immediate: true });
// The router resets the title after every navigation, so re-apply it once the DOM has settled.
watch([title, () => route.fullPath], applyTitle, { flush: 'post', immediate: true });
onBeforeUnmount(() => {
    sequence += 1;
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(page, {});
    __VLS_withDotValue(errorMessage, {});
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
    if (page.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            'aria-busy': (__VLS_unwrap(loading, {})),
        });
        const __VLS_7 = PluginNode;
        // @ts-ignore
        const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
            // @ts-ignore
            node: (page.value.view),
        }));
        const __VLS_9 = __VLS_8({
            node: (page.value.view),
        }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    }
    else if (errorMessage.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "admin-card p-6 text-sm" },
            role: "alert",
        });
        /** @type {__VLS_StyleScopedClasses['admin-card']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-red-300" },
        });
        /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
        (errorMessage.value);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (load) },
            type: "button",
            ...{ class: "mt-4 rounded border border-flixer-border px-3 py-2 text-sm font-semibold transition hover:bg-white/5" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/5']} */ ;
        (__VLS_unwrap(t, {})('plugins.view.retry'));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "py-10 text-sm text-flixer-muted" },
            role: "status",
        });
        /** @type {__VLS_StyleScopedClasses['py-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('plugins.view.loading'));
    }
    const __VLS_12 = MobileTabBar;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
        // @ts-ignore
        tabs: (__VLS_unwrap(mobileTabs, {})),
    }));
    const __VLS_14 = __VLS_13({
        tabs: (__VLS_unwrap(mobileTabs, {})),
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    // @ts-ignore
    [navLinks, isSigningOut, signOut, page, page, loading, errorMessage, errorMessage, t, t, mobileTabs,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
