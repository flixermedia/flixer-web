<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getItemPlaybackInfo, getStreamInfo, getWatchProgress, saveWatchProgress, type PlaybackInfo, type StreamInfo } from '../../api'
import VideoPlayer from './VideoPlayer.vue'
import Skeleton from '../ui/Skeleton.vue'

const props = defineProps<{ itemId: string; title: string }>()
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const playback = ref<PlaybackInfo | null>(null)
const info = ref<StreamInfo | null>(null)
const error = ref('')
const startAt = ref(0)

function onProgress(position: number, duration: number) {
  void saveWatchProgress(props.itemId, position, duration).catch(() => {})
}

function onKeydown(event: KeyboardEvent) {
  // While in browser fullscreen, Escape only leaves fullscreen.
  if (event.key === 'Escape' && !document.fullscreenElement) emit('close')
}

onMounted(async () => {
  document.body.style.overflow = 'hidden'
  window.addEventListener('keydown', onKeydown)
  try {
    const next = await getItemPlaybackInfo(props.itemId)
    const streamInfo = await getStreamInfo(next.mediaSource.streamUrl)
    // Resuming is best effort; playback still starts from the beginning if this fails.
    startAt.value = await getWatchProgress(props.itemId).then((progress) => progress.positionSeconds).catch(() => 0)
    info.value = streamInfo
    playback.value = next
  } catch {
    error.value = t('player.couldNotGetStreamUrl')
  }
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="theme-dark fixed inset-0 z-[100] bg-black" role="dialog" aria-modal="true" :aria-label="title">
    <VideoPlayer v-if="playback && info" :stream-url="playback.mediaSource.streamUrl" :info="info" :title="title" :start-at="startAt" show-back @back="emit('close')" @error="error = $event" @progress="onProgress" />
    <div v-else class="grid size-full place-items-center p-6 text-center">
      <p v-if="error" class="text-sm text-red-400" role="alert">{{ error }}</p>
      <div v-else class="w-full max-w-3xl" role="status" :aria-label="t('mediaItem.loading')">
        <Skeleton class="aspect-video w-full rounded-lg" />
      </div>
    </div>
    <button v-if="!(playback && info)" type="button" class="absolute left-4 top-4 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20" @click="emit('close')">{{ t('mediaItem.close') }}</button>
  </div>
</template>
