<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AdminLocation, AdminPageId, AdminTabId } from './adminNav'

export interface AdminTabItem {
  id: AdminTabId
  label: string
  pages: { id: AdminPageId; label: string }[]
}

const props = defineProps<{ tabs: AdminTabItem[]; active: AdminLocation }>()
const emit = defineEmits<{ select: [location: AdminLocation] }>()
const { t } = useI18n()

const openTab = ref<AdminTabId | null>(null)
const menuPosition = ref({ top: 0, left: 0 })
const toggles = new Map<string, HTMLElement>()
const menu = ref<HTMLElement | null>(null)

const baseClass = 'px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent'
const idleClass = 'text-flixer-text/70 hover:text-white'

function close(restoreFocus = false) {
  const tab = openTab.value
  openTab.value = null
  document.removeEventListener('pointerdown', onOutside, true)
  window.removeEventListener('resize', onDismiss)
  document.removeEventListener('scroll', onScroll, true)
  if (restoreFocus && tab) toggles.get(tab)?.focus()
}

function onOutside(event: Event) {
  const target = event.target as Node
  if (menu.value?.contains(target) || [...toggles.values()].some((toggle) => toggle.contains(target))) return
  close()
}

function onDismiss() {
  close()
}

// Scrolling inside a panel (such as the live logs) must not dismiss the menu; only page scroll does.
function onScroll(event: Event) {
  if (event.target === document || event.target === document.documentElement) close()
}

async function toggle(tab: AdminTabItem) {
  if (openTab.value === tab.id) return close(true)
  const rect = toggles.get(tab.id)?.parentElement?.getBoundingClientRect()
  if (!rect) return
  menuPosition.value = { top: rect.bottom + 6, left: rect.left }
  openTab.value = tab.id
  document.addEventListener('pointerdown', onOutside, true)
  window.addEventListener('resize', onDismiss)
  document.addEventListener('scroll', onScroll, true)
  await nextTick()
  menu.value?.querySelector<HTMLElement>('[aria-current="page"], button')?.focus()
}

function choose(tab: AdminTabId, page: AdminPageId) {
  close()
  emit('select', { tab, page })
}

function onMenuKey(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    return close(true)
  }
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
  event.preventDefault()
  const items = [...(menu.value?.querySelectorAll<HTMLElement>('button') ?? [])]
  const index = items.indexOf(document.activeElement as HTMLElement)
  const next = event.key === 'ArrowDown' ? (index + 1) % items.length : (index - 1 + items.length) % items.length
  items[next]?.focus()
}

function setToggle(id: string, element: unknown) {
  if (element instanceof HTMLElement) toggles.set(id, element)
  else toggles.delete(id)
}

onBeforeUnmount(() => close())
</script>

<template>
  <div>
    <div class="flex gap-1 overflow-x-auto rounded border border-flixer-border/70 bg-flixer-surface/60 p-1 backdrop-blur" role="tablist" :aria-label="t('settings.tabs.ariaLabel')">
      <div v-for="tab in props.tabs" :key="tab.id" class="flex shrink-0 items-stretch rounded transition" :class="tab.id === props.active.tab ? 'bg-linear-to-br from-flixer-primary/40 to-flixer-secondary/30 text-white shadow-sm ring-1 ring-flixer-accent/30' : ''">
        <button type="button" role="tab" :aria-selected="tab.id === props.active.tab" :class="[baseClass, tab.pages.length > 1 ? 'rounded-l pr-1.5' : 'rounded', tab.id === props.active.tab ? 'text-white' : idleClass]" @click="emit('select', { tab: tab.id, page: tab.pages[0]!.id })">
          {{ tab.label }}
        </button>
        <button v-if="tab.pages.length > 1" :ref="(element) => setToggle(tab.id, element)" type="button" aria-haspopup="menu" :aria-expanded="openTab === tab.id" :aria-label="t('admin.pagesOf', { tab: tab.label })" :class="[baseClass, 'rounded-r pl-0.5 pr-2.5 opacity-70 hover:opacity-100', tab.id === props.active.tab ? 'text-white' : idleClass]" @click="toggle(tab)">
          <svg class="h-3.5 w-3.5 transition-transform duration-150" :class="openTab === tab.id && 'rotate-180'" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M5.22 7.22a.75.75 0 0 1 1.06 0L10 10.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" /></svg>
        </button>
      </div>
    </div>

    <Teleport to="body">
      <Transition enter-active-class="transition duration-100 ease-out" enter-from-class="-translate-y-1 opacity-0" leave-active-class="transition duration-75 ease-in" leave-to-class="opacity-0">
        <div v-if="openTab" ref="menu" role="menu" class="fixed z-50 min-w-56 rounded border border-flixer-border bg-flixer-surface/95 py-1 shadow-2xl shadow-black/50 backdrop-blur" :style="{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }" @keydown="onMenuKey">
          <button v-for="page in props.tabs.find((tab) => tab.id === openTab)?.pages" :key="page.id" type="button" role="menuitem" :aria-current="props.active.tab === openTab && props.active.page === page.id ? 'page' : undefined" class="relative block w-full px-4 py-2 text-left text-sm transition hover:bg-white/5 hover:text-white focus-visible:bg-white/5 focus-visible:outline-none" :class="props.active.tab === openTab && props.active.page === page.id ? 'bg-flixer-accent/10 text-white before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded before:bg-flixer-accent' : 'text-flixer-text/80'" @click="choose(openTab, page.id)">
            {{ page.label }}
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
