<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { usePluginContext } from '../../composables/usePluginActions'
import { resolveNav } from '../../plugins/pageLogic'
import type { CardNode } from '../../plugins/viewTypes'
import { badgeToneClasses } from './classes'
import PluginImage from './PluginImage.vue'
import PluginNode from './PluginNode.vue'

defineProps<{ node: CardNode }>()
const context = usePluginContext()
</script>

<template>
  <article class="admin-card flex h-full flex-col overflow-hidden">
    <component :is="node.to ? RouterLink : 'div'" v-bind="node.to ? { to: { query: resolveNav(context.query.value, node.to) } } : {}" class="block" :class="node.to ? 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent' : ''">
      <PluginImage v-if="node.image" :image="node.image" class="rounded-none border-0" />
      <div v-if="node.title || node.subtitle" class="px-3 pt-3">
        <h3 v-if="node.title" class="text-sm font-semibold text-white">{{ node.title }}</h3>
        <p v-if="node.subtitle" class="mt-0.5 text-xs text-flixer-muted">{{ node.subtitle }}</p>
      </div>
    </component>
    <div class="flex flex-1 flex-col gap-3 p-3" :class="{ 'pt-2': node.title || node.subtitle }">
      <div v-if="node.badges?.length" class="flex flex-wrap gap-1.5">
        <span v-for="(badge, index) in node.badges" :key="index" class="rounded-full border px-2.5 py-1 text-[10px] font-semibold" :class="badgeToneClasses[badge.tone ?? 'default']">{{ badge.text }}</span>
      </div>
      <PluginNode v-for="(child, index) in node.children" :key="index" :node="child" />
      <div v-if="node.actions?.length" class="mt-auto flex flex-wrap items-center gap-2 pt-1">
        <PluginNode v-for="(action, index) in node.actions" :key="index" :node="action" />
      </div>
    </div>
  </article>
</template>
