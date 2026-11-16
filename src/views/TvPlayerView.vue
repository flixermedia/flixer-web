<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { App as CapacitorApp } from '@capacitor/app'
import type { PluginListenerHandle } from '@capacitor/core'
import { useRoute, useRouter } from 'vue-router'
import PlayerOverlay from '../components/player/PlayerOverlay.vue'
import VideoPlayer from '../components/player/VideoPlayer.vue'
import type { StreamInfo } from '../api'
import { useVideoOverlay } from '../composables/useVideoOverlay'
import { isNativeTv } from '../platform/tvMode'
import { consumeTvBackHandoff, exitTvAdjustmentMode } from '../platform/tvNavigation'

const route = useRoute()
const router = useRouter()
const { playing } = useVideoOverlay()
let backListener: PluginListenerHandle | undefined
let disposed = false
let closing = false
const trailerInfo: StreamInfo = {
  playMethod: 'DirectPlay',
  source: { videoCodec: 'h264', audioCodec: 'aac', width: 0, height: 0, durationSeconds: 0 },
  availableHeights: [],
}

function close() {
  if (closing) return
  closing = true
  const returnTo = typeof route.query.returnTo === 'string' && route.query.returnTo.startsWith('/') && !route.query.returnTo.startsWith('//') && !route.query.returnTo.startsWith('/tv/player')
    ? route.query.returnTo
    : '/tv'
  if (router.options.history.state.back === returnTo) {
    router.back()
  } else {
    void router.replace(returnTo).catch((error: unknown) => {
      closing = false
      console.error('[tv-player] Could not return to the previous page', error)
    })
  }
}

watch(playing, (value) => {
  if (!value) close()
}, { immediate: true })

function onKeydown(event: KeyboardEvent) {
  if (!playing.value?.trailer || event.key !== 'Escape' || event.defaultPrevented || document.fullscreenElement) return
  event.preventDefault()
  close()
}

function onNativeBack() {
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null
  if (document.querySelector('[data-tv-rail]')) return
  if (exitTvAdjustmentMode(active, true)) return
  if (consumeTvBackHandoff(active)) {
    close()
    return
  }
  close()
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  if (isNativeTv) void CapacitorApp.addListener('backButton', onNativeBack).then((listener) => {
    if (disposed) void listener.remove()
    else backListener = listener
  }).catch((error: unknown) => console.error('[tv-player] Could not listen for the Back button', error))
})

onBeforeUnmount(() => {
  disposed = true
  window.removeEventListener('keydown', onKeydown)
  void backListener?.remove().catch((error: unknown) => console.error('[tv-player] Could not remove the Back button listener', error))
})
</script>

<template>
  <main v-if="playing?.trailer" data-tv-player :aria-label="playing.title"
    class="theme-dark fixed left-0 top-0 z-[100] overflow-hidden bg-black"
    style="width: calc(100vw / var(--tv-scale, 1)); height: calc(100dvh / var(--tv-scale, 1))">
    <VideoPlayer :stream-url="playing.trailer.streamUrl" :info="trailerInfo" :title="playing.title"
      :autoplay="playing.autoplay" crop-category="trailers" standalone show-back @back="close" />
  </main>
  <PlayerOverlay v-else-if="playing" page :item-id="playing.id" :start-at-seconds="playing.startAt"
    :title="playing.title" :autoplay="playing.autoplay" :live-playback="playing.livePlayback" @close="close" />
</template>
