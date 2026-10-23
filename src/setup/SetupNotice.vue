<script setup lang="ts">
defineProps<{ kind: 'error' | 'success' | 'info' }>()
</script>

<template>
  <p
    class="rounded-lg border px-4 py-3 text-sm leading-5"
    :class="{
      'border-rose-400/40 bg-rose-400/10 text-rose-300': kind === 'error',
      'border-emerald-400/40 bg-emerald-400/10 text-emerald-300': kind === 'success',
      'border-flixer-border bg-flixer-surface/60 text-flixer-muted': kind === 'info',
    }"
    :role="kind === 'error' ? 'alert' : 'status'"
  >
    <slot />
  </p>
</template>
