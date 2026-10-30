<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

defineOptions({ modalGroup: 'default' })

const { close, confirm } = useModalContext<boolean>()
const { t } = useI18n()
const replaceTarget = ref(false)
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card w-full max-w-lg rounded-2xl border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <ModalTitle class="text-lg font-semibold">{{ t('admin.connections.transferDialogTitle') }}</ModalTitle>
      <ModalDescription class="mt-1 text-sm leading-6 text-flixer-muted">{{ t('admin.connections.transferDialogDescription') }}</ModalDescription>

      <label class="mt-5 flex cursor-pointer items-start gap-3 rounded-lg border border-rose-400/30 bg-rose-400/5 p-4">
        <input v-model="replaceTarget" type="checkbox" class="mt-1 size-4 accent-rose-500" />
        <span>
          <span class="block text-sm font-semibold text-rose-200">{{ t('admin.connections.replaceTarget') }}</span>
          <span class="mt-1 block text-xs leading-5 text-flixer-muted">{{ t('admin.connections.replaceTargetDescription') }}</span>
        </span>
      </label>

      <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" class="flex h-11 items-center justify-center rounded-lg border border-flixer-border px-6 text-sm font-semibold text-flixer-text transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" @click="close()">{{ t('common.cancel') }}</button>
        <button type="button" :class="replaceTarget ? 'bg-rose-600 hover:bg-rose-500 focus-visible:outline-rose-300' : 'bg-flixer-primary hover:bg-flixer-primary/80 focus-visible:outline-flixer-accent'" class="flex h-11 items-center justify-center rounded-lg px-6 text-sm font-semibold text-white transition focus-visible:outline-2 focus-visible:outline-offset-2" @click="confirm(replaceTarget)">{{ t(replaceTarget ? 'admin.connections.replaceAndTransfer' : 'admin.connections.transfer') }}</button>
      </div>
    </ModalContent>
  </ModalRoot>
</template>
