<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{ title: string }>()
const { t } = useI18n()

const scroller = ref<{ $el: HTMLElement } | null>(null)

function scrollBy(direction: -1 | 1) {
  const el = scroller.value?.$el
  if (el) {
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: 'smooth' })
  }
}
</script>

<template>
  <section class="group/row" :aria-label="title">
    <div class="mb-3 flex items-end justify-between page-gutter">
      <h2 class="text-xl font-semibold tracking-tight text-white sm:text-2xl">{{ title }}</h2>
      <div class="hidden gap-2 opacity-0 transition group-hover/row:opacity-100 group-focus-within/row:opacity-100 md:flex">
        <button type="button" class="grid size-8 place-items-center rounded border border-flixer-border bg-flixer-surface text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" :aria-label="t('home.scrollLeft', { title })" @click="scrollBy(-1)">
          <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <button type="button" class="grid size-8 place-items-center rounded border border-flixer-border bg-flixer-surface text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" :aria-label="t('home.scrollRight', { title })" @click="scrollBy(1)">
          <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
    <TransitionGroup ref="scroller" tag="ul" name="row-card" class="flex snap-x gap-4 overflow-x-auto scroll-smooth page-gutter pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <slot />
    </TransitionGroup>
  </section>
</template>

<style>
/* Unscoped: the transition classes land on the slotted cards. */
.row-card-move,
.row-card-leave-active {
  transition:
    transform 0.3s ease,
    opacity 0.25s ease;
}
.row-card-leave-active {
  position: absolute;
}
.row-card-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
@media (prefers-reduced-motion: reduce) {
  .row-card-move,
  .row-card-leave-active {
    transition: none;
  }
}
</style>
