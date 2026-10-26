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
import ClampedText from '../components/ui/ClampedText.vue'
import UserAvatar from '../components/ui/UserAvatar.vue'
import MusicBanner from '../components/ui/MusicBanner.vue'
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
const totalSeconds = computed(() => tracks.value.reduce((sum, track) => sum + (track.durationSeconds ?? 0), 0))
const stats = computed(() => [
  { label: t('social.tracks'), value: tracks.value.length },
  { label: t('social.duration'), value: formatTotal(totalSeconds.value) },
  { label: t('social.artists'), value: new Set(tracks.value.map((track) => track.artist ?? track.subtitle).filter(Boolean)).size },
  { label: t('social.albums'), value: new Set(tracks.value.map((track) => track.album).filter(Boolean)).size },
])
function formatDuration(seconds: number | null | undefined) {
  if (!seconds) return ''
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}
function formatTotal(seconds: number) {
  const minutes = Math.round(seconds / 60)
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`
}
function shuffle() {
  const queue = tracks.value.map(asQueueTrack)
  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[queue[i], queue[j]] = [queue[j], queue[i]]
  }
  player.playQueue(queue, 0)
}
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
      <section v-else-if="missing" class="mx-auto max-w-2xl rounded border border-flixer-border bg-flixer-surface p-6 text-center">
        <h1 class="text-xl font-semibold text-white">{{ t('social.playlistNotFound') }}</h1>
        <RouterLink to="/" class="mt-4 inline-block text-sm text-flixer-accent hover:underline">{{ t('mediaItem.backHome') }}</RouterLink>
      </section>
      <section v-else-if="failed && !playlist" class="mx-auto max-w-2xl rounded border border-flixer-border bg-flixer-surface p-6 text-center">
        <p class="text-sm text-red-400" role="alert">{{ t('social.loadError') }}</p>
        <button type="button" class="mt-4 rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15" @click="load">{{ t('home.retry') }}</button>
      </section>
      <section v-else-if="playlist" class="space-y-6">
        <header class="relative overflow-hidden rounded border border-white/10 bg-flixer-surface/60">
          <MusicBanner :seed="playlist.id" />
          <div class="absolute inset-0 bg-gradient-to-t from-flixer-background/80 via-flixer-background/30 to-transparent" aria-hidden="true"></div>
          <div class="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
            <div class="size-32 shrink-0 overflow-hidden rounded bg-flixer-background shadow-lg shadow-black/40 sm:size-40">
              <AuthImage v-if="playlist.cover" scope="library" :item-id="playlist.cover.itemId" :index="playlist.cover.index" :version="playlist.cover.updatedAt" :width="320" :alt="playlist.name" />
              <span v-else class="grid size-full place-items-center text-3xl text-flixer-muted" aria-hidden="true">♫</span>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="break-words text-2xl font-bold tracking-tight text-white sm:text-4xl">{{ playlist.name }}</h1>
                <span class="rounded bg-white/10 px-2 py-0.5 text-xs font-semibold text-white/80">{{ playlist.isPublic ? t('social.public') : t('social.private') }}</span>
              </div>
              <RouterLink :to="{ name: 'profile', params: { username: playlist.owner.username } }" class="mt-2 inline-flex items-center gap-2 text-sm text-flixer-muted hover:text-white">
                <span class="block size-6 shrink-0 overflow-hidden rounded"><UserAvatar :avatar-url="playlist.owner.avatarUrl" :name="playlist.owner.displayName" class="text-xs" /></span>
                <span class="font-medium text-white">{{ playlist.owner.displayName }}</span>
              </RouterLink>
              <ClampedText v-if="playlist.description" :text="playlist.description" :title="playlist.name" class="mt-3 max-w-2xl text-sm text-flixer-text/90" />
              <div class="mt-4 flex flex-wrap gap-2">
                <button type="button" class="rounded bg-white px-4 py-2 text-sm font-bold text-flixer-background transition hover:bg-white/85 disabled:opacity-50" :disabled="!tracks.length" @click="playFrom()">{{ t('social.playAll') }}</button>
                <button type="button" class="rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-50" :disabled="tracks.length < 2" @click="shuffle">{{ t('social.shuffle') }}</button>
                <button v-if="owner" type="button" class="rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20" @click="edit">{{ t('social.editPlaylist') }}</button>
                <button v-if="owner" type="button" class="rounded bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/25" @click="removePlaylist">{{ t('social.deletePlaylist') }}</button>
              </div>
            </div>
          </div>
          <dl class="relative grid grid-cols-2 divide-white/10 border-t border-white/10 bg-black/25 backdrop-blur-sm sm:grid-cols-4 sm:divide-x">
            <div v-for="stat in stats" :key="stat.label" class="px-5 py-3">
              <dd class="text-xl font-bold tabular-nums text-white">{{ stat.value }}</dd>
              <dt class="text-xs uppercase tracking-wide text-flixer-muted">{{ stat.label }}</dt>
            </div>
          </dl>
        </header>
        <p v-if="failed" class="text-sm text-red-400" role="alert">{{ t('social.saveError') }}</p>
        <section :aria-label="t('social.tracks')">
          <p v-if="!tracks.length" class="rounded border border-white/10 bg-white/5 p-6 text-center text-sm text-flixer-muted">{{ t('social.emptyPlaylist') }}</p>
          <div v-else class="overflow-hidden rounded border border-white/10">
            <div class="grid grid-cols-[2rem_minmax(0,1fr)_3rem] gap-3 border-b border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-flixer-muted md:grid-cols-[2rem_minmax(0,2fr)_minmax(0,1.5fr)_3rem_auto]">
              <span class="text-center">#</span><span>{{ t('social.title') }}</span
              ><span class="hidden md:block">{{ t('social.album') }}</span
              ><span class="text-right">{{ t('social.duration') }}</span
              ><span v-if="owner" class="hidden w-24 md:block" />
            </div>
            <ol class="divide-y divide-white/5">
              <li v-for="(track, index) in tracks" :key="track.id" class="group grid grid-cols-[2rem_minmax(0,1fr)_3rem] items-center gap-3 px-3 py-2 transition motion-reduce:transition-none hover:bg-white/10 md:grid-cols-[2rem_minmax(0,2fr)_minmax(0,1.5fr)_3rem_auto]">
                <button type="button" class="grid size-8 place-items-center rounded text-xs tabular-nums text-flixer-muted hover:text-white" :aria-label="t('social.playTrackFrom', { title: track.title })" @click="playFrom(index)">
                  <span class="group-hover:hidden">{{ index + 1 }}</span>
                  <svg class="hidden size-4 text-white group-hover:block" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                </button>
                <RouterLink :to="{ name: 'media-item', params: { id: track.id } }" class="flex min-w-0 items-center gap-3">
                  <span class="block size-10 shrink-0 overflow-hidden rounded bg-flixer-surface"><AuthImage v-if="track.imageIndex !== null" scope="library" :item-id="track.imageItemId" :index="track.imageIndex" :version="track.imageUpdatedAt" :width="80" :alt="track.title" /></span>
                  <span class="min-w-0"
                    ><span class="block truncate text-sm font-semibold text-white">{{ track.title }}</span> <span class="block truncate text-xs text-flixer-muted">{{ track.artist ?? track.subtitle }}</span></span
                  >
                </RouterLink>
                <span class="hidden truncate text-sm text-flixer-muted md:block">{{ track.album }}</span>
                <span class="text-right text-xs tabular-nums text-flixer-muted">{{ formatDuration(track.durationSeconds) }}</span>
                <span v-if="owner" class="flex w-24 justify-end gap-1 md:opacity-0 md:transition md:group-hover:opacity-100 md:focus-within:opacity-100">
                  <button type="button" class="grid size-7 place-items-center rounded text-flixer-muted hover:bg-white/10 hover:text-white disabled:opacity-40" :disabled="index === 0 || busy === 'order'" :aria-label="t('social.moveUp')" @click="move(index, -1)">↑</button>
                  <button type="button" class="grid size-7 place-items-center rounded text-flixer-muted hover:bg-white/10 hover:text-white disabled:opacity-40" :disabled="index === tracks.length - 1 || busy === 'order'" :aria-label="t('social.moveDown')" @click="move(index, 1)">↓</button>
                  <button type="button" class="grid size-7 place-items-center rounded text-flixer-muted hover:bg-red-500/15 hover:text-red-200" :disabled="busy === track.id" :aria-label="t('social.removeTrack')" @click="removeTrack(track)">×</button>
                </span>
              </li>
            </ol>
          </div>
        </section>
      </section>
    </main>
    <MobileTabBar :tabs="mobileTabs" />
  </div>
</template>
