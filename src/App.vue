<script setup lang="ts">
import { ModalOverlay, ModalTarget } from '@kolirt/vue-modal'
import OfflineBanner from './components/ui/OfflineBanner.vue'
import MiniPlayer from './components/player/MiniPlayer.vue'
import PlayerOverlay from './components/player/PlayerOverlay.vue'
import LyricsView from './views/LyricsView.vue'
import { useAudioPlayer } from './composables/useAudioPlayer'
import { useVideoOverlay } from './composables/useVideoOverlay'

const { lyricsOpen } = useAudioPlayer()
const { playing, close: closeVideo } = useVideoOverlay()
</script>

<template>
  <RouterView v-slot="{ Component, route }">
    <Transition name="page" mode="out-in">
      <component :is="Component" :key="route.path" />
    </Transition>
  </RouterView>
  <MiniPlayer />
  <PlayerOverlay v-if="playing" :item-id="playing.id" :start-at-seconds="playing.startAt" :title="playing.title" @close="closeVideo" />
  <LyricsView v-if="lyricsOpen" />
  <OfflineBanner />

  <ModalTarget group="default" class="z-50">
    <ModalOverlay class="flixer-modal-overlay" />
  </ModalTarget>
</template>

<style>
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
