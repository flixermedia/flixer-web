import { onBeforeUnmount, ref, watch } from 'vue';
/**
 * Calls `onMore` whenever the returned sentinel element comes near the viewport
 * while `enabled` is true. Place the sentinel after the list; it is re-checked
 * after every load, so a short page keeps filling until it overflows.
 */
export function useInfiniteScroll(onMore, enabled, rootMargin = '600px') {
    const sentinel = ref(null);
    let observer;
    function stop() {
        observer?.disconnect();
        observer = undefined;
    }
    function start() {
        stop();
        const el = sentinel.value;
        if (!el || !enabled.value || typeof IntersectionObserver === 'undefined')
            return;
        // A fresh observer reports the current intersection state straight away.
        observer = new IntersectionObserver((entries) => entries.some((entry) => entry.isIntersecting) && onMore(), { rootMargin });
        observer.observe(el);
    }
    watch([sentinel, enabled], start, { flush: 'post' });
    onBeforeUnmount(stop);
    return { setSentinel: (el) => (sentinel.value = el ?? null), recheck: start };
}
