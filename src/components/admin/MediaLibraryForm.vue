<script setup lang="ts">
import { openModal } from '@kolirt/vue-modal'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { createMediaLibrary, updateMediaLibrary, type MediaImageStorage, type MediaLibrary, type MediaLibraryType } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'

import MediaFolderPicker, { type PickedFolder } from './MediaFolderPicker.vue'

const props = defineProps<{ library?: MediaLibrary }>()
const emit = defineEmits<{ saved: [library: MediaLibrary]; cancel: [] }>()

const { t } = useI18n()

const TYPES: MediaLibraryType[] = ['movies', 'tvshows', 'music', 'homevideos', 'mixed']
const IMAGE_STORAGES: MediaImageStorage[] = ['cache', 'alongside']

const name = ref(props.library?.name ?? '')
const type = ref<MediaLibraryType>(props.library?.type ?? 'movies')
const folders = ref<PickedFolder[]>((props.library?.folders ?? []).map((folder) => ({ rootId: folder.rootId, path: folder.path, label: folder.location || folder.path })))
const imageStorage = ref<MediaImageStorage>(props.library?.imageStorage ?? 'cache')
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
  const input = { name: name.value.trim(), type: type.value, imageStorage: imageStorage.value, folders: folders.value.map(({ rootId, path }) => ({ rootId, path })) }
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
  <form class="grid gap-4" @submit.prevent="save">
    <div class="grid gap-3 sm:grid-cols-2">
      <label class="flex flex-col gap-1 text-xs text-flixer-muted">
        {{ t('admin.libraries.name') }}
        <input v-model="name" type="text" maxlength="100" required :placeholder="t('admin.libraries.namePlaceholder')"
          class="rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm text-flixer-text" />
      </label>
      <label class="flex flex-col gap-1 text-xs text-flixer-muted">
        {{ t('admin.libraries.contentType') }}
        <select v-model="type"
          class="rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm text-flixer-text">
          <option v-for="option in TYPES" :key="option" :value="option">{{ t(`admin.libraries.types.${option}`) }}
          </option>
        </select>
      </label>
      <label class="flex flex-col gap-1 text-xs text-flixer-muted">
        {{ t('admin.libraries.imageStorage') }}
        <select v-model="imageStorage"
          class="rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm text-flixer-text">
          <option v-for="option in IMAGE_STORAGES" :key="option" :value="option">{{
            t(`admin.libraries.imageStorages.${option}`) }}</option>
        </select>
      </label>
    </div>

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

    <div class="flex gap-2">
      <button type="submit" :disabled="!canSave"
        class="rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-50">{{
          t('admin.libraries.save') }}</button>
      <button type="button" class="rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15"
        @click="emit('cancel')">{{ t('admin.libraries.cancel') }}</button>
    </div>
  </form>
</template>
