<script setup lang="ts">
import { ModalOverlay, ModalTarget } from '@kolirt/vue-modal'
import OfflineBanner from './components/ui/OfflineBanner.vue'
import MiniPlayer from './components/player/MiniPlayer.vue'
import LyricsView from './views/LyricsView.vue'
import { useAudioPlayer } from './composables/useAudioPlayer'

const { lyricsOpen } = useAudioPlayer()
</script>

<template>
  <RouterView />
  <MiniPlayer />
  <LyricsView v-if="lyricsOpen" />
  <OfflineBanner />

  <ModalTarget group="default" class="z-50">
    <ModalOverlay class="flixer-modal-overlay" />
  </ModalTarget>
</template>
