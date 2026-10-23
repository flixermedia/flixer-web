<script setup lang="ts">
defineProps<{ label: string; description?: string; badge?: string }>()
const model = defineModel<boolean>({ default: false })
</script>

<template>
  <label class="flex cursor-pointer items-center justify-between gap-4 py-2">
    <span class="min-w-0">
      <span class="flex items-center gap-2 text-sm font-medium">
        {{ label }}
        <span v-if="badge" class="rounded-full border border-flixer-accent/40 bg-flixer-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-flixer-accent">{{ badge }}</span>
      </span>
      <span v-if="description" class="mt-0.5 block text-xs text-flixer-muted">{{ description }}</span>
    </span>
    <input v-model="model" type="checkbox" role="switch" class="peer sr-only" />
    <span class="relative h-6 w-11 shrink-0 rounded-full bg-white/15 transition after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:transition peer-checked:bg-flixer-primary peer-checked:after:translate-x-5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-flixer-accent" aria-hidden="true"></span>
  </label>
</template>
