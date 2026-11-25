import { describe, expect, it } from 'vitest'
import { decodeBlurhashPixels, isValidBlurhash } from './blurhash'

const SAMPLE_HASH = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj'

describe('blurhash utilities', () => {
  it('validates blurhash strings', () => {
    expect(isValidBlurhash(SAMPLE_HASH)).toBe(true)
    expect(isValidBlurhash('')).toBe(false)
    expect(isValidBlurhash(null)).toBe(false)
    expect(isValidBlurhash('invalid')).toBe(false)
  })

  it('decodes a valid blurhash to RGBA pixels and caches the result', () => {
    const first = decodeBlurhashPixels(SAMPLE_HASH, 16, 16)
    const second = decodeBlurhashPixels(SAMPLE_HASH, 16, 16)
    expect(first).toBeInstanceOf(Uint8ClampedArray)
    expect(first?.length).toBe(16 * 16 * 4)
    expect(second).toBe(first)
  })

  it('returns null when decoding an invalid blurhash', () => {
    expect(decodeBlurhashPixels('bad', 16, 16)).toBeNull()
  })
})
