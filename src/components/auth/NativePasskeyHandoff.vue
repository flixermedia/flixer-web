<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { startAuthentication } from '@simplewebauthn/browser'
import { getNativePasskeyHandoffOptions, verifyNativePasskeyHandoff } from '../../api'
import { NATIVE_PASSKEY_CALLBACK_SCHEME } from '../../platform/passkeyHandoff'
import { catchError } from '../../utils/catchError'

const props = defineProps<{ handoffId: string; state: string }>()
const { t } = useI18n()
const isSubmitting = ref(false)
const error = ref('')

const callbackUrl = (query: Record<string, string>) => {
  const url = new URL(`${NATIVE_PASSKEY_CALLBACK_SCHEME}://passkey/callback`)
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value)
  return url.toString()
}

async function verify() {
  if (isSubmitting.value) return
  isSubmitting.value = true
  error.value = ''
  try {
    const [optionsError, options] = await catchError(getNativePasskeyHandoffOptions(props.handoffId))
    if (optionsError) {
      showError(optionsError)
      return
    }
    const [assertionError, assertion] = await catchError(startAuthentication({ optionsJSON: options }))
    if (assertionError) {
      showError(assertionError)
      return
    }
    const [verifyError, result] = await catchError(verifyNativePasskeyHandoff(props.handoffId, { ...assertion }))
    if (verifyError) {
      showError(verifyError)
      return
    }
    window.location.assign(callbackUrl({ code: result.code, state: result.state }))
  } finally {
    isSubmitting.value = false
  }
}

function showError(cause: Error) {
  console.error('[passkey] browser handoff failed', cause)
  error.value = cause.name === 'NotAllowedError' ? t('auth.passkeyCheckCancelled') : t('auth.passkeyHandoffFailed')
}

function cancel() {
  window.location.assign(callbackUrl({ state: props.state, cancelled: '1' }))
}
</script>

<template>
  <div class="w-full p-10">
    <span class="text-[9px] font-bold tracking-[0.2em] text-flixer-accent">{{ t('auth.twoStepSignIn') }}</span>
    <h1 class="mt-3 text-3xl font-semibold tracking-tight text-flixer-text sm:text-4xl">
      {{ t('auth.usePasskey') }}
      <span class="text-flixer-accent">.</span>
    </h1>
    <p class="mt-2 text-sm leading-6 text-flixer-muted">{{ t('auth.nativePasskeyHandoffDescription') }}</p>
    <p v-if="error" class="mt-4 rounded-lg border border-rose-300/30 bg-rose-300/10 p-3 text-sm text-rose-200" role="alert">{{ error }}</p>

    <button class="mt-8 flex h-12 w-full items-center justify-center rounded-lg bg-gradient-to-r from-flixer-primary to-flixer-secondary text-sm font-semibold text-white shadow-lg shadow-flixer-primary/20 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-not-allowed disabled:opacity-60" type="button" :disabled="isSubmitting" @click="verify">
      {{ isSubmitting ? t('auth.waitingForPasskey') : t('auth.continueWithPasskey') }}
    </button>
    <button class="mt-3 flex h-12 w-full items-center justify-center rounded-lg border border-flixer-border text-sm font-semibold text-flixer-text transition hover:bg-flixer-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" type="button" :disabled="isSubmitting" @click="cancel">{{ t('auth.backToSignIn') }}</button>
  </div>
</template>
