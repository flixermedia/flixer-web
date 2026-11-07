import { afterEach, describe, expect, it, vi } from 'vitest'
import { configureLoggerOwner, createLoggerOwnerPairing, getLoggerCapacity, getLoggerCapacityPolicy, getLoggerOwnerConfiguration, getLoggerOwnerPairings, getLoggerPairing, getLoggerQuota, LoggerClient, pairLogger, retryLoggerPairing, revokeLoggerOwnerPairing, setLoggerCapacityPolicy, setLoggerQuota } from './logger'

const request = vi.hoisted(() => vi.fn())
const accessToken = vi.hoisted(() => vi.fn((): string | null => 'session-secret'))
vi.mock('./client', () => ({ apiRequest: request, getAccessToken: accessToken }))
vi.mock('../platform/serverConnection', () => ({ getApiBaseUrl: () => '/api' }))

describe('logger client', () => {
  afterEach(() => {
    request.mockReset()
    accessToken.mockReset().mockReturnValue('session-secret')
    vi.unstubAllGlobals()
  })

  it('uses the admin API to read and update the logical quota', async () => {
    request.mockResolvedValue({ data: { maxBytes: 4096, usedBytes: 100 } })
    expect(await getLoggerQuota()).toEqual({ maxBytes: 4096, usedBytes: 100 })
    expect(await setLoggerQuota(4096)).toEqual({ maxBytes: 4096, usedBytes: 100 })
    expect(request).toHaveBeenNthCalledWith(1, { method: 'GET', url: '/admin/logger/quota' })
    expect(request).toHaveBeenNthCalledWith(2, { method: 'PUT', url: '/admin/logger/quota', data: { maxBytes: 4096 } })
  })

  it('uses Flixer for owner credentials and capacity management', async () => {
    request.mockResolvedValue({ data: {} })
    await configureLoggerOwner('owner-secret')
    await getLoggerOwnerConfiguration()
    await getLoggerCapacity()
    await getLoggerCapacityPolicy()
    await setLoggerCapacityPolicy({ maxDatabaseBytes: 1000, minFreeBytes: 500 })
    expect(request).toHaveBeenNthCalledWith(1, { method: 'PUT', url: '/admin/logger/owner/configuration', data: { ownerToken: 'owner-secret' } })
    expect(request).toHaveBeenNthCalledWith(2, { method: 'GET', url: '/admin/logger/owner/configuration' })
    expect(request).toHaveBeenNthCalledWith(3, { method: 'GET', url: '/admin/logger/owner/capacity' })
    expect(request).toHaveBeenNthCalledWith(4, { method: 'GET', url: '/admin/logger/owner/capacity-policy' })
    expect(request).toHaveBeenNthCalledWith(5, { method: 'PUT', url: '/admin/logger/owner/capacity-policy', data: { maxDatabaseBytes: 1000, minFreeBytes: 500 } })
  })

  it('uses Flixer to redeem and recover a pairing without returning management credentials', async () => {
    request.mockResolvedValue({ data: {} })
    await getLoggerPairing()
    await pairLogger('https://logger.example', 'tenant', 'p'.repeat(43))
    await retryLoggerPairing()
    expect(request).toHaveBeenNthCalledWith(1, { method: 'GET', url: '/admin/logger/pairing' })
    expect(request).toHaveBeenNthCalledWith(2, { method: 'POST', url: '/admin/logger/pairing', data: { endpoint: 'https://logger.example', deploymentId: 'tenant', pairingToken: 'p'.repeat(43) } })
    expect(request).toHaveBeenNthCalledWith(3, { method: 'POST', url: '/admin/logger/pairing/retry' })
  })

  it('creates, lists and revokes owner invitations through Flixer', async () => {
    request.mockResolvedValue({ data: {} })
    await createLoggerOwnerPairing('tenant', 10, 30)
    await getLoggerOwnerPairings('tenant')
    await revokeLoggerOwnerPairing('tenant', 'a'.repeat(32))
    expect(request).toHaveBeenNthCalledWith(1, { method: 'POST', url: '/admin/logger/owner/pairings', data: { deploymentId: 'tenant', minutes: 10, managementDays: 30 } })
    expect(request).toHaveBeenNthCalledWith(2, { method: 'GET', url: '/admin/logger/owner/pairings', params: { deploymentId: 'tenant' } })
    expect(request).toHaveBeenNthCalledWith(3, { method: 'DELETE', url: `/admin/logger/owner/pairings/${'a'.repeat(32)}`, params: { deploymentId: 'tenant' } })
  })

  it('uses indexed trace and task queries with bounded pages and opaque cursors', async () => {
    const fetcher = vi.fn(async (_url: string, _options: RequestInit) => new Response(JSON.stringify({ events: [], next_cursor: '' })))
    vi.stubGlobal('fetch', fetcher)
    const client = new LoggerClient()
    await client.correlation('trace', 'trace 1')
    await client.correlation('task', 'task 2', 'cursor+1')
    expect(fetcher.mock.calls[0]?.[0]).toBe('/api/admin/logger/data/recent?field=trace&value=trace+1&limit=100')
    expect(fetcher.mock.calls[1]?.[0]).toBe('/api/admin/logger/data/recent?field=task&value=task+2&limit=100&cursor=cursor%2B1')
  })

  it('passes task queue and chronological order to historical search', async () => {
    const fetcher = vi.fn(async (_url: string, _options: RequestInit) => new Response(JSON.stringify({ events: [], next_cursor: '' })))
    vi.stubGlobal('fetch', fetcher)
    const search = { start: '2026-01-01T00:00:00Z', end: '2026-01-02T00:00:00Z', limit: 100, fields: { task: 'id', task_queue: 'scan' }, order: 'oldest' as const, follow: true }
    await new LoggerClient().search(search)
    expect(fetcher.mock.calls[0]?.[0]).toBe('/api/admin/logger/data/search')
    expect(JSON.parse(String(fetcher.mock.calls[0]?.[1].body))).toEqual(search)
  })

  it('does not impose a request deadline on filtered live streams', async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout')
    const body = new ReadableStream<Uint8Array>({ start(controller) { controller.close() } })
    vi.stubGlobal('fetch', vi.fn(async () => new Response(body, { status: 200 })))
    await new LoggerClient().stream(new AbortController().signal, vi.fn(), vi.fn(), vi.fn(), undefined, { app: 'flixer' })
    expect(timeout).not.toHaveBeenCalled()
    timeout.mockRestore()
  })

  it('validates bounded source statistics responses', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ sources: [{ app: 'api', source: 'scanner', count: 5 }] })))
    vi.stubGlobal('fetch', fetcher)
    const client = new LoggerClient()
    expect(await client.sources('start', 'end')).toEqual([{ app: 'api', source: 'scanner', count: 5 }])
    fetcher.mockResolvedValueOnce(new Response(JSON.stringify({ sources: [{ app: 'api', source: 'scanner', count: -1 }] })))
    await expect(client.sources('start', 'end')).rejects.toThrow('Invalid logger source statistics')
  })

  it('uses the Flixer session only in authorization headers for relayed queries', async () => {
    const fetcher = vi.fn(async (_url: string, _options: RequestInit) => new Response(JSON.stringify({ events: [] }), { status: 200 }))
    vi.stubGlobal('fetch', fetcher)
    const client = new LoggerClient()
    await Promise.all([client.recent(), client.recent()])
    expect(request).not.toHaveBeenCalled()
    expect(fetcher).toHaveBeenCalledTimes(2)
    const [url, options] = fetcher.mock.calls[0]!
    expect(url).toBe('/api/admin/logger/data/recent?limit=100')
    expect(url).not.toContain('session-secret')
    expect(new Headers(options.headers).get('authorization')).toBe('Bearer session-secret')
    expect(options.credentials).toBe('omit')
    expect(options.redirect).toBe('error')
    client.clear()
    await client.recent()
    expect(request).not.toHaveBeenCalled()
  })

  it('requires a signed-in session before querying', async () => {
    accessToken.mockReturnValue(null)
    const fetcher = vi.fn()
    vi.stubGlobal('fetch', fetcher)
    await expect(new LoggerClient().recent()).rejects.toMatchObject({ status: 401 })
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('decodes fragmented stream frames and reports overflow', async () => {
    const frames = [
      ': connected\r',
      '\nid: cursor-one\r\nevent: log\r\ndata: {"event_id":"one","message":"hello"}\r',
      '\n\r\nevent: overflow\ndata: {}\n\n',
    ]
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        const encoder = new TextEncoder()
        for (const frame of frames) controller.enqueue(encoder.encode(frame))
        controller.close()
      },
    })
    vi.stubGlobal('fetch', vi.fn(async () => new Response(body, { status: 200 })))
    const onEvent = vi.fn()
    const onOverflow = vi.fn()
    const onConnected = vi.fn()
    await new LoggerClient().stream(new AbortController().signal, onEvent, onOverflow, onConnected)
    expect(onConnected).toHaveBeenCalledOnce()
    expect(onEvent).toHaveBeenCalledWith({ event_id: 'one', message: 'hello' }, 'cursor-one')
    expect(onOverflow).toHaveBeenCalledOnce()
  })

  it('passes resume cursors in a header and reports expired replay distinctly', async () => {
    const fetcher = vi.fn(async (_url: string, _options: RequestInit) => new Response('expired', { status: 410 }))
    vi.stubGlobal('fetch', fetcher)
    const client = new LoggerClient()
    await expect(client.stream(new AbortController().signal, vi.fn(), vi.fn(), vi.fn(), 'saved-cursor'))
      .rejects.toMatchObject({ status: 410 })
    const [url, options] = fetcher.mock.calls[0]!
    expect(url).not.toContain('saved-cursor')
    expect(new Headers(options.headers).get('Last-Event-ID')).toBe('saved-cursor')
  })

  it('sends exact live filters while keeping the replay cursor in a header', async () => {
    const fetcher = vi.fn(async (_url: string, _options: RequestInit) => new Response('', { status: 200 }))
    vi.stubGlobal('fetch', fetcher)
    await new LoggerClient().stream(new AbortController().signal, vi.fn(), vi.fn(), vi.fn(), 'saved-cursor', { task: 'task 1', app: 'api' })
    const [url, options] = fetcher.mock.calls[0]!
    expect(url).toBe('/api/admin/logger/data/stream?task=task+1&app=api')
    expect(new Headers(options.headers).get('Last-Event-ID')).toBe('saved-cursor')
  })

  it('accepts a large chunk containing many individually bounded frames', async () => {
    const frame = `event: log\nid: cursor\ndata: ${JSON.stringify({ event_id: 'one', message: 'x'.repeat(1000) })}\n\n`
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(frame.repeat(300)))
        controller.close()
      },
    })
    vi.stubGlobal('fetch', vi.fn(async () => new Response(body, { status: 200 })))
    const onEvent = vi.fn()
    await new LoggerClient().stream(new AbortController().signal, onEvent, vi.fn(), vi.fn())
    expect(onEvent).toHaveBeenCalledTimes(300)
  })

  it('reports unauthorized relayed requests', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('unauthorized', { status: 401 })))
    const client = new LoggerClient()
    await expect(client.recent()).rejects.toThrow('401')
    await expect(client.recent()).rejects.toThrow('401')
    expect(request).not.toHaveBeenCalled()
  })

  it('cancels outstanding reads when credentials are cleared', async () => {
    const fetcher = vi.fn((_url: string, options: RequestInit) => new Promise<Response>((_resolve, reject) => {
      options.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true })
    }))
    vi.stubGlobal('fetch', fetcher)
    const client = new LoggerClient()
    const pending = client.recent()
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledOnce())
    client.clear()
    await expect(pending).rejects.toThrow('aborted')
  })
})
