import { isTvMode } from "./tvMode";

type Direction = "up" | "down" | "left" | "right";
type Rectangle = Pick<DOMRect, "left" | "right" | "top" | "bottom">;

const FOCUSABLE = 'a[href], button:not(:disabled), input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';
const DIRECTIONS: Record<string, Direction> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
const TV_ROW_FALLBACK = '[role="row"], [role="gridcell"], [role="listitem"], tr, li, article';

function focusRow(element: HTMLElement | null): HTMLElement | null {
	if (!element) return null;
	if (element.closest("[data-tv-rail]")) return null;
	return element.closest<HTMLElement>("[data-tv-row]") ?? element.closest<HTMLElement>(TV_ROW_FALLBACK);
}

export function candidatesInTvGrid(active: HTMLElement | null, candidates: HTMLElement[], origin: Rectangle, direction: Direction): HTMLElement[] | null {
	const grid = active?.closest<HTMLElement>("[data-tv-grid]");
	if (!grid) return null;
	const gridCandidates = candidates.filter((candidate) => candidate.closest("[data-tv-grid]") === grid);
	return gridCandidates.some((candidate) => directionalScore(origin, candidate.getBoundingClientRect(), direction) !== null) ? gridCandidates : candidates;
}

export function isTvAdjustmentControl(element: HTMLElement | null): element is HTMLElement {
	return element?.matches('input[type="range"], [role="slider"]') ?? false;
}

export function isTvAdjustmentMode(element: HTMLElement | null): boolean {
	return isTvAdjustmentControl(element) && element.dataset.tvAdjusting === "true";
}

export function shouldPreventNativeAdjustment(element: HTMLElement | null, key: string): boolean {
	return isTvAdjustmentControl(element) && !isTvAdjustmentMode(element) && key in DIRECTIONS;
}

export function toggleTvAdjustmentMode(element: HTMLElement | null): boolean {
	if (!isTvAdjustmentControl(element)) return false;
	delete element.dataset.tvBackPending;
	if (isTvAdjustmentMode(element)) delete element.dataset.tvAdjusting;
	else element.dataset.tvAdjusting = "true";
	return true;
}

export function exitTvAdjustmentMode(element: HTMLElement | null, backShouldOpenRail = false): boolean {
	if (element === null) return false;
	if (element.dataset.tvAdjusting !== "true") return false;
	delete element.dataset.tvAdjusting;
	if (backShouldOpenRail) element.dataset.tvBackPending = "true";
	else delete element.dataset.tvBackPending;
	return true;
}

export function consumeTvBackHandoff(element: HTMLElement | null): boolean {
	if (!element || element.dataset.tvBackPending !== "true") return false;
	delete element.dataset.tvBackPending;
	return true;
}

export function directionalScore(origin: Rectangle, target: Rectangle, direction: Direction): number | null {
	const originX = (origin.left + origin.right) / 2;
	const originY = (origin.top + origin.bottom) / 2;
	const targetX = (target.left + target.right) / 2;
	const targetY = (target.top + target.bottom) / 2;
	const horizontal = direction === "left" || direction === "right";
	const primary = horizontal ? targetX - originX : targetY - originY;
	const signed = direction === "left" || direction === "up" ? -primary : primary;
	if (signed <= 1) return null;
	const secondary = horizontal ? Math.abs(targetY - originY) : Math.abs(targetX - originX);
	const aligned = horizontal ? target.bottom > origin.top && target.top < origin.bottom : target.right > origin.left && target.left < origin.right;
	return signed + secondary * 2 + (aligned ? 0 : 1000);
}

export function focusTvDestination(active: HTMLElement | null, next: HTMLElement, direction: Direction): void {
	const previousRow = focusRow(active);
	const nextRow = focusRow(next);
	next.focus({ preventScroll: true });
	next.scrollIntoView({ block: "nearest", inline: "nearest" });
	if ((direction === "up" || direction === "down") && nextRow && nextRow !== previousRow && nextRow.dataset?.tvScroll !== "nearest") {
		nextRow.scrollIntoView({ block: "start", inline: "nearest" });
	}
}

export function initializeTvNavigation(): () => void {
	const onKeydown = (event: KeyboardEvent) => {
		if (!isTvMode.value || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
		const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		if ((event.key === "Escape" || event.key === "Backspace") && exitTvAdjustmentMode(active, true)) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}
		if ((event.key === "Escape" || event.key === "Backspace") && consumeTvBackHandoff(active)) {
			if (document.querySelector("[data-tv-rail]")) {
				event.preventDefault();
				event.stopPropagation();
				window.dispatchEvent(new Event("flixer:tv-open-menu"));
				return;
			}
		}
		if (event.key === "Enter" && isTvAdjustmentControl(active)) {
			event.preventDefault();
			event.stopPropagation();
			toggleTvAdjustmentMode(active);
			return;
		}
		const direction = DIRECTIONS[event.key];
		if (!direction) return;
		if (shouldPreventNativeAdjustment(active, event.key)) event.preventDefault();
		if (active?.isContentEditable || active?.matches("select, textarea") || isTvAdjustmentMode(active) || (active?.matches('input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="range"])') && (direction === "left" || direction === "right"))) return;
		const scope = document.querySelector<HTMLElement>('[aria-modal="true"]') ?? document;
		const candidates = [...scope.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((element) => {
			if (element === active || element.getAttribute("tabindex") === "-1" || element.closest('[inert], [aria-hidden="true"]') || (scope === document && element.closest("[data-tv-rail]")) || element.getClientRects().length === 0) return false;
			const style = getComputedStyle(element);
			return style.visibility !== "hidden" && style.display !== "none" && style.opacity !== "0";
		});
		let next: HTMLElement | undefined;
		if (!active || active === document.body || !scope.contains(active)) {
			next = candidates.find((element) => {
				const bounds = element.getBoundingClientRect();
				return bounds.bottom > 0 && bounds.right > 0 && bounds.top < window.innerHeight && bounds.left < window.innerWidth;
			});
		} else {
			const origin = active.getBoundingClientRect();
			if (
				scope === document &&
				direction === "left" &&
				!candidates.some((candidate) => {
					const bounds = candidate.getBoundingClientRect();
					return bounds.right <= origin.left && bounds.bottom > origin.top && bounds.top < origin.bottom;
				})
			) {
				event.preventDefault();
				window.dispatchEvent(new Event("flixer:tv-open-menu"));
				return;
			}
			let directionalCandidates = candidates;
			const vertical = direction === "up" || direction === "down";
			const gridCandidates = scope === document ? candidatesInTvGrid(active, candidates, origin, direction) : null;
			const currentRow = scope === document && !gridCandidates ? active.closest<HTMLElement>("[data-tv-row]") : null;
			if (gridCandidates) {
				directionalCandidates = gridCandidates;
			} else if (currentRow && vertical) {
				const rows = [...document.querySelectorAll<HTMLElement>("[data-tv-row]")];
				const currentIndex = rows.indexOf(currentRow);
				const step = direction === "down" ? 1 : -1;
				for (let index = currentIndex + step; index >= 0 && index < rows.length; index += step) {
					const rowCandidates = candidates.filter((candidate) => candidate.closest("[data-tv-row]") === rows[index]);
					if (rowCandidates.length) {
						directionalCandidates = rowCandidates;
						break;
					}
				}
				if (!directionalCandidates.length) {
					event.preventDefault();
					return;
				}
			}
			let best = Infinity;
			for (const candidate of directionalCandidates) {
				const score = directionalScore(origin, candidate.getBoundingClientRect(), direction);
				if (score !== null && score < best) {
					best = score;
					next = candidate;
				}
			}
		}
		if (next) {
			event.preventDefault();
			focusTvDestination(active, next, direction);
		} else if (scope === document && direction === "left") {
			event.preventDefault();
			window.dispatchEvent(new Event("flixer:tv-open-menu"));
		}
	};
	const onFocusIn = (event: FocusEvent) => {
		const adjusting = document.querySelector<HTMLElement>('[data-tv-adjusting="true"], [data-tv-back-pending="true"]');
		if (adjusting && event.target !== adjusting) {
			exitTvAdjustmentMode(adjusting);
			delete adjusting.dataset.tvBackPending;
		}
	};
	document.addEventListener("keydown", onKeydown);
	document.addEventListener("focusin", onFocusIn);
	return () => {
		document.removeEventListener("keydown", onKeydown);
		document.removeEventListener("focusin", onFocusIn);
	};
}
