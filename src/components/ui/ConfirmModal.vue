<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { useI18n } from 'vue-i18n'

defineOptions({ modalGroup: 'default' })

defineProps<{ title?: string; message: string; confirmLabel?: string; danger?: boolean }>()

const { close, confirm } = useModalContext<boolean>()
const { t } = useI18n()
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col rounded-2xl border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <ModalTitle class="shrink-0 text-lg font-semibold">{{ title ?? t('common.confirmTitle') }}</ModalTitle>
      <ModalDescription class="mt-2 min-h-0 overflow-y-auto text-sm leading-6 text-flixer-muted">{{ message }}</ModalDescription>
      <div class="mt-6 flex shrink-0 flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" class="flex h-11 items-center justify-center rounded-lg border border-flixer-border px-6 text-sm font-semibold text-flixer-text transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" @click="close()">{{ t('common.cancel') }}</button>
        <button type="button" class="flex h-11 items-center justify-center rounded-lg px-6 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" :class="danger ? 'bg-red-600' : 'bg-flixer-primary'" @click="confirm(true)">{{ confirmLabel ?? t('common.confirm') }}</button>
      </div>
    </ModalContent>
  </ModalRoot>
</template>
