<script setup lang="ts">
defineProps<{ title: string; description?: string }>()
</script>

<template>
  <div class="flex flex-col gap-6">
    <header>
      <h2 class="text-2xl font-semibold tracking-tight text-flixer-text sm:text-3xl">{{ title }}</h2>
      <p v-if="description" class="mt-2 text-sm leading-6 text-flixer-muted">{{ description }}</p>
    </header>
    <slot />
  </div>
</template>
