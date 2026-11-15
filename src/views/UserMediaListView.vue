<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import type { SocialItem } from 'flixer-api-client'
import { clearRecommendationFeedback, clearVideoQueue, getDismissedRecommendations } from '../api/userMedia'
import AuthImage from '../components/ui/AuthImage.vue'
import MobileTabBar from '../components/home/MobileTabBar.vue'
import { confirmAction } from '../composables/confirm'
import { getMobileTabs } from '../composables/homeNav'
import { useVideoQueue } from '../composables/useVideoQueue'
import { useVideoOverlay } from '../composables/useVideoOverlay'

const props = withDefaults(defineProps<{ kind: 'queue' | 'dismissed'; embedded?: boolean }>(), { embedded: false })
const { t } = useI18n()
const queue = useVideoQueue()
const player = useVideoOverlay()
const mobileTabs = computed(getMobileTabs)
const saved = ref<SocialItem[]>([])
const items = computed(() => props.kind === 'queue' ? queue.items.value : saved.value)
const loading = ref(false)
const busy = ref(false)
const failed = ref(false)

async function load() {
  loading.value = true
  failed.value = false
  try {
    if (props.kind === 'queue') await queue.load()
    else saved.value = await getDismissedRecommendations()
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
}
async function remove(item: SocialItem) {
  if (busy.value) return
  busy.value = true
  try {
    if (props.kind === 'queue') await queue.remove(item.id)
    else {
      await clearRecommendationFeedback(item.id)
      saved.value = saved.value.filter((entry) => entry.id !== item.id)
    }
  } catch {
    failed.value = true
  } finally {
    busy.value = false
  }
}
async function clear() {
  if (busy.value || !(await confirmAction(t('userMedia.clearConfirm'), { confirmLabel: t('userMedia.clear'), danger: true }))) return
  busy.value = true
  try {
    await clearVideoQueue()
    await queue.load()
  } catch {
    failed.value = true
  } finally {
    busy.value = false
  }
}
async function play(item: SocialItem) {
  if (busy.value) return
  busy.value = true
  try {
    if (await queue.remove(item.id)) player.play({ id: item.id, title: item.title })
  } catch {
    failed.value = true
  } finally {
    busy.value = false
  }
}
async function move(index: number, direction: -1 | 1) {
  const target = index + direction
  if (busy.value || target < 0 || target >= items.value.length) return
  const order = items.value.map((item) => item.id)
  ;[order[index], order[target]] = [order[target]!, order[index]!]
  busy.value = true
  try { await queue.reorder(order) } catch { failed.value = true } finally { busy.value = false }
}
watch(() => props.kind, () => void load(), { immediate: true })
</script>

<template>
  <div :class="embedded ? 'font-sans text-flixer-text' : 'min-h-screen bg-flixer-background pb-24 font-sans text-flixer-text md:pb-12'">
    <component :is="embedded ? 'div' : 'main'" :class="embedded ? '' : 'page-gutter pt-28 sm:pt-32'">
      <header class="flex flex-wrap items-center justify-between gap-4 border-b border-flixer-border pb-5">
        <component :is="embedded ? 'h3' : 'h1'" :class="embedded ? 'text-lg font-semibold text-white' : 'text-3xl font-bold text-white'">{{ t(kind === 'queue' ? 'userMedia.queue' : 'recommendationReview.title') }}</component>
        <button v-if="kind === 'queue' && items.length" type="button" class="inline-flex items-center gap-2 rounded border border-flixer-border px-3 py-2 text-sm hover:bg-white/10 disabled:opacity-50" :disabled="busy" @click="clear"><Icon icon="lucide:trash-2" class="size-4" aria-hidden="true" />{{ t('userMedia.clear') }}</button>
      </header>
      <p v-if="failed" class="mt-5 text-sm text-red-400" role="alert">{{ t('userMedia.error') }}</p>
      <p v-if="loading" class="mt-5 text-sm text-flixer-muted" role="status">{{ t('common.loading') }}</p>
      <p v-else-if="!items.length && !failed" class="mt-5 text-sm text-flixer-muted">{{ t('userMedia.empty') }}</p>
      <ol v-else class="divide-y divide-flixer-border">
        <li v-for="(item, index) in items" :key="item.id" class="flex min-w-0 items-center gap-2 py-3 sm:gap-4">
          <span class="grid size-14 shrink-0 place-items-center overflow-hidden rounded bg-flixer-surface text-flixer-muted">
            <AuthImage v-if="item.imageIndex !== null" scope="library" :item-id="item.imageItemId" :index="item.imageIndex" :version="item.imageUpdatedAt" :width="112" alt="" />
            <Icon v-else icon="lucide:film" class="size-6" aria-hidden="true" />
          </span>
          <RouterLink :to="{ name: 'media-item', params: { id: item.id } }" class="min-w-0 flex-1"><span class="block truncate font-semibold text-white hover:underline">{{ item.title }}</span><span v-if="item.subtitle" class="block truncate text-sm text-flixer-muted">{{ item.subtitle }}</span></RouterLink>
          <div v-if="kind === 'queue'" class="flex shrink-0 flex-col"><button type="button" class="grid size-8 place-items-center rounded text-flixer-muted hover:bg-white/10 hover:text-white disabled:opacity-30" :disabled="busy || index === 0" :title="t('userMediaOrder.up')" :aria-label="t('userMediaOrder.up')" @click="move(index, -1)"><Icon icon="lucide:chevron-up" class="size-4" aria-hidden="true" /></button><button type="button" class="grid size-8 place-items-center rounded text-flixer-muted hover:bg-white/10 hover:text-white disabled:opacity-30" :disabled="busy || index === items.length - 1" :title="t('userMediaOrder.down')" :aria-label="t('userMediaOrder.down')" @click="move(index, 1)"><Icon icon="lucide:chevron-down" class="size-4" aria-hidden="true" /></button></div>
          <button v-if="kind === 'queue'" type="button" class="grid size-10 shrink-0 place-items-center rounded text-flixer-muted hover:bg-white/10 hover:text-white disabled:opacity-50" :disabled="busy" :title="t('mediaItem.play')" :aria-label="t('mediaItem.play')" @click="play(item)"><Icon icon="lucide:play" class="size-5" aria-hidden="true" /></button>
          <button type="button" class="grid size-10 shrink-0 place-items-center rounded text-flixer-muted hover:bg-white/10 hover:text-white disabled:opacity-50" :disabled="busy" :title="t(kind === 'dismissed' ? 'recommendationReview.restore' : 'userMedia.remove')" :aria-label="t(kind === 'dismissed' ? 'recommendationReview.restore' : 'userMedia.remove')" @click="remove(item)"><Icon :icon="kind === 'dismissed' ? 'lucide:rotate-ccw' : 'lucide:x'" class="size-5" aria-hidden="true" /></button>
        </li>
      </ol>
    </component>
    <MobileTabBar v-if="!embedded" :tabs="mobileTabs" />
  </div>
</template>