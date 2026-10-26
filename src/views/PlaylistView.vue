<script setup lang="ts">
import { openModal } from '@kolirt/vue-modal'
import axios from 'axios'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { deletePlaylist, getPlaylist, removePlaylistItem, reorderPlaylist, type PlaylistSummary, type PlaylistTrack } from '../api'
import ConfirmModal from '../components/ui/ConfirmModal.vue'
import AuthImage from '../components/ui/AuthImage.vue'
import Header from '../components/header/Header.vue'
import MobileTabBar from '../components/home/MobileTabBar.vue'
import UserAvatar from '../components/ui/UserAvatar.vue'
import PlaylistEditorModal from '../components/PlaylistEditorModal.vue'
import { getMobileTabs, getNavLinks } from '../composables/homeNav'
import { useAudioPlayer, type QueueTrack } from '../composables/useAudioPlayer'
import { useSignOut } from '../composables/useSignOut'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { isSigningOut, signOut } = useSignOut()
const navLinks = computed(getNavLinks)
const mobileTabs = computed(getMobileTabs)
const player = useAudioPlayer()
const playlist = ref<(PlaylistSummary & { isOwner: boolean; tracks: PlaylistTrack[] }) | null>(null)
const loading = ref(true)
const missing = ref(false)
const failed = ref(false)
const busy = ref<string | null>(null)
const tracks = computed(() => playlist.value?.tracks ?? [])
const owner = computed(() => playlist.value?.isOwner ?? false)

async function load() {
  loading.value = true
  missing.value = false
  failed.value = false
  try {
    playlist.value = await getPlaylist(String(route.params.id))
    document.title = `${playlist.value.name} · Flixer`
  } catch (error) {
    playlist.value = null
    missing.value = axios.isAxiosError(error) && error.response?.status === 404
    failed.value = !missing.value
  } finally {
    loading.value = false
  }
}
function asQueueTrack(track: PlaylistTrack): QueueTrack {
  return { id: track.id, title: track.title, artist: track.artist ?? track.subtitle, artistId: null, album: track.album, albumId: track.albumId, art: track.imageIndex === null ? null : { itemId: track.imageItemId, index: track.imageIndex, version: track.imageUpdatedAt } }
}
function playFrom(index = 0) {
  player.playQueue(tracks.value.map(asQueueTrack), index)
}
async function edit() {
  if (!playlist.value) return
  const result = await openModal<PlaylistSummary>(PlaylistEditorModal, { props: { playlist: playlist.value } }).catch(() => null)
  if (result) await load()
}
async function confirm(message: string, label: string) {
  return openModal<boolean>(ConfirmModal, { props: { message, confirmLabel: label, danger: true } }).catch(() => false)
}
async function removeTrack(track: PlaylistTrack) {
  if (!playlist.value || busy.value) return
  const ok = await confirm(t('social.removeTrackConfirm', { title: track.title }), t('social.removeTrack'))
  if (!ok) return
  busy.value = track.id
  try {
    await removePlaylistItem(playlist.value.id, track.id)
    playlist.value.tracks = playlist.value.tracks.filter((entry) => entry.id !== track.id)
    playlist.value.trackCount = playlist.value.tracks.length
    playlist.value.durationSeconds = playlist.value.tracks.reduce((total, entry) => total + (entry.durationSeconds ?? 0), 0)
  } catch {
    failed.value = true
  } finally {
    busy.value = null
  }
}
async function move(index: number, direction: -1 | 1) {
  if (!playlist.value || !owner.value || busy.value) return
  const target = index + direction
  if (target < 0 || target >= tracks.value.length) return
  const previous = [...playlist.value.tracks]
  const reordered = [...previous]
  ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
  playlist.value.tracks = reordered.map((track, position) => ({ ...track, position }))
  busy.value = 'order'
  try {
    await reorderPlaylist(
      playlist.value.id,
      playlist.value.tracks.map((track) => track.id),
    )
  } catch {
    playlist.value.tracks = previous
    failed.value = true
  } finally {
    busy.value = null
  }
}
async function removePlaylist() {
  if (!playlist.value || !(await confirm(t('social.deletePlaylistConfirm', { name: playlist.value.name }), t('social.deletePlaylist')))) return
  try {
    await deletePlaylist(playlist.value.id)
    await router.push({ name: 'home' })
  } catch {
    failed.value = true
  }
}
watch(
  () => route.params.id,
  () => void load(),
  { immediate: true },
)
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-flixer-background pb-24 font-sans text-flixer-text md:pb-12">
    <Header :links="navLinks" :is-signing-out="isSigningOut" @logout="signOut" />
    <main class="page-gutter pt-28 sm:pt-32">
      <p v-if="loading" class="text-sm text-flixer-muted" role="status">{{ t('common.loading') }}</p>
      <section v-else-if="missing" class="mx-auto max-w-2xl rounded-xl border border-flixer-border bg-flixer-surface p-6 text-center">
        <h1 class="text-xl font-semibold text-white">{{ t('social.playlistNotFound') }}</h1>
        <RouterLink to="/" class="mt-4 inline-block text-sm text-flixer-accent hover:underline">{{ t('mediaItem.backHome') }}</RouterLink>
      </section>
      <section v-else-if="failed && !playlist" class="mx-auto max-w-2xl rounded-xl border border-flixer-border bg-flixer-surface p-6 text-center">
        <p class="text-sm text-red-400" role="alert">{{ t('social.loadError') }}</p>
        <button type="button" class="mt-4 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15" @click="load">{{ t('home.retry') }}</button>
      </section>
      <section v-else-if="playlist" class="space-y-8">
        <div class="relative flex flex-col gap-6 overflow-hidden bg-gradient-to-b from-flixer-accent/25 to-transparent p-6 sm:flex-row sm:items-end sm:p-10">
          <div class="aspect-square w-40 shrink-0 overflow-hidden rounded-md bg-flixer-surface shadow-2xl ring-1 ring-white/10 sm:w-52">
            <AuthImage v-if="playlist.cover" scope="library" :item-id="playlist.cover.itemId" :index="playlist.cover.index" :version="playlist.cover.updatedAt" :width="320" :alt="playlist.name" />
            <span v-else class="grid size-full place-items-center p-5 text-center text-flixer-muted">{{ t('social.noCover') }}</span>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold uppercase tracking-wide text-flixer-muted">{{ t('social.playlist') }}</p>
            <h1 class="mt-1 break-words text-3xl font-bold tracking-tight text-white sm:text-5xl">{{ playlist.name }}</h1>
            <p v-if="playlist.description" class="mt-3 max-w-2xl whitespace-pre-line text-sm text-flixer-text/90">{{ playlist.description }}</p>
            <div class="mt-4 flex flex-wrap items-center gap-3 text-sm text-flixer-muted">
              <UserAvatar :avatar-url="playlist.owner.avatarUrl" :name="playlist.owner.displayName" class="size-7 overflow-hidden rounded-full" />
              <RouterLink :to="{ name: 'profile', params: { username: playlist.owner.username } }" class="font-medium text-white hover:underline">{{ playlist.owner.displayName }}</RouterLink>
              <span class="rounded-full border border-white/15 px-2 py-0.5 text-xs">{{ playlist.isPublic ? t('social.public') : t('social.private') }}</span>
              <span>{{ t('social.trackCount', { count: playlist.trackCount }) }}</span>
            </div>
            <div class="mt-5 flex flex-wrap gap-2">
              <button type="button" class="rounded bg-white px-6 py-2.5 text-sm font-bold text-flixer-background transition hover:bg-white/85 disabled:opacity-50" :disabled="!tracks.length" @click="playFrom()">{{ t('social.playAll') }}</button>
              <button v-if="owner" type="button" class="rounded bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20" @click="edit">{{ t('social.editPlaylist') }}</button>
              <button v-if="owner" type="button" class="rounded bg-red-500/15 px-5 py-2.5 text-sm font-semibold text-red-200 hover:bg-red-500/25" @click="removePlaylist">{{ t('social.deletePlaylist') }}</button>
            </div>
          </div>
        </div>
        <p v-if="failed" class="text-sm text-red-400" role="alert">{{ t('social.saveError') }}</p>
        <section :aria-label="t('social.tracks')">
          <h2 class="mb-4 text-xl font-bold tracking-tight text-white">{{ t('social.tracks') }}</h2>
          <p v-if="!tracks.length" class="rounded-lg border border-flixer-border p-5 text-sm text-flixer-muted">{{ t('social.emptyPlaylist') }}</p>
          <ol v-else class="divide-y divide-white/5 overflow-hidden rounded-md border border-white/10 bg-white/5">
            <li v-for="(track, index) in tracks" :key="track.id" class="group flex items-center gap-2 px-3 py-2 transition motion-reduce:transition-none hover:bg-white/10 sm:gap-3">
              <span class="w-6 shrink-0 text-center text-xs tabular-nums text-flixer-muted">{{ index + 1 }}</span>
              <button type="button" class="grid size-9 shrink-0 place-items-center rounded bg-white/10 text-white transition group-hover:bg-white group-hover:text-flixer-background" :aria-label="t('social.playTrackFrom', { title: track.title })" @click="playFrom(index)">
                <svg class="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
              </button>
              <RouterLink :to="{ name: 'media-item', params: { id: track.id } }" class="min-w-0 flex-1 py-1"
                ><p class="truncate text-sm font-semibold text-white">{{ track.title }}</p>
                <p class="truncate text-xs text-flixer-muted">{{ [track.artist, track.album].filter(Boolean).join(' · ') }}</p></RouterLink
              >
              <button v-if="owner" type="button" class="grid size-8 shrink-0 place-items-center rounded text-flixer-muted hover:bg-white/10 hover:text-white disabled:opacity-40" :disabled="index === 0 || busy === 'order'" :aria-label="t('social.moveUp')" @click="move(index, -1)">↑</button>
              <button v-if="owner" type="button" class="grid size-8 shrink-0 place-items-center rounded text-flixer-muted hover:bg-white/10 hover:text-white disabled:opacity-40" :disabled="index === tracks.length - 1 || busy === 'order'" :aria-label="t('social.moveDown')" @click="move(index, 1)">↓</button>
              <button v-if="owner" type="button" class="grid size-8 shrink-0 place-items-center rounded text-flixer-muted hover:bg-red-500/15 hover:text-red-200" :disabled="busy === track.id" :aria-label="t('social.removeTrack')" @click="removeTrack(track)">×</button>
            </li>
          </ol>
        </section>
      </section>
    </main>
    <MobileTabBar :tabs="mobileTabs" />
  </div>
</template>
