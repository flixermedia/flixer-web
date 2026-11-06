import { onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";

/** Story decorator that registers named routes (`{ name: path }`) so `RouterLink :to="{ name }"` resolves; the preview router only has a catch-all. */
export function withNamedRoutes(routes: Record<string, string>) {
	return (story: unknown) => ({
		components: { story: story as never },
		setup() {
			const router = useRouter();
			const removers = Object.entries(routes).map(([name, path]) => router.addRoute({ name, path, component: { render: () => null } }));
			onBeforeUnmount(() => removers.forEach((remove) => remove()));
		},
		template: "<story />",
	});
}
