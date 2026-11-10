import { ref } from 'vue'

export type ThemePreference = 'dark' | 'light' | 'auto'

export const THEME_STORAGE_KEY = 'flixer.theme'
export const THEME_OPTIONS: ThemePreference[] = ['dark', 'light', 'auto']
const THEME_COLORS = { dark: '#080811', light: '#f5f4fa' }

function readStored(): ThemePreference | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return stored === 'light' || stored === 'auto' || stored === 'dark' ? stored : null
  } catch {
    return null
  }
}

let hasChoice = readStored() !== null
const preference = ref<ThemePreference>(readStored() ?? 'dark')
/** Whether the interface is currently drawn in its light palette. */
const isLight = ref(false)
const systemQuery = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null

function apply() {
  const light = preference.value === 'light' || (preference.value === 'auto' && systemQuery?.matches === true)
  isLight.value = light
  const root = document.documentElement
  root.classList.toggle('light', light)
  const scheme = light ? 'light' : 'dark'
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', scheme)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[scheme])
}

/** The active theme's backgrounds, used for the browser chrome colour. */
export function setThemeChromeColors(colors: { dark: string; light: string }) {
  THEME_COLORS.dark = colors.dark
  THEME_COLORS.light = colors.light
  apply()
}

/** The active theme's suggested mode; it only applies until the person picks a mode themselves. */
export function setThemeDefaultMode(mode: ThemePreference) {
  if (hasChoice) return
  preference.value = mode
  apply()
}

/** Applies the saved theme and follows the system setting while the preference is "auto". */
export function initTheme() {
  apply()
  systemQuery?.addEventListener('change', apply)
}

export function useTheme() {
  function setTheme(value: ThemePreference) {
    preference.value = value
    hasChoice = true
    try {
      localStorage.setItem(THEME_STORAGE_KEY, value)
    } catch {
      // Storage can be unavailable (private mode); the choice still applies for this session.
    }
    apply()
  }

  return { preference, setTheme, isLight }
}
