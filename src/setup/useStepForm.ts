import { computed, inject, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { applyStep, describeFailure, testStep, type StepResult } from './setupApi'
import { WIZARD_KEY } from './stepContract'

/** Shared plumbing for steps that talk to one server-side step: busy state, field errors, test and save. */
export function useStepForm(stepId: string) {
  const { t } = useI18n()
  const wizard = inject(WIZARD_KEY)
  if (!wizard) throw new Error('A setup step must be rendered inside the wizard.')

  const busy = ref(false)
  const message = ref('')
  const fieldErrors = ref<Record<string, string>>({})
  const testResult = ref<{ ok: boolean; message: string } | null>(null)
  /** True once the current values passed a connection test; steps reset it when the user edits a value. */
  const verified = ref(false)

  function clear(): void {
    message.value = ''
    fieldErrors.value = {}
    testResult.value = null
  }

  async function run<T>(action: () => Promise<T>): Promise<T | null> {
    busy.value = true
    clear()
    try {
      return await action()
    } catch (error: unknown) {
      const failure = describeFailure(error, t('setup.errors.generic'))
      message.value = failure.message
      fieldErrors.value = failure.fields
      return null
    } finally {
      busy.value = false
    }
  }

  async function test(values: Record<string, unknown>): Promise<boolean> {
    verified.value = false
    const result = await run(() => testStep(stepId, values))
    if (!result) return false
    verified.value = result.ok
    testResult.value = { ok: result.ok, message: result.message ?? '' }
    return result.ok
  }

  async function save(values: Record<string, unknown>): Promise<StepResult | null> {
    const result = await run(() => applyStep(stepId, values))
    if (result) await wizard!.refresh()
    return result
  }

  return { wizard: wizard, verified, busy, message, fieldErrors, testResult, test, save, run, clear, locked: (name: string) => computed(() => wizard!.progress.value.config[name]?.locked === true) }
}
