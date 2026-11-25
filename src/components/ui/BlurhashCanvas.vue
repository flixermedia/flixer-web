<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { renderBlurhashToCanvas } from '../../composables/blurhash'

const props = withDefaults(
  defineProps<{
    hash: string
    width?: number
    height?: number
  }>(),
  {
    width: 32,
    height: 32,
  },
)

const canvas = ref<HTMLCanvasElement | null>(null)

function draw() {
  if (!canvas.value) return
  renderBlurhashToCanvas(canvas.value, props.hash, props.width, props.height)
}

onMounted(draw)
watch(() => [props.hash, props.width, props.height], draw)
</script>

<template>
  <canvas ref="canvas" :width="width" :height="height" aria-hidden="true" class="pointer-events-none size-full object-cover" />
</template>
