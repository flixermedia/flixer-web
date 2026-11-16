import { onBeforeUnmount, onMounted, ref, watch, type Ref } from "vue";

export function authViewportScale(contentWidth: number, contentHeight: number, viewportWidth: number, viewportHeight: number): number {
	if ([contentWidth, contentHeight, viewportWidth, viewportHeight].some((value) => !Number.isFinite(value) || value <= 0)) return 1;
	return Math.min(1, viewportWidth / contentWidth, viewportHeight / contentHeight);
}

export function useAuthViewportFit(enabled: Ref<boolean>) {
	const element = ref<HTMLElement | null>(null);
	const scale = ref(1);
	const top = ref(0);
	let resizeObserver: ResizeObserver | undefined;
	let mutationObserver: MutationObserver | undefined;
	let frame = 0;

	function measure() {
		frame = 0;
		const target = element.value;
		if (!target || !enabled.value) {
			scale.value = 1;
			top.value = 0;
			return;
		}
		const viewport = window.visualViewport;
		const width = viewport?.width ?? window.innerWidth;
		const height = viewport?.height ?? window.innerHeight;
		const desired = authViewportScale(target.scrollWidth, target.scrollHeight, width, height);
		scale.value = desired < 1 ? authViewportScale(target.scrollWidth + 1, target.scrollHeight + 1, width, height) : 1;
		top.value = viewport?.offsetTop ?? 0;
	}

	function schedule() {
		if (!frame) frame = requestAnimationFrame(measure);
	}

	function observe() {
		resizeObserver?.disconnect();
		mutationObserver?.disconnect();
		const target = element.value;
		if (target && enabled.value) {
			resizeObserver?.observe(target);
			target.querySelectorAll<HTMLElement>(".auth-content, .auth-form, .page-canvas").forEach((child) => resizeObserver?.observe(child));
			mutationObserver?.observe(target, { childList: true, subtree: true, characterData: true });
		}
		schedule();
	}

	watch([element, enabled], observe, { flush: "post" });
	onMounted(() => {
		if (typeof ResizeObserver !== "undefined") resizeObserver = new ResizeObserver(schedule);
		mutationObserver = new MutationObserver(() => {
			observe();
		});
		window.addEventListener("resize", schedule);
		window.visualViewport?.addEventListener("resize", schedule);
		window.visualViewport?.addEventListener("scroll", schedule);
		void document.fonts?.ready.then(schedule);
		observe();
	});
	onBeforeUnmount(() => {
		resizeObserver?.disconnect();
		mutationObserver?.disconnect();
		window.removeEventListener("resize", schedule);
		window.visualViewport?.removeEventListener("resize", schedule);
		window.visualViewport?.removeEventListener("scroll", schedule);
		if (frame) cancelAnimationFrame(frame);
	});
	return { element, scale, top };
}
