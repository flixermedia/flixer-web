<script setup lang="ts">
import HeroCarousel from '../components/home/HeroCarousel.vue'
import Header from '../components/header/Header.vue'
import MediaCard from '../components/home/MediaCard.vue'
import MediaRow from '../components/home/MediaRow.vue'
import MobileTabBar from '../components/home/MobileTabBar.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSignOut } from '../composables/useSignOut'
import { continueWatching, featuredItems, getHomeLibraries, getMobileTabs, getNavLinks, latestMovies, latestShows, nextUp } from '../mocks/home'

const { t } = useI18n()
const { isSigningOut, signOut } = useSignOut()
const navLinks = computed(getNavLinks)
const libraries = computed(getHomeLibraries)
const mobileTabs = computed(getMobileTabs)
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-flixer-background pb-24 font-sans text-flixer-text md:pb-12">
    <Header :links="navLinks" :is-signing-out="isSigningOut" @logout="signOut" />

    <main>
      <HeroCarousel :items="featuredItems" />

      <div class="space-y-8 pt-2">
        <MediaRow :title="t('home.continueWatching')">
          <MediaCard v-for="item in continueWatching" :key="item.title" variant="landscape" v-bind="item" />
        </MediaRow>
        <MediaRow :title="t('home.myMedia')">
          <MediaCard v-for="item in libraries" :key="item.title" variant="library" v-bind="item" />
        </MediaRow>
        <MediaRow :title="t('home.nextUp')">
          <MediaCard v-for="item in nextUp" :key="item.title" variant="landscape" v-bind="item" />
        </MediaRow>
        <MediaRow :title="t('home.recentMovies')">
          <MediaCard v-for="item in latestMovies" :key="item.title" v-bind="item" />
        </MediaRow>
        <MediaRow :title="t('home.recentTvShows')">
          <MediaCard v-for="item in latestShows" :key="item.title" v-bind="item" />
        </MediaRow>
      </div>
    </main>

    <MobileTabBar :tabs="mobileTabs" />
  </div>
</template>
