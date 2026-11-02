import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { listAdminUsers, listSettings, sendAdminNotification, updateSetting } from '../../api';
import { notify } from '../../composables/notify';
import { describeRequestError } from '../../composables/useProfile';
import { catchError } from '../../utils/catchError';
import AdminSection from './AdminSection.vue';
import AdminToggle from './AdminToggle.vue';
const { t } = useI18n();
const users = ref([]);
const title = ref('');
const body = ref('');
const url = ref('');
const everyone = ref(true);
const selected = ref([]);
const query = ref('');
const isSending = ref(false);
const inputClass = 'w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm outline-none transition focus:border-flixer-accent';
const filtered = computed(() => {
    const needle = query.value.trim().toLowerCase();
    return users.value.filter((user) => `${user.displayName} ${user.username}`.toLowerCase().includes(needle));
});
const urlValid = computed(() => url.value.trim() === '' || (url.value.trim().startsWith('/') && !url.value.trim().startsWith('//')));
const canSend = computed(() => title.value.trim() !== '' && body.value.trim() !== '' && urlValid.value && (everyone.value || selected.value.length > 0) && !isSending.value);
const enabled = ref(true);
const newMediaEnabled = ref(true);
const promptMode = ref('button');
const subject = ref('');
const savedSubject = ref('');
const isSavingSubject = ref(false);
async function saveSetting(key, value, revert) {
    const [error] = await catchError(updateSetting(key, value));
    if (error) {
        revert();
        notify.error(describeRequestError(error));
    }
}
function setEnabled(value) {
    const previous = enabled.value;
    enabled.value = value;
    void saveSetting('notifications_enabled', value, () => (enabled.value = previous));
}
function setNewMedia(value) {
    const previous = newMediaEnabled.value;
    newMediaEnabled.value = value;
    void saveSetting('notifications_new_media_enabled', value, () => (newMediaEnabled.value = previous));
}
function setPromptMode(value) {
    const previous = promptMode.value;
    promptMode.value = value;
    void saveSetting('notifications_permission_prompt', value, () => (promptMode.value = previous));
}
async function saveSubject() {
    isSavingSubject.value = true;
    try {
        const [error] = await catchError(updateSetting('notifications_vapid_subject', subject.value.trim()));
        if (error) {
            notify.error(describeRequestError(error));
        }
        else {
            savedSubject.value = subject.value.trim();
            notify.success(t('admin.notifications.settings.saved'));
        }
    }
    finally {
        isSavingSubject.value = false;
    }
}
onMounted(async () => {
    const [error, result] = await catchError(Promise.all([listAdminUsers(), listSettings()]));
    if (error) {
        notify.error(describeRequestError(error));
    }
    else {
        const [list, settings] = result;
        users.value = list;
        const value = (key) => settings.find((setting) => setting.key === key)?.value;
        enabled.value = value('notifications_enabled') !== false;
        newMediaEnabled.value = value('notifications_new_media_enabled') !== false;
        promptMode.value = value('notifications_permission_prompt') === 'load' ? 'load' : 'button';
        const stored = value('notifications_vapid_subject');
        subject.value = savedSubject.value = typeof stored === 'string' ? stored : '';
    }
});
function toggle(id) {
    selected.value = selected.value.includes(id) ? selected.value.filter((value) => value !== id) : [...selected.value, id];
}
async function send() {
    if (!canSend.value)
        return;
    isSending.value = true;
    try {
        const [error, result] = await catchError(sendAdminNotification({
            title: title.value.trim(),
            body: body.value.trim(),
            url: url.value.trim() || undefined,
            userIds: everyone.value ? undefined : selected.value,
        }));
        if (error) {
            notify.error(describeRequestError(error));
        }
        else {
            notify.success(t('admin.notifications.sent', { recipients: result.recipients, pushed: result.pushed }));
            title.value = '';
            body.value = '';
            url.value = '';
        }
    }
    finally {
        isSending.value = false;
    }
}
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(promptMode, {});
    __VLS_withDotValue(isSavingSubject, {});
    __VLS_withDotValue(subject, {});
    __VLS_withDotValue(savedSubject, {});
    __VLS_withDotValue(urlValid, {});
    __VLS_withDotValue(everyone, {});
    __VLS_withDotValue(selected, {});
    __VLS_withDotValue(canSend, {});
    __VLS_withDotValue(isSending, {});
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
        title: (__VLS_unwrap(t, {})('admin.notifications.settings.title')), description: (__VLS_unwrap(t, {})('admin.notifications.settings.description')),
    }));
    const __VLS_2 = __VLS_1({
        title: (__VLS_unwrap(t, {})('admin.notifications.settings.title')),
        description: (__VLS_unwrap(t, {})('admin.notifications.settings.description')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex max-w-xl flex-col gap-4" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-col divide-y divide-flixer-border" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['divide-y']} */ ;
    /** @type {__VLS_StyleScopedClasses['divide-flixer-border']} */ ;
    const __VLS_6 = AdminToggle;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
        // @ts-ignore
        ...{ 'onUpdate:modelValue': {} }, modelValue: (__VLS_unwrap(enabled, {})), label: (__VLS_unwrap(t, {})('admin.notifications.settings.enabled')), description: (__VLS_unwrap(t, {})('admin.notifications.settings.enabledHelp')),
    }));
    const __VLS_8 = __VLS_7({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (__VLS_unwrap(enabled, {})),
        label: (__VLS_unwrap(t, {})('admin.notifications.settings.enabled')),
        description: (__VLS_unwrap(t, {})('admin.notifications.settings.enabledHelp')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    let __VLS_11;
    const __VLS_12 = {
        /** @type {typeof __VLS_11.'update:modelValue'} */
        'onUpdate:modelValue': (setEnabled),
    };
    void __VLS_12;
    var __VLS_9;
    var __VLS_10;
    const __VLS_13 = AdminToggle;
    // @ts-ignore
    const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
        // @ts-ignore
        ...{ 'onUpdate:modelValue': {} }, modelValue: (__VLS_unwrap(newMediaEnabled, {})), label: (__VLS_unwrap(t, {})('admin.notifications.settings.newMedia')), description: (__VLS_unwrap(t, {})('admin.notifications.settings.newMediaHelp')),
    }));
    const __VLS_15 = __VLS_14({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (__VLS_unwrap(newMediaEnabled, {})),
        label: (__VLS_unwrap(t, {})('admin.notifications.settings.newMedia')),
        description: (__VLS_unwrap(t, {})('admin.notifications.settings.newMediaHelp')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_14));
    let __VLS_18;
    const __VLS_19 = {
        /** @type {typeof __VLS_18.'update:modelValue'} */
        'onUpdate:modelValue': (setNewMedia),
    };
    void __VLS_19;
    var __VLS_16;
    var __VLS_17;
    __VLS_asFunctionalElement1(__VLS_intrinsics.fieldset, __VLS_intrinsics.fieldset)({
        ...{ class: "flex flex-col gap-2 text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.legend, __VLS_intrinsics.legend)({
        ...{ class: "mb-1 font-medium" },
    });
    /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    (__VLS_unwrap(t, {})('admin.notifications.settings.prompt'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "flex items-start gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (...[$event]) => {
                void $event;
                return (setPromptMode('button'));
                // @ts-ignore
                [t, t, t, t, t, t, t, enabled, newMediaEnabled,];
            } },
        type: "radio",
        name: "prompt",
        ...{ class: "mt-1 accent-flixer-accent" },
        checked: (promptMode.value === 'button'),
    });
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['accent-flixer-accent']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_unwrap(t, {})('admin.notifications.settings.promptButton'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "block text-xs text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('admin.notifications.settings.promptButtonHelp'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "flex items-start gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (...[$event]) => {
                void $event;
                return (setPromptMode('load'));
                // @ts-ignore
                [t, t, promptMode,];
            } },
        type: "radio",
        name: "prompt",
        ...{ class: "mt-1 accent-flixer-accent" },
        checked: (promptMode.value === 'load'),
    });
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['accent-flixer-accent']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_unwrap(t, {})('admin.notifications.settings.promptLoad'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "block text-xs text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('admin.notifications.settings.promptLoadHelp'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (saveSubject) },
        ...{ class: "flex flex-col gap-1 text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "vapid-subject",
    });
    (__VLS_unwrap(t, {})('admin.notifications.settings.subject'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        id: "vapid-subject",
        placeholder: "mailto:admin@example.com",
        ...{ class: (__VLS_unwrap(inputClass, {})) },
    });
    (subject.value);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        type: "submit",
        disabled: (isSavingSubject.value || subject.value.trim() === savedSubject.value),
        ...{ class: "shrink-0 rounded bg-flixer-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60" },
    });
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-primary']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-flixer-primary/80']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
    (__VLS_unwrap(t, {})('admin.notifications.settings.save'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "text-xs text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    (__VLS_unwrap(t, {})('admin.notifications.settings.subjectHelp'));
    // @ts-ignore
    [t, t, t, t, t, promptMode, inputClass, subject, subject, isSavingSubject, savedSubject,];
    const __VLS_20 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('admin.notifications.title')), description: (__VLS_unwrap(t, {})('admin.notifications.description')),
    }));
    const __VLS_22 = __VLS_21({
        title: (__VLS_unwrap(t, {})('admin.notifications.title')),
        description: (__VLS_unwrap(t, {})('admin.notifications.description')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    var __VLS_23;
    const { default: __VLS_25 } = __VLS_nonNull(__VLS_23.slots);
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (send) },
        ...{ class: "flex max-w-xl flex-col gap-4" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "flex flex-col gap-1 text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    (__VLS_unwrap(t, {})('admin.notifications.titleLabel'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        maxlength: "120",
        required: true,
        ...{ class: (__VLS_unwrap(inputClass, {})) },
    });
    (__VLS_unwrap(title, {}));
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "flex flex-col gap-1 text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    (__VLS_unwrap(t, {})('admin.notifications.bodyLabel'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        value: (__VLS_unwrap(body, {})),
        maxlength: "500",
        rows: "3",
        required: true,
        ...{ class: (__VLS_unwrap(inputClass, {})) },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "flex flex-col gap-1 text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    (__VLS_unwrap(t, {})('admin.notifications.urlLabel'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        placeholder: "/search",
        ...{ class: (__VLS_unwrap(inputClass, {})) },
    });
    (__VLS_unwrap(url, {}));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "text-xs" },
        ...{ class: (urlValid.value ? 'text-flixer-muted' : 'text-red-400') },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    (urlValid.value ? __VLS_unwrap(t, {})('admin.notifications.urlHelp') : __VLS_unwrap(t, {})('admin.notifications.invalidUrl'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.fieldset, __VLS_intrinsics.fieldset)({
        ...{ class: "flex flex-col gap-2 text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.legend, __VLS_intrinsics.legend)({
        ...{ class: "mb-1" },
    });
    /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
    (__VLS_unwrap(t, {})('admin.notifications.recipients'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "flex items-center gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "radio",
        value: (true),
        ...{ class: "accent-flixer-accent" },
    });
    (everyone.value);
    /** @type {__VLS_StyleScopedClasses['accent-flixer-accent']} */ ;
    (__VLS_unwrap(t, {})('admin.notifications.everyone'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "flex items-center gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "radio",
        value: (false),
        ...{ class: "accent-flixer-accent" },
    });
    (everyone.value);
    /** @type {__VLS_StyleScopedClasses['accent-flixer-accent']} */ ;
    (__VLS_unwrap(t, {})('admin.notifications.selected'));
    if (!everyone.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex flex-col gap-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "search",
            placeholder: (__VLS_unwrap(t, {})('admin.notifications.searchUsers')),
            ...{ class: (__VLS_unwrap(inputClass, {})) },
        });
        (__VLS_unwrap(query, {}));
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (selected.value.length === 0 ? __VLS_unwrap(t, {})('admin.notifications.noUsers') : __VLS_unwrap(t, {})('admin.notifications.selectedCount', { count: selected.value.length }));
        __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
            ...{ class: "max-h-60 overflow-y-auto rounded border border-flixer-border" },
        });
        /** @type {__VLS_StyleScopedClasses['max-h-60']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        const __VLS_26 = __VLS_tryAsConstant((__VLS_unwrap(filtered, {})));
        for (const [user] of __VLS_vFor(__VLS_nonNull(__VLS_26))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                key: (user.id),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "flex cursor-pointer items-center gap-3 px-3 py-2 text-sm transition hover:bg-white/5" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/5']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                ...{ onChange: (...[$event]) => {
                        void $event;
                        if (!(!everyone.value))
                            throw 0;
                        return (toggle(user.id));
                        // @ts-ignore
                        [t, t, t, t, t, t, t, t, t, t, t, t, t, inputClass, inputClass, inputClass, inputClass, title, body, url, urlValid, urlValid, everyone, everyone, everyone, query, selected, selected, filtered,];
                    } },
                type: "checkbox",
                ...{ class: "accent-flixer-accent" },
                checked: (selected.value.includes(user.id)),
            });
            /** @type {__VLS_StyleScopedClasses['accent-flixer-accent']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "font-medium" },
            });
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            (user.displayName);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (user.username);
            // @ts-ignore
            [selected,];
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        type: "submit",
        disabled: (!canSend.value),
        ...{ class: "rounded bg-flixer-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60" },
    });
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-primary']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-flixer-primary/80']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
    (isSending.value ? __VLS_unwrap(t, {})('admin.notifications.sending') : __VLS_unwrap(t, {})('admin.notifications.send'));
    // @ts-ignore
    [t, t, canSend, isSending,];
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
