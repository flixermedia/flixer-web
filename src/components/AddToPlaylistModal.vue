<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { addPlaylistItem, createPlaylist, getPlaylists, getPlaylistsContaining, removePlaylistItem, type PlaylistSummary } from '../api'

defineOptions({ modalGroup: 'default' })
const props = defineProps<{ itemId: string; title: string }>()
const { close } = useModalContext<void>()
const { t } = useI18n()
const playlists = ref<PlaylistSummary[]>([])
const selected = ref(new Set<string>())
const name = ref('')
const busy = ref(false)
const error = ref(false)

async function load() {
  try {
    const [{ playlists: own }, { playlistIds }] = await Promise.all([getPlaylists(), getPlaylistsContaining(props.itemId)])
    playlists.value = own
    selected.value = new Set(playlistIds)
  } catch {
    error.value = true
  }
}
async function toggle(playlist: PlaylistSummary) {
  if (busy.value) return
  busy.value = true
  const wasSelected = selected.value.has(playlist.id)
  const next = new Set(selected.value)
  wasSelected ? next.delete(playlist.id) : next.add(playlist.id)
  selected.value = next
  try {
    if (wasSelected) {
      await removePlaylistItem(playlist.id, props.itemId)
    } else await addPlaylistItem(playlist.id, props.itemId)
  } catch {
    selected.value = new Set(wasSelected ? [...selected.value, playlist.id] : [...selected.value].filter((id) => id !== playlist.id))
    error.value = true
  } finally {
    busy.value = false
  }
}
async function create() {
  if (!name.value.trim() || busy.value) return
  busy.value = true
  error.value = false
  try {
    const playlist = await createPlaylist({ name: name.value.trim() })
    playlists.value = [playlist, ...playlists.value]
    await addPlaylistItem(playlist.id, props.itemId)
    selected.value = new Set([...selected.value, playlist.id])
    name.value = ''
  } catch {
    error.value = true
  } finally {
    busy.value = false
  }
}
onMounted(() => void load())
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col rounded-2xl border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <ModalTitle class="text-lg font-semibold text-white">{{ t('social.addToPlaylist') }}</ModalTitle>
      <ModalDescription class="mt-1 truncate text-sm text-flixer-muted">{{ title }}</ModalDescription>
      <div class="mt-4 min-h-0 space-y-1 overflow-y-auto p-1 -mx-1">
        <p v-if="error" class="mb-2 text-sm text-red-400" role="alert">{{ t('social.saveError') }}</p>
        <p v-if="!playlists.length" class="px-2 py-3 text-sm text-flixer-muted">{{ t('social.noPlaylists') }}</p>
        <label v-for="playlist in playlists" :key="playlist.id" class="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-sm text-white transition motion-reduce:transition-none hover:bg-white/10">
          <input type="checkbox" class="size-4 accent-flixer-accent" :checked="selected.has(playlist.id)" :disabled="busy" @change="toggle(playlist)" />
          <span class="min-w-0 flex-1 truncate">{{ playlist.name }}</span
          ><span class="text-xs text-flixer-muted">{{ playlist.trackCount }}</span>
        </label>
      </div>
      <form class="mt-4 flex gap-2" @submit.prevent="create">
        <input v-model="name" maxlength="100" class="min-w-0 flex-1 rounded-lg border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-flixer-accent" :placeholder="t('social.playlistName')" :aria-label="t('social.playlistName')" />
        <button type="submit" class="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-50" :disabled="!name.trim() || busy">{{ t('social.create') }}</button>
      </form>
      <button type="button" class="mt-5 h-11 rounded-lg border border-flixer-border px-4 text-sm font-semibold text-flixer-text hover:bg-white/5" @click="close()">{{ t('common.close') }}</button>
    </ModalContent>
  </ModalRoot>
</template>
