<script setup lang="ts">
import { computed, reactive, ref, useId } from 'vue'
import { usePluginContext } from '../../composables/usePluginActions'
import { coerceFormValues, initialFormValues } from '../../plugins/pageLogic'
import type { FormNode } from '../../plugins/viewTypes'
import { buttonClasses, inputClass } from './classes'

const props = defineProps<{ node: FormNode }>()
const context = usePluginContext()
const idPrefix = useId()
const values = reactive<Record<string, unknown>>(initialFormValues(props.node.fields))
const running = ref(false)
const inline = computed(() => props.node.layout === 'inline')

async function submit() {
  running.value = true
  try {
    const ok = await context.run(props.node.submit.action, { values: coerceFormValues(props.node.fields, values) })
    if (ok) {
      for (const field of props.node.fields) if (field.type === 'password') values[field.name] = ''
    }
  } finally {
    running.value = false
  }
}
</script>

<template>
  <form :class="inline ? 'flex flex-wrap items-end gap-3' : 'space-y-4'" @submit.prevent="submit">
    <template v-for="(field, index) in node.fields" :key="`${field.name}-${index}`">
      <input v-if="field.type === 'hidden'" v-model="values[field.name]" type="hidden" />
      <div v-else :class="inline ? 'min-w-40 flex-1' : ''">
        <label v-if="field.type === 'checkbox'" class="flex items-center gap-2 text-sm">
          <input v-model="values[field.name]" type="checkbox" class="size-4 accent-flixer-primary" />
          <span>{{ field.label }}</span>
        </label>
        <template v-else>
          <label v-if="field.label" :for="`${idPrefix}-${field.name}`" class="mb-1 block text-sm font-medium">{{ field.label }}</label>
          <select v-if="field.type === 'select'" :id="`${idPrefix}-${field.name}`" v-model="values[field.name]" :class="inputClass" :required="field.required">
            <option v-for="option in field.options" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
          <textarea v-else-if="field.type === 'textarea'" :id="`${idPrefix}-${field.name}`" v-model="values[field.name] as string" rows="4" :class="inputClass" :placeholder="field.placeholder" :required="field.required" />
          <input
            v-else
            :id="`${idPrefix}-${field.name}`"
            v-model="values[field.name]"
            :type="field.type"
            :class="inputClass"
            :placeholder="field.placeholder"
            :required="field.required"
            :min="field.type === 'number' ? field.min : undefined"
            :max="field.type === 'number' ? field.max : undefined"
            :autocomplete="field.type === 'password' ? 'new-password' : 'off'"
          />
        </template>
        <p v-if="field.help" class="mt-1 text-xs text-flixer-muted">{{ field.help }}</p>
      </div>
    </template>
    <button type="submit" :class="buttonClasses[node.submit.variant ?? 'primary']" :disabled="context.busy.value" :aria-busy="running">{{ node.submit.label }}</button>
  </form>
</template>
