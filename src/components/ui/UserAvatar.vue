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
    <Icon v-else icon="lucide:user-round" class="size-1/3" aria-hidden="true" />
  </span>
</template>
