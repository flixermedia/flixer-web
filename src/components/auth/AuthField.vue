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
    <div class="relative flex h-12 items-center rounded-lg border border-flixer-border bg-flixer-surface/80 transition focus-within:border-flixer-primary focus-within:ring-4 focus-within:ring-flixer-primary/20 has-[:disabled]:opacity-50">
      <svg class="ml-4 size-[18px] shrink-0 fill-none stroke-current text-flixer-muted" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true">
        <slot name="icon" />
      </svg>
      <slot />
      <slot name="trailing" />
    </div>
  </div>
</template>
