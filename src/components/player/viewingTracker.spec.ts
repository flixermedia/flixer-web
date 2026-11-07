import { describe, expect, it, vi } from 'vitest'
import { ViewingTracker } from './viewingTracker'

describe('viewing tracker', () => {
  it('counts playback without counting pauses, seeks or long stalls', async () => {
    const send = vi.fn().mockResolvedValue(undefined)
    const tracker = new ViewingTracker(send)
    const target = { kind: 'video' as const, itemId: 'item' }
    tracker.sample(target, 10, true, 0)
    tracker.sample(target, 15, true, 5000)
    tracker.sample(target, 15, false, 6000)
    tracker.sample(target, 15, true, 16000)
    tracker.sample(target, 200, true, 17000)
    tracker.sample(target, 202, true, 19000)
    tracker.sample(target, 250, true, 100000)
    tracker.finish()
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(2))
    expect(send.mock.calls[0]![0]).toMatchObject({ ...target, watchedSeconds: 0 })
    expect(send.mock.calls[1]![0]).toMatchObject({ ...target, watchedSeconds: 7 })
    expect(send.mock.calls[1]![0].id).toBe(send.mock.calls[0]![0].id)
  })

  it('uses a fresh session after the source ends or changes', async () => {
    const send = vi.fn().mockResolvedValue(undefined)
    const tracker = new ViewingTracker(send)
    tracker.sample({ kind: 'live', channelId: 'a', channelName: 'A' }, 1, true, 0)
    tracker.finish()
    tracker.sample({ kind: 'live', channelId: 'b', channelName: 'B' }, 1, true, 1000)
    tracker.finish()
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(4))
    expect(send.mock.calls[0]![0].id).not.toBe(send.mock.calls[2]![0].id)
    expect(send.mock.calls[2]![0]).toMatchObject({ channelId: 'b' })
  })
})
