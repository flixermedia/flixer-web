import { readFile } from "node:fs/promises";
import { compileStyle, parse } from "@vue/compiler-sfc";
import { chromium } from "playwright";
import { expect, it } from "vitest";

it("isolates Square's iframe color scheme without changing Stripe", async () => {
	const source = await readFile(new URL("./CardElement.vue", import.meta.url), "utf8");
	const { descriptor } = parse(source);
	expect(descriptor.template?.content).toContain(`:data-square-card="setup?.provider === 'square' ? '' : undefined"`);
	const style = compileStyle({ source: descriptor.styles[0].content, filename: "CardElement.vue", id: "data-v-test", scoped: true });
	expect(style.errors).toEqual([]);

	const browser = await chromium.launch({ headless: true });
	try {
		const page = await browser.newPage();
		await page.setContent(`
			<style>html { color-scheme: dark; } ${style.code}</style>
			<div data-v-test data-square-card><iframe title="Square"></iframe></div>
			<div data-v-test><iframe title="Stripe"></iframe></div>
		`);
		expect(await page.locator('iframe[title="Square"]').evaluate((frame) => getComputedStyle(frame).colorScheme)).toBe("light");
		expect(await page.locator('iframe[title="Stripe"]').evaluate((frame) => getComputedStyle(frame).colorScheme)).toBe("dark");

		await page.evaluate(() => { document.documentElement.style.colorScheme = "light"; });
		expect(await page.locator('iframe[title="Square"]').evaluate((frame) => getComputedStyle(frame).colorScheme)).toBe("light");
		expect(await page.locator('iframe[title="Stripe"]').evaluate((frame) => getComputedStyle(frame).colorScheme)).toBe("light");
	} finally {
		await browser.close();
	}
});
