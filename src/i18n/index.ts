import { createI18n } from 'vue-i18n'
import en from '../locales/en.json'

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

export async function setLocale(code: string): Promise<void> {
  if (!availableLocales.includes(code)) code = SOURCE_LOCALE
  if (!i18n.global.availableLocales.includes(code)) {
    const load = loaders[`../locales/${code}.json`]
    if (load) i18n.global.setLocaleMessage(code, (await load()).default)
  }
  i18n.global.locale.value = code
  document.documentElement.lang = code
  localStorage.setItem(STORAGE_KEY, code)
}

export function initLocale(): Promise<void> {
  return setLocale(resolveInitialLocale())
}
