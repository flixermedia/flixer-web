<script setup lang="ts">
defineProps<{
  id: string
  label: string
}>()
</script>

<template>
  <div class="flex flex-col">
    <label class="mb-1.5 text-xs font-medium tracking-wide text-flixer-text/85" :for="id">
      {{ label }}
    </label>
    <div
      class="relative flex h-11 items-center rounded border border-flixer-border bg-flixer-background/70 transition-colors duration-150 focus-within:border-flixer-accent focus-within:bg-flixer-background focus-within:ring-2 focus-within:ring-flixer-accent/15 has-[:disabled]:opacity-50"
    >
      <slot name="icon" />
      <slot />
      <slot name="trailing" />
    </div>
  </div>
</template>
