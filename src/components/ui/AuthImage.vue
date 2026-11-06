<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { fetchHomeImage, fetchMediaImage } from '../../api'
import { limitedImageLoad } from '../../composables/imageQueue'
import { fetchCachedImageBlob } from '../../composables/imageBlobCache'
import { catchError } from '../../utils/catchError'

// Images need the signed-in user's token, so they are fetched as blobs instead of used as plain img sources.
// "admin" reads through the admin media endpoint (which can see every image); "library" is for regular users.
const props = withDefaults(defineProps<{ itemId: string; index: number; alt: string; version?: string; scope?: 'admin' | 'library'; imgClass?: string; width?: number }>(), { scope: 'admin', imgClass: 'size-full object-cover' })

/** The server scales to the width asked for, so request what the element needs (in CSS px) plus room for high-density screens. */
function pixelWidth(): number | undefined {
  if (!props.width) return undefined
  return Math.ceil(props.width * Math.min(window.devicePixelRatio || 1, 2))
}

const src = ref('')
const failed = ref(false)
let objectUrl = ''
let request = 0
let abort: AbortController | undefined

function release() {
  if (objectUrl) URL.revokeObjectURL(objectUrl)
  objectUrl = ''
}

async function load() {
  const current = ++request
  abort?.abort()
  abort = new AbortController()
  const signal = abort.signal
  failed.value = false
  const width = pixelWidth()
  const cacheKey = JSON.stringify([props.scope, props.itemId, props.index, width ?? 'original', props.version ?? ''])
  const fetcher = () => (props.scope === 'admin'
    ? fetchMediaImage(props.itemId, props.index, width, props.version)
    : fetchHomeImage(props.itemId, props.index, width, props.version))
  if (current !== request) return
  const [failure, blob] = await catchError(fetchCachedImageBlob(cacheKey, () => limitedImageLoad(() => fetcher().catch(() => fetcher()), { signal }), props.version))
  if (failure) {
    // A shared in-flight request cancelled by another instance's unmount isn't a real failure for this one.
    if (current === request && (failure as { name?: string }).name === 'AbortError' && !signal.aborted) return load()
    if (current === request) {
      release()
      src.value = ''
      failed.value = true
    }
    return
  }
  if (current !== request) return
  release()
  objectUrl = URL.createObjectURL(blob)
  src.value = objectUrl
}

// Fetching only once the element is near the viewport keeps off-screen artwork from queueing ahead of what the user can see.
const el = ref<HTMLElement | null>(null)
const visible = ref(typeof IntersectionObserver === 'undefined')
let observer: IntersectionObserver | undefined

onMounted(() => {
  if (visible.value || !el.value) {
    visible.value = true
    return
  }
  observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      visible.value = true
      observer?.disconnect()
    },
    { rootMargin: '400px' },
  )
  observer.observe(el.value)
})

watch(
  () => [visible.value, props.itemId, props.index, props.version, props.scope, props.width],
  () => {
    if (visible.value) void load()
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  abort?.abort()
  observer?.disconnect()
  request++
  release()
})
</script>

<template>
  <img v-if="src" ref="el" :src="src" :alt="alt" loading="lazy" :class="imgClass" />
  <span v-else ref="el" class="flex size-full items-center justify-center text-[10px] text-flixer-muted" :class="failed ? '' : 'animate-pulse bg-white/10 motion-reduce:animate-none'" :aria-label="alt">{{ failed ? '⚠' : '' }}</span>
</template>
