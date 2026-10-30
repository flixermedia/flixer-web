<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { useAudioPlayer } from '../../composables/useAudioPlayer'
import { notify } from '../../composables/notify'
import { useParty } from '../../composables/useParty'
import AuthImage from '../ui/AuthImage.vue'
import { openModal } from '@kolirt/vue-modal'
import AddToPlaylistModal from '../AddToPlaylistModal.vue'
import { formatTime } from './formatTime'
import { catchError } from '../../utils/catchError'

const { t } = useI18n()
const player = useAudioPlayer()
const party = useParty()
const partyBusy = ref(false)
const hostingListen = computed(() => party.isHost.value && party.party.value?.kind === 'music')
// Guests follow the host, and a video party can't run alongside the music player.
const canParty = computed(() => !party.party.value || hostingListen.value)
const { current, isPlaying, isLoading, currentTime, duration, volume, shuffle, repeat, lyricsOpen } = player

const visible = computed(() => current.value !== null && !lyricsOpen.value)
const progress = computed(() => (duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0))

// Lets pages reserve room so the bar never covers their last content.
watch(visible, (value) => document.documentElement.classList.toggle('has-mini-player', value), { immediate: true })

async function onParty() {
  if (partyBusy.value || !current.value) return
  partyBusy.value = true
  try {
    if (hostingListen.value) {
      const [error] = await catchError(Promise.resolve().then(() => navigator.clipboard.writeText(party.inviteLink())))
      if (error) {
        notify.error(t('party.copyFailed'))
        return
      }
      notify.success(t('party.linkCopied'))
    } else {
      const [error, started] = await catchError(party.start(current.value.id))
      if (error) {
        notify.error(t('party.startFailed'))
        return
      }
      if (!started) return
    }
  } finally {
    partyBusy.value = false
  }
}
function onSeek(event: Event) {
  player.seek((Number((event.target as HTMLInputElement).value) / 100) * duration.value)
}
function addCurrentToPlaylist() {
  if (current.value) void openModal(AddToPlaylistModal, { props: { itemId: current.value.id, title: current.value.title } }).catch(() => undefined)
}
function onVolume(event: Event) {
  player.setVolume(Number((event.target as HTMLInputElement).value))
}
</script>

<template>
  <div v-if="visible && current" data-haptic class="fixed inset-x-0 bottom-[calc(var(--tabbar-height,0px)+0.5rem)] z-40 px-2 md:bottom-0 md:px-0" role="region" :aria-label="t('music.player')">
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
              <Icon icon="lucide:shuffle" class="size-5" aria-hidden="true" />
            </button>
            <button type="button" class="grid size-9 place-items-center rounded text-white transition hover:bg-white/10" :aria-label="t('music.previous')" @click="player.previous()">
              <Icon icon="lucide:skip-back" class="size-5" aria-hidden="true" />
            </button>
            <button type="button" class="grid size-10 place-items-center rounded bg-white text-flixer-background transition hover:bg-white/85" :aria-label="isPlaying ? t('music.pause') : t('music.play')" @click="player.toggle()">
              <span v-if="isLoading" class="size-4 animate-spin rounded-full border-2 border-flixer-background/30 border-t-flixer-background" aria-hidden="true"></span>
              <Icon v-else-if="isPlaying" icon="lucide:pause" class="size-5" aria-hidden="true" />
              <Icon v-else icon="lucide:play" class="size-5" aria-hidden="true" />
            </button>
            <button type="button" class="grid size-9 place-items-center rounded text-white transition hover:bg-white/10 disabled:opacity-40" :disabled="!player.hasNext.value" :aria-label="t('music.next')" @click="player.next()">
              <Icon icon="lucide:skip-forward" class="size-5" aria-hidden="true" />
            </button>
            <button type="button" class="hidden size-9 place-items-center rounded transition hover:bg-white/10 sm:grid" :class="repeat === 'off' ? 'text-white' : 'text-flixer-accent'" :aria-label="repeat === 'one' ? t('music.repeatOne') : repeat === 'all' ? t('music.repeatAll') : t('music.repeat')" @click="player.cycleRepeat()">
              <Icon :icon="repeat === 'one' ? 'lucide:repeat-1' : 'lucide:repeat'" class="size-5" aria-hidden="true" />
            </button>
          </div>
          <div class="hidden w-full max-w-xl items-center gap-2 text-xs text-flixer-muted sm:flex">
            <span class="w-10 text-right tabular-nums">{{ formatTime(currentTime) }}</span>
            <input type="range" min="0" max="100" step="0.1" class="h-1 flex-1 cursor-pointer accent-flixer-accent" :aria-label="t('music.seek')" :value="progress" @input="onSeek" />
            <span class="w-10 tabular-nums">{{ formatTime(duration) }}</span>
          </div>
        </div>

        <div class="flex items-center justify-end gap-1 md:w-1/4">
          <button type="button" class="grid size-9 place-items-center rounded text-white transition hover:bg-white/10" :aria-label="t('social.addToPlaylistFor', { title: current.title })" :title="t('social.addToPlaylist')" @click="addCurrentToPlaylist">
            <Icon icon="lucide:plus" class="size-5" aria-hidden="true" />
          </button>
          <button v-if="canParty" type="button" class="grid size-9 place-items-center rounded transition hover:bg-white/10 disabled:opacity-60" :class="hostingListen ? 'text-flixer-accent' : 'text-white'" :disabled="partyBusy" :aria-label="hostingListen ? t('party.copyLink') : t('party.startListen')" :title="hostingListen ? t('party.copyLink') : t('party.startListen')" @click="onParty">
            <Icon icon="lucide:users-round" class="size-5" aria-hidden="true" />
          </button>
          <button type="button" class="grid h-9 place-items-center rounded px-3 text-sm font-semibold text-white transition hover:bg-white/10" :aria-label="t('music.lyrics')" @click="lyricsOpen = true">
            <Icon icon="lucide:list-music" class="size-5 md:hidden" aria-hidden="true" />
            <span class="hidden md:inline">{{ t('music.lyrics') }}</span>
          </button>
          <input type="range" min="0" max="1" step="0.01" class="hidden h-1 w-24 cursor-pointer accent-flixer-accent lg:block" :aria-label="t('music.volume')" :value="volume" @input="onVolume" />
          <button type="button" class="grid size-9 place-items-center rounded text-flixer-muted transition hover:bg-white/10 hover:text-white" :aria-label="t('music.close')" @click="player.stop()">
            <Icon icon="lucide:x" class="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div class="h-0.5 bg-white/10 sm:hidden" aria-hidden="true"><div class="h-full bg-flixer-accent" :style="{ width: `${progress}%` }"></div></div>
    </div>
  </div>
</template>
