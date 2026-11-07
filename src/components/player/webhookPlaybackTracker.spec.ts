import { describe, expect, it, vi } from 'vitest'
import { WebhookPlaybackTracker } from './webhookPlaybackTracker'

describe('webhook playback tracker', () => {
  it('sends ordered start, pause, resume and stop transitions without duplicates', async () => {
    const send = vi.fn().mockResolvedValue(undefined)
    const tracker = new WebhookPlaybackTracker(send)
    const target = { kind: 'video' as const, itemId: 'item' }
    tracker.play(target, 0)
    tracker.play(target, 1)
    tracker.pause(5)
    tracker.pause(5)
    tracker.play(target, 5)
    tracker.stop(10)
    tracker.stop(10)
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(4))
    expect(send.mock.calls.map(([event]) => event)).toEqual(['playback.started', 'playback.paused', 'playback.resumed', 'playback.stopped'])
    expect(send.mock.calls[3]).toEqual(['playback.stopped', target, 10])
  })

  it('stops the old target before starting another', async () => {
    const send = vi.fn().mockResolvedValue(undefined)
    const tracker = new WebhookPlaybackTracker(send)
    const one = { kind: 'music' as const, itemId: 'one' }
    const two = { kind: 'music' as const, itemId: 'two' }
    tracker.play(one, 0)
    tracker.play(two, 0)
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(3))
    expect(send.mock.calls.map(([event, target]) => [event, target.itemId])).toEqual([['playback.started', 'one'], ['playback.stopped', 'one'], ['playback.started', 'two']])
  })
})
