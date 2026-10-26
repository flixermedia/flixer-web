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
        <div class="relative w-full sm:max-w-sm">
          <svg class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-flixer-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input v-model="query" type="search" class="w-full rounded border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-flixer-muted focus:outline-none focus:ring-2 focus:ring-flixer-accent" :placeholder="t('social.searchPeople')" :aria-label="t('social.searchPeople')" />
        </div>
      </div>
      <p v-if="failed" class="mt-6 text-sm text-red-400" role="alert">{{ t('social.loadError') }}</p>
      <ul v-else-if="loading" class="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <li v-for="n in 6" :key="n" class="flex flex-col items-center gap-3 rounded bg-white/5 p-5"><Skeleton class="size-24 rounded" /><Skeleton class="h-4 w-24" /><Skeleton class="h-3 w-16" /></li>
      </ul>
      <p v-else-if="!profiles.length" class="mt-8 rounded border border-white/10 bg-white/5 p-6 text-center text-sm text-flixer-muted">{{ t('social.noPeople') }}</p>
      <ul v-else class="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <li v-for="person in profiles" :key="person.username" class="rounded bg-white/5 transition motion-reduce:transition-none hover:bg-white/10">
          <RouterLink :to="{ name: 'profile', params: { username: person.username } }" class="flex flex-col items-center gap-3 p-5 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent">
            <div class="size-24 overflow-hidden rounded shadow-lg shadow-black/40"><UserAvatar :avatar-url="person.avatarUrl" :name="person.displayName" class="text-3xl" /></div>
            <span class="min-w-0 max-w-full">
              <span class="block truncate text-sm font-semibold text-white">{{ person.displayName }}</span>
              <span class="block truncate text-xs text-flixer-muted">{{ person.username }}</span>
            </span>
          </RouterLink>
        </li>
      </ul>
    </main>
    <MobileTabBar :tabs="mobileTabs" />
  </div>
</template>
