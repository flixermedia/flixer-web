import { describe, expect, it, vi } from 'vitest'
import { runOptimistic } from './optimistic'

describe('runOptimistic', () => {
  it('applies state immediately and resolves with commit result', async () => {
    let value = 'initial'
    const res = await runOptimistic({
      apply: () => {
        const prev = value
        value = 'optimistic'
        return prev
      },
      commit: async () => {
        expect(value).toBe('optimistic')
        return 42
      },
      rollback: (prev) => {
        value = prev
      },
    })

    expect(res).toEqual({ ok: true, result: 42 })
    expect(value).toBe('optimistic')
  })

  it('rolls back to snapshot and invokes onError when commit rejects', async () => {
    let value = 'initial'
    const onError = vi.fn()
    const boom = new Error('network failed')

    const res = await runOptimistic({
      apply: () => {
        const prev = value
        value = 'optimistic'
        return prev
      },
      commit: async () => {
        throw boom
      },
      rollback: (prev) => {
        value = prev
      },
      onError,
    })

    expect(res).toEqual({ ok: false, error: boom })
    expect(value).toBe('initial')
    expect(onError).toHaveBeenCalledWith(boom)
  })

  it('prevents an older failed mutation from rolling back a newer revision on the same key', async () => {
    let value = false
    let rejectFirst!: (err: Error) => void
    let resolveSecond!: () => void

    const first = runOptimistic({
      key: 'toggle:1',
      apply: () => {
        const prev = value
        value = true
        return prev
      },
      commit: () =>
        new Promise<void>((_, reject) => {
          rejectFirst = reject
        }),
      rollback: (prev) => {
        value = prev
      },
    })

    const second = runOptimistic({
      key: 'toggle:1',
      apply: () => {
        const prev = value
        value = false
        return prev
      },
      commit: () =>
        new Promise<void>((resolve) => {
          resolveSecond = resolve
        }),
      rollback: (prev) => {
        value = prev
      },
    })

    expect(value).toBe(false)
    await vi.waitFor(() => expect(rejectFirst).toBeTypeOf('function'))
    rejectFirst(new Error('first failed'))
    const firstResult = await first
    expect(firstResult.ok).toBe(false)
    // First failure must NOT overwrite second revision's state
    expect(value).toBe(false)

    await vi.waitFor(() => expect(resolveSecond).toBeTypeOf('function'))
    resolveSecond()
    const secondResult = await second
    expect(secondResult.ok).toBe(true)
    expect(value).toBe(false)
  })
})
