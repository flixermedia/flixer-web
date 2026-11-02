import axios from 'axios';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, useRoute } from 'vue-router';
import { acceptFriendInvite, getFriendInvite } from '../api';
import Header from '../components/header/Header.vue';
import MobileTabBar from '../components/home/MobileTabBar.vue';
import UserAvatar from '../components/ui/UserAvatar.vue';
import { getMobileTabs, getNavLinks } from '../composables/homeNav';
import { notify } from '../composables/notify';
import { useSignOut } from '../composables/useSignOut';
import { catchError } from '../utils/catchError';
const { t } = useI18n();
const route = useRoute();
const { isSigningOut, signOut } = useSignOut();
const navLinks = computed(getNavLinks);
const mobileTabs = computed(getMobileTabs);
const invite = ref(null);
const loading = ref(true);
const failed = ref(false);
const busy = ref(false);
const token = computed(() => String(route.params.token ?? ''));
async function loadInvite() {
    loading.value = true;
    failed.value = false;
    try {
        const [error, value] = await catchError(getFriendInvite(token.value));
        if (error) {
            failed.value = true;
            invite.value = null;
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                document.title = `${t('social.friendInvite.invalid')} · Flixer`;
            }
        }
        else {
            invite.value = value;
        }
    }
    finally {
        loading.value = false;
    }
}
async function updateFriendship() {
    const person = invite.value;
    if (!person || busy.value)
        return;
    busy.value = true;
    try {
        if (person.friendship !== 'friends' && person.friendship !== 'self') {
            const [error] = await catchError(acceptFriendInvite(token.value));
            if (error) {
                notify.error(t('social.friendInvite.requestFailed'));
                return;
            }
        }
        invite.value = { ...person, friendship: 'friends' };
    }
    finally {
        busy.value = false;
    }
}
const actionLabel = computed(() => {
    switch (invite.value?.friendship) {
        case 'none':
        case 'incoming':
        case 'outgoing':
            return t('social.friendInvite.accept');
        case 'friends':
            return t('social.friendInvite.alreadyFriends');
        case 'self':
            return t('social.friendInvite.self');
        default:
            return '';
    }
});
watch(token, () => void loadInvite(), { immediate: true });
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(loading, {});
    __VLS_withDotValue(failed, {});
    __VLS_withDotValue(invite, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "min-h-screen bg-flixer-background pb-24 font-sans text-flixer-text md:pb-12" },
    });
    /** @type {__VLS_StyleScopedClasses['min-h-screen']} */ ;
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({
        ...{ class: "page-gutter pt-28 sm:pt-32" },
    });
    /** @type {__VLS_StyleScopedClasses['page-gutter']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-28']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:pt-32']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "mx-auto max-w-lg rounded border border-white/10 bg-flixer-surface/60 p-6 text-center sm:p-8" },
    });
    /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/60']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:p-8']} */ ;
    if (loading.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm text-flixer-muted" },
            role: "status",
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('common.loading'));
    }
    else if (failed.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            role: "alert",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
            ...{ class: "text-xl font-semibold text-white" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        (__VLS_unwrap(t, {})('social.friendInvite.invalid'));
        let __VLS_7;
        /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
        RouterLink;
        // @ts-ignore
        const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
            // @ts-ignore
            to: "/people", ...{ class: "mt-4 inline-block text-sm text-flixer-accent hover:underline" },
        }));
        const __VLS_9 = __VLS_8({
            to: "/people",
            ...{ class: "mt-4 inline-block text-sm text-flixer-accent hover:underline" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_8));
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['inline-block']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:underline']} */ ;
        var __VLS_10;
        const { default: __VLS_12 } = __VLS_nonNull(__VLS_10.slots);
        (__VLS_unwrap(t, {})('social.people'));
        // @ts-ignore
        [navLinks, isSigningOut, signOut, loading, t, t, t, failed,];
    }
    else if (invite.value) {
        const __VLS_13 = UserAvatar;
        // @ts-ignore
        const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
            // @ts-ignore
            avatarUrl: (invite.value.avatarUrl), name: (invite.value.displayName), ...{ class: "mx-auto size-24 text-3xl" },
        }));
        const __VLS_15 = __VLS_14({
            avatarUrl: (invite.value.avatarUrl),
            name: (invite.value.displayName),
            ...{ class: "mx-auto size-24 text-3xl" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_14));
        /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-24']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
            ...{ class: "mt-4 break-words text-2xl font-bold text-white" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['break-words']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        (invite.value.displayName);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-1 text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (invite.value.username);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-4 text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('social.friendInvite.description'));
        if (invite.value.friendship !== 'friends' && invite.value.friendship !== 'self') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (updateFriendship) },
                type: "button",
                ...{ class: "mt-6 rounded bg-white px-5 py-2.5 text-sm font-bold text-flixer-background transition hover:bg-white/85 disabled:opacity-60" },
                disabled: (__VLS_unwrap(busy, {})),
            });
            /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-5']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-background']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/85']} */ ;
            /** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
            (__VLS_unwrap(actionLabel, {}));
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mt-6 text-sm font-semibold text-flixer-muted" },
                role: "status",
            });
            /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(actionLabel, {}));
        }
    }
    const __VLS_18 = MobileTabBar;
    // @ts-ignore
    const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
        // @ts-ignore
        tabs: (__VLS_unwrap(mobileTabs, {})),
    }));
    const __VLS_20 = __VLS_19({
        tabs: (__VLS_unwrap(mobileTabs, {})),
    }, ...__VLS_functionalComponentArgsRest(__VLS_19));
    // @ts-ignore
    [t, invite, invite, invite, invite, invite, invite, invite, busy, actionLabel, actionLabel, mobileTabs,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
