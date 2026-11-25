<script setup lang="ts">
import { computed } from 'vue'
import { resolveAvatarUrl } from '../../api'
import BlurImage from './BlurImage.vue'

const props = defineProps<{
  avatarUrl: string | null | undefined
  name: string | undefined
  blurhash?: string | null
}>()

const src = computed(() => resolveAvatarUrl(props.avatarUrl))
</script>

<template>
  <span class="grid size-full place-items-center overflow-hidden bg-gradient-to-br from-flixer-primary to-flixer-secondary text-white">
    <BlurImage v-if="src" :src="src" :blurhash="blurhash" alt="" img-class="size-full object-cover">
      <template #fallback>
        <span v-if="name" class="grid size-full place-items-center font-semibold uppercase" aria-hidden="true">{{ name.charAt(0) }}</span>
        <Icon v-else icon="lucide:user-round" class="size-1/3" aria-hidden="true" />
      </template>
    </BlurImage>
    <span v-else-if="name" class="font-semibold uppercase" aria-hidden="true">{{ name.charAt(0) }}</span>
    <Icon v-else icon="lucide:user-round" class="size-1/3" aria-hidden="true" />
  </span>
</template>
