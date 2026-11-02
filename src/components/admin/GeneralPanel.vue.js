import { reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import AdminSection from './AdminSection.vue';
import AdminToggle from './AdminToggle.vue';
import ErrorMonitoringSection from './ErrorMonitoringSection.vue';
import ServerSettingsSection from './ServerSettingsSection.vue';
const { t } = useI18n();
const form = reactive({
    notifyNewUser: true,
    notifyTaskFail: true,
    quickConnect: true,
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(form, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-col gap-6" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
    const __VLS_0 = ServerSettingsSection;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    // @ts-ignore
    }));
    const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
    const __VLS_5 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('admin.general.notificationsTitle')), description: (__VLS_unwrap(t, {})('admin.general.notificationsDescription')),
    }));
    const __VLS_7 = __VLS_6({
        title: (__VLS_unwrap(t, {})('admin.general.notificationsTitle')),
        description: (__VLS_unwrap(t, {})('admin.general.notificationsDescription')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_6));
    var __VLS_8;
    const { default: __VLS_10 } = __VLS_nonNull(__VLS_8.slots);
    const __VLS_11 = AdminToggle;
    // @ts-ignore
    const __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11({
        // @ts-ignore
        modelValue: (form.value.notifyNewUser), label: (__VLS_unwrap(t, {})('admin.general.newUserAwaitingApproval')),
    }));
    const __VLS_13 = __VLS_12({
        modelValue: (form.value.notifyNewUser),
        label: (__VLS_unwrap(t, {})('admin.general.newUserAwaitingApproval')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_12));
    const __VLS_16 = AdminToggle;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent1(__VLS_16, new __VLS_16({
        // @ts-ignore
        modelValue: (form.value.notifyTaskFail), label: (__VLS_unwrap(t, {})('admin.general.scheduledTaskFailed')),
    }));
    const __VLS_18 = __VLS_17({
        modelValue: (form.value.notifyTaskFail),
        label: (__VLS_unwrap(t, {})('admin.general.scheduledTaskFailed')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    const __VLS_21 = AdminToggle;
    // @ts-ignore
    const __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21({
        // @ts-ignore
        modelValue: (form.value.quickConnect), label: (__VLS_unwrap(t, {})('admin.general.allowQuickConnect')), description: (__VLS_unwrap(t, {})('admin.general.quickConnectDescription')),
    }));
    const __VLS_23 = __VLS_22({
        modelValue: (form.value.quickConnect),
        label: (__VLS_unwrap(t, {})('admin.general.allowQuickConnect')),
        description: (__VLS_unwrap(t, {})('admin.general.quickConnectDescription')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_22));
    // @ts-ignore
    [t, t, t, t, t, t, form, form, form,];
    const __VLS_26 = ErrorMonitoringSection;
    // @ts-ignore
    const __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({
    // @ts-ignore
    }));
    const __VLS_28 = __VLS_27({}, ...__VLS_functionalComponentArgsRest(__VLS_27));
    const __VLS_31 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('admin.general.dangerZoneTitle')), description: (__VLS_unwrap(t, {})('admin.general.dangerZoneDescription')),
    }));
    const __VLS_33 = __VLS_32({
        title: (__VLS_unwrap(t, {})('admin.general.dangerZoneTitle')),
        description: (__VLS_unwrap(t, {})('admin.general.dangerZoneDescription')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_32));
    var __VLS_34;
    const { default: __VLS_36 } = __VLS_nonNull(__VLS_34.slots);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-wrap gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        type: "button",
        ...{ class: "rounded bg-red-500/20 px-4 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/30" },
    });
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-red-500/20']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-red-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-red-500/30']} */ ;
    (__VLS_unwrap(t, {})('admin.general.clearMetadataCache'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        type: "button",
        ...{ class: "rounded bg-red-500/20 px-4 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/30" },
    });
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-red-500/20']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-red-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-red-500/30']} */ ;
    (__VLS_unwrap(t, {})('admin.general.resetPlaybackHistory'));
    // @ts-ignore
    [t, t, t, t,];
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
