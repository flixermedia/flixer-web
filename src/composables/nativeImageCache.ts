import type { AxiosRequestConfig } from 'axios'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { ACCESS_TOKEN_KEY, AUTH_TOKEN_CHANGED_EVENT, api, getAccessToken } from '../api/client'
import { isNativeApp, NATIVE_SERVER_URL_KEY } from '../platform/serverConnection'

const DATABASE = 'flixer-native-artwork'
const IMAGES = 'images'
const META = 'meta'
const MAX_ENTRIES = 128
const MAX_IMAGE_BYTES = 1024 * 1024
const CLEANUP_PENDING_KEY = 'flixer.artworkCleanupPending'
const FILE_OPERATION_TIMEOUT_MS = 8_000

interface ImageEntry {
  key: string
  blob: Blob
  etag: string
  accessed: number
}

let generation = 0
let cleanup = Promise.resolve()
const nativeFileWrites = new Set<Promise<unknown>>()
const imageRequests = new Set<AbortController>()

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(IMAGES, { keyPath: 'key' }).createIndex('accessed', 'accessed')
      request.result.createObjectStore(META)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open artwork cache'))
    request.onblocked = () => reject(new Error('Artwork cache is blocked'))
  })
}

function done(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onabort = () => reject(transaction.error ?? new Error('Artwork cache transaction aborted'))
    transaction.onerror = () => reject(transaction.error ?? new Error('Artwork cache transaction failed'))
  })
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Artwork cache request failed'))
  })
}

async function clearDatabase() {
  const db = await openDatabase()
  try {
    const transaction = db.transaction([IMAGES, META], 'readwrite')
    transaction.objectStore(IMAGES).clear()
    transaction.objectStore(META).clear()
    await done(transaction)
  } finally {
    db.close()
  }
}

export function trackNativeArtworkWrite<T>(work: Promise<T>): Promise<T> {
  nativeFileWrites.add(work)
  void work.then(() => nativeFileWrites.delete(work), () => nativeFileWrites.delete(work))
  return work
}

async function clearNativeArtworkFiles() {
  const { files } = await fileOperation(Filesystem.readdir({ path: '', directory: Directory.Cache }))
  for (const file of files) {
    if (file.type === 'file' && file.name.startsWith('flixer-art-')) {
      await fileOperation(Filesystem.deleteFile({ path: file.name, directory: Directory.Cache }))
    }
  }
}

function fileOperation<T>(operation: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Native artwork cleanup timed out')), FILE_OPERATION_TIMEOUT_MS)
  })
  return Promise.race([operation, timeout]).finally(() => clearTimeout(timer))
}

export function waitForNativeImageCacheClear(): Promise<void> {
  return cleanup
}

function invalidate() {
  generation++
  for (const request of imageRequests) request.abort()
  if (isNativeApp()) {
    const cleanupGeneration = generation
    localStorage.setItem(CLEANUP_PENDING_KEY, '1')
    const writes = [...nativeFileWrites]
    cleanup = cleanup.catch(() => undefined).then(async () => {
      await Promise.allSettled(writes)
      await Promise.all([clearDatabase(), clearNativeArtworkFiles()])
      if (cleanupGeneration === generation) localStorage.removeItem(CLEANUP_PENDING_KEY)
    })
    void cleanup.catch((error: unknown) => console.error('[artwork-cache] Could not clear artwork cache', error))
  }
}

async function identity(token: string, server: string): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify([server, token]))
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function withStore<T>(session: string, assertCurrent: () => void, callback: (store: IDBObjectStore) => Promise<T>): Promise<T> {
  const db = await openDatabase()
  try {
    assertCurrent()
    const transaction = db.transaction([IMAGES, META], 'readwrite')
    const finished = done(transaction)
    void finished.catch(() => undefined)
    const images = transaction.objectStore(IMAGES)
    const meta = transaction.objectStore(META)
    try {
      const previous = await requestResult(meta.get('session'))
      assertCurrent()
      if (previous !== session) {
        images.clear()
        meta.put(session, 'session')
      }
      const result = await callback(images)
      await finished
      return result
    } catch (error) {
      try { transaction.abort() } catch { /* The transaction has already finished. */ }
      throw error
    }
  } finally {
    db.close()
  }
}

async function readEntry(session: string, key: string, assertCurrent: () => void): Promise<ImageEntry | undefined> {
  return withStore(session, assertCurrent, async (store) => {
    const entry: ImageEntry | undefined = await requestResult(store.get(key))
    assertCurrent()
    if (entry) {
      entry.accessed = Date.now()
      store.put(entry)
    }
    return entry
  })
}

async function writeEntry(session: string, entry: ImageEntry, assertCurrent: () => void): Promise<void> {
  if (entry.blob.size > MAX_IMAGE_BYTES) return
  await withStore(session, assertCurrent, async (store) => {
    store.put(entry)
    let excess = (await requestResult(store.count())) - MAX_ENTRIES
    if (excess <= 0) return
    await new Promise<void>((resolve, reject) => {
      const request = store.index('accessed').openCursor()
      request.onerror = () => reject(request.error ?? new Error('Could not evict artwork'))
      request.onsuccess = () => {
        const cursor = request.result
        if (!cursor || excess <= 0) return resolve()
        cursor.delete()
        excess--
        cursor.continue()
      }
    })
  })
}

/** Revalidates native artwork with the server before returning any persisted bytes. */
export async function fetchNativeImage(url: string, config: AxiosRequestConfig = {}): Promise<Blob> {
  const token = getAccessToken()
  const server = api.defaults.baseURL ?? ''
  const currentGeneration = generation
  const assertCurrent = () => {
    if (generation !== currentGeneration || getAccessToken() !== token || api.defaults.baseURL !== server) {
      throw new DOMException('Artwork session changed', 'AbortError')
    }
  }
  if (!token) throw new Error('An authenticated session is required for artwork')

  const key = JSON.stringify([url, config.params ?? null])
  let session: string | undefined
  let cached: ImageEntry | undefined
  try {
    await cleanup
    assertCurrent()
    session = await identity(token, server)
    assertCurrent()
    cached = await readEntry(session, key, assertCurrent)
  } catch (error) {
    assertCurrent()
    console.warn('[artwork-cache] Could not read artwork cache', error)
  }
  assertCurrent()

  const controller = new AbortController()
  const onAbort = () => controller.abort()
  if (config.signal?.aborted) controller.abort()
  config.signal?.addEventListener?.('abort', onAbort)
  imageRequests.add(controller)
  let response
  try {
    response = await api.get<Blob>(url, {
      ...config,
      signal: controller.signal,
      responseType: 'blob',
      headers: {
        ...config.headers,
        'Cache-Control': 'no-cache, no-store',
        'X-Flixer-App-Image-Cache': '1',
        ...(cached ? { 'If-None-Match': cached.etag } : {}),
      },
      validateStatus: (status) => (status >= 200 && status < 300) || status === 304,
    })
  } finally {
    imageRequests.delete(controller)
    config.signal?.removeEventListener?.('abort', onAbort)
  }
  assertCurrent()
  if (response.status === 304) {
    if (!cached) throw new Error('Artwork was not available for revalidation')
    return cached.blob
  }
  const etag = response.headers.etag
  if (session && typeof etag === 'string') {
    try {
      await writeEntry(session, { key, blob: response.data, etag, accessed: Date.now() }, assertCurrent)
    } catch (error) {
      console.warn('[artwork-cache] Could not save artwork', error)
    }
  }
  assertCurrent()
  return response.data
}

if (typeof window !== 'undefined') {
  window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, invalidate)
  window.addEventListener('storage', (event) => {
    if (event.key === ACCESS_TOKEN_KEY || event.key === NATIVE_SERVER_URL_KEY) invalidate()
  })
  if (isNativeApp() && (!getAccessToken() || localStorage.getItem(CLEANUP_PENDING_KEY))) invalidate()
}
