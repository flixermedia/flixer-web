<script setup lang="ts">
import { ModalContent, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { WIDGET_CATALOG, WIDGET_CATEGORIES, filterPanels, type DashboardWidgetId, type SearchablePanel, type WidgetCategory } from './dashboard/dashboardCatalog'

defineOptions({ modalGroup: 'default' })
const props = defineProps<{ added: DashboardWidgetId[] }>()
const { close, confirm } = useModalContext<DashboardWidgetId>()
const { t } = useI18n()

const query = ref('')
const category = ref<WidgetCategory | 'all'>('all')

const panels = computed<SearchablePanel[]>(() => WIDGET_CATALOG.map((entry) => ({ id: entry.id, category: entry.category, name: t(`admin.dashboard.widgets.${entry.id}`), description: t(`admin.dashboard.descriptions.${entry.id}`) })))
const visible = computed(() => filterPanels(panels.value, query.value, category.value))
const countIn = (value: WidgetCategory | 'all') => (value === 'all' ? panels.value.length : panels.value.filter((panel) => panel.category === value).length)
const isAdded = (id: DashboardWidgetId) => props.added.includes(id)
const categories = ['all', ...WIDGET_CATEGORIES] as const
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card flex h-[min(36rem,calc(100dvh-2rem))] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-flixer-border bg-flixer-surface text-flixer-text shadow-2xl shadow-black/60">
      <div class="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
        <ModalTitle class="text-lg font-semibold">{{ t('admin.dashboard.addPanel') }}</ModalTitle>
        <button type="button" class="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-flixer-accent" @click="close()">{{ t('admin.dashboard.close') }}</button>
      </div>
      <div class="flex min-h-0 flex-1 flex-col sm:flex-row">
        <nav class="flex shrink-0 gap-1 overflow-x-auto border-b border-white/10 p-3 sm:w-52 sm:flex-col sm:overflow-y-auto sm:border-r sm:border-b-0" :aria-label="t('admin.dashboard.categories')">
          <button v-for="item in categories" :key="item" type="button" class="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm whitespace-nowrap transition focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="category === item ? 'bg-flixer-primary/25 font-semibold text-flixer-accent' : 'text-flixer-muted hover:bg-white/10 hover:text-flixer-text'" :aria-pressed="category === item" @click="category = item">
            <span>{{ t(`admin.dashboard.categoryNames.${item}`) }}</span>
            <span class="text-xs opacity-70">{{ countIn(item) }}</span>
          </button>
        </nav>
        <div class="flex min-h-0 min-w-0 flex-1 flex-col gap-3 p-4">
          <input v-model="query" type="search" class="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-flixer-accent" :placeholder="t('admin.dashboard.searchPanels')" :aria-label="t('admin.dashboard.searchPanels')" />
          <ul class="grid min-h-0 flex-1 content-start gap-3 overflow-y-auto sm:grid-cols-2">
            <li v-for="panel in visible" :key="panel.id" class="flex flex-col justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
              <div>
                <p class="font-semibold">{{ panel.name }}</p>
                <p class="mt-1 text-xs text-flixer-muted">{{ panel.description }}</p>
              </div>
              <button type="button" class="self-start rounded-lg bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 focus-visible:outline-2 focus-visible:outline-flixer-accent disabled:bg-white/10 disabled:text-flixer-muted" :disabled="isAdded(panel.id)" @click="confirm(panel.id)">{{ isAdded(panel.id) ? t('admin.dashboard.onDashboard') : t('admin.dashboard.add') }}</button>
            </li>
            <li v-if="visible.length === 0" class="col-span-full py-8 text-center text-sm text-flixer-muted">{{ t('admin.dashboard.noPanels') }}</li>
          </ul>
        </div>
      </div>
    </ModalContent>
  </ModalRoot>
</template>
