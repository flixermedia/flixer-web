<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { useAudioPlayer } from '../../composables/useAudioPlayer'
import AuthImage from '../ui/AuthImage.vue'
import { formatTime } from './formatTime'

const { t } = useI18n()
const player = useAudioPlayer()
const { current, isPlaying, isLoading, currentTime, duration, volume, shuffle, repeat, lyricsOpen } = player

const visible = computed(() => current.value !== null && !lyricsOpen.value)
const progress = computed(() => (duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0))

// Lets pages reserve room so the bar never covers their last content.
watch(visible, (value) => document.documentElement.classList.toggle('has-mini-player', value), { immediate: true })

function onSeek(event: Event) {
  player.seek((Number((event.target as HTMLInputElement).value) / 100) * duration.value)
}
function onVolume(event: Event) {
  player.setVolume(Number((event.target as HTMLInputElement).value))
}
</script>

<template>
  <div v-if="visible && current" class="fixed inset-x-0 bottom-[calc(var(--tabbar-height,0px)+0.5rem)] z-40 px-2 md:bottom-0 md:px-0" role="region" :aria-label="t('music.player')">
    <div class="rounded-lg border border-white/10 bg-flixer-surface/95 shadow-2xl shadow-black/60 backdrop-blur-xl md:rounded-none md:border-x-0 md:border-b-0">
      <div class="mx-auto flex max-w-[110rem] items-center gap-3 p-2 md:gap-6 md:px-6">
        <div class="flex min-w-0 flex-1 items-center gap-3 md:w-1/4 md:flex-none">
          <div class="size-12 shrink-0 overflow-hidden rounded bg-flixer-background">
            <AuthImage v-if="current.art" scope="library" :item-id="current.art.itemId" :index="current.art.index" :version="current.art.version" :width="96" alt="" />
          </div>
          <div class="min-w-0">
            <RouterLink v-if="current.albumId" :to="{ name: 'media-item', params: { id: current.albumId } }" class="block truncate text-sm font-semibold text-white hover:underline">{{ current.title }}</RouterLink>
            <p v-else class="truncate text-sm font-semibold text-white">{{ current.title }}</p>
            <RouterLink v-if="current.artist && current.artistId && !player.error.value" :to="{ name: 'person', params: { id: current.artistId } }" class="block truncate text-xs text-flixer-muted hover:text-white hover:underline">{{ current.artist }}</RouterLink>
            <p v-else class="truncate text-xs text-flixer-muted">{{ player.error.value ? t('music.error') : (current.artist ?? current.album ?? '') }}</p>
          </div>
        </div>

        <div class="flex flex-col items-center gap-1 md:flex-1">
          <div class="flex items-center gap-1 sm:gap-3">
            <button type="button" class="hidden size-9 place-items-center rounded transition hover:bg-white/10 sm:grid" :class="shuffle ? 'text-flixer-accent' : 'text-white'" :aria-pressed="shuffle" :aria-label="t('music.shuffle')" @click="player.toggleShuffle()">
              <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></svg>
            </button>
            <button type="button" class="grid size-9 place-items-center rounded text-white transition hover:bg-white/10" :aria-label="t('music.previous')" @click="player.previous()">
              <svg class="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 6h2v12H6zM9.5 12 18 18V6z" /></svg>
            </button>
            <button type="button" class="grid size-10 place-items-center rounded bg-white text-flixer-background transition hover:bg-white/85" :aria-label="isPlaying ? t('music.pause') : t('music.play')" @click="player.toggle()">
              <span v-if="isLoading" class="size-4 animate-spin rounded-full border-2 border-flixer-background/30 border-t-flixer-background" aria-hidden="true"></span>
              <svg v-else-if="isPlaying" class="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
              <svg v-else class="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
            </button>
            <button type="button" class="grid size-9 place-items-center rounded text-white transition hover:bg-white/10 disabled:opacity-40" :disabled="!player.hasNext.value" :aria-label="t('music.next')" @click="player.next()">
              <svg class="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z" /></svg>
            </button>
            <button type="button" class="hidden size-9 place-items-center rounded transition hover:bg-white/10 sm:grid" :class="repeat === 'off' ? 'text-white' : 'text-flixer-accent'" :aria-label="repeat === 'one' ? t('music.repeatOne') : repeat === 'all' ? t('music.repeatAll') : t('music.repeat')" @click="player.cycleRepeat()">
              <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="m17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3" />
                <text v-if="repeat === 'one'" x="9.5" y="15" font-size="8" fill="currentColor" stroke="none">1</text>
              </svg>
            </button>
          </div>
          <div class="hidden w-full max-w-xl items-center gap-2 text-xs text-flixer-muted sm:flex">
            <span class="w-10 text-right tabular-nums">{{ formatTime(currentTime) }}</span>
            <input type="range" min="0" max="100" step="0.1" class="h-1 flex-1 cursor-pointer accent-flixer-accent" :aria-label="t('music.seek')" :value="progress" @input="onSeek" />
            <span class="w-10 tabular-nums">{{ formatTime(duration) }}</span>
          </div>
        </div>

        <div class="flex items-center justify-end gap-1 md:w-1/4">
          <button type="button" class="grid h-9 place-items-center rounded px-3 text-sm font-semibold text-white transition hover:bg-white/10" :aria-label="t('music.lyrics')" @click="lyricsOpen = true">
            <svg class="size-5 md:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h10M4 18h16" /></svg>
            <span class="hidden md:inline">{{ t('music.lyrics') }}</span>
          </button>
          <input type="range" min="0" max="1" step="0.01" class="hidden h-1 w-24 cursor-pointer accent-flixer-accent lg:block" :aria-label="t('music.volume')" :value="volume" @input="onVolume" />
          <button type="button" class="grid size-9 place-items-center rounded text-flixer-muted transition hover:bg-white/10 hover:text-white" :aria-label="t('music.close')" @click="player.stop()">
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>
      </div>
      <div class="h-0.5 bg-white/10 sm:hidden" aria-hidden="true"><div class="h-full bg-flixer-accent" :style="{ width: `${progress}%` }"></div></div>
    </div>
  </div>
</template>
