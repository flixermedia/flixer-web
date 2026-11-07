<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { uploadAdvertisement, type Advertisement } from '../../api/advertisements'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'

defineOptions({ modalGroup: 'default' })
const { close, confirm, onBeforeClose } = useModalContext<Advertisement>()
const { t } = useI18n()
const formId = `ad-upload-${useId()}`
const busy = ref(false)
onBeforeClose(() => !busy.value)
const file = ref<File | null>(null)
const name = ref('')
const target = ref('')
const progress = ref(0)
const input = 'mt-2 h-11 w-full rounded border border-flixer-border bg-flixer-background px-3 text-sm text-flixer-text focus-visible:outline-2 focus-visible:outline-flixer-accent'

async function upload() {
  if (!file.value || busy.value) return
  busy.value = true
  progress.value = 0
  const [error, ad] = await catchError(uploadAdvertisement(file.value, name.value.trim(), target.value.trim(), (done, total) => { progress.value = Math.floor(done / total * 100) }))
  busy.value = false
  if (error) notify.error(describeRequestError(error, t('advertisements.uploadError')))
  else { notify.success(t('advertisements.uploaded')); confirm(ad) }
}
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col rounded border border-flixer-border bg-flixer-surface text-flixer-text shadow-2xl shadow-black/60">
      <header class="flex shrink-0 items-center gap-4 border-b border-flixer-border px-6 py-5">
        <div class="grid size-11 shrink-0 place-items-center rounded bg-flixer-primary/15 text-flixer-accent"><Icon icon="lucide:upload" class="size-5" aria-hidden="true" /></div>
        <div><ModalTitle class="text-lg font-semibold">{{ t('advertisements.upload') }}</ModalTitle><ModalDescription class="mt-0.5 text-sm text-flixer-muted">{{ t('advertisements.uploadHint') }}</ModalDescription></div>
      </header>
      <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
        <form :id="formId" class="grid gap-4" @submit.prevent="upload">
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="text-sm">{{ t('advertisements.name') }}<input v-model="name" :class="input" maxlength="200" required /></label>
            <label class="text-sm">{{ t('advertisements.url') }}<input v-model="target" :class="input" type="url" maxlength="2048" required /></label>
          </div>
          <label class="text-sm">{{ t('advertisements.video') }}<input class="mt-2 block w-full text-sm text-flixer-muted" type="file" accept="video/mp4,.mp4" required @change="file = ($event.target as HTMLInputElement).files?.[0] ?? null" /></label>
          <progress v-if="busy" :value="progress" max="100" class="w-full" :aria-label="t('advertisements.uploadProgress')" />
        </form>
      </div>
      <footer class="flex shrink-0 flex-col-reverse gap-3 border-t border-flixer-border px-6 py-4 sm:flex-row sm:justify-end">
        <button type="button" class="h-11 rounded border border-flixer-border px-6 text-sm" :disabled="busy" @click="close()">{{ t('common.cancel') }}</button>
        <button type="submit" :form="formId" :disabled="busy || !file" class="h-11 rounded bg-flixer-primary px-6 text-sm font-semibold text-white disabled:opacity-50">{{ t('advertisements.upload') }}</button>
      </footer>
    </ModalContent>
  </ModalRoot>
</template>
