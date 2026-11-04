<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { unlockAccess } from '../../api'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'

defineOptions({ modalGroup: 'default' })

const { close } = useModalContext<boolean>()
const { t } = useI18n()
const pin = ref('')
const error = ref('')
const busy = ref(false)
const focused = ref(true)
const PIN_LENGTH = 6

async function submit() {
  if (busy.value || pin.value.length < 4) return
  busy.value = true
  error.value = ''
  const [failure] = await catchError(unlockAccess(pin.value))
  busy.value = false
  if (failure) {
    pin.value = ''
    error.value = describeRequestError(failure, t('access.unlockError'))
    return
  }
  close(true)
  // Everything on screen was filtered for the locked session, so reload to fetch the unrestricted view.
  window.location.reload()
}
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card w-full max-w-sm rounded border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <div class="grid size-12 place-items-center rounded-full bg-flixer-primary/15 text-flixer-accent"><Icon icon="lucide:lock-keyhole" class="size-6" aria-hidden="true" /></div>
      <ModalTitle class="mt-4 text-lg font-semibold">{{ t('access.unlockTitle') }}</ModalTitle>
      <ModalDescription class="mt-1 text-sm leading-6 text-flixer-muted">{{ t('access.unlockDescription') }}</ModalDescription>
      <form class="mt-5" @submit.prevent="submit">
        <label class="sr-only" for="access-pin">{{ t('access.pin') }}</label>
        <div class="relative flex justify-center gap-2">
          <div v-for="index in PIN_LENGTH" :key="index" aria-hidden="true" class="grid size-12 place-items-center rounded border bg-flixer-background text-xl font-semibold text-flixer-text transition-colors" :class="pin.length >= index ? 'border-flixer-accent' : focused && pin.length === index - 1 ? 'border-white' : 'border-flixer-border'">
            <span v-if="pin[index - 1]">•</span>
            <span v-else-if="focused && pin.length === index - 1" class="h-6 w-px animate-pulse bg-white motion-reduce:animate-none"></span>
          </div>
          <input id="access-pin" v-model="pin" type="password" inputmode="numeric" autocomplete="one-time-code" maxlength="6" autofocus :aria-label="t('access.pin')" class="absolute inset-0 size-full cursor-text opacity-0" @focus="focused = true" @blur="focused = false" @input="pin = pin.replace(/\D/g, '')" />
        </div>
        <p v-if="error" class="mt-2 text-sm text-red-400" role="alert">{{ error }}</p>
        <div class="mt-5 flex justify-end gap-2">
          <button type="button" class="rounded border border-flixer-border px-4 py-2 text-sm font-semibold transition hover:bg-white/10" @click="close(false)">{{ t('common.cancel') }}</button>
          <button type="submit" :disabled="busy || pin.length < PIN_LENGTH" class="rounded bg-flixer-primary px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50">{{ t('access.unlock') }}</button>
        </div>
      </form>
    </ModalContent>
  </ModalRoot>
</template>
