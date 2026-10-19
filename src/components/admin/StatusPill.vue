<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ tone?: 'good' | 'warn' | 'bad' | 'neutral' | 'accent' }>()

const toneClass = computed(
  () =>
    ({
      good: 'bg-emerald-500/20 text-emerald-300',
      warn: 'bg-amber-500/20 text-amber-300',
      bad: 'bg-red-500/20 text-red-200',
      accent: 'bg-flixer-primary/25 text-flixer-accent',
      neutral: 'bg-white/10 text-flixer-muted',
    })[props.tone ?? 'neutral'],
)
</script>

<template>
  <span class="inline-flex items-center rounded px-3 py-1 text-xs font-semibold" :class="toneClass"><slot /></span>
</template>
