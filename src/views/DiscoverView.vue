<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { discoverRequests, type ExternalMediaCard } from '../api'
import Header from '../components/header/Header.vue'
import MediaCard from '../components/home/MediaCard.vue'
import MobileTabBar from '../components/home/MobileTabBar.vue'
import { getMobileTabs, getNavLinks } from '../composables/homeNav'
import { useRequestsConfig } from '../composables/useRequestsConfig'
import { useSignOut } from '../composables/useSignOut'

const { t } = useI18n()
const { isSigningOut, signOut } = useSignOut()
const navLinks = computed(getNavLinks)
const tabs = computed(getMobileTabs)
const config = useRequestsConfig()
const sections = ['trending', 'movies', 'tv', 'upcoming', 'music'] as const
const rows = ref<Record<string, ExternalMediaCard[]>>({})
const loading = ref(true)
onMounted(async () => {
  await config.load()
  if (!config.enabled.value) {
    loading.value = false
    return
  }
  const results = await Promise.all(sections.map(async (section) => [section, await discoverRequests(section).catch(() => [])] as const))
  rows.value = Object.fromEntries(results)
  loading.value = false
})
function subtitle(item: ExternalMediaCard) {
  const kind = t(`home.itemType.${item.type === 'tv' ? 'series' : item.type === 'music' ? 'album' : 'movie'}`)
  return item.year ? `${kind} · ${item.year}` : kind
}
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-flixer-background pb-28 pt-24 text-flixer-text md:pb-12 md:pt-28">
    <Header :links="navLinks" :is-signing-out="isSigningOut" @logout="signOut" />
    <main>
      <header class="page-gutter mx-auto max-w-[110rem]">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-flixer-accent">{{ t('requests.discover') }}</p>
        <h1 class="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">{{ t('requests.discover') }}</h1>
        <p class="mt-2 max-w-2xl text-sm leading-6 text-flixer-muted">{{ t('requests.discoverDescription') }}</p>
      </header>
      <div v-if="loading" class="mt-9 space-y-9" role="status" :aria-label="t('common.loading')">
        <section v-for="section in sections" :key="section" class="page-gutter">
          <div class="mb-4 h-6 w-48 animate-pulse rounded bg-white/[0.07]" />
          <div class="flex gap-4 overflow-hidden">
            <div v-for="n in 6" :key="n" class="w-36 shrink-0 animate-pulse sm:w-44">
              <div class="aspect-[2/3] rounded-xl bg-white/[0.06]" />
              <div class="mt-3 h-3 rounded bg-white/[0.06]" />
            </div>
          </div>
        </section>
      </div>
      <div v-else-if="Object.values(rows).some((row) => row.length)" class="mt-9 space-y-9">
        <section v-for="section in sections" :key="section" v-show="rows[section]?.length" class="group/requests-row" :aria-label="t(`requests.sections.${section}`)">
          <div class="page-gutter mx-auto mb-4 flex max-w-[110rem] items-end justify-between">
            <div>
              <h2 class="text-xl font-semibold tracking-tight text-white sm:text-2xl">{{ t(`requests.sections.${section}`) }}</h2>
              <div class="mt-2 h-0.5 w-10 rounded-full bg-flixer-accent/80" />
            </div>
            <span class="text-xs text-flixer-muted">{{ rows[section]?.length }}</span>
          </div>
          <ul class="page-gutter mx-auto flex max-w-[110rem] snap-x gap-4 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <MediaCard v-for="item in rows[section]" :key="`${item.source}:${item.id}`" :variant="item.type === 'music' ? 'square' : 'poster'" :title="item.title" :subtitle="subtitle(item)" :poster-url="item.poster" :request-status="item.status" :to="{ name: 'request-item', params: { type: item.type, id: item.id } }" />
          </ul>
        </section>
      </div>
      <div v-else class="page-gutter mx-auto mt-10 max-w-4xl rounded-2xl border border-dashed border-flixer-border bg-flixer-surface/30 px-5 py-14 text-center">
        <p class="text-sm text-flixer-muted">{{ t('requests.noDiscover') }}</p>
      </div>
    </main>
    <MobileTabBar :tabs="tabs" />
  </div>
</template>
