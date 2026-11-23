if (window.frameElement?.getAttribute("data-flixer-tv-viewport") === "true") {
	const parent = window.parent as Window & { Capacitor?: { isNativePlatform: () => boolean; getPlatform: () => string } };
	const bridge = parent.Capacitor;
	if (bridge?.isNativePlatform()) {
		Object.assign(window, { Capacitor: bridge, CapacitorCustomPlatform: { name: bridge.getPlatform() } });
	}
}
try {
	const { initializeTvFrame, isTvFrame } = await import("./platform/tvFrame");
	const { isTvMode } = await import("./platform/tvMode");
	if (isTvMode.value && !isTvFrame()) initializeTvFrame();
	else await import("./main");
} catch (error) {
	console.error("[startup] Could not start Flixer", error);
	const startup = document.getElementById("startup");
	const heading = document.getElementById("startup-heading");
	const message = document.getElementById("startup-message");
	const retry = document.getElementById("startup-retry");
	if (startup) startup.dataset.failed = "true";
	if (heading) heading.textContent = "Flixer could not start";
	if (message) message.textContent = "Flixer could not start. Please reload.";
	if (retry) retry.hidden = false;
}
