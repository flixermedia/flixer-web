<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'
import { createMediaRequest, deleteMediaRequest, getExternalMediaDetail, listRequestServices, type ExternalMediaDetail, type MediaRequestView, type RequestMediaType, type RequestServiceView } from '../api'
import { describeRequestError, useProfile } from '../composables/useProfile'
import { notify } from '../composables/notify'
import { useRequestsConfig } from '../composables/useRequestsConfig'
import { useSignOut } from '../composables/useSignOut'
import ClampedText from '../components/ui/ClampedText.vue'
import Header from '../components/header/Header.vue'
import Skeleton from '../components/ui/Skeleton.vue'
import { getNavLinks } from '../composables/homeNav'

const { t } = useI18n()
const route = useRoute()
const { isSigningOut, signOut } = useSignOut()
const config = useRequestsConfig()
const navLinks = computed(getNavLinks)
const { profile, load: loadProfile } = useProfile()
const detail = ref<ExternalMediaDetail | null>(null)
const loading = ref(true)
const submitting = ref(false)
const ownRequest = ref<MediaRequestView | null>(null)
const selectedSeasons = ref<number[]>([])
const services = ref<RequestServiceView[]>([])
const serviceId = ref('')
const rootFolder = ref('')
const type = computed(() => route.params.type as RequestMediaType)
const id = computed(() => String(route.params.id))
const tv = computed(() => type.value === 'tv')
const selectedAll = computed(() => detail.value?.seasons?.every((season) => season.status === 'none' || selectedSeasons.value.includes(season.number)) ?? false)
const requestAllowed = computed(() => config.config.value?.enabled && config.config.value?.canRequest && (config.config.value?.quota.remaining === null || (config.config.value?.quota.remaining ?? 0) > 0))
const activeStatus = computed(() => ownRequest.value?.status ?? detail.value?.status ?? 'none')
async function load() {
  loading.value = true
  try {
    const requestedType = type.value
    if (!['movie', 'tv', 'music'].includes(requestedType)) throw new Error('Invalid media type')
    detail.value = await getExternalMediaDetail(requestedType, id.value)
    ownRequest.value = detail.value.requests.find((entry) => (entry.requestedBy.id === profile.value?.id || entry.id === detail.value?.requestId) && entry.status !== 'declined') ?? null
    selectedSeasons.value = (detail.value.seasons ?? []).filter((season) => season.status === 'none').map((season) => season.number)
  } catch (error) {
    notify.error(describeRequestError(error, t('requests.detailError')))
  } finally {
    loading.value = false
  }
}
function toggleAll(checked: boolean) {
  selectedSeasons.value = checked ? (detail.value?.seasons ?? []).filter((season) => season.status === 'none').map((season) => season.number) : []
}
async function submit() {
  if (!detail.value || !requestAllowed.value || submitting.value) return
  submitting.value = true
  try {
    ownRequest.value = await createMediaRequest({ type: type.value, externalId: id.value, ...(tv.value && !selectedAll.value ? { seasons: selectedSeasons.value } : {}), ...(serviceId.value ? { serviceId: serviceId.value } : {}), ...(rootFolder.value.trim() ? { rootFolder: rootFolder.value.trim() } : {}) })
    notify.success(t('requests.requested'))
    await config.refresh()
  } catch (error) {
    notify.error(describeRequestError(error, t('requests.actionError')))
  } finally {
    submitting.value = false
  }
}
async function cancelRequest() {
  if (!ownRequest.value) return
  try {
    await deleteMediaRequest(ownRequest.value.id)
    ownRequest.value = null
    await load()
    await config.refresh()
  } catch (error) {
    notify.error(describeRequestError(error, t('requests.actionError')))
  }
}
onMounted(async () => {
  await Promise.all([config.load(), loadProfile()])
  await load()
  if (config.config.value?.isAdmin) services.value = await listRequestServices().catch(() => [])
})
watch(
  () => [route.params.type, route.params.id],
  () => {
    void load()
  },
)
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-flixer-background pb-24 font-sans text-flixer-text md:pb-12">
    <Header :links="navLinks" :is-signing-out="isSigningOut" @logout="signOut" />
    <main v-if="loading" class="page-gutter pt-32" role="status" :aria-label="t('common.loading')" aria-busy="true">
      <div class="flex flex-col gap-6 sm:flex-row">
        <Skeleton class="aspect-[2/3] w-40 shrink-0 rounded-lg sm:w-56" />
        <div class="min-w-0 flex-1 space-y-3">
          <Skeleton class="h-9 w-2/3" />
          <Skeleton class="h-4 w-1/3" />
          <Skeleton class="mt-4 h-4 w-full" />
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-4/5" />
          <Skeleton class="mt-4 h-11 w-36 rounded-lg" />
        </div>
      </div>
    </main>
    <main v-else-if="detail">
      <section class="relative overflow-hidden" :aria-label="detail.title">
        <div v-if="detail.backdrop" class="absolute inset-0">
          <img :src="detail.backdrop" alt="" class="size-full object-cover object-top" />
        </div>
        <div class="absolute inset-0 bg-gradient-to-t from-flixer-background via-flixer-background/70 to-flixer-background/30"></div>
        <div class="absolute inset-0 bg-gradient-to-r from-flixer-background/90 via-flixer-background/40 to-transparent"></div>

        <div class="relative page-gutter flex flex-col gap-8 pb-10 pt-32 sm:flex-row sm:items-end sm:pt-44">
          <div v-if="detail.poster || !detail.backdrop" class="w-40 shrink-0 overflow-hidden rounded-lg border border-flixer-border bg-flixer-surface shadow-2xl shadow-black/60 sm:w-56" :class="detail.type === 'music' ? 'aspect-square' : 'aspect-[2/3]'">
            <img v-if="detail.poster" :src="detail.poster" :alt="detail.title" class="size-full object-cover" />
            <span v-else class="grid size-full place-items-center p-4 text-center text-sm font-medium text-flixer-muted">{{ detail.title }}</span>
          </div>

          <div class="min-w-0 max-w-3xl">
            <h1 class="mt-1 break-words text-4xl font-bold text-white drop-shadow-lg sm:text-5xl">{{ detail.title }}</h1>
            <p v-if="detail.tagline" class="mt-2 text-base italic text-flixer-text/80">{{ detail.tagline }}</p>

            <div class="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <span class="font-medium text-white">{{ t(`home.itemType.${detail.type === 'tv' ? 'series' : detail.type === 'music' ? 'album' : 'movie'}`) }}</span>
              <span v-if="detail.year" class="text-flixer-muted">{{ detail.year }}</span>
              <span v-if="detail.runtimeMinutes" class="text-flixer-muted">{{ detail.runtimeMinutes }} min</span>
              <span v-if="detail.artist" class="text-flixer-muted">{{ detail.artist }}</span>
              <span v-if="detail.rating" class="text-flixer-muted">TMDB {{ detail.rating.toFixed(1) }}</span>
              <span class="rounded border border-flixer-accent/40 bg-flixer-accent/10 px-2 py-0.5 text-xs font-semibold text-flixer-accent">{{ t(`requests.status.${activeStatus}`) }}</span>
            </div>

            <ul v-if="detail.genres.length" class="mt-3 flex flex-wrap gap-2">
              <li v-for="genre in detail.genres" :key="genre" class="rounded border border-white/20 bg-white/10 px-3 py-1 text-xs text-white">{{ genre }}</li>
            </ul>

            <ClampedText v-if="detail.overview" class="mt-4" :text="detail.overview" :title="detail.title" />
            <p v-else class="mt-4 text-sm text-flixer-muted">{{ t('mediaItem.noOverview') }}</p>

            <p v-if="detail.cast.length" class="mt-4 text-sm text-flixer-muted">
              <span class="font-medium text-flixer-text/80">{{ t('requests.cast') }}:</span> {{ detail.cast.join(' · ') }}
            </p>

            <p v-if="!requestAllowed && !detail.libraryItemId && (activeStatus === 'none' || activeStatus === 'declined')" class="mt-4 max-w-xl rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 text-xs leading-5 text-amber-200">{{ config.config.value?.canRequest ? t('requests.quotaReached') : t('requests.notAllowed') }}</p>
            <p v-else-if="config.config.value?.quota.remaining !== null && config.config.value?.quota.remaining !== undefined && !detail.libraryItemId" class="mt-4 text-xs text-flixer-muted">{{ t('requests.quotaHint', { remaining: config.config.value.quota.remaining }) }}</p>

            <div class="mt-6 flex flex-wrap items-center gap-3">
              <RouterLink v-if="detail.libraryItemId" :to="{ name: 'media-item', params: { id: detail.libraryItemId } }" class="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-flixer-background transition hover:bg-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent">
                <svg class="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                {{ t('requests.play') }}
              </RouterLink>
              <button v-else-if="activeStatus === 'none' || activeStatus === 'declined'" type="button" :disabled="!requestAllowed || submitting || (tv && selectedSeasons.length === 0)" class="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-flixer-background transition hover:bg-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent disabled:cursor-not-allowed disabled:opacity-50" @click="submit">
                <svg class="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z" /></svg>
                {{ submitting ? t('common.loading') : t('requests.request') }}
              </button>
              <button v-else type="button" disabled aria-disabled="true" class="inline-flex cursor-default items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white/80">
                {{ t(`requests.status.${activeStatus}`) }}
              </button>
              <button v-if="ownRequest?.status === 'pending'" type="button" class="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" @click="cancelRequest">{{ t('requests.cancelRequest') }}</button>
            </div>
          </div>
        </div>
      </section>

      <div class="space-y-10 pt-4">
        <section v-if="tv && detail.seasons?.length" :aria-label="t('requests.seasons')" class="page-gutter">
          <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-xl font-semibold text-white">{{ t('requests.seasons') }}</h2>
            <label class="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"><input type="checkbox" class="size-4 rounded accent-flixer-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" :checked="selectedAll" :aria-label="t('requests.selectAllSeasons')" @change="toggleAll(($event.target as HTMLInputElement).checked)" />{{ t('requests.selectAllSeasons') }}</label>
          </div>
          <ul class="divide-y divide-flixer-border overflow-hidden rounded-lg border border-flixer-border bg-flixer-surface/40">
            <li v-for="season in detail.seasons" :key="season.number" class="flex items-center gap-3 p-3" :class="season.status !== 'none' ? 'opacity-60' : ''">
              <input v-model="selectedSeasons" type="checkbox" :value="season.number" :disabled="season.status !== 'none'" :aria-label="season.name" class="size-4 shrink-0 rounded accent-flixer-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" />
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-semibold text-white">{{ season.name }}</span>
                <span class="block text-xs text-flixer-muted">{{ season.episodeCount }} {{ t('requests.episodes') }}</span>
              </span>
              <span v-if="season.status !== 'none'" class="rounded border border-white/20 bg-white/10 px-2 py-0.5 text-xs text-white">{{ t(`requests.status.${season.status}`) }}</span>
            </li>
          </ul>
        </section>

        <section v-if="detail.tracklist?.length" :aria-label="t('requests.tracklist')" class="page-gutter">
          <h2 class="mb-3 text-xl font-semibold text-white">{{ t('requests.tracklist') }}</h2>
          <ol class="divide-y divide-flixer-border overflow-hidden rounded-lg border border-flixer-border bg-flixer-surface/40">
            <li v-for="(track, index) in detail.tracklist" :key="track" class="flex gap-4 p-3 text-sm">
              <span class="w-6 text-right text-flixer-muted">{{ index + 1 }}</span>
              <span class="text-white">{{ track }}</span>
            </li>
          </ol>
        </section>

        <section v-if="config.config.value?.isAdmin && services.length" :aria-label="t('requests.advanced')" class="page-gutter">
          <h2 class="mb-3 text-xl font-semibold text-white">{{ t('requests.advanced') }}</h2>
          <div class="grid gap-4 rounded-lg border border-flixer-border bg-flixer-surface/40 p-4 sm:grid-cols-2">
            <label class="text-xs font-medium text-flixer-muted"
              >{{ t('requests.server') }}
              <select v-model="serviceId" class="mt-1.5 w-full rounded-lg border border-flixer-border bg-flixer-background px-4 py-3 text-sm text-flixer-text focus-visible:outline-2 focus-visible:outline-flixer-accent">
                <option value="">{{ t('requests.defaultServer') }}</option>
                <option v-for="service in services" :key="service.id" :value="service.id">{{ service.name }}</option>
              </select>
            </label>
            <label class="text-xs font-medium text-flixer-muted">{{ t('requests.rootFolder') }}<input v-model="rootFolder" class="mt-1.5 w-full rounded-lg border border-flixer-border bg-flixer-background px-4 py-3 text-sm text-flixer-text focus-visible:outline-2 focus-visible:outline-flixer-accent" /></label>
          </div>
        </section>
      </div>
    </main>
    <div v-else class="page-gutter pt-32 text-flixer-muted">{{ t('requests.detailError') }}</div>
  </div>
</template>
