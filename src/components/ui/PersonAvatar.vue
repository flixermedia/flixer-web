<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { fetchPersonImage } from '../../api'
import { limitedImageLoad } from '../../composables/imageQueue'
import AuthImage from './AuthImage.vue'

/**
 * A round photo of a person. Without a photo it shows the artwork of `fallback` (an album cover, for artists)
 * and finally their initials.
 */
const props = defineProps<{ personId: string; name: string; hasImage: boolean; width: number; fallback?: { itemId: string; index: number; version?: string } | null }>()

const src = ref('')
let objectUrl = ''
let request = 0

const initials = computed(
  () =>
    props.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?',
)

function release() {
  if (objectUrl) URL.revokeObjectURL(objectUrl)
  objectUrl = ''
}

async function load() {
  const current = ++request
  release()
  src.value = ''
  if (!props.hasImage) return
  const width = Math.ceil(props.width * Math.min(window.devicePixelRatio || 1, 2))
  try {
    const blob = await limitedImageLoad(() => fetchPersonImage(props.personId, width))
    if (current !== request) return
    objectUrl = URL.createObjectURL(blob)
    src.value = objectUrl
  } catch {
    // Falls back to the artwork or initials.
  }
}

watch(() => [props.personId, props.hasImage, props.width], load, { immediate: true })
onBeforeUnmount(() => {
  request++
  release()
})
</script>

<template>
  <div class="relative overflow-hidden bg-flixer-surface" role="img" :aria-label="name">
    <img v-if="src" :src="src" alt="" class="size-full object-cover object-top" />
    <AuthImage v-else-if="fallback" scope="library" :item-id="fallback.itemId" :index="fallback.index" :version="fallback.version" :width="width" alt="" />
    <span v-else class="grid size-full place-items-center text-sm font-semibold text-flixer-muted" aria-hidden="true">{{ initials }}</span>
  </div>
</template>
