<script setup lang="ts">
import type { PluginImage } from '../../plugins/viewTypes'
import { aspectClasses } from './classes'
import BlurImage from '../ui/BlurImage.vue'

defineProps<{ image: PluginImage }>()
</script>

<template>
  <div class="relative w-full overflow-hidden rounded border border-white/10 bg-flixer-background" :class="aspectClasses[image.aspect ?? 'poster']">
    <BlurImage :src="image.src" :alt="image.alt" loading="lazy" referrerpolicy="no-referrer" img-class="size-full object-cover" />
  </div>
</template>
