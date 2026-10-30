<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { browserSupportsWebAuthn } from '@simplewebauthn/browser'
import { isNativeApp } from '../../platform/serverConnection'
import AuthField from './AuthField.vue'

const passkeysSupported = isNativeApp() || browserSupportsWebAuthn()
const { t } = useI18n()

const props = defineProps<{
  isSubmitting: boolean
  sessionCheckUnavailable: boolean
  registrationEnabled: boolean | null
  registrationStatusError: string
  canResend?: boolean
  isResending?: boolean
  initialUsername?: string
  biometricAvailable?: boolean
  biometricLoginAvailable?: boolean
}>()

const emit = defineEmits<{
  submit: [credentials: { username: string; password: string; rememberBiometric: boolean }]
  switchMode: []
  passkey: []
  biometric: []
  forgetBiometric: []
  resend: []
}>()

const username = ref(props.initialUsername ?? '')
const password = ref('')
const isPasswordVisible = ref(false)
const rememberBiometric = ref(false)

watch(
  () => props.initialUsername,
  (value) => {
    if (!username.value && value) username.value = value
  },
)

function handleSubmit() {
  emit('submit', { username: username.value, password: password.value, rememberBiometric: rememberBiometric.value })
}
</script>

<template>
  <div data-haptic class="w-full">
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
          <Icon icon="lucide:user-round" class="ml-4 size-[18px] shrink-0 text-flixer-muted" aria-hidden="true" />
        </template>
        <input v-model.trim="username" type="text" name="username" :aria-label="t('auth.username')" :placeholder="t('auth.usernamePlaceholder')" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" minlength="3" maxlength="64" pattern="[a-zA-Z0-9_.\-]+" class="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-flixer-text outline-none placeholder:text-flixer-muted/70" required />
      </AuthField>

      <AuthField id="login-password" class="mt-5" :label="t('auth.password')">
        <template #icon>
          <Icon icon="lucide:lock-keyhole" class="ml-4 size-[18px] shrink-0 text-flixer-muted" aria-hidden="true" />
        </template>
        <input v-model="password" :type="isPasswordVisible ? 'text' : 'password'" name="password" :aria-label="t('auth.password')" :placeholder="t('auth.passwordPlaceholder')" autocomplete="current-password" maxlength="128" class="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-flixer-text outline-none placeholder:text-flixer-muted/70" required />
        <template #trailing>
          <button class="grid size-11 shrink-0 place-items-center rounded-r-lg text-flixer-muted transition hover:text-flixer-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-not-allowed" type="button" :aria-label="isPasswordVisible ? t('auth.hidePassword') : t('auth.showPassword')" @click="isPasswordVisible = !isPasswordVisible">
            <Icon :icon="isPasswordVisible ? 'lucide:eye-off' : 'lucide:eye'" class="size-[18px]" aria-hidden="true" />
          </button>
        </template>
      </AuthField>

      <div v-if="canResend" class="mt-3 text-sm">
        <button type="button" class="font-semibold text-flixer-accent underline-offset-4 hover:underline disabled:cursor-wait disabled:opacity-60" :disabled="isResending" @click="emit('resend')">{{ isResending ? t('auth.sending') : t('auth.resendVerification') }}</button>
      </div>

      <label v-if="biometricAvailable" class="mt-4 flex cursor-pointer items-start gap-3 text-sm text-flixer-muted">
        <input v-model="rememberBiometric" type="checkbox" class="mt-0.5 size-4 accent-flixer-accent" />
        <span>{{ t('auth.enableBiometricLogin') }}</span>
      </label>

      <div class="mt-6 flex flex-col gap-3">
        <button class="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-flixer-primary to-flixer-secondary text-sm font-semibold text-white shadow-lg shadow-flixer-primary/20 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-wait disabled:opacity-60" type="submit" :disabled="isSubmitting">
          <span>
            {{ isSubmitting ? t('auth.signingIn') : t('auth.signInToFlixer') }}
          </span>
          <Icon v-if="!isSubmitting" icon="lucide:arrow-right" class="size-[17px]" aria-hidden="true" />
          <span v-else class="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true"></span>
        </button>
        <button v-if="biometricLoginAvailable" class="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-flixer-accent/40 bg-flixer-primary/10 text-sm font-semibold text-flixer-text transition hover:bg-flixer-primary/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-wait disabled:opacity-60" type="button" :disabled="isSubmitting" @click="emit('biometric')">
          {{ t('auth.signInWithBiometrics') }}
        </button>
        <button v-if="passkeysSupported" class="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-flixer-border bg-flixer-surface/50 text-sm font-semibold text-flixer-text transition hover:border-flixer-accent/40 hover:bg-flixer-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-wait disabled:opacity-60" type="button" :disabled="isSubmitting" @click="emit('passkey')">
          <Icon icon="lucide:key-round" class="size-[17px]" aria-hidden="true" />
          {{ t('auth.signInWithPasskey') }}
        </button>
        <button v-if="biometricLoginAvailable" class="self-center text-xs text-flixer-muted underline underline-offset-4 hover:text-flixer-text" type="button" :disabled="isSubmitting" @click="emit('forgetBiometric')">
          {{ t('auth.forgetBiometricLogin') }}
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
        <Icon icon="lucide:user-round-plus" class="size-[17px]" aria-hidden="true" />
      </span>
      <span class="flex min-w-0 flex-1 flex-col gap-0.5">
        <strong class="text-xs font-semibold text-flixer-text/90">{{ t('auth.newToFlixer') }}</strong>
        <span class="text-[11px] leading-5 text-flixer-muted">{{ t('auth.createYourAccount') }}</span>
      </span>
      <Icon icon="lucide:arrow-right" class="size-[17px] shrink-0 text-flixer-accent" aria-hidden="true" />
    </button>
    <output v-if="registrationStatusError" class="mt-3 text-center text-xs leading-5 text-flixer-muted">
      {{ registrationStatusError }}
    </output>
    <output v-else-if="registrationEnabled === false" class="mt-3 text-center text-xs leading-5 text-flixer-muted">{{ t('auth.registrationDisabled') }}</output>
    <output v-else-if="registrationEnabled === null" class="mt-3 text-center text-xs leading-5 text-flixer-muted">{{ t('auth.checkingRegistration') }}</output>
  </div>
</template>
