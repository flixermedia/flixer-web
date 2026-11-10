<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { useI18n } from 'vue-i18n'
import QuickConnectApproval from './QuickConnectApproval.vue'

defineOptions({ modalGroup: 'default' })

const { close } = useModalContext<void>()
const { t } = useI18n()
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <header class="flixer-modal-header">
        <ModalTitle class="text-lg font-semibold">{{ t('auth.quickConnectApprovalTitle') }}</ModalTitle>
        <ModalDescription class="mt-1 text-sm leading-6 text-flixer-muted">{{ t('auth.quickConnectApprovalInstructions') }}</ModalDescription>
      </header>
      <QuickConnectApproval />
      <div class="flixer-modal-actions mt-5 flex justify-end">
        <button type="button" class="rounded border border-flixer-border px-4 py-2 text-sm font-semibold transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-flixer-accent" @click="close()">{{ t('common.close') }}</button>
      </div>
    </ModalContent>
  </ModalRoot>
</template>
