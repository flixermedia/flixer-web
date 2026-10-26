<script setup lang="ts">
import { openModal } from '@kolirt/vue-modal'
import axios from 'axios'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { getSocialProfile, updateMySocialProfile, type PlaylistSummary, type Profile, type SocialItem } from '../api'
import Header from '../components/header/Header.vue'
import MediaCard from '../components/home/MediaCard.vue'
import MobileTabBar from '../components/home/MobileTabBar.vue'
import AuthImage from '../components/ui/AuthImage.vue'
import PlaylistEditorModal from '../components/PlaylistEditorModal.vue'
import UserAvatar from '../components/ui/UserAvatar.vue'
import { getMobileTabs, getNavLinks } from '../composables/homeNav'
import { useSignOut } from '../composables/useSignOut'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { isSigningOut, signOut } = useSignOut()
const navLinks = computed(getNavLinks)
const mobileTabs = computed(getMobileTabs)
const profile = ref<Profile | null>(null)
const loading = ref(true)
const failed = ref(false)
const notFound = ref(false)
const savingHidden = ref(false)
let pollTimer: ReturnType<typeof setInterval> | undefined
let generation = 0
const username = computed(() => String(route.params.username ?? ''))
const favoriteGroups = computed(() =>
  [
    { type: 'movie', label: 'movies' },
    { type: 'series', label: 'tv' },
    { type: 'album', label: 'albums' },
    { type: 'track', label: 'songs' },
    { type: 'video', label: 'videos' },
  ]
    .map((group) => ({ ...group, items: profile.value?.favorites.filter((item) => item.type === group.type) ?? [] }))
    .filter((group) => group.items.length > 0),
)

async function load() {
  const current = ++generation
  failed.value = false
  notFound.value = false
  if (!profile.value) loading.value = true
  try {
    const result = await getSocialProfile(username.value)
    if (current !== generation) return
    profile.value = result
    document.title = `${result.displayName} · Flixer`
  } catch (error) {
    if (current !== generation) return
    notFound.value = axios.isAxiosError(error) && error.response?.status === 404
    if (notFound.value) profile.value = null
    failed.value = !notFound.value
  } finally {
    if (current === generation) loading.value = false
  }
}
async function setHidden(event: Event) {
  const hidden = (event.target as HTMLInputElement).checked
  if (!profile.value) return
  savingHidden.value = true
  const previous = profile.value.hidden
  profile.value.hidden = hidden
  try {
    const result = await updateMySocialProfile({ hidden })
    profile.value.hidden = result.hidden
  } catch {
    profile.value.hidden = previous
    failed.value = true
  } finally {
    savingHidden.value = false
  }
}
async function createPlaylist() {
  const result = await openModal<PlaylistSummary>(PlaylistEditorModal).catch(() => null)
  if (result) {
    await router.push({ name: 'playlist', params: { id: result.id } })
    await load()
  }
}
function cardSubtitle(item: SocialItem) {
  return [item.subtitle, item.year].filter(Boolean).join(' · ')
}
function sectionTitle(key: string) {
  return t(`social.${key}`)
}
watch(
  username,
  () => {
    profile.value = null
    void load()
  },
  { immediate: true },
)
onMounted(() => {
  pollTimer = setInterval(() => void load(), 30_000)
})
onBeforeUnmount(() => {
  generation++
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-flixer-background pb-24 font-sans text-flixer-text md:pb-12">
    <Header :links="navLinks" :is-signing-out="isSigningOut" @logout="signOut" />
    <main class="page-gutter pt-28 sm:pt-32">
      <p v-if="loading && !profile" class="text-sm text-flixer-muted" role="status">{{ t('common.loading') }}</p>
      <section v-else-if="notFound" class="mx-auto max-w-2xl rounded-xl border border-flixer-border bg-flixer-surface p-8 text-center">
        <h1 class="text-xl font-semibold text-white">{{ t('social.profilePrivate') }}</h1>
        <p class="mt-2 text-sm text-flixer-muted">{{ t('social.profilePrivateDescription') }}</p>
        <RouterLink to="/people" class="mt-4 inline-block text-sm text-flixer-accent hover:underline">{{ t('social.people') }}</RouterLink>
      </section>
      <section v-else-if="failed && !profile" class="text-sm text-red-400" role="alert">{{ t('social.loadError') }}</section>
      <template v-else-if="profile">
        <header class="flex flex-col gap-5 border-b border-flixer-border pb-7 sm:flex-row sm:items-end">
          <UserAvatar :avatar-url="profile.avatarUrl" :name="profile.displayName" class="size-28 shrink-0 overflow-hidden rounded-2xl sm:size-36" />
          <div class="min-w-0 flex-1">
            <h1 class="break-words text-3xl font-bold text-white sm:text-5xl">{{ profile.displayName }}</h1>
            <p class="mt-1 text-sm text-flixer-muted">@{{ profile.username }} · {{ t('social.joined', { date: new Date(profile.joinedAt).toLocaleDateString() }) }}</p>
            <div v-if="profile.isSelf" class="mt-4 flex flex-wrap items-center gap-4">
              <label class="flex items-center gap-2 text-sm text-white"><input type="checkbox" class="size-4 accent-flixer-accent" :checked="profile.hidden" :disabled="savingHidden" @change="setHidden" />{{ t('social.hideProfile') }}</label
              ><span class="text-xs text-flixer-muted">{{ t('social.hideProfileHint') }}</span
              ><span v-if="profile.hidden" class="rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-xs font-semibold text-amber-100">{{ t('social.hidden') }}</span
              ><button type="button" class="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15" @click="createPlaylist">{{ t('social.createPlaylist') }}</button>
            </div>
          </div>
        </header>
        <p v-if="failed" class="mt-4 text-sm text-red-400" role="alert">{{ t('social.loadError') }}</p>
        <section v-if="profile.nowPlaying" class="mt-7 rounded-xl border border-flixer-border bg-flixer-surface/60 p-4 sm:p-5" aria-live="polite">
          <h2 class="text-xs font-semibold uppercase tracking-wide text-flixer-muted">{{ profile.nowPlaying.kind === 'watching' ? t('social.nowWatching') : t('social.nowListening') }}</h2>
          <div class="mt-3 flex items-center gap-4">
            <MediaCard class="!w-16 sm:!w-20" variant="square" :title="profile.nowPlaying.item.title" :item-id="profile.nowPlaying.item.imageItemId" :image-index="profile.nowPlaying.item.imageIndex" :version="profile.nowPlaying.item.imageUpdatedAt" :to="{ name: 'media-item', params: { id: profile.nowPlaying.item.id } }" />
            <div class="min-w-0">
              <RouterLink :to="{ name: 'media-item', params: { id: profile.nowPlaying.item.id } }" class="text-base font-semibold text-white hover:underline">{{ profile.nowPlaying.item.title }}</RouterLink>
              <p v-if="profile.nowPlaying.item.subtitle" class="mt-1 text-sm text-flixer-muted">{{ profile.nowPlaying.item.subtitle }}</p>
            </div>
          </div>
        </section>
        <section v-if="profile.recentlyWatched.length" class="mt-8">
          <h2 class="mb-3 text-xl font-semibold text-white">{{ sectionTitle('recentlyWatched') }}</h2>
          <ul class="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-4 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]">
            <MediaCard v-for="item in profile.recentlyWatched" :key="item.id" class="!w-auto" :title="item.title" :subtitle="cardSubtitle(item)" :item-id="item.imageItemId" :image-index="item.imageIndex" :version="item.imageUpdatedAt" :to="{ name: 'media-item', params: { id: item.id } }" />
          </ul>
        </section>
        <section v-if="profile.recentlyListened.length" class="mt-8">
          <h2 class="mb-3 text-xl font-semibold text-white">{{ sectionTitle('recentlyListened') }}</h2>
          <ul class="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-4 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]">
            <MediaCard v-for="item in profile.recentlyListened" :key="item.id" class="!w-auto" variant="square" :title="item.title" :subtitle="cardSubtitle(item)" :item-id="item.imageItemId" :image-index="item.imageIndex" :version="item.imageUpdatedAt" :to="{ name: 'media-item', params: { id: item.id } }" />
          </ul>
        </section>
        <section v-if="favoriteGroups.length" class="mt-8">
          <h2 class="mb-5 text-xl font-semibold text-white">{{ sectionTitle('favorites') }}</h2>
          <div v-for="group in favoriteGroups" :key="group.type" class="mb-6">
            <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-flixer-muted">{{ sectionTitle(group.label) }}</h3>
            <ul class="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-4 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]">
              <MediaCard v-for="item in group.items" :key="item.id" class="!w-auto" :variant="group.type === 'album' || group.type === 'track' ? 'square' : 'poster'" :title="item.title" :subtitle="cardSubtitle(item)" :item-id="item.imageItemId" :image-index="item.imageIndex" :version="item.imageUpdatedAt" :to="{ name: 'media-item', params: { id: item.id } }" />
            </ul>
          </div>
        </section>
        <section v-if="profile.playlists.length" class="mt-8">
          <h2 class="mb-3 text-xl font-semibold text-white">{{ sectionTitle('playlists') }}</h2>
          <ul class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <li v-for="playlist in profile.playlists" :key="playlist.id" class="rounded-xl border border-flixer-border bg-flixer-surface/40 transition hover:bg-white/5">
              <RouterLink :to="{ name: 'playlist', params: { id: playlist.id } }" class="flex items-center gap-4 p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent"
                ><div class="size-16 shrink-0 overflow-hidden rounded-lg bg-flixer-background"><AuthImage v-if="playlist.cover" scope="library" :item-id="playlist.cover.itemId" :index="playlist.cover.index" :version="playlist.cover.updatedAt" :width="160" :alt="playlist.name" /><span v-else class="grid size-full place-items-center text-xs text-flixer-muted">♫</span></div>
                <span class="min-w-0"
                  ><span class="block truncate text-sm font-semibold text-white">{{ playlist.name }}</span
                  ><span class="block text-xs text-flixer-muted">{{ t('social.trackCount', { count: playlist.trackCount }) }} · {{ playlist.isPublic ? t('social.public') : t('social.private') }}</span></span
                ></RouterLink
              >
            </li>
          </ul>
        </section>
        <p v-if="!profile.recentlyWatched.length && !profile.recentlyListened.length && !profile.favorites.length && !profile.playlists.length" class="mt-8 text-sm text-flixer-muted">{{ t('social.nothingToShow') }}</p>
      </template>
    </main>
    <MobileTabBar :tabs="mobileTabs" />
  </div>
</template>
