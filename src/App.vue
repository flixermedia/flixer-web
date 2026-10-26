<script setup lang="ts">
import { ModalOverlay, ModalTarget } from '@kolirt/vue-modal'
import OfflineBanner from './components/ui/OfflineBanner.vue'
import MiniPlayer from './components/player/MiniPlayer.vue'
import PlayerOverlay from './components/player/PlayerOverlay.vue'
import PartyBar from './components/party/PartyBar.vue'
import LyricsView from './views/LyricsView.vue'
import { useAudioPlayer } from './composables/useAudioPlayer'
import { useParty } from './composables/useParty'
import { useVideoOverlay } from './composables/useVideoOverlay'
import { getAccessToken } from './api'

const { lyricsOpen } = useAudioPlayer()
const { playing, close: closeVideo } = useVideoOverlay()
if (getAccessToken()) void useParty().resume()
</script>

<template>
  <RouterView v-slot="{ Component, route }">
    <Transition name="page" mode="out-in">
      <component :is="Component" :key="route.path" />
    </Transition>
  </RouterView>
  <MiniPlayer />
  <PlayerOverlay v-if="playing" :item-id="playing.id" :start-at-seconds="playing.startAt" :title="playing.title" @close="closeVideo" />
  <Transition name="lyrics">
    <LyricsView v-if="lyricsOpen" />
  </Transition>
  <PartyBar />
  <OfflineBanner />

  <ModalTarget group="default" class="z-50">
    <ModalOverlay class="flixer-modal-overlay" />
  </ModalTarget>
</template>

<style>
.lyrics-enter-active {
  transition:
    transform 0.4s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.3s ease-out;
}
.lyrics-leave-active {
  transition:
    transform 0.25s ease-in,
    opacity 0.2s ease-in;
}
.lyrics-enter-from,
.lyrics-leave-to {
  transform: translateY(5%);
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .lyrics-enter-active,
  .lyrics-leave-active {
    transition: opacity 0.15s linear;
  }
  .lyrics-enter-from,
  .lyrics-leave-to {
    transform: none;
  }
}

/* Opacity only: a transform or filter here would break the fixed header while pages swap. */
.page-enter-active {
  transition: opacity 0.28s ease-out;
}
.page-leave-active {
  transition: opacity 0.14s ease-in;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .page-enter-active,
  .page-leave-active {
    transition: none;
  }
}
</style>
