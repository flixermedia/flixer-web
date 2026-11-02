import { ref } from 'vue'
import type { GuidePlaybackInfo } from '../api/guide'

export interface PlayingVideo {
  id: string
  title: string
  /** Where to begin, in seconds; omitted resumes from saved progress. */
  startAt?: number
  autoplay?: boolean
  livePlayback?: GuidePlaybackInfo
  startMini?: boolean
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
