<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { useI18n } from 'vue-i18n'
import SubtitlePanel from './SubtitlePanel.vue'

defineProps<{ itemId: string; title: string }>()

defineOptions({ modalGroup: 'default' })

const { close } = useModalContext<boolean>()
const { t } = useI18n()
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col rounded-2xl border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <ModalTitle class="shrink-0 text-lg font-semibold">{{ t('subtitles.modalTitle', { title }) }}</ModalTitle>
      <ModalDescription class="mt-1 shrink-0 text-sm leading-6 text-flixer-muted">{{ t('subtitles.modalDescription') }}</ModalDescription>
      <div class="mt-4 min-h-24 flex-1 overflow-y-auto pr-1">
        <SubtitlePanel :item-id="itemId" />
      </div>
      <div class="mt-5 flex shrink-0 justify-end">
        <button type="button" class="rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15" @click="close()">{{ t('common.close') }}</button>
      </div>
    </ModalContent>
  </ModalRoot>
</template>
