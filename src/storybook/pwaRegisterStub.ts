// Stand-in for the PWA plugin virtual module, which Storybook and its tests do not load.
export function registerSW(): () => Promise<void> {
	return async () => undefined;
}
