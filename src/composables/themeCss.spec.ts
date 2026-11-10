import { describe, expect, it } from 'vitest'
import { accentOverrideVariables, contrastRatio, dominantColor, mixHex, paletteVariables } from './themeCss'

const palette = { background: '#000000', surface: '#111111', border: '#222222', primary: '#7645d7', secondary: '#4d9fe4', accent: '#9fe1ff', highlight: '#00ffff', text: '#ffffff', muted: '#999999', ink: '#ffffff' }

describe('themeCss', () => {
  it('rates black on white as maximum contrast', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5)
  })

  it('emits a variable per palette colour', () => {
    const css = paletteVariables(palette)
    expect(css).toContain('--color-flixer-primary:#7645d7')
    expect(css).toContain('--color-flixer-background:#000000')
  })
  it('mixes colours', () => {
    expect(mixHex('#000000', '#ffffff', 0.5)).toBe('#808080')
    expect(accentOverrideVariables('#ff0000', true)['--color-flixer-primary']).toBe('#ff0000')
  })

  it('finds a dominant colour and ignores greys', () => {
    const red = new Uint8ClampedArray([200, 30, 30, 255, 200, 30, 30, 255])
    expect(dominantColor(red)).toMatch(/^#[0-9a-f]{6}$/)
    expect(dominantColor(new Uint8ClampedArray([128, 128, 128, 255]))).toBeNull()
  })
})
