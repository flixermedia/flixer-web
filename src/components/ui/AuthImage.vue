<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
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

function release() {
  if (objectUrl) URL.revokeObjectURL(objectUrl)
  objectUrl = ''
}

async function load() {
  const current = ++request
  failed.value = false
  const width = pixelWidth()
  const cacheKey = JSON.stringify([props.scope, props.itemId, props.index, width ?? 'original', props.version ?? ''])
  const fetcher = () => (props.scope === 'admin'
    ? fetchMediaImage(props.itemId, props.index, width, props.version)
    : fetchHomeImage(props.itemId, props.index, width, props.version))
  if (current !== request) return
  const [failure, blob] = await catchError(fetchCachedImageBlob(cacheKey, () => limitedImageLoad(() => fetcher().catch(() => fetcher())), props.version))
  if (failure) {
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

watch(() => [props.itemId, props.index, props.version, props.scope, props.width], load, { immediate: true })
onBeforeUnmount(() => {
  request++
  release()
})
</script>

<template>
  <img v-if="src" :src="src" :alt="alt" loading="lazy" :class="imgClass" />
  <span v-else class="flex size-full items-center justify-center text-[10px] text-flixer-muted" :class="failed ? '' : 'animate-pulse bg-white/10 motion-reduce:animate-none'" :aria-label="alt">{{ failed ? '⚠' : '' }}</span>
</template>
