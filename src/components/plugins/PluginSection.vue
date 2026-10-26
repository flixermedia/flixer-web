<script setup lang="ts">
import type { SectionNode } from '../../plugins/viewTypes'
import PluginNode from './PluginNode.vue'

defineProps<{ node: SectionNode }>()
</script>

<template>
  <section class="admin-card p-5">
    <div v-if="node.title || node.description || node.actions?.length" class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <h2 v-if="node.title" class="text-base font-semibold tracking-tight">{{ node.title }}</h2>
        <p v-if="node.description" class="mt-1 text-sm text-flixer-muted">{{ node.description }}</p>
      </div>
      <div v-if="node.actions?.length" class="flex flex-wrap items-center gap-2">
        <PluginNode v-for="(action, index) in node.actions" :key="index" :node="action" />
      </div>
    </div>
    <div v-if="node.children?.length" class="flex flex-col gap-4" :class="{ 'mt-4': node.title || node.description || node.actions?.length }">
      <PluginNode v-for="(child, index) in node.children" :key="index" :node="child" />
    </div>
  </section>
</template>
