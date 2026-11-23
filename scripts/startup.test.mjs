import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { chromium } from 'playwright'

test('startup progresses while waiting and reflects connection changes', async () => {
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.clock.install()
    const html = (await readFile('index.html', 'utf8')).replace(/<script type="module" src="\/src\/bootstrap\.ts"><\/script>/, '')
    await page.setContent(html)
    const heading = page.locator('#startup-heading')
    const message = page.locator('#startup-message')
    const retry = page.locator('#startup-retry')

    assert.equal(await heading.textContent(), 'Loading Flixer')
    assert.equal(await retry.isHidden(), true)
    await page.clock.fastForward(10_000)
    assert.equal(await heading.textContent(), 'Taking a little longer')
    await page.clock.fastForward(20_000)
    assert.equal(await heading.textContent(), 'Still waiting for Flixer')
    assert.equal(await retry.isVisible(), true)
    await page.context().setOffline(true)
    assert.match(await message.textContent(), /offline/i)
    await page.context().setOffline(false)
    assert.match(await message.textContent(), /keep waiting/i)
    await page.locator('#startup').evaluate((element) => element.remove())
    await page.context().setOffline(true)
  } finally {
    await browser.close()
  }
})

test('startup errors are not overwritten by waiting messages', async () => {
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.clock.install()
    const html = (await readFile('index.html', 'utf8')).replace(/<script type="module" src="\/src\/bootstrap\.ts"><\/script>/, '')
    await page.setContent(html)
    await page.evaluate(() => {
      document.getElementById('startup').dataset.failed = 'true'
      document.getElementById('startup-heading').textContent = 'Flixer could not start'
      document.getElementById('startup-retry').hidden = false
    })
    await page.clock.fastForward(30_000)
    assert.equal(await page.locator('#startup-heading').textContent(), 'Flixer could not start')

    const latePage = await browser.newPage()
    await latePage.clock.install()
    await latePage.setContent(html)
    await latePage.clock.fastForward(30_000)
    await latePage.evaluate(() => {
      document.getElementById('startup').dataset.failed = 'true'
      document.getElementById('startup-message').textContent = 'Flixer could not start. Please reload.'
    })
    await latePage.context().setOffline(true)
    assert.equal(await latePage.locator('#startup-message').textContent(), 'Flixer could not start. Please reload.')
  } finally {
    await browser.close()
  }
})
