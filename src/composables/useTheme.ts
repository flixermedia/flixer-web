import { ref } from 'vue'

export type ThemePreference = 'dark' | 'light' | 'auto'

export const THEME_STORAGE_KEY = 'flixer.theme'
export const THEME_OPTIONS: ThemePreference[] = ['dark', 'light', 'auto']
const THEME_COLORS = { dark: '#080811', light: '#f5f4fa' }

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return stored === 'light' || stored === 'auto' ? stored : 'dark'
  } catch {
    return 'dark'
  }
}

const preference = ref<ThemePreference>(readPreference())
const systemQuery = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null

function apply() {
  const light = preference.value === 'light' || (preference.value === 'auto' && systemQuery?.matches === true)
  const root = document.documentElement
  root.classList.toggle('light', light)
  const scheme = light ? 'light' : 'dark'
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', scheme)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[scheme])
}

/** Applies the saved theme and follows the system setting while the preference is "auto". */
export function initTheme() {
  apply()
  systemQuery?.addEventListener('change', apply)
}

export function useTheme() {
  function setTheme(value: ThemePreference) {
    preference.value = value
    try {
      localStorage.setItem(THEME_STORAGE_KEY, value)
    } catch {
      // Storage can be unavailable (private mode); the choice still applies for this session.
    }
    apply()
  }

  return { preference, setTheme }
}
