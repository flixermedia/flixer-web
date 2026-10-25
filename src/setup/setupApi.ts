import axios from 'axios'
import { api } from '../api'

export type SetupState = 'not_started' | 'in_progress' | 'completed' | 'recovery_required'
export type SetupFlow = 'quick' | 'advanced'
/** The wizard also has a recovery flow, chosen by the server's state rather than by the user. */
export type WizardFlow = SetupFlow | 'recovery'

const RECOVERY_KEY = 'flixer:setup-recovery-code'

/** Kept in this tab only: the code unlocks reconnecting the database, so it should not outlive the session. */
export function storedRecoveryCode(): string {
  try {
    return sessionStorage.getItem(RECOVERY_KEY) ?? ''
  } catch {
    return ''
  }
}

export function storeRecoveryCode(code: string): void {
  try {
    sessionStorage.setItem(RECOVERY_KEY, code.trim())
  } catch {
    // Without storage the code has to be entered again after a reload.
  }
}

export function clearRecoveryCode(): void {
  try {
    sessionStorage.removeItem(RECOVERY_KEY)
  } catch {
    // Nothing to clear.
  }
}

function recoveryHeaders(): { headers?: Record<string, string> } {
  const code = storedRecoveryCode()
  return code ? { headers: { 'x-setup-recovery-code': code } } : {}
}

export interface SetupStatus {
  state: SetupState
  mode: 'bootstrap' | 'ready'
  database: 'ok' | 'unconfigured' | 'unavailable'
  persistent: boolean
}

export interface ConfigField {
  source: 'env' | 'store' | 'default' | 'unset'
  /** Set by an environment variable, so the wizard cannot change it. */
  locked: boolean
  set: boolean
  /** Only present for values that are not secret. */
  value?: string
  default?: string
}

export interface SetupProgress extends SetupStatus {
  flow: SetupFlow
  completedSteps: string[]
  steps: { id: string; title: string; canTest: boolean }[]
  adminExists: boolean
  config: Record<string, ConfigField>
}

export interface StepResult {
  ok: boolean
  message?: string
  restart?: string[]
}

/** The answer to "does this installation need setup?". Anything that is not a clear answer is "unavailable". */
export type SetupGate = { kind: 'ready' } | { kind: 'setup'; status: SetupStatus } | { kind: 'unavailable'; reason: 'unreachable' | 'starting' | 'invalid' }

const STATES: SetupState[] = ['not_started', 'in_progress', 'completed', 'recovery_required']

function parseStatus(data: unknown): SetupStatus | null {
  if (typeof data !== 'object' || data === null) return null
  const value = data as Record<string, unknown>
  if (!STATES.includes(value.state as SetupState)) return null
  if (value.mode !== 'bootstrap' && value.mode !== 'ready') return null
  if (value.database !== 'ok' && value.database !== 'unconfigured' && value.database !== 'unavailable') return null
  return { state: value.state as SetupState, mode: value.mode, database: value.database, persistent: value.persistent === true }
}

/** Pure so it can be reasoned about on its own: a failed or malformed response never produces `setup`. */
export function classifyStatus(status: SetupStatus | null): SetupGate {
  if (!status) return { kind: 'unavailable', reason: 'invalid' }
  if (status.state === 'completed') {
    return status.mode === 'ready' && status.database === 'ok' ? { kind: 'ready' } : { kind: 'unavailable', reason: 'starting' }
  }
  return { kind: 'setup', status }
}

export async function fetchSetupGate(): Promise<SetupGate> {
  try {
    const response = await api.get<unknown>('/setup/status', { timeout: 6000 })
    return classifyStatus(parseStatus(response.data))
  } catch (error: unknown) {
    // An API that predates the wizard has no such route; it is already configured, not waiting for setup.
    if (axios.isAxiosError(error) && error.response?.status === 404) return { kind: 'ready' }
    return { kind: 'unavailable', reason: 'unreachable' }
  }
}

export async function getProgress(): Promise<SetupProgress> {
  return (await api.get<SetupProgress>('/setup/progress', { timeout: 10_000, ...recoveryHeaders() })).data
}

export async function setFlow(flow: SetupFlow): Promise<void> {
  await api.post('/setup/flow', { flow }, recoveryHeaders())
}

export async function testStep(id: string, values: Record<string, unknown>): Promise<StepResult> {
  return (await api.post<StepResult>(`/setup/steps/${id}/test`, values, { timeout: 20_000, ...recoveryHeaders() })).data
}

export async function applyStep(id: string, values: Record<string, unknown>): Promise<StepResult> {
  return (await api.post<StepResult>(`/setup/steps/${id}`, values, { timeout: 20_000, ...recoveryHeaders() })).data
}

/** Asks the server to write the setup recovery key to its log. The key is never returned here. */
export async function requestRecoveryKey(): Promise<void> {
  await api.post('/setup/recovery/request', {}, { timeout: 10_000 })
}

export async function completeSetup(): Promise<void> {
  await api.post('/setup/complete', {}, recoveryHeaders())
}

export interface SetupFailure {
  message: string
  fields: Record<string, string>
}

export function describeFailure(error: unknown, fallback: string): SetupFailure {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as { error?: unknown; message?: unknown; fields?: unknown } | undefined
    const fields = body?.fields && typeof body.fields === 'object' ? (body.fields as Record<string, string>) : {}
    const message = typeof body?.error === 'string' ? body.error : typeof body?.message === 'string' ? body.message : fallback
    return { message, fields }
  }
  return { message: fallback, fields: {} }
}
