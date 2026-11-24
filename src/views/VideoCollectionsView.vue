<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import type { SocialItem } from 'flixer-api-client'
import { Button } from '@ui-sdk/vue/button'
import { Input } from '@ui-sdk/vue/input'
import { Select, SelectContent, SelectItem, SelectItemIndicator, SelectLabel, SelectTrigger, SelectValue } from '@ui-sdk/vue/select'
import { Textarea } from '@ui-sdk/vue/textarea'
import { createVideoCollection, deleteVideoCollection, getAutomaticCollection, getAutomaticCollections, getVideoCollection, getVideoCollections, removeVideoCollectionItem, reorderVideoCollection, updateVideoCollection, type AutomaticCollection, type CollectionCover, type VideoCollection } from '../api/userMedia'
import MediaCard from '../components/home/MediaCard.vue'
import HeroCarousel from '../components/home/HeroCarousel.vue'
import CardGridSkeleton from '../components/ui/CardGridSkeleton.vue'
import MobileTabBar from '../components/home/MobileTabBar.vue'
import { confirmAction } from '../composables/confirm'
import { copyToClipboard } from '../utils/clipboard'
import { getMobileTabs } from '../composables/homeNav'
import { notify } from '../composables/notify'
import { isTvMode } from '../platform/tvMode'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const mobileTabs = computed(getMobileTabs)
const id = computed(() => typeof route.params.id === 'string' ? route.params.id : '')
const automaticDetail = computed(() => route.name === 'automatic-collection')
const collections = ref<VideoCollection[]>([])
const automaticCollections = ref<AutomaticCollection[]>([])
const collection = ref<{ id: string; name: string; description: string | null; itemCount: number; isPublic: boolean; isOwner: boolean; items: SocialItem[] } | null>(null)
const name = ref('')
const loading = ref(false)
const busy = ref(false)
const failed = ref(false)
const editing = ref(false)
const editName = ref('')
const editDescription = ref('')
const createOpen = ref(false)
const filter = ref<'all' | 'automatic' | 'custom'>('all')
const search = ref('')
const sort = ref<'name' | 'count'>('name')
let loadSequence = 0

type CollectionCard = { id: string; name: string; itemCount: number; cover: CollectionCover | null; kind: 'automatic' | 'custom'; isPublic?: boolean }
const visibleCollections = computed<CollectionCard[]>(() => {
  const automatic = automaticCollections.value.map((entry) => ({ ...entry, kind: 'automatic' as const }))
  const custom = collections.value.filter((entry) => entry.itemCount !== 1).map((entry) => ({ ...entry, itemCount: entry.visibleItemCount ?? entry.itemCount, kind: 'custom' as const, cover: entry.cover ?? null }))
  const term = search.value.trim().toLocaleLowerCase(locale.value)
  return [...automatic, ...custom]
    .filter((entry) => entry.itemCount !== 1 && (filter.value === 'all' || entry.kind === filter.value) && (!term || entry.name.toLocaleLowerCase(locale.value).includes(term)))
    .sort((left, right) => (sort.value === 'count' ? right.itemCount - left.itemCount : 0) || left.name.localeCompare(right.name, locale.value, { sensitivity: 'base', numeric: true }))
})
const carouselItems = computed(() => visibleCollections.value
  .filter((entry) => entry.cover !== null)
  .slice(0, 5)
  .map((entry) => {
    const cover = entry.cover!
    return {
      id: entry.id,
      title: entry.name,
      updatedAt: cover.version,
      label: entry.kind === 'automatic' ? t('collectionsPage.automatic') : t('collectionsPage.title'),
      detail: t('collectionsPage.itemCount', { count: entry.itemCount }, entry.itemCount),
      imageItemId: cover.itemId,
      imageIndex: cover.index,
      squareArtwork: true,
      to: { name: entry.kind === 'automatic' ? 'automatic-collection' : 'video-collections', params: { id: entry.id } },
    }
  }))

function collectionSubtitle(entry: CollectionCard) {
  const kind = entry.kind === 'automatic' ? t('collectionsPage.automatic') : t(entry.isPublic ? 'userMedia.public' : 'userMedia.private')
  return `${kind} · ${t('collectionsPage.itemCount', { count: entry.itemCount }, entry.itemCount)}`
}

async function load() {
  const current = ++loadSequence
  loading.value = true
  failed.value = false
  editing.value = false
  try {
    if (id.value) {
      const result = automaticDetail.value
        ? { ...await getAutomaticCollection(id.value), description: null, isPublic: false, isOwner: false }
        : await getVideoCollection(id.value)
      if (current === loadSequence) collection.value = result
    } else {
      const [automatic, custom] = await Promise.allSettled([getAutomaticCollections(), getVideoCollections()])
      if (current !== loadSequence) return
      collection.value = null
      automaticCollections.value = automatic.status === 'fulfilled' ? automatic.value : []
      collections.value = custom.status === 'fulfilled' ? custom.value : []
      failed.value = automatic.status === 'rejected' || custom.status === 'rejected'
    }
  } catch { if (current === loadSequence) { failed.value = true; collection.value = null } } finally { if (current === loadSequence) loading.value = false }
}
async function create() {
  if (!name.value.trim() || busy.value) return
  busy.value = true
  try {
    const result = await createVideoCollection({ name: name.value.trim() })
    name.value = ''
    await router.push({ name: 'video-collections', params: { id: result.id } })
  } catch { failed.value = true } finally { busy.value = false }
}
async function togglePublic() {
  if (!collection.value || busy.value) return
  busy.value = true
  try {
    const result = await updateVideoCollection(collection.value.id, { isPublic: !collection.value.isPublic })
    collection.value.isPublic = result.isPublic
  } catch { failed.value = true } finally { busy.value = false }
}
async function removeItem(item: SocialItem) {
  if (!collection.value || busy.value) return
  busy.value = true
  try {
    await removeVideoCollectionItem(collection.value.id, item.id)
    collection.value.items = collection.value.items.filter((entry) => entry.id !== item.id)
    collection.value.itemCount = Math.max(0, collection.value.itemCount - 1)
  } catch { failed.value = true } finally { busy.value = false }
}
function beginEdit() {
  if (!collection.value) return
  editName.value = collection.value.name
  editDescription.value = collection.value.description ?? ''
  editing.value = true
}
async function saveEdit() {
  if (!collection.value || busy.value || !editName.value.trim()) return
  busy.value = true
  try {
    const updated = await updateVideoCollection(collection.value.id, { name: editName.value.trim(), description: editDescription.value })
    collection.value = { ...collection.value, ...updated }
    editing.value = false
  } catch { failed.value = true } finally { busy.value = false }
}
async function move(index: number, direction: -1 | 1) {
  if (!collection.value || busy.value) return
  const target = index + direction
  if (target < 0 || target >= collection.value.items.length) return
  const reordered = [...collection.value.items]
    ;[reordered[index], reordered[target]] = [reordered[target]!, reordered[index]!]
  busy.value = true
  try {
    await reorderVideoCollection(collection.value.id, reordered.map((item) => item.id))
    collection.value.items = reordered
  } catch { failed.value = true } finally { busy.value = false }
}
async function removeCollection() {
  if (!collection.value || busy.value || !(await confirmAction(t('userMedia.deleteConfirm'), { confirmLabel: t('userMedia.delete'), danger: true }))) return
  busy.value = true
  try {
    await deleteVideoCollection(collection.value.id)
    await router.push({ name: 'video-collections' })
  } catch { failed.value = true } finally { busy.value = false }
}
async function share() {
  try {
    if (Capacitor.isNativePlatform()) await Share.share({ title: collection.value?.name, url: window.location.href })
    else if (navigator.share) await navigator.share({ title: collection.value?.name, url: window.location.href })
    else {
      const ok = await copyToClipboard(window.location.href)
      if (ok) notify.info(t('userMedia.copied'))
      else failed.value = true
    }
  } catch (error) { if (!(error instanceof Error && error.name === 'AbortError')) failed.value = true }
}
watch([id, automaticDetail], () => void load(), { immediate: true })
</script>

<template>
  <div class="min-h-screen bg-flixer-background pb-24 font-sans text-flixer-text md:pb-12"
    :class="{ 'overflow-x-hidden': !isTvMode }">
    <HeroCarousel v-if="!id && isTvMode && (loading || carouselItems.length)" :items="carouselItems" :loading="loading"
      :tv="true" />

    <main :class="isTvMode && !id ? 'page-gutter pt-8' : 'page-gutter pt-28 sm:pt-32'">
      <header class="flex flex-wrap items-center justify-between gap-4 border-b border-flixer-border pb-5">
        <div class="min-w-0">
          <RouterLink v-if="id" :to="{ name: 'video-collections' }"
            class="mb-2 inline-flex items-center gap-1 text-sm text-flixer-muted hover:text-white">
            <Icon icon="lucide:arrow-left" class="size-4" aria-hidden="true" />{{ t('collectionsPage.back') }}
          </RouterLink>
          <h1 class="text-3xl font-bold text-white">{{ collection?.name ?? t('collectionsPage.title') }}</h1>
          <p v-if="collection" class="mt-2 text-sm text-flixer-muted">{{ automaticDetail ?
            t('collectionsPage.automaticLabel') : t(collection.isPublic ? 'userMedia.public' : 'userMedia.private') }} ·
            {{ t('collectionsPage.itemCount', { count: collection.itemCount }, collection.itemCount) }}</p>
        </div>
        <Button v-if="!id" type="button"
          class="inline-flex h-auto items-center gap-2 rounded border-0 bg-white px-4 py-2 text-sm font-semibold text-flixer-background hover:bg-white/85"
          :aria-expanded="createOpen" aria-controls="create-video-collection" @click="createOpen = !createOpen">
          <Icon :icon="createOpen ? 'lucide:x' : 'lucide:plus'" class="size-4" aria-hidden="true" />{{ t(createOpen ?
            'common.cancel' : 'userMedia.create') }}
        </Button>
        <div v-if="collection" class="flex flex-wrap gap-2">
          <Button v-if="collection.isOwner" type="button"
            class="grid size-10 place-items-center rounded border border-flixer-border bg-transparent p-0 text-flixer-text hover:bg-white/10"
            :title="t('userMediaOrder.edit')" :aria-label="t('userMediaOrder.edit')" @click="beginEdit">
            <Icon icon="lucide:pencil" class="size-4" aria-hidden="true" />
          </Button>
          <label v-if="collection.isOwner"
            class="inline-flex items-center gap-2 rounded border border-flixer-border px-3 py-2 text-sm text-flixer-text"><input
              type="checkbox" class="size-4 accent-flixer-accent" :checked="collection.isPublic" :disabled="busy"
              @change="togglePublic" />{{ t('userMedia.public') }}</label>
          <Button v-if="automaticDetail || collection.isPublic" type="button"
            class="grid size-10 h-auto place-items-center rounded border border-flixer-border bg-transparent p-0 text-flixer-text hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent"
            :title="t('userMedia.share')" :aria-label="t('userMedia.share')" @click="void share()">
            <Icon icon="lucide:share-2" class="size-4" aria-hidden="true" />
          </Button>
          <Button v-if="collection.isOwner" type="button"
            class="grid size-10 h-auto place-items-center rounded border border-flixer-border bg-transparent p-0 text-flixer-text hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent"
            :title="t('userMedia.delete')" :aria-label="t('userMedia.delete')" @click="void removeCollection()">
            <Icon icon="lucide:trash-2" class="size-4" aria-hidden="true" />
          </Button>
        </div>
      </header>
      <div v-if="failed" class="mt-5 flex items-center gap-3 text-sm text-red-400" role="alert"><span>{{
        t('userMedia.error') }}</span><Button type="button"
          class="h-auto whitespace-normal rounded border-0 bg-white/10 px-3 py-1 text-sm font-normal text-flixer-text hover:bg-white/20" @click="load">{{ t('home.retry')
          }}</Button></div>
      <CardGridSkeleton v-if="loading && !id" class="mt-6" />
      <p v-else-if="loading" class="mt-5 text-sm text-flixer-muted" role="status">{{ t('common.loading') }}</p>
      <template v-else-if="!id">
        <form v-if="createOpen" id="create-video-collection" class="mt-5 flex max-w-lg flex-wrap gap-2"
          @submit.prevent="create"><Input v-model="name" maxlength="100"
            class="min-w-0 flex-1 rounded border border-flixer-border bg-flixer-surface px-3 py-2 text-sm text-white"
            :placeholder="t('userMedia.name')" :aria-label="t('userMedia.name')" /><Button type="submit"
            class="h-auto whitespace-normal rounded border-0 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 disabled:opacity-50"
            :disabled="busy || !name.trim()">{{ t('userMedia.create') }}</Button></form>
        <div class="mt-5 flex flex-wrap items-center gap-3">
          <div class="flex rounded border border-flixer-border bg-flixer-surface p-0.5" role="group"
            :aria-label="t('collectionsPage.title')"><button v-for="entry in (['all', 'automatic', 'custom'] as const)"
              :key="entry" type="button" class="rounded px-3 py-1.5 text-sm transition"
              :class="filter === entry ? 'bg-white/15 text-white' : 'text-flixer-muted hover:text-white'"
              :aria-pressed="filter === entry" @click="filter = entry">{{ t(`collectionsPage.${entry}`) }}</button>
          </div>
          <label class="relative min-w-0 flex-1 sm:max-w-xs">
            <Icon icon="lucide:search"
              class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-flixer-muted"
              aria-hidden="true" /><Input v-model="search" type="search"
              class="w-full rounded border border-flixer-border bg-flixer-surface py-2 pl-9 pr-3 text-sm text-white"
              :placeholder="t('collectionsPage.search')" :aria-label="t('collectionsPage.search')" />
          </label>
          <Select v-model:value="sort" virtual-focus class="inline-flex items-center gap-2">
            <SelectLabel class="whitespace-nowrap text-sm text-flixer-muted">{{ t('browse.sortBy') }}</SelectLabel>
            <SelectTrigger
              class="inline-flex h-auto min-w-32 items-center justify-between gap-2 rounded border border-flixer-border bg-flixer-surface px-3 py-2 text-sm text-white shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent">
              <SelectValue />
              <Icon icon="lucide:chevron-down" class="size-4 shrink-0" aria-hidden="true" />
            </SelectTrigger>
            <SelectContent
              class="z-50 max-h-60 min-w-[var(--anchor-width)] overflow-auto rounded border border-flixer-border bg-flixer-surface p-1 text-white shadow-xl">
              <SelectItem value="name"
                class="flex cursor-default items-center justify-between gap-3 rounded px-2 py-1.5 text-sm outline-none data-highlighted:bg-white/10 data-selected:bg-white/10">
                {{ t('collectionsPage.sortName') }}
                <SelectItemIndicator><Icon icon="lucide:check" class="size-4" aria-hidden="true" /></SelectItemIndicator>
              </SelectItem>
              <SelectItem value="count"
                class="flex cursor-default items-center justify-between gap-3 rounded px-2 py-1.5 text-sm outline-none data-highlighted:bg-white/10 data-selected:bg-white/10">
                {{ t('collectionsPage.sortCount') }}
                <SelectItemIndicator><Icon icon="lucide:check" class="size-4" aria-hidden="true" /></SelectItemIndicator>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p v-if="!visibleCollections.length && !failed" class="mt-6 text-sm text-flixer-muted">{{
          t('collectionsPage.empty') }}</p>
        <ul v-else data-tv-row data-tv-grid data-tv-scroll="nearest"
          class="mt-6 grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-x-4 gap-y-6 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]">
          <MediaCard v-for="entry in visibleCollections" :key="`${entry.kind}:${entry.id}`" class="!w-auto"
            :title="entry.name" :subtitle="collectionSubtitle(entry)" :item-id="entry.cover?.itemId"
            :image-index="entry.cover?.index" :version="entry.cover?.version"
            :to="{ name: entry.kind === 'automatic' ? 'automatic-collection' : 'video-collections', params: { id: entry.id } }" />
        </ul>
      </template>
      <template v-else-if="collection">
        <form v-if="editing && collection.isOwner" class="mt-5 grid max-w-lg gap-3" @submit.prevent="saveEdit"><label
            class="text-sm text-flixer-muted">{{ t('userMedia.name') }}<Input v-model="editName" maxlength="100"
              class="mt-1 w-full rounded border border-flixer-border bg-flixer-surface px-3 py-2 text-sm text-white" /></label><label
            class="text-sm text-flixer-muted">{{ t('userMediaOrder.description') }}<Textarea v-model:value="editDescription"
              maxlength="500" rows="3"
              class="mt-1 w-full rounded border border-flixer-border bg-flixer-surface px-3 py-2 text-sm text-white" /></label>
          <div class="flex gap-2"><Button type="submit"
              class="h-auto whitespace-normal rounded border-0 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 disabled:opacity-50"
              :disabled="busy || !editName.trim()">{{ t('common.save') }}</Button><Button type="button"
              class="h-auto whitespace-normal rounded border border-flixer-border bg-transparent px-4 py-2 text-sm font-normal text-inherit hover:bg-white/10"
              @click="editing = false">{{ t('common.cancel') }}</Button></div>
        </form>
        <p v-if="collection.description" class="mt-4 text-sm text-flixer-muted">{{ collection.description }}</p>
        <p v-if="!collection.items.length" class="mt-5 text-sm text-flixer-muted">{{ t('userMedia.empty') }}</p>
        <ul v-else data-tv-row data-tv-grid data-tv-scroll="nearest"
          class="mt-6 grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-x-4 gap-y-6 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]">
          <MediaCard v-for="(item, index) in collection.items" :key="item.id" class="!w-auto" :title="item.title"
            :subtitle="item.subtitle ?? undefined" :item-id="item.imageItemId" :image-index="item.imageIndex"
            :version="item.imageUpdatedAt" :to="{ name: 'media-item', params: { id: item.id } }">
            <template #actions>
              <div v-if="collection?.isOwner"
                class="theme-dark absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover/card:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100">
                <Button type="button"
                  class="grid size-8 h-auto place-items-center rounded border-0 bg-black/70 p-0 text-white hover:bg-black/90 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent"
                  :disabled="busy || index === 0 || collection.itemCount !== collection.items.length"
                  :title="t('userMediaOrder.up')" :aria-label="t('userMediaOrder.up')" @click="void move(index, -1)">
                  <Icon icon="lucide:chevron-left" class="size-4" aria-hidden="true" />
                </Button>
                <Button type="button"
                  class="grid size-8 h-auto place-items-center rounded border-0 bg-black/70 p-0 text-white hover:bg-black/90 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent"
                  :disabled="busy || index === collection.items.length - 1 || collection.itemCount !== collection.items.length"
                  :title="t('userMediaOrder.down')" :aria-label="t('userMediaOrder.down')" @click="void move(index, 1)">
                  <Icon icon="lucide:chevron-right" class="size-4" aria-hidden="true" />
                </Button>
                <Button type="button"
                  class="grid size-8 h-auto place-items-center rounded border-0 bg-black/70 p-0 text-white hover:bg-black/90 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent"
                  :disabled="busy" :title="t('userMedia.remove')" :aria-label="t('userMedia.remove')"
                  @click="void removeItem(item)">
                  <Icon icon="lucide:x" class="size-4" aria-hidden="true" />
                </Button>
              </div>
            </template>
          </MediaCard>
        </ul>
      </template>
    </main>
    <MobileTabBar :tabs="mobileTabs" />
  </div>
</template>