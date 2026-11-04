import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  request: vi.fn(),
}))

vi.mock('./client', () => ({
  api: { post: mocks.post },
  apiRequest: mocks.request,
}))

import { clearAllFailedIndexerTasks, clearFailedIndexerTasks, INDEXER_QUEUES } from './admin.ts'

describe('clearAllFailedIndexerTasks', () => {
  beforeEach(() => {
    mocks.post.mockReset()
    mocks.request.mockReset()
    mocks.post.mockImplementation(async () => ({ data: { cleared: 2 } }))
  })

  it('clears each logical queue once and includes priority queues via their parent queue', async () => {
    await expect(clearAllFailedIndexerTasks()).resolves.toEqual({
      cleared: INDEXER_QUEUES.length * 2,
      failures: [],
    })

    expect(mocks.post).toHaveBeenCalledTimes(INDEXER_QUEUES.length)
    const requestedUrls = mocks.post.mock.calls.map(([url]) => url)
    for (const queue of INDEXER_QUEUES) {
      expect(mocks.post).toHaveBeenCalledWith(`/admin/indexer/queues/${queue}/clear-failed`, undefined, { timeout: 60_000 })
    }
    for (const queue of ['identify-priority', 'metadata-priority', 'images-priority', 'probe-priority', 'refresh-priority']) {
      expect(requestedUrls).not.toContain(`/admin/indexer/queues/${queue}/clear-failed`)
    }
  })

  it('reports failed queues while retaining the count cleared by successful queues', async () => {
    const failedQueue = INDEXER_QUEUES[0]
    mocks.post.mockImplementation(async (url: string) => {
      if (url === `/admin/indexer/queues/${failedQueue}/clear-failed`) throw new Error('request timed out')
      return { data: { cleared: 2 } }
    })

    await expect(clearAllFailedIndexerTasks()).resolves.toEqual({
      cleared: (INDEXER_QUEUES.length - 1) * 2,
      failures: [{ queue: failedQueue, error: new Error('request timed out') }],
    })
  })
})

describe('clearFailedIndexerTasks', () => {
  beforeEach(() => {
    mocks.post.mockReset()
    mocks.post.mockResolvedValue({ data: { cleared: 3 } })
  })

  it('allows extra time for deleting archived tasks', async () => {
    await expect(clearFailedIndexerTasks('identify')).resolves.toBe(3)

    expect(mocks.post).toHaveBeenCalledWith(
      '/admin/indexer/queues/identify/clear-failed',
      undefined,
      { timeout: 60_000 },
    )
  })
})
