<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  buildStaticAdminCommands,
  searchAdminCommands,
  type AdminCommandFilter,
  type AdminCommandItem,
  type AdminCommandKind,
} from './adminCommandIndex'
import { isAdminCommandShortcut, useAdminCommandPalette } from '../../composables/useAdminCommandPalette'

const FILTERS: AdminCommandFilter[] = ['all', 'pages', 'sections', 'widgets', 'settings', 'live']

const { t } = useI18n()
const router = useRouter()
const { isOpen, liveItems, isLoadingLive, recentIds, close, toggle, loadLiveItems, executeCommand } = useAdminCommandPalette()

const query = ref('')
const activeFilter = ref<AdminCommandFilter>('all')
const selectedIndex = ref(0)
const inputEl = ref<HTMLInputElement | null>(null)
const listEl = ref<HTMLElement | null>(null)

const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform || navigator.userAgent)
const shortcutHint = computed(() => (isMac ? '⌘ Space' : 'Ctrl Space'))

const staticCommands = computed(() =>
  buildStaticAdminCommands({
    t,
    openActivityView: () => {
      void router.push({ name: 'admin-activity' })
    },
    openPageBuilder: () => {
      void router.push({ name: 'page-builder' })
    },
  }),
)

const allCommands = computed<AdminCommandItem[]>(() => [...staticCommands.value, ...liveItems.value])

const results = computed(() => searchAdminCommands(allCommands.value, query.value, activeFilter.value, recentIds.value, 80))

function kindLabel(kind: AdminCommandKind): string {
  return t(`admin.commandPalette.kinds.${kind}`)
}

function isRecent(id: string): boolean {
  return query.value.trim().length === 0 && recentIds.value.includes(id)
}

function moveSelection(delta: number) {
  const count = results.value.length
  if (count === 0) return
  selectedIndex.value = (selectedIndex.value + delta + count) % count
  void nextTick(() => {
    const activeEl = listEl.value?.querySelector<HTMLElement>(`[data-command-index="${selectedIndex.value}"]`)
    activeEl?.scrollIntoView({ block: 'nearest' })
  })
}

function cycleFilter(delta: number) {
  const index = FILTERS.indexOf(activeFilter.value)
  activeFilter.value = FILTERS[(index + delta + FILTERS.length) % FILTERS.length]!
}

function selectItem(item: AdminCommandItem) {
  void executeCommand(item, router)
}

function onGlobalKeydown(event: KeyboardEvent) {
  if (isAdminCommandShortcut(event)) {
    event.preventDefault()
    event.stopPropagation()
    toggle()
    return
  }

  if (!isOpen.value) return

  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }

  if (event.key === 'ArrowDown' || (event.ctrlKey && event.key.toLowerCase() === 'n')) {
    event.preventDefault()
    moveSelection(1)
    return
  }

  if (event.key === 'ArrowUp' || (event.ctrlKey && event.key.toLowerCase() === 'p')) {
    event.preventDefault()
    moveSelection(-1)
    return
  }

  if (event.key === 'Tab') {
    event.preventDefault()
    cycleFilter(event.shiftKey ? -1 : 1)
    return
  }

  if (event.key === 'Enter') {
    const item = results.value[selectedIndex.value]
    if (item) {
      event.preventDefault()
      selectItem(item)
    }
  }
}

watch(isOpen, (open) => {
  if (open) {
    query.value = ''
    activeFilter.value = 'all'
    selectedIndex.value = 0
    void nextTick(() => {
      inputEl.value?.focus()
    })
  }
})

watch([query, activeFilter, results], () => {
  if (selectedIndex.value >= results.value.length) {
    selectedIndex.value = 0
  }
})

watch([query, activeFilter], () => {
  selectedIndex.value = 0
})

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeydown, true)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKeydown, true)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="command-palette">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[70] flex items-start justify-center bg-black/65 px-4 pt-[10vh] backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        :aria-label="t('admin.commandPalette.title')"
        @mousedown.self="close()"
      >
        <div class="flex max-h-[75dvh] w-full max-w-2xl flex-col overflow-hidden rounded border border-flixer-border bg-flixer-surface text-flixer-text shadow-2xl shadow-black/70">
          <!-- Search input -->
          <div class="flex items-center gap-3 border-b border-flixer-border/60 px-4 py-3.5">
            <Icon icon="lucide:search" class="size-5 shrink-0 text-flixer-muted" aria-hidden="true" />
            <input
              ref="inputEl"
              v-model="query"
              type="text"
              autocomplete="off"
              spellcheck="false"
              class="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-flixer-muted focus:outline-none"
              :placeholder="t('admin.commandPalette.placeholder')"
              :aria-label="t('admin.commandPalette.placeholder')"
            />
            <button
              v-if="query"
              type="button"
              class="rounded p-1 text-flixer-muted transition hover:bg-white/10 hover:text-white"
              :aria-label="t('admin.commandPalette.clear')"
              @click="query = ''; inputEl?.focus()"
            >
              <Icon icon="lucide:x" class="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              class="rounded p-1 text-flixer-muted transition hover:bg-white/10 hover:text-white disabled:opacity-40"
              :disabled="isLoadingLive"
              :title="t('admin.commandPalette.refreshIndex')"
              :aria-label="t('admin.commandPalette.refreshIndex')"
              @click="loadLiveItems(true)"
            >
              <Icon icon="lucide:refresh-cw" class="size-4" :class="isLoadingLive && 'animate-spin'" aria-hidden="true" />
            </button>
            <kbd class="hidden rounded border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-[11px] text-flixer-muted sm:inline-block">Esc</kbd>
          </div>

          <!-- Filter pills -->
          <div class="flex items-center gap-1.5 overflow-x-auto border-b border-flixer-border/40 px-4 py-2">
            <button
              v-for="filter in FILTERS"
              :key="filter"
              type="button"
              class="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition"
              :class="activeFilter === filter ? 'bg-flixer-primary text-white' : 'bg-white/5 text-flixer-muted hover:bg-white/10 hover:text-white'"
              @click="activeFilter = filter"
            >
              {{ t(`admin.commandPalette.filters.${filter}`) }}
            </button>
            <span class="ml-auto shrink-0 text-[11px] text-flixer-muted">
              {{ t('admin.commandPalette.resultCount', { count: results.length }) }}
            </span>
          </div>

          <!-- Results list -->
          <div ref="listEl" class="min-h-0 flex-1 overflow-y-auto p-2" role="listbox">
            <div v-if="results.length === 0" class="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <Icon icon="lucide:search-x" class="size-8 text-flixer-muted/60" aria-hidden="true" />
              <p class="text-sm font-medium text-flixer-text">{{ t('admin.commandPalette.emptyTitle') }}</p>
              <p class="text-xs text-flixer-muted">{{ t('admin.commandPalette.emptyHint') }}</p>
            </div>

            <button
              v-for="(item, index) in results"
              :key="item.id"
              :data-command-index="index"
              type="button"
              role="option"
              :aria-selected="selectedIndex === index"
              class="flex w-full items-center gap-3 rounded px-3 py-2.5 text-left transition"
              :class="selectedIndex === index ? 'bg-flixer-primary/25 text-white ring-1 ring-flixer-accent/40' : 'text-flixer-text/85 hover:bg-white/5'"
              @mouseenter="selectedIndex = index"
              @click="selectItem(item)"
            >
              <span class="grid size-8 shrink-0 place-items-center rounded bg-white/8 text-flixer-accent">
                <Icon :icon="item.icon" class="size-4" aria-hidden="true" />
              </span>

              <span class="min-w-0 flex-1">
                <span class="flex items-center gap-2">
                  <span class="truncate text-sm font-medium">{{ item.title }}</span>
                  <span v-if="isRecent(item.id)" class="shrink-0 rounded bg-flixer-accent/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-flixer-accent">
                    {{ t('admin.commandPalette.recent') }}
                  </span>
                </span>
                <span v-if="item.subtitle" class="mt-0.5 block truncate text-xs text-flixer-muted">
                  {{ item.subtitle }}
                </span>
              </span>

              <span class="hidden shrink-0 items-center gap-2 sm:flex">
                <span class="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-flixer-muted">
                  {{ kindLabel(item.kind) }}
                </span>
                <kbd v-if="selectedIndex === index" class="rounded border border-white/15 bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-white">↵</kbd>
              </span>
            </button>
          </div>

          <!-- Footer hints -->
          <footer class="flex flex-wrap items-center justify-between gap-2 border-t border-flixer-border/50 bg-black/20 px-4 py-2 text-[11px] text-flixer-muted">
            <div class="flex flex-wrap items-center gap-3">
              <span class="flex items-center gap-1"><kbd class="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono">↑↓</kbd> {{ t('admin.commandPalette.hints.navigate') }}</span>
              <span class="flex items-center gap-1"><kbd class="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono">↵</kbd> {{ t('admin.commandPalette.hints.open') }}</span>
              <span class="flex items-center gap-1"><kbd class="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono">Tab</kbd> {{ t('admin.commandPalette.hints.filter') }}</span>
            </div>
            <span class="flex items-center gap-1">
              <kbd class="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono">{{ shortcutHint }}</kbd>
            </span>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.command-palette-enter-active,
.command-palette-leave-active {
  transition: opacity 140ms ease;
}

.command-palette-enter-from,
.command-palette-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .command-palette-enter-active,
  .command-palette-leave-active {
    transition: none;
  }
}
</style>
