import { AxiosError, type AxiosResponse } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
vi.mock('../api', () => ({ api: { get } }))

const store = new Map<string, string>()
const route = (name: string) => ({ name, fullPath: `/${name}` }) as never

function failure(status?: number): AxiosError {
  const response = status ? ({ status, data: {}, statusText: '', headers: {}, config: {} } as unknown as AxiosResponse) : undefined
  return new AxiosError('failed', status ? 'ERR_BAD_RESPONSE' : 'ERR_NETWORK', undefined, undefined, response)
}

const status = (overrides: Record<string, unknown> = {}) => ({ data: { state: 'completed', mode: 'ready', database: 'ok', persistent: true, ...overrides } })

beforeEach(() => {
  vi.resetModules()
  get.mockReset()
  store.clear()
  vi.stubGlobal('localStorage', { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value), removeItem: (key: string) => store.delete(key) })
  vi.stubGlobal('navigator', { onLine: true })
})

afterEach(() => vi.unstubAllGlobals())

describe('classifyStatus', () => {
  it('is ready only when completed, running and connected', async () => {
    const { classifyStatus } = await import('./setupApi')
    expect(classifyStatus({ state: 'completed', mode: 'ready', database: 'ok', persistent: true })).toEqual({ kind: 'ready' })
    expect(classifyStatus({ state: 'completed', mode: 'bootstrap', database: 'unavailable', persistent: true })).toEqual({ kind: 'unavailable', reason: 'starting' })
    expect(classifyStatus({ state: 'completed', mode: 'ready', database: 'unavailable', persistent: true })).toEqual({ kind: 'unavailable', reason: 'starting' })
  })

  it('asks for setup for every unfinished state', async () => {
    const { classifyStatus } = await import('./setupApi')
    for (const state of ['not_started', 'in_progress', 'recovery_required'] as const) {
      expect(classifyStatus({ state, mode: 'bootstrap', database: 'unconfigured', persistent: true }).kind).toBe('setup')
    }
  })

  it('treats a missing status as unavailable', async () => {
    const { classifyStatus } = await import('./setupApi')
    expect(classifyStatus(null)).toEqual({ kind: 'unavailable', reason: 'invalid' })
  })
})

describe('fetchSetupGate', () => {
  it('never reports setup when the request fails', async () => {
    const { fetchSetupGate } = await import('./setupApi')
    for (const error of [failure(), failure(500), failure(502), failure(503), new Error('boom')]) {
      get.mockRejectedValueOnce(error)
      expect(await fetchSetupGate()).toEqual({ kind: 'unavailable', reason: 'unreachable' })
    }
  })

  it('never reports setup for a response that is not a status', async () => {
    const { fetchSetupGate } = await import('./setupApi')
    for (const data of ['<!doctype html>', null, {}, { state: 'weird', mode: 'ready', database: 'ok' }, { state: 'not_started', mode: 'x', database: 'ok' }]) {
      get.mockResolvedValueOnce({ data })
      expect((await fetchSetupGate()).kind).toBe('unavailable')
    }
  })

  it('treats an API without the setup route as already configured', async () => {
    const { fetchSetupGate } = await import('./setupApi')
    get.mockRejectedValueOnce(failure(404))
    expect(await fetchSetupGate()).toEqual({ kind: 'ready' })
  })

  it('returns setup when the server says so', async () => {
    const { fetchSetupGate } = await import('./setupApi')
    get.mockResolvedValueOnce(status({ state: 'not_started', mode: 'bootstrap', database: 'unconfigured' }))
    expect((await fetchSetupGate()).kind).toBe('setup')
  })
})

describe('setupGuard', () => {
  it('sends unfinished installs to setup but still allows signing in', async () => {
    const { setupGuard } = await import('./setupGate')
    get.mockResolvedValue(status({ state: 'in_progress', mode: 'ready' }))
    expect(await setupGuard(route('home'))).toEqual({ name: 'setup' })
    expect(await setupGuard(route('register'))).toEqual({ name: 'setup' })
    expect(await setupGuard(route('login'))).toBe(true)
    expect(await setupGuard(route('setup'))).toBe(true)
  })

  it('sends a brand-new install straight to setup, since there is nothing to sign in with', async () => {
    const { setupGuard } = await import('./setupGate')
    get.mockResolvedValue(status({ state: 'not_started', mode: 'bootstrap', database: 'unconfigured' }))
    expect(await setupGuard(route('login'))).toEqual({ name: 'setup' })
    expect(await setupGuard(route('setup'))).toBe(true)
  })

  it('goes to the unavailable page, not setup, when the server cannot be reached', async () => {
    const { setupGuard } = await import('./setupGate')
    get.mockRejectedValue(failure(503))
    expect(await setupGuard(route('home'))).toMatchObject({ name: 'unavailable' })
    expect(await setupGuard(route('setup'))).toMatchObject({ name: 'unavailable' })
    expect(await setupGuard(route('unavailable'))).toBe(true)
  })

  it('lets a finished installation through and stops asking within the page load', async () => {
    const { setupGuard } = await import('./setupGate')
    get.mockResolvedValue(status())
    expect(await setupGuard(route('home'))).toBe(true)
    expect(await setupGuard(route('media-item'))).toBe(true)
    expect(get).toHaveBeenCalledTimes(1)
    expect(await setupGuard(route('setup'))).toEqual({ name: 'home' })
  })

  it('does not let a stored completion hint hide setup on a server that was reset', async () => {
    store.set('flixer.setupCompleted', '1')
    const { setupGuard } = await import('./setupGate')
    get.mockResolvedValue(status({ state: 'not_started', mode: 'bootstrap', database: 'unconfigured' }))
    expect(await setupGuard(route('home'))).toEqual({ name: 'setup' })
    expect(store.has('flixer.setupCompleted')).toBe(false)
  })

  it('keeps an installed offline app working', async () => {
    store.set('flixer.setupCompleted', '1')
    vi.stubGlobal('navigator', { onLine: false })
    const { setupGuard } = await import('./setupGate')
    get.mockRejectedValue(failure())
    expect(await setupGuard(route('home'))).toBe(true)
  })

  it('does not wave an offline first visit through', async () => {
    vi.stubGlobal('navigator', { onLine: false })
    const { setupGuard } = await import('./setupGate')
    get.mockRejectedValue(failure())
    expect(await setupGuard(route('home'))).toMatchObject({ name: 'unavailable' })
  })
})
