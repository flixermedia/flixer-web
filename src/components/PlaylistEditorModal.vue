<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { createPlaylist, updatePlaylist, type PlaylistSummary } from '../api'

defineOptions({ modalGroup: 'default' })
const props = defineProps<{ playlist?: PlaylistSummary }>()
const { close, confirm } = useModalContext<PlaylistSummary>()
const { t } = useI18n()
const name = ref(props.playlist?.name ?? '')
const description = ref(props.playlist?.description ?? '')
const isPublic = ref(props.playlist?.isPublic ?? true)
const busy = ref(false)
const error = ref(false)
async function save() {
  if (busy.value || !name.value.trim()) return
  busy.value = true
  error.value = false
  try {
    const result = props.playlist ? await updatePlaylist(props.playlist.id, { name: name.value.trim(), description: description.value.trim(), isPublic: isPublic.value }) : await createPlaylist({ name: name.value.trim(), description: description.value.trim() || undefined, isPublic: isPublic.value })
    confirm(result)
  } catch {
    error.value = true
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col rounded-2xl border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <ModalTitle class="text-lg font-semibold text-white">{{ t(props.playlist ? 'social.editPlaylist' : 'social.createPlaylist') }}</ModalTitle>
      <ModalDescription class="mt-1 text-sm text-flixer-muted">{{ t('social.playlistDetails') }}</ModalDescription>
      <form class="mt-4 space-y-4 overflow-y-auto p-1 -mx-1" @submit.prevent="save">
        <label class="block space-y-1 text-sm font-medium text-white"
          ><span>{{ t('social.playlistName') }}</span
          ><input v-model="name" required maxlength="100" class="w-full rounded-lg border border-flixer-border bg-flixer-background px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-flixer-accent"
        /></label>
        <label class="block space-y-1 text-sm font-medium text-white"
          ><span>{{ t('social.description') }}</span
          ><textarea v-model="description" maxlength="500" rows="3" class="w-full resize-y rounded-lg border border-flixer-border bg-flixer-background px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-flixer-accent"></textarea>
        </label>
        <label class="flex items-center gap-3 text-sm text-white"><input v-model="isPublic" type="checkbox" class="size-4 accent-flixer-accent" />{{ t('social.publicPlaylist') }}</label>
        <p v-if="error" class="text-sm text-red-400" role="alert">{{ t('social.saveError') }}</p>
        <div class="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
          <button type="button" class="h-11 rounded-lg border border-flixer-border px-5 text-sm font-semibold hover:bg-white/5" @click="close()">{{ t('common.cancel') }}</button><button type="submit" class="h-11 rounded-lg bg-white px-5 text-sm font-bold text-flixer-background disabled:opacity-50" :disabled="busy || !name.trim()">{{ busy ? t('social.saving') : t('common.save') }}</button>
        </div>
      </form>
    </ModalContent>
  </ModalRoot>
</template>
