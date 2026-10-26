<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePluginContext } from '../../composables/usePluginActions'
import type { ButtonNode } from '../../plugins/viewTypes'
import { buttonClasses } from './classes'

const props = defineProps<{ node: ButtonNode }>()
const context = usePluginContext()
const running = ref(false)
const disabled = computed(() => props.node.disabled === true || context.busy.value)

async function click() {
  running.value = true
  try {
    await context.run(props.node.action, { confirm: props.node.confirm, danger: props.node.variant === 'danger' })
  } finally {
    running.value = false
  }
}
</script>

<template>
  <button type="button" :class="buttonClasses[node.variant ?? 'quiet']" :disabled="disabled" :aria-busy="running" @click="click">{{ node.label }}</button>
</template>
