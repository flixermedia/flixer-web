import type { ThemeConfig, ThemePalette } from '../api/appearance'

const FONT_STACKS: Record<ThemeConfig['typography']['font'], string> = {
  system: "'Segoe UI', system-ui, sans-serif",
  humanist: "Seravek, 'Gill Sans Nova', Ubuntu, Calibri, 'DejaVu Sans', 'Source Sans Pro', sans-serif",
  geometric: "Avenir, Montserrat, Corbel, 'URW Gothic', 'Source Sans Pro', sans-serif",
  serif: "Charter, 'Bitstream Charter', 'Sitka Text', Cambria, serif",
  mono: "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace",
  rounded: "ui-rounded, 'Hiragino Maru Gothic ProN', Quicksand, Comfortaa, Manjari, 'Arial Rounded MT', 'Arial Rounded MT Bold', Calibri, sans-serif",
}

const CONTENT_MAX = { compact: '80rem', standard: '110rem', wide: '130rem', full: '100vw' } as const
const SPACING = { compact: '0.23rem', comfortable: '0.25rem', spacious: '0.275rem' } as const

/** Tailwind's radius scale in rem at the default 0.25rem corner; each step scales with the chosen roundness. */
const RADIUS_SCALE: [string, number][] = [
  ['xs', 0.125],
  ['sm', 0.25],
  ['md', 0.375],
  ['lg', 0.5],
  ['xl', 0.75],
  ['2xl', 1],
  ['3xl', 1.5],
  ['4xl', 2],
]
const DEFAULT_RADIUS = 0.25

function rem(value: number): string {
  return `${Math.round(value * 1000) / 1000}rem`
}

export function paletteVariables(palette: ThemePalette): string {
  return [
    `--color-flixer-background:${palette.background}`,
    `--color-flixer-surface:${palette.surface}`,
    `--color-flixer-border:${palette.border}`,
    `--color-flixer-primary:${palette.primary}`,
    `--color-flixer-secondary:${palette.secondary}`,
    `--color-flixer-accent:${palette.accent}`,
    `--color-flixer-cyan:${palette.highlight}`,
    `--color-flixer-text:${palette.text}`,
    `--color-flixer-muted:${palette.muted}`,
    `--color-white:${palette.ink}`,
  ].join(';')
}

/** Everything about a theme except its custom CSS, as one stylesheet. Only validated enum and hex values are interpolated. */
export function buildThemeCss(config: ThemeConfig): string {
  const scale = config.shape.radius / DEFAULT_RADIUS
  const radii = RADIUS_SCALE.map(([name, size]) => `--radius-${name}:${rem(size * scale)}`).join(';')
  const shared = [`--radius:${rem(config.shape.radius)}`, radii, `--font-sans:${FONT_STACKS[config.typography.font]}`, `--spacing:${SPACING[config.layout.density]}`, `--content-max:${CONTENT_MAX[config.layout.contentWidth]}`].join(';')

  return [
    `html:root{${paletteVariables(config.colors.dark)};${shared}}`,
    `html:root.light{${paletteVariables(config.colors.light)}}`,
    `html:root .theme-dark{${paletteVariables(config.colors.dark)}}`,
  ].join('\n')
}

/** The same variables as an inline style map, to render a theme in one container without touching the page. */
export function themeVariableMap(config: ThemeConfig, mode: 'dark' | 'light'): Record<string, string> {
  const variables: Record<string, string> = {}
  const declarations = [paletteVariables(config.colors[mode]), `--radius:${rem(config.shape.radius)}`, ...RADIUS_SCALE.map(([name, size]) => `--radius-${name}:${rem(size * (config.shape.radius / DEFAULT_RADIUS))}`), `--font-sans:${FONT_STACKS[config.typography.font]}`]
  for (const declaration of declarations.join(';').split(';')) {
    const separator = declaration.indexOf(':')
    variables[declaration.slice(0, separator)] = declaration.slice(separator + 1)
  }
  return variables
}

export const FONT_SAMPLES = FONT_STACKS

/** Attributes the stylesheet and header read to switch layout, card, button and header variants. */
export function themeAttributes(config: ThemeConfig): Record<string, string> {
  return {
    'data-card-style': config.layout.cardStyle,
    'data-button-style': config.layout.buttonStyle,
    'data-header-style': config.header.style,
    'data-content-width': config.layout.contentWidth,
  }
}

const RELATIVE_LUMINANCE_CHANNELS = [0.2126, 0.7152, 0.0722]

function channel(hex: string, index: number): number {
  const value = Number.parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16) / 255
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string): number {
  return RELATIVE_LUMINANCE_CHANNELS.reduce((sum, weight, index) => sum + weight * channel(hex, index), 0)
}

/** WCAG contrast ratio between two #rrggbb colours, from 1 to 21. */
export function contrastRatio(first: string, second: string): number {
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a)
  return (light + 0.05) / (dark + 0.05)
}

function channels(hex: string): [number, number, number] {
  return [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16)) as [number, number, number]
}

/** Blends `from` towards `to`; amount 0 returns `from`, 1 returns `to`. */
export function mixHex(from: string, to: string, amount: number): string {
  const [a, b] = [channels(from), channels(to)]
  return `#${a.map((value, index) => Math.round(value + (b[index] - value) * amount).toString(16).padStart(2, '0')).join('')}`
}

/** The accent pair for an override colour: the colour itself as primary, and a readable variant for links and focus rings. */
export function accentOverrideVariables(color: string, light: boolean): Record<string, string> {
  return { '--color-flixer-primary': color, '--color-flixer-accent': light ? mixHex(color, '#000000', 0.25) : mixHex(color, '#ffffff', 0.4) }
}

/** The most characteristic colour of an image, pulled towards a mid-tone so white text stays readable on it. */
export function dominantColor(pixels: Uint8ClampedArray): string | null {
  const buckets = new Map<number, { weight: number; r: number; g: number; b: number }>()
  for (let index = 0; index < pixels.length; index += 4) {
    const [r, g, b, a] = [pixels[index], pixels[index + 1], pixels[index + 2], pixels[index + 3]]
    if (a < 200) continue
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const saturation = max === 0 ? 0 : (max - min) / max
    if (max < 50 || saturation < 0.25) continue
    const key = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5)
    const bucket = buckets.get(key) ?? { weight: 0, r: 0, g: 0, b: 0 }
    const weight = saturation * (0.5 + max / 510)
    bucket.weight += weight
    bucket.r += r * weight
    bucket.g += g * weight
    bucket.b += b * weight
    buckets.set(key, bucket)
  }
  let best: { weight: number; r: number; g: number; b: number } | null = null
  for (const bucket of buckets.values()) if (!best || bucket.weight > best.weight) best = bucket
  if (!best) return null
  const toHex = (value: number) => Math.round(value / best!.weight).toString(16).padStart(2, '0')
  const color = `#${toHex(best.r)}${toHex(best.g)}${toHex(best.b)}`
  const brightness = luminance(color)
  // White text must stay legible: darken light colours, lift near-black ones.
  if (brightness > 0.3) return mixHex(color, '#000000', Math.min(0.6, (brightness - 0.3) * 1.6))
  if (brightness < 0.04) return mixHex(color, '#ffffff', 0.25)
  return color
}
