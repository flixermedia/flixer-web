import { describe, expect, it, vi } from "vitest";
import { candidatesInTvGrid, consumeTvBackHandoff, directionalScore, exitTvAdjustmentMode, focusTvDestination, isTvAdjustmentMode, shouldPreventNativeAdjustment, toggleTvAdjustmentMode } from "./tvNavigation";

describe("TV directional navigation", () => {
	const origin = { left: 100, right: 200, top: 100, bottom: 200 };

	it("only selects items in the requested direction", () => {
		const target = { left: 220, right: 320, top: 100, bottom: 200 };
		expect(directionalScore(origin, target, "right")).not.toBeNull();
		expect(directionalScore(origin, target, "left")).toBeNull();
	});

	it("prefers aligned items and then nearer items", () => {
		const aligned = { left: 220, right: 320, top: 100, bottom: 200 };
		const diagonal = { left: 205, right: 305, top: 210, bottom: 310 };
		const farther = { left: 400, right: 500, top: 100, bottom: 200 };
		expect(directionalScore(origin, aligned, "right")!).toBeLessThan(directionalScore(origin, diagonal, "right")!);
		expect(directionalScore(origin, aligned, "right")!).toBeLessThan(directionalScore(origin, farther, "right")!);
	});

	it("aligns a new row when moving vertically but not within the same row", () => {
		const previousRow = {};
		const nextRow = { scrollIntoView: vi.fn() };
		const active = { closest: (selector: string) => (selector === "[data-tv-row]" ? previousRow : null) } as unknown as HTMLElement;
		const next = { closest: (selector: string) => (selector === "[data-tv-row]" ? nextRow : null), focus: vi.fn(), scrollIntoView: vi.fn() } as unknown as HTMLElement;
		focusTvDestination(active, next, "down");
		expect(nextRow.scrollIntoView).toHaveBeenCalledWith({ block: "start", inline: "nearest" });
		nextRow.scrollIntoView.mockClear();
		focusTvDestination(active, next, "right");
		expect(nextRow.scrollIntoView).not.toHaveBeenCalled();
		focusTvDestination(next, next, "down");
		expect(nextRow.scrollIntoView).not.toHaveBeenCalled();
	});

	it("keeps ungrouped controls visible without forcing them to the top", () => {
		const active = { closest: () => null } as unknown as HTMLElement;
		const next = { closest: () => null, focus: vi.fn(), scrollIntoView: vi.fn() } as unknown as HTMLElement;
		focusTvDestination(active, next, "down");
		expect(next.scrollIntoView).toHaveBeenCalledTimes(1);
		expect(next.scrollIntoView).toHaveBeenCalledWith({ block: "nearest", inline: "nearest" });
	});

	it("keeps page context when entering grids configured for nearest scrolling", () => {
		const previousRow = {};
		const nextRow = { dataset: { tvScroll: "nearest" }, scrollIntoView: vi.fn() };
		const active = { closest: (selector: string) => (selector === "[data-tv-row]" ? previousRow : null) } as unknown as HTMLElement;
		const next = { closest: (selector: string) => (selector === "[data-tv-row]" ? nextRow : null), focus: vi.fn(), scrollIntoView: vi.fn() } as unknown as HTMLElement;
		focusTvDestination(active, next, "down");
		expect(next.scrollIntoView).toHaveBeenCalledWith({ block: "nearest", inline: "nearest" });
		expect(nextRow.scrollIntoView).not.toHaveBeenCalled();
	});

	it("does not top-align focus inside the TV navigation rail", () => {
		const active = { closest: () => null } as unknown as HTMLElement;
		const next = {
			closest: (selector: string) => (selector === "[data-tv-rail]" ? {} : null),
			focus: vi.fn(),
			scrollIntoView: vi.fn(),
		} as unknown as HTMLElement;
		focusTvDestination(active, next, "down");
		expect(next.scrollIntoView).toHaveBeenCalledTimes(1);
		expect(next.scrollIntoView).toHaveBeenCalledWith({ block: "nearest", inline: "nearest" });
	});

	it("keeps vertical navigation inside the focused grid when a card exists in that direction", () => {
		const grid = {};
		const active = { closest: (selector: string) => (selector === "[data-tv-grid]" ? grid : null) } as unknown as HTMLElement;
		const insideGrid = {
			closest: (selector: string) => (selector === "[data-tv-grid]" ? grid : null),
			getBoundingClientRect: () => ({ left: 100, right: 200, top: 220, bottom: 320 }),
		} as unknown as HTMLElement;
		const outsideGrid = {
			closest: () => null,
			getBoundingClientRect: () => ({ left: 100, right: 200, top: 0, bottom: 100 }),
		} as unknown as HTMLElement;
		expect(candidatesInTvGrid(active, [insideGrid, outsideGrid], origin, "down")).toEqual([insideGrid]);
	});

	it("keeps horizontal navigation inside the focused grid when a card exists in that direction", () => {
		const grid = {};
		const active = { closest: (selector: string) => (selector === "[data-tv-grid]" ? grid : null) } as unknown as HTMLElement;
		const insideGrid = {
			closest: (selector: string) => (selector === "[data-tv-grid]" ? grid : null),
			getBoundingClientRect: () => ({ left: 220, right: 320, top: 100, bottom: 200 }),
		} as unknown as HTMLElement;
		const outsideGrid = {
			closest: () => null,
			getBoundingClientRect: () => ({ left: 205, right: 305, top: 100, bottom: 200 }),
		} as unknown as HTMLElement;
		expect(candidatesInTvGrid(active, [insideGrid, outsideGrid], origin, "right")).toEqual([insideGrid]);
	});

	it("falls back to page links when no grid card exists in the requested direction", () => {
		const grid = {};
		const active = { closest: (selector: string) => (selector === "[data-tv-grid]" ? grid : null) } as unknown as HTMLElement;
		const insideGrid = {
			closest: (selector: string) => (selector === "[data-tv-grid]" ? grid : null),
			getBoundingClientRect: () => ({ left: 100, right: 200, top: 220, bottom: 320 }),
		} as unknown as HTMLElement;
		const pageLink = {
			closest: () => null,
			getBoundingClientRect: () => ({ left: 100, right: 200, top: 0, bottom: 100 }),
		} as unknown as HTMLElement;
		expect(candidatesInTvGrid(active, [insideGrid, pageLink], origin, "up")).toEqual([insideGrid, pageLink]);
	});

	it("requires Enter to enter and Escape to leave adjustment mode for ranges and scrub bars", () => {
		for (const kind of ["range", "slider"]) {
			const control = {
				matches: (selector: string) => selector.includes(kind === "range" ? 'input[type="range"]' : '[role="slider"]'),
				dataset: {},
			} as unknown as HTMLElement;
			expect(isTvAdjustmentMode(control)).toBe(false);
			expect(toggleTvAdjustmentMode(control)).toBe(true);
			expect(isTvAdjustmentMode(control)).toBe(true);
			expect(exitTvAdjustmentMode(control)).toBe(true);
			expect(isTvAdjustmentMode(control)).toBe(false);
		}
	});

	it("sends a second Back press to the TV rail after leaving adjustment mode", () => {
		const control = {
			matches: (selector: string) => selector.includes('input[type="range"]'),
			dataset: { tvAdjusting: "true" },
		} as unknown as HTMLElement;
		expect(exitTvAdjustmentMode(control, true)).toBe(true);
		expect(isTvAdjustmentMode(control)).toBe(false);
		expect(consumeTvBackHandoff(control)).toBe(true);
		expect(consumeTvBackHandoff(control)).toBe(false);
	});

	it("does not activate adjustment mode on other controls", () => {
		const button = { matches: () => false, dataset: {} } as unknown as HTMLElement;
		expect(toggleTvAdjustmentMode(button)).toBe(false);
		expect(isTvAdjustmentMode(button)).toBe(false);
	});

	it("suppresses native range arrows until adjustment mode is entered", () => {
		const range = {
			matches: (selector: string) => selector.includes('input[type="range"]'),
			dataset: {},
		} as unknown as HTMLElement;
		expect(shouldPreventNativeAdjustment(range, "ArrowLeft")).toBe(true);
		toggleTvAdjustmentMode(range);
		expect(shouldPreventNativeAdjustment(range, "ArrowLeft")).toBe(false);
	});
});
