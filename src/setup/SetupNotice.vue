<script setup lang="ts">
defineProps<{ kind: 'error' | 'success' | 'info' | 'warning' }>()
</script>

<template>
  <p
    class="rounded border px-4 py-3 text-sm leading-5"
    :class="{
      'border-rose-400/40 bg-rose-400/10 text-rose-300': kind === 'error',
      'border-amber-400/40 bg-amber-400/10 text-amber-300': kind === 'warning',
      'border-emerald-400/40 bg-emerald-400/10 text-emerald-300': kind === 'success',
      'border-flixer-border bg-flixer-surface/60 text-flixer-muted': kind === 'info',
    }"
    :role="kind === 'error' || kind === 'warning' ? 'alert' : 'status'"
  >
    <slot />
  </p>
</template>
