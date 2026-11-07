<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { saveAdvertisement, type Advertisement } from '../../api/advertisements'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import AdminToggle from './AdminToggle.vue'
import ScopePicker from './payments/ScopePicker.vue'

defineOptions({ modalGroup: 'default' })
const props = defineProps<{ ad: Advertisement }>()
const { close, confirm, onBeforeClose } = useModalContext<Advertisement>()
const { t } = useI18n()
const formId = `ad-edit-${useId()}`
const editing = ref({ ...props.ad, scopes: props.ad.scopes.map((scope) => ({ ...scope })), midrollSeconds: [...props.ad.midrollSeconds] })
const positions = ref(props.ad.midrollSeconds.join(', '))
const skippable = ref(props.ad.skipAfterSeconds !== null)
const busy = ref(false)
onBeforeClose(() => !busy.value)
const input = 'mt-2 h-11 w-full rounded border border-flixer-border bg-flixer-background px-3 text-sm text-flixer-text focus-visible:outline-2 focus-visible:outline-flixer-accent'

async function save() {
  const values = positions.value.trim() ? positions.value.split(',').map((value) => Number(value.trim())) : []
  if (values.some((value) => !Number.isInteger(value) || value <= 0) || editing.value.scopes.length === 0) {
    notify.error(t('advertisements.invalidBreaks'))
    return
  }
  busy.value = true
  const [error, saved] = await catchError(saveAdvertisement({ ...editing.value, midrollSeconds: values, skipAfterSeconds: skippable.value ? (editing.value.skipAfterSeconds ?? 0) : null }))
  busy.value = false
  if (error) notify.error(describeRequestError(error, t('advertisements.saveError')))
  else { notify.success(t('advertisements.saved')); confirm(saved) }
}
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col rounded border border-flixer-border bg-flixer-surface text-flixer-text shadow-2xl shadow-black/60">
      <header class="flex shrink-0 items-center gap-4 border-b border-flixer-border px-6 py-5">
        <div class="grid size-11 shrink-0 place-items-center rounded bg-flixer-primary/15 text-flixer-accent"><Icon icon="lucide:megaphone" class="size-5" aria-hidden="true" /></div>
        <div><ModalTitle class="text-lg font-semibold">{{ t('advertisements.edit') }}</ModalTitle><ModalDescription class="mt-0.5 text-sm text-flixer-muted">{{ ad.name }}</ModalDescription></div>
      </header>
      <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5 [scrollbar-width:thin]">
        <form :id="formId" class="space-y-5" @submit.prevent="save">
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="text-sm">{{ t('advertisements.name') }}<input v-model="editing.name" :class="input" maxlength="200" required /></label>
            <label class="text-sm">{{ t('advertisements.url') }}<input v-model="editing.targetUrl" :class="input" type="url" maxlength="2048" required /></label>
          </div>
          <AdminToggle v-model="editing.enabled" :label="t('advertisements.adEnabled')" />
          <AdminToggle v-model="editing.preroll" :label="t('advertisements.preroll')" />
          <label class="block text-sm">{{ t('advertisements.midroll') }}<input v-model="positions" :class="input" placeholder="600, 1200" /><span class="mt-1 block text-xs text-flixer-muted">{{ t('advertisements.midrollHint') }}</span></label>
          <ScopePicker v-model="editing.scopes" multiple :label="t('advertisements.scopes')" />
          <AdminToggle v-model="skippable" :label="t('advertisements.skippable')" />
          <label v-if="skippable" class="block text-sm">{{ t('advertisements.skipAfter') }}<input v-model.number="editing.skipAfterSeconds" :class="input" type="number" min="0" :max="Math.floor(editing.durationSeconds)" required /></label>
        </form>
      </div>
      <footer class="flex shrink-0 flex-col-reverse gap-3 border-t border-flixer-border px-6 py-4 sm:flex-row sm:justify-end">
        <button type="button" class="h-11 rounded border border-flixer-border px-6 text-sm" :disabled="busy" @click="close()">{{ t('common.cancel') }}</button>
        <button type="submit" :form="formId" :disabled="busy" class="h-11 rounded bg-flixer-primary px-6 text-sm font-semibold text-white disabled:opacity-50">{{ t('common.save') }}</button>
      </footer>
    </ModalContent>
  </ModalRoot>
</template>
