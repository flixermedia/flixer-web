<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'
import { createMediaRequest, deleteMediaRequest, getExternalMediaDetail, listRequestServices, type ExternalMediaDetail, type MediaRequestView, type RequestMediaType, type RequestServiceView } from '../api'
import { describeRequestError, useProfile } from '../composables/useProfile'
import { notify } from '../composables/notify'
import { useRequestsConfig } from '../composables/useRequestsConfig'
import { useSignOut } from '../composables/useSignOut'
import Header from '../components/header/Header.vue'
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
  <div class="min-h-screen overflow-x-hidden bg-flixer-background pb-24 text-flixer-text md:pb-12">
    <Header :links="navLinks" :is-signing-out="isSigningOut" @logout="signOut" />
    <main v-if="loading" class="page-gutter pt-32" role="status" :aria-label="t('common.loading')">
      <div class="mx-auto max-w-6xl animate-pulse space-y-6">
        <div class="h-64 rounded-2xl bg-white/[0.06] sm:h-80" />
        <div class="grid gap-6 md:grid-cols-[14rem_1fr]">
          <div class="aspect-[2/3] w-40 rounded-xl bg-white/[0.06] sm:w-56" />
          <div class="space-y-4">
            <div class="h-9 w-2/3 rounded bg-white/[0.06]" />
            <div class="h-4 w-1/3 rounded bg-white/[0.06]" />
            <div class="h-24 rounded bg-white/[0.06]" />
            <div class="h-12 w-40 rounded-lg bg-white/[0.06]" />
          </div>
        </div>
      </div>
    </main>
    <main v-else-if="detail" class="relative mx-auto max-w-[110rem]">
      <section class="relative isolate min-h-[35rem] overflow-hidden sm:min-h-[38rem]" :aria-label="detail.title">
        <img v-if="detail.backdrop" :src="detail.backdrop" alt="" class="absolute inset-0 -z-20 size-full object-cover object-top" />
        <div class="absolute inset-0 -z-10 bg-gradient-to-t from-flixer-background via-flixer-background/75 to-flixer-background/30" />
        <div class="absolute inset-0 -z-10 bg-gradient-to-r from-flixer-background/80 via-flixer-background/30 to-transparent" />
        <div class="page-gutter flex min-h-[35rem] flex-col justify-end gap-7 pb-10 pt-32 sm:min-h-[38rem] sm:flex-row sm:items-end sm:justify-start sm:gap-9 sm:pb-12 sm:pt-40">
          <div class="mx-auto w-40 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-flixer-surface shadow-2xl shadow-black/50 sm:mx-0 sm:w-56" :class="detail.type === 'music' ? 'aspect-square' : 'aspect-[2/3]'">
            <img v-if="detail.poster" :src="detail.poster" :alt="detail.title" class="size-full object-cover" />
            <div v-else class="grid size-full place-items-center p-4 text-center text-sm text-flixer-muted">{{ detail.title }}</div>
          </div>
          <div class="min-w-0 flex-1 pb-1">
            <div class="mb-4 flex flex-wrap items-center gap-2">
              <span class="rounded-full border border-flixer-accent/30 bg-flixer-accent/10 px-3 py-1 text-xs font-semibold text-flixer-accent">{{ t(`requests.status.${activeStatus}`) }}</span>
              <span class="rounded-full border border-white/15 bg-black/20 px-3 py-1 text-xs text-white/80">{{ t(`home.itemType.${detail.type === 'tv' ? 'series' : detail.type === 'music' ? 'album' : 'movie'}`) }}</span>
              <span v-if="detail.year" class="rounded-full border border-white/15 bg-black/20 px-3 py-1 text-xs text-white/80">{{ detail.year }}</span>
              <span v-if="detail.rating" class="rounded-full border border-white/15 bg-black/20 px-3 py-1 text-xs text-white/80">★ {{ detail.rating.toFixed(1) }}</span>
              <span v-if="detail.runtimeMinutes" class="rounded-full border border-white/15 bg-black/20 px-3 py-1 text-xs text-white/80">{{ detail.runtimeMinutes }} min</span>
            </div>
            <h1 class="max-w-4xl text-4xl font-bold tracking-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl">{{ detail.title }}</h1>
            <p v-if="detail.tagline" class="mt-3 text-base italic text-white/80">{{ detail.tagline }}</p>
            <ul v-if="detail.genres.length" class="mt-4 flex flex-wrap gap-2">
              <li v-for="genre in detail.genres" :key="genre" class="rounded-full border border-white/15 bg-white/[0.08] px-3 py-1 text-xs text-white/90">{{ genre }}</li>
            </ul>
            <p v-if="detail.overview" class="mt-5 max-w-3xl text-sm leading-7 text-white/80 sm:text-base">{{ detail.overview }}</p>
            <p v-if="detail.artist" class="mt-4 text-sm font-medium text-white/90">{{ detail.artist }}</p>
            <div v-if="detail.cast.length" class="mt-5">
              <h2 class="text-xs font-semibold uppercase tracking-wider text-flixer-muted">{{ t('requests.cast') }}</h2>
              <p class="mt-1 text-sm text-white/80">{{ detail.cast.join(' · ') }}</p>
            </div>
          </div>
        </div>
      </section>

      <div class="page-gutter mx-auto grid max-w-6xl gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
        <div class="min-w-0 space-y-6">
          <section v-if="tv && detail.seasons?.length" class="rounded-2xl border border-flixer-border bg-flixer-surface/60 p-4 shadow-lg shadow-black/10 sm:p-6">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-flixer-border pb-4">
              <div>
                <h2 class="text-lg font-semibold text-white">{{ t('requests.seasons') }}</h2>
                <p class="mt-1 text-xs text-flixer-muted">{{ t('requests.selectAllSeasons') }}</p>
              </div>
              <label class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-flixer-border bg-flixer-background/70 px-3 py-2 text-xs font-medium text-white"><input type="checkbox" class="size-4 rounded accent-flixer-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" :checked="selectedAll" :aria-label="t('requests.selectAllSeasons')" @change="toggleAll(($event.target as HTMLInputElement).checked)" />{{ t('requests.selectAllSeasons') }}</label>
            </div>
            <ul class="mt-3 divide-y divide-flixer-border">
              <li v-for="season in detail.seasons" :key="season.number" class="flex items-center gap-3 py-3" :class="season.status !== 'none' ? 'opacity-60' : ''">
                <input v-model="selectedSeasons" type="checkbox" :value="season.number" :disabled="season.status !== 'none'" :aria-label="season.name" class="size-4 shrink-0 rounded accent-flixer-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" /><span class="min-w-0 flex-1"
                  ><span class="block text-sm font-medium text-white">{{ season.name }}</span
                  ><span class="mt-0.5 block text-xs text-flixer-muted">{{ season.episodeCount }} {{ t('requests.episodes') }}</span></span
                ><span v-if="season.status !== 'none'" class="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-flixer-muted">{{ t(`requests.status.${season.status}`) }}</span>
              </li>
            </ul>
          </section>
          <section v-if="detail.tracklist?.length" class="rounded-2xl border border-flixer-border bg-flixer-surface/60 p-4 sm:p-6">
            <h2 class="text-lg font-semibold text-white">{{ t('requests.tracklist') }}</h2>
            <ol class="mt-4 divide-y divide-flixer-border">
              <li v-for="(track, index) in detail.tracklist" :key="track" class="flex gap-4 py-2.5 text-sm">
                <span class="w-6 text-right text-flixer-muted">{{ index + 1 }}</span
                ><span class="text-white/90">{{ track }}</span>
              </li>
            </ol>
          </section>
          <details v-if="config.config.value?.isAdmin && services.length" class="group rounded-2xl border border-flixer-border bg-flixer-surface/60 p-4 sm:p-5">
            <summary class="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent">
              <span>{{ t('requests.advanced') }}</span
              ><span class="text-flixer-muted transition group-open:rotate-180" aria-hidden="true">⌄</span>
            </summary>
            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <label class="text-xs font-medium text-flixer-muted"
                >{{ t('requests.server')
                }}<select v-model="serviceId" class="mt-1.5 w-full rounded-lg border border-flixer-border bg-flixer-background px-3 py-2.5 text-sm text-white focus-visible:outline-2 focus-visible:outline-flixer-accent">
                  <option value="">{{ t('requests.defaultServer') }}</option>
                  <option v-for="service in services" :key="service.id" :value="service.id">{{ service.name }}</option>
                </select></label
              ><label class="text-xs font-medium text-flixer-muted">{{ t('requests.rootFolder') }}<input v-model="rootFolder" class="mt-1.5 w-full rounded-lg border border-flixer-border bg-flixer-background px-3 py-2.5 text-sm text-white focus-visible:outline-2 focus-visible:outline-flixer-accent" /></label>
            </div>
          </details>
        </div>

        <aside class="rounded-2xl border border-flixer-border bg-flixer-surface/90 p-5 shadow-xl shadow-black/20 lg:sticky lg:top-24 sm:p-6" :aria-label="t('requests.request')">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold text-white">{{ detail.libraryItemId ? t('requests.play') : t('requests.request') }}</h2>
              <p class="mt-1 text-xs text-flixer-muted">{{ detail.title }}</p>
            </div>
            <span class="rounded-full border border-flixer-accent/30 bg-flixer-accent/10 px-2.5 py-1 text-[10px] font-semibold text-flixer-accent">{{ t(`requests.status.${activeStatus}`) }}</span>
          </div>
          <div v-if="config.config.value?.quota.remaining !== null" class="mt-5 rounded-xl border border-white/10 bg-flixer-background/60 p-3">
            <p class="text-xs text-flixer-muted">{{ t('requests.quotaHint', { remaining: config.config.value?.quota.remaining ?? 0 }) }}</p>
            <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div class="h-full rounded-full bg-flixer-accent" :style="{ width: `${config.config.value?.quota.limit ? Math.min(100, (config.config.value.quota.used / config.config.value.quota.limit) * 100) : 0}%` }" /></div>
          </div>
          <p v-if="!requestAllowed && !detail.libraryItemId" class="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 text-xs leading-5 text-amber-200">{{ config.config.value?.canRequest ? t('requests.quotaReached') : t('requests.notAllowed') }}</p>
          <div class="mt-5 grid gap-2">
            <RouterLink v-if="detail.libraryItemId" :to="{ name: 'media-item', params: { id: detail.libraryItemId } }" class="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-flixer-background transition hover:bg-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent">{{ t('requests.play') }}<span aria-hidden="true">→</span></RouterLink
            ><button v-else-if="activeStatus === 'none' || activeStatus === 'declined'" type="button" :disabled="!requestAllowed || submitting || (tv && selectedSeasons.length === 0)" class="inline-flex items-center justify-center gap-2 rounded-xl bg-flixer-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-flixer-primary/20 transition hover:bg-flixer-primary/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-not-allowed disabled:opacity-50" @click="submit"><span aria-hidden="true">＋</span>{{ submitting ? t('common.loading') : t('requests.request') }}</button>
            <p v-else class="rounded-xl border border-white/10 bg-flixer-background/50 p-3 text-center text-sm text-flixer-muted">{{ t(`requests.status.${activeStatus}`) }}</p>
            <button v-if="ownRequest?.status === 'pending'" type="button" class="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" @click="cancelRequest">{{ t('requests.cancelRequest') }}</button>
          </div>
        </aside>
      </div>
    </main>
    <div v-else class="page-gutter pt-32 text-flixer-muted">{{ t('requests.detailError') }}</div>
  </div>
</template>
