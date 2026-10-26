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
        <input v-model="query" type="search" class="w-full rounded border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-flixer-muted focus:outline-none focus:ring-2 focus:ring-flixer-accent sm:max-w-sm" :placeholder="t('social.searchPeople')" :aria-label="t('social.searchPeople')" />
      </div>
      <p v-if="failed" class="mt-6 text-sm text-red-400" role="alert">{{ t('social.loadError') }}</p>
      <ul v-else-if="loading" class="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <li v-for="n in 6" :key="n" class="flex items-center gap-3 rounded border border-flixer-border p-4"><Skeleton class="size-12 rounded-full" /><Skeleton class="h-4 w-32" /></li>
      </ul>
      <p v-else-if="!profiles.length" class="mt-8 text-sm text-flixer-muted">{{ t('social.noPeople') }}</p>
      <ul v-else class="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <li v-for="person in profiles" :key="person.username" class="rounded border border-white/10 bg-white/5 transition motion-reduce:transition-none hover:border-white/20 hover:bg-white/10">
          <RouterLink :to="{ name: 'profile', params: { username: person.username } }" class="flex items-center gap-4 p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent"
            ><UserAvatar :avatar-url="person.avatarUrl" :name="person.displayName" class="size-14 shrink-0 overflow-hidden rounded-full ring-2 ring-white/10" /><span class="min-w-0"
              ><span class="block truncate text-sm font-semibold text-white">{{ person.displayName }}</span
              ><span class="block truncate text-xs text-flixer-muted">@{{ person.username }}</span></span
            ></RouterLink
          >
        </li>
      </ul>
    </main>
    <MobileTabBar :tabs="mobileTabs" />
  </div>
</template>
