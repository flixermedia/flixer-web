<script setup lang="ts">
import type { PluginImage } from '../../plugins/viewTypes'
import { aspectClasses } from './classes'

defineProps<{ image: PluginImage }>()
</script>

<template>
  <div class="relative w-full overflow-hidden rounded border border-white/10 bg-flixer-background" :class="aspectClasses[image.aspect ?? 'poster']">
    <img :src="image.src" :alt="image.alt" loading="lazy" referrerpolicy="no-referrer" class="size-full object-cover" />
  </div>
</template>
