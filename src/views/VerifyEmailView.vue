<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import logo from '../../resources/logo/flixer-logo.svg'
import { verifyEmail } from '../api'
import { describeRequestError } from '../composables/useProfile'
import { catchError } from '../utils/catchError'

const { t } = useI18n()
const route = useRoute()
const status = ref<'loading' | 'success' | 'error'>('loading')
const errorMessage = ref('')

onMounted(async () => {
  const token = typeof route.query.token === 'string' ? route.query.token : ''
  if (!token) {
    status.value = 'error'
    errorMessage.value = t('verify.missingToken')
    return
  }

  const [error] = await catchError(verifyEmail(token))
  if (error) {
    console.error('[auth] email verification failed', error)
    errorMessage.value = describeRequestError(error, t('verify.failedFallback'))
    status.value = 'error'
    return
  }
  status.value = 'success'
})
</script>

<template>
  <main class="grid min-h-screen place-items-center bg-flixer-background px-6 font-sans text-flixer-text">
    <div class="w-full max-w-md rounded-2xl border border-flixer-border/70 bg-flixer-surface/70 p-8 text-center shadow-2xl">
      <img :src="logo" alt="" class="mx-auto size-14 rounded-xl shadow-lg" aria-hidden="true" />

      <template v-if="status === 'loading'">
        <h1 class="mt-6 text-2xl font-semibold tracking-tight">{{ t('verify.verifying') }}</h1>
        <span class="mx-auto mt-6 block size-6 animate-spin rounded-full border-2 border-white/20 border-t-flixer-accent" aria-hidden="true"></span>
      </template>

      <template v-else-if="status === 'success'">
        <h1 class="mt-6 text-2xl font-semibold tracking-tight">
          {{ t('verify.verified') }}
          <span class="text-flixer-accent">.</span>
        </h1>
        <p class="mt-2 text-sm text-flixer-muted">{{ t('verify.accountReady') }}</p>
        <RouterLink :to="{ name: 'login' }" class="mt-8 flex h-12 w-full items-center justify-center rounded-lg bg-gradient-to-r from-flixer-primary to-flixer-secondary text-sm font-semibold text-white shadow-lg shadow-flixer-primary/20 transition hover:brightness-110">{{ t('verify.goToSignIn') }}</RouterLink>
      </template>

      <template v-else>
        <h1 class="mt-6 text-2xl font-semibold tracking-tight">{{ t('verify.failed') }}</h1>
        <p class="mt-2 text-sm text-rose-300" role="alert">{{ errorMessage }}</p>
        <p class="mt-2 text-xs text-flixer-muted">{{ t('verify.requestAnotherEmail') }}</p>
        <RouterLink :to="{ name: 'login' }" class="mt-8 flex h-12 w-full items-center justify-center rounded-lg border border-flixer-border bg-flixer-surface/50 text-sm font-semibold text-flixer-text transition hover:border-flixer-accent/40">{{ t('verify.goToSignIn') }}</RouterLink>
      </template>
    </div>
  </main>
</template>
