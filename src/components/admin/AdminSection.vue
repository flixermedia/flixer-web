<script setup lang="ts">
defineProps<{ title: string; description?: string }>()
</script>

<template>
  <section class="admin-card p-5">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="text-base font-semibold tracking-tight">{{ title }}</h2>
        <p v-if="description" class="mt-1 text-sm text-flixer-muted">{{ description }}</p>
      </div>
      <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
        <slot name="actions" />
      </div>
    </div>
    <div class="mt-4">
      <slot />
    </div>
  </section>
</template>
