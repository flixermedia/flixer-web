// Verifies every locale file is valid and has no keys or placeholders that the source (en.json) lacks.
// Missing translations are fine: they fall back to English at runtime.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = new URL('../src/locales/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object') flatten(v, key, out)
    else out[key] = v
  }
  return out
}

const placeholders = (s) =>
  [...String(s).matchAll(/\{(\w+)\}/g)]
    .map((m) => m[1])
    .sort()
    .join(',')
const load = (file) => flatten(JSON.parse(readFileSync(join(dir, file), 'utf8')))

const source = load('en.json')
let errors = 0

for (const file of readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'en.json')) {
  let messages
  try {
    messages = load(file)
  } catch (e) {
    console.error(`${file}: invalid JSON (${e.message})`)
    errors++
    continue
  }
  for (const [key, value] of Object.entries(messages)) {
    if (!(key in source)) {
      console.error(`${file}: unknown key "${key}"`)
      errors++
    } else if (typeof value === 'string' && value !== '' && placeholders(value) !== placeholders(source[key])) {
      console.error(`${file}: placeholders differ for "${key}"`)
      errors++
    }
  }
  const done = Object.values(messages).filter((v) => v !== '').length
  console.log(`${file}: ${done}/${Object.keys(source).length} translated`)
}

process.exit(errors ? 1 : 0)
