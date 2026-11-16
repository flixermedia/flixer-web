import { describe, expect, it } from 'vitest'
import { iconTooltipPosition } from './iconButtonTooltips'

describe('icon tooltip position', () => {
  it('places the label below the button when there is room', () => {
    expect(
      iconTooltipPosition(
        { left: 100, top: 40, bottom: 80, width: 40, height: 40 },
        { width: 100, height: 24 },
        { width: 400, height: 300 },
      ),
    ).toEqual({ top: 88, left: 70 })
  })

  it('places the label above the button when the lower edge is near the viewport bottom', () => {
    expect(
      iconTooltipPosition(
        { left: 100, top: 260, bottom: 300, width: 40, height: 40 },
        { width: 100, height: 24 },
        { width: 400, height: 320 },
      ),
    ).toEqual({ top: 228, left: 70 })
  })

  it('keeps the label inside the horizontal viewport edges', () => {
    expect(
      iconTooltipPosition(
        { left: 0, top: 40, bottom: 80, width: 40, height: 40 },
        { width: 100, height: 24 },
        { width: 320, height: 300 },
      ),
    ).toEqual({ top: 88, left: 8 })
  })
})
