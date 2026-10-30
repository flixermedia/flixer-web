import axios from 'axios'
import { api } from '../api'
import { catchError } from '../utils/catchError'
import type {
  FlixerApiRouteBody,
  SetupFlow,
  SetupProgress,
  SetupState,
  SetupStatus,
  SetupStepResult,
} from 'flixer-api-client'
export type {
  SetupConfigField as ConfigField,
  SetupFlow,
  SetupProgress,
  SetupState,
  SetupStatus,
  SetupStepResult as StepResult,
} from 'flixer-api-client'
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
  const [error, response] = await catchError(api.get<SetupStatus>('/setup/status', { timeout: 6000 }))
  if (error) {
    // An API that predates the wizard has no such route; it is already configured, not waiting for setup.
    if (axios.isAxiosError(error) && error.response?.status === 404) return { kind: 'ready' }
    return { kind: 'unavailable', reason: 'unreachable' }
  }
  return classifyStatus(parseStatus(response.data))
}

export async function getProgress(): Promise<SetupProgress> {
  return (await api.get<SetupProgress>('/setup/progress', { timeout: 10_000, ...recoveryHeaders() })).data
}

export async function setFlow(flow: SetupFlow): Promise<void> {
  const request: FlixerApiRouteBody<'post', '/setup/flow'> = { flow }
  await api.post('/setup/flow', request, recoveryHeaders())
}

export async function testStep(
  id: string,
  values: FlixerApiRouteBody<'post', '/setup/steps/{param}/test'>,
): Promise<SetupStepResult> {
  return (await api.post<SetupStepResult>(`/setup/steps/${id}/test`, values, { timeout: 20_000, ...recoveryHeaders() })).data
}

export async function applyStep(
  id: string,
  values: FlixerApiRouteBody<'post', '/setup/steps/{param}'>,
): Promise<SetupStepResult> {
  return (await api.post<SetupStepResult>(`/setup/steps/${id}`, values, { timeout: 20_000, ...recoveryHeaders() })).data
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
