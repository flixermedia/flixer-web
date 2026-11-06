import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { playwright } from "@vitest/browser-playwright";
const dirname = path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
	test: {
		coverage: { provider: "v8", reporter: ["text-summary", "html"], watermarks: { statements: [30, 70], branches: [30, 70], functions: [30, 70], lines: [30, 70] }, exclude: ["**/*.json", "**/*.stories.ts", "src/storybook/**", "src/main.ts"] },
		projects: [
			{
				extends: true,
				test: {
					name: "unit",
					environment: "node",
					include: ["src/**/*.spec.ts"],
				},
			},
			{
				extends: true,
				// Pre-bundle plugins that only a few stories import, so Vite doesn't re-optimise and reload mid-run.
				optimizeDeps: {
					include: [
						"@capacitor/haptics",
						"@capacitor/keyboard",
						"@capacitor/splash-screen",
						"@capgo/capacitor-native-biometric",
						"@capgo/capacitor-persistent-account",
						"@capgo/capacitor-textinteraction",
					],
				},
				resolve: { alias: { "virtual:pwa-register": path.join(dirname, "src/storybook/pwaRegisterStub.ts") } },
				plugins: [
					vue(),
					tailwindcss(),
					// The plugin will run tests for the stories defined in your Storybook config
					// See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
					storybookTest({
						configDir: path.join(dirname, ".storybook"),
					}),
				],
				test: {
					name: "storybook",
					browser: {
						enabled: true,
						headless: true,
						provider: playwright({}),
						instances: [
							{
								browser: "chromium",
							},
						],
					},
				},
			},
		],
	},
});
