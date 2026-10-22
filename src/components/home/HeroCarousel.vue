<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import type { HomeFeatured } from '../../api'
import AuthImage from '../ui/AuthImage.vue'

const props = defineProps<{ items: HomeFeatured[] }>()
const { t } = useI18n()

const AUTOPLAY_MS = 8000

const activeSlide = ref(0)
const currentItem = computed(() => props.items[activeSlide.value])

function titleSize(title: string) {
  if (title.length > 32) return 'text-3xl sm:text-4xl lg:text-5xl tracking-[0.06em]'
  if (title.length > 20) return 'text-4xl sm:text-5xl lg:text-6xl tracking-[0.08em]'
  if (title.length > 12) return 'text-5xl sm:text-6xl lg:text-7xl tracking-[0.1em]'
  return 'text-5xl sm:text-7xl lg:text-8xl tracking-[0.1em]'
}

function typeLabel(item: HomeFeatured) {
  return t(`home.itemType.${item.type}`)
}

function runtimeLabel(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hours > 0 ? `${hours}h ${rest}m` : `${rest}m`
}

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
    <div v-for="(item, index) in items" :key="item.id" class="absolute inset-0 transition-opacity duration-700" :class="index === activeSlide ? 'opacity-100' : 'opacity-0'">
      <AuthImage v-if="item.backdrop !== null" scope="library" :item-id="item.id" :index="item.backdrop" :version="item.updatedAt" :width="1600" alt="" img-class="absolute inset-0 size-full object-cover object-top" />
    </div>
    <div class="absolute inset-0 bg-gradient-to-t from-flixer-background via-flixer-background/40 to-flixer-background/10"></div>
    <div class="absolute inset-0 bg-gradient-to-r from-flixer-background/80 via-flixer-background/20 to-transparent"></div>

    <div v-if="currentItem" class="absolute inset-x-0 bottom-16 page-gutter">
      <h1 class="line-clamp-3 max-w-4xl break-words font-bold uppercase text-white drop-shadow-lg" :class="titleSize(currentItem.title)">
        {{ currentItem.title }}
      </h1>
      <div class="mt-4 flex flex-wrap items-center gap-3 text-sm text-flixer-text">
        <span class="font-medium text-white">{{ typeLabel(currentItem) }}</span>
        <span v-if="currentItem.year" class="text-flixer-muted">{{ currentItem.year }}</span>
        <span v-if="currentItem.rating" class="rounded border border-white/40 px-1.5 py-0.5 text-xs">{{ currentItem.rating }}</span>
        <span v-if="currentItem.runtimeMinutes" class="text-flixer-muted">{{ runtimeLabel(currentItem.runtimeMinutes) }}</span>
      </div>
      <p v-if="currentItem.overview" class="mt-3 line-clamp-3 max-w-2xl text-base text-flixer-text/90">{{ currentItem.overview }}</p>
      <div class="mt-5 flex gap-3">
        <RouterLink :to="{ name: 'media-item', params: { id: currentItem.id } }" class="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-6 text-sm font-semibold text-flixer-background transition hover:bg-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent">
          <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
          {{ t('home.moreInfo') }}
        </RouterLink>
        <button type="button" class="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent">
          <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
          {{ t('home.myList') }}
        </button>
      </div>
    </div>

    <div class="absolute inset-x-0 bottom-5 flex justify-center gap-3">
      <button v-for="(item, index) in items" :key="item.id" type="button" class="h-2.5 rounded-full transition-all" :class="index === activeSlide ? 'w-6 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/70'" :aria-label="t('home.showSlide', { name: item.title })" :aria-current="index === activeSlide" @click="selectSlide(index)"></button>
    </div>
  </section>
</template>
