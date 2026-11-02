import { ref } from 'vue';
// Module-level so the player outlives route changes.
const playing = ref(null);
export function useVideoOverlay() {
    return {
        playing,
        play(target) {
            playing.value = target;
        },
        close() {
            playing.value = null;
        },
    };
}
