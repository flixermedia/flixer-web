<script setup lang="ts">
defineProps<{
  id: string
  label: string
}>()
</script>

<template>
  <div class="flex flex-col">
    <label class="mb-2 text-xs font-medium text-flixer-text/90" :for="id">
      {{ label }}
    </label>
    <div
      class="relative flex h-12 items-center rounded-lg border border-flixer-border bg-flixer-surface/80 transition focus-within:border-flixer-primary focus-within:ring-4 focus-within:ring-flixer-primary/20 has-[:disabled]:opacity-50">
      <slot name="icon" />
      <slot />
      <slot name="trailing" />
    </div>
  </div>
</template>
