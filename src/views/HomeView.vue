<script setup lang="ts">
import HeroCarousel from '../components/home/HeroCarousel.vue'
import Header from '../components/header/Header.vue'
import MediaCard from '../components/home/MediaCard.vue'
import MediaRow from '../components/home/MediaRow.vue'
import HomeSkeleton from '../components/home/HomeSkeleton.vue'
import MobileTabBar from '../components/home/MobileTabBar.vue'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getHomeContent, type HomeContent } from '../api'
import { getMobileTabs, getNavLinks } from '../composables/homeNav'
import { notify } from '../composables/notify'
import { useSignOut } from '../composables/useSignOut'

const { t } = useI18n()
const { isSigningOut, signOut } = useSignOut()
const navLinks = computed(getNavLinks)
const mobileTabs = computed(getMobileTabs)

const content = ref<HomeContent | null>(null)
const isLoading = ref(true)
const loadFailed = ref(false)

const isEmpty = computed(() => {
  const home = content.value
  return !!home && home.libraries.length === 0 && home.featured.length === 0 && home.recentMovies.length === 0 && home.recentShows.length === 0 && home.recentAlbums.length === 0
})

// Libraries open the section that matches their content type.
function libraryRoute(type: string) {
  if (type === 'tvshows') return '/tv'
  if (type === 'music') return '/music'
  return '/movies'
}

async function load() {
  isLoading.value = true
  loadFailed.value = false
  try {
    content.value = await getHomeContent()
  } catch {
    loadFailed.value = true
    notify.error(t('home.loadError'))
  } finally {
    isLoading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-flixer-background pb-24 font-sans text-flixer-text md:pb-12">
    <Header :links="navLinks" :is-signing-out="isSigningOut" @logout="signOut" />

    <main>
      <HeroCarousel v-if="content && content.featured.length > 0" :items="content.featured" />
      <div v-else class="h-24 sm:h-28"></div>

      <HomeSkeleton v-if="isLoading" />

      <div v-else-if="loadFailed" class="page-gutter py-10">
        <p class="text-sm text-flixer-muted">{{ t('home.loadError') }}</p>
        <button type="button" class="mt-3 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15" @click="load">{{ t('home.retry') }}</button>
      </div>

      <div v-else-if="isEmpty" class="page-gutter py-10">
        <h2 class="text-xl font-semibold text-white">{{ t('home.emptyTitle') }}</h2>
        <p class="mt-2 max-w-xl text-sm text-flixer-muted">{{ t('home.emptyBody') }}</p>
      </div>

      <div v-else-if="content" class="space-y-8 pt-2">
        <MediaRow v-if="content.libraries.length > 0" :title="t('home.myMedia')">
          <MediaCard v-for="library in content.libraries" :key="library.id" variant="library" :title="library.name" :to="libraryRoute(library.type)" :item-id="library.cover?.itemId" :image-index="library.cover?.index" :version="library.cover?.updatedAt" />
        </MediaRow>
        <MediaRow v-if="content.continueWatching.length > 0" :title="t('home.continueWatching')">
          <MediaCard v-for="entry in content.continueWatching" :key="entry.id" variant="landscape" :title="entry.title" :subtitle="entry.subtitle ?? undefined" :to="{ name: 'media-item', params: { id: entry.id } }" :item-id="entry.imageItemId" :image-index="entry.imageIndex" :version="entry.imageUpdatedAt" :progress="entry.progress" />
        </MediaRow>
        <MediaRow v-if="content.recentMovies.length > 0" :title="t('home.recentMovies')">
          <MediaCard v-for="item in content.recentMovies" :key="item.id" :title="item.title" :subtitle="item.year ? String(item.year) : undefined" :item-id="item.id" :image-index="item.poster" :version="item.updatedAt" />
        </MediaRow>
        <MediaRow v-if="content.recentShows.length > 0" :title="t('home.recentTvShows')">
          <MediaCard v-for="item in content.recentShows" :key="item.id" :title="item.title" :subtitle="item.year ? String(item.year) : undefined" :item-id="item.id" :image-index="item.poster" :version="item.updatedAt" />
        </MediaRow>
        <MediaRow v-if="content.recentAlbums.length > 0" :title="t('home.recentMusic')">
          <MediaCard v-for="item in content.recentAlbums" :key="item.id" variant="square" :title="item.title" :subtitle="item.year ? String(item.year) : undefined" :item-id="item.id" :image-index="item.poster" :version="item.updatedAt" />
        </MediaRow>
      </div>
    </main>

    <MobileTabBar :tabs="mobileTabs" />
  </div>
</template>
