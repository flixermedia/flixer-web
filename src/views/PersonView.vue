<script setup lang="ts">
import axios from 'axios'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { getPerson, type PersonCredits } from '../api'
import Header from '../components/header/Header.vue'
import MediaCard from '../components/home/MediaCard.vue'
import CardGridSkeleton from '../components/ui/CardGridSkeleton.vue'
import PersonAvatar from '../components/ui/PersonAvatar.vue'
import Skeleton from '../components/ui/Skeleton.vue'
import MobileTabBar from '../components/home/MobileTabBar.vue'
import { getMobileTabs, getNavLinks } from '../composables/homeNav'
import { useSignOut } from '../composables/useSignOut'
import { catchError } from '../utils/catchError'

const { t, te } = useI18n()
const route = useRoute()
const { isSigningOut, signOut } = useSignOut()
const navLinks = computed(getNavLinks)
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
const expanded = ref(false)
const longBio = computed(() => (profile.value?.biography?.length ?? 0) > 420)
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
  expanded.value = false
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
    <Header :links="navLinks" :is-signing-out="isSigningOut" @logout="signOut" />

    <main class="page-gutter pt-28 sm:pt-32">
      <div class="flex flex-col items-start gap-5 sm:flex-row sm:items-end sm:gap-8">
        <PersonAvatar
          v-if="!isLoading && !notFound && !failed"
          :person-id="routeName"
          :name="name"
          :has-image="hasImage"
          :width="256"
          :fallback="fallbackArt"
          class="shrink-0 rounded-xl shadow-lg shadow-black/40"
          :class="isArtist ? 'size-40 sm:size-52' : 'aspect-[2/3] w-32 sm:w-44'"
        />
        <Skeleton v-else-if="isLoading" class="aspect-[2/3] w-32 shrink-0 rounded-xl sm:w-44" />
        <div class="min-w-0">
          <h1 class="break-words text-3xl font-bold text-white sm:text-5xl">{{ name }}</h1>
          <template v-if="!isLoading && !notFound && !failed">
            <p v-if="profile?.description" class="mt-2 text-base text-flixer-text/90">{{ profile.description }}</p>
            <ul v-if="kinds.length > 0" class="mt-3 flex flex-wrap gap-2">
              <li v-for="kind in kinds" :key="kind" class="rounded-full border border-flixer-border bg-flixer-surface/60 px-3 py-1 text-xs font-medium text-white">{{ kind }}</li>
            </ul>
            <p class="mt-3 text-sm text-flixer-muted">
              {{ t('person.titleCount', { count: totalTitles }, totalTitles) }}<template v-if="yearRange"> · {{ t('person.active', { range: yearRange }) }}</template>
            </p>
          </template>
        </div>
      </div>

      <div class="mt-6" aria-live="polite">
        <p v-if="failed" class="text-sm text-red-400" role="alert">{{ t('person.error') }}</p>
        <div v-else-if="isLoading" role="status" :aria-label="t('common.loading')">
          <Skeleton class="mb-4 h-5 w-24" />
          <CardGridSkeleton :count="6" />
        </div>
        <p v-else-if="notFound" class="text-sm text-flixer-muted">{{ t('person.notFound') }}</p>

        <template v-else>
          <section v-if="profile?.biography" class="mb-10 max-w-3xl" :aria-label="t('person.about')">
            <h2 class="mb-3 text-lg font-semibold text-white">{{ t('person.about') }}</h2>
            <p class="whitespace-pre-line text-sm leading-relaxed text-flixer-text/90" :class="longBio && !expanded ? 'line-clamp-5' : ''">{{ profile.biography }}</p>
            <button v-if="longBio" type="button" class="mt-2 text-sm font-medium text-white hover:underline" :aria-expanded="expanded" @click="expanded = !expanded">
              {{ expanded ? t('person.showLess') : t('person.readMore') }}
            </button>
            <p v-if="profile.source" class="mt-3 text-xs text-flixer-muted">
              <a v-if="profile.sourceUrl" :href="profile.sourceUrl" target="_blank" rel="noopener noreferrer" class="hover:underline">{{ t('person.source', { source: profile.source }) }}</a>
              <template v-else>{{ t('person.source', { source: profile.source }) }}</template>
            </p>
          </section>
          <section v-for="group in groups" :key="group.role" class="mb-10">
            <h2 class="mb-4 text-lg font-semibold text-white">{{ te(`person.roles.${group.role}`) ? t(`person.roles.${group.role}`) : group.role }}</h2>
            <ul class="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-x-4 gap-y-6 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]">
              <MediaCard v-for="entry in group.items" :key="entry.id" class="!w-auto" :variant="group.role === 'artist' ? 'square' : 'poster'" :title="entry.title" :subtitle="[entry.detail, entry.year].filter(Boolean).join(' · ') || undefined" :item-id="entry.id" :image-index="entry.poster ?? entry.backdrop" :version="entry.updatedAt" />
            </ul>
          </section>
        </template>
      </div>
    </main>

    <MobileTabBar :tabs="mobileTabs" />
  </div>
</template>
