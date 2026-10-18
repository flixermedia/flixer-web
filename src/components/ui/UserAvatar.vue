<script setup lang="ts">
import { computed } from 'vue'
import { resolveAvatarUrl } from '../../api'

const props = defineProps<{
  avatarUrl: string | null | undefined
  name: string | undefined
}>()

const src = computed(() => resolveAvatarUrl(props.avatarUrl))
</script>

<template>
  <span class="grid size-full place-items-center overflow-hidden bg-gradient-to-br from-flixer-primary to-flixer-secondary text-white">
    <img v-if="src" :src="src" alt="" class="size-full object-cover" />
    <span v-else-if="name" class="font-semibold uppercase" aria-hidden="true">{{ name.charAt(0) }}</span>
    <svg v-else class="size-1/3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
    </svg>
  </span>
</template>
