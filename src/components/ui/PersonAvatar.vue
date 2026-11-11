<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { fetchPersonImage } from '../../api'
import { limitedImageLoad } from '../../composables/imageQueue'
import AuthImage from './AuthImage.vue'
import { catchError } from '../../utils/catchError'

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

const root = ref<HTMLElement | null>(null)
const visible = ref(typeof IntersectionObserver === 'undefined')
let observer: IntersectionObserver | undefined
let abort: AbortController | undefined

onMounted(() => {
  if (visible.value || !root.value) {
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
  observer.observe(root.value)
})

async function load() {
  const current = ++request
  abort?.abort()
  abort = new AbortController()
  const signal = abort.signal
  release()
  src.value = ''
  if (!props.hasImage) return
  const width = Math.ceil(props.width * Math.min(window.devicePixelRatio || 1, 2))
  const [failure, blob] = await catchError(limitedImageLoad(() => fetchPersonImage(props.personId, width), { signal }))
  if (failure) {
    // Falls back to the artwork or initials.
    return
  }
  if (current !== request) return
  objectUrl = URL.createObjectURL(blob)
  src.value = objectUrl
}

watch(
  () => [visible.value, props.personId, props.hasImage, props.width],
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
  <div ref="root" class="relative overflow-hidden bg-flixer-surface" role="img" :aria-label="name">
    <img v-if="src" :src="src" alt="" class="size-full object-cover object-top" />
    <slot v-else>
      <AuthImage v-if="fallback" scope="library" :item-id="fallback.itemId" :index="fallback.index" :version="fallback.version" :width="width" alt="" />
      <span v-else class="grid size-full place-items-center text-sm font-semibold text-flixer-muted" aria-hidden="true">{{ initials }}</span>
    </slot>
  </div>
</template>
