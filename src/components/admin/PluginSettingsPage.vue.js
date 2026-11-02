import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { listPluginInstallations } from '../../api';
import { catchError } from '../../utils/catchError';
import PluginSettingsForm from './PluginSettingsForm.vue';
const { defineProps, } = {};
const props = defineProps();
const { t } = useI18n();
const router = useRouter();
const name = ref('');
function back() {
    void router.push({ query: { tab: 'plugins' } });
}
onMounted(async () => {
    const [error, installations] = await catchError(listPluginInstallations());
    if (error) {
        name.value = '';
    }
    else {
        name.value = installations.find((plugin) => plugin.id === props.pluginId)?.manifest.name ?? '';
    }
});
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(name, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-col gap-6" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (back) },
        type: "button",
        ...{ class: "w-fit text-sm text-flixer-muted transition hover:text-white focus-visible:outline-2 focus-visible:outline-flixer-accent" },
    });
    /** @type {__VLS_StyleScopedClasses['w-fit']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    (__VLS_unwrap(t, {})('admin.plugins.backToPlugins'));
    const __VLS_0 = PluginSettingsForm;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        pluginId: (__VLS_ctx.pluginId), title: (__VLS_unwrap(t, {})('admin.plugins.settingsTitle', { name: name.value || __VLS_ctx.pluginId })),
    }));
    const __VLS_2 = __VLS_1({
        pluginId: (__VLS_ctx.pluginId),
        title: (__VLS_unwrap(t, {})('admin.plugins.settingsTitle', { name: name.value || __VLS_ctx.pluginId })),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    // @ts-ignore
    [t, t, pluginId, pluginId, name,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
