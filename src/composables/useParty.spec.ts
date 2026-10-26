import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PartySnapshot } from '../api'
import { expectedPosition } from './partyClock'

const snapshot = (playing: boolean): PartySnapshot => ({
  id: 'abc12345',
  kind: 'video',
  host: { id: 'h', username: 'host', displayName: 'Host', avatarUrl: null },
  item: {} as PartySnapshot['item'],
  playing,
  position: 100,
  at: 1_000_000,
  members: [],
})

describe('expectedPosition', () => {
  afterEach(() => vi.useRealTimers())

  it('advances a playing party by the time since the host reported, corrected for clock offset', () => {
    vi.useFakeTimers()
    vi.setSystemTime(990_000)
    // The server clock is 20s ahead of this device, so the report is 10s old.
    expect(expectedPosition({ party: snapshot(true), offset: 20_000 })).toBeCloseTo(110, 3)
  })

  it('holds a paused party where the host paused', () => {
    vi.useFakeTimers()
    vi.setSystemTime(2_000_000)
    expect(expectedPosition({ party: snapshot(false), offset: 0 })).toBe(100)
  })
})
