<script setup lang="ts">
import { openModal } from '@kolirt/vue-modal'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'
import { getItemDetail, type ItemDetail, type ItemSummary } from '../api'
import SubtitleModal from '../components/admin/SubtitleModal.vue'
import Header from '../components/header/Header.vue'
import MobileTabBar from '../components/home/MobileTabBar.vue'
import PlayerOverlay from '../components/player/PlayerOverlay.vue'
import AuthImage from '../components/ui/AuthImage.vue'
import { getMobileTabs, getNavLinks } from '../composables/homeNav'
import { useAudioPlayer, type QueueTrack } from '../composables/useAudioPlayer'
import { useProfile } from '../composables/useProfile'
import { useSignOut } from '../composables/useSignOut'

const { t } = useI18n()
const route = useRoute()
const { profile } = useProfile()
const isAdmin = computed(() => profile.value?.role === 'admin')
const { isSigningOut, signOut } = useSignOut()
const navLinks = computed(getNavLinks)
const mobileTabs = computed(getMobileTabs)

const item = ref<ItemDetail | null>(null)
const isLoading = ref(true)
const failure = ref<'missing' | 'error' | null>(null)
const activeSeason = ref(0)

const isShow = computed(() => item.value?.type === 'series')
const isPortraitOnly = computed(() => item.value !== null && item.value.backdrop === null)
const seasons = computed(() => (isShow.value ? (item.value?.children ?? []) : []))
const episodes = computed<ItemSummary[]>(() => {
  if (!item.value) return []
  if (isShow.value) return seasons.value[activeSeason.value]?.episodes ?? []
  return item.value.children
})
const listTitle = computed(() => {
  if (!item.value) return ''
  if (item.value.type === 'album') return t('mediaItem.tracks')
  return t('mediaItem.episodes')
})
const ratings = computed(() => Object.entries(item.value?.ratings ?? {}).filter(([, value]) => Number.isFinite(value) && value > 0))
const PLAYABLE = ['movie', 'episode', 'video']
const playing = ref<{ id: string; title: string } | null>(null)
const canManageSubtitles = computed(() => isAdmin.value && item.value !== null && PLAYABLE.includes(item.value.type))
function manageSubtitles() {
  if (!item.value) return
  void openModal(SubtitleModal, { props: { itemId: item.value.id, title: item.value.title } }).catch(() => undefined)
}
const showTitle = computed(() => {
  const current = item.value
  if (!current) return null
  if (current.type === 'series') return current.title
  return current.series?.title ?? (current.parent?.type === 'series' ? current.parent.title : null)
})
function playerTitle(entry: { title: string; seasonNumber: number | null; episodeNumber: number | null }, seasonNumber = entry.seasonNumber) {
  if (!showTitle.value) return entry.title
  const code = seasonNumber !== null && entry.episodeNumber !== null ? `S${seasonNumber}E${entry.episodeNumber}` : ''
  return [showTitle.value, code, entry.title].filter(Boolean).join(' · ')
}
// A series plays its first episode.
const playTarget = computed<{ id: string; title: string } | null>(() => {
  const current = item.value
  if (!current) return null
  if (PLAYABLE.includes(current.type)) return { id: current.id, title: playerTitle(current) }
  if (current.type === 'series') {
    const season = current.children.find((entry) => (entry.episodes?.length ?? 0) > 0)
    const first = season?.episodes?.[0]
    return first ? { id: first.id, title: playerTitle(first, first.seasonNumber ?? season?.seasonNumber ?? null) } : null
  }
  return null
})
function play(target: { id: string; title: string }) {
  playing.value = target
}

const audioPlayer = useAudioPlayer()
const isAlbum = computed(() => item.value?.type === 'album')
const isTrack = computed(() => item.value?.type === 'track')
const isMusic = computed(() => isAlbum.value || isTrack.value)
// Tracks have no artwork of their own, so they show their album's cover.
const trackAlbumArt = ref<{ itemId: string; index: number; version: string } | null>(null)
const cover = computed(() => {
  const current = item.value
  if (!current) return null
  if (current.type === 'track') return trackAlbumArt.value
  return current.poster !== null ? { itemId: current.id, index: current.poster, version: current.updatedAt } : null
})
function queueTrack(track: { id: string; title: string }, album: ItemDetail): QueueTrack {
  return {
    id: track.id,
    title: track.title,
    artist: album.artist,
    album: album.title,
    albumId: album.id,
    art: album.poster !== null ? { itemId: album.id, index: album.poster, version: album.updatedAt } : null,
  }
}
function playAlbum(startId?: string) {
  const album = item.value
  if (!album) return
  const tracks = album.children.map((track) => queueTrack(track, album))
  audioPlayer.playQueue(tracks, Math.max(0, tracks.findIndex((track) => track.id === startId)))
}
// A track page queues its whole album, starting at that track.
async function playTrackPage() {
  const track = item.value
  if (!track) return
  if (track.parent?.type === 'album') {
    try {
      const album = await getItemDetail(track.parent.id)
      const tracks = album.children.map((entry) => queueTrack(entry, album))
      const start = tracks.findIndex((entry) => entry.id === track.id)
      if (start >= 0) return audioPlayer.playQueue(tracks, start)
    } catch {
      // Fall through to playing the single track.
    }
  }
  audioPlayer.playQueue([queueTrack(track, track)])
}
const quality = computed(() => {
  const tech = item.value?.technical
  if (!tech) return []
  const resolution = tech.height ? `${tech.height}p` : null
  return [resolution, tech.hdr, tech.videoCodec?.toUpperCase(), tech.audioCodec?.toUpperCase(), tech.container?.toUpperCase()].filter((value): value is string => !!value)
})

function runtime(minutes: number | null) {
  if (!minutes) return ''
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hours > 0 ? `${hours}h ${rest}m` : `${rest}m`
}

function seasonLabel(season: ItemSummary) {
  return season.seasonNumber === 0 ? t('mediaItem.specials') : t('mediaItem.season', { number: season.seasonNumber ?? '?' })
}

function episodeLabel(episode: ItemSummary) {
  const number = episode.episodeNumber
  return number === null ? episode.title : `${number}. ${episode.title}`
}

async function load(id: string) {
  isLoading.value = true
  failure.value = null
  activeSeason.value = 0
  try {
    item.value = await getItemDetail(id)
    document.title = `${item.value.title} · Flixer`
    trackAlbumArt.value = null
    if (item.value.type === 'track' && item.value.parent?.type === 'album') {
      const albumId = item.value.parent.id
      void getItemDetail(albumId)
        .then((album) => {
          if (item.value?.id === id && album.poster !== null) trackAlbumArt.value = { itemId: album.id, index: album.poster, version: album.updatedAt }
        })
        .catch(() => undefined)
    }
  } catch (error) {
    item.value = null
    failure.value = (error as { response?: { status?: number } }).response?.status === 404 ? 'missing' : 'error'
  } finally {
    isLoading.value = false
  }
}

watch(
  () => route.params.id,
  (id) => {
    if (typeof id === 'string') void load(id)
  },
  { immediate: true },
)
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-flixer-background pb-24 font-sans text-flixer-text md:pb-12">
    <Header :links="navLinks" :is-signing-out="isSigningOut" @logout="signOut" />

    <main>
      <p v-if="isLoading" class="page-gutter pt-32 text-sm text-flixer-muted" role="status">{{ t('mediaItem.loading') }}</p>

      <div v-else-if="failure" class="page-gutter pt-32">
        <h1 class="text-2xl font-semibold text-white">{{ failure === 'missing' ? t('mediaItem.notFound') : t('mediaItem.loadError') }}</h1>
        <div class="mt-4 flex gap-3">
          <RouterLink to="/" class="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15">{{ t('mediaItem.backHome') }}</RouterLink>
          <button v-if="failure === 'error'" type="button" class="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15" @click="load(String(route.params.id))">{{ t('home.retry') }}</button>
        </div>
      </div>

      <template v-else-if="item">
        <section class="relative overflow-hidden" :aria-label="item.title">
          <div v-if="item.backdrop !== null" class="absolute inset-0">
            <AuthImage scope="library" :item-id="item.id" :index="item.backdrop" :version="item.updatedAt" alt="" img-class="size-full object-cover object-top" />
          </div>
          <div class="absolute inset-0 bg-gradient-to-t from-flixer-background via-flixer-background/70 to-flixer-background/30"></div>
          <div class="absolute inset-0 bg-gradient-to-r from-flixer-background/90 via-flixer-background/40 to-transparent"></div>

          <div class="relative page-gutter flex flex-col gap-8 pb-10 pt-32 sm:flex-row sm:items-end sm:pt-44" :class="isPortraitOnly ? 'bg-flixer-surface/20' : ''">
            <div v-if="isMusic" class="aspect-square w-40 shrink-0 overflow-hidden rounded-lg border border-flixer-border bg-flixer-surface shadow-2xl shadow-black/60 sm:w-56">
              <AuthImage v-if="cover" scope="library" :item-id="cover.itemId" :index="cover.index" :version="cover.version" :alt="item.title" />
              <span v-else class="grid size-full place-items-center p-4 text-center text-sm font-medium text-flixer-muted">{{ item.title }}</span>
            </div>
            <div v-else-if="item.poster !== null || item.backdrop === null" class="aspect-[2/3] w-40 shrink-0 overflow-hidden rounded-lg border border-flixer-border bg-flixer-surface shadow-2xl shadow-black/60 sm:w-56">
              <AuthImage v-if="item.poster !== null" scope="library" :item-id="item.id" :index="item.poster" :version="item.updatedAt" :alt="item.title" />
              <span v-else class="grid size-full place-items-center p-4 text-center text-sm font-medium text-flixer-muted">{{ item.title }}</span>
            </div>

            <div class="min-w-0 max-w-3xl">
              <RouterLink v-if="item.parent" :to="{ name: 'media-item', params: { id: item.parent.id } }" class="text-sm font-medium text-flixer-accent hover:underline">{{ item.parent.title }}</RouterLink>
              <h1 class="mt-1 break-words text-4xl font-bold text-white drop-shadow-lg sm:text-5xl">{{ item.title }}</h1>
              <p v-if="item.tagline" class="mt-2 text-base italic text-flixer-text/80">{{ item.tagline }}</p>

              <div class="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <span class="font-medium text-white">{{ t(`home.itemType.${item.type}`) }}</span>
                <span v-if="item.year" class="text-flixer-muted">{{ item.year }}</span>
                <span v-if="item.rating" class="rounded border border-white/40 px-1.5 py-0.5 text-xs">{{ item.rating }}</span>
                <span v-if="item.runtimeMinutes" class="text-flixer-muted">{{ runtime(item.runtimeMinutes) }}</span>
                <span v-if="item.artist" class="text-flixer-muted">{{ item.artist }}</span>
                <span v-for="[source, value] in ratings" :key="source" class="text-flixer-muted">{{ source.toUpperCase() }} {{ value.toFixed(1) }}</span>
              </div>

              <ul v-if="item.genres.length > 0" class="mt-3 flex flex-wrap gap-2">
                <li v-for="genre in item.genres" :key="genre" class="rounded border border-white/20 bg-white/10 px-3 py-1 text-xs text-white">{{ genre }}</li>
              </ul>

              <p v-if="item.overview" class="mt-4 text-base leading-relaxed text-flixer-text/90">{{ item.overview }}</p>
              <p v-else class="mt-4 text-sm text-flixer-muted">{{ t('mediaItem.noOverview') }}</p>

              <p v-if="quality.length > 0" class="mt-4 text-xs text-flixer-muted">{{ quality.join(' · ') }}</p>

              <button v-if="isAlbum && item.children.length > 0" type="button" class="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-flixer-background transition hover:bg-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" @click="playAlbum()">
                <svg class="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                {{ t('music.playAlbum') }}
              </button>
              <button v-else-if="isTrack" type="button" class="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-flixer-background transition hover:bg-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" @click="playTrackPage()">
                <svg class="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                {{ t('mediaItem.play') }}
              </button>
              <button v-if="playTarget" type="button" class="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-flixer-background transition hover:bg-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" @click="play(playTarget)">
                <svg class="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                {{ t('mediaItem.play') }}
              </button>
              <button v-if="canManageSubtitles" type="button" class="mt-6 inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="playTarget ? 'ml-3' : ''" @click="manageSubtitles">
                <svg class="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zM4 12h4v2H4zm10 6H4v-2h10zm6 0h-4v-2h4zm0-4H10v-2h10z" /></svg>
                {{ t('subtitles.manage') }}
              </button>
            </div>
          </div>
        </section>

        <div class="space-y-10 pt-4">
          <section v-if="isShow && seasons.length > 0" :aria-label="t('mediaItem.seasons')" class="page-gutter">
            <h2 class="mb-3 text-xl font-semibold text-white">{{ t('mediaItem.seasons') }}</h2>
            <div class="flex flex-wrap gap-2" role="tablist">
              <button v-for="(season, index) in seasons" :key="season.id" type="button" role="tab" :aria-selected="index === activeSeason" class="rounded-lg px-4 py-2 text-sm font-semibold transition" :class="index === activeSeason ? 'bg-white text-flixer-background' : 'bg-white/10 text-white hover:bg-white/15'" @click="activeSeason = index">
                {{ seasonLabel(season) }}
              </button>
            </div>
          </section>

          <section v-if="episodes.length > 0" :aria-label="listTitle" class="page-gutter">
            <h2 v-if="!isShow" class="mb-3 text-xl font-semibold text-white">{{ listTitle }}</h2>
            <ul class="divide-y divide-flixer-border overflow-hidden rounded-lg border border-flixer-border bg-flixer-surface/40">
              <li v-for="episode in episodes" :key="episode.id" class="flex items-center">
                <RouterLink :to="{ name: 'media-item', params: { id: episode.id } }" class="flex min-w-0 flex-1 items-center gap-4 p-3 transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent">
                  <div v-if="episode.type !== 'track'" class="aspect-video w-32 shrink-0 overflow-hidden rounded bg-flixer-surface sm:w-44">
                    <AuthImage v-if="episode.thumb !== null" scope="library" :item-id="episode.id" :index="episode.thumb" :version="episode.updatedAt" alt="" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-semibold text-white">{{ episodeLabel(episode) }}</p>
                    <p v-if="episode.runtimeMinutes" class="text-xs text-flixer-muted">{{ runtime(episode.runtimeMinutes) }}</p>
                    <p v-if="episode.overview" class="mt-1 line-clamp-2 text-xs text-flixer-text/80">{{ episode.overview }}</p>
                  </div>
                </RouterLink>
                <button v-if="episode.type === 'track'" type="button" class="mr-3 grid size-10 shrink-0 place-items-center rounded bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" :aria-label="t('music.playTrack', { title: episode.title })" @click="playAlbum(episode.id)">
                  <svg class="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                </button>
                <button v-else-if="PLAYABLE.includes(episode.type)" type="button" class="mr-3 grid size-10 shrink-0 place-items-center rounded bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" :aria-label="`${t('mediaItem.play')} ${episode.title}`" @click="play({ id: episode.id, title: playerTitle(episode, episode.seasonNumber ?? item.seasonNumber ?? seasons[activeSeason]?.seasonNumber ?? null) })">
                  <svg class="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                </button>
              </li>
            </ul>
          </section>

          <section v-if="item.cast.length > 0" :aria-label="t('mediaItem.cast')" class="page-gutter">
            <h2 class="mb-3 text-xl font-semibold text-white">{{ t('mediaItem.cast') }}</h2>
            <ul class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <li v-for="person in item.cast" :key="`${person.name}-${person.role}`" class="rounded-lg border border-flixer-border bg-flixer-surface/40 px-3 py-2">
                <p class="truncate text-sm font-medium text-white">{{ person.name }}</p>
                <p v-if="person.role" class="truncate text-xs text-flixer-muted">{{ person.role }}</p>
              </li>
            </ul>
          </section>

          <section v-if="item.studios.length > 0" class="page-gutter">
            <h2 class="mb-1 text-sm font-semibold uppercase tracking-wide text-flixer-muted">{{ t('mediaItem.studios') }}</h2>
            <p class="text-sm text-flixer-text/90">{{ item.studios.join(', ') }}</p>
          </section>
        </div>
      </template>
    </main>

    <MobileTabBar :tabs="mobileTabs" />
    <PlayerOverlay v-if="playing" :key="playing.id" :item-id="playing.id" :title="playing.title" @close="playing = null" />
  </div>
</template>
