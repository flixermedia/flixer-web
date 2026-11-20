<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@ui-sdk/vue/button'
import UserMediaListView from '../../views/UserMediaListView.vue'

defineOptions({ modalGroup: 'default' })
const props = defineProps<{ kind: 'queue' | 'dismissed' }>()
const { close } = useModalContext<void>()
const { t } = useI18n()
const title = computed(() => t(props.kind === 'queue' ? 'userMedia.queue' : 'recommendationReview.title'))
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col rounded border border-flixer-border bg-flixer-surface p-5 text-flixer-text shadow-2xl shadow-black/60">
      <header class="flixer-modal-header flex items-center justify-between gap-3">
        <ModalTitle class="sr-only">{{ title }}</ModalTitle>
        <ModalDescription class="sr-only">{{ title }}</ModalDescription>
        <Button type="button" class="ml-auto grid size-8 place-items-center rounded text-flixer-muted hover:bg-white/10 hover:text-white" :aria-label="t('common.close')" :title="t('common.close')" @click="close()"><Icon icon="lucide:x" class="size-5" aria-hidden="true" /></Button>
      </header>
      <div class="min-h-0 overflow-y-auto"><UserMediaListView :kind="kind" embedded /></div>
    </ModalContent>
  </ModalRoot>
</template>