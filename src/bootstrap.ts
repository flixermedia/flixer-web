if (window.frameElement?.getAttribute("data-flixer-tv-viewport") === "true") {
	const parent = window.parent as Window & { Capacitor?: { isNativePlatform: () => boolean; getPlatform: () => string } };
	const bridge = parent.Capacitor;
	if (bridge?.isNativePlatform()) {
		Object.assign(window, { Capacitor: bridge, CapacitorCustomPlatform: { name: bridge.getPlatform() } });
	}
}
const { initializeTvFrame, isTvFrame } = await import("./platform/tvFrame");
const { isTvMode } = await import("./platform/tvMode");

if (isTvMode.value && !isTvFrame()) initializeTvFrame();
else await import("./main");
