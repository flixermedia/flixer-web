<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { Button } from '@ui-sdk/vue/button'
import { useI18n } from 'vue-i18n'

defineOptions({ modalGroup: 'default' })

const { close, confirm } = useModalContext<'public' | 'friends' | 'private'>()
const { t } = useI18n()
const options = ['public', 'friends', 'private'] as const
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card w-full max-w-md rounded border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <header class="flixer-modal-header">
        <ModalTitle class="text-lg font-semibold">{{ t('party.visibilityTitle') }}</ModalTitle>
        <ModalDescription class="mt-1 text-sm leading-6 text-flixer-muted">{{ t('party.visibilityDescription') }}</ModalDescription>
      </header>
      <div class="mt-5 flex flex-col gap-2">
        <Button v-for="visibility in options" :key="visibility" type="button" :data-agent-confirm="`${t('party.visibilityTitle')} ${t(`party.visibility.${visibility}`)}`" class="h-auto flex-col items-start gap-0 rounded border border-flixer-border bg-transparent p-3 text-left whitespace-normal transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-flixer-accent" @click="confirm(visibility)">
          <span class="block text-sm font-semibold text-white">{{ t(`party.visibility.${visibility}`) }}</span>
          <span class="mt-1 block text-xs text-flixer-muted">{{ t(`party.visibilityDescriptionOptions.${visibility}`) }}</span>
        </Button>
      </div>
      <div class="flixer-modal-actions mt-5 flex justify-end">
        <Button type="button" class="flex h-11 items-center justify-center rounded border border-flixer-border bg-transparent px-6 text-sm font-semibold text-flixer-text transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-flixer-accent" @click="close()">{{ t('common.cancel') }}</Button>
      </div>
    </ModalContent>
  </ModalRoot>
</template>
