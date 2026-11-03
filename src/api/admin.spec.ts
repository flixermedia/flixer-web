import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  request: vi.fn(),
}))

vi.mock('./client', () => ({
  api: { post: mocks.post },
  apiRequest: mocks.request,
}))

import { clearAllFailedIndexerTasks, INDEXER_QUEUES } from './admin.ts'

describe('clearAllFailedIndexerTasks', () => {
  beforeEach(() => {
    mocks.post.mockReset()
    mocks.request.mockReset()
    mocks.post.mockImplementation(async () => ({ data: { cleared: 2 } }))
  })

  it('clears each logical queue once and includes priority queues via their parent queue', async () => {
    await expect(clearAllFailedIndexerTasks()).resolves.toBe(INDEXER_QUEUES.length * 2)

    expect(mocks.post).toHaveBeenCalledTimes(INDEXER_QUEUES.length)
    for (const queue of INDEXER_QUEUES) {
      expect(mocks.post).toHaveBeenCalledWith(`/admin/indexer/queues/${queue}/clear-failed`)
    }
    for (const queue of ['identify-priority', 'metadata-priority', 'images-priority', 'probe-priority', 'refresh-priority']) {
      expect(mocks.post).not.toHaveBeenCalledWith(`/admin/indexer/queues/${queue}/clear-failed`)
    }
  })
})
