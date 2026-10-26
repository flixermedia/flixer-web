<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { usePluginContext } from '../../composables/usePluginActions'
import { activeTab, pagerState, resolveNav } from '../../plugins/pageLogic'
import type { ViewNode } from '../../plugins/viewTypes'
import { alertToneClasses, aspectClasses, badgeToneClasses, gapClasses, headingClasses, inputClass, quietButtonClass, textToneClasses } from './classes'
import PluginButton from './PluginButton.vue'
import PluginCard from './PluginCard.vue'
import PluginForm from './PluginForm.vue'
import PluginSection from './PluginSection.vue'
import PluginTable from './PluginTable.vue'

const props = defineProps<{ node: ViewNode }>()
const { t } = useI18n()
const context = usePluginContext()

const searchValue = ref(props.node.type === 'searchbox' ? (props.node.value ?? '') : '')
watch(
  () => (props.node.type === 'searchbox' ? props.node.value : undefined),
  (value) => {
    searchValue.value = value ?? ''
  },
)

const stackClass = computed(() => {
  const node = props.node
  if (node.type !== 'stack') return ''
  const row = node.direction === 'row'
  const align = node.align === 'between' ? 'justify-between' : node.align === 'center' ? (row ? 'justify-center' : 'items-center') : node.align === 'end' ? (row ? 'justify-end' : 'items-end') : node.align === 'start' ? (row ? 'justify-start' : 'items-start') : ''
  return [row ? 'flex flex-row items-center' : 'flex flex-col', gapClasses[node.gap ?? 3], node.wrap ? 'flex-wrap' : '', align].join(' ')
})

const selectedTab = computed(() => (props.node.type === 'tabs' ? activeTab(props.node.tabs, context.query.value, props.node.param) : undefined))
const pager = computed(() => (props.node.type === 'pager' ? pagerState(props.node.page, props.node.pageSize, props.node.total) : null))
const activeChip = computed(() => (props.node.type === 'chips' ? (context.query.value[props.node.param] ?? props.node.value ?? '') : ''))
</script>

<template>
  <div v-if="node.type === 'stack'" :class="stackClass">
    <PluginNode v-for="(child, index) in node.children" :key="index" :node="child" />
  </div>

  <component :is="`h${node.level ?? 2}`" v-else-if="node.type === 'heading'" :class="headingClasses[node.level ?? 2]">{{ node.text }}</component>

  <p v-else-if="node.type === 'text'" :class="[textToneClasses[node.tone ?? 'default'], node.size === 'sm' ? 'text-xs' : 'text-sm']" class="whitespace-pre-line">{{ node.text }}</p>

  <span v-else-if="node.type === 'badge'" class="inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold" :class="badgeToneClasses[node.tone ?? 'default']">{{ node.text }}</span>

  <div v-else-if="node.type === 'image'" class="relative w-full max-w-xs overflow-hidden rounded border border-white/10 bg-flixer-background" :class="aspectClasses[node.aspect ?? 'poster']">
    <img :src="node.src" :alt="node.alt" loading="lazy" referrerpolicy="no-referrer" class="size-full object-cover" />
  </div>

  <div v-else-if="node.type === 'grid'" class="grid gap-4" :style="{ gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${node.minWidth ?? 160}px), 1fr))` }">
    <PluginNode v-for="(child, index) in node.children" :key="index" :node="child" />
  </div>

  <PluginSection v-else-if="node.type === 'section'" :node="node" />

  <PluginCard v-else-if="node.type === 'card'" :node="node" />

  <div v-else-if="node.type === 'tabs'" class="space-y-4">
    <div class="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist">
      <button
        v-for="tab in node.tabs"
        :key="tab.id"
        type="button"
        role="tab"
        :aria-selected="selectedTab === tab.id"
        class="shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent"
        :class="selectedTab === tab.id ? 'border-white bg-white text-flixer-background' : 'border-flixer-border bg-flixer-surface/50 text-flixer-muted hover:border-white/30 hover:text-white'"
        @click="context.patchQuery({ [node.param]: tab.id }, node.reset)"
      >
        {{ tab.label }}
      </button>
    </div>
    <template v-for="tab in node.tabs" :key="tab.id">
      <div v-if="tab.id === selectedTab" class="space-y-4" role="tabpanel">
        <PluginNode v-for="(child, index) in tab.children" :key="index" :node="child" />
      </div>
    </template>
  </div>

  <PluginTable v-else-if="node.type === 'table'" :node="node" />

  <PluginForm v-else-if="node.type === 'form'" :node="node" />

  <PluginButton v-else-if="node.type === 'button'" :node="node" />

  <RouterLink v-else-if="node.type === 'link'" :to="{ query: resolveNav(context.query.value, node.to) }" class="text-sm font-semibold text-flixer-accent underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent">{{ node.label }}</RouterLink>

  <hr v-else-if="node.type === 'divider'" class="border-flixer-border" />

  <p v-else-if="node.type === 'empty'" class="rounded border border-dashed border-flixer-border bg-flixer-surface/30 px-5 py-10 text-center text-sm text-flixer-muted">{{ node.text }}</p>

  <div v-else-if="node.type === 'alert'" class="rounded border px-4 py-3 text-sm" :class="alertToneClasses[node.tone ?? 'info']" :role="node.tone === 'danger' || node.tone === 'warning' ? 'alert' : 'status'">{{ node.text }}</div>

  <nav v-else-if="node.type === 'pager' && pager && pager.pages > 1" class="flex items-center justify-between gap-3" :aria-label="t('plugins.view.pagination')">
    <button type="button" :class="quietButtonClass" :disabled="!pager.hasPrev" @click="context.patchQuery({ [node.param]: String(pager.current - 1) })">{{ t('plugins.view.previous') }}</button>
    <span class="text-xs text-flixer-muted">{{ t('plugins.view.range', { first: pager.first, last: pager.last, total: node.total }) }}</span>
    <button type="button" :class="quietButtonClass" :disabled="!pager.hasNext" @click="context.patchQuery({ [node.param]: String(pager.current + 1) })">{{ t('plugins.view.next') }}</button>
  </nav>

  <form v-else-if="node.type === 'searchbox'" class="flex gap-2" role="search" @submit.prevent="context.patchQuery({ [node.param]: searchValue.trim() }, node.reset)">
    <input v-model="searchValue" type="search" :class="inputClass" :placeholder="node.placeholder" :aria-label="node.placeholder || t('plugins.view.search')" maxlength="200" />
    <button type="submit" :class="quietButtonClass">{{ t('plugins.view.search') }}</button>
  </form>

  <div v-else-if="node.type === 'chips'" class="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group">
    <button
      v-for="option in node.options"
      :key="option.value"
      type="button"
      class="inline-flex shrink-0 items-center rounded-full border px-3 py-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent"
      :class="activeChip === option.value ? 'border-white bg-white text-flixer-background' : 'border-flixer-border bg-flixer-surface/50 text-flixer-muted hover:border-white/30 hover:text-white'"
      :aria-pressed="activeChip === option.value"
      @click="context.patchQuery({ [node.param]: option.value }, node.reset)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
