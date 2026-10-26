<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

defineOptions({ modalGroup: 'default' })

defineProps<{ title: string }>()
const { close, confirm } = useModalContext<string>()
const { t } = useI18n()
const reason = ref('')
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col rounded-2xl border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <ModalTitle class="shrink-0 text-lg font-semibold">{{ t('requests.actions.decline') }}</ModalTitle>
      <ModalDescription class="mt-1 shrink-0 truncate text-sm leading-6 text-flixer-muted">{{ title }}</ModalDescription>

      <form class="-mx-1 mt-5 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" @submit.prevent="confirm(reason.trim())">
        <label class="block text-xs font-medium text-flixer-muted"
          >{{ t('requests.declineReason') }}
          <textarea v-model="reason" rows="3" maxlength="500" autofocus class="mt-1.5 w-full resize-none rounded-lg border border-flixer-border bg-flixer-background px-4 py-3 text-sm text-flixer-text placeholder:text-flixer-muted focus-visible:outline-2 focus-visible:outline-flixer-accent"></textarea>
        </label>
        <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" class="flex h-11 items-center justify-center rounded-lg border border-flixer-border px-6 text-sm font-semibold text-flixer-text transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" @click="close()">{{ t('common.cancel') }}</button>
          <button type="submit" class="flex h-11 items-center justify-center rounded-lg bg-red-600 px-6 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent">{{ t('requests.actions.decline') }}</button>
        </div>
      </form>
    </ModalContent>
  </ModalRoot>
</template>
