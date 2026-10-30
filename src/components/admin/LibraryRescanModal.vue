<script setup lang="ts">
import { computed, ref } from 'vue'
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { useI18n } from 'vue-i18n'
import type { MediaLibrary } from '../../api'

defineOptions({ modalGroup: 'default' })

const props = defineProps<{ library: MediaLibrary }>()
const { close, confirm } = useModalContext<string[]>()
const { t } = useI18n()
const selected = ref<string[]>([])

const choices = computed(() => {
  const items = [
    { id: 'images', label: 'imagesJob', description: 'imagesJobDescription', visible: true },
    { id: 'descriptions', label: 'descriptionsJob', description: 'descriptionsJobDescription', visible: true },
    { id: 'fileData', label: 'fileDataJob', description: 'fileDataJobDescription', visible: true },
    { id: 'lyrics', label: 'lyricsJob', description: 'lyricsJobDescription', visible: props.library.type === 'music' },
    { id: 'trickplay', label: 'trickplayJob', description: 'trickplayJobDescription', visible: props.library.type !== 'music' },
    {
      id: 'themes',
      label: 'themesJob',
      description: 'themesJobDescription',
      visible: ['movies', 'tvshows', 'mixed'].includes(props.library.type),
    },
    {
      id: 'movieSegments',
      label: 'movieSegmentsJob',
      description: 'movieSegmentsJobDescription',
      visible: ['movies', 'mixed'].includes(props.library.type),
    },
    {
      id: 'tvSegments',
      label: 'tvSegmentsJob',
      description: 'tvSegmentsJobDescription',
      visible: ['tvshows', 'mixed'].includes(props.library.type),
    },
  ]
  return items.filter((item) => item.visible)
})

function toggle(id: string, checked: boolean) {
  selected.value = checked ? [...selected.value, id] : selected.value.filter((entry) => entry !== id)
}
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col rounded border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <ModalTitle class="text-lg font-semibold">{{ t('admin.libraries.rescanOptionsTitle') }}</ModalTitle>
      <ModalDescription class="mt-1 text-sm leading-6 text-flixer-muted">
        {{ t('admin.libraries.rescanOptionsDescription', { library: props.library.name }) }}
      </ModalDescription>
      <fieldset class="mt-5 grid gap-2 overflow-y-auto">
        <legend class="sr-only">{{ t('admin.libraries.rescanOptionsTitle') }}</legend>
        <label v-for="choice in choices" :key="choice.id" class="flex cursor-pointer items-start gap-3 rounded border border-flixer-border bg-flixer-background/50 p-3 transition hover:bg-white/5">
          <input type="checkbox" :checked="selected.includes(choice.id)" class="mt-1 accent-flixer-primary" @change="toggle(choice.id, ($event.target as HTMLInputElement).checked)" />
          <span class="grid gap-0.5">
            <span class="text-sm font-semibold">{{ t(`admin.libraries.${choice.label}`) }}</span>
            <span class="text-xs leading-5 text-flixer-muted">{{ t(`admin.libraries.${choice.description}`) }}</span>
          </span>
        </label>
      </fieldset>
      <div class="mt-5 flex flex-wrap justify-end gap-2">
        <button type="button" class="rounded border border-flixer-border px-4 py-2 text-sm font-semibold transition hover:bg-white/5" @click="close()">
          {{ t('admin.libraries.cancel') }}
        </button>
        <button type="button" class="rounded bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/15" @click="confirm(['full'])">
          {{ t('admin.libraries.fullRescanAll') }}
        </button>
        <button type="button" :disabled="selected.length === 0" class="rounded bg-flixer-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-flixer-primary/80 disabled:cursor-not-allowed disabled:opacity-50" @click="confirm(selected)">
          {{ t('admin.libraries.runSelected') }}
        </button>
      </div>
      <p class="mt-3 text-xs leading-5 text-flixer-muted">{{ t('admin.libraries.fullRescanWarning') }}</p>
    </ModalContent>
  </ModalRoot>
</template>
