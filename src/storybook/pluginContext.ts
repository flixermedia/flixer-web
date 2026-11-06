import { provide, ref } from "vue";
import { pluginViewContextKey, type PluginViewContext } from "../composables/usePluginActions";

/** Story decorator that provides the plugin page context (query, busy, run, patchQuery) the Plugin* nodes inject. */
export function withPluginContext(overrides: Partial<PluginViewContext> = {}) {
	return (story: unknown) => ({
		components: { story: story as object },
		setup() {
			const context: PluginViewContext = {
				query: ref<Record<string, string>>({}),
				busy: ref(false),
				run: async () => true,
				patchQuery: () => undefined,
				...overrides,
			};
			provide(pluginViewContextKey, context);
		},
		template: "<story />",
	});
}
