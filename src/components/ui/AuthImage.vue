<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { fetchHomeImage, fetchMediaImage } from '../../api'
import { limitedImageLoad } from '../../composables/imageQueue'

// Images need the signed-in user's token, so they are fetched as blobs instead of used as plain img sources.
// "admin" reads through the admin media endpoint (which can see every image); "library" is for regular users.
const props = withDefaults(defineProps<{ itemId: string; index: number; alt: string; version?: string; scope?: 'admin' | 'library'; imgClass?: string }>(), { scope: 'admin', imgClass: 'size-full object-cover' })

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
  const fetcher = props.scope === 'admin' ? fetchMediaImage : fetchHomeImage
  try {
    if (current !== request) return
    const blob = await limitedImageLoad(() => fetcher(props.itemId, props.index).catch(() => fetcher(props.itemId, props.index)))
    if (current !== request) return
    release()
    objectUrl = URL.createObjectURL(blob)
    src.value = objectUrl
  } catch {
    if (current === request) {
      release()
      src.value = ''
      failed.value = true
    }
  }
}

watch(() => [props.itemId, props.index, props.version, props.scope], load, { immediate: true })
onBeforeUnmount(() => {
  request++
  release()
})
</script>

<template>
  <img v-if="src" :src="src" :alt="alt" loading="lazy" :class="imgClass" />
  <span v-else class="flex size-full items-center justify-center text-[10px] text-flixer-muted" :aria-label="alt">{{ failed ? '⚠' : '' }}</span>
</template>
