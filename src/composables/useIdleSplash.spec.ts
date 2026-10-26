import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createIdleTimer } from './useIdleSplash'

function setup(suppressed = () => false) {
  const changes: boolean[] = []
  const timer = createIdleTimer({ timeoutMs: 1000, suppressed, hidden: () => false, onChange: (idle) => changes.push(idle) })
  timer.arm()
  return { timer, changes }
}

describe('createIdleTimer', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('goes idle after the timeout and wakes on activity', () => {
    const { timer, changes } = setup()
    vi.advanceTimersByTime(999)
    expect(changes).toEqual([])
    vi.advanceTimersByTime(2)
    expect(changes).toEqual([true])
    timer.activity()
    expect(changes).toEqual([true, false])
    timer.stop()
  })

  it('restarts the countdown on activity', () => {
    const { timer, changes } = setup()
    vi.advanceTimersByTime(800)
    timer.activity()
    vi.advanceTimersByTime(800)
    expect(changes).toEqual([])
    timer.stop()
  })

  it('waits while suppressed', () => {
    let busy = true
    const { timer, changes } = setup(() => busy)
    vi.advanceTimersByTime(3000)
    expect(changes).toEqual([])
    busy = false
    vi.advanceTimersByTime(1000)
    expect(changes).toEqual([true])
    timer.stop()
  })
})
