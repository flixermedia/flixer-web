import { ref } from 'vue'

export interface PlayingVideo {
  id: string
  title: string
  /** Where to begin, in seconds; omitted resumes from saved progress. */
  startAt?: number
  autoplay?: boolean
}

// Module-level so the player outlives route changes.
const playing = ref<PlayingVideo | null>(null)

export function useVideoOverlay() {
  return {
    playing,
    play(target: PlayingVideo) {
      playing.value = target
    },
    close() {
      playing.value = null
    },
  }
}
