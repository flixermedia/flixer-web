import { afterEach, describe, expect, it, vi } from "vitest";
import { isTvMode } from "./tvMode";
import { initializeTvZoomControls, tvViewportBounds, tvViewportScale } from "./tvViewport";

describe("TV viewport scale", () => {
	it("normalizes TV display sizes to the reference layout", () => {
		expect(tvViewportScale(960, 540)).toBe(0.75);
		expect(tvViewportScale(1280, 720)).toBe(1);
		expect(tvViewportScale(1920, 1080)).toBe(1.5);
	});

	describe("TV zoom controls", () => {
		afterEach(() => {
			isTvMode.value = false;
			vi.unstubAllGlobals();
		});

		it("blocks zoom shortcuts and gestures only in TV mode", () => {
			const target = new EventTarget();
			vi.stubGlobal("window", target);
			const cleanup = initializeTvZoomControls();
			const key = (key: string, modifiers: { ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean; code?: string } = {}) => Object.assign(new Event("keydown", { cancelable: true }), { key, code: "", ctrlKey: false, metaKey: false, altKey: false }, modifiers);
			const wheel = (ctrlKey: boolean) => Object.assign(new Event("wheel", { cancelable: true }), { ctrlKey, metaKey: false });

			isTvMode.value = true;
			for (const event of [key("+", { ctrlKey: true }), key("-", { ctrlKey: true }), key("0", { ctrlKey: true }), key("=", { metaKey: true }), key("Add", { ctrlKey: true, code: "NumpadAdd" }), wheel(true), new Event("gesturestart", { cancelable: true }), new Event("gesturechange", { cancelable: true })]) {
				target.dispatchEvent(event);
				expect(event.defaultPrevented).toBe(true);
			}
			const normalWheel = wheel(false);
			const normalShortcut = key("c", { ctrlKey: true });
			const altGrInput = key("=", { ctrlKey: true, altKey: true });
			for (const event of [normalWheel, normalShortcut, altGrInput]) {
				target.dispatchEvent(event);
				expect(event.defaultPrevented).toBe(false);
			}

			isTvMode.value = false;
			const outsideTv = key("+", { ctrlKey: true });
			target.dispatchEvent(outsideTv);
			expect(outsideTv.defaultPrevented).toBe(false);
			cleanup();
			isTvMode.value = true;
			const afterCleanup = key("+", { ctrlKey: true });
			target.dispatchEvent(afterCleanup);
			expect(afterCleanup.defaultPrevented).toBe(false);
		});
	});

	it("fits the reference within either dimension and handles invalid sizes", () => {
		expect(tvViewportScale(1280, 600)).toBe(600 / 720);
		expect(tvViewportScale(0, 720)).toBe(1);
		expect(tvViewportScale(Number.NaN, 720)).toBe(1);
	});

	it("fits the same 16:9 canvas at TV resolutions and centers non-16:9 viewports", () => {
		const sizes: [number, number][] = [[256, 144], [426, 240], [640, 360], [854, 480], [960, 540], [1280, 720], [1600, 900], [1920, 1080], [2560, 1440], [3200, 1800], [3840, 2160], [5120, 2880], [5760, 3240], [7680, 4320], [10240, 5760], [1128, 435], [457, 786]];
		for (const [width, height] of sizes) {
			const { scale, left, top } = tvViewportBounds(width, height);
			expect(left).toBeGreaterThanOrEqual(0);
			expect(top).toBeGreaterThanOrEqual(0);
			expect(left + 1280 * scale / 2).toBeCloseTo(width / 2);
			expect(top + 720 * scale / 2).toBeCloseTo(height / 2);
			expect(Math.min(left, top)).toBeCloseTo(0);
		}
	});
});
