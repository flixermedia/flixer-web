import type { StorybookConfig } from "@storybook/vue3-vite";
import type { Plugin } from "vite";

/**
 * Replaces every exported function of src/api/*.ts with a `fn()` spy (from storybook/test) so stories never reach the network.
 * Stories give them values in `beforeEach`, e.g. `mocked(getFavoriteIds).mockResolvedValue({ ids: [] })`. Non-function exports stay real.
 */
function mockApiModules(): Plugin {
	return {
		name: "flixer-mock-api",
		enforce: "pre",
		transform(code, id) {
			if (!/\/src\/api\/[^/]+\.ts$/.test(id) || id.endsWith(".spec.ts")) return null;
			const names: string[] = [];
			const body = code.replace(/^export (async )?function (\w+)/gm, (_match, isAsync: string | undefined, name: string) => {
				names.push(name);
				return `${isAsync ?? ""}function ${name}`;
			});
			if (names.length === 0) return null;
			const stubs = names.map((name) => `const __mock_${name} = __fn(async () => undefined).mockName(${JSON.stringify(name)});`).join("\n");
			const exports = names.map((name) => `__mock_${name} as ${name}`).join(", ");
			return { code: `import { fn as __fn } from "storybook/test";\n${body}\n${stubs}\nexport { ${exports} };\n`, map: null };
		},
	};
}

const config: StorybookConfig = {
	stories: ["../src/**/*.mdx", "../src/**/*.stories.@(ts|tsx)"],
	addons: ["@storybook/addon-docs", "@storybook/addon-a11y", "@storybook/addon-vitest", "@chromatic-com/storybook"],
	framework: { name: "@storybook/vue3-vite", options: { docgen: "vue-component-meta" } },
	staticDirs: ["../public"],
	async viteFinal(viteConfig) {
		// The app's PWA, SSL and proxy setup is irrelevant to Storybook; keep only the Vue and Tailwind plugins.
		const keep = (plugin: unknown): boolean => {
			const name = (plugin as { name?: string } | null)?.name ?? "";
			return !/pwa|basic-ssl|workbox/i.test(name);
		};
		viteConfig.plugins = [mockApiModules(), ...(viteConfig.plugins ?? []).flat().filter(keep)];
		viteConfig.server = { ...viteConfig.server, proxy: undefined };
		return viteConfig;
	},
};

export default config;
