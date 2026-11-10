import { computed, ref, shallowRef, watch } from 'vue'
import { getAccessToken, getPublicAppearance, updatePreferences, type AppTheme, type PublicAppearance } from '../api'
import { getApiBaseUrl } from '../platform/serverConnection'
import { accentOverrideVariables, buildThemeCss, themeAttributes } from './themeCss'
import { setThemeChromeColors, setThemeDefaultMode, useTheme } from './useTheme'

export const DEFAULT_APP_NAME = 'Flixer'
const CACHE_KEY = 'flixer.appearance'
const USER_THEME_KEY = 'flixer.themeId'
const STYLE_ID = 'flixer-theme'
const CUSTOM_STYLE_ID = 'flixer-theme-custom'
const REFRESH_INTERVAL_MS = 30_000
const SAFE_MODE_KEY = 'flixer.safeTheme'
const ACCENT_PROPERTIES = ['--color-flixer-primary', '--color-flixer-accent']

/** Recovery mode: `?theme=default` shows plain Flixer, ignoring every theme and its custom CSS, until `?theme=restore`. */
function readSafeMode(): boolean {
  try {
    const params = new URLSearchParams(window.location.search)
    const requested = params.get('theme')
    if (requested === 'default' || requested === 'restore') {
      if (requested === 'default') sessionStorage.setItem(SAFE_MODE_KEY, '1')
      else sessionStorage.removeItem(SAFE_MODE_KEY)
      params.delete('theme')
      const query = params.toString()
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`)
    }
    return sessionStorage.getItem(SAFE_MODE_KEY) === '1'
  } catch {
    return false
  }
}

const safeMode = ref(false)
const libraryAccentId = ref<string | null>(null)
const artworkAccent = ref<string | null>(null)

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function readUserThemeId(): string | null {
  try {
    return localStorage.getItem(USER_THEME_KEY)
  } catch {
    return null
  }
}

const state = shallowRef<PublicAppearance | null>(readJson<PublicAppearance>(CACHE_KEY))
const userThemeId = ref<string | null>(readUserThemeId())
let lastRefresh = 0

/** The theme everyone sees, unless the admin lets people pick and this person has picked an allowed one. */
const activeTheme = computed<AppTheme | null>(() => {
  const current = state.value
  if (!current || safeMode.value) return null
  const chosen = current.userSelectionEnabled && userThemeId.value ? current.themes.find((theme) => theme.id === userThemeId.value) : undefined
  return chosen ?? current.themes.find((theme) => theme.id === current.activeThemeId) ?? null
})

/** An artwork colour wins over the library's colour, which wins over the theme's own accent. */
const accentOverride = computed<string | null>(() => {
  const theme = activeTheme.value
  if (!theme) return null
  if (artworkAccent.value && theme.config.layout.artworkAccent === true) return artworkAccent.value
  return libraryAccentId.value ? (state.value?.libraryAccents?.[libraryAccentId.value] ?? null) : null
})

/** Call with the library of the page being viewed, and null when leaving it. */
export function setLibraryAccent(libraryId: string | null) {
  libraryAccentId.value = libraryId
}

/** Call with a colour taken from the artwork being viewed, and null when leaving it. */
export function setArtworkAccent(color: string | null) {
  artworkAccent.value = color
}

export const artworkAccentEnabled = computed(() => activeTheme.value?.config.layout.artworkAccent === true)

const appName = computed(() => activeTheme.value?.config.branding.appName?.trim() || DEFAULT_APP_NAME)

/** The product name as it should appear in text shown to people; used for page titles and translated strings. */
export function brandName(): string {
  return appName.value
}

function styleElement(id: string): HTMLStyleElement {
  let element = document.getElementById(id) as HTMLStyleElement | null
  if (!element) {
    element = document.createElement('style')
    element.id = id
    document.head.append(element)
  }
  return element
}

function applyFavicon(favicon: string | null) {
  for (const link of document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')) {
    link.dataset.originalHref ??= link.getAttribute('href') ?? ''
    if (favicon) {
      link.setAttribute('href', favicon)
      link.removeAttribute('sizes')
      link.removeAttribute('type')
    } else {
      link.setAttribute('href', link.dataset.originalHref)
    }
  }
}

function applyManifest(theme: AppTheme | null) {
  const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
  if (!link) return
  link.dataset.originalHref ??= link.getAttribute('href') ?? ''
  link.setAttribute('href', theme ? `${getApiBaseUrl()}/appearance/manifest.webmanifest?theme=${encodeURIComponent(theme.id)}` : link.dataset.originalHref)
  const touchIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')
  if (touchIcon) {
    touchIcon.dataset.originalHref ??= touchIcon.getAttribute('href') ?? ''
    const favicon = theme?.config.branding.favicon
    touchIcon.setAttribute('href', favicon?.startsWith('data:image/png') ? favicon : touchIcon.dataset.originalHref)
  }
  document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute('content', theme?.config.branding.appName?.trim() || DEFAULT_APP_NAME)
}

function resetTheme() {
  document.getElementById(STYLE_ID)?.remove()
  document.getElementById(CUSTOM_STYLE_ID)?.remove()
  for (const name of ['data-card-style', 'data-button-style', 'data-header-style', 'data-content-width']) document.documentElement.removeAttribute(name)
  applyFavicon(null)
  applyManifest(null)
}

function applyTheme(theme: AppTheme | null) {
  if (!theme) {
    if (safeMode.value) resetTheme()
    return
  }
  const { config } = theme
  styleElement(STYLE_ID).textContent = buildThemeCss(config)
  styleElement(CUSTOM_STYLE_ID).textContent = config.customCss
  for (const [name, value] of Object.entries(themeAttributes(config))) {
    document.documentElement.setAttribute(name, value)
  }
  applyFavicon(config.branding.favicon)
  applyManifest(theme)
  setThemeChromeColors({ dark: config.colors.dark.background, light: config.colors.light.background })
  setThemeDefaultMode(config.defaultMode)
  document.title = document.title.replace(/\bFlixer\b/g, appName.value)
}

function cache(value: PublicAppearance) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(value))
  } catch {
    // The next visit just fetches the theme again.
  }
}

export async function refreshAppearance(): Promise<void> {
  lastRefresh = Date.now()
  try {
    const next = await getPublicAppearance()
    state.value = next
    cache(next)
  } catch {
    // Offline or the server is unreachable: keep showing the last known theme.
  }
}

/** Applies the last known theme immediately, then keeps it in step with the server. */
export function initAppearance() {
  safeMode.value = readSafeMode()
  watch(activeTheme, applyTheme, { immediate: true })
  const { isLight } = useTheme()
  watch([accentOverride, isLight], ([color, light]) => {
    const style = document.documentElement.style
    if (!color) {
      for (const property of ACCENT_PROPERTIES) style.removeProperty(property)
      return
    }
    for (const [property, value] of Object.entries(accentOverrideVariables(color, light))) style.setProperty(property, value)
  })
  void refreshAppearance()
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && Date.now() - lastRefresh > REFRESH_INTERVAL_MS) void refreshAppearance()
  })
}

/** Takes over the person's saved theme choice after signing in. */
export function syncAppearanceFromAccount(themeId: string | undefined): void {
  if (themeId) setUserTheme(themeId, false)
  else if (userThemeId.value) setUserTheme(userThemeId.value, true)
}

function setUserTheme(id: string | null, persist: boolean) {
  userThemeId.value = id
  try {
    if (id) localStorage.setItem(USER_THEME_KEY, id)
    else localStorage.removeItem(USER_THEME_KEY)
  } catch {
    // Storage can be unavailable; the choice still applies for this session.
  }
  if (persist && getAccessToken()) void updatePreferences({ themeId: id }).catch(() => undefined)
}

export function useAppearance() {
  const { isLight } = useTheme()
  const themes = computed(() => state.value?.themes ?? [])
  const userSelectionEnabled = computed(() => state.value?.userSelectionEnabled === true)
  const logoUrl = computed(() => {
    const branding = activeTheme.value?.config.branding
    return (isLight.value && branding?.logoLight) || branding?.logo || null
  })
  const showName = computed(() => activeTheme.value?.config.header.showName !== false)

  return {
    activeTheme,
    appName,
    logoUrl,
    showName,
    themes,
    userSelectionEnabled,
    userThemeId,
    /** Pass null to go back to the server's theme. */
    selectTheme: (id: string | null) => setUserTheme(id, true),
  }
}
