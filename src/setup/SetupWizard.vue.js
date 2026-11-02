import { openModal } from '@kolirt/vue-modal';
import { computed, defineAsyncComponent, onMounted, provide, ref, shallowReactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import axios from 'axios';
import LanguageModal from '../components/ui/LanguageModal.vue';
import { localeCountry, localeName } from '../i18n';
import 'flag-icons/css/flag-icons.min.css';
import logo from '../../resources/logo/flixer-logo.svg';
import { stepsFor } from './registry';
import RecoveryCodePrompt from './RecoveryCodePrompt.vue';
import { clearRecoveryCode, fetchSetupGate, getProgress, requestRecoveryKey, storedRecoveryCode, storeRecoveryCode } from './setupApi';
import { WIZARD_KEY } from './stepContract';
import { catchError } from '../utils/catchError';
const { t, locale } = useI18n();
const router = useRouter();
const progress = ref(null);
const flow = ref('quick');
const recovering = ref(false);
const needCode = ref(false);
const codeMessage = ref('');
const loadError = ref(null);
const lockedMessage = ref('');
const keyRequested = ref(false);
const index = ref(0);
const reached = ref(0);
const submitting = ref(false);
const handles = shallowReactive(new Map());
const steps = computed(() => stepsFor(flow.value));
const components = computed(() => steps.value.map((step) => defineAsyncComponent(step.component)));
// Without a wizard to show (locked, failed, asking for a code) a small card reads better than an empty tall one.
const compact = computed(() => needCode.value || loadError.value !== null);
const isLast = computed(() => index.value === steps.value.length - 1);
// Steps that need a successful connection test say so; everything else can always continue.
const canContinue = computed(() => handles.get(index.value)?.canContinue !== false);
function isDone(id, current) {
    // A recovery reconnects the database again, whatever the earlier setup recorded.
    if (recovering.value)
        return false;
    if (id === 'welcome')
        return current.state !== 'not_started';
    if (id === 'admin')
        return current.adminExists;
    return current.completedSteps.includes(id);
}
/** Resume at the first step the server does not consider done, so a refresh or a second browser carries on where setup stopped. */
function firstIncomplete(current, chosen) {
    const found = stepsFor(chosen).findIndex((step) => step.id === 'finish' || step.id === 'recovered' || !isDone(step.id, current));
    return found === -1 ? 0 : found;
}
async function load() {
    loadError.value = null;
    needCode.value = false;
    const gate = await fetchSetupGate();
    recovering.value = gate.kind === 'setup' && gate.status.state === 'recovery_required';
    if (recovering.value && !storedRecoveryCode()) {
        needCode.value = true;
        return;
    }
    const [error, result] = await catchError(getProgress());
    if (error) {
        if (axios.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 429)) {
            loadError.value = 'locked';
            const body = error.response.data;
            lockedMessage.value = typeof body?.error === 'string' ? body.error : '';
        }
        else {
            loadError.value = 'failed';
        }
        return;
    }
    progress.value = result;
    flow.value = recovering.value ? 'recovery' : result.flow;
    index.value = reached.value = firstIncomplete(result, flow.value);
}
async function submitCode(code) {
    storeRecoveryCode(code);
    codeMessage.value = '';
    await load();
    if (loadError.value === 'locked') {
        clearRecoveryCode();
        codeMessage.value = lockedMessage.value;
        loadError.value = null;
        needCode.value = true;
    }
}
async function useRecoveryKey() {
    codeMessage.value = '';
    // The prompt still works if a key was already requested; a wrong or missing key is reported on submit.
    await catchError(requestRecoveryKey());
    keyRequested.value = true;
    loadError.value = null;
    needCode.value = true;
}
async function refresh() {
    const [error, result] = await catchError(getProgress());
    if (error) {
        // The server may be switching modes, or setup may have just been completed by an existing database; keep what we have.
        return;
    }
    progress.value = result;
}
async function waitUntilReady() {
    const deadline = Date.now() + 90_000;
    while (Date.now() < deadline) {
        const gate = await fetchSetupGate();
        if (gate.kind === 'ready' || (gate.kind === 'setup' && gate.status.mode === 'ready' && gate.status.database === 'ok'))
            return true;
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    return false;
}
async function advance() {
    if (submitting.value)
        return;
    submitting.value = true;
    try {
        const ok = await handles.get(index.value)?.submit();
        if (ok && index.value < steps.value.length - 1) {
            index.value += 1;
            reached.value = Math.max(reached.value, index.value);
        }
    }
    finally {
        submitting.value = false;
    }
}
function back() {
    if (index.value > 0 && !submitting.value)
        index.value -= 1;
}
function setHandle(i, instance) {
    if (instance && 'submit' in instance)
        handles.set(i, instance);
    else
        handles.delete(i);
}
const context = {
    progress: computed(() => progress.value),
    flow,
    refresh,
    chooseFlow: (next) => {
        flow.value = next;
    },
    waitUntilReady,
    advance,
};
provide(WIZARD_KEY, context);
// Keep the pane focused for keyboard and screen reader users when it changes.
const panes = ref([]);
watch(index, async () => {
    await Promise.resolve();
    panes.value[index.value]?.querySelector('input, button, [tabindex]')?.focus({ preventScroll: true });
});
function openLanguage() {
    void openModal(LanguageModal).catch(() => undefined);
}
onMounted(load);
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(compact, {});
    __VLS_withDotValue(index, {});
    __VLS_withDotValue(progress, {});
    __VLS_withDotValue(locale, {});
    __VLS_withDotValue(steps, {});
    __VLS_withDotValue(needCode, {});
    __VLS_withDotValue(keyRequested, {});
    __VLS_withDotValue(loadError, {});
    __VLS_withDotValue(router, {});
    __VLS_withDotValue(panes, {});
    __VLS_withDotValue(components, {});
    __VLS_withDotValue(submitting, {});
    __VLS_withDotValue(canContinue, {});
    __VLS_withDotValue(isLast, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({
        ...{ class: "fixed inset-0 flex items-center justify-center overflow-hidden bg-flixer-background text-flixer-text md:p-8" },
        'aria-label': (__VLS_unwrap(t, {})('setup.title')),
    });
    /** @type {__VLS_StyleScopedClasses['fixed']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:p-8']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex h-full w-full flex-col overflow-hidden bg-flixer-background md:rounded md:border md:border-flixer-border md:bg-flixer-surface md:shadow-2xl md:shadow-black/60" },
        ...{ class: (compact.value ? 'md:h-auto md:max-w-md' : 'md:h-[min(46rem,100%)] md:max-w-3xl') },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:border']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:border-flixer-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:bg-flixer-surface']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:shadow-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:shadow-black/60']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
        ...{ class: "relative flex shrink-0 flex-col gap-4 px-6 pt-6 sm:px-10" },
    });
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:px-10']} */ ;
    if (index.value === 0 && progress.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (openLanguage) },
            type: "button",
            ...{ class: "absolute top-5 right-6 flex h-9 items-center gap-2 rounded border border-flixer-border px-3 text-xs font-semibold text-flixer-text transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-flixer-accent sm:right-10" },
            'aria-label': (__VLS_unwrap(t, {})('languageModal.title')),
        });
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['top-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['right-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-9']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/5']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:right-10']} */ ;
        if (__VLS_unwrap(localeCountry, {})(locale.value)) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "fi rounded" },
                ...{ class: (`fi-${__VLS_unwrap(localeCountry, {})(locale.value)}`) },
                'aria-hidden': "true",
            });
            /** @type {__VLS_StyleScopedClasses['fi']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        }
        else {
            let __VLS_0;
            /** @ts-ignore @type { | typeof __VLS_components.Icon} */
            Icon;
            // @ts-ignore
            const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
                // @ts-ignore
                icon: "lucide:globe", ...{ class: "size-4" }, 'aria-hidden': "true",
            }));
            const __VLS_2 = __VLS_1({
                icon: "lucide:globe",
                ...{ class: "size-4" },
                'aria-hidden': "true",
            }, ...__VLS_functionalComponentArgsRest(__VLS_1));
            /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
        }
        (__VLS_unwrap(localeName, {})(locale.value));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
        src: (__VLS_unwrap(logo, {})),
        alt: "Flixer",
        ...{ class: "h-7 w-auto self-start md:h-10 md:self-center" },
    });
    /** @type {__VLS_StyleScopedClasses['h-7']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['self-start']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:h-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:self-center']} */ ;
    if (progress.value && steps.value.length > 1) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.ol, __VLS_intrinsics.ol)({
            ...{ class: "flex gap-2" },
            'aria-label': (__VLS_unwrap(t, {})('setup.progress')),
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        const __VLS_5 = __VLS_tryAsConstant((steps.value));
        for (const [step, i] of __VLS_vFor(__VLS_nonNull(__VLS_5))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                key: (step.id),
                ...{ class: "flex-1" },
                'aria-current': (i === index.value ? 'step' : undefined),
            });
            /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "block h-1 rounded-full transition-colors" },
                ...{ class: (i <= index.value ? 'bg-flixer-accent' : 'bg-flixer-border') },
            });
            /** @type {__VLS_StyleScopedClasses['block']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "mt-2 hidden text-[11px] font-medium sm:block" },
                ...{ class: (i === index.value ? 'text-flixer-text' : 'text-flixer-muted') },
            });
            /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['hidden']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-[11px]']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            /** @type {__VLS_StyleScopedClasses['sm:block']} */ ;
            (__VLS_unwrap(t, {})(step.titleKey));
            // @ts-ignore
            [t, t, t, t, compact, index, index, index, index, progress, progress, localeCountry, localeCountry, locale, locale, locale, localeName, logo, steps, steps,];
        }
    }
    if (needCode.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex flex-1 items-center justify-center px-6" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
        const __VLS_6 = RecoveryCodePrompt;
        // @ts-ignore
        const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
            // @ts-ignore
            ...{ 'onSubmit': {} }, message: (__VLS_unwrap(codeMessage, {})), title: (keyRequested.value ? __VLS_unwrap(t, {})('setup.key.title') : undefined), description: (keyRequested.value ? __VLS_unwrap(t, {})('setup.key.description') : undefined), hint: (keyRequested.value ? __VLS_unwrap(t, {})('setup.key.hint') : undefined),
        }));
        const __VLS_8 = __VLS_7({
            ...{ 'onSubmit': {} },
            message: (__VLS_unwrap(codeMessage, {})),
            title: (keyRequested.value ? __VLS_unwrap(t, {})('setup.key.title') : undefined),
            description: (keyRequested.value ? __VLS_unwrap(t, {})('setup.key.description') : undefined),
            hint: (keyRequested.value ? __VLS_unwrap(t, {})('setup.key.hint') : undefined),
        }, ...__VLS_functionalComponentArgsRest(__VLS_7));
        let __VLS_11;
        const __VLS_12 = {
            /** @type {typeof __VLS_11.submit} */
            onSubmit: (submitCode),
        };
        void __VLS_12;
        var __VLS_9;
        var __VLS_10;
    }
    else if (loadError.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex flex-col items-center gap-5 px-8 pt-6 pb-12 text-center" },
            role: "alert",
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-8']} */ ;
        /** @type {__VLS_StyleScopedClasses['pt-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['pb-12']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex max-w-sm flex-col gap-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['max-w-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
            ...{ class: "text-xl font-semibold" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        (loadError.value === 'locked' ? __VLS_unwrap(t, {})('setup.lockedTitle') : __VLS_unwrap(t, {})('setup.loadFailedTitle'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm leading-6 text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['leading-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (loadError.value === 'locked' ? __VLS_unwrap(t, {})('setup.locked') : __VLS_unwrap(t, {})('setup.loadFailed'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex gap-3" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        if (loadError.value === 'locked') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!!(needCode.value))
                            throw 0;
                        if (!(loadError.value))
                            throw 0;
                        if (!(loadError.value === 'locked'))
                            throw 0;
                        return (router.value.push({ name: 'login' }));
                        // @ts-ignore
                        [t, t, t, t, t, t, t, needCode, codeMessage, keyRequested, keyRequested, keyRequested, loadError, loadError, loadError, loadError, router,];
                    } },
                type: "button",
                ...{ class: "h-11 rounded bg-flixer-primary px-6 text-sm font-semibold text-white transition hover:brightness-110" },
            });
            /** @type {__VLS_StyleScopedClasses['h-11']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-primary']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:brightness-110']} */ ;
            (__VLS_unwrap(t, {})('setup.signIn'));
        }
        if (loadError.value === 'locked') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (useRecoveryKey) },
                type: "button",
                ...{ class: "h-11 rounded border border-flixer-border px-6 text-sm font-semibold transition hover:bg-white/5" },
            });
            /** @type {__VLS_StyleScopedClasses['h-11']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/5']} */ ;
            (__VLS_unwrap(t, {})('setup.key.use'));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (load) },
            type: "button",
            ...{ class: "h-11 rounded border border-flixer-border px-6 text-sm font-semibold transition hover:bg-white/5" },
        });
        /** @type {__VLS_StyleScopedClasses['h-11']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/5']} */ ;
        (__VLS_unwrap(t, {})('setup.retry'));
    }
    else if (!progress.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex flex-1 items-center justify-center text-sm text-flixer-muted" },
            role: "status",
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('setup.loading'));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "relative min-h-0 flex-1 overflow-hidden" },
        });
        /** @type {__VLS_StyleScopedClasses['relative']} */ ;
        /** @type {__VLS_StyleScopedClasses['min-h-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex h-full transition-transform duration-500 ease-out motion-reduce:transition-none" },
            ...{ style: ({ transform: `translateX(-${index.value * 100}%)` }) },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-transform']} */ ;
        /** @type {__VLS_StyleScopedClasses['duration-500']} */ ;
        /** @type {__VLS_StyleScopedClasses['ease-out']} */ ;
        /** @type {__VLS_StyleScopedClasses['motion-reduce:transition-none']} */ ;
        const __VLS_13 = __VLS_tryAsConstant((steps.value));
        for (const [step, i] of __VLS_vFor(__VLS_nonNull(__VLS_13))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
                key: (step.id),
                ref: ((el) => {
                    if (el)
                        panes.value[i] = el;
                }),
                ...{ class: "h-full w-full shrink-0 overflow-y-auto px-6 py-8 sm:px-10" },
                inert: (i !== index.value),
                'aria-hidden': (i !== index.value),
                'aria-label': (__VLS_unwrap(t, {})(step.titleKey)),
            });
            /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-8']} */ ;
            /** @type {__VLS_StyleScopedClasses['sm:px-10']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "w-full max-w-xl md:max-w-none" },
            });
            /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['max-w-xl']} */ ;
            /** @type {__VLS_StyleScopedClasses['md:max-w-none']} */ ;
            if (i <= __VLS_unwrap(reached, {})) {
                const __VLS_14 = (components.value[i]);
                // @ts-ignore
                const __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14({
                    // @ts-ignore
                    ref: ((el) => setHandle(i, el)),
                }));
                const __VLS_16 = __VLS_15({
                    ref: ((el) => setHandle(i, el)),
                }, ...__VLS_functionalComponentArgsRest(__VLS_15));
            }
            // @ts-ignore
            [t, t, t, t, t, index, index, index, progress, steps, loadError, panes, reached, components,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.footer, __VLS_intrinsics.footer)({
            ...{ class: "flex shrink-0 items-center justify-between gap-3 border-t border-flixer-border/60 px-6 py-4 sm:px-10" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border/60']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:px-10']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (back) },
            type: "button",
            ...{ class: "h-11 rounded px-5 text-sm font-semibold text-flixer-muted transition hover:text-flixer-text disabled:invisible" },
            disabled: (index.value === 0 || submitting.value),
        });
        /** @type {__VLS_StyleScopedClasses['h-11']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-flixer-text']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:invisible']} */ ;
        (__VLS_unwrap(t, {})('setup.back'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (advance) },
            type: "button",
            ...{ class: "h-11 min-w-32 rounded bg-flixer-primary px-6 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60" },
            disabled: (submitting.value || !canContinue.value),
        });
        /** @type {__VLS_StyleScopedClasses['h-11']} */ ;
        /** @type {__VLS_StyleScopedClasses['min-w-32']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-primary']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:brightness-110']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
        (submitting.value ? __VLS_unwrap(t, {})('setup.working') : isLast.value ? __VLS_unwrap(t, {})('setup.finish') : __VLS_unwrap(t, {})('setup.continue'));
    }
    // @ts-ignore
    [t, t, t, t, index, submitting, submitting, submitting, canContinue, isLast,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
