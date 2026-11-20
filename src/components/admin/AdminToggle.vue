<script setup lang="ts">
import { Switch, SwitchThumb } from '@ui-sdk/vue/switch'

defineProps<{ label: string; description?: string; badge?: string; compact?: boolean; disabled?: boolean }>()
const model = defineModel<boolean>({ default: false })
</script>

<template>
  <label class="items-center" :class="[compact ? 'inline-flex gap-3' : 'flex justify-between gap-4 py-2', disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer']">
    <span class="min-w-0">
      <span class="flex items-center gap-2 text-sm font-medium">
        {{ label }}
        <span v-if="badge" class="rounded-full border border-flixer-accent/40 bg-flixer-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-flixer-accent">{{ badge }}</span>
      </span>
      <span v-if="description" class="mt-0.5 block text-xs text-flixer-muted">{{ description }}</span>
    </span>
    <Switch v-model:checked="model" :disabled="disabled" class="relative mt-0 h-6 w-11 shrink-0 rounded-full border-0 bg-white/15 p-0 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent data-checked:bg-flixer-primary data-disabled:opacity-100">
      <SwitchThumb class="absolute left-0.5 top-0.5 size-5 rounded-full bg-white transition data-checked:ml-0 data-checked:translate-x-5 data-checked:bg-white" />
    </Switch>
  </label>
</template>
