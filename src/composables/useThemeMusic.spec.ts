import { describe, expect, it } from 'vitest'
import { themeFadeVolume } from './useThemeMusic'

describe('theme music fade volume', () => {
  it('ramps to the quiet target volume', () => {
    expect(themeFadeVolume(0)).toBe(0)
    expect(themeFadeVolume(0.5)).toBeCloseTo(0.175)
    expect(themeFadeVolume(1)).toBe(0.35)
  })

  it('clamps progress outside the fade range', () => {
    expect(themeFadeVolume(-1)).toBe(0)
    expect(themeFadeVolume(2)).toBe(0.35)
  })
})
