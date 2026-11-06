<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { getItemPlaybackInfo, getTrickplay } from '../../api'
import { thumbnailStyle } from '../../composables/trickplay.ts'
import { catchError } from '../../utils/catchError'

const SAMPLE_POSITION = 0.3
const props = defineProps<{ itemId: string }>()
const element = ref<HTMLElement | null>(null)
const style = ref<Record<string, string>>({})
let observer: IntersectionObserver | null = null
let started = false
let active = true

async function load() {
  if (started) return
  started = true

  const [playbackError, playback] = await catchError(getItemPlaybackInfo(props.itemId))
  if (!active || playbackError) return

  const [trickplayError, trickplay] = await catchError(getTrickplay(playback.mediaSource.streamUrl))
  if (!active || trickplayError || !trickplay) return

  // Early frames are usually black or title cards, so sample partway through the episode.
  const { count, intervalMs } = trickplay.manifest
  style.value = thumbnailStyle(trickplay, Math.max(5, (count * intervalMs * SAMPLE_POSITION) / 1000), 320)
}

onMounted(() => {
  if (typeof IntersectionObserver === 'undefined') {
    void load()
    return
  }
  observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      observer?.disconnect()
      observer = null
      void load()
    },
    { rootMargin: '300px' },
  )
  if (element.value) observer.observe(element.value)
})

onBeforeUnmount(() => {
  active = false
  observer?.disconnect()
})
</script>

<template>
  <div ref="element" class="size-full bg-cover bg-center" :style="style" aria-hidden="true" />
</template>
