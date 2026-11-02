import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { addPluginRepository, disablePlugin, discoverPlugins, enablePlugin, installPlugin as installPluginRequest, listPluginInstallations, listPluginRepositories, listPluginUpdateHistory, refreshPluginRepository, removePluginRepository, uninstallPlugin } from '../../api';
import { confirmAction } from '../../composables/confirm';
import { notify } from '../../composables/notify';
import { refreshPluginPages } from '../../composables/usePluginPages';
import { describeRequestError } from '../../composables/useProfile';
import { catchError } from '../../utils/catchError';
import AdminSection from './AdminSection.vue';
const { t } = useI18n();
const router = useRouter();
const installations = ref([]);
const repositories = ref([]);
const catalog = ref([]);
const updateHistory = ref({});
const historyOpen = ref([]);
const historyLoading = ref(null);
const name = ref('');
const url = ref('');
const query = ref('');
const target = ref('');
const capability = ref('');
const isLoading = ref(false);
const isSaving = ref(false);
const refreshing = ref(null);
const installing = ref(null);
const updating = ref(null);
const loadError = ref('');
const inputClass = 'w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm outline-none focus:border-flixer-accent';
const buttonClass = 'rounded bg-flixer-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60';
const quietButtonClass = 'rounded border border-flixer-border px-3 py-2 text-sm font-semibold transition hover:bg-white/5 disabled:opacity-60';
async function load() {
    isLoading.value = true;
    loadError.value = '';
    try {
        const [error, result] = await catchError(Promise.all([listPluginInstallations(), listPluginRepositories(), discoverPlugins({ q: query.value || undefined, target: target.value || undefined, capability: capability.value || undefined })]));
        if (error) {
            loadError.value = describeRequestError(error);
        }
        else {
            ;
            [installations.value, repositories.value, catalog.value] = result;
        }
    }
    finally {
        isLoading.value = false;
    }
}
async function refreshRepository(repository) {
    refreshing.value = repository.id;
    try {
        const [error] = await catchError(refreshPluginRepository(repository.id));
        if (error)
            notify.error(describeRequestError(error));
    }
    finally {
        refreshing.value = null;
        await load();
    }
}
async function install(plugin, version) {
    const repositoryId = plugin.repository?.id;
    if (!repositoryId)
        return;
    const permissions = plugin.permissions ?? [];
    if (permissions.length &&
        !(await confirmAction(t('admin.plugins.confirmInstall', {
            name: plugin.name,
            version,
            permissions: permissions.join(', '),
        }))))
        return;
    installing.value = `${plugin.id}:${version}`;
    try {
        const [error] = await catchError(installPluginRequest(plugin.id, { repositoryId, version, approvedPermissions: permissions }));
        if (error) {
            notify.error(describeRequestError(error));
        }
        else {
            await load();
            void refreshPluginPages();
            notify.success(t('admin.plugins.installedSuccess', { name: plugin.name }));
        }
    }
    finally {
        installing.value = null;
    }
}
async function updateInstalled(plugin) {
    const update = plugin.availableUpdate;
    if (!update || !plugin.repository)
        return;
    if (plugin.enabled) {
        notify.error(t('admin.plugins.disableBeforeUpdate'));
        return;
    }
    const newlyRequested = update.permissions.filter((permission) => !plugin.approvedPermissions.includes(permission));
    if (!(await confirmAction(t('admin.plugins.confirmUpdate', {
        name: plugin.manifest.name,
        version: update.version,
        permissions: newlyRequested.length ? newlyRequested.join(', ') : t('admin.plugins.noNewPermissions'),
    }))))
        return;
    updating.value = plugin.id;
    try {
        const [error] = await catchError(installPluginRequest(plugin.id, {
            repositoryId: plugin.repository.id,
            version: update.version,
            approvedPermissions: [...new Set([...plugin.approvedPermissions, ...update.permissions])],
        }));
        if (error) {
            notify.error(describeRequestError(error));
        }
        else {
            await load();
            void refreshPluginPages();
            notify.success(t('admin.plugins.updatedSuccess', { name: plugin.manifest.name }));
        }
    }
    finally {
        updating.value = null;
    }
}
async function setEnabled(plugin, enabled) {
    if (!enabled && !(await confirmAction(t('admin.plugins.confirmDisable', { name: plugin.manifest.name }))))
        return;
    const [error] = await catchError(enabled ? enablePlugin(plugin.id) : disablePlugin(plugin.id));
    if (error) {
        notify.error(describeRequestError(error));
    }
    else {
        await load();
        void refreshPluginPages();
    }
}
async function uninstall(plugin) {
    if (!(await confirmAction(t('admin.plugins.confirmUninstall', { name: plugin.manifest.name }), { danger: true })))
        return;
    const [error] = await catchError(uninstallPlugin(plugin.id));
    if (error) {
        notify.error(describeRequestError(error));
    }
    else {
        await load();
        void refreshPluginPages();
    }
}
async function toggleHistory(plugin) {
    if (historyOpen.value.includes(plugin.id)) {
        historyOpen.value = historyOpen.value.filter((id) => id !== plugin.id);
        return;
    }
    historyOpen.value = [...historyOpen.value, plugin.id];
    historyLoading.value = plugin.id;
    try {
        const [error, history] = await catchError(listPluginUpdateHistory(plugin.id));
        if (error) {
            notify.error(describeRequestError(error));
            historyOpen.value = historyOpen.value.filter((id) => id !== plugin.id);
        }
        else {
            updateHistory.value[plugin.id] = history;
        }
    }
    finally {
        historyLoading.value = null;
    }
}
function openSettings(plugin) {
    void router.push({ query: { tab: 'plugins', plugin: plugin.id } });
}
async function addRepository() {
    isSaving.value = true;
    try {
        const [error] = await catchError(addPluginRepository(name.value, url.value));
        if (error) {
            notify.error(describeRequestError(error));
        }
        else {
            name.value = '';
            url.value = '';
            await load();
            notify.success(t('admin.plugins.repositoryAdded'));
        }
    }
    finally {
        isSaving.value = false;
    }
}
async function removeRepository(repository) {
    if (repository.isOfficial)
        return;
    if (!(await confirmAction(t('admin.plugins.confirmRemove', { name: repository.name }), { danger: true })))
        return;
    const [error] = await catchError(removePluginRepository(repository.id));
    if (error) {
        notify.error(describeRequestError(error));
    }
    else {
        await load();
    }
}
onMounted(load);
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(loadError, {});
    __VLS_withDotValue(isLoading, {});
    __VLS_withDotValue(installations, {});
    __VLS_withDotValue(updating, {});
    __VLS_withDotValue(historyOpen, {});
    __VLS_withDotValue(historyLoading, {});
    __VLS_withDotValue(updateHistory, {});
    __VLS_withDotValue(isSaving, {});
    __VLS_withDotValue(name, {});
    __VLS_withDotValue(url, {});
    __VLS_withDotValue(repositories, {});
    __VLS_withDotValue(refreshing, {});
    __VLS_withDotValue(catalog, {});
    __VLS_withDotValue(installing, {});
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
        title: (__VLS_unwrap(t, {})('admin.plugins.installed')), description: (__VLS_unwrap(t, {})('admin.plugins.installedDescription')),
    }));
    const __VLS_2 = __VLS_1({
        title: (__VLS_unwrap(t, {})('admin.plugins.installed')),
        description: (__VLS_unwrap(t, {})('admin.plugins.installedDescription')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    if (loadError.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex flex-wrap items-center justify-between gap-3 text-sm text-red-300" },
            role: "alert",
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (loadError.value);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (load) },
            ...{ class: (__VLS_unwrap(quietButtonClass, {})) },
            type: "button",
        });
        (__VLS_unwrap(t, {})('admin.plugins.retry'));
    }
    else if (isLoading.value && installations.value.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm text-flixer-muted" },
            role: "status",
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.plugins.loading'));
    }
    else if (installations.value.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.plugins.noInstalled'));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
            ...{ class: "divide-y divide-flixer-border" },
            'aria-label': "Installed plugins",
        });
        /** @type {__VLS_StyleScopedClasses['divide-y']} */ ;
        /** @type {__VLS_StyleScopedClasses['divide-flixer-border']} */ ;
        const __VLS_6 = __VLS_tryAsConstant((installations.value));
        for (const [plugin] of __VLS_vFor(__VLS_nonNull(__VLS_6))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                key: (plugin.id),
                ...{ class: "flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0 last:pb-0" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['first:pt-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['last:pb-0']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "min-w-0" },
            });
            /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex flex-wrap items-baseline gap-x-2 gap-y-1" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-baseline']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-x-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-y-1']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
                ...{ class: "font-semibold" },
            });
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            (plugin.manifest.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (plugin.id);
            (plugin.version);
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mt-1 text-sm text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (plugin.manifest.description);
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mt-1 text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.plugins.byAuthor', { author: plugin.manifest.author }));
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "mx-1" },
            });
            /** @type {__VLS_StyleScopedClasses['mx-1']} */ ;
            (Object.keys(plugin.manifest.targets).join(', '));
            if (plugin.repository) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "mx-1" },
                });
                /** @type {__VLS_StyleScopedClasses['mx-1']} */ ;
            }
            (plugin.repository?.name);
            if (plugin.activationReason) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "mt-2 text-xs text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (plugin.activationReason);
            }
            if (Object.keys(plugin.targetStatus).length) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-x-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-y-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                const __VLS_7 = __VLS_tryAsConstant((plugin.targetStatus));
                for (const [state, target] of __VLS_vFor(__VLS_nonNull(__VLS_7))) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        key: (target),
                    });
                    (__VLS_unwrap(t, {})('admin.plugins.targetState', { target, state }));
                    // @ts-ignore
                    [t, t, t, t, t, t, t, loadError, loadError, quietButtonClass, isLoading, installations, installations, installations,];
                }
            }
            if (plugin.lastError) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "mt-2 text-sm text-red-300" },
                    role: "status",
                });
                /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
                (plugin.lastError);
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex shrink-0 flex-wrap items-center gap-2" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "rounded border border-flixer-border px-2 py-1 text-xs capitalize" },
                'data-status': (plugin.status),
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['capitalize']} */ ;
            (plugin.status);
            if (plugin.activationSupported && !plugin.enabled) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!!(loadError.value))
                                throw 0;
                            if (!!(isLoading.value && installations.value.length === 0))
                                throw 0;
                            if (!!(installations.value.length === 0))
                                throw 0;
                            if (!(plugin.activationSupported && !plugin.enabled))
                                throw 0;
                            return (setEnabled(plugin, true));
                            // @ts-ignore
                            [];
                        } },
                    ...{ class: (__VLS_unwrap(quietButtonClass, {})) },
                    type: "button",
                });
                (__VLS_unwrap(t, {})('admin.plugins.enable'));
            }
            if (plugin.enabled) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!!(loadError.value))
                                throw 0;
                            if (!!(isLoading.value && installations.value.length === 0))
                                throw 0;
                            if (!!(installations.value.length === 0))
                                throw 0;
                            if (!(plugin.enabled))
                                throw 0;
                            return (setEnabled(plugin, false));
                            // @ts-ignore
                            [t, quietButtonClass,];
                        } },
                    ...{ class: (__VLS_unwrap(quietButtonClass, {})) },
                    type: "button",
                });
                (__VLS_unwrap(t, {})('admin.plugins.disable'));
            }
            if (plugin.availableUpdate) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!!(loadError.value))
                                throw 0;
                            if (!!(isLoading.value && installations.value.length === 0))
                                throw 0;
                            if (!!(installations.value.length === 0))
                                throw 0;
                            if (!(plugin.availableUpdate))
                                throw 0;
                            return (updateInstalled(plugin));
                            // @ts-ignore
                            [t, quietButtonClass,];
                        } },
                    ...{ class: (__VLS_unwrap(quietButtonClass, {})) },
                    type: "button",
                    disabled: (updating.value === plugin.id || plugin.enabled),
                });
                (updating.value === plugin.id ? __VLS_unwrap(t, {})('admin.plugins.updating') : `${__VLS_unwrap(t, {})('admin.plugins.update')} ${plugin.availableUpdate.version}`);
            }
            if (plugin.manifest.settingsSchema) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!!(loadError.value))
                                throw 0;
                            if (!!(isLoading.value && installations.value.length === 0))
                                throw 0;
                            if (!!(installations.value.length === 0))
                                throw 0;
                            if (!(plugin.manifest.settingsSchema))
                                throw 0;
                            return (openSettings(plugin));
                            // @ts-ignore
                            [t, t, quietButtonClass, updating, updating,];
                        } },
                    ...{ class: (__VLS_unwrap(quietButtonClass, {})) },
                    type: "button",
                });
                (__VLS_unwrap(t, {})('admin.plugins.settings'));
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!!(loadError.value))
                            throw 0;
                        if (!!(isLoading.value && installations.value.length === 0))
                            throw 0;
                        if (!!(installations.value.length === 0))
                            throw 0;
                        return (toggleHistory(plugin));
                        // @ts-ignore
                        [t, quietButtonClass,];
                    } },
                ...{ class: (__VLS_unwrap(quietButtonClass, {})) },
                type: "button",
                'aria-expanded': (historyOpen.value.includes(plugin.id)),
            });
            (historyLoading.value === plugin.id ? __VLS_unwrap(t, {})('admin.plugins.historyLoading') : __VLS_unwrap(t, {})('admin.plugins.history'));
            if (!plugin.enabled) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!!(loadError.value))
                                throw 0;
                            if (!!(isLoading.value && installations.value.length === 0))
                                throw 0;
                            if (!!(installations.value.length === 0))
                                throw 0;
                            if (!(!plugin.enabled))
                                throw 0;
                            return (uninstall(plugin));
                            // @ts-ignore
                            [t, t, quietButtonClass, historyOpen, historyLoading,];
                        } },
                    ...{ class: (__VLS_unwrap(quietButtonClass, {})) },
                    type: "button",
                });
                (__VLS_unwrap(t, {})('admin.plugins.uninstall'));
            }
            if (historyOpen.value.includes(plugin.id)) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.ol, __VLS_intrinsics.ol)({
                    ...{ class: "mt-4 w-full border-t border-flixer-border pt-3 text-sm" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
                /** @type {__VLS_StyleScopedClasses['pt-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                if (!updateHistory.value[plugin.id]?.length) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                        ...{ class: "text-flixer-muted" },
                    });
                    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                    (__VLS_unwrap(t, {})('admin.plugins.noHistory'));
                }
                const __VLS_8 = __VLS_tryAsConstant((updateHistory.value[plugin.id]));
                for (const [entry] of __VLS_vFor(__VLS_nonNull(__VLS_8))) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                        key: (entry.id),
                        ...{ class: "py-2 first:pt-0" },
                    });
                    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
                    /** @type {__VLS_StyleScopedClasses['first:pt-0']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "flex flex-wrap items-baseline gap-x-2 gap-y-1" },
                    });
                    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
                    /** @type {__VLS_StyleScopedClasses['items-baseline']} */ ;
                    /** @type {__VLS_StyleScopedClasses['gap-x-2']} */ ;
                    /** @type {__VLS_StyleScopedClasses['gap-y-1']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "font-medium capitalize" },
                    });
                    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
                    /** @type {__VLS_StyleScopedClasses['capitalize']} */ ;
                    (entry.action);
                    (entry.outcome);
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "text-flixer-muted" },
                    });
                    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                    (entry.fromVersion ? `${entry.fromVersion} → ` : '');
                    (entry.toVersion);
                    __VLS_asFunctionalElement1(__VLS_intrinsics.time, __VLS_intrinsics.time)({
                        ...{ class: "text-xs text-flixer-muted" },
                        datetime: (entry.createdAt),
                    });
                    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                    (new Date(entry.createdAt).toLocaleString());
                    if (entry.errorMessage) {
                        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                            ...{ class: "mt-1 text-sm text-red-300" },
                        });
                        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
                        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                        /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
                        (entry.errorMessage);
                    }
                    // @ts-ignore
                    [t, t, quietButtonClass, historyOpen, updateHistory, updateHistory,];
                }
            }
            // @ts-ignore
            [];
        }
    }
    // @ts-ignore
    [];
    const __VLS_9 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_10 = __VLS_asFunctionalComponent1(__VLS_9, new __VLS_9({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('admin.plugins.repositories')), description: (__VLS_unwrap(t, {})('admin.plugins.repositoriesDescription')),
    }));
    const __VLS_11 = __VLS_10({
        title: (__VLS_unwrap(t, {})('admin.plugins.repositories')),
        description: (__VLS_unwrap(t, {})('admin.plugins.repositoriesDescription')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_10));
    var __VLS_12;
    const { default: __VLS_14 } = __VLS_nonNull(__VLS_12.slots);
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (addRepository) },
        ...{ class: "grid gap-3 sm:grid-cols-[minmax(10rem,0.7fr)_minmax(16rem,1.3fr)_auto] sm:items-end" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:grid-cols-[minmax(10rem,0.7fr)_minmax(16rem,1.3fr)_auto]']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:items-end']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "grid gap-1 text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_unwrap(t, {})('admin.plugins.repositoryName'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ class: (__VLS_unwrap(inputClass, {})) },
        maxlength: "120",
        required: true,
        autocomplete: "off",
    });
    (name.value);
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "grid gap-1 text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_unwrap(t, {})('admin.plugins.repositoryUrl'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ class: (__VLS_unwrap(inputClass, {})) },
        type: "url",
        maxlength: "2048",
        placeholder: "https://example.org/plugins/repository.json",
        required: true,
        autocomplete: "url",
    });
    (url.value);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ class: (__VLS_unwrap(buttonClass, {})) },
        type: "submit",
        disabled: (isSaving.value || !name.value.trim() || !url.value.trim()),
    });
    (isSaving.value ? __VLS_unwrap(t, {})('admin.plugins.saving') : __VLS_unwrap(t, {})('admin.plugins.addRepository'));
    if (isLoading.value && repositories.value.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-5 text-sm text-flixer-muted" },
            role: "status",
        });
        /** @type {__VLS_StyleScopedClasses['mt-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.plugins.loading'));
    }
    else if (repositories.value.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-5 text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('admin.plugins.noRepositories'));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
            ...{ class: "mt-5 divide-y divide-flixer-border" },
            'aria-label': (__VLS_unwrap(t, {})('admin.plugins.repositories')),
        });
        /** @type {__VLS_StyleScopedClasses['mt-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['divide-y']} */ ;
        /** @type {__VLS_StyleScopedClasses['divide-flixer-border']} */ ;
        const __VLS_15 = __VLS_tryAsConstant((repositories.value));
        for (const [repository] of __VLS_vFor(__VLS_nonNull(__VLS_15))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                key: (repository.id),
                ...{ class: "flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['first:pt-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['last:pb-0']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "min-w-0" },
            });
            /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex flex-wrap items-center gap-2" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
                ...{ class: "font-medium" },
            });
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            (repository.name);
            if (repository.isOfficial) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "rounded border border-flixer-accent px-2 py-0.5 text-xs text-flixer-accent" },
                });
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['border']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-flixer-accent']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
                (__VLS_unwrap(t, {})('admin.plugins.official'));
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mt-1 break-all text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['break-all']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (repository.url);
            if (repository.lastError) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "mt-1 text-sm text-red-300" },
                    role: "status",
                });
                /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
                (repository.lastError);
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex shrink-0 gap-2" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!!(isLoading.value && repositories.value.length === 0))
                            throw 0;
                        if (!!(repositories.value.length === 0))
                            throw 0;
                        return (refreshRepository(repository));
                        // @ts-ignore
                        [t, t, t, t, t, t, t, t, t, t, isLoading, inputClass, inputClass, name, name, url, url, buttonClass, isSaving, isSaving, repositories, repositories, repositories,];
                    } },
                ...{ class: (__VLS_unwrap(quietButtonClass, {})) },
                type: "button",
                disabled: (refreshing.value === repository.id),
            });
            (refreshing.value === repository.id ? __VLS_unwrap(t, {})('admin.plugins.refreshing') : __VLS_unwrap(t, {})('admin.plugins.refresh'));
            if (!repository.isOfficial) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!!(isLoading.value && repositories.value.length === 0))
                                throw 0;
                            if (!!(repositories.value.length === 0))
                                throw 0;
                            if (!(!repository.isOfficial))
                                throw 0;
                            return (removeRepository(repository));
                            // @ts-ignore
                            [t, t, quietButtonClass, refreshing, refreshing,];
                        } },
                    ...{ class: (__VLS_unwrap(quietButtonClass, {})) },
                    type: "button",
                });
                (__VLS_unwrap(t, {})('admin.plugins.removeRepository'));
            }
            // @ts-ignore
            [t, quietButtonClass,];
        }
    }
    // @ts-ignore
    [];
    const __VLS_16 = AdminSection || AdminSection;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent1(__VLS_16, new __VLS_16({
        // @ts-ignore
        title: (__VLS_unwrap(t, {})('admin.plugins.discover')), description: (__VLS_unwrap(t, {})('admin.plugins.discoverDescription')),
    }));
    const __VLS_18 = __VLS_17({
        title: (__VLS_unwrap(t, {})('admin.plugins.discover')),
        description: (__VLS_unwrap(t, {})('admin.plugins.discoverDescription')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    var __VLS_19;
    const { default: __VLS_21 } = __VLS_nonNull(__VLS_19.slots);
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (load) },
        ...{ class: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:grid-cols-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:items-end']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "grid gap-1 text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_unwrap(t, {})('admin.plugins.search'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ class: (__VLS_unwrap(inputClass, {})) },
        type: "search",
        maxlength: "100",
        autocomplete: "off",
    });
    (__VLS_unwrap(query, {}));
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "grid gap-1 text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_unwrap(t, {})('admin.plugins.target'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_unwrap(target, {})),
        ...{ class: (__VLS_unwrap(inputClass, {})) },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    (__VLS_unwrap(t, {})('admin.plugins.allTargets'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "flixer",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "flixer-indexer",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "flixer-streamer",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "flixer-web",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "grid gap-1 text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_unwrap(t, {})('admin.plugins.capability'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ class: (__VLS_unwrap(inputClass, {})) },
        maxlength: "100",
        autocomplete: "off",
    });
    (__VLS_unwrap(capability, {}));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ class: (__VLS_unwrap(quietButtonClass, {})) },
        type: "submit",
        disabled: (isLoading.value),
    });
    (__VLS_unwrap(t, {})('admin.plugins.search'));
    if (catalog.value.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-5 text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (isLoading.value ? __VLS_unwrap(t, {})('admin.plugins.loading') : __VLS_unwrap(t, {})('admin.plugins.noAvailable'));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
            ...{ class: "mt-5 divide-y divide-flixer-border" },
            'aria-label': (__VLS_unwrap(t, {})('admin.plugins.discover')),
        });
        /** @type {__VLS_StyleScopedClasses['mt-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['divide-y']} */ ;
        /** @type {__VLS_StyleScopedClasses['divide-flixer-border']} */ ;
        const __VLS_22 = __VLS_tryAsConstant((catalog.value));
        for (const [plugin] of __VLS_vFor(__VLS_nonNull(__VLS_22))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                key: (`${plugin.repository?.id}:${plugin.id}`),
                ...{ class: "py-4 first:pt-0 last:pb-0" },
            });
            /** @type {__VLS_StyleScopedClasses['py-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['first:pt-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['last:pb-0']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex flex-wrap items-start justify-between gap-3" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "min-w-0" },
            });
            /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex flex-wrap items-baseline gap-x-2 gap-y-1" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-baseline']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-x-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-y-1']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
                ...{ class: "font-semibold" },
            });
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            (plugin.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (plugin.id);
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mt-1 text-sm text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (plugin.description);
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mt-1 text-xs text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('admin.plugins.byAuthor', { author: plugin.author }));
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "mx-1" },
            });
            /** @type {__VLS_StyleScopedClasses['mx-1']} */ ;
            (plugin.repository?.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "mx-1" },
            });
            /** @type {__VLS_StyleScopedClasses['mx-1']} */ ;
            (plugin.targets.join(', '));
            if (plugin.capabilities?.length) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "mt-1 text-xs text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (plugin.capabilities.join(', '));
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex shrink-0 flex-wrap items-center gap-2" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            if (installations.value.some((installed) => installed.id === plugin.id)) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "text-xs text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (__VLS_unwrap(t, {})('admin.plugins.alreadyInstalled'));
            }
            else {
                const __VLS_23 = __VLS_tryAsConstant((plugin.versions));
                for (const [release] of __VLS_vFor(__VLS_nonNull(__VLS_23))) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.template)({
                        key: (release.version),
                    });
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "text-xs text-flixer-muted" },
                    });
                    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                    (release.version);
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                void $event;
                                if (!!(catalog.value.length === 0))
                                    throw 0;
                                if (!!(installations.value.some((installed) => installed.id === plugin.id)))
                                    throw 0;
                                return (install(plugin, release.version));
                                // @ts-ignore
                                [t, t, t, t, t, t, t, t, t, t, t, t, quietButtonClass, isLoading, isLoading, installations, inputClass, inputClass, inputClass, query, target, capability, catalog, catalog,];
                            } },
                        ...{ class: (__VLS_unwrap(quietButtonClass, {})) },
                        type: "button",
                        disabled: (installing.value === `${plugin.id}:${release.version}`),
                    });
                    (installing.value === `${plugin.id}:${release.version}` ? __VLS_unwrap(t, {})('admin.plugins.installing') : __VLS_unwrap(t, {})('admin.plugins.install'));
                    // @ts-ignore
                    [t, t, quietButtonClass, installing, installing,];
                }
            }
            // @ts-ignore
            [];
        }
    }
    // @ts-ignore
    [];
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
