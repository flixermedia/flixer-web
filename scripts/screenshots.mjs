import { chromium } from 'playwright'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ADMIN_TABS, adminQuery } from '../src/components/admin/adminNav.ts'

const standardPages = [
  ['home', '/'], ['discover', '/discover'], ['movies', '/movies'], ['tv', '/tv'],
  ['music', '/music'], ['guide', '/guide'], ['search', '/search'], ['requests', '/requests'],
  ['people', '/people'], ['notifications', '/notifications'], ['chat', '/chat'],
  ['chat-mail', '/chat?tab=mail'], ['issues', '/issues'], ['admin-activity', '/admin/activity'],
]
const settingsTabs = ['profile', 'passkeys', 'language', 'defaultPlayback', 'chatEncryption', 'webhooks', 'billing']
const dynamicRoutes = [
  ['media', /^\/media\/[^/]+$/],
  ['person', /^\/person\/[^/]+$/],
  ['playlist', /^\/playlists\/[^/]+$/],
  ['profile', /^\/u\/[^/]+$/],
  ['request', /^\/request\/[^/]+\/[^/]+$/],
  ['plugin', /^\/plugins\/[^/]+\/[^/]+$/],
]

export function builtInPages() {
  return [
    ...standardPages.map(([name, path]) => ({ name, path })),
    ...settingsTabs.map((tab) => ({ name: `settings-${tab}`, path: `/settings?tab=${tab}`, settingsTab: tab })),
    ...Object.entries(ADMIN_TABS).flatMap(([tab, pages]) => pages.map((page) => ({
      name: `admin-${tab}-${page}`,
      path: `/admin?${new URLSearchParams(adminQuery(tab, page))}`,
    }))),
  ]
}

export function parseOptions(args, env = process.env) {
  const options = {
    url: env.FLIXER_URL || 'http://localhost:5173',
    output: 'screenshots',
    viewport: { width: 1920, height: 1080 },
    settleMs: 2000,
    maxPerType: 3,
    fullPage: false,
    headed: false,
    paths: [],
    maskSelectors: [],
    username: env.FLIXER_ADMIN_USERNAME,
    password: env.FLIXER_ADMIN_PASSWORD,
  }
  const take = (index, option) => {
    if (!args[index] || args[index].startsWith('--')) throw new Error(`${option} requires a value`)
    return args[index]
  }
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--help') return { help: true }
    if (arg === '--headed') options.headed = true
    else if (arg === '--full-page') options.fullPage = true
    else if (arg === '--url') options.url = take(++i, arg)
    else if (arg === '--output') options.output = take(++i, arg)
    else if (arg === '--path') options.paths.push(take(++i, arg))
    else if (arg === '--mask-selector') options.maskSelectors.push(take(++i, arg))
    else if (arg === '--viewport') {
      const match = /^(\d+)x(\d+)$/.exec(take(++i, arg))
      if (!match || Number(match[1]) < 320 || Number(match[2]) < 240 || Number(match[1]) > 7680 || Number(match[2]) > 4320) throw new Error('Viewport must be WIDTHxHEIGHT between 320x240 and 7680x4320')
      options.viewport = { width: Number(match[1]), height: Number(match[2]) }
    } else if (arg === '--settle-ms' || arg === '--max-per-type') {
      const value = take(++i, arg)
      if (!/^\d+$/.test(value) || Number(value) > (arg === '--settle-ms' ? 60000 : 100)) throw new Error(`Invalid ${arg}`)
      if (arg === '--settle-ms') options.settleMs = Number(value)
      else options.maxPerType = Number(value)
    } else if (arg !== '--headed' && arg !== '--full-page') throw new Error(`Unknown option: ${arg}`)
  }
  const url = new URL(options.url)
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('--url must be an HTTP(S) origin without a path, credentials, query, or fragment')
  }
  options.url = url.origin
  for (const path of options.paths) {
    if (!path.startsWith('/') || path.startsWith('//') || new URL(path, options.url).origin !== options.url || path.includes('#')) {
      throw new Error('--path must be a same-origin path without a fragment')
    }
  }
  if (Boolean(options.username) !== Boolean(options.password)) throw new Error('Set both FLIXER_ADMIN_USERNAME and FLIXER_ADMIN_PASSWORD')
  if (!options.username && !options.headed) throw new Error('Provide admin credentials via environment variables, or use --headed to sign in manually')
  return options
}

export function discoverPaths(hrefs, origin, seen, maxPerType) {
  const found = []
  for (const href of hrefs) {
    let url
    try { url = new URL(href, origin) } catch { continue }
    if (url.origin !== origin || url.search || url.hash) continue
    const route = dynamicRoutes.find(([, pattern]) => pattern.test(url.pathname))
    if (!route) continue
    const [type] = route
    const paths = seen.get(type) ?? new Set()
    if (paths.has(url.pathname) || paths.size >= maxPerType) continue
    paths.add(url.pathname)
    seen.set(type, paths)
    found.push({ name: `${type}-${paths.size}`, path: url.pathname })
  }
  return found
}

async function preparePage(page, options) {
  await page.locator('main').first().waitFor({ state: 'visible', timeout: 30000 })
  await page.waitForFunction(() => !document.querySelector('main [aria-busy="true"]'), null, { timeout: 30000 })
  await page.waitForTimeout(options.settleMs)
  await page.evaluate(async () => {
    await Promise.race([
      Promise.all([...document.images].filter((image) => {
        const rect = image.getBoundingClientRect()
        return rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth
      }).map((image) => image.decode().catch(() => undefined))),
      new Promise((resolve) => setTimeout(resolve, 5000)),
    ])
    await document.fonts.ready
  })
}

const universalMasks = [
  'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"])',
  'textarea', 'select', '[contenteditable]:not([contenteditable="false"])',
  'iframe', 'canvas', 'pre', 'code', '[role="alert"]',
  '[data-screenshot-sensitive]', '[data-screenshot-redacted]',
  'header button[aria-haspopup="menu"]',
  'a[href^="/u/"]',
]

/** Covers sensitive content with opaque pixels, rather than a reversible visual blur. */
export async function maskedScreenshot(page, options) {
  await page.evaluate(() => {
    const secret = /(?:\b[a-z][a-z0-9+.-]*:\/\/[^\s]+|\bwww\.[^\s]+|\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b|\b(?:[a-z0-9-]+\.)+(?:[a-z]{2,}|local|internal)(?::\d+)?\b|\b(?:\d{1,3}\.){3}\d{1,3}\b|\[[0-9a-f:]{3,}\]|\b(?:[0-9a-f]{0,4}:){2,}[0-9a-f]{0,4}\b|(?:^|[\s("'=])\/(?:[a-z0-9._-]+\/)+[^\s]*|\b[a-z]:\\(?:[^\\\s]+\\)+[^\s]*|\\\\[^\\\s]+\\[^\s]+|\b(?:bearer\s+)?eyJ[a-zA-Z0-9_-]{12,}\.[a-zA-Z0-9_-]+|\b(?:sk|pk|ghp|github_pat)_[A-Za-z0-9_-]{8,}|\b[A-Za-z0-9_-]{32,}\b|\b(?:\d[ -]*?){13,19}\b)/i
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    while (walker.nextNode()) {
      const node = walker.currentNode
      const parent = node.parentElement
      if (!parent || parent.closest('script, style, noscript, template')) continue
      if (secret.test(node.textContent ?? '')) parent.setAttribute('data-screenshot-redacted', '')
    }
    for (const element of document.querySelectorAll('a, span, p, td, dd, li, label, [data-screenshot-sensitive]')) {
      if ((element.textContent?.length ?? 0) <= 1000 && secret.test(element.textContent ?? '')) {
        element.setAttribute('data-screenshot-redacted', '')
      }
    }
  })
  const url = new URL(page.url())
  const masks = [...universalMasks, ...options.maskSelectors]
  if (url.pathname === '/admin' || url.pathname === '/admin/activity') {
    masks.push('main tbody', 'main li:not(nav li)', 'main dl', 'main .font-mono', 'main svg text')
  }
  if (['/chat', '/people', '/notifications', '/issues', '/requests'].includes(url.pathname) ||
      /^\/(?:u|chat|issues|playlists|request|plugins)\//.test(url.pathname)) {
    masks.push('main')
  }
  if (url.pathname === '/settings' && ['profile', 'passkeys', 'billing', 'webhooks', 'chatEncryption'].includes(url.searchParams.get('tab') || 'profile')) {
    masks.push('#settings-panel')
  }
  return page.screenshot({
    fullPage: options.fullPage, animations: 'disabled', caret: 'hide',
    mask: masks.map((selector) => page.locator(selector)), maskColor: '#242431',
  })
}

async function signIn(page, options) {
  await page.goto(`${options.url}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.locator('input[name="username"]').waitFor({ state: 'visible', timeout: 30000 })
  await preparePage(page, options)
  const loginScreenshot = await maskedScreenshot(page, options)
  if (options.username) {
    await page.locator('input[name="username"]').fill(options.username)
    await page.locator('input[name="password"]').fill(options.password)
    await page.locator('form').first().locator('button[type="submit"]').click()
    try { await page.waitForURL((url) => url.pathname !== '/login' && url.pathname !== '/register', { timeout: options.headed ? 300000 : 30000 }) }
    catch { throw new Error('Sign-in did not complete. Check credentials, account status, or use --headed for passkey verification.') }
  } else {
    console.log('Sign in as an administrator in the browser, including any passkey verification.')
    await page.waitForURL((url) => url.pathname !== '/login' && url.pathname !== '/register', { timeout: 300000 })
  }
  await page.goto(`${options.url}/admin`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  try { await page.waitForFunction(() => location.pathname !== '/admin' || !!document.querySelector('#admin-header-actions'), null, { timeout: 30000 }) }
  catch { throw new Error('The session cannot access the admin dashboard. Sign in with an administrator account and ensure the server is available.') }
  if (new URL(page.url()).pathname !== '/admin') throw new Error('The session cannot access the admin dashboard. Sign in with an administrator account.')
  return loginScreenshot
}

export async function capture(options) {
  const outputRoot = resolve(options.output)
  await mkdir(outputRoot, { recursive: true, mode: 0o700 })
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const output = await mkdtemp(join(outputRoot, `run-${timestamp}-`))
  const browser = await chromium.launch({ headless: !options.headed })
  const results = []
  try {
    const context = await browser.newContext({ viewport: options.viewport, deviceScaleFactor: 1, reducedMotion: 'reduce' })
    const page = await context.newPage()
    const loginScreenshot = await signIn(page, options)
    await writeFile(join(output, 'login.png'), loginScreenshot, { mode: 0o600 })
    results.push({ name: 'login', status: 'captured', file: 'login.png' })
    console.log('OK   login')
    const queue = [...(options.pages ?? builtInPages()), ...options.paths.map((path, index) => ({ name: `custom-${index + 1}`, path }))]
    const discovered = new Map()
    for (let index = 0; index < queue.length; index++) {
      const target = queue[index]
      try {
        const response = await page.goto(new URL(target.path, options.url).href, { waitUntil: 'domcontentloaded', timeout: 30000 })
        if (response && !response.ok()) throw new Error(`HTTP ${response.status()}`)
        await preparePage(page, options)
        const actual = new URL(page.url())
        const expected = new URL(target.path, options.url)
        if (actual.origin !== options.url || actual.pathname !== expected.pathname) throw new Error(`Unexpected redirect to ${actual.pathname}`)
        if (target.settingsTab) {
          const tab = page.locator(`#settings-tab-${target.settingsTab}`)
          if (await tab.count() === 0) {
            results.push({ name: target.name, status: 'skipped', reason: 'Settings tab is unavailable on this server' })
            console.log(`SKIP ${target.name}: settings tab unavailable`)
            continue
          }
          if (await tab.getAttribute('aria-selected') !== 'true') throw new Error('Requested settings tab is not selected')
        }
        queue.push(...discoverPaths(await page.locator('a[href]').evaluateAll((links) => links.map((link) => link.href)), options.url, discovered, options.maxPerType))
        const file = `${target.name}.png`
        const screenshot = await maskedScreenshot(page, options)
        await writeFile(resolve(output, file), screenshot, { mode: 0o600 })
        results.push({ name: target.name, status: 'captured', file })
        console.log(`OK   ${target.name}`)
      } catch (error) {
        const message = error instanceof Error && /^HTTP \d{3}$/.test(error.message) ? error.message : 'Navigation or capture failed'
        results.push({ name: target.name, status: 'failed', error: message })
        console.error(`FAIL ${target.name}: ${message}`)
      }
    }
    await writeFile(resolve(output, 'manifest.json'), JSON.stringify({ generatedAt: new Date().toISOString(), viewport: options.viewport, fullPage: options.fullPage, results }, null, 2) + '\n', { mode: 0o600 })
    const failed = results.filter((result) => result.status === 'failed').length
    console.log(`Captured ${results.filter((result) => result.status === 'captured').length}, skipped ${results.filter((result) => result.status === 'skipped').length}, failed ${failed}. Output: ${output}`)
    if (failed) process.exitCode = 1
    return results
  } finally {
    await browser.close()
  }
}

const help = `Capture Flixer Web screenshots using an administrator account.

Usage: npm run screenshots -- [options]
  --url ORIGIN          Flixer Web origin (default: FLIXER_URL or http://localhost:5173)
  --output DIRECTORY    Output directory (default: screenshots)
  --viewport WIDTHxHEIGHT  Viewport size (default: 1920x1080)
  --full-page           Capture the full scrollable page
  --settle-ms MS        Delay after loading (default: 2000)
  --max-per-type N      Maximum discovered pages per content type (default: 3; 0 disables discovery)
  --path PATH           Add a same-origin page, repeatable
  --mask-selector CSS   Opaquely mask additional elements, repeatable
  --headed              Show Chromium; sign in manually if credentials are not supplied
  --help                Show this help

Set FLIXER_ADMIN_USERNAME and FLIXER_ADMIN_PASSWORD for password sign-in.
Screenshots and manifests may contain private server data; review before sharing.`

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const options = parseOptions(process.argv.slice(2))
    if (options.help) console.log(help)
    else await capture(options)
  } catch (error) {
    console.error(`Screenshot capture failed: ${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
  }
}
