import { beforeEach, describe, expect, it, vi } from 'vitest'

const call = vi.fn()
const confirm = vi.fn()
const toasts = { success: vi.fn(), error: vi.fn(), info: vi.fn() }

vi.mock('../api', () => ({ callPluginOperation: (...args: unknown[]) => call(...args) }))
vi.mock('./confirm', () => ({ confirmAction: (...args: unknown[]) => confirm(...args) }))
vi.mock('./notify', () => ({ notify: toasts }))
vi.mock('./useProfile', () => ({ describeRequestError: (error: unknown) => `err:${error instanceof Error ? error.message : 'unknown'}` }))

const { usePluginActions } = await import('./usePluginActions')

function setup() {
  const navigate = vi.fn()
  const reload = vi.fn()
  const runner = usePluginActions({ pluginId: () => 'flixer.requests', navigate, reload })
  return { navigate, reload, ...runner }
}

describe('usePluginActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    confirm.mockResolvedValue(true)
  })

  it('posts the merged body to the plugin operation', async () => {
    call.mockResolvedValue({})
    const { run } = setup()
    expect(await run({ op: 'save', body: { id: '1', a: 'old' } }, { values: { a: 'new' } })).toBe(true)
    expect(call).toHaveBeenCalledWith('flixer.requests', 'save', { id: '1', a: 'new' })
  })

  it('does not call the plugin when the confirmation is declined', async () => {
    confirm.mockResolvedValue(false)
    const { run } = setup()
    expect(await run({ op: 'delete', confirm: 'Sure?' })).toBe(false)
    expect(call).not.toHaveBeenCalled()
  })

  it('prefers the runner confirm message over the action one', async () => {
    call.mockResolvedValue({})
    const { run } = setup()
    await run({ op: 'delete', confirm: 'action' }, { confirm: 'button', danger: true })
    expect(confirm).toHaveBeenCalledWith('button', { danger: true })
  })

  it('shows the response toast and navigates, otherwise reloads', async () => {
    const { run, navigate, reload } = setup()
    call.mockResolvedValueOnce({ toast: { text: 'Saved', tone: 'success' }, navigate: { query: { tab: 'a' }, merge: true } })
    await run({ op: 'x', reload: true })
    expect(toasts.success).toHaveBeenCalledWith('Saved')
    expect(navigate).toHaveBeenCalledWith({ query: { tab: 'a' }, merge: true })
    expect(reload).not.toHaveBeenCalled()

    call.mockResolvedValueOnce({})
    await run({ op: 'x', reload: true })
    expect(reload).toHaveBeenCalledOnce()
  })

  it('treats a response error as a failure with an error toast', async () => {
    call.mockResolvedValue({ error: 'Quota exceeded', reload: true })
    const { run, reload, navigate } = setup()
    expect(await run({ op: 'x' })).toBe(false)
    expect(toasts.error).toHaveBeenCalledWith('Quota exceeded')
    expect(reload).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('shows API failures as error toasts', async () => {
    call.mockRejectedValue(new Error('boom'))
    const { run } = setup()
    expect(await run({ op: 'x' })).toBe(false)
    expect(toasts.error).toHaveBeenCalledWith('err:boom')
  })

  it('is busy while an action is in flight', async () => {
    let finish: (value: unknown) => void = () => undefined
    call.mockReturnValue(new Promise((resolve) => (finish = resolve)))
    const { run, busy } = setup()
    expect(busy.value).toBe(false)
    const pending = run({ op: 'x' })
    await Promise.resolve()
    expect(busy.value).toBe(true)
    finish({})
    await pending
    expect(busy.value).toBe(false)
  })
})
