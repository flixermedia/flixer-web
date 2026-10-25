<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getItemPlaybackInfo, getStreamInfo, getWatchProgress, saveWatchProgress, type PlaybackInfo, type StreamInfo } from '../../api'
import { useVideoOverlay } from '../../composables/useVideoOverlay'
import VideoPlayer from './VideoPlayer.vue'
import Skeleton from '../ui/Skeleton.vue'

const props = defineProps<{ itemId: string; title: string; startAtSeconds?: number }>()
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const playback = ref<PlaybackInfo | null>(null)
const info = ref<StreamInfo | null>(null)
const error = ref('')
const startAt = ref(0)
const mini = ref(false)
const { play } = useVideoOverlay()
const chapters = computed(() => playback.value?.chapters ?? [])
const segments = computed(() => playback.value?.segments ?? [])
const nextEpisode = computed(() => playback.value?.nextEpisode ?? null)
const nextLabel = computed(() => {
  const next = nextEpisode.value
  if (!next) return undefined
  const code = next.seasonNumber != null && next.episodeNumber != null ? `S${next.seasonNumber}:E${next.episodeNumber} ` : ''
  return `${code}${next.title}`
})

// Swapping the playing item reloads in place, so a corner player stays in the corner.
function playNext() {
  const next = nextEpisode.value
  if (next) play({ id: next.id, title: next.title })
}

function onProgress(position: number, duration: number) {
  void saveWatchProgress(props.itemId, position, duration).catch(() => {})
}

// Explicit geometry in both states so the move to the corner can animate.
const frameStyle = computed(() => {
  if (!mini.value) return { top: '0px', left: '0px', width: '100vw', height: '100dvh' }
  const width = 'min(24rem, 70vw)'
  const height = `calc(${width} * 9 / 16)`
  return { width, height, top: `calc(100dvh - ${height} - 1rem)`, left: `calc(100vw - ${width} - 1rem)` }
})

function setMini(value: boolean) {
  if (value && document.fullscreenElement) void document.exitFullscreen().catch(() => {})
  mini.value = value
  // The page behind a corner player stays scrollable.
  document.body.style.overflow = value ? '' : 'hidden'
}

function onKeydown(event: KeyboardEvent) {
  // While in browser fullscreen, Escape only leaves fullscreen.
  if (event.key !== 'Escape' || document.fullscreenElement) return
  if (mini.value) emit('close')
  else setMini(true)
}

async function load(itemId: string) {
  playback.value = null
  info.value = null
  error.value = ''
  startAt.value = 0
  try {
    const next = await getItemPlaybackInfo(itemId)
    const streamInfo = await getStreamInfo(next.mediaSource.streamUrl)
    // Resuming is best effort; playback still starts from the beginning if this fails.
    const resume =
      props.startAtSeconds ??
      (await getWatchProgress(itemId)
        .then((progress) => progress.positionSeconds)
        .catch(() => 0))
    if (itemId !== props.itemId) return
    startAt.value = resume
    info.value = streamInfo
    playback.value = next
  } catch {
    if (itemId === props.itemId) error.value = t('player.couldNotGetStreamUrl')
  }
}

watch(
  () => [props.itemId, props.startAtSeconds],
  () => void load(props.itemId),
)

onMounted(() => {
  document.body.style.overflow = mini.value ? '' : 'hidden'
  window.addEventListener('keydown', onKeydown)
  void load(props.itemId)
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="theme-dark fixed z-[100] overflow-hidden bg-black transition-[top,left,width,height,border-radius,box-shadow] duration-300 ease-in-out motion-reduce:transition-none" :class="mini ? 'rounded-lg shadow-2xl shadow-black/70 ring-1 ring-white/15' : ''" :style="frameStyle" role="dialog" :aria-modal="!mini" :aria-label="title">
    <VideoPlayer v-if="playback && info" :stream-url="playback.mediaSource.streamUrl" :info="info" :title="title" :start-at="startAt" :chapters="chapters" :segments="segments" :next-label="nextLabel" show-back allow-mini :mini="mini" @toggle-mini="setMini(!mini)" @back="emit('close')" @error="error = $event" @progress="onProgress" @next="playNext" />
    <div v-else class="grid size-full place-items-center p-6 text-center">
      <p v-if="error" class="text-sm text-red-400" role="alert">{{ error }}</p>
      <div v-else class="w-full max-w-3xl" role="status" :aria-label="t('mediaItem.loading')">
        <Skeleton class="aspect-video w-full rounded-lg" />
      </div>
    </div>
    <button v-if="!(playback && info) && !mini" type="button" class="absolute left-4 top-4 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20" @click="emit('close')">{{ t('mediaItem.close') }}</button>
  </div>
</template>
