import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, test } from 'node:test'
import { chromium } from 'playwright'
import { builtInPages, capture, discoverPaths, maskedScreenshot, parseOptions } from './screenshots.mjs'

const credentials = { FLIXER_ADMIN_USERNAME: 'admin', FLIXER_ADMIN_PASSWORD: 'test-password' }

test('options validate credentials, origins and viewport', () => {
  const options = parseOptions(['--viewport', '1280x720', '--max-per-type', '0', '--path', '/media/abc'], credentials)
  assert.deepEqual(options.viewport, { width: 1280, height: 720 })
  assert.equal(options.maxPerType, 0)
  assert.deepEqual(parseOptions(['--mask-selector', '.private', '--mask-selector', '#secret'], credentials).maskSelectors, ['.private', '#secret'])
  assert.throws(() => parseOptions(['--mask-selector'], credentials), /requires a value/)
  assert.throws(() => parseOptions([], {}), /credentials/)
  assert.throws(() => parseOptions(['--url', 'https://user:pass@example.com'], credentials), /origin/)
  assert.throws(() => parseOptions(['--path', '//example.org'], credentials), /same-origin/)
  assert.throws(() => parseOptions(['--viewport', '0x720'], credentials), /Viewport/)
})

test('admin pages and settings tabs are included without duplicate names', () => {
  const pages = builtInPages()
  assert.ok(pages.some((page) => page.path === '/admin?tab=analytics&page=analyticsVideo'))
  assert.ok(pages.some((page) => page.path === '/settings?tab=webhooks'))
  assert.equal(new Set(pages.map((page) => page.name)).size, pages.length)
})

test('discovery is bounded, same-origin and does not include player or invitation links', () => {
  const seen = new Map()
  const found = discoverPaths(['/media/1', '/media/1', '/media/2', '/person/3', '/live/1', '/friend-invite/secret', 'https://other.example/media/4', '/media/5?secret=x'], 'https://flixer.example', seen, 1)
  assert.deepEqual(found.map((page) => page.path), ['/media/1', '/person/3'])
  assert.deepEqual(discoverPaths(['/media/6'], 'https://flixer.example', seen, 1), [])
})

test('opaque masking covers sensitive pixels in normal and full-page captures', async () => {
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({ viewport: { width: 800, height: 500 } })
    await page.setContent(`<style>body{margin:0}.box{position:absolute;width:100px;height:40px;background:rgb(200,20,20)} #safe{background:rgb(0,200,0)}</style>
      <main>
        <div id="address" class="box" style="left:0;top:0">https://private.example/path</div>
        <div id="email" class="box" style="left:110px;top:0">user@example.com</div>
        <div id="ip" class="box" style="left:220px;top:0">192.168.10.1</div>
        <div id="path" class="box" style="left:330px;top:0">/srv/media/movies</div>
        <div id="token" class="box" style="left:440px;top:0">abcdefghijklmnopqrstuvwxyz1234567890</div>
        <input id="input" class="box" style="left:0;top:60px" value="sensitive">
        <div id="custom" class="box" style="left:110px;top:60px">private name</div>
        <div id="marked" data-screenshot-sensitive class="box" style="left:220px;top:60px">private</div>
        <div id="safe" class="box" style="left:330px;top:60px">ordinary text</div>
        <div class="box" style="left:0;top:120px">2001:db8::1</div>
        <div class="box" style="left:110px;top:120px">C:\\private\\media</div>
        <div class="box" style="left:220px;top:120px">sk_test_123456789</div>
        <a class="box" style="left:330px;top:120px"><span>https://</span><span>secret.example</span></a>
        <div id="below" class="box" style="left:0;top:600px">https://hidden.example</div>
      </main>`)
    for (const fullPage of [false, true]) {
      const buffer = await maskedScreenshot(page, { fullPage, maskSelectors: ['#custom'] })
      const pixels = await page.evaluate(async (data) => {
        const image = new Image()
        image.src = `data:image/png;base64,${data}`
        await image.decode()
        const canvas = document.createElement('canvas')
        canvas.width = image.width
        canvas.height = image.height
        const context = canvas.getContext('2d')
        context.drawImage(image, 0, 0)
        const pixel = (x, y) => [...context.getImageData(x, y, 1, 1).data]
        return { masked: [[50, 20], [160, 20], [270, 20], [380, 20], [490, 20], [50, 80], [160, 80], [270, 80], [50, 140], [160, 140], [270, 140], [380, 140]].map(([x, y]) => pixel(x, y)), safe: pixel(410, 85), below: image.height > 620 ? pixel(50, 620) : null }
      }, buffer.toString('base64'))
      for (const pixel of pixels.masked) assert.deepEqual(pixel, [36, 36, 49, 255])
      assert.deepEqual(pixels.safe, [0, 200, 0, 255])
      if (fullPage) assert.deepEqual(pixels.below, [36, 36, 49, 255])
    }
    await assert.rejects(maskedScreenshot(page, { fullPage: false, maskSelectors: ['[invalid'] }))
  } finally {
    await browser.close()
  }
})

let server
let url
let directory
before(async () => {
  directory = await mkdtemp(join(tmpdir(), 'flixer-screenshots-test-'))
  server = createServer((request, response) => {
    if (request.url === '/missing') {
      response.writeHead(404).end('Missing')
      return
    }
    response.setHeader('content-type', 'text/html')
    response.end(`<!doctype html><html><body><main>
      <form><input name="username"><input name="password" type="password"><button type="submit">Sign in</button></form>
      <a href="/media/item-1">Media</a>
      ${request.url === '/admin' ? '<div id="admin-header-actions"></div>' : ''}
      <div id="settings-tab-profile" aria-selected="true">Profile</div>
      <h1>Flixer fixture</h1>
      <script>
        document.querySelector('form').addEventListener('submit', event => {
          event.preventDefault();
          localStorage.setItem('test-auth', document.querySelector('[name="username"]').value);
          location.href = '/';
        });
        if (location.pathname === '/admin' && localStorage.getItem('test-auth') !== 'admin') {
          document.querySelector('#admin-header-actions').remove();
          location.href = '/';
        }
      </script>
    </main></body></html>`)
  })

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  url = `http://127.0.0.1:${server.address().port}`
})

test('rejects a signed-in non-admin account before taking screenshots', async () => {
  const output = join(directory, 'non-admin')
  const options = parseOptions(['--url', url, '--output', output, '--settle-ms', '0'], {
    FLIXER_ADMIN_USERNAME: 'viewer', FLIXER_ADMIN_PASSWORD: 'test-password',
  })
  options.pages = [{ name: 'home', path: '/' }]
  await assert.rejects(capture(options), /cannot access the admin dashboard/)
})

test('invalid masking selector fails before any screenshot is saved', async () => {
  const output = join(directory, 'invalid-mask')
  const options = parseOptions(['--url', url, '--output', output, '--settle-ms', '0', '--mask-selector', '[invalid'], credentials)
  await assert.rejects(capture(options))
  const run = join(output, (await readdir(output))[0])
  assert.deepEqual(await readdir(run), [])
})

test('admin content and private pages are masked without hiding admin navigation', async () => {
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({ viewport: { width: 800, height: 500 } })
    await page.goto(url)
    await page.evaluate(() => localStorage.setItem('test-auth', 'admin'))
    await page.goto(`${url}/admin`)
    await page.setContent(`<style>body{margin:0} li, tbody, #private {background:rgb(200,20,20)} li{width:100px;height:40px}</style>
      <main><nav><ul><li>Navigation</li></ul></nav><ul><li>Private name</li></ul><table><tbody><tr><td>Private user</td></tr></tbody></table></main>`)
    await maskedScreenshot(page, { fullPage: false, maskSelectors: [] })
    assert.equal(await page.locator('nav li').getAttribute('data-screenshot-redacted'), null)
    const screenshot = await maskedScreenshot(page, { fullPage: false, maskSelectors: [] })
    const colors = await page.evaluate(async (data) => {
      const image = new Image()
      image.src = `data:image/png;base64,${data}`
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height
      const context = canvas.getContext('2d')
      context.drawImage(image, 0, 0)
      return ['nav li', 'main > ul li', 'tbody'].map((selector) => {
        const rect = document.querySelector(selector).getBoundingClientRect()
        return [...context.getImageData(Math.floor(rect.right - 5), Math.floor(rect.bottom - 5), 1, 1).data]
      })
    }, screenshot.toString('base64'))
    assert.deepEqual(colors, [[200, 20, 20, 255], [36, 36, 49, 255], [36, 36, 49, 255]])
    await page.goto(`${url}/chat`)
    await page.setContent('<main id="private" style="background:rgb(200,20,20);width:100px;height:100px">private conversation</main>')
    const privateScreenshot = await maskedScreenshot(page, { fullPage: false, maskSelectors: [] })
    const privatePixel = await page.evaluate(async (data) => {
      const image = new Image()
      image.src = `data:image/png;base64,${data}`
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height
      const context = canvas.getContext('2d')
      context.drawImage(image, 0, 0)
      return [...context.getImageData(50, 50, 1, 1).data]
    }, privateScreenshot.toString('base64'))
    assert.deepEqual(privatePixel, [36, 36, 49, 255])
  } finally {
    await browser.close()
  }
})
after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  await rm(directory, { recursive: true, force: true })
})

test('captures pages, discovers media and records failed navigation without leaking credentials', async () => {
  const output = join(directory, 'capture')
  const options = parseOptions(['--url', url, '--output', output, '--settle-ms', '0', '--max-per-type', '1'], credentials)
  options.pages = [
    { name: 'home', path: '/' },
    { name: 'profile-settings', path: '/settings?tab=profile', settingsTab: 'profile' },
    { name: 'billing-settings', path: '/settings?tab=billing', settingsTab: 'billing' },
    { name: 'missing', path: '/missing' },
  ]
  const previousExitCode = process.exitCode
  try {
    const results = await capture(options)
    assert.deepEqual(results.map((item) => item.status), ['captured', 'captured', 'captured', 'skipped', 'failed', 'captured'])
    assert.equal(process.exitCode, 1)
    const run = join(output, (await readdir(output))[0])
    assert.equal((await readFile(join(run, 'home.png'))).subarray(1, 4).toString(), 'PNG')
    assert.equal((await readFile(join(run, 'login.png'))).subarray(1, 4).toString(), 'PNG')
    const manifest = await readFile(join(run, 'manifest.json'), 'utf8')
    assert.ok(manifest.includes('"media-1"'))
    assert.ok(!manifest.includes(credentials.FLIXER_ADMIN_PASSWORD))
    assert.ok(!manifest.includes(credentials.FLIXER_ADMIN_USERNAME))
    assert.ok(!manifest.includes(url))
    assert.ok(!manifest.includes('/media/item-1'))
    assert.ok(!manifest.includes('"path"'))
  } finally {
    process.exitCode = previousExitCode
  }
})
