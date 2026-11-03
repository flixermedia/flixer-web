// Verifies every locale file is valid and has no keys or placeholders that the source (en.json) lacks.
// Missing translations are fine: they fall back to English at runtime.
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

type LocaleMessages = Record<string, unknown>

const dir = fileURLToPath(new URL('../src/locales/', import.meta.url))

function asMessages(value: unknown): LocaleMessages {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError('Expected a JSON object of locale messages.')
  }
  return value as LocaleMessages
}

function flatten(messages: LocaleMessages, prefix = '', output: LocaleMessages = {}): LocaleMessages {
  for (const [key, value] of Object.entries(messages)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      flatten(asMessages(value), fullKey, output)
    } else {
      output[fullKey] = value
    }
  }
  return output
}

function placeholders(value: string): string {
  return [...value.matchAll(/\{(\w+)\}/g)]
    .map((match) => match[1])
    .sort()
    .join(',')
}

function load(file: string): LocaleMessages {
  return flatten(asMessages(JSON.parse(readFileSync(join(dir, file), 'utf8'))))
}

const source = load('en.json')
let errors = 0

for (const file of readdirSync(dir).filter((name) => name.endsWith('.json') && name !== 'en.json')) {
  let messages: LocaleMessages
  try {
    messages = load(file)
  } catch (error) {
    console.error(`${file}: invalid JSON (${error instanceof Error ? error.message : String(error)})`)
    errors++
    continue
  }
  for (const [key, value] of Object.entries(messages)) {
    if (!(key in source)) {
      console.error(`${file}: unknown key "${key}"`)
      errors++
    } else if (
      typeof value === 'string' &&
      value !== '' &&
      placeholders(value) !== placeholders(String(source[key]))
    ) {
      console.error(`${file}: placeholders differ for "${key}"`)
      errors++
    }
  }
  const done = Object.values(messages).filter((value) => value !== '').length
  console.log(`${file}: ${done}/${Object.keys(source).length} translated`)
}

process.exit(errors ? 1 : 0)
