<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { searchMedia, type HomeCard } from '../api'
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
const navLinks = computed(getNavLinks)
const mobileTabs = computed(getMobileTabs)

const input = ref<HTMLInputElement>()
const query = ref(typeof route.query.q === 'string' ? route.query.q : '')
const results = ref<HomeCard[]>([])
const isLoading = ref(false)
const failed = ref(false)

let timer: ReturnType<typeof setTimeout> | undefined
let controller: AbortController | undefined

const trimmed = computed(() => query.value.trim())
const tooShort = computed(() => trimmed.value.length < MIN_LENGTH)

async function run(term: string) {
  controller?.abort()
  if (term.length < MIN_LENGTH) {
    results.value = []
    isLoading.value = false
    failed.value = false
    return
  }
  controller = new AbortController()
  isLoading.value = true
  failed.value = false
  try {
    results.value = await searchMedia(term, controller.signal)
  } catch (error) {
    if ((error as { code?: string }).code === 'ERR_CANCELED') return
    failed.value = true
    results.value = []
  }
  isLoading.value = false
}

watch(query, (value) => {
  clearTimeout(timer)
  const term = value.trim()
  void router.replace({ name: 'search', query: term ? { q: term } : {} })
  timer = setTimeout(() => void run(term), DEBOUNCE_MS)
})

onMounted(() => {
  input.value?.focus()
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

    <main class="page-gutter pt-28 sm:pt-32">
      <form role="search" class="relative max-w-3xl" @submit.prevent="run(trimmed)">
        <svg class="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-flixer-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 21l-4.3-4.3M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" />
        </svg>
        <input ref="input" v-model="query" type="search" maxlength="100" autocomplete="off" :placeholder="t('search.placeholder')" :aria-label="t('search.label')" class="w-full rounded-lg border border-flixer-border bg-flixer-surface py-3.5 pl-12 pr-4 text-base text-white placeholder:text-flixer-muted focus:border-flixer-accent focus:outline-none" />
      </form>

      <div class="mt-8" aria-live="polite">
        <p v-if="tooShort" class="text-sm text-flixer-muted">{{ t('search.hint') }}</p>
        <CardGridSkeleton v-else-if="isLoading && results.length === 0" />
        <p v-else-if="failed" class="text-sm text-red-400" role="alert">{{ t('search.error') }}</p>
        <p v-else-if="results.length === 0" class="text-sm text-flixer-muted">{{ t('search.noResults', { query: trimmed }) }}</p>

        <template v-else>
          <h1 class="mb-4 text-lg font-semibold text-white">{{ t('search.results', { count: results.length, query: trimmed }) }}</h1>
          <ul class="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-x-4 gap-y-6 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]">
            <MediaCard v-for="item in results" :key="item.id" class="!w-auto" :variant="item.type === 'album' ? 'square' : 'poster'" :title="item.title" :subtitle="subtitleOf(item)" :item-id="item.id" :image-index="item.poster ?? item.backdrop" :version="item.updatedAt" />
          </ul>
        </template>
      </div>
    </main>

    <MobileTabBar :tabs="mobileTabs" />
  </div>
</template>
