<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getItemPlaybackInfo } from '../../api/playback'
import { reportAdvertisementView } from '../../api/analytics'
import type { PlaybackAdvertisement } from '../../api/advertisements'
import { playerActionButton } from './playerActionStyles'

const props = defineProps<{ ad: PlaybackAdvertisement; autoplay: boolean; itemId?: string }>()
const emit = defineEmits<{ done: []; close: []; started: [] }>()
const { t } = useI18n()
const video = ref<HTMLVideoElement>()
const watched = ref(0)
const failed = ref(false)
const playing = ref(false)
const currentAd = ref(props.ad)
const loading = ref(Boolean(props.itemId))
const shouldAutoplay = ref(props.autoplay)
const remaining = computed(() => currentAd.value.skipAfterSeconds === null ? null : Math.max(0, Math.ceil(currentAd.value.skipAfterSeconds - watched.value)))
let previous: { position: number; time: number } | undefined
let generation = 0
let viewId: string | undefined
let viewAdId: string | undefined
let reportedAt = 0
let completed = false
let skipped = false
let clicked = false

function reportView() {
  if (!props.itemId || !viewId || !viewAdId) return
  const report = { id: viewId, advertisementId: viewAdId, watchedSeconds: watched.value, completed, skipped, clicked }
  void Promise.resolve().then(() => reportAdvertisementView(report)).catch((error: unknown) => console.error('[advertisements] Could not report viewing analytics', error))
}

function started() {
  playing.value = true
  if (!props.itemId) return
  if (!viewId || viewAdId !== currentAd.value.id) {
    if (!globalThis.crypto?.getRandomValues) {
      console.error('[advertisements] Secure randomness is unavailable; viewing analytics cannot be recorded')
      return
    }
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16))
    bytes[6] = (bytes[6]! & 0x0f) | 0x40
    bytes[8] = (bytes[8]! & 0x3f) | 0x80
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
    viewId = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
    viewAdId = currentAd.value.id
    watched.value = 0
    reportedAt = 0
    completed = false
    skipped = false
    clicked = false
  }
  reportView()
}

function finish(skipping: boolean) {
  if (skipping) skipped = true
  else completed = true
  reportView()
  emit('done')
}

async function refresh() {
  const request = ++generation
  failed.value = false
  loading.value = true
  previous = undefined
  try {
    if (!props.itemId) throw new Error('An item ID is required to refresh advertisement playback.')
    const playback = await getItemPlaybackInfo(props.itemId)
    if (request !== generation) return
    const ad = playback.advertisements?.find((entry) => entry.atSeconds === props.ad.atSeconds)
    if (!ad) {
      emit('done')
      return
    }
    currentAd.value = ad
    loading.value = false
  } catch (error) {
    if (request !== generation) return
    console.error('[advertisements] Could not refresh playback', error)
    loading.value = false
    failed.value = true
  }
}

onMounted(() => {
  if (props.itemId) void refresh()
})
onBeforeUnmount(() => { generation++; reportView() })

function recordProgress() {
  const element = video.value
  if (!element || element.paused || element.seeking) {
    previous = undefined
    return
  }
  const current = { position: element.currentTime, time: performance.now() }
  if (previous) watched.value += Math.max(0, Math.min(current.position - previous.position, (current.time - previous.time) / 1000))
  previous = current
  if (watched.value - reportedAt >= 10) {
    reportedAt = watched.value
    reportView()
  }
}

function play() {
  emit('started')
  void video.value?.play().catch((error: unknown) => {
    console.error('[advertisements] Playback failed', error)
    failed.value = true
  })
}

function retry() {
  failed.value = false
  previous = undefined
  shouldAutoplay.value = true
  if (props.itemId) {
    emit('started')
    void refresh()
  } else {
    void nextTick().then(play)
  }
}
</script>

<template>
  <div class="relative size-full bg-black text-white">
    <video v-if="!loading && !failed" ref="video" :src="currentAd.streamUrl" class="size-full object-contain" :autoplay="shouldAutoplay" playsinline @play="started" @pause="playing = false; previous = undefined" @seeking="previous = undefined" @waiting="previous = undefined" @timeupdate="recordProgress" @ended="finish(false)" @error="failed = true" />
    <p v-if="loading" class="absolute inset-0 grid place-items-center" role="status">{{ t('common.loading') }}</p>
    <button v-if="!loading && !playing && !failed" type="button" class="absolute inset-0 m-auto grid size-20 place-items-center rounded bg-flixer-primary/90 text-white shadow-2xl shadow-black/60 transition hover:scale-105 hover:bg-flixer-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" :aria-label="t('player.play')" @click="play">
      <Icon icon="lucide:play" class="ml-1 size-9" aria-hidden="true" />
    </button>
    <div class="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent p-5">
      <span class="rounded bg-black/60 px-3 py-1 text-sm font-semibold">{{ t('advertisements.label') }} · {{ currentAd.name }}</span>
      <button type="button" :class="playerActionButton" @click="emit('close')">{{ t('player.closePlayer') }}</button>
    </div>
    <div class="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 bg-gradient-to-t from-black/90 to-transparent p-5">
      <a :href="currentAd.targetUrl" target="_blank" rel="noopener noreferrer" :class="playerActionButton" @click="clicked = true; reportView()">{{ t('advertisements.visit') }} ↗</a>
      <button v-if="remaining !== null" type="button" :disabled="loading || failed || remaining > 0" :class="playerActionButton" class="disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-black/70 disabled:hover:text-white" @click="finish(true)">
        {{ remaining > 0 ? t('advertisements.skipIn', { seconds: remaining }) : t('advertisements.skip') }}
      </button>
    </div>
    <div v-if="failed" class="absolute inset-0 grid place-items-center bg-black/90" role="alert">
      <div class="text-center">
        <p>{{ t('advertisements.playbackError') }}</p>
        <button type="button" :class="playerActionButton" class="mt-4" @click="retry">{{ t('player.tryAgain') }}</button>
        <button type="button" :class="playerActionButton" class="ml-3 mt-4" @click="emit('close')">{{ t('player.closePlayer') }}</button>
      </div>
    </div>
  </div>
</template>
