<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AdminLocation, AdminPageId, AdminTabId, AdminTabItem } from './adminNav'

const props = defineProps<{ tabs: AdminTabItem[]; active: AdminLocation; title: string; subtitle: string; compact: boolean }>()
const emit = defineEmits<{ select: [location: AdminLocation]; toggleCompact: [] }>()
const { t } = useI18n()
const openSection = ref<AdminTabId | null>(props.active.tab)

const icons: Record<AdminTabId, string> = {
  dashboard: 'lucide:layout-dashboard',
  library: 'lucide:library',
  providers: 'lucide:plug',
  requests: 'lucide:message-square',
  notifications: 'lucide:bell',
  apikeys: 'lucide:key-round',
  plugins: 'lucide:puzzle',
  settings: 'lucide:settings',
}

const pageIcons: Record<AdminPageId, string> = {
  overview: 'lucide:layout-dashboard',
  libraries: 'lucide:library',
  tasks: 'lucide:list-checks',
  media: 'lucide:film',
  transcoding: 'lucide:video',
  metadata: 'lucide:file-text',
  subtitles: 'lucide:captions',
  themes: 'lucide:palette',
  requests: 'lucide:message-square',
  notifications: 'lucide:bell',
  smtp: 'lucide:mail',
  apikeys: 'lucide:key-round',
  plugins: 'lucide:puzzle',
  server: 'lucide:server',
  users: 'lucide:users-round',
  networking: 'lucide:network',
  updates: 'lucide:refresh-cw',
  backups: 'lucide:archive',
}

function choose(tab: AdminTabId, page: AdminPageId) {
  emit('select', { tab, page })
}

function toggle(tab: AdminTabId) {
  openSection.value = openSection.value === tab ? null : tab
}

function beforeAccordionEnter(element: Element) {
  const panel = element as HTMLElement
  panel.style.height = '0'
  panel.style.overflow = 'hidden'
}

function enterAccordion(element: Element) {
  const panel = element as HTMLElement
  panel.style.transition = 'height 240ms cubic-bezier(0.4, 0, 0.2, 1)'
  requestAnimationFrame(() => {
    panel.style.height = `${panel.scrollHeight}px`
  })
}

function afterAccordionEnter(element: Element) {
  const panel = element as HTMLElement
  panel.style.height = 'auto'
  panel.style.overflow = ''
  panel.style.transition = ''
}

function beforeAccordionLeave(element: Element) {
  const panel = element as HTMLElement
  panel.style.height = `${panel.scrollHeight}px`
  panel.style.overflow = 'hidden'
  void panel.offsetHeight
}

function leaveAccordion(element: Element) {
  const panel = element as HTMLElement
  panel.style.transition = 'height 240ms cubic-bezier(0.4, 0, 0.2, 1)'
  requestAnimationFrame(() => {
    panel.style.height = '0'
  })
}

function afterAccordionLeave(element: Element) {
  const panel = element as HTMLElement
  panel.style.height = ''
  panel.style.overflow = ''
  panel.style.transition = ''
}

watch(
  () => props.active.tab,
  (tab) => {
    openSection.value = tab
  },
)
</script>

<template>
  <nav class="rounded border border-flixer-border bg-flixer-surface/90 shadow-xl shadow-black/10 backdrop-blur transition-[width,padding] duration-300 ease-in-out motion-reduce:transition-none lg:rounded-none lg:fixed lg:bottom-0 lg:left-0 lg:top-16 lg:z-30 lg:flex lg:flex-col lg:overflow-hidden lg:shadow-2xl" :class="compact ? 'p-2 lg:w-20' : 'p-3 lg:w-60'" :aria-label="t('admin.adminNavigation')">
    <header class="mb-5 border-b border-flixer-border/20 px-3 pb-4 pt-2 transition-[height,padding] duration-300 ease-in-out motion-reduce:transition-none lg:mb-0 lg:h-[6.125rem] lg:shrink-0 lg:overflow-hidden" :class="compact ? 'lg:!h-9 lg:!px-0 lg:!py-0' : ''">
      <div class="relative h-[4.5rem] min-w-0 lg:w-48">
        <Transition name="admin-nav-header">
          <div v-if="!compact" :key="`${title}:${subtitle}`" class="absolute inset-x-0 top-0">
            <h1 class="whitespace-nowrap text-xl font-semibold tracking-tight text-white">{{ title }}</h1>
            <p class="mt-1 h-10 line-clamp-2 text-xs leading-5 text-flixer-muted">{{ subtitle }}</p>
          </div>
        </Transition>
      </div>
    </header>
    <div class="relative lg:min-h-0 lg:flex-1">
      <div class="admin-nav-scroll h-full overflow-y-auto lg:py-5">
        <div v-for="tab in tabs" :key="tab.id" class="not-first:mt-2">
          <button :id="`admin-nav-${tab.id}`" type="button" class="admin-nav-item flex w-full items-center rounded py-3 text-sm font-semibold transition-[gap,padding,background-color,color] duration-300 ease-in-out hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="[compact ? 'justify-center px-0' : 'gap-3 px-3 text-left', active.tab === tab.id ? 'text-white' : 'text-flixer-text/70']" :aria-label="compact ? tab.label : undefined" :title="compact ? tab.label : undefined" :aria-expanded="openSection === tab.id" :aria-controls="`admin-nav-pages-${tab.id}`" @click="toggle(tab.id)">
            <Icon :icon="icons[tab.id]" class="admin-nav-icon size-5 shrink-0" aria-hidden="true" />
            <span class="admin-nav-label min-w-0 flex-1 truncate" :class="compact && 'is-compact'" :aria-hidden="compact">{{ tab.label }}</span>
            <span class="admin-nav-chevron shrink-0" :class="compact && 'is-compact'" aria-hidden="true">
              <Icon icon="lucide:chevron-down" class="size-4 transition-transform duration-200 motion-reduce:transition-none" :class="openSection === tab.id ? 'rotate-180' : ''" />
            </span>
          </button>
          <Transition @before-enter="beforeAccordionEnter" @enter="enterAccordion" @after-enter="afterAccordionEnter" @before-leave="beforeAccordionLeave" @leave="leaveAccordion" @after-leave="afterAccordionLeave">
            <div v-if="openSection === tab.id" :id="`admin-nav-pages-${tab.id}`" class="min-h-0">
              <ul class="admin-subnav-list mt-2 grid gap-1" :class="compact ? 'is-compact' : 'ml-5 pl-3'">
                <li v-for="page in tab.pages" :key="page.id">
                  <button type="button" class="admin-subnav-item flex h-9 w-full items-center rounded text-sm transition-[padding,background-color,color] duration-300 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="[compact ? 'justify-center px-0' : 'justify-start px-3 text-left', active.tab === tab.id && active.page === page.id ? 'border border-flixer-accent/25 bg-flixer-primary/20 text-white' : 'border border-transparent text-flixer-text/70 hover:bg-white/5 hover:text-white']" :aria-label="compact ? page.label : undefined" :title="compact ? page.label : undefined" :aria-current="active.tab === tab.id && active.page === page.id ? 'page' : undefined" @click="choose(tab.id, page.id)">
                    <span class="flex min-w-0 items-center transition-[gap] duration-300 ease-in-out" :class="compact ? 'justify-center' : 'gap-2.5'">
                      <Icon :icon="pageIcons[page.id]" class="admin-subnav-icon size-4 shrink-0 opacity-80" aria-hidden="true" />
                      <span class="admin-nav-label min-w-0 truncate whitespace-nowrap" :class="compact && 'is-compact'" :aria-hidden="compact">{{ page.label }}</span>
                    </span>
                  </button>
                </li>
              </ul>
            </div>
          </Transition>
        </div>
      </div>
    </div>
    <footer class="mt-4 flex justify-center border-t border-flixer-border/20 pt-3 lg:mt-0 lg:shrink-0">
      <button type="button" class="grid size-9 shrink-0 place-items-center rounded text-flixer-muted transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" :aria-label="t(compact ? 'admin.expandNavigation' : 'admin.collapseNavigation')" :title="t(compact ? 'admin.expandNavigation' : 'admin.collapseNavigation')" @click="emit('toggleCompact')">
        <Icon :icon="compact ? 'lucide:panel-left-open' : 'lucide:panel-left-close'" class="size-5" aria-hidden="true" />
      </button>
    </footer>
  </nav>
</template>

<style scoped>
.admin-nav-scroll {
  mask-image: linear-gradient(
    to bottom,
    transparent 0,
    13px,
    black 20px,
    black calc(100% - 20px),
    calc(100% - 13px),
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0,
    13px,
    black 20px,
    black calc(100% - 20px),
    calc(100% - 13px),
    transparent 100%
  );
}

.admin-nav-item {
  transition:
    gap 300ms cubic-bezier(0.4, 0, 0.2, 1),
    padding 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.admin-nav-icon {
  transition: none;
}

.admin-subnav-list {
  margin-left: 1.25rem;
  padding-left: 0.75rem;
  border-left: 1px solid var(--color-flixer-border);
  transition:
    margin-left 300ms cubic-bezier(0.4, 0, 0.2, 1),
    padding-left 300ms cubic-bezier(0.4, 0, 0.2, 1),
    border-color 300ms ease;
}

.admin-subnav-list.is-compact {
  margin-left: 0;
  padding-left: 0;
  border-color: transparent;
}

.admin-subnav-item {
  transition: padding 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.admin-nav-chevron.is-compact {
  width: 0;
  max-width: 0;
  opacity: 0;
}

.admin-nav-chevron {
  width: 1rem;
  max-width: 1rem;
  overflow: hidden;
  transition:
    width 300ms cubic-bezier(0.4, 0, 0.2, 1),
    max-width 300ms cubic-bezier(0.4, 0, 0.2, 1),
    opacity 200ms ease;
}

.admin-nav-label {
  max-width: 12rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition:
    max-width 300ms cubic-bezier(0.4, 0, 0.2, 1),
    opacity 200ms ease;
}

.admin-nav-label.is-compact {
  max-width: 0;
  opacity: 0;
}

.admin-nav-header-enter-active,
.admin-nav-header-leave-active {
  transition: opacity 300ms ease;
}

.admin-nav-header-leave-active {
  position: absolute;
  inset-inline: 0;
  top: 0;
}

.admin-nav-header-enter-from,
.admin-nav-header-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .admin-nav-header-enter-active,
  .admin-nav-header-leave-active {
    transition: none;
  }

  .admin-nav-label,
  .admin-nav-chevron {
    transition: none;
  }
}
</style>
