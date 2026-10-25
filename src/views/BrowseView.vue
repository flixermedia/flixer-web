<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { browseMedia, type BrowseKind, type BrowseSort, type HomeCard } from '../api'
import Header from '../components/header/Header.vue'
import MediaCard from '../components/home/MediaCard.vue'
import CardGridSkeleton from '../components/ui/CardGridSkeleton.vue'
import Skeleton from '../components/ui/Skeleton.vue'
import MobileTabBar from '../components/home/MobileTabBar.vue'
import { getMobileTabs, getNavLinks } from '../composables/homeNav'
import { useInfiniteScroll } from '../composables/useInfiniteScroll'
import { useSignOut } from '../composables/useSignOut'

const props = defineProps<{ kind: BrowseKind }>()

const SORTS: BrowseSort[] = ['added', 'title', 'year']

const { t } = useI18n()
const { isSigningOut, signOut } = useSignOut()
const navLinks = computed(getNavLinks)
const mobileTabs = computed(getMobileTabs)

const sort = ref<BrowseSort>('added')
const items = ref<HomeCard[]>([])
const total = ref(0)
const isLoading = ref(false)
const failed = ref(false)

let controller: AbortController | undefined

const heading = computed(() => t(`browse.${props.kind}`))
const hasMore = computed(() => items.value.length < total.value)
const canLoadMore = computed(() => hasMore.value && !failed.value && !isLoading.value)
const { setSentinel, recheck } = useInfiniteScroll(() => void load(false), canLoadMore)

function subtitleOf(item: HomeCard) {
  return item.year ? String(item.year) : undefined
}

async function load(reset: boolean) {
  controller?.abort()
  controller = new AbortController()
  const offset = reset ? 0 : items.value.length
  isLoading.value = true
  failed.value = false
  if (reset) {
    items.value = []
    total.value = 0
  }
  try {
    const page = await browseMedia(props.kind, sort.value, offset, controller.signal)
    items.value = reset ? page.items : [...items.value, ...page.items]
    total.value = page.total
  } catch (error) {
    if ((error as { code?: string }).code === 'ERR_CANCELED') return
    failed.value = true
  }
  isLoading.value = false
  // The observer only fires on changes, so look again in case the grid still doesn't fill the screen.
  recheck()
}

watch([() => props.kind, sort], () => void load(true))
onMounted(() => void load(true))
onBeforeUnmount(() => controller?.abort())
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-flixer-background pb-24 font-sans text-flixer-text md:pb-12">
    <Header :links="navLinks" :is-signing-out="isSigningOut" @logout="signOut" />

    <main class="page-gutter pt-28 sm:pt-32">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <h1 class="text-3xl font-bold text-white">{{ heading }}</h1>
        <label class="flex items-center gap-2 text-sm text-flixer-muted">
          {{ t('browse.sortBy') }}
          <select v-model="sort" class="rounded border border-flixer-border bg-flixer-surface px-3 py-2 text-sm text-white">
            <option v-for="option in SORTS" :key="option" :value="option">{{ t(`browse.sort.${option}`) }}</option>
          </select>
        </label>
      </div>

      <div class="mt-6" aria-live="polite">
        <p v-if="failed" class="text-sm text-red-400" role="alert">{{ t('browse.error') }}</p>
        <CardGridSkeleton v-else-if="isLoading && items.length === 0" :square="kind === 'music'" />
        <p v-else-if="items.length === 0" class="text-sm text-flixer-muted">{{ t('browse.empty') }}</p>

        <ul v-else class="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-x-4 gap-y-6 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]">
          <MediaCard v-for="item in items" :key="item.id" class="!w-auto" :variant="kind === 'music' ? 'square' : 'poster'" :title="item.title" :subtitle="subtitleOf(item)" :item-id="item.id" :image-index="item.poster ?? item.backdrop" :version="item.updatedAt" />
          <li v-for="n in isLoading ? 6 : 0" :key="`more-${n}`" aria-hidden="true">
            <Skeleton :class="kind === 'music' ? 'aspect-square' : 'aspect-[2/3]'" class="w-full rounded-lg" />
          </li>
        </ul>

        <div v-if="hasMore && !failed" :ref="setSentinel" class="h-px" aria-hidden="true"></div>
      </div>
    </main>

    <MobileTabBar :tabs="mobileTabs" />
  </div>
</template>
