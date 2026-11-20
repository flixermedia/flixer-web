<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { Button } from '@ui-sdk/vue/button'
import { Field, FieldLabel } from '@ui-sdk/vue/field'
import { Textarea } from '@ui-sdk/vue/textarea'
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
    <ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col rounded border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <header class="flixer-modal-header">
        <ModalTitle class="shrink-0 text-lg font-semibold">{{ t('requests.actions.decline') }}</ModalTitle>
        <ModalDescription class="mt-1 shrink-0 truncate text-sm leading-6 text-flixer-muted">{{ title }}</ModalDescription>
      </header>

      <form class="flixer-modal-form mt-5" @submit.prevent="confirm(reason.trim())">
        <div class="flixer-modal-form-body gap-4">
          <Field class="gap-1.5">
            <FieldLabel class="text-xs font-medium text-flixer-muted">{{ t('requests.declineReason') }}</FieldLabel>
            <Textarea v-model="reason" rows="3" maxlength="500" autofocus class="min-h-0 w-full resize-none rounded border border-flixer-border bg-flixer-background px-4 py-3 text-sm text-flixer-text placeholder:text-flixer-muted focus-visible:outline-2 focus-visible:outline-flixer-accent focus-visible:border-flixer-border" />
          </Field>
        </div>
        <div class="flixer-modal-actions flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" class="flex h-11 items-center justify-center rounded border border-flixer-border bg-transparent px-6 text-sm font-semibold text-flixer-text transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" @click="close()">{{ t('common.cancel') }}</Button>
          <Button type="submit" :data-agent-confirm="`${t('requests.actions.decline')}: ${title}`" class="flex h-11 items-center justify-center rounded border-0 bg-red-600 px-6 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent">{{ t('requests.actions.decline') }}</Button>
        </div>
      </form>
    </ModalContent>
  </ModalRoot>
</template>
