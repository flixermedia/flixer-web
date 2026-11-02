<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'
import { isActivePath } from '../../composables/homeNav'
import type { NavTab } from '../../types/media'

const props = defineProps<{ tabs: NavTab[] }>()
const { t } = useI18n()
const route = useRoute()

const isDocked = ref(false)
const menuOpen = ref(false)
const navRef = ref<HTMLElement | null>(null)
let observer: ResizeObserver | null = null
const homeTab = computed(() => props.tabs.find((tab) => tab.to === '/'))
const discoverTab = computed(() => props.tabs.find((tab) => tab.to === '/discover'))
const searchTab = computed(() => props.tabs.find((tab) => tab.to === '/search'))
const menuTabs = computed(() => props.tabs.filter((tab) => !['/', '/discover', '/search'].includes(tab.to)))
const menuIsActive = computed(() => menuTabs.value.some((tab) => isActivePath(route.path, tab.to)))

function onPointerDown(event: PointerEvent) {
  if (menuOpen.value && navRef.value && !navRef.value.contains(event.target as Node)) {
    menuOpen.value = false
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') menuOpen.value = false
}

function updateDocked() {
  isDocked.value = window.scrollY > 24
}

// Other fixed UI (the mini player) sits above the tab bar using this height.
function publishHeight() {
  document.documentElement.style.setProperty('--tabbar-height', `${navRef.value?.offsetHeight ?? 0}px`)
}

onMounted(() => {
  updateDocked()
  window.addEventListener('scroll', updateDocked, { passive: true })
  document.addEventListener('pointerdown', onPointerDown)
  document.addEventListener('keydown', onKeydown)
  publishHeight()
  if (navRef.value && typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(publishHeight)
    observer.observe(navRef.value)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateDocked)
  document.removeEventListener('pointerdown', onPointerDown)
  document.removeEventListener('keydown', onKeydown)
  observer?.disconnect()
  document.documentElement.style.removeProperty('--tabbar-height')
})

watch(
  () => route.path,
  () => {
    menuOpen.value = false
  },
)
</script>

<template>
  <nav ref="navRef" data-haptic class="mobile-tab-bar pointer-events-none fixed inset-x-0 bottom-0 z-30 transition-[padding] duration-300 ease-out lg:hidden" :class="isDocked ? 'px-0' : 'px-4'" :style="{ paddingBottom: isDocked ? '0px' : 'max(0.75rem, env(safe-area-inset-bottom))' }" :aria-label="t('home.tabs')">
    <div class="mobile-tab-bar__surface pointer-events-auto relative mx-auto flex max-w-full items-center justify-around border border-white/10 bg-flixer-surface/80 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl transition-[max-width,border-radius,border-color] duration-300 ease-out" :class="isDocked ? 'rounded-none border-x-0 border-b-0 border-t-white/10' : 'rounded'" :style="isDocked ? { paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' } : undefined">
      <RouterLink v-if="homeTab" :to="homeTab.to" class="group flex h-12 min-w-14 flex-1 flex-col items-center justify-center gap-0.5 rounded text-[10px] font-medium transition focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="isActivePath(route.path, homeTab.to) ? 'bg-flixer-primary/20 text-white' : 'text-flixer-muted hover:text-white'" :aria-current="isActivePath(route.path, homeTab.to) ? 'page' : undefined">
        <Icon :icon="homeTab.icon" class="size-5 transition group-active:scale-90" :class="isActivePath(route.path, homeTab.to) ? 'text-flixer-accent' : ''" aria-hidden="true" />
        <span class="max-w-full truncate">{{ homeTab.label }}</span>
      </RouterLink>
      <button id="mobile-tab-more" type="button" class="group flex h-12 min-w-14 flex-1 flex-col items-center justify-center gap-0.5 rounded text-[10px] font-medium transition focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="menuIsActive || menuOpen ? 'bg-flixer-primary/20 text-white' : 'text-flixer-muted hover:text-white'" :aria-expanded="menuOpen" aria-haspopup="true" aria-controls="mobile-tab-menu" :aria-label="t('home.nav.more')" @click="menuOpen = !menuOpen">
        <Icon icon="lucide:menu" class="size-5 transition group-active:scale-90" :class="menuIsActive || menuOpen ? 'text-flixer-accent' : ''" aria-hidden="true" />
        <span>{{ t('home.nav.more') }}</span>
      </button>
      <RouterLink v-if="discoverTab" :to="discoverTab.to" class="group flex h-12 min-w-14 flex-1 flex-col items-center justify-center gap-0.5 rounded text-[10px] font-medium transition focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="isActivePath(route.path, discoverTab.to) ? 'bg-flixer-primary/20 text-white' : 'text-flixer-muted hover:text-white'" :aria-current="isActivePath(route.path, discoverTab.to) ? 'page' : undefined">
        <Icon :icon="discoverTab.icon" class="size-5 transition group-active:scale-90" :class="isActivePath(route.path, discoverTab.to) ? 'text-flixer-accent' : ''" aria-hidden="true" />
        <span class="max-w-full truncate">{{ discoverTab.label }}</span>
      </RouterLink>
      <RouterLink v-if="searchTab" :to="searchTab.to" class="group flex h-12 min-w-14 flex-1 flex-col items-center justify-center gap-0.5 rounded text-[10px] font-medium transition focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="isActivePath(route.path, searchTab.to) ? 'bg-flixer-primary/20 text-white' : 'text-flixer-muted hover:text-white'" :aria-current="isActivePath(route.path, searchTab.to) ? 'page' : undefined">
        <Icon :icon="searchTab.icon" class="size-5 transition group-active:scale-90" :class="isActivePath(route.path, searchTab.to) ? 'text-flixer-accent' : ''" aria-hidden="true" />
        <span class="max-w-full truncate">{{ searchTab.label }}</span>
      </RouterLink>
      <div v-if="menuOpen" id="mobile-tab-menu" class="mobile-tab-bar__menu absolute inset-x-0 bottom-full mb-3 grid max-h-[60vh] grid-cols-3 gap-1 overflow-y-auto rounded border border-white/10 bg-flixer-surface/95 p-2 shadow-2xl shadow-black/60 backdrop-blur-xl" :aria-label="t('home.nav.more')" role="group">
        <RouterLink v-for="tab in menuTabs" :key="tab.to" :to="tab.to" class="flex min-w-0 flex-col items-center justify-center gap-1 rounded px-2 py-3 text-center text-xs font-medium transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="isActivePath(route.path, tab.to) ? 'bg-flixer-primary/20 text-white' : 'text-flixer-muted hover:text-white'" :aria-current="isActivePath(route.path, tab.to) ? 'page' : undefined" @click="menuOpen = false">
          <Icon :icon="tab.icon" class="size-5 shrink-0" :class="isActivePath(route.path, tab.to) ? 'text-flixer-accent' : ''" aria-hidden="true" />
          <span class="max-w-full truncate">{{ tab.label }}</span>
        </RouterLink>
      </div>
    </div>
  </nav>
</template>

<style scoped>
@media (orientation: portrait) {
  html.capacitor .mobile-tab-bar.px-0 {
    padding-bottom: 0 !important;
  }

  html.capacitor .mobile-tab-bar.px-0 .mobile-tab-bar__surface {
    padding-inline: max(6vw, env(safe-area-inset-left, 0px)) max(6vw, env(safe-area-inset-right, 0px));
    padding-bottom: clamp(0.375rem, env(safe-area-inset-bottom, 0px), 0.75rem) !important;
  }
}

@media (orientation: landscape) {
  html.capacitor .mobile-tab-bar {
    padding-inline: 0;
    padding-bottom: 0 !important;
  }

  html.capacitor .mobile-tab-bar__surface {
    width: 100%;
    border-radius: 0;
    border-inline: 0;
    padding-bottom: 0 !important;
    padding-inline: max(6vw, env(safe-area-inset-left, 0px)) max(6vw, env(safe-area-inset-right, 0px));
    transition: none;
  }

  html.capacitor .mobile-tab-bar__menu {
    inset-inline: max(6vw, env(safe-area-inset-left, 0px)) max(6vw, env(safe-area-inset-right, 0px));
  }
}
</style>
