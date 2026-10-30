import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearImageBlobCache, fetchCachedImageBlob } from './imageBlobCache'

describe('image blob cache', () => {
  afterEach(() => {
    clearImageBlobCache()
    vi.useRealTimers()
  })

  it('deduplicates in-flight requests and reuses versioned blobs', async () => {
    let resolveRequest!: (blob: Blob) => void
    const fetcher = vi.fn(() => new Promise<Blob>((resolve) => { resolveRequest = resolve }))

    const first = fetchCachedImageBlob('poster-v1', fetcher, 'v1')
    const duplicate = fetchCachedImageBlob('poster-v1', fetcher, 'v1')
    expect(fetcher).toHaveBeenCalledTimes(1)

    const blob = new Blob(['poster'])
    resolveRequest(blob)
    await expect(first).resolves.toBe(blob)
    await expect(duplicate).resolves.toBe(blob)
    await expect(fetchCachedImageBlob('poster-v1', fetcher, 'v1')).resolves.toBe(blob)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('expires cache entries without an item version', async () => {
    vi.useFakeTimers()
    const fetcher = vi.fn(async () => new Blob(['poster']))

    await fetchCachedImageBlob('poster', fetcher)
    await fetchCachedImageBlob('poster', fetcher)
    expect(fetcher).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(60_001)
    await fetchCachedImageBlob('poster', fetcher)
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('does not cache a request that completes after the cache is cleared', async () => {
    let resolveRequest!: (blob: Blob) => void
    const fetcher = vi.fn(() => new Promise<Blob>((resolve) => { resolveRequest = resolve }))
    const pending = fetchCachedImageBlob('poster-v1', fetcher, 'v1')

    clearImageBlobCache()
    resolveRequest(new Blob(['old poster']))
    await pending

    await fetchCachedImageBlob('poster-v1', async () => new Blob(['new poster']), 'v1')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})
