<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { useI18n } from 'vue-i18n'
import type { MediaLibrary } from '../../api'
import MediaLibraryForm from './MediaLibraryForm.vue'

defineOptions({ modalGroup: 'default' })

defineProps<{ library?: MediaLibrary }>()

const { close, confirm } = useModalContext<boolean>()
const { t } = useI18n()
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col rounded border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <ModalTitle class="shrink-0 text-lg font-semibold">{{ library ? t('admin.libraries.editLibrary') : t('admin.libraries.addLibrary') }}</ModalTitle>
      <ModalDescription class="mt-1 shrink-0 text-sm leading-6 text-flixer-muted">{{ t('admin.libraries.addLibraryDescription') }}</ModalDescription>
      <div class="mt-5 min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <MediaLibraryForm :library="library" @saved="confirm(true)" @cancel="close()" />
      </div>
    </ModalContent>
  </ModalRoot>
</template>
