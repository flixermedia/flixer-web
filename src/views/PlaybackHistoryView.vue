<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { deletePlaybackHistory, getPlaybackHistory, type PlaybackHistoryEntry } from '../api/userMedia'
import AuthImage from '../components/ui/AuthImage.vue'
import MobileTabBar from '../components/home/MobileTabBar.vue'
import { confirmAction } from '../composables/confirm'
import { getMobileTabs } from '../composables/homeNav'

withDefaults(defineProps<{ embedded?: boolean }>(), { embedded: false })
const { t, locale } = useI18n()
const mobileTabs = computed(getMobileTabs)
const entries = ref<PlaybackHistoryEntry[]>([])
const loading = ref(false)
const failed = ref(false)
const hasMore = ref(false)
const PAGE_SIZE = 25
const pageIndex = ref(0)
const busy = ref(false)

async function load(targetPage = pageIndex.value) {
  if (loading.value) return
  loading.value = true
  failed.value = false
  try {
    const page = await getPlaybackHistory(targetPage * PAGE_SIZE, PAGE_SIZE)
    entries.value = page.entries
    pageIndex.value = targetPage
    hasMore.value = page.hasMore
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
}

async function remove(id: string) {
  if (busy.value) return
  busy.value = true
  try {
    await deletePlaybackHistory(id)
    entries.value = entries.value.filter((entry) => entry.id !== id)
    await load(entries.value.length === 0 && pageIndex.value > 0 ? pageIndex.value - 1 : pageIndex.value)
  } catch {
    failed.value = true
  } finally {
    busy.value = false
  }
}

async function clear() {
  if (busy.value || !(await confirmAction(t('playbackHistory.clearConfirm'), { confirmLabel: t('playbackHistory.clear'), danger: true }))) return
  busy.value = true
  try {
    await deletePlaybackHistory()
    entries.value = []
    pageIndex.value = 0
    hasMore.value = false
  } catch {
    failed.value = true
  } finally {
    busy.value = false
  }
}

function date(value: string) {
  return new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

onMounted(() => void load(0))
</script>

<template>
  <div :class="embedded ? 'font-sans text-flixer-text' : 'min-h-screen bg-flixer-background pb-24 font-sans text-flixer-text md:pb-12'">
    <component :is="embedded ? 'div' : 'main'" :class="embedded ? '' : 'page-gutter pt-28 sm:pt-32'">
      <header class="flex flex-wrap items-center justify-between gap-4 border-b border-flixer-border pb-5">
        <component :is="embedded ? 'h3' : 'h1'" :class="embedded ? 'text-lg font-semibold text-white' : 'text-3xl font-bold text-white'">{{ t('playbackHistory.title') }}</component>
        <button v-if="entries.length" type="button" class="inline-flex items-center gap-2 rounded border border-flixer-border px-3 py-2 text-sm text-flixer-text hover:bg-white/10 disabled:opacity-50" :disabled="busy" @click="clear">
          <Icon icon="lucide:trash-2" class="size-4" aria-hidden="true" />{{ t('playbackHistory.clear') }}
        </button>
      </header>
      <p v-if="failed" class="mt-5 text-sm text-red-400" role="alert">{{ t('playbackHistory.error') }}</p>
      <p v-if="loading && !entries.length" class="mt-5 text-sm text-flixer-muted" role="status">{{ t('common.loading') }}</p>
      <p v-else-if="!entries.length && !failed" class="mt-5 text-sm text-flixer-muted">{{ t('playbackHistory.empty') }}</p>
      <ol v-if="entries.length" class="divide-y divide-flixer-border">
        <li v-for="entry in entries" :key="entry.id" class="flex min-w-0 items-center gap-3 py-3 sm:gap-4">
          <span class="grid size-14 shrink-0 place-items-center overflow-hidden rounded bg-flixer-surface text-flixer-muted">
            <AuthImage v-if="entry.item && entry.item.imageIndex !== null" scope="library" :item-id="entry.item.imageItemId" :index="entry.item.imageIndex" :version="entry.item.imageUpdatedAt" :width="112" alt="" />
            <Icon v-else :icon="entry.kind === 'live' ? 'lucide:radio' : 'lucide:film'" class="size-6" aria-hidden="true" />
          </span>
          <div class="min-w-0 flex-1">
            <RouterLink v-if="entry.item" :to="{ name: 'media-item', params: { id: entry.item.id } }" class="block truncate font-semibold text-white hover:underline">{{ entry.item.title }}</RouterLink>
            <p v-else class="truncate font-semibold text-white">{{ entry.channelName }}</p>
            <p v-if="entry.item?.subtitle" class="truncate text-sm text-flixer-muted">{{ entry.item.subtitle }}</p>
            <time class="block text-xs text-flixer-muted" :datetime="entry.startedAt">{{ date(entry.startedAt) }}</time>
          </div>
          <button type="button" class="grid size-10 shrink-0 place-items-center rounded text-flixer-muted hover:bg-white/10 hover:text-white disabled:opacity-50" :disabled="busy" :title="t('playbackHistory.remove')" :aria-label="t('playbackHistory.remove')" @click="remove(entry.id)"><Icon icon="lucide:x" class="size-5" aria-hidden="true" /></button>
        </li>
      </ol>
      <nav v-if="pageIndex > 0 || hasMore" class="mt-5 flex items-center justify-between gap-3" :aria-label="t('playbackHistory.pagination')">
        <button type="button" class="inline-flex items-center gap-1 rounded border border-flixer-border px-3 py-2 text-sm hover:bg-white/10 disabled:opacity-40" :disabled="loading || busy || pageIndex === 0" @click="load(pageIndex - 1)"><Icon icon="lucide:chevron-left" class="size-4" aria-hidden="true" />{{ t('playbackHistory.previous') }}</button>
        <span class="text-sm tabular-nums text-flixer-muted">{{ t('playbackHistory.page', { page: pageIndex + 1 }) }}</span>
        <button type="button" class="inline-flex items-center gap-1 rounded border border-flixer-border px-3 py-2 text-sm hover:bg-white/10 disabled:opacity-40" :disabled="loading || busy || !hasMore" @click="load(pageIndex + 1)">{{ t('playbackHistory.next') }}<Icon icon="lucide:chevron-right" class="size-4" aria-hidden="true" /></button>
      </nav>
      <button v-if="failed && !entries.length" type="button" class="mt-4 rounded bg-white/10 px-4 py-2 text-sm hover:bg-white/20" @click="load()">{{ t('home.retry') }}</button>
    </component>
    <MobileTabBar v-if="!embedded" :tabs="mobileTabs" />
  </div>
</template>