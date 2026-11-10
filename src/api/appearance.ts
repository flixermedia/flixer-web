/** Appearance themes: what every visitor loads, and the admin operations for managing them. */
import { api } from './client'

export const PALETTE_KEYS = ['background', 'surface', 'border', 'primary', 'secondary', 'accent', 'highlight', 'text', 'muted', 'ink'] as const
export type PaletteKey = (typeof PALETTE_KEYS)[number]
export type ThemePalette = Record<PaletteKey, string>

export const THEME_FONTS = ['system', 'humanist', 'geometric', 'serif', 'mono', 'rounded'] as const
export const CONTENT_WIDTHS = ['compact', 'standard', 'wide', 'full'] as const
export const DENSITIES = ['compact', 'comfortable', 'spacious'] as const
export const CARD_STYLES = ['outlined', 'elevated', 'flat', 'glass'] as const
export const BUTTON_STYLES = ['solid', 'gradient', 'soft'] as const
export const HEADER_STYLES = ['floating', 'bar', 'transparent', 'minimal'] as const
export const HEADER_HEIGHTS = ['compact', 'standard', 'tall'] as const
export const NAV_ALIGNMENTS = ['start', 'center'] as const
export const DEFAULT_MODES = ['dark', 'light', 'auto'] as const

export interface ThemeConfig {
  defaultMode: (typeof DEFAULT_MODES)[number]
  colors: { dark: ThemePalette; light: ThemePalette }
  shape: { radius: number }
  typography: { font: (typeof THEME_FONTS)[number] }
  layout: {
    contentWidth: (typeof CONTENT_WIDTHS)[number]
    density: (typeof DENSITIES)[number]
    cardStyle: (typeof CARD_STYLES)[number]
    buttonStyle: (typeof BUTTON_STYLES)[number]
    /** Tint the accent colour from the artwork of the title being viewed. */
    artworkAccent?: boolean
  }
  header: {
    style: (typeof HEADER_STYLES)[number]
    height: (typeof HEADER_HEIGHTS)[number]
    navAlign: (typeof NAV_ALIGNMENTS)[number]
    showName: boolean
  }
  branding: { appName: string | null; logo: string | null; logoLight: string | null; favicon: string | null; loginBackground?: string | null }
  customCss: string
}

export interface AppTheme {
  id: string
  name: string
  description: string
  builtIn: boolean
  config: ThemeConfig
  createdAt: string
  updatedAt: string
}

export interface PublicAppearance {
  activeThemeId: string
  userSelectionEnabled: boolean
  libraryAccents?: Record<string, string>
  themes: AppTheme[]
}

export interface ThemeSchedule {
  id?: string
  name: string
  themeId: string
  /** MM-DD */
  start: string
  /** MM-DD, inclusive; before the start means it runs over the new year. */
  end: string
  enabled: boolean
}

export interface ThemeVersion {
  id: string
  name: string
  description: string
  config: ThemeConfig
  createdAt: string
}

export interface AppearanceState {
  activeThemeId: string
  effectiveThemeId: string
  userSelectionEnabled: boolean
  selectableThemeIds: string[]
  schedules: ThemeSchedule[]
  libraryAccents: Record<string, string>
  themes: AppTheme[]
}

export interface ThemeDraft {
  name: string
  description: string
  config: ThemeConfig
}

export interface ThemeFile {
  format: 'flixer-theme'
  version: number
  exportedAt: string
  theme: ThemeDraft
}

export const IMAGE_MAX_BYTES = 256 * 1024
export const BACKGROUND_MAX_BYTES = 768 * 1024
export const MAX_SCHEDULES = 24
export const CUSTOM_CSS_MAX = 30_000
export const THEME_NAME_MAX = 60
export const THEME_DESCRIPTION_MAX = 240
export const APP_NAME_MAX = 40
export const RADIUS_MAX = 1.5

export async function getPublicAppearance(): Promise<PublicAppearance> {
  return (await api.get<PublicAppearance>('/appearance')).data
}

export async function getAppearanceState(): Promise<AppearanceState> {
  return (await api.get<AppearanceState>('/admin/appearance')).data
}

export async function saveAppearanceSettings(settings: Partial<Pick<AppearanceState, 'activeThemeId' | 'userSelectionEnabled' | 'selectableThemeIds' | 'schedules' | 'libraryAccents'>>): Promise<AppearanceState> {
  return (await api.put<AppearanceState>('/admin/appearance/settings', settings)).data
}

export async function createTheme(draft: ThemeDraft): Promise<AppTheme> {
  return (await api.post<AppTheme>('/admin/appearance/themes', draft)).data
}

export async function updateTheme(id: string, draft: ThemeDraft): Promise<AppTheme> {
  return (await api.put<AppTheme>(`/admin/appearance/themes/${encodeURIComponent(id)}`, draft)).data
}

export async function duplicateTheme(id: string): Promise<AppTheme> {
  return (await api.post<AppTheme>(`/admin/appearance/themes/${encodeURIComponent(id)}/duplicate`)).data
}

export async function deleteTheme(id: string): Promise<void> {
  await api.delete(`/admin/appearance/themes/${encodeURIComponent(id)}`)
}

export async function exportTheme(id: string): Promise<ThemeFile> {
  return (await api.get<ThemeFile>(`/admin/appearance/themes/${encodeURIComponent(id)}/export`)).data
}

/** The server validates and cleans the file; nothing is saved until the admin confirms with `createTheme`. */
export async function previewThemeImport(file: string): Promise<ThemeDraft> {
  return (await api.post<ThemeDraft>('/admin/appearance/import/preview', { file })).data
}

export async function listThemeVersions(id: string): Promise<ThemeVersion[]> {
  return (await api.get<ThemeVersion[]>(`/admin/appearance/themes/${encodeURIComponent(id)}/versions`)).data
}

export async function restoreThemeVersion(id: string, versionId: string): Promise<AppTheme> {
  return (await api.post<AppTheme>(`/admin/appearance/themes/${encodeURIComponent(id)}/versions/${encodeURIComponent(versionId)}/restore`)).data
}
