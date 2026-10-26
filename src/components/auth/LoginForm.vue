<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { browserSupportsWebAuthn } from '@simplewebauthn/browser'
import { isNativeApp } from '../../platform/serverConnection'
import AuthField from './AuthField.vue'

const passkeysSupported = !isNativeApp() && browserSupportsWebAuthn()
const { t } = useI18n()

defineProps<{
  isSubmitting: boolean
  sessionCheckUnavailable: boolean
  registrationEnabled: boolean | null
  registrationStatusError: string
  canResend?: boolean
  isResending?: boolean
}>()

const emit = defineEmits<{
  submit: [credentials: { username: string; password: string }]
  switchMode: []
  passkey: []
  resend: []
}>()

const username = ref('')
const password = ref('')
const isPasswordVisible = ref(false)

function handleSubmit() {
  emit('submit', { username: username.value, password: password.value })
}
</script>

<template>
  <div class="w-full">
    <span class="text-[9px] font-bold tracking-[0.2em] text-flixer-accent">{{ t('auth.loginEyebrow') }}</span>
    <h1 id="login-title" class="mt-3 text-3xl font-semibold tracking-tight text-flixer-text sm:text-4xl">
      {{ t('auth.welcomeBack') }}
      <span class="text-flixer-accent">.</span>
    </h1>
    <p class="mt-2 text-sm text-flixer-muted">{{ t('auth.signInDescription') }}</p>
    <output v-if="sessionCheckUnavailable" class="mt-4 block rounded-lg border border-flixer-accent/20 bg-flixer-primary/10 px-4 py-3 text-sm leading-6 text-flixer-accent">{{ t('auth.sessionCheckUnavailable') }}</output>

    <form class="mt-8 flex flex-col" @submit.prevent="handleSubmit">
      <AuthField id="login-username" :label="t('auth.username')">
        <template #icon>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
        </template>
        <input v-model.trim="username" type="text" name="username" :aria-label="t('auth.username')" :placeholder="t('auth.usernamePlaceholder')" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" minlength="3" maxlength="64" pattern="[a-zA-Z0-9_.\-]+" class="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-flixer-text outline-none placeholder:text-flixer-muted/70" required />
      </AuthField>

      <AuthField id="login-password" class="mt-5" :label="t('auth.password')">
        <template #icon>
          <rect x="4.5" y="10" width="15" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2" />
        </template>
        <input v-model="password" :type="isPasswordVisible ? 'text' : 'password'" name="password" :aria-label="t('auth.password')" :placeholder="t('auth.passwordPlaceholder')" autocomplete="current-password" maxlength="128" class="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-flixer-text outline-none placeholder:text-flixer-muted/70" required />
        <template #trailing>
          <button class="grid size-11 shrink-0 place-items-center rounded-r-lg text-flixer-muted transition hover:text-flixer-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-not-allowed" type="button" :aria-label="isPasswordVisible ? t('auth.hidePassword') : t('auth.showPassword')" @click="isPasswordVisible = !isPasswordVisible">
            <svg v-if="isPasswordVisible" class="size-[18px] fill-none stroke-current" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
              <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5.2 0 8.5 5 9 7-.2.8-1 2-2.3 3.2M6.2 6.2C3.8 7.7 2.4 10.4 2 12c.5 1.6 3.8 7 10 7 1.1 0 2.1-.2 3-.5" />
            </svg>
            <svg v-else class="size-[18px] fill-none stroke-current" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </template>
      </AuthField>

      <div v-if="canResend" class="mt-3 text-sm">
        <button type="button" class="font-semibold text-flixer-accent underline-offset-4 hover:underline disabled:cursor-wait disabled:opacity-60" :disabled="isResending" @click="emit('resend')">{{ isResending ? t('auth.sending') : t('auth.resendVerification') }}</button>
      </div>

      <div class="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:[&>*:only-child]:col-span-2">
        <button class="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-flixer-primary to-flixer-secondary text-sm font-semibold text-white shadow-lg shadow-flixer-primary/20 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-wait disabled:opacity-60" type="submit" :disabled="isSubmitting">
          <span>
            {{ isSubmitting ? t('auth.signingIn') : t('auth.signInToFlixer') }}
          </span>
          <svg v-if="!isSubmitting" class="size-[17px] fill-none stroke-current" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M4 10h11M10 5l5 5-5 5" />
          </svg>
          <span v-else class="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true"></span>
        </button>
        <button v-if="passkeysSupported" class="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-flixer-border bg-flixer-surface/50 text-sm font-semibold text-flixer-text transition hover:border-flixer-accent/40 hover:bg-flixer-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-wait disabled:opacity-60" type="button" :disabled="isSubmitting" @click="emit('passkey')">
          <svg class="size-[17px] fill-none stroke-current" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="9" cy="9" r="4" />
            <path d="M12 12l8 8M17 17l2-2M15 15l2-2" />
          </svg>
          {{ t('auth.signInWithPasskey') }}
        </button>
      </div>
    </form>

    <div class="my-7 flex items-center gap-3 text-[9px] font-semibold tracking-[0.16em] text-flixer-muted/70">
      <span class="h-px flex-1 bg-flixer-border"></span>
      <span>{{ t('auth.madeForYourMoments') }}</span>
      <span class="h-px flex-1 bg-flixer-border"></span>
    </div>

    <button class="flex w-full items-center gap-3 rounded-xl border border-flixer-border bg-flixer-surface/50 p-3 text-left transition hover:-translate-y-px hover:border-flixer-accent/40 hover:bg-flixer-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-not-allowed disabled:opacity-55" type="button" :disabled="registrationEnabled !== true" @click="emit('switchMode')">
      <span class="grid size-[34px] shrink-0 place-items-center rounded-lg border border-flixer-accent/20 bg-flixer-primary/10 text-flixer-accent" aria-hidden="true">
        <svg class="size-[17px] fill-none stroke-current" viewBox="0 0 24 24">
          <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6M22 11h-6" />
        </svg>
      </span>
      <span class="flex min-w-0 flex-1 flex-col gap-0.5">
        <strong class="text-xs font-semibold text-flixer-text/90">{{ t('auth.newToFlixer') }}</strong>
        <span class="text-[11px] leading-5 text-flixer-muted">{{ t('auth.createYourAccount') }}</span>
      </span>
      <svg class="size-[17px] shrink-0 fill-none stroke-flixer-accent" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M4 10h11M10 5l5 5-5 5" />
      </svg>
    </button>
    <output v-if="registrationStatusError" class="mt-3 text-center text-xs leading-5 text-flixer-muted">
      {{ registrationStatusError }}
    </output>
    <output v-else-if="registrationEnabled === false" class="mt-3 text-center text-xs leading-5 text-flixer-muted">{{ t('auth.registrationDisabled') }}</output>
    <output v-else-if="registrationEnabled === null" class="mt-3 text-center text-xs leading-5 text-flixer-muted">{{ t('auth.checkingRegistration') }}</output>
  </div>
</template>
