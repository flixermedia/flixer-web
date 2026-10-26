<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { getProfiles, type PublicProfileSummary } from '../api'
import Header from '../components/header/Header.vue'
import MobileTabBar from '../components/home/MobileTabBar.vue'
import UserAvatar from '../components/ui/UserAvatar.vue'
import Skeleton from '../components/ui/Skeleton.vue'
import { getMobileTabs, getNavLinks } from '../composables/homeNav'
import { useSignOut } from '../composables/useSignOut'
const { t } = useI18n()
const { isSigningOut, signOut } = useSignOut()
const navLinks = computed(getNavLinks)
const mobileTabs = computed(getMobileTabs)
const query = ref('')
const profiles = ref<PublicProfileSummary[]>([])
const loading = ref(true)
const activeOnly = ref(false)
const visible = computed(() => (activeOnly.value ? profiles.value.filter((person) => person.nowPlaying) : profiles.value))
const activeCount = computed(() => profiles.value.filter((person) => person.nowPlaying).length)
const failed = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
let searchId = 0
async function search() {
  const current = ++searchId
  loading.value = true
  failed.value = false
  try {
    const result = await getProfiles(query.value.trim() || undefined)
    if (current === searchId) profiles.value = result.profiles
  } catch {
    if (current === searchId) failed.value = true
  } finally {
    if (current === searchId) loading.value = false
  }
}
watch(
  query,
  () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => void search(), 250)
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  searchId++
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-flixer-background pb-24 font-sans text-flixer-text md:pb-12">
    <Header :links="navLinks" :is-signing-out="isSigningOut" @logout="signOut" />
    <main class="page-gutter pt-28 sm:pt-32">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-white">{{ t('social.people') }}</h1>
          <p class="mt-1 text-sm text-flixer-muted">{{ t('social.peopleDescription') }}</p>
        </div>
        <div class="flex w-full items-center gap-2 sm:max-w-md">
          <div class="relative min-w-0 flex-1">
            <svg class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-flixer-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input v-model="query" type="search" class="w-full rounded border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-flixer-muted focus:outline-none focus:ring-2 focus:ring-flixer-accent" :placeholder="t('social.searchPeople')" :aria-label="t('social.searchPeople')" />
          </div>
          <button type="button" class="flex shrink-0 items-center gap-2 rounded px-3 py-2.5 text-sm font-semibold transition" :class="activeOnly ? 'bg-white text-flixer-background' : 'bg-white/10 text-white hover:bg-white/20'" :aria-pressed="activeOnly" @click="activeOnly = !activeOnly"><span class="size-2 rounded-full bg-emerald-400" aria-hidden="true" />{{ t('social.activeNow', { count: activeCount }) }}</button>
        </div>
      </div>
      <p v-if="failed" class="mt-6 text-sm text-red-400" role="alert">{{ t('social.loadError') }}</p>
      <ul v-else-if="loading" class="mt-8 divide-y divide-white/5 rounded border border-white/10">
        <li v-for="n in 6" :key="n" class="flex items-center gap-4 p-4"><Skeleton class="size-12 rounded" /><Skeleton class="h-4 w-40" /></li>
      </ul>
      <p v-else-if="!visible.length" class="mt-8 rounded border border-white/10 bg-white/5 p-6 text-center text-sm text-flixer-muted">{{ t('social.noPeople') }}</p>
      <div v-else class="mt-8 overflow-hidden rounded border border-white/10">
        <div class="hidden grid-cols-[minmax(0,2fr)_minmax(0,2fr)_5rem_5rem_5rem_7rem] gap-4 border-b border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-flixer-muted lg:grid">
          <span>{{ t('social.person') }}</span
          ><span>{{ t('social.activity') }}</span
          ><span class="text-right">{{ t('social.playlists') }}</span
          ><span class="text-right">{{ t('social.favorites') }}</span
          ><span class="text-right">{{ t('social.plays') }}</span
          ><span class="text-right">{{ t('social.memberSince') }}</span>
        </div>
        <ul class="divide-y divide-white/5">
          <li v-for="person in visible" :key="person.username" class="transition motion-reduce:transition-none hover:bg-white/5">
            <RouterLink :to="{ name: 'profile', params: { username: person.username } }" class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-1 px-4 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent lg:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_5rem_5rem_5rem_7rem]">
              <span class="flex min-w-0 items-center gap-3 lg:col-span-1">
                <span class="block size-12 shrink-0 overflow-hidden rounded"><UserAvatar :avatar-url="person.avatarUrl" :name="person.displayName" class="text-lg" /></span>
                <span class="min-w-0">
                  <span class="block truncate text-sm font-semibold text-white">{{ person.displayName }}</span>
                  <span class="block truncate text-xs text-flixer-muted">{{ person.username }}</span>
                </span>
              </span>
              <span class="min-w-0 text-xs text-flixer-muted">
                <span v-if="person.nowPlaying" class="flex items-center gap-2 text-emerald-300">
                  <span class="size-2 shrink-0 animate-pulse rounded-full bg-emerald-400 motion-reduce:animate-none" aria-hidden="true" />
                  <span class="truncate">{{ person.nowPlaying.kind === 'watching' ? t('social.watchingItem', { title: person.nowPlaying.item.title }) : t('social.listeningItem', { title: person.nowPlaying.item.title }) }}</span>
                </span>
                <span v-else class="block truncate">{{ t('social.statsInline', { playlists: person.playlistCount, favorites: person.favoriteCount, plays: person.playCount }) }}</span>
              </span>
              <span class="hidden text-right text-sm tabular-nums text-white lg:block">{{ person.playlistCount }}</span>
              <span class="hidden text-right text-sm tabular-nums text-white lg:block">{{ person.favoriteCount }}</span>
              <span class="hidden text-right text-sm tabular-nums text-white lg:block">{{ person.playCount }}</span>
              <span class="hidden text-right text-xs text-flixer-muted lg:block">{{ new Date(person.joinedAt).toLocaleDateString() }}</span>
            </RouterLink>
          </li>
        </ul>
      </div>
    </main>
    <MobileTabBar :tabs="mobileTabs" />
  </div>
</template>
