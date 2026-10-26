import { computed, inject, ref, type InjectionKey, type Ref } from 'vue'
import { callPluginOperation } from '../api'
import { buildActionBody, planActionOutcome, toastKind } from '../plugins/pageLogic'
import { sanitizeActionResponse } from '../plugins/viewSchema'
import type { PluginAction, PluginNav } from '../plugins/viewTypes'
import { confirmAction } from './confirm'
import { notify } from './notify'
import { describeRequestError } from './useProfile'

export interface RunOptions {
  values?: Record<string, unknown>
  confirm?: string
  danger?: boolean
}

export interface PluginViewContext {
  query: Ref<Record<string, string>>
  busy: Readonly<Ref<boolean>>
  run: (action: PluginAction, options?: RunOptions) => Promise<boolean>
  patchQuery: (patch: Record<string, string>, reset?: readonly string[]) => void
}

export const pluginViewContextKey: InjectionKey<PluginViewContext> = Symbol('pluginViewContext')

export function usePluginContext(): PluginViewContext {
  const context = inject(pluginViewContextKey)
  if (!context) throw new Error('Plugin view nodes must be rendered inside a plugin page')
  return context
}

interface ActionRunnerOptions {
  pluginId: () => string
  navigate: (nav: PluginNav) => void
  reload: () => void
}

/** Runs plugin actions: confirm, call the operation, then toast/navigate/reload as the response dictates. */
export function usePluginActions(options: ActionRunnerOptions) {
  const inFlight = ref(0)

  async function run(action: PluginAction, runOptions: RunOptions = {}): Promise<boolean> {
    const message = runOptions.confirm ?? action.confirm
    if (message && !(await confirmAction(message, { danger: runOptions.danger }))) return false

    inFlight.value += 1
    try {
      const raw = await callPluginOperation(options.pluginId(), action.op, buildActionBody(action, runOptions.values))
      const outcome = planActionOutcome(action, sanitizeActionResponse(raw))
      if (outcome.error) {
        notify.error(outcome.error)
        return false
      }
      if (outcome.toast) notify[toastKind(outcome.toast.tone)](outcome.toast.text)
      if (outcome.navigate) options.navigate(outcome.navigate)
      else if (outcome.reload) options.reload()
      return true
    } catch (error) {
      notify.error(describeRequestError(error))
      return false
    } finally {
      inFlight.value -= 1
    }
  }

  return { run, busy: computed(() => inFlight.value > 0) }
}
