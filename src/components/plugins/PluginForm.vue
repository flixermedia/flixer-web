<script setup lang="ts">
import { computed, reactive, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@ui-sdk/vue/button'
import { Checkbox, CheckboxIndicator } from '@ui-sdk/vue/checkbox'
import { Field, FieldDescription, FieldLabel } from '@ui-sdk/vue/field'
import { Input } from '@ui-sdk/vue/input'
import { Textarea } from '@ui-sdk/vue/textarea'
import AdminToggle from '../admin/AdminToggle.vue'
import { usePluginContext } from '../../composables/usePluginActions'
import { coerceFormValues, initialFormValues } from '../../plugins/pageLogic'
import type { FormNode } from '../../plugins/viewTypes'
import { buttonClasses, inputClass } from './classes'

const props = defineProps<{ node: FormNode }>()
const { t } = useI18n()
const context = usePluginContext()
const idPrefix = useId()
const values = reactive<Record<string, unknown>>(initialFormValues(props.node.fields))
const running = ref(false)
const inline = computed(() => props.node.layout === 'inline')
const fieldId = (name: string) => `${idPrefix}-${name}`
const helpId = (name: string) => `${idPrefix}-${name}-help`

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
  <form :class="inline ? 'flex flex-wrap items-end gap-3' : 'grid gap-4 sm:grid-cols-2'" @submit.prevent="submit">
    <template v-for="(field, index) in node.fields" :key="`${field.name}-${index}`">
      <input v-if="field.type === 'hidden'" v-model="values[field.name]" type="hidden" />
      <div v-else :class="[inline ? 'min-w-40 flex-1' : field.type === 'textarea' || field.type === 'switch' || field.type === 'checkbox' ? 'sm:col-span-2' : '']">
        <AdminToggle v-if="field.type === 'switch'" v-model="values[field.name] as boolean" :label="field.label ?? field.name" :description="field.help" :class="{ 'pointer-events-none opacity-60': field.disabled }" />
        <Field v-else-if="field.type === 'checkbox'" :disabled="field.disabled" class="grid grid-cols-[auto_1fr] items-start gap-x-2 gap-y-1 text-sm" :class="{ 'opacity-60': field.disabled }">
          <Checkbox v-model:checked="values[field.name] as boolean" class="mt-0.5 size-4 shrink-0 rounded border border-flixer-border bg-flixer-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent data-checked:border-flixer-primary data-checked:bg-flixer-primary">
            <CheckboxIndicator class="text-white" />
          </Checkbox>
          <FieldLabel :class="field.label ? '' : 'sr-only'">{{ field.label || field.name }}</FieldLabel>
          <FieldDescription v-if="field.help" class="col-start-2 text-xs text-flixer-muted">{{ field.help }}</FieldDescription>
        </Field>
        <Field v-else-if="field.type === 'text' || field.type === 'textarea'" :disabled="field.disabled">
          <FieldLabel :class="field.label ? 'mb-1 block text-sm font-medium' : 'sr-only'">
            {{ field.label || field.name }}<span v-if="field.required" class="ml-0.5 text-red-300" aria-hidden="true">*</span>
          </FieldLabel>
          <Input v-if="field.type === 'text'" v-model="values[field.name] as string" :class="inputClass" :placeholder="field.placeholder" :required="field.required" />
          <Textarea v-else v-model="values[field.name] as string" rows="4" :class="inputClass" :placeholder="field.placeholder" :required="field.required" />
          <FieldDescription v-if="field.help" class="mt-1 text-xs text-flixer-muted">{{ field.help }}</FieldDescription>
        </Field>
        <template v-else>
          <label v-if="field.label" :for="fieldId(field.name)" class="mb-1 block text-sm font-medium">
            {{ field.label }}<span v-if="field.required" class="ml-0.5 text-red-300" aria-hidden="true">*</span>
          </label>
          <select v-if="field.type === 'select'" :id="fieldId(field.name)" v-model="values[field.name]" :class="inputClass" :required="field.required" :disabled="field.disabled" :aria-label="field.label ? undefined : field.name" :aria-describedby="field.help ? helpId(field.name) : undefined">
            <option v-if="field.placeholder" value="">{{ field.placeholder }}</option>
            <option v-for="option in field.options" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
          <input
            v-else-if="field.type === 'number'"
            :id="fieldId(field.name)"
            v-model="values[field.name]"
            type="number"
            :class="inputClass"
            :placeholder="field.placeholder"
            :required="field.required"
            :disabled="field.disabled"
            :aria-label="field.label ? undefined : field.name"
            :min="field.min"
            :max="field.max"
            autocomplete="off"
            :aria-describedby="field.help ? helpId(field.name) : undefined"
          />
          <Input
            v-else
            :id="fieldId(field.name)"
            v-model="values[field.name] as string"
            :type="field.type"
            :class="inputClass"
            :placeholder="field.type === 'password' && field.hasValue ? '••••••••' : field.placeholder"
            :required="field.required && !(field.type === 'password' && field.hasValue)"
            :disabled="field.disabled"
            :aria-label="field.label ? undefined : field.name"
            :autocomplete="field.type === 'password' ? 'new-password' : 'off'"
            :aria-describedby="field.help || (field.type === 'password' && field.hasValue) ? helpId(field.name) : undefined"
          />
        </template>
        <p v-if="!['switch', 'checkbox', 'text', 'textarea'].includes(field.type) && (field.help || (field.type === 'password' && field.hasValue))" :id="helpId(field.name)" class="mt-1 text-xs text-flixer-muted">
          <span v-if="field.type === 'password' && field.hasValue" class="mr-1 font-semibold text-emerald-300">{{ t('plugins.view.saved') }}</span>{{ field.help }}
        </p>
      </div>
    </template>
    <div :class="inline ? '' : 'sm:col-span-2'">
      <Button type="submit" :class="[buttonClasses[node.submit.variant ?? 'primary'], node.submit.variant === 'quiet' ? 'bg-transparent text-flixer-text' : 'border-0']" class="h-auto whitespace-normal" :disabled="context.busy.value" :aria-busy="running" data-agent-hidden>{{ node.submit.label }}</Button>
    </div>
  </form>
</template>
