<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { useI18n } from 'vue-i18n'

defineOptions({ modalGroup: 'default' })

const { close, confirm } = useModalContext<'public' | 'friends' | 'private'>()
const { t } = useI18n()
const options = ['public', 'friends', 'private'] as const
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card w-full max-w-md rounded-2xl border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <ModalTitle class="text-lg font-semibold">{{ t('party.visibilityTitle') }}</ModalTitle>
      <ModalDescription class="mt-1 text-sm leading-6 text-flixer-muted">{{ t('party.visibilityDescription') }}</ModalDescription>
      <div class="mt-5 flex flex-col gap-2">
        <button v-for="visibility in options" :key="visibility" type="button" class="rounded-lg border border-flixer-border p-3 text-left transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-flixer-accent" @click="confirm(visibility)">
          <span class="block text-sm font-semibold text-white">{{ t(`party.visibility.${visibility}`) }}</span>
          <span class="mt-1 block text-xs text-flixer-muted">{{ t(`party.visibilityDescriptionOptions.${visibility}`) }}</span>
        </button>
      </div>
      <div class="mt-5 flex justify-end">
        <button type="button" class="flex h-11 items-center justify-center rounded-lg border border-flixer-border px-6 text-sm font-semibold text-flixer-text transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-flixer-accent" @click="close()">{{ t('common.cancel') }}</button>
      </div>
    </ModalContent>
  </ModalRoot>
</template>
