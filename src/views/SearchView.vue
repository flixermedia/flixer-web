<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { getSearchGenres, searchMedia, searchPluginSections, type HomeCard, type SearchFilters } from '../api'
import { pluginSearchType, sanitizeSearchSections, searchItemRoute, type PluginSearchSection } from '../plugins/searchSections'
import Header from '../components/header/Header.vue'
import MediaCard from '../components/home/MediaCard.vue'
import CardGridSkeleton from '../components/ui/CardGridSkeleton.vue'
import MobileTabBar from '../components/home/MobileTabBar.vue'
import { getMobileTabs, getNavLinks } from '../composables/homeNav'
import { useSignOut } from '../composables/useSignOut'

const DEBOUNCE_MS = 250
const MIN_LENGTH = 2

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { isSigningOut, signOut } = useSignOut()
const pluginSections = ref<PluginSearchSection[]>([])
const pluginItemCount = computed(() => pluginSections.value.reduce((sum, section) => sum + section.items.length, 0))
const navLinks = computed(getNavLinks)
const mobileTabs = computed(getMobileTabs)

const input = ref<HTMLInputElement>()
const query = ref(typeof route.query.q === 'string' ? route.query.q : '')
const TYPES = ['', 'movie', 'series', 'album', 'video']
const SORTS = ['relevance', 'title', 'year', 'added'] as const
const str = (value: unknown) => (typeof value === 'string' ? value : '')
const type = ref(str(route.query.type))
const genre = ref(str(route.query.genre))
const yearFrom = ref(str(route.query.from))
const yearTo = ref(str(route.query.to))
const sort = ref<(typeof SORTS)[number]>(SORTS.find((entry) => entry === route.query.sort) ?? 'relevance')
const unwatched = ref(route.query.unwatched === 'true')
const genres = ref<string[]>([])
const showFilters = ref(Boolean(type.value || genre.value || yearFrom.value || yearTo.value || unwatched.value || route.query.sort))

function year(value: string) {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed >= 1800 && parsed <= 2200 ? parsed : undefined
}
const filters = computed<SearchFilters>(() => ({
  type: type.value || undefined,
  genre: genre.value || undefined,
  yearFrom: year(yearFrom.value),
  yearTo: year(yearTo.value),
  sort: sort.value,
  unwatched: unwatched.value,
}))
const hasFilters = computed(() => Boolean(type.value || genre.value || year(yearFrom.value) || year(yearTo.value) || unwatched.value))
const activeCount = computed(() => [type.value, genre.value, year(yearFrom.value), year(yearTo.value), unwatched.value].filter(Boolean).length)

const hasActivity = computed(() => trimmed.value.length > 0 || hasFilters.value)

function clearFilters() {
  type.value = ''
  genre.value = ''
  yearFrom.value = ''
  yearTo.value = ''
  unwatched.value = false
  sort.value = 'relevance'
}

const results = ref<HomeCard[]>([])
const isLoading = ref(false)
const failed = ref(false)

let timer: ReturnType<typeof setTimeout> | undefined
let controller: AbortController | undefined

const trimmed = computed(() => query.value.trim())
const tooShort = computed(() => trimmed.value.length < MIN_LENGTH && !(trimmed.value.length === 0 && hasFilters.value))

async function run(term: string) {
  controller?.abort()
  if (term.length < MIN_LENGTH && !(term.length === 0 && hasFilters.value)) {
    results.value = []
    pluginSections.value = []
    isLoading.value = false
    failed.value = false
    return
  }
  controller = new AbortController()
  isLoading.value = true
  failed.value = false
  try {
    const signal = controller.signal
    const pluginType = pluginSearchType(type.value)
    const [local, sections] = await Promise.all([searchMedia(term, filters.value, signal), pluginType === null ? Promise.resolve([]) : searchPluginSections(term, pluginType, signal).then(sanitizeSearchSections, () => [])])
    results.value = local
    pluginSections.value = sections
  } catch (error) {
    if ((error as { code?: string }).code === 'ERR_CANCELED') return
    failed.value = true
    results.value = []
    pluginSections.value = []
  }
  isLoading.value = false
}

watch([query, type, genre, yearFrom, yearTo, sort, unwatched], () => {
  clearTimeout(timer)
  const term = trimmed.value
  const current = filters.value
  const params: Record<string, string> = {}
  if (term) params.q = term
  if (current.type) params.type = current.type
  if (current.genre) params.genre = current.genre
  if (current.yearFrom) params.from = String(current.yearFrom)
  if (current.yearTo) params.to = String(current.yearTo)
  if (current.sort && current.sort !== 'relevance') params.sort = current.sort
  if (current.unwatched) params.unwatched = 'true'
  void router.replace({ name: 'search', query: params })
  timer = setTimeout(() => void run(term), DEBOUNCE_MS)
})

onMounted(() => {
  input.value?.focus()
  void getSearchGenres()
    .then((list) => (genres.value = list))
    .catch(() => undefined)
  void run(trimmed.value)
})

onBeforeUnmount(() => {
  clearTimeout(timer)
  controller?.abort()
})

function subtitleOf(item: HomeCard) {
  const type = t(`home.itemType.${item.type}`)
  return item.year ? `${type} · ${item.year}` : type
}
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-flixer-background pb-24 font-sans text-flixer-text md:pb-12">
    <Header :links="navLinks" :is-signing-out="isSigningOut" @logout="signOut" />

    <main class="page-gutter relative pt-28 sm:pt-32">
      <div class="pointer-events-none absolute inset-x-0 top-0 -z-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_70%)]" aria-hidden="true"></div>

      <div class="search-enter relative mx-auto flex max-w-3xl flex-col items-center text-center" :class="hasActivity ? 'pt-0' : 'pt-6 sm:pt-12'" style="transition: padding 0.4s ease">
        <h1 class="text-3xl font-bold tracking-tight text-white transition-all duration-500 sm:text-5xl" :class="hasActivity ? 'mb-4 !text-2xl sm:!text-3xl' : 'mb-6'">{{ t('search.label') }}</h1>

        <form role="search" class="group relative w-full" @submit.prevent="run(trimmed)">
          <svg class="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-flixer-muted transition-colors group-focus-within:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 21l-4.3-4.3M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" />
          </svg>
          <input ref="input" v-model="query" type="search" maxlength="100" autocomplete="off" :placeholder="t('search.placeholder')" :aria-label="t('search.label')" class="w-full rounded-xl border border-white/10 bg-white/[0.06] py-4 pl-14 pr-14 text-lg text-white shadow-lg shadow-black/30 backdrop-blur transition duration-300 placeholder:text-flixer-muted focus:border-white/40 focus:bg-white/10 focus:shadow-2xl focus:shadow-black/50 focus:outline-none" />
          <span v-if="isLoading" class="absolute right-5 top-1/2 size-5 -translate-y-1/2 animate-spin rounded-full border-2 border-white/20 border-t-white" role="status" :aria-label="t('search.searching')"></span>
        </form>

        <div class="mt-4 flex w-full flex-wrap items-center justify-center gap-2" role="group" :aria-label="t('search.type')">
          <button v-for="entry in TYPES" :key="entry" type="button" :aria-pressed="type === entry" class="rounded border px-3.5 py-1.5 text-sm font-medium transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="type === entry ? 'border-white bg-white text-flixer-background' : 'border-white/15 bg-white/5 text-white/80 hover:border-white/30 hover:bg-white/10'" @click="type = entry">
            {{ entry ? t(`home.itemType.${entry}`) : t('search.anyType') }}
          </button>
          <button type="button" class="ml-1 inline-flex items-center gap-1.5 rounded border border-white/15 bg-white/5 px-3.5 py-1.5 text-sm font-medium text-white/80 transition hover:border-white/30 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" :aria-expanded="showFilters" @click="showFilters = !showFilters">
            <svg class="size-4 transition-transform duration-300" :class="showFilters ? 'rotate-180' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
            {{ t('search.filters') }}<span v-if="activeCount > 0" class="grid min-w-5 place-items-center rounded bg-white px-1 text-xs font-bold text-flixer-background">{{ activeCount }}</span>
          </button>
        </div>

        <div class="grid w-full transition-[grid-template-rows,opacity] duration-300 ease-out" :class="showFilters ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'" :inert="!showFilters">
          <div class="overflow-hidden">
            <div class="mt-4 grid gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-5 text-left backdrop-blur sm:grid-cols-2">
              <label class="text-xs font-medium uppercase tracking-wide text-flixer-muted">
                {{ t('search.genre') }}
                <select v-model="genre" class="mt-1.5 w-full rounded-lg border border-white/10 bg-flixer-background px-3 py-2.5 text-sm normal-case tracking-normal text-white transition focus:border-white/40 focus:outline-none">
                  <option value="">{{ t('search.anyGenre') }}</option>
                  <option v-for="entry in genres" :key="entry" :value="entry">{{ entry }}</option>
                </select>
              </label>
              <label class="text-xs font-medium uppercase tracking-wide text-flixer-muted">
                {{ t('search.sort') }}
                <select v-model="sort" class="mt-1.5 w-full rounded-lg border border-white/10 bg-flixer-background px-3 py-2.5 text-sm normal-case tracking-normal text-white transition focus:border-white/40 focus:outline-none">
                  <option v-for="entry in SORTS" :key="entry" :value="entry">{{ t(`search.sorts.${entry}`) }}</option>
                </select>
              </label>
              <label class="text-xs font-medium uppercase tracking-wide text-flixer-muted">
                {{ t('search.yearFrom') }}
                <input v-model="yearFrom" type="number" inputmode="numeric" min="1800" max="2200" class="mt-1.5 w-full rounded-lg border border-white/10 bg-flixer-background px-3 py-2.5 text-sm normal-case tracking-normal text-white transition focus:border-white/40 focus:outline-none" />
              </label>
              <label class="text-xs font-medium uppercase tracking-wide text-flixer-muted">
                {{ t('search.yearTo') }}
                <input v-model="yearTo" type="number" inputmode="numeric" min="1800" max="2200" class="mt-1.5 w-full rounded-lg border border-white/10 bg-flixer-background px-3 py-2.5 text-sm normal-case tracking-normal text-white transition focus:border-white/40 focus:outline-none" />
              </label>
              <div class="flex items-center justify-between gap-3 sm:col-span-2">
                <label class="flex cursor-pointer items-center gap-2.5 text-sm text-white">
                  <input v-model="unwatched" type="checkbox" class="size-4 accent-flixer-accent" />
                  {{ t('search.unwatched') }}
                </label>
                <button v-if="hasFilters || sort !== 'relevance'" type="button" class="text-sm text-flixer-muted underline-offset-2 transition hover:text-white hover:underline" @click="clearFilters">{{ t('search.clear') }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mx-auto mt-10 max-w-[100rem]" aria-live="polite">
        <p v-if="tooShort" class="text-center text-sm text-flixer-muted">{{ t('search.hint') }}</p>
        <CardGridSkeleton v-else-if="isLoading && results.length === 0 && pluginItemCount === 0" />
        <p v-else-if="failed && results.length === 0 && pluginItemCount === 0" class="text-center text-sm text-red-400" role="alert">{{ t('search.error') }}</p>
        <p v-if="!tooShort && !isLoading && results.length === 0 && pluginItemCount === 0" class="text-center text-sm text-flixer-muted">{{ t('search.noResults', { query: trimmed }) }}</p>
        <div v-if="results.length" :class="isLoading ? 'opacity-60' : ''" class="transition-opacity duration-200">
          <h2 class="mb-5 text-lg font-semibold text-white">{{ t('search.results', { count: results.length, query: trimmed }) }}</h2>
          <TransitionGroup tag="ul" name="result" class="relative grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-x-4 gap-y-6 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]">
            <MediaCard v-for="(item, index) in results" :key="item.id" class="!w-auto" :style="{ '--i': Math.min(index, 14) }" :variant="item.type === 'album' ? 'square' : 'poster'" :title="item.title" :subtitle="subtitleOf(item)" :item-id="item.id" :image-index="item.poster ?? item.backdrop" :version="item.updatedAt" />
          </TransitionGroup>
        </div>
        <section v-for="section in pluginSections" :key="section.pluginId + section.title" class="mt-9 rounded-2xl border border-flixer-border bg-flixer-surface/35 p-4 sm:mt-12 sm:p-6">
          <div class="mb-5 flex flex-wrap items-end justify-between gap-3">
            <h2 class="text-lg font-semibold text-white sm:text-xl">{{ section.title }}</h2>
            <span class="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs text-flixer-muted">{{ section.items.length }}</span>
          </div>
          <ul class="grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-x-3 gap-y-5 sm:grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] sm:gap-x-4">
            <MediaCard v-for="(item, index) in section.items" :key="index" class="!w-auto" :variant="item.shape" :title="item.title" :subtitle="item.subtitle" :poster-url="item.poster" :badge="item.badge" :to="searchItemRoute(section.pluginId, item)" />
          </ul>
        </section>
      </div>
    </main>

    <MobileTabBar :tabs="mobileTabs" />
  </div>
</template>

<style>
@keyframes search-rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
.search-enter {
  animation: search-rise 0.5s ease-out both;
}
.result-enter-active {
  animation: search-rise 0.45s ease-out both;
  animation-delay: calc(var(--i, 0) * 35ms);
}
.result-leave-active {
  position: absolute;
  transition: opacity 0.2s ease;
}
.result-leave-to {
  opacity: 0;
}
.result-move {
  transition: transform 0.35s ease;
}
.fade-swap-enter-active,
.fade-swap-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.fade-swap-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.fade-swap-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .search-enter,
  .result-enter-active {
    animation: none;
  }
  .result-move,
  .fade-swap-enter-active,
  .fade-swap-leave-active {
    transition: none;
  }
}
</style>
