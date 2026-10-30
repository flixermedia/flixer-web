<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { exchangeNativePasskeyHandoff, saveAccessToken } from '../api'
import { clearPendingNativePasskeyHandoff, getPendingNativePasskeyHandoff } from '../platform/passkeyHandoff'
import { syncLocaleFromAccount } from '../i18n'
import { useProfile } from '../composables/useProfile'
import { saveNativeAccount } from '../platform/nativeAccount'
import { notify } from '../composables/notify'
import { catchError } from '../utils/catchError'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const error = ref('')
const isCompleting = ref(true)

onMounted(() => void completeHandoff())

async function completeHandoff() {
  const state = typeof route.query.state === 'string' ? route.query.state : ''
  const pending = getPendingNativePasskeyHandoff()
  if (!pending || state !== pending.state) {
    error.value = t('auth.passkeyHandoffExpired')
    isCompleting.value = false
    return
  }

  if (route.query.cancelled === '1') {
    clearPendingNativePasskeyHandoff()
    error.value = t('auth.passkeyHandoffCancelled')
    isCompleting.value = false
    return
  }

  const code = typeof route.query.code === 'string' ? route.query.code : ''
  if (!code) {
    error.value = t('auth.passkeyHandoffExpired')
    isCompleting.value = false
    return
  }

  const [exchangeError, result] = await catchError(exchangeNativePasskeyHandoff({ code, codeVerifier: pending.codeVerifier, state }))
  if (exchangeError) {
    console.error('[passkey] native handoff exchange failed', exchangeError)
    error.value = t('auth.passkeyHandoffFailed')
    isCompleting.value = false
    return
  }
  clearPendingNativePasskeyHandoff()
  useProfile().clear()
  saveAccessToken(result.accessToken)
  const [saveError] = await catchError(Promise.resolve().then(() => saveNativeAccount(result.user.username)))
  if (saveError) {
    console.warn('[native-account] Could not save the account for reinstall recovery', saveError)
    notify.error(t('auth.rememberAccountFailed'))
  }
  const [localeError] = await catchError(syncLocaleFromAccount())
  if (localeError) {
    console.error('[passkey] native handoff exchange failed', localeError)
    error.value = t('auth.passkeyHandoffFailed')
    isCompleting.value = false
    return
  }
  const redirect = pending.redirect
  const destination = redirect?.startsWith('/') && !redirect.startsWith('//') ? redirect : '/'
  const [navigationError] = await catchError(router.replace(destination))
  if (navigationError) {
    console.error('[passkey] native handoff exchange failed', navigationError)
    error.value = t('auth.passkeyHandoffFailed')
    isCompleting.value = false
  }
}
</script>

<template>
  <main class="passkey-main grid min-h-[100dvh] place-items-center bg-flixer-background p-6 text-flixer-text">
    <section class="w-full max-w-md rounded-2xl border border-flixer-border bg-flixer-surface p-6 text-center">
      <p v-if="isCompleting" class="text-sm text-flixer-muted" role="status">{{ t('auth.passkeyHandoffCompleting') }}</p>
      <template v-else>
        <p class="text-sm text-flixer-muted" role="alert">{{ error }}</p>
        <button type="button" class="mt-5 rounded-lg border border-flixer-border px-4 py-2 text-sm font-semibold hover:bg-white/5" @click="router.replace({ name: 'login' })">{{ t('auth.backToSignIn') }}</button>
      </template>
    </section>
  </main>
</template>

<style scoped>
html.capacitor .passkey-main {
  top: max(env(safe-area-inset-top), 3.5rem);
}
</style>
