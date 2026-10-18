<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getSamplePlaybackInfo, getStreamInfo, listSampleVideos, type PlaybackInfo, type SampleVideo, type StreamInfo } from '../api'
import Header from '../components/header/Header.vue'
import VideoPlayer from '../components/player/VideoPlayer.vue'
import { useSignOut } from '../composables/useSignOut'

const { isSigningOut, signOut } = useSignOut()

const samples = ref<SampleVideo[]>([])
const selectedId = ref('')
const playback = ref<PlaybackInfo | null>(null)
const info = ref<StreamInfo | null>(null)
const loading = ref(false)
const error = ref('')

const selectedTitle = computed(() => samples.value.find((sample) => sample.id === selectedId.value)?.title ?? '')

onMounted(async () => {
  try {
    samples.value = await listSampleVideos()
    selectedId.value = samples.value.find((sample) => sample.container === 'mkv')?.id ?? samples.value[0]?.id ?? ''
    await load()
  } catch {
    error.value = 'Could not load sample videos from the Flixer API.'
  }
})

async function load() {
  if (!selectedId.value) return
  loading.value = true
  error.value = ''
  try {
    const next = await getSamplePlaybackInfo(selectedId.value)
    info.value = await getStreamInfo(next.mediaSource.streamUrl)
    playback.value = next
  } catch {
    playback.value = null
    info.value = null
    error.value = 'Could not get a stream URL. Is flixer-streamer running on port 8091?'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-flixer-background font-sans text-flixer-text">
    <Header :links="[]" :is-signing-out="isSigningOut" @logout="signOut" />

    <main class="page-gutter w-full pb-16 pt-28">
      <h1 class="text-3xl font-semibold tracking-tight">Player test</h1>
      <p class="mt-2 text-sm text-flixer-muted">Flixer issues a signed token; flixer-streamer direct-plays, remuxes or transcodes the file with ffmpeg.</p>

      <div class="mt-6">
        <select v-model="selectedId" class="min-w-72 rounded-lg border border-flixer-border bg-flixer-surface px-3 py-2 text-sm" :disabled="loading" @change="load">
          <option v-for="sample in samples" :key="sample.id" :value="sample.id">{{ sample.title }} ({{ sample.container }})</option>
        </select>
      </div>

      <p v-if="error" class="mt-4 text-sm text-red-400" role="alert">{{ error }}</p>

      <div v-if="playback && info" class="mt-6 h-[calc(100vh-14rem)] min-h-80 w-full overflow-hidden rounded-xl border border-flixer-border bg-black">
        <VideoPlayer :stream-url="playback.mediaSource.streamUrl" :info="info" :title="selectedTitle" />
      </div>

      <p v-if="playback" class="mt-3 text-xs text-flixer-muted">
        Space/K play·pause, ←/→ or J/L ±10s, ↑/↓ volume, M mute, F fullscreen, 0–9 jump. Token expires
        {{ new Date(playback.expiresAt).toLocaleString() }}.
      </p>
    </main>
  </div>
</template>
