<script setup lang="ts">
import { Field, FieldDescription, FieldLabel } from '@ui-sdk/vue/field'
import { Input } from '@ui-sdk/vue/input'
import { ref, watch } from 'vue'

defineOptions({ inheritAttrs: false })

defineProps<{
  label?: string
  hint?: string
}>()

const [model, modifiers] = defineModel<string, 'trim'>({
  default: '',
  set: (value) => (modifiers.trim ? value.trim() : value),
})
const draft = ref(model.value)
watch(draft, (value) => { model.value = value }, { flush: 'sync' })
watch(model, (value) => {
  if (draft.value !== value && (!modifiers.trim || draft.value.trim() !== value)) draft.value = value
})
</script>

<template>
  <Field class="flex min-w-0 flex-col gap-2" :class="$attrs.class">
    <FieldLabel v-if="label" class="text-xs font-semibold text-flixer-muted">{{ label }}</FieldLabel>
    <Input v-model="draft" v-bind="{ ...$attrs, class: undefined }" class="h-12 w-full min-w-0 rounded border border-flixer-border bg-flixer-surface/50 px-4 text-base text-flixer-text outline-none placeholder:text-flixer-muted/70 focus:border-flixer-accent/60 disabled:opacity-60 sm:text-sm" @blur="modifiers.trim && (draft = model)" />
    <FieldDescription v-if="hint" class="text-xs text-flixer-muted">{{ hint }}</FieldDescription>
  </Field>
</template>
