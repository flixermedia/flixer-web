<script setup lang="ts">
import { Button } from '@ui-sdk/vue/button'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import AuthImage from '../ui/AuthImage.vue'

export type HeroCarouselItem = {
  id: string
  title: string
  updatedAt: string
  type?: string
  label?: string
  year?: number | null
  rating?: string | null
  runtimeMinutes?: number | null
  overview?: string | null
  detail?: string
  imageItemId?: string
  imageIndex?: number | null
  poster?: number | null
  backdrop?: number | null
  logo?: number | null
  squareArtwork?: boolean
  to?: RouteLocationRaw
}

const props = withDefaults(defineProps<{ items: HeroCarouselItem[]; tv?: boolean; loading?: boolean }>(), {
  loading: false,
})
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

function typeLabel(item: HeroCarouselItem) {
  return item.label ?? (item.type ? t(`home.itemType.${item.type}`) : '')
}

function runtimeLabel(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hours > 0 ? `${hours}h ${rest}m` : `${rest}m`
}

let timer: ReturnType<typeof setInterval> | undefined

function startAutoplay() {
  stopAutoplay()
  if (!props.loading && props.items.length > 1) {
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

watch(() => [props.items.map((item) => item.id).join(','), props.loading], () => {
  activeSlide.value = 0
  startAutoplay()
})

onMounted(startAutoplay)
onBeforeUnmount(stopAutoplay)
</script>

<template>
  <section class="relative overflow-hidden" :class="tv ? 'tv-featured' : 'h-[36rem] sm:h-[42rem] lg:h-[48rem]'"
    data-tv-row :aria-label="t('home.featured')" :aria-busy="loading" @focusin="tv && stopAutoplay()"
    @focusout="tv && startAutoplay()">
    <div v-if="loading" class="absolute inset-0 animate-pulse motion-reduce:animate-none" aria-hidden="true">
      <div class="absolute inset-0 bg-gradient-to-br from-flixer-surface via-flixer-background to-flixer-surface/60">
      </div>
      <div
        class="absolute inset-0 bg-gradient-to-t from-flixer-background via-flixer-background/40 to-flixer-background/10">
      </div>
      <div class="absolute inset-0 bg-gradient-to-r from-flixer-background/80 via-flixer-background/20 to-transparent">
      </div>
      <div class="absolute inset-x-0 bottom-16 page-gutter">
        <div class="h-10 max-w-4xl rounded bg-white/10 sm:h-14 lg:h-16"></div>
        <div class="mt-4 flex gap-3">
          <div class="h-4 w-16 rounded bg-white/10"></div>
          <div class="h-4 w-12 rounded bg-white/10"></div>
          <div class="h-4 w-20 rounded bg-white/10"></div>
        </div>
        <div class="mt-3 h-4 w-2/3 max-w-2xl rounded bg-white/10"></div>
        <div class="mt-5 h-11 w-36 rounded bg-white/15"></div>
      </div>
      <div class="absolute inset-x-0 bottom-5 flex justify-center gap-3">
        <div v-for="dot in 5" :key="dot" class="size-2.5 rounded-full bg-white/20"></div>
      </div>
    </div>
    <template v-else>
      <div v-for="(item, index) in items" :key="item.id" class="absolute inset-0 transition-opacity duration-700"
        :class="index === activeSlide ? 'opacity-100' : 'opacity-0'">
        <AuthImage v-if="(item.imageIndex ?? item.backdrop ?? item.poster ?? null) !== null" scope="library"
          :item-id="item.imageItemId ?? item.id" :index="(item.imageIndex ?? item.backdrop ?? item.poster)!"
          :version="item.updatedAt" :width="1600" alt=""
          :img-class="item.squareArtwork ? 'absolute inset-0 size-full scale-110 object-cover opacity-25 blur-2xl' : 'absolute inset-0 size-full object-cover object-top'" />
      </div>
      <div
        class="absolute inset-0 bg-gradient-to-t from-flixer-background via-flixer-background/40 to-flixer-background/10">
      </div>
      <div class="absolute inset-0 bg-gradient-to-r from-flixer-background/80 via-flixer-background/20 to-transparent">
      </div>

      <div
        v-if="currentItem?.squareArtwork && (currentItem.imageIndex ?? currentItem.backdrop ?? currentItem.poster ?? null) !== null"
        class="absolute right-[10%] top-1/2 hidden aspect-square h-[min(52vh,34rem)] -translate-y-1/2 overflow-hidden rounded shadow-2xl shadow-black/60 sm:block">
        <AuthImage scope="library" :item-id="currentItem.imageItemId ?? currentItem.id"
          :index="(currentItem.imageIndex ?? currentItem.backdrop ?? currentItem.poster)!"
          :version="currentItem.updatedAt" :width="900" alt="" img-class="size-full object-contain" />
      </div>

      <div v-if="currentItem" class="absolute inset-x-0 bottom-16 page-gutter">
        <h1 v-if="currentItem.logo != null" class="max-w-md sm:max-w-lg lg:max-w-xl">
          <AuthImage scope="library" :item-id="currentItem.imageItemId ?? currentItem.id" :index="currentItem.logo"
            :version="currentItem.updatedAt" :width="600" :alt="currentItem.title"
            img-class="max-h-24 w-auto max-w-full object-contain object-left drop-shadow-lg sm:max-h-28 lg:max-h-36" />
        </h1>
        <h1 v-else class="line-clamp-3 max-w-4xl break-words font-bold uppercase text-white drop-shadow-lg"
          :class="tv ? 'tv-featured-title' : titleSize(currentItem.title)">
          {{ currentItem.title }}
        </h1>
        <div class="mt-4 flex flex-wrap items-center gap-3 text-sm text-flixer-text">
          <span v-if="typeLabel(currentItem)" class="font-medium text-white">{{ typeLabel(currentItem) }}</span>
          <span v-if="currentItem.year" class="text-flixer-muted">{{ currentItem.year }}</span>
          <span v-if="currentItem.rating" class="rounded border border-white/40 px-1.5 py-0.5 text-xs">{{
            currentItem.rating }}</span>
          <span v-if="currentItem.runtimeMinutes" class="text-flixer-muted">{{ runtimeLabel(currentItem.runtimeMinutes)
          }}</span>
          <span v-if="currentItem.detail" class="text-flixer-muted">{{ currentItem.detail }}</span>
        </div>
        <p v-if="currentItem.overview" class="mt-3 line-clamp-3 max-w-2xl text-base text-flixer-text/90">{{
          currentItem.overview }}</p>
        <div class="mt-5 flex gap-3">
          <RouterLink :to="currentItem.to ?? { name: 'media-item', params: { id: currentItem.id } }"
            class="inline-flex min-h-11 items-center gap-2 rounded bg-white px-6 text-sm font-semibold text-flixer-background transition hover:bg-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent">
            <Icon icon="lucide:circle-question-mark" class="size-4" aria-hidden="true" />
            {{ t('home.moreInfo') }}
          </RouterLink>
          <button v-if="!tv" type="button"
            class="inline-flex min-h-11 items-center gap-2 rounded border border-white/30 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent">
            <Icon icon="lucide:plus" class="size-4" aria-hidden="true" />
            {{ t('home.myList') }}
          </button>
        </div>
      </div>

      <div class="absolute inset-x-0 bottom-5 flex justify-center gap-3">
        <Button v-for="(item, index) in items" :key="item.id" type="button" :tabindex="tv ? -1 : undefined"
          class="h-2.5 rounded-full border-0 p-0 transition-all"
          :class="index === activeSlide ? 'w-6 bg-white hover:bg-white' : 'w-2.5 bg-white/40 hover:bg-white/70'"
          :aria-label="t('home.showSlide', { name: item.title })" :aria-current="index === activeSlide"
          @click="selectSlide(index)"></Button>
      </div>
    </template>
  </section>
</template>

<style>
.tv-featured {
  height: 65vh;
  min-height: 24rem;
  margin-left: calc(-1 * var(--tv-rail-size, 0px));
  transition: margin-left 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.tv-featured .page-gutter {
  padding-left: calc(var(--tv-rail-size, 0px) + 1.5rem);
  transition: padding-left 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.tv-featured-title {
  font-size: 3rem;
  line-height: 1.05;
  letter-spacing: 0;
}

@media (prefers-reduced-motion: reduce) {

  .tv-featured,
  .tv-featured .page-gutter {
    transition: none;
  }
}
</style>
