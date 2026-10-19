<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FeaturedItem } from '../../types/media'

const props = defineProps<{ items: FeaturedItem[] }>()
const { t } = useI18n()

const AUTOPLAY_MS = 8000

const activeSlide = ref(0)
const currentItem = computed(() => props.items[activeSlide.value])

let timer: ReturnType<typeof setInterval> | undefined

function startAutoplay() {
  stopAutoplay()
  if (props.items.length > 1) {
    timer = setInterval(() => {
      activeSlide.value = (activeSlide.value + 1) % props.items.length
    }, AUTOPLAY_MS)
  }
}

function stopAutoplay() {
  clearInterval(timer)
}

function selectSlide(index: number) {
  activeSlide.value = index
  startAutoplay()
}

onMounted(startAutoplay)
onBeforeUnmount(stopAutoplay)
</script>

<template>
  <section class="relative h-[36rem] overflow-hidden sm:h-[42rem] lg:h-[48rem]" :aria-label="t('home.featured')">
    <img v-for="(item, index) in items" :key="item.image" :src="item.image" alt="" class="absolute inset-0 size-full object-cover object-top transition-opacity duration-700" :class="index === activeSlide ? 'opacity-100' : 'opacity-0'" />
    <div class="absolute inset-0 bg-gradient-to-t from-flixer-background via-flixer-background/40 to-flixer-background/10"></div>
    <div class="absolute inset-0 bg-gradient-to-r from-flixer-background/80 via-flixer-background/20 to-transparent"></div>

    <div v-if="currentItem" class="absolute inset-x-0 bottom-16 page-gutter">
      <h1 class="max-w-4xl text-5xl font-bold uppercase tracking-[0.1em] text-white drop-shadow-lg sm:text-7xl lg:text-8xl">
        {{ currentItem.title }}
      </h1>
      <div class="mt-4 flex flex-wrap items-center gap-3 text-sm text-flixer-text">
        <span class="font-medium text-white">{{ currentItem.tagline }}</span>
        <span class="text-flixer-muted">{{ currentItem.year }}</span>
        <span class="rounded border border-white/40 px-1.5 py-0.5 text-xs">{{ currentItem.rating }}</span>
        <span class="text-flixer-muted">{{ currentItem.runtime }}</span>
      </div>
      <p class="mt-3 max-w-2xl text-base text-flixer-text/90">{{ currentItem.description }}</p>
      <div class="mt-5 flex gap-3">
        <button type="button" class="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-6 text-sm font-semibold text-flixer-background transition hover:bg-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent">
          <svg class="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 8-14 8z" /></svg>
          {{ t('home.play') }}
        </button>
        <button type="button" class="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent">
          <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
          {{ t('home.myList') }}
        </button>
      </div>
    </div>

    <div class="absolute inset-x-0 bottom-5 flex justify-center gap-3">
      <button v-for="(item, index) in items" :key="item.image" type="button" class="h-2.5 rounded-full transition-all" :class="index === activeSlide ? 'w-6 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/70'" :aria-label="t('home.showSlide', { name: item.title })" :aria-current="index === activeSlide" @click="selectSlide(index)"></button>
    </div>
  </section>
</template>
