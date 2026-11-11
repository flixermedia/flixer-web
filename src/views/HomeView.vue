<script setup lang="ts">
import HeroCarousel from '../components/home/HeroCarousel.vue'
import MediaCard from '../components/home/MediaCard.vue'
import MediaRow from '../components/home/MediaRow.vue'
import HomeSkeleton from '../components/home/HomeSkeleton.vue'
import MobileTabBar from '../components/home/MobileTabBar.vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useAccess } from '../composables/useAccess'
import { useI18n } from 'vue-i18n'
import { getHomeContent, getHomeMusicRecommendations, getHomeRecommendations, setItemWatched, type HomeContent, type HomeMusicRecommendation, type HomeRecommendation } from '../api'
import { getMobileTabs } from '../composables/homeNav'
import { notify } from '../composables/notify'
import { catchError } from '../utils/catchError'

const { t } = useI18n()
const mobileTabs = computed(getMobileTabs)

const content = ref<HomeContent | null>(null)
const recommendations = ref<HomeRecommendation[]>([])
const recommendationsLoading = ref(false)
const musicRecommendations = ref<HomeMusicRecommendation[]>([])
const musicRecommendationsLoading = ref(false)
const recommendationsUnavailable = ref(false)
const isLoading = ref(true)
const loadFailed = ref(false)

const isEmpty = computed(() => {
  const home = content.value
  return !!home && !recommendationsLoading.value && !musicRecommendationsLoading.value && home.libraries.length === 0 && home.featured.length === 0 && home.continueWatching.length === 0 && home.recentMovies.length === 0 && home.recentShows.length === 0 && home.recentAlbums.length === 0 && recommendations.value.length === 0 && musicRecommendations.value.length === 0
})

// Libraries open the section that matches their content type.
function libraryRoute(type: string) {
  if (type === 'tvshows') return '/tv'
  if (type === 'music') return '/music'
  return '/movies'
}

async function markWatched(id: string) {
  const [error] = await catchError(setItemWatched(id, true))
  if (error) {
    notify.error(t('home.loadError'))
    return
  }
  const home = content.value
  if (!home) return
  home.continueWatching = home.continueWatching.filter((entry) => entry.id !== id)
  home.recentMovies = home.recentMovies.filter((entry) => entry.id !== id)
  home.recentShows = home.recentShows.filter((entry) => entry.id !== id)
  home.featured = home.featured.filter((entry) => entry.id !== id)
  recommendations.value = recommendations.value.filter((entry) => entry.id !== id)
  musicRecommendations.value = musicRecommendations.value.filter((entry) => entry.id !== id)
}

let recommendationsAbort: AbortController | undefined
onBeforeUnmount(() => recommendationsAbort?.abort())
const isCanceled = (error: unknown) => (error as { code?: string }).code === 'ERR_CANCELED'

async function loadRecommendations(signal?: AbortSignal) {
  recommendationsLoading.value = true
  try {
    const [error, result] = await catchError(getHomeRecommendations(signal))
    if (error) {
      if (isCanceled(error)) return
      recommendationsUnavailable.value = true
      return
    }
    recommendations.value = result.enabled ? result.items : []
  } finally {
    recommendationsLoading.value = false
  }
}

async function loadMusicRecommendations(signal?: AbortSignal) {
  musicRecommendationsLoading.value = true
  try {
    const [error, result] = await catchError(getHomeMusicRecommendations(signal))
    if (error) {
      if (isCanceled(error)) return
      recommendationsUnavailable.value = true
      return
    }
    musicRecommendations.value = result.enabled ? result.items : []
  } finally {
    musicRecommendationsLoading.value = false
  }
}

async function load() {
  isLoading.value = true
  loadFailed.value = false
  recommendationsUnavailable.value = false
  recommendationsAbort?.abort()
  recommendations.value = []
  musicRecommendations.value = []
  recommendationsLoading.value = false
  musicRecommendationsLoading.value = false
  try {
    const [error, home] = await catchError(getHomeContent())
    if (error) {
      loadFailed.value = true
      notify.error(t('home.loadError'))
      return
    }
    content.value = home
    recommendationsAbort = new AbortController()
    void loadRecommendations(recommendationsAbort.signal)
    void loadMusicRecommendations(recommendationsAbort.signal)
  } finally {
    isLoading.value = false
  }
}

const { me: access, load: loadAccess } = useAccess()
const pausedUntil = computed(() => (access.value?.schedule.nextAllowedAt ? new Date(access.value.schedule.nextAllowedAt).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' }) : null))
onMounted(() => {
  void loadAccess()
  void load()
})
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-flixer-background pb-24 font-sans text-flixer-text md:pb-12">

    <main>
      <HeroCarousel v-if="content && content.featured.length > 0" :items="content.featured" />
      <div v-else class="h-24 sm:h-28"></div>

      <div v-if="access && access.enforced && !access.schedule.allowed" class="page-gutter pt-4" role="status">
        <p class="flex items-center gap-2 rounded border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100"><Icon icon="lucide:moon" class="size-4 shrink-0" aria-hidden="true" />{{ pausedUntil ? t('access.outsideHours', { when: pausedUntil }) : t('access.outsideHoursNoTime') }}</p>
      </div>

      <HomeSkeleton v-if="isLoading" />

      <div v-else-if="loadFailed" class="page-gutter py-10">
        <p class="text-sm text-flixer-muted">{{ t('home.loadError') }}</p>
        <button type="button"
          class="mt-3 rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
          @click="load">{{ t('home.retry') }}</button>
      </div>

      <div v-else-if="isEmpty" class="page-gutter py-10">
        <h2 class="text-xl font-semibold text-white">{{ t('home.emptyTitle') }}</h2>
        <p class="mt-2 max-w-xl text-sm text-flixer-muted">{{ t('home.emptyBody') }}</p>
      </div>

      <TransitionGroup v-else-if="content" tag="div" name="home-row" class="relative flex flex-col gap-8 pt-2">
        <MediaRow key="libraries" v-if="content.libraries.length > 0" :title="t('home.myMedia')">
          <MediaCard v-for="library in content.libraries" :key="library.id" variant="library" :title="library.name"
            :to="libraryRoute(library.type)" :item-id="library.cover?.itemId" :image-index="library.cover?.index"
            :version="library.cover?.updatedAt" />
        </MediaRow>
        <MediaRow key="continue" v-if="content.continueWatching.length > 0" :title="t('home.continueWatching')">
          <MediaCard v-for="entry in content.continueWatching" :key="entry.id" variant="landscape" :title="entry.title"
            :subtitle="entry.subtitle ?? undefined" :to="{ name: 'media-item', params: { id: entry.id } }"
            :item-id="entry.imageItemId" :image-index="entry.imageIndex" :version="entry.imageUpdatedAt"
            :progress="entry.progress" markable @watched="markWatched(entry.id)" />
        </MediaRow>
        <MediaRow key="recommendations" v-if="recommendations.length > 0"
          :title="t('home.recommendedForYou')">
          <MediaCard v-for="item in recommendations" :key="item.id" :title="item.title"
            :subtitle="item.year ? String(item.year) : undefined" :item-id="item.id" :image-index="item.poster"
            :version="item.updatedAt" />
        </MediaRow>
        <MediaRow key="movies" v-if="content.recentMovies.length > 0" :title="t('home.recentMovies')">
          <MediaCard v-for="item in content.recentMovies" :key="item.id" :title="item.title"
            :subtitle="item.year ? String(item.year) : undefined" :item-id="item.id" :image-index="item.poster"
            :version="item.updatedAt" markable @watched="markWatched(item.id)" />
        </MediaRow>
        <MediaRow key="shows" v-if="content.recentShows.length > 0" :title="t('home.recentTvShows')">
          <MediaCard v-for="item in content.recentShows" :key="item.id" :title="item.title"
            :subtitle="item.year ? String(item.year) : undefined" :item-id="item.id" :image-index="item.poster"
            :version="item.updatedAt" markable @watched="markWatched(item.id)" />
        </MediaRow>
        <MediaRow key="music-recommendations" v-if="musicRecommendations.length > 0"
          :title="t('home.musicRecommendations')">
          <MediaCard v-for="item in musicRecommendations" :key="item.id" variant="square" :title="item.title"
            :subtitle="item.year ? String(item.year) : undefined" :item-id="item.id" :image-index="item.poster"
            :version="item.updatedAt" />
        </MediaRow>
        <MediaRow key="music" v-if="content.recentAlbums.length > 0" :title="t('home.recentMusic')">
          <MediaCard v-for="item in content.recentAlbums" :key="item.id" variant="square" :title="item.title"
            :subtitle="item.year ? String(item.year) : undefined" :item-id="item.id" :image-index="item.poster"
            :version="item.updatedAt" />
        </MediaRow>
      </TransitionGroup>
      <p v-if="recommendationsUnavailable" class="page-gutter -mt-2 text-sm text-flixer-muted" role="status">
        {{ t('home.aiLoadError') }}
      </p>
    </main>

    <MobileTabBar :tabs="mobileTabs" />
  </div>
</template>

<style>
.home-row-move,
.home-row-leave-active {
  transition:
    transform 0.3s ease,
    opacity 0.25s ease;
}

.home-row-leave-active {
  position: absolute;
  inset-inline: 0;
}

.home-row-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {

  .home-row-move,
  .home-row-leave-active {
    transition: none;
  }
}
</style>
