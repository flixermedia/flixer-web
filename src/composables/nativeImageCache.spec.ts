import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  token: 'token-a' as string | null,
  api: { defaults: { baseURL: 'https://server-a/api' }, get: vi.fn() },
  readdir: vi.fn(),
  deleteFile: vi.fn(),
}))

vi.mock('../api/client', () => ({
  ACCESS_TOKEN_KEY: 'token',
  AUTH_TOKEN_CHANGED_EVENT: 'token-changed',
  api: state.api,
  getAccessToken: () => state.token,
}))
vi.mock('../platform/serverConnection', () => ({
  isNativeApp: () => true,
  NATIVE_SERVER_URL_KEY: 'server',
}))
vi.mock('@capacitor/filesystem', () => ({
  Directory: { Cache: 'CACHE' },
  Filesystem: { readdir: state.readdir, deleteFile: state.deleteFile },
}))

async function countEntries(): Promise<number> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('flixer-native-artwork')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  const count = await new Promise<number>((resolve, reject) => {
    const request = db.transaction('images').objectStore('images').count()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  db.close()
  return count
}

describe('native artwork cache', () => {
  beforeEach(async () => {
    vi.resetModules()
    vi.stubGlobal('window', new EventTarget())
    const storage = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    })
    state.token = 'token-a'
    state.api.defaults.baseURL = 'https://server-a/api'
    state.api.get.mockReset()
    state.readdir.mockReset().mockResolvedValue({ files: [] })
    state.deleteFile.mockReset().mockResolvedValue(undefined)
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('flixer-native-artwork')
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  })

  it('persists across module reloads but revalidates before returning artwork', async () => {
    const blob = new Blob(['poster'])
    state.api.get.mockResolvedValueOnce({ status: 200, data: blob, headers: { etag: '"one"' } })
      .mockResolvedValueOnce({ status: 304, headers: {} })
    const first = await import('./nativeImageCache')
    expect(await first.fetchNativeImage('/poster')).toBe(blob)
    vi.resetModules()
    const restarted = await import('./nativeImageCache')
    expect(await (await restarted.fetchNativeImage('/poster')).text()).toBe('poster')
    expect(state.api.get.mock.calls[1][1].headers['If-None-Match']).toBe('"one"')
    expect(state.api.get.mock.calls[1][1].headers['Cache-Control']).toBe('no-cache, no-store')
  })

  it('never returns cached artwork when verification fails, and replaces changed artwork', async () => {
    state.api.get.mockResolvedValueOnce({ status: 200, data: new Blob(['old']), headers: { etag: '"old"' } })
      .mockRejectedValueOnce(new Error('access denied'))
      .mockResolvedValueOnce({ status: 200, data: new Blob(['new']), headers: { etag: '"new"' } })
    const { fetchNativeImage } = await import('./nativeImageCache')
    await fetchNativeImage('/poster')
    await expect(fetchNativeImage('/poster')).rejects.toThrow('access denied')
    expect(await (await fetchNativeImage('/poster')).text()).toBe('new')
  })

  it('rejects an old in-flight response and clears artwork on sign-out', async () => {
    let resolve!: (value: unknown) => void
    state.api.get.mockImplementation(() => new Promise((done) => { resolve = done }))
    const cache = await import('./nativeImageCache')
    const pending = cache.fetchNativeImage('/poster')
    await vi.waitFor(() => expect(resolve).toBeDefined())
    state.token = null
    window.dispatchEvent(new Event('token-changed'))
    expect(state.api.get.mock.calls[0][1].signal.aborted).toBe(true)
    resolve({ status: 200, data: new Blob(['old']), headers: { etag: '"old"' } })
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    await cache.waitForNativeImageCacheClear()
    expect(await countEntries()).toBe(0)
  })

  it('clears native navigation artwork and waits for pending file writes', async () => {
    state.readdir.mockResolvedValue({ files: [{ type: 'file', name: 'flixer-art-album.jpg' }, { type: 'file', name: 'other.jpg' }] })
    const cache = await import('./nativeImageCache')
    let finish!: () => void
    cache.trackNativeArtworkWrite(new Promise<void>((resolve) => { finish = resolve }))
    state.token = null
    window.dispatchEvent(new Event('token-changed'))
    finish()
    await cache.waitForNativeImageCacheClear()
    expect(state.deleteFile).toHaveBeenCalledOnce()
    expect(state.deleteFile).toHaveBeenCalledWith({ path: 'flixer-art-album.jpg', directory: 'CACHE' })
  })

  it('does not reuse artwork after switching servers', async () => {
    state.api.get.mockResolvedValueOnce({ status: 200, data: new Blob(['server-a']), headers: { etag: '"a"' } })
      .mockResolvedValueOnce({ status: 200, data: new Blob(['server-b']), headers: { etag: '"b"' } })
    const { fetchNativeImage } = await import('./nativeImageCache')
    await fetchNativeImage('/poster')
    state.api.defaults.baseURL = 'https://server-b/api'
    expect(await (await fetchNativeImage('/poster')).text()).toBe('server-b')
    expect(state.api.get.mock.calls[1][1].headers['If-None-Match']).toBeUndefined()
    expect(await countEntries()).toBe(1)
  })

  it('clears the previous account before loading another account', async () => {
    state.api.get.mockResolvedValueOnce({ status: 200, data: new Blob(['account-a']), headers: { etag: '"a"' } })
      .mockResolvedValueOnce({ status: 200, data: new Blob(['account-b']), headers: { etag: '"b"' } })
    const cache = await import('./nativeImageCache')
    await cache.fetchNativeImage('/poster')
    state.token = 'token-b'
    window.dispatchEvent(new Event('token-changed'))
    expect(await (await cache.fetchNativeImage('/poster')).text()).toBe('account-b')
    expect(state.api.get.mock.calls[1][1].headers['If-None-Match']).toBeUndefined()
    expect(await countEntries()).toBe(1)
  })

  it('resumes interrupted cleanup before using the cache', async () => {
    localStorage.setItem('flixer.artworkCleanupPending', '1')
    state.readdir.mockResolvedValue({ files: [{ type: 'file', name: 'flixer-art-album.jpg' }] })
    const cache = await import('./nativeImageCache')
    await cache.waitForNativeImageCacheClear()
    expect(state.deleteFile).toHaveBeenCalledOnce()
    expect(localStorage.getItem('flixer.artworkCleanupPending')).toBeNull()
  })

  it('does not persist oversized artwork', async () => {
    state.api.get.mockResolvedValue({ status: 200, data: new Blob([new Uint8Array(1024 * 1024 + 1)]), headers: { etag: '"large"' } })
    const { fetchNativeImage } = await import('./nativeImageCache')
    await fetchNativeImage('/large')
    expect(await countEntries()).toBe(0)
  })

  it('reports cleanup failures and preserves the retry marker', async () => {
    state.readdir.mockRejectedValueOnce(new Error('filesystem unavailable'))
    const logger = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const cache = await import('./nativeImageCache')
    state.token = null
    window.dispatchEvent(new Event('token-changed'))
    await expect(cache.waitForNativeImageCacheClear()).rejects.toThrow('filesystem unavailable')
    expect(localStorage.getItem('flixer.artworkCleanupPending')).toBe('1')
    logger.mockRestore()
  })
})
