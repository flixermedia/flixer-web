import { initializeTvZoomControls, TV_REFERENCE_HEIGHT, TV_REFERENCE_WIDTH, tvViewportBounds } from "./tvViewport";
import { isNativeTv } from "./tvMode";

export function isTvFrame(): boolean {
	return window.frameElement?.getAttribute("data-flixer-tv-viewport") === "true";
}

export function initializeTvFrame(): void {
	const frame = document.createElement("iframe");
	frame.dataset.flixerTvViewport = "true";
	frame.title = "Flixer TV";
	frame.allow = "autoplay; encrypted-media; picture-in-picture; publickey-credentials-get; publickey-credentials-create";
	frame.allowFullscreen = true;
	frame.src = window.location.href;
	Object.assign(frame.style, {
		position: "absolute",
		width: `${TV_REFERENCE_WIDTH}px`,
		height: `${TV_REFERENCE_HEIGHT}px`,
		border: "0",
		transformOrigin: "top left",
	});
	const update = () => {
		const { scale, left, top } = tvViewportBounds(window.innerWidth, window.innerHeight);
		if (isNativeTv) {
			frame.style.left = `${left / scale}px`;
			frame.style.top = `${top / scale}px`;
			frame.style.zoom = String(scale);
		} else {
			frame.style.left = `${left}px`;
			frame.style.top = `${top}px`;
			frame.style.transform = `scale(${scale})`;
		}
	};
	document.documentElement.style.overflow = "hidden";
	Object.assign(document.body.style, { margin: "0", background: "#000", overflow: "hidden" });
	frame.addEventListener("load", () => frame.focus());
	frame.addEventListener("error", () => console.error("[tv-frame] Could not load the TV application"));
	document.body.replaceChildren(frame);
	update();
	window.addEventListener("resize", update);
	initializeTvZoomControls();
}

export function tvNavigationWindow(): Window {
	return isTvFrame() ? window.parent : window;
}
