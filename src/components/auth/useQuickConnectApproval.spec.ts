import { AxiosError, AxiosHeaders } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { decideQuickConnect, getQuickConnectStatus } from '../../api/auth'
import { useQuickConnectApproval } from './useQuickConnectApproval'

vi.mock('../../api/auth', () => ({ getQuickConnectStatus: vi.fn(), decideQuickConnect: vi.fn() }))
const status = vi.mocked(getQuickConnectStatus)
const decision = vi.mocked(decideQuickConnect)
const translate = (key: string) => key
const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

beforeEach(() => {
  vi.resetAllMocks()
  status.mockResolvedValue({ enabled: true })
  decision.mockResolvedValue(undefined)
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})
afterEach(() => vi.restoreAllMocks())

describe('useQuickConnectApproval', () => {
  it.each(['approve', 'deny'] as const)('submits %s once and retains the result', async (action) => {
    const state = useQuickConnectApproval('abcd-2345', translate)
    await flush()
    expect(state.userCode.value).toBe('ABCD-2345')
    await state.decide(action)
    await state.decide(action)
    expect(decision).toHaveBeenCalledOnce()
    expect(decision).toHaveBeenCalledWith('ABCD-2345', action)
    expect(state.decisionComplete.value).toBe(true)
    expect(state.message.value).toBe(action === 'approve' ? 'auth.quickConnectApproved' : 'auth.quickConnectDenied')
  })

  it('prevents decisions while disabled, empty, or still submitting', async () => {
    status.mockResolvedValueOnce({ enabled: false })
    const disabled = useQuickConnectApproval('ABCD2345', translate)
    await flush()
    await disabled.decide('approve')
    expect(decision).not.toHaveBeenCalled()

    const state = useQuickConnectApproval('', translate)
    await flush()
    await state.decide('approve')
    expect(decision).not.toHaveBeenCalled()
    state.userCode.value = 'ABCD2345'
    let finish!: () => void
    decision.mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve }))
    const pending = state.decide('approve')
    await state.decide('deny')
    expect(decision).toHaveBeenCalledOnce()
    finish()
    await pending
  })

  it('reports a status failure without offering a decision', async () => {
    status.mockRejectedValueOnce(new Error('offline'))
    const state = useQuickConnectApproval('ABCD2345', translate)
    await flush()
    expect(state.isLoadingStatus.value).toBe(false)
    expect(state.message.value).toBe('auth.quickConnectStatusError')
    await state.decide('approve')
    expect(decision).not.toHaveBeenCalled()
  })

  it.each([
    [400, 'auth.quickConnectDecisionError'],
    [404, 'auth.quickConnectDecisionError'],
    [403, 'auth.quickConnectDisabled'],
    [429, 'auth.quickConnectRateLimited'],
    [500, 'auth.quickConnectRequestError'],
  ])('reports HTTP %s and allows retry', async (httpStatus, key) => {
    const error = new AxiosError('request failed')
    error.response = { status: httpStatus, statusText: '', data: {}, headers: {}, config: { headers: new AxiosHeaders() } }
    decision.mockRejectedValueOnce(error)
    const state = useQuickConnectApproval('ABCD2345', translate)
    await flush()
    await state.decide('approve')
    expect(state.message.value).toBe(key)
    expect(state.messageIsError.value).toBe(true)
    expect(state.decisionComplete.value).toBe(false)
    await state.decide('approve')
    expect(state.message.value).toBe('auth.quickConnectApproved')
  })
})
