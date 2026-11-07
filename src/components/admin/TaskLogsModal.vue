<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { useI18n } from 'vue-i18n'
import type { IndexerTaskQueueName } from '../../api'
import LoggerTaskLogs from './LoggerTaskLogs.vue'

const props = defineProps<{ queue: IndexerTaskQueueName; id: string; title: string }>()

defineOptions({ modalGroup: 'default' })

const { close } = useModalContext<boolean>()
const { t } = useI18n()
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col rounded border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <header class="flixer-modal-header">
        <ModalTitle class="shrink-0 text-lg font-semibold">{{ t('admin.indexer.taskLogsTitle') }}</ModalTitle>
        <ModalDescription class="mt-1 shrink-0 truncate font-mono text-xs text-flixer-muted">{{ title }}</ModalDescription>
      </header>
      <LoggerTaskLogs :queue="queue" :id="id" />
      <div class="flixer-modal-actions mt-5 flex shrink-0 justify-end">
        <button type="button" class="rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15" @click="close()">{{ t('common.close') }}</button>
      </div>
    </ModalContent>
  </ModalRoot>
</template>
