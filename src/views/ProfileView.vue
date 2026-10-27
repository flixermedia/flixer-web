<script setup lang="ts">
import { openModal } from '@kolirt/vue-modal'
import axios from 'axios'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { acceptFriend, getSocialProfile, removeFriend, requestFriend, startDirectChat, type PlaylistSummary, type Profile, type SocialItem } from '../api'
import Header from '../components/header/Header.vue'
import MediaCard from '../components/home/MediaCard.vue'
import MobileTabBar from '../components/home/MobileTabBar.vue'
import AuthImage from '../components/ui/AuthImage.vue'
import PlaylistEditorModal from '../components/PlaylistEditorModal.vue'
import FriendInviteModal from '../components/social/FriendInviteModal.vue'
import UserAvatar from '../components/ui/UserAvatar.vue'
import { getMobileTabs, getNavLinks } from '../composables/homeNav'
import { notify } from '../composables/notify'
import { useAudioPlayer, type QueueTrack } from '../composables/useAudioPlayer'
import { useParty } from '../composables/useParty'
import { useSignOut } from '../composables/useSignOut'

const { t } = useI18n()
const openingChat = ref(false)
const friendBusy = ref(false)
const route = useRoute()
const router = useRouter()
const { isSigningOut, signOut } = useSignOut()
const navLinks = computed(getNavLinks)
const mobileTabs = computed(getMobileTabs)
const profile = ref<Profile | null>(null)
const loading = ref(true)
const failed = ref(false)
const notFound = ref(false)
const filter = ref('all')
const player = useAudioPlayer()
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
const stats = computed(() => [
  { label: t('social.recentlyWatched'), value: profile.value?.recentlyWatched.length ?? 0 },
  { label: t('social.recentlyListened'), value: profile.value?.recentlyListened.length ?? 0 },
  { label: t('social.favorites'), value: profile.value?.favorites.length ?? 0 },
  { label: t('social.playlists'), value: profile.value?.playlists.length ?? 0 },
])
const visibleGroups = computed(() => (filter.value === 'all' ? favoriteGroups.value : favoriteGroups.value.filter((group) => group.type === filter.value)))

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
async function shareProfile() {
  await openModal<void>(FriendInviteModal, { props: { username: username.value } }).catch(() => undefined)
}
function asQueueTrack(item: SocialItem): QueueTrack {
  return { id: item.id, title: item.title, artist: item.subtitle, artistId: null, album: null, albumId: null, art: item.imageIndex === null ? null : { itemId: item.imageItemId, index: item.imageIndex, version: item.imageUpdatedAt } }
}
const party = useParty()
const joiningParty = ref(false)
async function messageUser() {
  if (!profile.value || openingChat.value) return
  openingChat.value = true
  try {
    const conversation = await startDirectChat(profile.value.username)
    await router.push({ name: 'chat', params: { id: conversation.id } })
  } catch {
    notify.error(t('chat.messageFailed'))
  } finally {
    openingChat.value = false
  }
}
async function changeFriendship() {
  const person = profile.value
  if (!person || person.isSelf || friendBusy.value) return
  friendBusy.value = true
  try {
    if (person.friendship === 'incoming') await acceptFriend(person.username)
    else if (person.friendship === 'none') await requestFriend(person.username)
    else await removeFriend(person.username)
    await load()
  } catch {
    notify.error(t('social.friendActionFailed'))
  } finally {
    friendBusy.value = false
  }
}
async function joinParty(id: string) {
  joiningParty.value = true
  try {
    await party.join(id)
  } catch (cause) {
    notify.error(cause instanceof Error ? cause.message : t('party.joinFailed'))
    await load()
  } finally {
    joiningParty.value = false
  }
}
function playListened(index: number) {
  if (!profile.value) return
  player.playQueue(profile.value.recentlyListened.map(asQueueTrack), index)
}
async function createPlaylist() {
  const result = await openModal<PlaylistSummary>(PlaylistEditorModal).catch(() => null)
  if (result) {
    await router.push({ name: 'playlist', params: { id: result.id } })
    await load()
  }
}
function cardSubtitle(item: SocialItem) {
  const parts = [item.subtitle, item.year].filter(Boolean).map(String)
  return [...new Set(parts)].join(' · ')
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
      <section v-else-if="notFound" class="mx-auto max-w-2xl rounded border border-flixer-border bg-flixer-surface p-8 text-center">
        <h1 class="text-xl font-semibold text-white">{{ t('social.profilePrivate') }}</h1>
        <p class="mt-2 text-sm text-flixer-muted">{{ t('social.profilePrivateDescription') }}</p>
        <RouterLink to="/people" class="mt-4 inline-block text-sm text-flixer-accent hover:underline">{{ t('social.people') }}</RouterLink>
      </section>
      <section v-else-if="failed && !profile" class="text-sm text-red-400" role="alert">{{ t('social.loadError') }}</section>
      <template v-else-if="profile">
        <header class="rounded border border-white/10 bg-flixer-surface/60">
          <div class="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
            <div class="size-24 shrink-0 overflow-hidden rounded shadow-lg shadow-black/40 sm:size-32"><UserAvatar :avatar-url="profile.avatarUrl" :name="profile.displayName" class="text-3xl" /></div>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="break-words text-2xl font-bold tracking-tight text-white sm:text-4xl">{{ profile.displayName }}</h1>
                <span v-if="profile.hidden" class="rounded bg-amber-300/10 px-2 py-0.5 text-xs font-semibold text-amber-100">{{ t('social.hidden') }}</span>
              </div>
              <p class="mt-1 text-sm text-flixer-muted">{{ profile.username }} · {{ t('social.joined', { date: new Date(profile.joinedAt).toLocaleDateString() }) }}</p>
              <div class="mt-4 flex flex-wrap gap-2">
                <button v-if="profile.isSelf" type="button" class="rounded bg-white px-4 py-2 text-sm font-bold text-flixer-background transition hover:bg-white/85" @click="createPlaylist">{{ t('social.createPlaylist') }}</button>
                <RouterLink v-if="profile.isSelf" :to="{ name: 'settings' }" class="rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20">{{ t('social.editProfile') }}</RouterLink>
                <button v-if="!profile.isSelf" type="button" class="rounded bg-white px-4 py-2 text-sm font-bold text-flixer-background transition hover:bg-white/85 disabled:opacity-60" :disabled="openingChat" @click="messageUser">{{ t('chat.message') }}</button>
                <button v-if="!profile.isSelf" type="button" class="rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-60" :disabled="friendBusy" @click="changeFriendship">{{ t(`social.friendActions.${profile.friendship}`) }}</button>
                <button type="button" class="rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20" @click="shareProfile">{{ t('social.shareProfile') }}</button>
              </div>
            </div>
            <div v-if="profile.party || profile.nowPlaying" class="flex w-full min-w-0 flex-col gap-2 sm:ml-auto sm:w-72 sm:shrink-0 sm:self-start">
              <div v-if="profile.party" class="flex w-full min-w-0 items-center gap-3 rounded border border-emerald-400/30 bg-emerald-400/10 p-3">
                <div class="min-w-0 flex-1">
                  <p class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-300"><span class="size-2 shrink-0 animate-pulse rounded-full bg-emerald-400 motion-reduce:animate-none" aria-hidden="true" />{{ t(profile.party.kind === 'music' ? 'party.listeningTogether' : 'party.watchingTogether') }}</p>
                  <p class="mt-1 truncate text-sm font-semibold text-white">{{ profile.party.title }}</p>
                  <p class="text-xs text-flixer-muted">{{ t('party.inThisParty', { count: profile.party.memberCount }) }}</p>
                </div>
                <button v-if="!profile.isSelf && party.party.value?.id !== profile.party.id" type="button" class="shrink-0 rounded bg-white px-3 py-2 text-xs font-bold text-flixer-background transition hover:bg-white/85 disabled:opacity-60" :disabled="joiningParty" @click="joinParty(profile.party.id)">{{ t('party.join') }}</button>
              </div>
              <RouterLink v-if="profile.nowPlaying" :to="{ name: 'media-item', params: { id: profile.nowPlaying.item.id } }" class="flex w-full min-w-0 items-center gap-3 rounded bg-white/5 p-3 transition hover:bg-white/10" aria-live="polite">
                <div class="relative size-14 shrink-0 overflow-hidden rounded bg-flixer-surface">
                  <AuthImage v-if="profile.nowPlaying.item.imageIndex !== null" scope="library" :item-id="profile.nowPlaying.item.imageItemId" :index="profile.nowPlaying.item.imageIndex" :version="profile.nowPlaying.item.imageUpdatedAt" :width="120" :alt="profile.nowPlaying.item.title" />
                </div>
                <div class="min-w-0">
                  <p class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-300"><span class="size-2 shrink-0 animate-pulse rounded-full bg-emerald-400 motion-reduce:animate-none" aria-hidden="true" />{{ profile.nowPlaying.kind === 'watching' ? t('social.nowWatching') : t('social.nowListening') }}</p>
                  <p class="mt-1 truncate text-sm font-semibold text-white">{{ profile.nowPlaying.item.title }}</p>
                  <p v-if="profile.nowPlaying.item.subtitle" class="truncate text-xs text-flixer-muted">{{ profile.nowPlaying.item.subtitle }}</p>
                </div>
              </RouterLink>
            </div>
          </div>
          <dl class="grid grid-cols-2 divide-white/10 border-t border-white/10 sm:grid-cols-4 sm:divide-x">
            <div v-for="stat in stats" :key="stat.label" class="px-5 py-3">
              <dd class="text-xl font-bold tabular-nums text-white">{{ stat.value }}</dd>
              <dt class="text-xs uppercase tracking-wide text-flixer-muted">{{ stat.label }}</dt>
            </div>
          </dl>
        </header>
        <p v-if="failed" class="mt-4 text-sm text-red-400" role="alert">{{ t('social.loadError') }}</p>
        <section v-if="profile.recentlyWatched.length" class="mt-10">
          <h2 class="mb-4 text-xl font-bold tracking-tight text-white">{{ sectionTitle('recentlyWatched') }}</h2>
          <ul class="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-4 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]">
            <MediaCard v-for="item in profile.recentlyWatched" :key="item.id" class="!w-auto" :title="item.title" :subtitle="cardSubtitle(item)" :item-id="item.imageItemId" :image-index="item.imageIndex" :version="item.imageUpdatedAt" :to="{ name: 'media-item', params: { id: item.id } }" />
          </ul>
        </section>
        <section v-if="profile.recentlyListened.length" class="mt-10">
          <h2 class="mb-2 text-xl font-bold tracking-tight text-white">{{ sectionTitle('recentlyListened') }}</h2>
          <ol>
            <li v-for="(item, index) in profile.recentlyListened" :key="item.id" class="group flex items-center gap-3 rounded px-2 py-2 transition motion-reduce:transition-none hover:bg-white/10">
              <span class="w-5 shrink-0 text-center text-sm tabular-nums text-flixer-muted">{{ index + 1 }}</span>
              <button type="button" class="relative size-11 shrink-0 overflow-hidden rounded bg-flixer-surface" :aria-label="t('social.playTrackFrom', { title: item.title })" @click="playListened(index)">
                <AuthImage v-if="item.imageIndex !== null" scope="library" :item-id="item.imageItemId" :index="item.imageIndex" :version="item.imageUpdatedAt" :width="96" :alt="item.title" />
                <span class="absolute inset-0 grid place-items-center bg-black/55 text-white opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
                  ><svg class="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg
                ></span>
              </button>
              <RouterLink :to="{ name: 'media-item', params: { id: item.id } }" class="min-w-0 flex-1"
                ><p class="truncate text-sm font-semibold text-white">{{ item.title }}</p>
                <p class="truncate text-xs text-flixer-muted">{{ item.subtitle }}</p></RouterLink
              >
              <time v-if="item.at" class="hidden shrink-0 text-xs text-flixer-muted sm:block" :datetime="item.at">{{ new Date(item.at).toLocaleDateString() }}</time>
            </li>
          </ol>
        </section>
        <section v-if="favoriteGroups.length" class="mt-10">
          <h2 class="mb-3 text-xl font-bold tracking-tight text-white">{{ sectionTitle('favorites') }}</h2>
          <div class="mb-5 flex flex-wrap gap-2" role="group" :aria-label="sectionTitle('favorites')">
            <button v-for="chip in [{ type: 'all', label: t('social.all') }, ...favoriteGroups.map((group) => ({ type: group.type, label: sectionTitle(group.label) }))]" :key="chip.type" type="button" class="rounded-full px-3.5 py-1.5 text-xs font-semibold transition" :class="filter === chip.type ? 'bg-white text-flixer-background' : 'bg-white/10 text-white hover:bg-white/20'" :aria-pressed="filter === chip.type" @click="filter = chip.type">{{ chip.label }}</button>
          </div>
          <div v-for="group in visibleGroups" :key="group.type" class="mb-6">
            <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-flixer-muted">{{ sectionTitle(group.label) }}</h3>
            <ul class="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-4 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]">
              <MediaCard v-for="item in group.items" :key="item.id" class="!w-auto" :variant="group.type === 'album' || group.type === 'track' ? 'square' : 'poster'" :title="item.title" :subtitle="cardSubtitle(item)" :item-id="item.imageItemId" :image-index="item.imageIndex" :version="item.imageUpdatedAt" :to="{ name: 'media-item', params: { id: item.id } }" />
            </ul>
          </div>
        </section>
        <section v-if="profile.playlists.length" class="mt-10">
          <h2 class="mb-4 text-xl font-bold tracking-tight text-white">{{ sectionTitle('playlists') }}</h2>
          <ul class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <li v-for="playlist in profile.playlists" :key="playlist.id" class="rounded bg-white/5 transition hover:bg-white/10">
              <RouterLink :to="{ name: 'playlist', params: { id: playlist.id } }" class="flex items-center gap-4 p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent"
                ><div class="size-16 shrink-0 overflow-hidden rounded bg-flixer-background shadow-lg"><AuthImage v-if="playlist.cover" scope="library" :item-id="playlist.cover.itemId" :index="playlist.cover.index" :version="playlist.cover.updatedAt" :width="160" :alt="playlist.name" /><span v-else class="grid size-full place-items-center text-xs text-flixer-muted">♫</span></div>
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
