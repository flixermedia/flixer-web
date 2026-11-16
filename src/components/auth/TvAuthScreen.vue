<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AuthResult } from '../../api'
import TvQuickConnect from './TvQuickConnect.vue'

defineProps<{
  appName: string
  registration: boolean
  registrationEnabled: boolean | null
  registrationStatusError: string
  quickConnectEnabled: boolean
  quickConnectLoading: boolean
  quickConnectStatusError: string
  isSubmitting: boolean
  passkeyRequired: boolean
  loginBanner: string
  oauthClientName?: string
  sessionCheckUnavailable: boolean
  canResend: boolean
  isResending: boolean
  nativeApp: boolean
}>()
const emit = defineEmits<{
  submit: [credentials: { username: string; password: string; rememberBiometric: boolean }]
  authenticated: [result: AuthResult]
  switchMode: []
  cancelSecondFactor: []
  resend: []
}>()
const { t } = useI18n()
const username = ref('')
const password = ref('')

function submit() {
  emit('submit', { username: username.value, password: password.value, rememberBiometric: false })
}
</script>

<template>
  <main class="login-background flex h-[100dvh] min-h-0 flex-col overflow-y-auto px-12 py-8 font-sans text-flixer-text">
    <header class="mx-auto flex w-full max-w-6xl items-center justify-between">
      <p class="text-xl font-bold tracking-wide text-white">{{ appName }}</p>
      <RouterLink v-if="nativeApp" :to="{ name: 'connect' }" class="rounded px-3 py-2 text-sm text-flixer-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent">{{ t('native.changeServer') }}</RouterLink>
    </header>
    <div class="mx-auto flex w-full max-w-6xl flex-1 items-center py-6">
      <div class="grid w-full grid-cols-2 items-center gap-16">
        <section class="min-w-0" aria-labelledby="tv-auth-title">
          <p class="text-sm font-bold uppercase tracking-[0.2em] text-flixer-accent">{{ t('auth.loginEyebrow') }}</p>
          <h1 id="tv-auth-title" class="mt-4 text-4xl font-bold text-white">{{ registration ? t('auth.tvRegisterTitle') : t('auth.tvSignInTitle') }}</h1>
          <p class="mt-4 max-w-xl text-lg leading-relaxed text-flixer-muted">{{ registration ? t('auth.tvRegisterDescription') : t('auth.tvSignInDescription') }}</p>
          <p v-if="oauthClientName" class="mt-4 text-base text-flixer-text">{{ t('oidc.signInTitle', { client: oauthClientName }) }}</p>
          <p v-if="loginBanner" class="mt-4 whitespace-pre-line text-base text-flixer-muted">{{ loginBanner }}</p>
          <p v-if="sessionCheckUnavailable" class="mt-4 text-base text-flixer-accent" role="status">{{ t('auth.sessionCheckUnavailable') }}</p>

          <template v-if="passkeyRequired">
            <p class="mt-7 text-base text-flixer-text">{{ t('auth.tvSecondFactorPhone') }}</p>
            <button type="button" class="mt-5 rounded border border-flixer-border px-5 py-3 text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" @click="emit('cancelSecondFactor')">{{ t('auth.backToSignIn') }}</button>
          </template>
          <template v-else-if="!registration">
            <form class="mt-7 max-w-md space-y-4" @submit.prevent="submit">
              <label class="block text-base font-semibold">{{ t('auth.username') }}
                <input v-model.trim="username" type="text" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" minlength="3" maxlength="64" pattern="[a-zA-Z0-9_.\-]+" required class="mt-2 h-12 w-full rounded border border-flixer-border bg-flixer-background/80 px-4 font-normal outline-none focus:border-flixer-accent focus-visible:outline-2 focus-visible:outline-flixer-accent" />
              </label>
              <label class="block text-base font-semibold">{{ t('auth.password') }}
                <input v-model="password" type="password" autocomplete="current-password" maxlength="128" required class="mt-2 h-12 w-full rounded border border-flixer-border bg-flixer-background/80 px-4 font-normal outline-none focus:border-flixer-accent focus-visible:outline-2 focus-visible:outline-flixer-accent" />
              </label>
              <button type="submit" :disabled="isSubmitting" class="w-full rounded bg-flixer-primary px-5 py-3 text-base font-bold text-white hover:bg-flixer-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:opacity-60">{{ isSubmitting ? t('auth.signingIn') : t('auth.signInToFlixer') }}</button>
              <button v-if="canResend" type="button" :disabled="isResending" class="text-base text-flixer-accent underline focus-visible:outline-2 focus-visible:outline-flixer-accent" @click="emit('resend')">{{ isResending ? t('auth.sending') : t('auth.resendVerification') }}</button>
            </form>
            <button v-if="registrationEnabled === true && quickConnectEnabled" type="button" class="mt-6 rounded px-2 py-2 text-base font-semibold text-flixer-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" @click="emit('switchMode')">{{ t('auth.tvCreateAccount') }}</button>
            <p v-if="registrationStatusError" class="mt-3 text-sm text-flixer-muted" role="status">{{ registrationStatusError }}</p>
          </template>
          <button v-else type="button" class="mt-7 rounded border border-flixer-border px-5 py-3 text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" @click="emit('switchMode')">{{ t('auth.backToSignIn') }}</button>
        </section>

        <section class="flex min-w-0 flex-col items-center text-center" aria-labelledby="tv-phone-title">
          <h2 id="tv-phone-title" class="text-2xl font-bold text-white">{{ registration ? t('auth.tvRegisterPhoneTitle') : t('auth.tvPhoneTitle') }}</h2>
          <p class="mb-5 mt-2 max-w-md text-base leading-relaxed text-flixer-muted">{{ t('auth.tvPhoneInstructions') }}</p>
          <p v-if="registration && registrationEnabled !== true" role="status" class="text-base text-flixer-muted">{{ registrationStatusError || (registrationEnabled === null ? t('auth.checkingRegistration') : t('auth.registrationDisabled')) }}</p>
          <p v-else-if="quickConnectLoading" role="status" class="text-base text-flixer-muted">{{ t('auth.quickConnectStarting') }}</p>
          <p v-else-if="quickConnectStatusError" role="alert" class="text-base text-red-200">{{ quickConnectStatusError }}</p>
          <p v-else-if="!quickConnectEnabled" role="status" class="text-base text-flixer-muted">{{ t('auth.quickConnectDisabled') }}</p>
          <TvQuickConnect v-else :registration="registration" @authenticated="emit('authenticated', $event)" />
        </section>
      </div>
    </div>
  </main>
</template>
