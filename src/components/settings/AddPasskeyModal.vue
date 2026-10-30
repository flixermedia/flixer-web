<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import type { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/browser'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getPasskeyRegistrationOptions } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import TextInput from '../ui/TextInput.vue'

defineOptions({ modalGroup: 'default' })

const { close, confirm } = useModalContext<PublicKeyCredentialCreationOptionsJSON>()
const { t } = useI18n()

const password = ref('')
const isSubmitting = ref(false)

async function submit() {
  isSubmitting.value = true
  try {
    const [error, options] = await catchError(getPasskeyRegistrationOptions(password.value))
    if (error) {
      console.error('[settings] passkey password check failed', error)
      notify.error(describeRequestError(error, t('settings.passkeys.addFailed')))
    } else {
      confirm(options)
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card w-full max-w-md rounded-2xl border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <ModalTitle class="text-lg font-semibold">{{ t('settings.passkeys.add') }}</ModalTitle>
      <ModalDescription class="mt-1 text-sm leading-6 text-flixer-muted">{{ t('settings.passkeys.addDescription') }}</ModalDescription>

      <form class="mt-5 flex flex-col gap-5" @submit.prevent="submit">
        <TextInput v-model="password" :label="t('settings.passkeys.passwordLabel')" type="password" name="addPasskeyPassword" autocomplete="current-password" maxlength="128" required autofocus />

        <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" class="flex h-11 items-center justify-center rounded-lg border border-flixer-border px-6 text-sm font-semibold text-flixer-text transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" :disabled="isSubmitting" @click="close()">{{ t('common.cancel') }}</button>
          <button type="submit" class="flex h-11 items-center justify-center rounded-lg bg-gradient-to-r from-flixer-primary to-flixer-secondary px-6 text-sm font-semibold text-white shadow-lg shadow-flixer-primary/20 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-wait disabled:opacity-60" :disabled="isSubmitting || !password">
            {{ isSubmitting ? t('settings.passkeys.checking') : t('settings.passkeys.continue') }}
          </button>
        </div>
      </form>
    </ModalContent>
  </ModalRoot>
</template>
