import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
  request: vi.fn(),
}))

vi.mock('./client', () => ({
  api: { get: mocks.get, post: mocks.post },
  apiRequest: mocks.request,
}))

import { clearAllFailedIndexerTasks, clearAllPendingIndexerTasks, clearFailedIndexerTasks, INDEXER_QUEUES, INDEXER_TASK_QUEUES } from './admin.ts'

describe('clearAllFailedIndexerTasks', () => {
  beforeEach(() => {
    mocks.post.mockReset()
    mocks.get.mockReset()
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

describe('clearAllPendingIndexerTasks', () => {
  beforeEach(() => {
    mocks.get.mockReset()
    mocks.post.mockReset()
    mocks.get.mockImplementation(async (_url: string, options: { params: { queue: string } }) => ({
      data: {
        tasks: options.params.queue === 'identify'
          ? [{ id: 'pending-1', queue: 'identify', type: 'identify:movie', state: 'pending', retried: 0, maxRetry: 1 }]
          : [],
      },
    }))
    mocks.post.mockResolvedValue({ data: {} })
  })

  it('cancels pending tasks across all task queues without cancelling active tasks', async () => {
    await expect(clearAllPendingIndexerTasks()).resolves.toEqual({ cleared: 1, failures: [] })

    expect(mocks.get).toHaveBeenCalledTimes(INDEXER_TASK_QUEUES.length)
    expect(mocks.post).toHaveBeenCalledTimes(1)
    expect(mocks.post).toHaveBeenCalledWith('/admin/indexer/tasks/identify/pending-1/cancel')
  })

  it('continues listing a queue when it has multiple pages of pending tasks', async () => {
    mocks.get.mockImplementation(async (_url: string, options: { params: { queue: string; page: number } }) => ({
      data: {
        tasks: options.params.queue !== 'identify'
          ? []
          : options.params.page === 1
            ? Array.from({ length: 100 }, (_, index) => ({
              id: `pending-${index}`,
              queue: 'identify',
              type: 'identify:movie',
              state: 'pending',
              retried: 0,
              maxRetry: 1,
            }))
            : [{ id: 'pending-last', queue: 'identify', type: 'identify:movie', state: 'pending', retried: 0, maxRetry: 1 }],
      },
    }))

    await expect(clearAllPendingIndexerTasks()).resolves.toEqual({ cleared: 101, failures: [] })
    expect(mocks.get.mock.calls.filter(([, options]) => options.params.queue === 'identify').map(([, options]) => options.params.page)).toEqual([1, 2])
    expect(mocks.post).toHaveBeenCalledTimes(101)
  })

  it('continues across queues and reports listing failures', async () => {
    mocks.get.mockImplementation(async (_url: string, options: { params: { queue: string } }) => {
      if (options.params.queue === 'identify') throw new Error('request timed out')
      return { data: { tasks: [] } }
    })

    await expect(clearAllPendingIndexerTasks()).resolves.toMatchObject({
      cleared: 0,
      failures: [{ queue: 'identify', error: new Error('request timed out') }],
    })
    expect(mocks.get).toHaveBeenCalledTimes(INDEXER_TASK_QUEUES.length)
  })
})
