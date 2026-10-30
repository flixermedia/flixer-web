import { catchError } from './catchError'
import { describe, expect, it } from 'vitest'

describe('catchError', () => {
  it('returns fulfilled data without changing it', async () => {
    const data = { value: 42 }

    await expect(catchError(Promise.resolve(data))).resolves.toEqual([undefined, data])
  })

  it('returns rejected errors in the first tuple position', async () => {
    const error = new Error('request failed')

    await expect(catchError(Promise.reject(error))).resolves.toEqual([error])
  })

  it('normalizes non-Error rejection values', async () => {
    const [error] = await catchError(Promise.reject('request failed'))

    expect(error).toBeInstanceOf(Error)
    expect(error?.message).toBe('request failed')
  })
})
