<script setup lang="ts">
import axios from 'axios'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { getPerson, type PersonCredits } from '../api'
import MediaCard from '../components/home/MediaCard.vue'
import AuthImage from '../components/ui/AuthImage.vue'
import CardGridSkeleton from '../components/ui/CardGridSkeleton.vue'
import ClampedText from '../components/ui/ClampedText.vue'
import MusicBanner from '../components/ui/MusicBanner.vue'
import PersonAvatar from '../components/ui/PersonAvatar.vue'
import Skeleton from '../components/ui/Skeleton.vue'
import MobileTabBar from '../components/home/MobileTabBar.vue'
import { getMobileTabs } from '../composables/homeNav'
import { catchError } from '../utils/catchError'

const { t, te } = useI18n()
const route = useRoute()
const mobileTabs = computed(getMobileTabs)

const routeName = computed(() => String(route.params.id ?? ''))
const name = ref('')
const hasImage = ref(false)
const fallbackArt = computed(() => {
  const group = groups.value.find((entry) => entry.role === 'artist')
  const card = group?.items.find((item) => item.poster !== null || item.backdrop !== null)
  const index = card?.poster ?? card?.backdrop ?? null
  return card && index !== null ? { itemId: card.id, index, version: card.updatedAt } : null
})
const backdropArt = computed(() => {
  const card = groups.value.flatMap((group) => group.items).find((item) => item.backdrop !== null)
  return card && card.backdrop !== null ? { itemId: card.id, index: card.backdrop, version: card.updatedAt } : null
})
const isArtist = computed(() => groups.value.some((entry) => entry.role === 'artist'))
const totalTitles = computed(() => new Set(groups.value.flatMap((entry) => entry.items.map((item) => item.id))).size)
const yearRange = computed(() => {
  const years = groups.value.flatMap((entry) => entry.items.map((item) => item.year)).filter((year): year is number => typeof year === 'number')
  if (years.length === 0) return ''
  const first = Math.min(...years)
  const last = Math.max(...years)
  return first === last ? String(first) : `${first} – ${last}`
})
const kinds = computed(() => groups.value.map((entry) => (te(`person.kinds.${entry.role}`) ? t(`person.kinds.${entry.role}`) : entry.role)))
const profile = ref<PersonCredits['profile']>(null)
const groups = ref<PersonCredits['groups']>([])
const isLoading = ref(true)
const failed = ref(false)
const notFound = ref(false)

let controller: AbortController | undefined

async function load() {
  controller?.abort()
  controller = new AbortController()
  isLoading.value = true
  failed.value = false
  notFound.value = false
  groups.value = []
  hasImage.value = false
  profile.value = null
  const [error, person] = await catchError(getPerson(routeName.value, controller.signal))
  if (error) {
    if ((error as { code?: string }).code === 'ERR_CANCELED') return
    if (axios.isAxiosError(error) && error.response?.status === 404) notFound.value = true
    else failed.value = true
  } else {
    name.value = person.name
    hasImage.value = person.hasImage
    profile.value = person.profile
    groups.value = person.groups
  }
  isLoading.value = false
}

watch(routeName, () => void load(), { immediate: true })
onBeforeUnmount(() => controller?.abort())
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-flixer-background pb-24 font-sans text-flixer-text md:pb-12">
    <main>
      <div v-if="isLoading" class="page-gutter pt-28 sm:pt-32" role="status" :aria-label="t('common.loading')">
        <div class="flex items-end gap-6">
          <Skeleton class="aspect-square w-32 shrink-0 rounded sm:w-52" />
          <div class="w-full max-w-md space-y-4 pb-2"><Skeleton class="h-4 w-24" /><Skeleton class="h-10 w-3/4" /><Skeleton class="h-4 w-1/2" /></div>
        </div>
        <div class="mt-12"><Skeleton class="mb-5 h-5 w-24" /><CardGridSkeleton :count="6" /></div>
      </div>
      <div v-else-if="failed || notFound" class="page-gutter pt-32" aria-live="polite">
        <p :class="failed ? 'text-red-400' : 'text-flixer-muted'" class="text-sm" :role="failed ? 'alert' : undefined">{{ failed ? t('person.error') : t('person.notFound') }}</p>
      </div>

      <template v-else>
        <header class="relative overflow-hidden">
          <div v-if="backdropArt" class="absolute inset-0">
            <AuthImage scope="library" :item-id="backdropArt.itemId" :index="backdropArt.index" :version="backdropArt.version" :width="1600" alt="" img-class="size-full object-cover object-top" />
          </div>
          <MusicBanner v-else-if="isArtist" :seed="routeName" />
          <div class="absolute inset-0 bg-gradient-to-t from-flixer-background" :class="isArtist && !backdropArt ? 'via-flixer-background/10 to-transparent' : 'via-flixer-background/70 to-flixer-background/30'"></div>
          <div v-if="backdropArt" class="absolute inset-0 bg-gradient-to-r from-flixer-background/90 via-flixer-background/40 to-transparent"></div>
          <div class="person-hero relative page-gutter flex flex-col gap-8 pb-10 pt-32 sm:flex-row sm:items-end sm:pt-44">
              <PersonAvatar
                :person-id="routeName"
                :name="name"
                :has-image="hasImage"
                :width="320"
                :fallback="fallbackArt"
                class="shrink-0 rounded border border-flixer-border bg-flixer-surface shadow-2xl shadow-black/60"
                :class="isArtist ? 'aspect-square w-40 sm:w-56' : 'aspect-[2/3] w-40 sm:w-56'"
              />
              <div class="min-w-0 max-w-3xl">
                <h1 class="mt-1 break-words text-4xl font-bold text-white drop-shadow-lg sm:text-5xl">{{ name }}</h1>
                <ClampedText v-if="profile?.description?.trim()" class="mt-2 italic" :text="profile.description" :title="name" clip />
                <div class="mt-4 flex flex-wrap items-center gap-3 text-sm">
                  <span v-for="kind in kinds" :key="kind" class="font-medium text-white">{{ kind }}</span>
                  <span class="text-flixer-muted">{{ t('person.titleCount', { count: totalTitles }, totalTitles) }}</span>
                  <span v-if="yearRange" class="text-flixer-muted">{{ t('person.active', { range: yearRange }) }}</span>
                </div>
                <div v-if="profile?.biography?.trim()" class="mt-4">
                  <ClampedText :text="profile.biography" :title="name" clip />
                  <p v-if="profile.source" class="mt-3 text-xs text-flixer-muted">
                    <a v-if="profile.sourceUrl" :href="profile.sourceUrl" target="_blank" rel="noopener noreferrer" class="hover:text-white hover:underline">{{ t('person.source', { source: profile.source }) }}</a>
                    <template v-else>{{ t('person.source', { source: profile.source }) }}</template>
                  </p>
                </div>
              </div>
          </div>
        </header>

        <div class="page-gutter space-y-10 pt-4">
          <section v-for="group in groups" :key="group.role">
            <div class="mb-5 flex items-baseline gap-3">
              <h2 class="text-xl font-semibold text-white sm:text-2xl">{{ te(`person.roles.${group.role}`) ? t(`person.roles.${group.role}`) : group.role }}</h2>
              <span class="text-sm tabular-nums text-flixer-muted">{{ group.items.length }}</span>
            </div>
            <ul class="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-x-4 gap-y-6 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]">
              <MediaCard v-for="entry in group.items" :key="entry.id" class="!w-auto" :variant="group.role === 'artist' ? 'square' : 'poster'" :title="entry.title" :subtitle="[entry.detail, entry.year].filter(Boolean).join(' · ') || undefined" :item-id="entry.id" :image-index="entry.poster ?? entry.backdrop" :version="entry.updatedAt" />
            </ul>
          </section>
        </div>
      </template>
    </main>

    <MobileTabBar :tabs="mobileTabs" />
  </div>
</template>

<style scoped>
html.capacitor .person-hero {
  padding-top: max(10rem, calc(max(env(safe-area-inset-top, 0px), 3.5rem) + 6.5rem));
}
</style>
