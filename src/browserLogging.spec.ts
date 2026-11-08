import { afterEach, describe, expect, it, vi } from 'vitest'
import type { App } from 'vue'
import { initBrowserLogging } from './browserLogging'
import { apiRequest, getAccessToken } from './api/client'

vi.mock('./api/client', () => ({ apiRequest: vi.fn(), getAccessToken: vi.fn() }))

describe('browser logging', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('sends only fixed error categories and preserves the Vue handler', async () => {
    const target = new EventTarget()
    vi.stubGlobal('window', target)
    vi.mocked(getAccessToken).mockReturnValue('session-token')
    vi.mocked(apiRequest).mockResolvedValue({} as never)
    const previous = vi.fn()
    const app = { config: { errorHandler: previous } } as unknown as App
    initBrowserLogging(app)
    const error = new TypeError('secret https://example.com/private')
    app.config.errorHandler?.(error, null, 'render')
    app.config.errorHandler?.(error, null, 'render')
    expect(previous).toHaveBeenCalledTimes(2)
    expect(apiRequest).toHaveBeenCalledOnce()
    expect(apiRequest).toHaveBeenCalledWith(expect.objectContaining({
      url: '/logs/web', data: { kind: 'vue-error', errorType: 'TypeError' },
    }))
    expect(JSON.stringify(vi.mocked(apiRequest).mock.calls)).not.toContain('secret')
  })

  it('does not send reports without an authenticated session', () => {
    vi.stubGlobal('window', new EventTarget())
    vi.mocked(getAccessToken).mockReturnValue(null)
    const app = { config: { errorHandler: vi.fn() } } as unknown as App
    initBrowserLogging(app)
    vi.mocked(apiRequest).mockClear()
    app.config.errorHandler?.(new Error('private'), null, 'render')
    expect(apiRequest).not.toHaveBeenCalled()
  })

  it('handles window errors and unhandled rejections without exporting their content', () => {
    const target = new EventTarget()
    vi.stubGlobal('window', target)
    vi.mocked(getAccessToken).mockReturnValue('session-token')
    vi.mocked(apiRequest).mockClear().mockResolvedValue({} as never)
    initBrowserLogging({ config: {} } as App)
    target.dispatchEvent(Object.assign(new Event('error'), { error: new RangeError('private error') }))
    target.dispatchEvent(Object.assign(new Event('unhandledrejection'), { reason: 'private rejection' }))
    expect(apiRequest).toHaveBeenCalledTimes(2)
    expect(vi.mocked(apiRequest).mock.calls.map(([request]) => request.data)).toEqual([
      { kind: 'window-error', errorType: 'RangeError' },
      { kind: 'unhandled-rejection', errorType: 'Other' },
    ])
    expect(JSON.stringify(vi.mocked(apiRequest).mock.calls)).not.toContain('private')
  })

  it('does not interrupt the Vue handler when reporting fails synchronously', () => {
    vi.stubGlobal('window', new EventTarget())
    vi.mocked(getAccessToken).mockImplementation(() => { throw new Error('storage unavailable') })
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const previous = vi.fn()
    const app = { config: { errorHandler: previous } } as unknown as App
    initBrowserLogging(app)
    app.config.errorHandler?.(new Error('private'), null, 'render')
    expect(previous).toHaveBeenCalledOnce()
    expect(warning).toHaveBeenCalledOnce()
  })
})
