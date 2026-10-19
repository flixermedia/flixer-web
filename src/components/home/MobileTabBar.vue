<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { NavTab } from '../../types/media'

defineProps<{ tabs: NavTab[] }>()
const { t } = useI18n()

const isDocked = ref(false)

function updateDocked() {
  isDocked.value = window.scrollY > 24
}

onMounted(() => {
  updateDocked()
  window.addEventListener('scroll', updateDocked, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateDocked)
})
</script>

<template>
  <nav class="pointer-events-none fixed inset-x-0 bottom-0 z-30 transition-[padding] duration-300 ease-out md:hidden" :class="isDocked ? 'px-0' : 'px-4'" :style="{ paddingBottom: isDocked ? '0px' : 'max(0.75rem, env(safe-area-inset-bottom))' }" :aria-label="t('home.tabs')">
    <div class="pointer-events-auto mx-auto flex items-center justify-between border border-white/10 bg-flixer-surface/80 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl transition-[max-width,border-radius,border-color] duration-300 ease-out" :class="isDocked ? 'max-w-full rounded-none border-x-0 border-b-0 border-t-white/10' : 'max-w-md rounded-2xl'" :style="isDocked ? { paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' } : undefined">
      <a v-for="(tab, index) in tabs" :key="tab.label" href="#" class="group flex h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-medium transition focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="index === 0 ? 'bg-flixer-primary/20 text-white' : 'text-flixer-muted hover:text-white'" :aria-current="index === 0 ? 'page' : undefined">
        <svg class="size-5 transition group-active:scale-90" :class="index === 0 ? 'text-flixer-accent' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path :d="tab.icon" />
        </svg>
        <span class="max-w-full truncate">{{ tab.label }}</span>
      </a>
    </div>
  </nav>
</template>
