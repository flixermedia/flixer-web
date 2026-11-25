<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BlurhashCanvas from './BlurhashCanvas.vue'
import { isValidBlurhash } from '../../composables/blurhash'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    src?: string | null
    blurhash?: string | null
    alt?: string
    imgClass?: string
    loading?: 'lazy' | 'eager'
    referrerpolicy?: ReferrerPolicy
    hashWidth?: number
    hashHeight?: number
  }>(),
  {
    alt: '',
    imgClass: 'size-full object-cover',
    loading: 'lazy',
    hashWidth: 32,
    hashHeight: 32,
  },
)

const emit = defineEmits<{
  load: [event: Event]
  error: [event: Event]
}>()

const imgRef = ref<HTMLImageElement | null>(null)
const loaded = ref(false)
const failed = ref(false)

const hasBlurhash = computed(() => isValidBlurhash(props.blurhash))

watch(
  () => props.src,
  (next) => {
    loaded.value = false
    failed.value = false
    if (next && imgRef.value?.complete && imgRef.value.naturalWidth > 0) {
      loaded.value = true
    }
  },
  { immediate: true },
)

function onLoad(event: Event) {
  loaded.value = true
  emit('load', event)
}

function onError(event: Event) {
  failed.value = true
  emit('error', event)
}
</script>

<template>
  <span class="relative block size-full overflow-hidden">
    <BlurhashCanvas
      v-if="hasBlurhash"
      :hash="blurhash!"
      :width="hashWidth"
      :height="hashHeight"
      class="absolute inset-0 size-full transition-opacity duration-500 motion-reduce:transition-none"
      :class="src && loaded && !failed ? 'opacity-0' : 'opacity-100'"
    />
    <span
      v-else-if="src && !loaded && !failed"
      class="absolute inset-0 block animate-pulse bg-white/10 motion-reduce:animate-none"
      aria-hidden="true"
    />
    <img
      v-if="src && !failed"
      ref="imgRef"
      v-bind="$attrs"
      :src="src"
      :alt="alt"
      :loading="loading"
      :referrerpolicy="referrerpolicy"
      :class="[imgClass, 'transition-opacity duration-500 motion-reduce:transition-none', loaded ? 'opacity-100' : 'opacity-0']"
      @load="onLoad"
      @error="onError"
    />
    <slot v-if="!src || failed" name="fallback" />
  </span>
</template>
