<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { useI18n } from 'vue-i18n'
import type { IssueReport } from '../../api'
import IssueReportForm from './IssueReportForm.vue'

defineOptions({ modalGroup: 'default' })
const props = defineProps<{ mediaItemId?: string; mediaTitle?: string }>()
const { close, confirm } = useModalContext<IssueReport>()
const { t } = useI18n()

function submitted(report: IssueReport) {
  confirm(report)
}
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card max-h-[calc(100dvh-2rem)] w-full max-w-xl rounded border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <header class="flixer-modal-header flex items-start justify-between gap-4">
        <div>
          <ModalTitle class="text-lg font-semibold text-white">{{ t('issues.newReport') }}</ModalTitle>
          <ModalDescription class="mt-1 text-sm text-flixer-muted">{{ t('issues.formDescription') }}</ModalDescription>
        </div>
        <button type="button" class="grid size-9 shrink-0 place-items-center rounded text-flixer-muted hover:bg-white/10 hover:text-white" :aria-label="t('common.close')" @click="close()">
          <Icon icon="lucide:x" class="size-4" aria-hidden="true" />
        </button>
      </header>
      <IssueReportForm class="mt-5" modal :media-item-id="props.mediaItemId" :media-title="props.mediaTitle" @submitted="submitted" />
    </ModalContent>
  </ModalRoot>
</template>
