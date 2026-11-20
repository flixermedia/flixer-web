<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { Button } from '@ui-sdk/vue/button'
import { useI18n } from 'vue-i18n'
import { onRemotePreview, requestRemotePreview, useRemotePlayback } from '../../composables/useRemotePlayback'

defineOptions({ modalGroup: 'default' })
const props = defineProps<{ clientId: string }>()
const { close } = useModalContext<void>()
const { t } = useI18n()
const remote = useRemotePlayback()
const now = ref(Date.now())
const scrubPosition = ref<number | null>(null)
const preview = ref('')
const activeChapter = ref('')
const volumeMenuOpen = ref(false)
const settingsMenuOpen = ref(false)
let timer: ReturnType<typeof setInterval> | undefined
let previewTimer: ReturnType<typeof setTimeout> | undefined
let lastPreviewAt = 0
let pendingPreview = ''
const device = computed(() => remote.devices.value.find((entry) => entry.clientId === props.clientId))
const player = computed(() => device.value?.player)
const currentPosition = computed(() => {
  const state = player.value
  if (!state) return 0
  const elapsed = state.playing ? (now.value - (device.value?.updatedAt ?? now.value)) / 1000 : 0
  return Math.min(state.duration || state.position + elapsed, state.position + elapsed)
})
const chapters = computed(() => player.value?.chapters ?? [])
const segments = computed(() => player.value?.segments ?? [])
const currentSegment = computed(() => segments.value.find((segment) => currentPosition.value >= segment.start && currentPosition.value < segment.end))
const trickplay = computed(() => player.value?.trickplay)
const trackIndex = computed(() => player.value?.audioTrackIndex == null ? '' : String(player.value.audioTrackIndex))
const previewPercent = computed(() => {
  const duration = player.value?.duration ?? 0
  const position = scrubPosition.value ?? currentPosition.value
  return duration > 0 ? Math.max(12, Math.min(88, position / duration * 100)) : 50
})

function format(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(whole / 3600)
  const minutes = Math.floor((whole % 3600) / 60)
  const secs = String(whole % 60).padStart(2, '0')
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${secs}` : `${minutes}:${secs}`
}

function send(action: Parameters<typeof remote.sendCommand>[1]) {
  if (!remote.sendCommand(props.clientId, action)) preview.value = ''
}

function onScrub(event: Event) {
  const position = Number((event.target as HTMLInputElement).value)
  scrubPosition.value = position
  activeChapter.value = [...chapters.value].reverse().find((chapter) => position >= chapter.start)?.title ?? ''
  if (!trickplay.value || Date.now() - lastPreviewAt < 250) return
  lastPreviewAt = Date.now()
  const requestId = requestRemotePreview(props.clientId, position)
  if (requestId) pendingPreview = requestId
}

function commitSeek(event: Event) {
  const position = Number((event.target as HTMLInputElement).value)
  send({ action: 'seek', position })
  scrubPosition.value = null
}

function seekChapter(position: number) {
  send({ action: 'seek', position })
}

function nudge(seconds: number) {
  send({ action: 'seek', position: Math.max(0, Math.min(player.value?.duration ?? 86_400, currentPosition.value + seconds)) })
}

function onVolume(event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  send({ action: 'volume', volume: value, muted: value === 0 })
}

function selectAudioTrack(event: Event) {
  send({ action: 'audio-track', index: Number((event.target as HTMLSelectElement).value) })
  settingsMenuOpen.value = false
}

function selectSubtitle(event: Event) {
  send({ action: 'subtitle', id: (event.target as HTMLSelectElement).value })
  settingsMenuOpen.value = false
}

const unsubscribePreview = onRemotePreview((requestId, dataUrl) => {
  if (requestId !== pendingPreview) return
  preview.value = dataUrl
  clearTimeout(previewTimer)
  previewTimer = setTimeout(() => { preview.value = '' }, 1_500)
})

onMounted(() => { timer = setInterval(() => { now.value = Date.now() }, 500) })
onBeforeUnmount(() => {
  clearInterval(timer)
  clearTimeout(previewTimer)
  unsubscribePreview()
})
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card relative flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-y-auto rounded border border-flixer-border bg-flixer-surface px-6 pb-5 pt-6 text-flixer-text shadow-2xl shadow-black/60 sm:px-8">
      <header class="flex items-start gap-4 pr-10">
        <div class="grid size-12 shrink-0 place-items-center rounded bg-flixer-primary/20 text-flixer-accent">
          <Icon :icon="player?.kind === 'audio' ? 'lucide:audio-lines' : 'lucide:monitor-play'" class="size-6" aria-hidden="true" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="flex items-center gap-2 text-[11px] font-semibold uppercase text-flixer-accent">
            <span class="size-1.5 rounded-full" :class="player ? 'bg-emerald-400' : 'bg-white/35'" aria-hidden="true" />
            {{ device?.deviceName ?? t('remotePlayback.controlTitle') }}
          </p>
          <ModalTitle class="mt-1 truncate text-xl font-bold text-white">{{ player?.title ?? t('remotePlayback.controlTitle') }}</ModalTitle>
          <ModalDescription class="mt-1 truncate text-sm text-flixer-muted">{{ player?.subtitle || (player?.playing ? t('remotePlayback.nowPlaying') : t('remotePlayback.paused')) }}</ModalDescription>
        </div>
        <Button type="button" class="absolute right-5 top-5 grid size-9 place-items-center rounded border-0 bg-transparent p-0 text-flixer-muted transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-flixer-accent" :aria-label="t('common.close')" :title="t('common.close')" @click="close()">
          <Icon icon="lucide:x" class="size-5" aria-hidden="true" />
        </Button>
      </header>
      <div v-if="!device || !player" class="mt-6 border-t border-flixer-border pt-5 text-sm text-flixer-muted" role="status">{{ t('remotePlayback.deviceOffline') }}</div>
      <template v-else>
        <section v-if="player.duration > 0" class="mt-6">
          <div class="relative pt-1">
            <div v-if="preview || (scrubPosition !== null && activeChapter)" class="pointer-events-none absolute bottom-full z-20 mb-2 flex -translate-x-1/2 flex-col items-center gap-1" :style="{ left: `${previewPercent}%` }">
              <img v-if="preview" :src="preview" alt="" class="w-44 rounded border border-white/15 bg-black shadow-xl shadow-black/50" />
              <span class="max-w-48 truncate rounded border border-flixer-border bg-flixer-surface px-2 py-1 text-xs font-medium text-white shadow-lg shadow-black/40">{{ activeChapter || format(scrubPosition ?? currentPosition) }}</span>
            </div>
            <div class="relative flex h-5 items-center">
              <!-- Keep native input/change semantics: previews update while dragging, but seek only commits on change. -->
              <input type="range" min="0" :max="player.duration" step="0.25" :value="scrubPosition ?? currentPosition" :aria-label="t('remotePlayback.seek', { device: device.deviceName })" class="relative z-0 w-full accent-flixer-accent" @input="onScrub" @change="commitSeek" />
              <Button v-for="(chapter, index) in chapters" :key="`${chapter.start}-${index}`" type="button" class="absolute top-1/2 z-10 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-flixer-surface bg-white p-0 shadow-sm hover:bg-white" :style="{ left: `${Math.min(100, chapter.start / player.duration * 100)}%` }" :title="chapter.title" :aria-label="t('remotePlayback.seekChapter', { chapter: chapter.title })" data-agent-hidden @click="seekChapter(chapter.start)" />
            </div>
          </div>
        </section>

        <div class="mt-4 flex min-w-0 items-center gap-1 border-t border-flixer-border/70 pt-3 sm:gap-2">
          <Button type="button" class="grid size-9 shrink-0 place-items-center rounded border-0 bg-transparent p-0 text-white/90 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-flixer-accent" :aria-label="t(player.playing ? 'remotePlayback.pause' : 'remotePlayback.play', { device: device.deviceName })" :title="t(player.playing ? 'remotePlayback.pause' : 'remotePlayback.play', { device: device.deviceName })" data-agent-hidden @click="send({ action: player.playing ? 'pause' : 'play' })">
            <Icon :icon="player.playing ? 'lucide:pause' : 'lucide:play'" class="size-5" aria-hidden="true" />
          </Button>
          <Button v-if="player.duration > 0" type="button" class="grid size-9 shrink-0 place-items-center rounded border-0 bg-transparent p-0 text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-flixer-accent" :aria-label="t('remotePlayback.rewind', { seconds: 10 })" :title="t('remotePlayback.rewind', { seconds: 10 })" data-agent-hidden @click="nudge(-10)">
            <Icon icon="lucide:rewind" class="size-5" aria-hidden="true" />
          </Button>
          <Button v-if="player.duration > 0" type="button" class="grid size-9 shrink-0 place-items-center rounded border-0 bg-transparent p-0 text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-flixer-accent" :aria-label="t('remotePlayback.forward', { seconds: 10 })" :title="t('remotePlayback.forward', { seconds: 10 })" data-agent-hidden @click="nudge(10)">
            <Icon icon="lucide:fast-forward" class="size-5" aria-hidden="true" />
          </Button>
          <Button v-if="currentSegment" type="button" class="grid size-9 shrink-0 place-items-center rounded border-0 bg-transparent p-0 text-flixer-accent transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-flixer-accent" :aria-label="t('remotePlayback.skipSegment', { segment: t(`player.skip.${currentSegment.type}`) })" :title="t('remotePlayback.skipSegment', { segment: t(`player.skip.${currentSegment.type}`) })" data-agent-hidden @click="seekChapter(currentSegment.end)">
            <Icon icon="lucide:skip-forward" class="size-5" aria-hidden="true" />
          </Button>
          <span v-if="player.duration > 0" class="ml-1 shrink-0 text-xs tabular-nums text-flixer-muted">{{ format(scrubPosition ?? currentPosition) }} / {{ format(player.duration) }}</span>
          <span class="min-w-1 flex-1"></span>
          <div v-if="player.volume !== undefined" class="relative">
            <Button type="button" class="grid size-9 place-items-center rounded border-0 bg-transparent p-0 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="volumeMenuOpen ? 'text-flixer-accent' : 'text-white/80'" :aria-label="t('remotePlayback.volume')" :title="t('remotePlayback.volume')" :aria-expanded="volumeMenuOpen" @click="volumeMenuOpen = !volumeMenuOpen; settingsMenuOpen = false">
              <Icon :icon="player.muted || player.volume === 0 ? 'lucide:volume-x' : 'lucide:volume-2'" class="size-5" aria-hidden="true" />
            </Button>
            <div v-if="volumeMenuOpen" class="absolute bottom-full right-0 z-30 mb-2 flex w-56 items-center gap-3 rounded border border-flixer-border bg-flixer-surface p-3 shadow-xl shadow-black/40">
              <Icon :icon="player.muted || player.volume === 0 ? 'lucide:volume-x' : 'lucide:volume-2'" class="size-4 shrink-0 text-flixer-muted" aria-hidden="true" />
              <input type="range" min="0" max="1" step="0.01" :value="player.muted ? 0 : player.volume" :aria-label="t('remotePlayback.volume')" class="min-w-0 flex-1 accent-flixer-accent" @input="onVolume" />
            </div>
          </div>
          <div v-if="player.kind === 'video' && (player.audioTracks?.length || player.subtitles?.length)" class="relative">
            <Button type="button" class="grid size-9 place-items-center rounded border-0 bg-transparent p-0 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="settingsMenuOpen ? 'text-flixer-accent' : 'text-white/80'" :aria-label="t('player.playbackSettings')" :title="t('player.playbackSettings')" :aria-expanded="settingsMenuOpen" @click="settingsMenuOpen = !settingsMenuOpen; volumeMenuOpen = false">
              <Icon icon="lucide:settings-2" class="size-5" aria-hidden="true" />
            </Button>
            <div v-if="settingsMenuOpen" class="absolute bottom-full right-0 z-30 mb-2 w-64 space-y-3 rounded border border-flixer-border bg-flixer-surface p-3 shadow-xl shadow-black/40">
              <label v-if="player.audioTracks?.length" class="block text-xs font-semibold uppercase text-flixer-muted">{{ t('remotePlayback.audioTrack') }}
                <select :value="trackIndex" :aria-label="t('remotePlayback.audioTrack')" class="mt-1.5 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm font-normal text-flixer-text focus-visible:outline-2 focus-visible:outline-flixer-accent" @change="selectAudioTrack">
                  <option v-for="track in player.audioTracks" :key="track.id" :value="track.id">{{ track.label }}</option>
                </select>
              </label>
              <label v-if="player.subtitles?.length" class="block text-xs font-semibold uppercase text-flixer-muted">{{ t('remotePlayback.subtitles') }}
                <select :value="player.subtitleId ?? ''" :aria-label="t('remotePlayback.subtitles')" class="mt-1.5 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm font-normal text-flixer-text focus-visible:outline-2 focus-visible:outline-flixer-accent" @change="selectSubtitle">
                  <option value="">{{ t('player.subtitlesOff') }}</option>
                  <option v-for="track in player.subtitles" :key="track.id" :value="track.id">{{ track.label }}</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      </template>
    </ModalContent>
  </ModalRoot>
</template>
