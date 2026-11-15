<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { addVideoCollectionItem, createVideoCollection, getVideoCollections, type VideoCollection } from '../api/userMedia'

defineOptions({ modalGroup: 'default' })
const props = defineProps<{ itemId: string; title: string }>()
const { close } = useModalContext<void>()
const { t } = useI18n()
const collections = ref<VideoCollection[]>([])
const added = ref(new Set<string>())
const name = ref('')
const busy = ref(false)
const failed = ref(false)

async function load() {
  try { collections.value = await getVideoCollections() } catch { failed.value = true }
}
async function add(collection: VideoCollection) {
  if (busy.value) return
  busy.value = true
  failed.value = false
  try {
    await addVideoCollectionItem(collection.id, props.itemId)
    added.value = new Set([...added.value, collection.id])
  } catch { failed.value = true } finally { busy.value = false }
}
async function create() {
  if (busy.value || !name.value.trim()) return
  busy.value = true
  failed.value = false
  try {
    const collection = await createVideoCollection({ name: name.value.trim() })
    collections.value = [collection, ...collections.value]
    await addVideoCollectionItem(collection.id, props.itemId)
    added.value = new Set([...added.value, collection.id])
    name.value = ''
  } catch { failed.value = true } finally { busy.value = false }
}
onMounted(() => void load())
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col rounded border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <header class="flixer-modal-header"><ModalTitle class="text-lg font-semibold text-white">{{ t('userMedia.addCollection') }}</ModalTitle><ModalDescription class="mt-1 truncate text-sm text-flixer-muted">{{ title }}</ModalDescription></header>
      <div class="mt-4 min-h-0 overflow-y-auto">
        <p v-if="failed" class="mb-2 text-sm text-red-400" role="alert">{{ t('userMedia.error') }}</p>
        <p v-if="!collections.length && !failed" class="py-3 text-sm text-flixer-muted">{{ t('userMedia.empty') }}</p>
        <button v-for="collection in collections" :key="collection.id" type="button" class="flex w-full items-center gap-3 rounded px-3 py-3 text-left text-sm text-white hover:bg-white/10 disabled:opacity-60" :disabled="busy || added.has(collection.id)" @click="add(collection)"><span class="min-w-0 flex-1 truncate">{{ collection.name }}</span><Icon v-if="added.has(collection.id)" icon="lucide:check" class="size-4" aria-hidden="true" /><Icon v-else icon="lucide:plus" class="size-4" aria-hidden="true" /></button>
      </div>
      <form class="mt-4 flex gap-2" @submit.prevent="create"><input v-model="name" maxlength="100" class="min-w-0 flex-1 rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-white" :placeholder="t('userMedia.name')" :aria-label="t('userMedia.name')" /><button type="submit" class="rounded bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-50" :disabled="!name.trim() || busy">{{ t('social.create') }}</button></form>
      <div class="flixer-modal-actions mt-5 flex justify-end"><button type="button" class="h-11 rounded border border-flixer-border px-4 text-sm font-semibold hover:bg-white/5" @click="close()">{{ t('common.close') }}</button></div>
    </ModalContent>
  </ModalRoot>
</template>