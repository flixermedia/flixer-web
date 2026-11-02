import { computed, inject, ref } from 'vue';
import { callPluginOperation } from '../api';
import { buildActionBody, planActionOutcome, toastKind } from '../plugins/pageLogic';
import { sanitizeActionResponse } from '../plugins/viewSchema';
import { catchError } from '../utils/catchError';
import { confirmAction } from './confirm';
import { notify } from './notify';
import { describeRequestError } from './useProfile';
export const pluginViewContextKey = Symbol('pluginViewContext');
export function usePluginContext() {
    const context = inject(pluginViewContextKey);
    if (!context)
        throw new Error('Plugin view nodes must be rendered inside a plugin page');
    return context;
}
/** Runs plugin actions: confirm, call the operation, then toast/navigate/reload as the response dictates. */
export function usePluginActions(options) {
    const inFlight = ref(0);
    async function run(action, runOptions = {}) {
        const message = runOptions.confirm ?? action.confirm;
        if (message && !(await confirmAction(message, { danger: runOptions.danger })))
            return false;
        inFlight.value += 1;
        try {
            const [error, raw] = await catchError(callPluginOperation(options.pluginId(), action.op, buildActionBody(action, runOptions.values)));
            if (error) {
                notify.error(describeRequestError(error));
                return false;
            }
            let outcome;
            try {
                outcome = planActionOutcome(action, sanitizeActionResponse(raw));
            }
            catch (error) {
                notify.error(describeRequestError(error));
                return false;
            }
            if (outcome.error) {
                notify.error(outcome.error);
                return false;
            }
            if (outcome.toast)
                notify[toastKind(outcome.toast.tone)](outcome.toast.text);
            if (outcome.navigate)
                options.navigate(outcome.navigate);
            else if (outcome.reload)
                options.reload();
            return true;
        }
        finally {
            inFlight.value -= 1;
        }
    }
    return { run, busy: computed(() => inFlight.value > 0) };
}
