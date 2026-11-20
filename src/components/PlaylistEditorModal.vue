<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { Button } from '@ui-sdk/vue/button'
import { Checkbox, CheckboxIndicator } from '@ui-sdk/vue/checkbox'
import { Field, FieldLabel } from '@ui-sdk/vue/field'
import { Input } from '@ui-sdk/vue/input'
import { Textarea } from '@ui-sdk/vue/textarea'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { createPlaylist, updatePlaylist, type PlaylistSummary } from '../api'
import { catchError } from '../utils/catchError'

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
    const [failure, result] = await catchError(props.playlist ? updatePlaylist(props.playlist.id, { name: name.value.trim(), description: description.value.trim(), isPublic: isPublic.value }) : createPlaylist({ name: name.value.trim(), description: description.value.trim() || undefined, isPublic: isPublic.value }))
    if (failure) {
      error.value = true
      return
    }
    confirm(result)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col rounded border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <header class="flixer-modal-header">
        <ModalTitle class="text-lg font-semibold text-white">{{ t(props.playlist ? 'social.editPlaylist' : 'social.createPlaylist') }}</ModalTitle>
        <ModalDescription class="mt-1 text-sm text-flixer-muted">{{ t('social.playlistDetails') }}</ModalDescription>
      </header>
      <form class="flixer-modal-form mt-4" @submit.prevent="save">
        <div class="flixer-modal-form-body gap-4">
          <Field class="gap-1">
            <FieldLabel class="text-sm font-medium text-white">{{ t('social.playlistName') }}</FieldLabel>
            <Input v-model="name" required maxlength="100" class="h-auto w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm font-medium leading-5 text-white focus:outline-none focus:ring-2 focus:ring-flixer-accent focus-visible:border-flixer-border" />
          </Field>
          <Field class="gap-1">
            <FieldLabel class="text-sm font-medium text-white">{{ t('social.description') }}</FieldLabel>
            <Textarea v-model="description" maxlength="500" rows="3" class="min-h-0 w-full resize-y rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm font-medium leading-5 text-white focus:outline-none focus:ring-2 focus:ring-flixer-accent focus-visible:border-flixer-border" />
          </Field>
          <label class="flex items-center gap-3 text-sm text-white">
            <Checkbox :checked="isPublic" class="mt-0 size-4 rounded-sm data-checked:border-flixer-accent data-checked:bg-flixer-accent" @update:checked="isPublic = $event === true">
              <CheckboxIndicator />
            </Checkbox>
            {{ t('social.publicPlaylist') }}
          </label>
          <p v-if="error" class="text-sm text-red-400" role="alert">{{ t('social.saveError') }}</p>
        </div>
        <div class="flixer-modal-actions flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
          <Button type="button" class="h-11 rounded border border-flixer-border bg-transparent px-5 text-sm font-semibold text-flixer-text hover:bg-white/5" @click="close()">{{ t('common.cancel') }}</Button><Button type="submit" class="h-11 rounded border-0 bg-white px-5 text-sm font-bold text-flixer-background hover:bg-white disabled:opacity-50" :disabled="busy || !name.trim()">{{ busy ? t('social.saving') : t('common.save') }}</Button>
        </div>
      </form>
    </ModalContent>
  </ModalRoot>
</template>
