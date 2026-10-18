<script setup lang="ts">
import { useId } from 'vue'

defineOptions({ inheritAttrs: false })

defineProps<{
  label?: string
  hint?: string
}>()

const [model, modifiers] = defineModel<string, 'trim'>({
  default: '',
  set: (value) => (modifiers.trim ? value.trim() : value),
})
const id = useId()
</script>

<template>
  <div class="flex min-w-0 flex-col gap-2" :class="$attrs.class">
    <label v-if="label" :for="id" class="text-xs font-semibold text-flixer-muted">{{ label }}</label>
    <input :id="id" v-model="model" v-bind="{ ...$attrs, class: undefined }" class="h-12 w-full min-w-0 rounded-lg border border-flixer-border bg-flixer-surface/50 px-4 text-base text-flixer-text outline-none placeholder:text-flixer-muted/70 focus:border-flixer-accent/60 disabled:opacity-60 sm:text-sm" />
    <p v-if="hint" class="text-xs text-flixer-muted">{{ hint }}</p>
  </div>
</template>
