<script setup lang="ts">
defineProps<{ title: string; description?: string; compact?: boolean }>()
</script>

<template>
  <section class="admin-card" :class="compact ? 'p-3' : 'p-5'">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="font-semibold tracking-tight" :class="compact ? 'text-sm' : 'text-base'">{{ title }}</h2>
        <p v-if="description" class="mt-1 text-sm text-flixer-muted">{{ description }}</p>
      </div>
      <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
        <slot name="actions" />
      </div>
    </div>
    <div :class="compact ? 'mt-2' : 'mt-4'">
      <slot />
    </div>
  </section>
</template>
