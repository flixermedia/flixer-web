<script setup lang="ts">
import { ModalContent, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { useI18n } from 'vue-i18n'

defineOptions({ modalGroup: 'default' })

defineProps<{ title: string; text: string }>()
const { close } = useModalContext<boolean>()
const { t } = useI18n()
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col rounded-2xl border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <ModalTitle class="shrink-0 text-lg font-semibold">{{ title }}</ModalTitle>
      <p class="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain whitespace-pre-line pr-1 text-sm leading-7 text-flixer-text/90">{{ text }}</p>
      <div class="mt-5 flex shrink-0 justify-end">
        <button type="button" class="flex h-11 items-center justify-center rounded-lg border border-flixer-border px-6 text-sm font-semibold text-flixer-text transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" @click="close()">{{ t('common.close') }}</button>
      </div>
    </ModalContent>
  </ModalRoot>
</template>
