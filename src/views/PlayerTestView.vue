<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getSamplePlaybackInfo, getStreamInfo, listSampleVideos, type PlaybackInfo, type SampleVideo, type StreamInfo } from '../api'
import Header from '../components/header/Header.vue'
import VideoPlayer from '../components/player/VideoPlayer.vue'
import { useSignOut } from '../composables/useSignOut'

const { t } = useI18n()
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
    error.value = t('player.couldNotLoadSamples')
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
    error.value = t('player.couldNotGetStreamUrl')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-flixer-background font-sans text-flixer-text">
    <Header :links="[]" :is-signing-out="isSigningOut" @logout="signOut" />

    <main class="page-gutter w-full pb-16 pt-28">
      <h1 class="text-3xl font-semibold tracking-tight">{{ t('player.testTitle') }}</h1>
      <p class="mt-2 text-sm text-flixer-muted">{{ t('player.testDescription') }}</p>

      <div class="mt-6">
        <select v-model="selectedId" class="min-w-72 rounded-lg border border-flixer-border bg-flixer-surface px-3 py-2 text-sm" :disabled="loading" @change="load">
          <option v-for="sample in samples" :key="sample.id" :value="sample.id">{{ sample.title }} ({{ sample.container }})</option>
        </select>
      </div>

      <p v-if="error" class="mt-4 text-sm text-red-400" role="alert">{{ error }}</p>

      <div v-if="playback && info" class="mt-6 h-[calc(100vh-14rem)] min-h-80 w-full overflow-hidden rounded-xl border border-flixer-border bg-black">
        <VideoPlayer :stream-url="playback.mediaSource.streamUrl" :info="info" :title="selectedTitle" />
      </div>

      <p v-if="playback" class="mt-3 text-xs text-flixer-muted">{{ t('player.testControls') }} {{ t('player.tokenExpires', { expiresAt: new Date(playback.expiresAt).toLocaleString() }) }}</p>
    </main>
  </div>
</template>
