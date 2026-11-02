<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { getGuideChannelPlaybackInfo, type GuidePlaybackInfo } from '../api/guide'
import PlayerSkeleton from '../components/player/PlayerSkeleton.vue'
import { takePendingLivePlayback } from '../composables/livePlayback'
import { useVideoOverlay } from '../composables/useVideoOverlay'
import { catchError } from '../utils/catchError'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const videoOverlay = useVideoOverlay()
const playback = ref<GuidePlaybackInfo | null>(null)
const loading = ref(true)
const error = ref('')
let loadSequence = 0

const channelId = computed(() => String(route.params.channelId ?? ''))

async function openPlayer(next: GuidePlaybackInfo, id: string) {
  playback.value = next
  videoOverlay.play({ id, title: next.mediaSource.title, livePlayback: next })
  const [navigationError] = await catchError(router.replace({ name: 'guide' }))
  if (navigationError) console.error('[live-player] failed to return to the guide', navigationError)
}

async function load(id: string) {
  const sequence = ++loadSequence
  playback.value = null
  error.value = ''
  loading.value = true
  const pending = takePendingLivePlayback(id)
  if (pending) {
    await openPlayer(pending.playback, id)
    loading.value = false
    return
  }
  try {
    const next = await getGuideChannelPlaybackInfo(id)
    if (sequence === loadSequence) await openPlayer(next, id)
  } catch (cause) {
    if (sequence === loadSequence) {
      console.error('[live-player] failed to get live playback info', cause)
      error.value = t('epg.playbackError')
    }
  } finally {
    if (sequence === loadSequence) loading.value = false
  }
}

function close() {
  void router.replace({ name: 'guide' })
}

watch(
  channelId,
  (id) => {
    if (id) void load(id)
  },
  { immediate: true },
)
</script>

<template>
  <main class="theme-dark fixed inset-0 z-[100] bg-black">
    <div class="grid size-full place-items-center p-6 text-center">
      <div v-if="loading">
        <PlayerSkeleton />
        <p class="mt-4 text-sm text-flixer-muted">{{ t('epg.openingPlayer') }}</p>
      </div>
      <div v-else>
        <p role="alert" class="max-w-md text-sm text-red-200">{{ error }}</p>
        <button type="button" class="mt-4 rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15" @click="close">{{ t('player.back') }}</button>
      </div>
    </div>
  </main>
</template>
