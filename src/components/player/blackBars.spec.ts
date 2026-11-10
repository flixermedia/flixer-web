import { describe, expect, it } from 'vitest'
import { BarCropConfirmation, croppedAspectRatio, detectBlackBars } from './blackBars'

function frame(top: number, bottom: number, brightness = 180) {
  const width = 80
  const height = 60
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = top; y < height - bottom; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      data[i] = data[i + 1] = data[i + 2] = brightness
      data[i + 3] = 255
    }
  }
  return data
}

describe('black bar detection', () => {
  it('calculates the cropped picture aspect ratio and restores the default without a crop', () => {
    expect(croppedAspectRatio(1920, 1080, { top: 0.1, bottom: 0.1 })).toBeCloseTo(1920 / 864)
    expect(croppedAspectRatio(1920, 1080, { top: 0, bottom: 0 })).toBeNull()
    expect(croppedAspectRatio(0, 0, { top: 0.1, bottom: 0.1 })).toBeNull()
  })
  it('detects symmetric bars with a safety margin', () => {
    expect(detectBlackBars(frame(6, 6), 80, 60)).toEqual({ top: 5 / 60, bottom: 5 / 60 })
  })
  it('returns no crop for a bright full frame', () => {
    expect(detectBlackBars(frame(0, 0), 80, 60)).toEqual({ top: 0, bottom: 0 })
  })
  it('ignores dark, asymmetric, and excessive bars', () => {
    expect(detectBlackBars(frame(6, 6, 10), 80, 60)).toBeNull()
    expect(detectBlackBars(frame(6, 2), 80, 60)).toBeNull()
    expect(detectBlackBars(frame(15, 15), 80, 60)).toBeNull()
  })
  it('requires three consecutive similar observations and resets on inconclusive frames', () => {
    const confirmation = new BarCropConfirmation()
    const bars = { top: 0.1, bottom: 0.1 }
    expect(confirmation.observe(bars)).toBeNull()
    expect(confirmation.observe(bars)).toBeNull()
    expect(confirmation.observe(null)).toBeNull()
    expect(confirmation.observe(bars)).toBeNull()
    expect(confirmation.observe(bars)).toBeNull()
    expect(confirmation.observe(bars)).toEqual(bars)
    const noBars = { top: 0, bottom: 0 }
    expect(confirmation.observe(noBars)).toBeNull()
    expect(confirmation.observe(noBars)).toBeNull()
    expect(confirmation.observe(noBars)).toEqual(noBars)
    confirmation.reset()
    expect(confirmation.observe(noBars)).toBeNull()
  })
})
