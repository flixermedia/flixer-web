<script setup lang="ts">
import { Button } from '@ui-sdk/vue/button'
import { Field, FieldLabel } from '@ui-sdk/vue/field'
import { Input } from '@ui-sdk/vue/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui-sdk/vue/select'
import { openModal } from '@kolirt/vue-modal'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { createMediaLibrary, updateMediaLibrary, type MediaImageStorage, type MediaLibrary, type MediaLibraryType } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'

import AdminToggle from './AdminToggle.vue'
import MediaFolderPicker, { type PickedFolder } from './MediaFolderPicker.vue'

const props = defineProps<{ library?: MediaLibrary }>()
const emit = defineEmits<{ saved: [library: MediaLibrary]; cancel: [] }>()

const { t } = useI18n()

const TYPES: MediaLibraryType[] = ['movies', 'tvshows', 'music', 'homevideos', 'mixed']
const IMAGE_STORAGES: MediaImageStorage[] = ['cache', 'alongside']
const typeOptions = computed(() => TYPES.map((value) => ({ value, label: t(`admin.libraries.types.${value}`) })))
const imageStorageOptions = computed(() => IMAGE_STORAGES.map((value) => ({ value, label: t(`admin.libraries.imageStorages.${value}`) })))

const name = ref(props.library?.name ?? '')
const type = ref<MediaLibraryType>(props.library?.type ?? 'movies')
const folders = ref<PickedFolder[]>((props.library?.folders ?? []).map((folder) => ({ rootId: folder.rootId, path: folder.path, label: folder.location || folder.path })))
const imageStorage = ref<MediaImageStorage>(props.library?.imageStorage ?? 'cache')
const ignoreLocalImages = ref(props.library?.ignoreLocalImages ?? false)
const saving = ref(false)
const error = ref('')

const canSave = computed(() => name.value.trim().length > 0 && folders.value.length > 0 && !saving.value)

async function addFolder() {
  const pickedFolders = await openModal<PickedFolder[]>(MediaFolderPicker).catch(() => null)
  if (!pickedFolders) return

  for (const folder of pickedFolders) {
    if (!folders.value.some((entry) => entry.rootId === folder.rootId && entry.path === folder.path)) folders.value.push(folder)
  }
}

async function save() {
  if (!canSave.value) return
  saving.value = true
  error.value = ''
  const input = { name: name.value.trim(), type: type.value, imageStorage: imageStorage.value, ignoreLocalImages: ignoreLocalImages.value, folders: folders.value.map(({ rootId, path }) => ({ rootId, path })) }
  try {
    const [requestError, saved] = await catchError(props.library ? updateMediaLibrary(props.library.id, input) : createMediaLibrary(input))
    if (requestError) {
      error.value = describeRequestError(requestError, t('admin.libraries.saveError'))
    } else {
      notify.success(t(props.library ? 'admin.libraries.updated' : 'admin.libraries.created'))
      emit('saved', saved)
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form class="flixer-modal-form" @submit.prevent="save">
    <div class="flixer-modal-form-body gap-4">
      <div class="grid gap-3 sm:grid-cols-2">
        <Field class="flex flex-col gap-1 text-xs text-flixer-muted">
          <FieldLabel class="text-xs font-normal text-flixer-muted">{{ t('admin.libraries.name') }}</FieldLabel>
          <Input v-model="name" maxlength="100" required :placeholder="t('admin.libraries.namePlaceholder')"
            class="h-auto rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm text-flixer-text" />
        </Field>
        <Field class="flex flex-col gap-1 text-xs text-flixer-muted">
          <FieldLabel class="text-xs font-normal text-flixer-muted">{{ t('admin.libraries.contentType') }}</FieldLabel>
          <Select v-model:value="type" :items="typeOptions">
            <SelectTrigger class="h-auto min-h-9 w-full rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-left text-sm text-flixer-text focus-visible:outline-2 focus-visible:outline-flixer-accent">
              <SelectValue />
            </SelectTrigger>
            <SelectContent class="max-h-64 rounded border border-flixer-border bg-flixer-surface p-1 text-sm text-flixer-text shadow-xl">
              <SelectItem v-for="option in typeOptions" :key="option.value" :value="option.value" class="cursor-pointer rounded px-3 py-2 outline-none data-highlighted:bg-white/10 data-selected:bg-white/10">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field class="flex flex-col gap-1 text-xs text-flixer-muted">
          <FieldLabel class="text-xs font-normal text-flixer-muted">{{ t('admin.libraries.imageStorage') }}</FieldLabel>
          <Select v-model:value="imageStorage" :items="imageStorageOptions">
            <SelectTrigger class="h-auto min-h-9 w-full rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-left text-sm text-flixer-text focus-visible:outline-2 focus-visible:outline-flixer-accent">
              <SelectValue />
            </SelectTrigger>
            <SelectContent class="rounded border border-flixer-border bg-flixer-surface p-1 text-sm text-flixer-text shadow-xl">
              <SelectItem v-for="option in imageStorageOptions" :key="option.value" :value="option.value" class="cursor-pointer rounded px-3 py-2 outline-none data-highlighted:bg-white/10 data-selected:bg-white/10">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <AdminToggle v-model="ignoreLocalImages" :label="t('admin.libraries.ignoreLocalImages')"
        :description="t('admin.libraries.ignoreLocalImagesDescription')" />

      <div>
        <p class="text-xs font-semibold text-flixer-muted">{{ t('admin.libraries.folders') }}</p>
        <ul class="mt-2 grid gap-2">
          <li v-for="(folder, index) in folders" :key="`${folder.rootId}/${folder.path}`"
            class="flex items-center justify-between gap-3 rounded bg-white/5 px-3 py-2 text-xs">
            <span class="min-w-0 truncate font-mono">{{ folder.label }}</span>
            <button type="button" class="text-red-300 hover:underline" @click="folders.splice(index, 1)">{{
              t('admin.libraries.remove') }}</button>
          </li>
          <li v-if="folders.length === 0" class="text-xs text-flixer-muted">{{ t('admin.libraries.noFolders') }}</li>
        </ul>
        <button type="button" class="mt-2 text-xs text-flixer-accent hover:underline" @click="addFolder">{{
          t('admin.libraries.addFolder') }}</button>
      </div>

      <p v-if="error" role="alert" class="text-sm text-red-300">{{ error }}</p>

    </div>
    <div class="flixer-modal-actions flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <Button type="button" class="h-11 rounded border border-flixer-border bg-transparent px-6 text-sm font-semibold text-flixer-text transition hover:bg-white/5"
        @click="emit('cancel')">{{ t('admin.libraries.cancel') }}</Button>
      <Button type="submit" :disabled="!canSave" data-agent-confirm="Creates or updates a media library and associates its selected folders"
        class="h-11 rounded border-0 bg-flixer-primary px-6 text-sm font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-50">{{
          t('admin.libraries.save') }}</Button>
    </div>
  </form>
</template>
