import { isTvMode } from "./tvMode";

export const TV_REFERENCE_WIDTH = 1280;
export const TV_REFERENCE_HEIGHT = 720;

export function tvViewportScale(width: number, height: number): number {
	if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return 1;
	return Math.min(width / TV_REFERENCE_WIDTH, height / TV_REFERENCE_HEIGHT);
}

export function tvViewportBounds(width: number, height: number): { scale: number; left: number; top: number } {
	const scale = tvViewportScale(width, height);
	return { scale, left: (width - TV_REFERENCE_WIDTH * scale) / 2, top: (height - TV_REFERENCE_HEIGHT * scale) / 2 };
}

export function initializeTvViewport(): void {
	const update = () => {
		const scale = String(tvViewportScale(window.screen.width, window.screen.height));
		document.documentElement.style.setProperty("--tv-scale", scale);
		document.documentElement.style.zoom = scale;
	};
	update();
	window.addEventListener("resize", update);
}

export function initializeTvZoomControls(): () => void {
	const onKeydown = (event: KeyboardEvent) => {
		if (!isTvMode.value || !(event.ctrlKey || event.metaKey) || event.altKey) return;
		if (["+", "=", "-", "_", "0", "Add", "Subtract"].includes(event.key) || ["NumpadAdd", "NumpadSubtract", "Numpad0"].includes(event.code)) {
			event.preventDefault();
		}
	};
	const onWheel = (event: WheelEvent) => {
		if (isTvMode.value && (event.ctrlKey || event.metaKey)) event.preventDefault();
	};
	const onGesture = (event: Event) => {
		if (isTvMode.value) event.preventDefault();
	};
	window.addEventListener("keydown", onKeydown, true);
	window.addEventListener("wheel", onWheel, { passive: false, capture: true });
	window.addEventListener("gesturestart", onGesture, { passive: false, capture: true });
	window.addEventListener("gesturechange", onGesture, { passive: false, capture: true });
	return () => {
		window.removeEventListener("keydown", onKeydown, true);
		window.removeEventListener("wheel", onWheel, true);
		window.removeEventListener("gesturestart", onGesture, true);
		window.removeEventListener("gesturechange", onGesture, true);
	};
}
