import type { InjectionKey, Ref } from 'vue'
import type { SetupFlow, SetupProgress, WizardFlow } from './setupApi'

/** What a step can read from the wizard. Steps never reach into each other. */
export interface WizardContext {
  progress: Ref<SetupProgress>
  flow: Ref<WizardFlow>
  refresh(): Promise<void>
  chooseFlow(flow: SetupFlow): void
  /** Waits until the server has finished switching out of bootstrap mode. */
  waitUntilReady(): Promise<boolean>
  /** Runs the current step's submit and moves on if it succeeds; what Enter in a form should do. */
  advance(): Promise<void>
}

export const WIZARD_KEY: InjectionKey<WizardContext> = Symbol('flixer-wizard')

/** Every step component exposes this: the shell's Continue button calls submit() and moves on only if it returns true. */
export interface StepHandle {
  submit(): Promise<boolean>
  /** Set to false while the step needs something (a passed connection test) before the wizard may move on. */
  canContinue?: boolean
}
