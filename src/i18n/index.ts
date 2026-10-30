import { createI18n } from 'vue-i18n'
import { getAccessToken, getPreferences, updatePreferences } from '../api'
import en from '../locales/en.json'
import { catchError } from '../utils/catchError'

export type MessageSchema = typeof en

export const SOURCE_LOCALE = 'en'
const STORAGE_KEY = 'flixer.locale'

// Every src/locales/<code>.json is picked up automatically (this is what Weblate commits to).
const loaders = import.meta.glob<{ default: MessageSchema }>(['../locales/*.json', '!../locales/en.json'])

function codeFromPath(path: string) {
  return path.slice(path.lastIndexOf('/') + 1, -'.json'.length)
}

export const availableLocales: string[] = [SOURCE_LOCALE, ...Object.keys(loaders).map(codeFromPath)].sort()

export const i18n = createI18n<[MessageSchema], string, false>({
  legacy: false,
  locale: SOURCE_LOCALE,
  fallbackLocale: SOURCE_LOCALE,
  messages: { [SOURCE_LOCALE]: en },
})

/** Native name of a locale, e.g. "Deutsch" for "de". */
export function localeName(code: string): string {
  try {
    const name = new Intl.DisplayNames([code], { type: 'language' }).of(code)
    return name ? name.charAt(0).toLocaleUpperCase(code) + name.slice(1) : code
  } catch {
    return code
  }
}

const COUNTRY_OVERRIDES: Record<string, string> = { en: 'gb', pt: 'pt', ar: 'sa', zh: 'cn' }

/** Lower-case ISO country code for a locale's flag, e.g. "de" -> "de", "pt-BR" -> "br". */
export function localeCountry(code: string): string | undefined {
  if (COUNTRY_OVERRIDES[code]) return COUNTRY_OVERRIDES[code]
  try {
    return new Intl.Locale(code).maximize().region?.toLowerCase()
  } catch {
    return undefined
  }
}

function resolveInitialLocale(): string {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && availableLocales.includes(stored)) return stored
  for (const lang of navigator.languages ?? [navigator.language]) {
    if (availableLocales.includes(lang)) return lang
    const base = lang.split('-')[0]
    if (availableLocales.includes(base)) return base
  }
  return SOURCE_LOCALE
}

async function applyLocale(code: string): Promise<void> {
  if (!availableLocales.includes(code)) code = SOURCE_LOCALE
  if (!i18n.global.availableLocales.includes(code)) {
    const load = loaders[`../locales/${code}.json`]
    if (load) i18n.global.setLocaleMessage(code, (await load()).default)
  }
  i18n.global.locale.value = code
  document.documentElement.lang = code
  localStorage.setItem(STORAGE_KEY, code)
}

/** Switches language and, when signed in, saves the choice to the user's account. */
export async function setLocale(code: string): Promise<void> {
  await applyLocale(code)
  if (getAccessToken() && navigator.onLine) {
    void updatePreferences({ language: i18n.global.locale.value }).catch(() => undefined)
  }
}

/** Applies the language saved on the account (if any); otherwise uploads the current choice. Never throws. */
export async function syncLocaleFromAccount(): Promise<void> {
  if (!getAccessToken() || !navigator.onLine) return
  const [preferencesError, preferences] = await catchError(getPreferences())
  if (preferencesError) return // Offline or signed out: keep the locally stored language.

  if (preferences.language && availableLocales.includes(preferences.language)) {
    const [localeError] = await catchError(applyLocale(preferences.language))
    if (localeError) return
  } else {
    await catchError(updatePreferences({ language: i18n.global.locale.value }))
  }
}

export function initLocale(): Promise<void> {
  return applyLocale(resolveInitialLocale())
}
