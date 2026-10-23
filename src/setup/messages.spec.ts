import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import en from '../locales/en.json'

function createUntyped(): { global: { t(key: string, values: Record<string, string>): string } } {
  const create = createI18n as unknown as (options: object) => { global: { t(key: string, values: Record<string, string>): string } }
  return create({ legacy: false, locale: 'en', messages: { en }, missingWarn: false, warnHtmlMessage: false })
}

function leaves(value: unknown, path = ''): string[] {
  if (typeof value === 'string') return [path]
  if (typeof value !== 'object' || value === null) return []
  return Object.entries(value).flatMap(([key, child]) => leaves(child, path ? `${path}.${key}` : key))
}

// vue-i18n only compiles a message when it is first shown, so a bad one (a bare "@" or "|") breaks that screen at runtime.
describe('setup messages', () => {
  it('all compile and render', () => {
    const errors: string[] = []
    const i18n = createUntyped()
    const keys = leaves((en as { setup: unknown }).setup, 'setup')
    expect(keys.length).toBeGreaterThan(50)
    for (const key of keys) {
      try {
        const text = i18n.global.t(key, { services: 'x', message: 'x' })
        if (text === key) errors.push(`${key}: did not render`)
      } catch (error) {
        errors.push(`${key}: ${(error as Error).message}`)
      }
    }
    expect(errors).toEqual([])
  })
})
