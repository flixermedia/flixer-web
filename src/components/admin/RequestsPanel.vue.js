import { openModal } from '@kolirt/vue-modal';
import { onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { deleteRequestService, getRequestsConfig, listMediaLibraries, listRequestServices, listRequestUsers, listSettings, updateRequestUser, updateSetting } from '../../api';
import { notify } from '../../composables/notify';
import { describeRequestError } from '../../composables/useProfile';
import { catchError } from '../../utils/catchError';
import AdminSection from './AdminSection.vue';
import AdminToggle from './AdminToggle.vue';
import ConfirmModal from '../ui/ConfirmModal.vue';
import RequestServiceModal from './RequestServiceModal.vue';
const { t } = useI18n();
const config = ref(null);
const settings = ref({});
const services = ref([]);
const libraries = ref([]);
const users = ref([]);
const overrides = reactive({});
const inputClass = 'mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-flixer-text';
async function load() {
    const [error, result] = await catchError(Promise.all([listSettings(), listRequestServices(), listRequestUsers(), getRequestsConfig(), listMediaLibraries()]));
    if (error) {
        notify.error(describeRequestError(error, t('admin.requests.loadError')));
    }
    else {
        const [settingList, serviceList, userList, requestConfig, libraryList] = result;
        settings.value = Object.fromEntries(settingList.map(({ key, value }) => [key, value]));
        services.value = serviceList;
        libraries.value = libraryList;
        users.value = userList;
        config.value = requestConfig;
        for (const user of userList)
            overrides[user.id] = { ...user };
    }
}
async function saveGlobal(key, value) {
    const [error] = await catchError(updateSetting(key, value));
    if (error) {
        notify.error(describeRequestError(error, t('admin.requests.saveError')));
    }
    else {
        settings.value[key] = value;
        notify.success(t('admin.requests.saved'));
    }
}
async function openEditor(service) {
    const saved = await openModal(RequestServiceModal, { props: { service, libraries: libraries.value } }).catch(() => false);
    if (saved)
        await load();
}
async function removeService(id) {
    const confirmed = await openModal(ConfirmModal, { props: { message: t('admin.requests.confirmDeleteService'), confirmLabel: t('admin.requests.removeService'), danger: true } }).catch(() => false);
    if (!confirmed)
        return;
    const [error] = await catchError(deleteRequestService(id));
    if (error) {
        notify.error(describeRequestError(error));
    }
    else {
        await load();
    }
}
function setUserNumber(id, field, value) {
    overrides[id][field] = value === '' ? null : Number(value);
}
async function saveUser(id) {
    const [error] = await catchError(updateRequestUser(id, { canRequest: overrides[id].canRequest, autoApprove: overrides[id].autoApprove, quotaLimit: overrides[id].quotaLimit, quotaDays: overrides[id].quotaDays }));
    if (error) {
        notify.error(describeRequestError(error));
    }
    else {
        notify.success(t('admin.requests.saved'));
    }
}
onMounted(load);
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(config, {});
    __VLS_withDotValue(settings, {});
    __VLS_withDotValue(services, {});
    __VLS_withDotValue(libraries, {});
    __VLS_withDotValue(users, {});
    __VLS_withDotValue(overrides, {});
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
        title: (__VLS_unwrap(t, {})('admin.requests.generalTitle')), description: (__VLS_unwrap(t, {})('admin.requests.generalDescription')),
    }));
    const __VLS_2 = __VLS_1({
        title: (__VLS_unwrap(t, {})('admin.requests.generalTitle')),
        description: (__VLS_unwrap(t, {})('admin.requests.generalDescription')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-col gap-3" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    if (config.value && !config.value.tmdbConfigured) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "rounded border border-amber-300/20 bg-amber-300/[0.06] p-3 text-xs leading-5 text-amber-200" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-amber-300/20']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-amber-300/[0.06]']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['leading-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-amber-200']} */ ;
        (__VLS_unwrap(t, {})('admin.requests.tmdbWarning'));
    }
    if (config.value && !config.value.discogsConfigured) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "rounded border border-amber-300/20 bg-amber-300/[0.06] p-3 text-xs leading-5 text-amber-200" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-amber-300/20']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-amber-300/[0.06]']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['leading-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-amber-200']} */ ;
        (__VLS_unwrap(t, {})('admin.requests.discogsWarning'));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid gap-x-10 divide-y divide-flixer-border lg:grid-cols-2 lg:divide-y-0" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-x-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['divide-y']} */ ;
    /** @type {__VLS_StyleScopedClasses['divide-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:grid-cols-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:divide-y-0']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "divide-y divide-flixer-border" },
    });
    /** @type {__VLS_StyleScopedClasses['divide-y']} */ ;
    /** @type {__VLS_StyleScopedClasses['divide-flixer-border']} */ ;
    const __VLS_6 = AdminToggle;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
        // @ts-ignore
        ...{ 'onUpdate:modelValue': {} }, modelValue: (Boolean(settings.value.requests_enabled)), label: (__VLS_unwrap(t, {})('admin.requests.enabled')), description: (__VLS_unwrap(t, {})('admin.requests.enabledHint')),
    }));
    const __VLS_8 = __VLS_7({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (Boolean(settings.value.requests_enabled)),
        label: (__VLS_unwrap(t, {})('admin.requests.enabled')),
        description: (__VLS_unwrap(t, {})('admin.requests.enabledHint')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    let __VLS_11;
    const __VLS_12 = {
        /** @type {typeof __VLS_11.'update:modelValue'} */
        'onUpdate:modelValue': (...[$event]) => {
            void $event;
            return (saveGlobal('requests_enabled', $event));
            // @ts-ignore
            [t, t, t, t, t, t, config, config, config, config, settings,];
        },
    };
    void __VLS_12;
    var __VLS_9;
    var __VLS_10;
    const __VLS_13 = AdminToggle;
    // @ts-ignore
    const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
        // @ts-ignore
        ...{ 'onUpdate:modelValue': {} }, modelValue: (settings.value.requests_movies_enabled !== false), label: (__VLS_unwrap(t, {})('admin.requests.requests_movies_enabled')),
    }));
    const __VLS_15 = __VLS_14({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (settings.value.requests_movies_enabled !== false),
        label: (__VLS_unwrap(t, {})('admin.requests.requests_movies_enabled')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_14));
    let __VLS_18;
    const __VLS_19 = {
        /** @type {typeof __VLS_18.'update:modelValue'} */
        'onUpdate:modelValue': (...[$event]) => {
            void $event;
            return (saveGlobal('requests_movies_enabled', $event));
            // @ts-ignore
            [t, settings,];
        },
    };
    void __VLS_19;
    var __VLS_16;
    var __VLS_17;
    const __VLS_20 = AdminToggle;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
        // @ts-ignore
        ...{ 'onUpdate:modelValue': {} }, modelValue: (settings.value.requests_tv_enabled !== false), label: (__VLS_unwrap(t, {})('admin.requests.requests_tv_enabled')),
    }));
    const __VLS_22 = __VLS_21({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (settings.value.requests_tv_enabled !== false),
        label: (__VLS_unwrap(t, {})('admin.requests.requests_tv_enabled')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    let __VLS_25;
    const __VLS_26 = {
        /** @type {typeof __VLS_25.'update:modelValue'} */
        'onUpdate:modelValue': (...[$event]) => {
            void $event;
            return (saveGlobal('requests_tv_enabled', $event));
            // @ts-ignore
            [t, settings,];
        },
    };
    void __VLS_26;
    var __VLS_23;
    var __VLS_24;
    const __VLS_27 = AdminToggle;
    // @ts-ignore
    const __VLS_28 = __VLS_asFunctionalComponent1(__VLS_27, new __VLS_27({
        // @ts-ignore
        ...{ 'onUpdate:modelValue': {} }, modelValue: (settings.value.requests_music_enabled !== false), label: (__VLS_unwrap(t, {})('admin.requests.requests_music_enabled')),
    }));
    const __VLS_29 = __VLS_28({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (settings.value.requests_music_enabled !== false),
        label: (__VLS_unwrap(t, {})('admin.requests.requests_music_enabled')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_28));
    let __VLS_32;
    const __VLS_33 = {
        /** @type {typeof __VLS_32.'update:modelValue'} */
        'onUpdate:modelValue': (...[$event]) => {
            void $event;
            return (saveGlobal('requests_music_enabled', $event));
            // @ts-ignore
            [t, settings,];
        },
    };
    void __VLS_33;
    var __VLS_30;
    var __VLS_31;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "divide-y divide-flixer-border" },
    });
    /** @type {__VLS_StyleScopedClasses['divide-y']} */ ;
    /** @type {__VLS_StyleScopedClasses['divide-flixer-border']} */ ;
    const __VLS_34 = AdminToggle;
    // @ts-ignore
    const __VLS_35 = __VLS_asFunctionalComponent1(__VLS_34, new __VLS_34({
        // @ts-ignore
        ...{ 'onUpdate:modelValue': {} }, modelValue: (Boolean(settings.value.requests_auto_approve)), label: (__VLS_unwrap(t, {})('admin.requests.autoApprove')),
    }));
    const __VLS_36 = __VLS_35({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (Boolean(settings.value.requests_auto_approve)),
        label: (__VLS_unwrap(t, {})('admin.requests.autoApprove')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_35));
    let __VLS_39;
    const __VLS_40 = {
        /** @type {typeof __VLS_39.'update:modelValue'} */
        'onUpdate:modelValue': (...[$event]) => {
            void $event;
            return (saveGlobal('requests_auto_approve', $event));
            // @ts-ignore
            [t, settings,];
        },
    };
    void __VLS_40;
    var __VLS_37;
    var __VLS_38;
    const __VLS_41 = AdminToggle;
    // @ts-ignore
    const __VLS_42 = __VLS_asFunctionalComponent1(__VLS_41, new __VLS_41({
        // @ts-ignore
        ...{ 'onUpdate:modelValue': {} }, modelValue: (settings.value.requests_default_can_request !== false), label: (__VLS_unwrap(t, {})('admin.requests.defaultCanRequest')),
    }));
    const __VLS_43 = __VLS_42({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (settings.value.requests_default_can_request !== false),
        label: (__VLS_unwrap(t, {})('admin.requests.defaultCanRequest')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_42));
    let __VLS_46;
    const __VLS_47 = {
        /** @type {typeof __VLS_46.'update:modelValue'} */
        'onUpdate:modelValue': (...[$event]) => {
            void $event;
            return (saveGlobal('requests_default_can_request', $event));
            // @ts-ignore
            [t, settings,];
        },
    };
    void __VLS_47;
    var __VLS_44;
    var __VLS_45;
    const __VLS_48 = AdminToggle;
    // @ts-ignore
    const __VLS_49 = __VLS_asFunctionalComponent1(__VLS_48, new __VLS_48({
        // @ts-ignore
        ...{ 'onUpdate:modelValue': {} }, modelValue: (Boolean(settings.value.requests_notify_admins)), label: (__VLS_unwrap(t, {})('admin.requests.notifyAdmins')),
    }));
    const __VLS_50 = __VLS_49({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (Boolean(settings.value.requests_notify_admins)),
        label: (__VLS_unwrap(t, {})('admin.requests.notifyAdmins')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_49));
    let __VLS_53;
    const __VLS_54 = {
        /** @type {typeof __VLS_53.'update:modelValue'} */
        'onUpdate:modelValue': (...[$event]) => {
            void $event;
            return (saveGlobal('requests_notify_admins', $event));
            // @ts-ignore
            [t, settings,];
        },
    };
    void __VLS_54;
    var __VLS_51;
    var __VLS_52;
    const __VLS_55 = AdminToggle;
    // @ts-ignore
    const __VLS_56 = __VLS_asFunctionalComponent1(__VLS_55, new __VLS_55({
        // @ts-ignore
        ...{ 'onUpdate:modelValue': {} }, modelValue: (Boolean(settings.value.requests_notify_users)), label: (__VLS_unwrap(t, {})('admin.requests.notifyUsers')),
    }));
    const __VLS_57 = __VLS_56({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (Boolean(settings.value.requests_notify_users)),
        label: (__VLS_unwrap(t, {})('admin.requests.notifyUsers')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_56));
    let __VLS_60;
    const __VLS_61 = {
        /** @type {typeof __VLS_60.'update:modelValue'} */
        'onUpdate:modelValue': (...[$event]) => {
            void $event;
            return (saveGlobal('requests_notify_users', $event));
            // @ts-ignore
            [t, settings,];
        },
    };
    void __VLS_61;
    var __VLS_58;
    var __VLS_59;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "border-t border-flixer-border pt-4" },
    });
    /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
        ...{ class: "text-sm font-medium" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    (__VLS_unwrap(t, {})('admin.requests.quotaTitle'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-2 grid max-w-md gap-3 sm:grid-cols-2" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "text-xs font-medium text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('admin.requests.quotaLimit'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (...[$event]) => {
                void $event;
                return (saveGlobal('requests_quota_limit', Number($event.target.value)));
                // @ts-ignore
                [t, t,];
            } },
        value: (settings.value.requests_quota_limit ?? 0),
        type: "number",
        min: "0",
        ...{ class: (__VLS_unwrap(inputClass, {})) },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "text-xs font-medium text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('admin.requests.quotaDays'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (...[$event]) => {
                void $event;
                return (saveGlobal('requests_quota_days', Number($event.target.value)));
                // @ts-ignore
                [t, settings, inputClass,];
            } },
        value: (settings.value.requests_quota_days ?? 7),
        type: "number",
        min: "1",
        max: "365",
        ...{ class: (__VLS_unwrap(inputClass, {})) },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-2 text-xs text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('admin.requests.quotaHint'));
    // @ts-ignore
    [t, settings, inputClass,];
    const __VLS_62 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_63 = __VLS_asFunctionalComponent1(__VLS_62, new __VLS_62({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('admin.requests.servicesTitle')), description: (__VLS_unwrap(t, {})('admin.requests.servicesDescription')),
    }));
    const __VLS_64 = __VLS_63({
        title: (__VLS_unwrap(t, {})('admin.requests.servicesTitle')),
        description: (__VLS_unwrap(t, {})('admin.requests.servicesDescription')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_63));
    var __VLS_65;
    const { default: __VLS_67 } = __VLS_nonNull(__VLS_65.slots);
    {
        const { actions: __VLS_68 } = __VLS_nonNull(__VLS_65.slots);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    return (openEditor());
                    // @ts-ignore
                    [t, t,];
                } },
            type: "button",
            ...{ class: "inline-flex items-center gap-2 rounded bg-flixer-primary px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-flixer-primary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
        });
        /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-primary']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-flixer-primary/80']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            'aria-hidden': "true",
        });
        (__VLS_unwrap(t, {})('admin.requests.addService'));
        // @ts-ignore
        [t,];
    }
    if (services.value.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
            ...{ class: "grid gap-3 md:grid-cols-2" },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:grid-cols-2']} */ ;
        const __VLS_69 = __VLS_tryAsConstant((services.value));
        for (const [service] of __VLS_vFor(__VLS_nonNull(__VLS_69))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                key: (service.id),
                ...{ class: "rounded border border-flixer-border bg-flixer-background/40 p-4 transition hover:border-white/20" },
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-background/40']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:border-white/20']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex items-start gap-3" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "grid size-10 shrink-0 place-items-center rounded border border-white/10 bg-white/[0.06] text-sm font-bold text-flixer-accent" },
                'aria-label': (service.kind),
            });
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['size-10']} */ ;
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white/[0.06]']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
            (service.kind === 'sonarr' ? 'S' : service.kind === 'radarr' ? 'R' : 'L');
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
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
                ...{ class: "truncate text-sm font-semibold text-white" },
            });
            /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            (service.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white/[0.05]']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
            /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (service.kind);
            if (service.isDefault) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "rounded-full border border-flixer-accent/25 bg-flixer-accent/10 px-2 py-0.5 text-[10px] font-semibold text-flixer-accent" },
                });
                /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
                /** @type {__VLS_StyleScopedClasses['border']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-flixer-accent/25']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-flixer-accent/10']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
                (__VLS_unwrap(t, {})('admin.requests.defaultService'));
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "rounded-full border px-2 py-0.5 text-[10px] font-semibold" },
                ...{ class: (service.enabled ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200' : 'border-white/10 bg-white/[0.04] text-flixer-muted') },
            });
            /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            (service.enabled ? __VLS_unwrap(t, {})('admin.requests.serviceEnabled') : __VLS_unwrap(t, {})('admin.requests.serviceDisabled'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mt-1 truncate text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (service.url);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mt-2 flex flex-wrap items-center gap-2" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            if (service.libraryId) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
                /** @type {__VLS_StyleScopedClasses['border']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-white/[0.04]']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (__VLS_unwrap(t, {})('admin.requests.library'));
                (service.libraryName || libraries.value.find((library) => library.id === service.libraryId)?.name);
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "rounded-full border border-amber-300/25 bg-amber-300/10 px-2 py-1 text-[10px] font-semibold text-amber-100" },
                });
                /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
                /** @type {__VLS_StyleScopedClasses['border']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-amber-300/25']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-amber-300/10']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-amber-100']} */ ;
                (__VLS_unwrap(t, {})('admin.requests.notLinkedLibrary'));
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-[11px] text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-[11px]']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.requests.rootFolder'));
            (service.rootFolder);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mt-4 flex justify-end gap-2 border-t border-flixer-border pt-3" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['pt-3']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!(services.value.length))
                            throw 0;
                        return (openEditor(service));
                        // @ts-ignore
                        [t, t, t, t, t, t, services, services, libraries,];
                    } },
                type: "button",
                ...{ class: "rounded px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
            (__VLS_unwrap(t, {})('admin.requests.editService'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!(services.value.length))
                            throw 0;
                        return (removeService(service.id));
                        // @ts-ignore
                        [t,];
                    } },
                type: "button",
                ...{ class: "rounded px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-400/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-red-200']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-red-400/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
            (__VLS_unwrap(t, {})('admin.requests.removeService'));
            // @ts-ignore
            [t,];
        }
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "rounded border border-dashed border-flixer-border px-4 py-8 text-center text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-dashed']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-8']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.requests.noServices'));
    }
    // @ts-ignore
    [t,];
    const __VLS_70 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_71 = __VLS_asFunctionalComponent1(__VLS_70, new __VLS_70({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('admin.requests.usersTitle')), description: (__VLS_unwrap(t, {})('admin.requests.usersDescription')),
    }));
    const __VLS_72 = __VLS_71({
        title: (__VLS_unwrap(t, {})('admin.requests.usersTitle')),
        description: (__VLS_unwrap(t, {})('admin.requests.usersDescription')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_71));
    var __VLS_73;
    const { default: __VLS_75 } = __VLS_nonNull(__VLS_73.slots);
    if (users.value.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "overflow-hidden rounded border border-flixer-border" },
        });
        /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "overflow-x-auto" },
        });
        /** @type {__VLS_StyleScopedClasses['overflow-x-auto']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
            ...{ class: "w-full min-w-[46rem] border-collapse text-left text-xs" },
        });
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['min-w-[46rem]']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-collapse']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({
            ...{ class: "bg-flixer-background/60 text-[10px] uppercase tracking-wide text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['bg-flixer-background/60']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            scope: "col",
            ...{ class: "px-3 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        (__VLS_unwrap(t, {})('admin.requests.user'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            scope: "col",
            ...{ class: "px-3 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        (__VLS_unwrap(t, {})('admin.requests.canRequest'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            scope: "col",
            ...{ class: "px-3 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        (__VLS_unwrap(t, {})('admin.requests.autoApprove'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            scope: "col",
            ...{ class: "px-3 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        (__VLS_unwrap(t, {})('admin.requests.quotaLimit'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            scope: "col",
            ...{ class: "px-3 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        (__VLS_unwrap(t, {})('admin.requests.quotaDays'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            scope: "col",
            ...{ class: "px-3 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "sr-only" },
        });
        /** @type {__VLS_StyleScopedClasses['sr-only']} */ ;
        (__VLS_unwrap(t, {})('common.save'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
        const __VLS_76 = __VLS_tryAsConstant((users.value));
        for (const [user] of __VLS_vFor(__VLS_nonNull(__VLS_76))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (user.id),
                ...{ class: "border-t border-flixer-border transition hover:bg-white/[0.025]" },
            });
            /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/[0.025]']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
                scope: "row",
                ...{ class: "px-3 py-2.5 font-medium text-white" },
            });
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "block max-w-44 truncate" },
            });
            /** @type {__VLS_StyleScopedClasses['block']} */ ;
            /** @type {__VLS_StyleScopedClasses['max-w-44']} */ ;
            /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
            (user.displayName || user.username);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "mt-0.5 block font-normal text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-0.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['block']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-normal']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (user.username);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "px-2 py-2" },
            });
            /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                value: (overrides.value[user.id].canRequest),
                'aria-label': (`${__VLS_unwrap(t, {})('admin.requests.canRequest')}: ${user.username}`),
                ...{ class: (__VLS_unwrap(inputClass, {})) },
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (null),
            });
            (__VLS_unwrap(t, {})('admin.requests.inherit'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (true),
            });
            (__VLS_unwrap(t, {})('admin.requests.allow'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (false),
            });
            (__VLS_unwrap(t, {})('admin.requests.deny'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "px-2 py-2" },
            });
            /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                value: (overrides.value[user.id].autoApprove),
                'aria-label': (`${__VLS_unwrap(t, {})('admin.requests.autoApprove')}: ${user.username}`),
                ...{ class: (__VLS_unwrap(inputClass, {})) },
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (null),
            });
            (__VLS_unwrap(t, {})('admin.requests.inherit'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (true),
            });
            (__VLS_unwrap(t, {})('admin.requests.allow'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (false),
            });
            (__VLS_unwrap(t, {})('admin.requests.deny'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "px-2 py-2" },
            });
            /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                ...{ onChange: (...[$event]) => {
                        void $event;
                        if (!(users.value.length))
                            throw 0;
                        return (setUserNumber(user.id, 'quotaLimit', $event.target.value));
                        // @ts-ignore
                        [t, t, t, t, t, t, t, t, t, t, t, t, t, t, t, t, inputClass, inputClass, users, users, overrides, overrides,];
                    } },
                value: (overrides.value[user.id].quotaLimit ?? ''),
                'aria-label': (`${__VLS_unwrap(t, {})('admin.requests.quotaLimit')}: ${user.username}`),
                type: "number",
                min: "0",
                ...{ class: (__VLS_unwrap(inputClass, {})) },
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "px-2 py-2" },
            });
            /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                ...{ onChange: (...[$event]) => {
                        void $event;
                        if (!(users.value.length))
                            throw 0;
                        return (setUserNumber(user.id, 'quotaDays', $event.target.value));
                        // @ts-ignore
                        [t, inputClass, overrides,];
                    } },
                value: (overrides.value[user.id].quotaDays ?? ''),
                'aria-label': (`${__VLS_unwrap(t, {})('admin.requests.quotaDays')}: ${user.username}`),
                type: "number",
                min: "1",
                max: "365",
                ...{ class: (__VLS_unwrap(inputClass, {})) },
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "px-2 py-2" },
            });
            /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!(users.value.length))
                            throw 0;
                        return (saveUser(user.id));
                        // @ts-ignore
                        [t, inputClass, overrides,];
                    } },
                type: "button",
                ...{ class: "rounded bg-white/[0.08] px-3 py-2 font-semibold text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
                'aria-label': (`${__VLS_unwrap(t, {})('common.save')}: ${user.username}`),
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white/[0.08]']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
            (__VLS_unwrap(t, {})('common.save'));
            // @ts-ignore
            [t, t,];
        }
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "rounded border border-dashed border-flixer-border px-4 py-8 text-center text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-dashed']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-8']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.requests.noUsers'));
    }
    // @ts-ignore
    [t,];
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
