<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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
  quickConnectEnabled?: boolean
  canResend?: boolean
  isResending?: boolean
  initialUsername?: string
  biometricAvailable?: boolean
  biometricLoginAvailable?: boolean
  oauthSignIn?: boolean
  oauthClientName?: string
  hideModeSwitch?: boolean
}>()

const emit = defineEmits<{
  submit: [credentials: { username: string; password: string; rememberBiometric: boolean }]
  switchMode: []
  passkey: []
  biometric: []
  forgetBiometric: []
  resend: []
  quickConnect: []
}>()

const username = ref(props.initialUsername ?? '')
const password = ref('')
const isPasswordVisible = ref(false)
const rememberBiometric = ref(false)

const hasSecondaryMethods = computed(
  () => Boolean(props.biometricLoginAvailable || passkeysSupported || (props.quickConnectEnabled && !props.oauthSignIn)),
)

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
    <template v-if="oauthSignIn">
      <span class="text-[10px] font-semibold uppercase tracking-[0.2em] text-flixer-accent">{{ t('oidc.signInEyebrow') }}</span>
      <h1 id="login-title" class="mt-2 break-words text-2xl font-semibold tracking-tight text-flixer-text sm:text-3xl">
        {{ t('oidc.signInTitle', { client: oauthClientName }) }}
      </h1>
      <p class="mt-1.5 text-sm text-flixer-muted">{{ t('oidc.signInDescription') }}</p>
    </template>
    <template v-else>
      <span class="text-[10px] font-semibold uppercase tracking-[0.2em] text-flixer-accent">{{ t('auth.loginEyebrow') }}</span>
      <h1 id="login-title" class="mt-2 text-2xl font-semibold tracking-tight text-flixer-text sm:text-3xl">
        {{ t('auth.welcomeBack') }}<span class="text-flixer-accent">.</span>
      </h1>
      <p class="mt-1.5 text-sm text-flixer-muted">{{ t('auth.signInDescription') }}</p>
    </template>

    <output
      v-if="sessionCheckUnavailable"
      class="mt-4 block rounded border border-flixer-accent/25 bg-flixer-primary/10 px-3.5 py-2.5 text-xs leading-5 text-flixer-accent"
    >
      {{ t('auth.sessionCheckUnavailable') }}
    </output>

    <form class="mt-6 flex flex-col gap-4" @submit.prevent="handleSubmit">
      <AuthField id="login-username" :label="t('auth.username')">
        <template #icon>
          <Icon icon="lucide:user-round" class="ml-3.5 size-4 shrink-0 text-flixer-muted" aria-hidden="true" />
        </template>
        <input
          v-model.trim="username"
          type="text"
          name="username"
          :aria-label="t('auth.username')"
          :placeholder="t('auth.usernamePlaceholder')"
          autocomplete="username"
          autocapitalize="none"
          autocorrect="off"
          spellcheck="false"
          minlength="3"
          maxlength="64"
          pattern="[a-zA-Z0-9_.\-]+"
          class="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-flixer-text outline-none placeholder:text-flixer-muted/60"
          required
        />
      </AuthField>

      <AuthField id="login-password" :label="t('auth.password')">
        <template #icon>
          <Icon icon="lucide:lock-keyhole" class="ml-3.5 size-4 shrink-0 text-flixer-muted" aria-hidden="true" />
        </template>
        <input
          v-model="password"
          :type="isPasswordVisible ? 'text' : 'password'"
          name="password"
          :aria-label="t('auth.password')"
          :placeholder="t('auth.passwordPlaceholder')"
          autocomplete="current-password"
          maxlength="128"
          class="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-flixer-text outline-none placeholder:text-flixer-muted/60"
          required
        />
        <template #trailing>
          <button
            class="grid size-10 shrink-0 place-items-center rounded-r text-flixer-muted transition-colors hover:text-flixer-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-not-allowed"
            type="button"
            :aria-label="isPasswordVisible ? t('auth.hidePassword') : t('auth.showPassword')"
            @click="isPasswordVisible = !isPasswordVisible"
          >
            <Icon :icon="isPasswordVisible ? 'lucide:eye-off' : 'lucide:eye'" class="size-4" aria-hidden="true" />
          </button>
        </template>
      </AuthField>

      <div v-if="canResend" class="text-xs">
        <button
          type="button"
          class="font-semibold text-flixer-accent underline-offset-4 hover:underline disabled:cursor-wait disabled:opacity-60"
          :disabled="isResending"
          @click="emit('resend')"
        >
          {{ isResending ? t('auth.sending') : t('auth.resendVerification') }}
        </button>
      </div>

      <label v-if="biometricAvailable" class="flex cursor-pointer items-center gap-2.5 text-xs text-flixer-muted">
        <input v-model="rememberBiometric" type="checkbox" class="size-4 rounded accent-flixer-accent" />
        <span>{{ t('auth.enableBiometricLogin') }}</span>
      </label>

      <button
        class="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded bg-gradient-to-r from-flixer-primary to-flixer-secondary text-sm font-semibold text-white shadow-sm transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-wait disabled:opacity-60"
        type="submit"
        :disabled="isSubmitting"
      >
        <span>{{ isSubmitting ? t('auth.signingIn') : t('auth.signInToFlixer') }}</span>
        <Icon v-if="!isSubmitting" icon="lucide:arrow-right" class="size-4" aria-hidden="true" />
        <span v-else class="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true"></span>
      </button>
    </form>

    <div v-if="hasSecondaryMethods" class="mt-5">
      <div class="mb-3 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-flixer-muted/70">
        <span class="h-px flex-1 bg-flixer-border"></span>
        <span>{{ t('auth.otherSignInOptions') }}</span>
        <span class="h-px flex-1 bg-flixer-border"></span>
      </div>

      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          v-if="biometricLoginAvailable"
          class="flex h-10 items-center justify-center gap-2 rounded border border-flixer-accent/40 bg-flixer-primary/10 px-3 text-xs font-medium text-flixer-text transition hover:bg-flixer-primary/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-wait disabled:opacity-60"
          type="button"
          :disabled="isSubmitting"
          @click="emit('biometric')"
        >
          <Icon icon="lucide:fingerprint" class="size-4 shrink-0 text-flixer-accent" aria-hidden="true" />
          <span class="truncate">{{ t('auth.signInWithBiometrics') }}</span>
        </button>

        <button
          v-if="passkeysSupported"
          class="flex h-10 items-center justify-center gap-2 rounded border border-flixer-border bg-flixer-background/60 px-3 text-xs font-medium text-flixer-text transition hover:border-flixer-accent/50 hover:bg-flixer-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-wait disabled:opacity-60"
          type="button"
          :disabled="isSubmitting"
          @click="emit('passkey')"
        >
          <Icon icon="lucide:key-round" class="size-4 shrink-0 text-flixer-muted" aria-hidden="true" />
          <span class="truncate">{{ t('auth.signInWithPasskey') }}</span>
        </button>

        <button
          v-if="quickConnectEnabled && !oauthSignIn"
          class="flex h-10 items-center justify-center gap-2 rounded border border-flixer-border bg-flixer-background/60 px-3 text-xs font-medium text-flixer-text transition hover:border-flixer-accent/50 hover:bg-flixer-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-wait disabled:opacity-60"
          type="button"
          :disabled="isSubmitting"
          @click="emit('quickConnect')"
        >
          <Icon icon="lucide:monitor-smartphone" class="size-4 shrink-0 text-flixer-muted" aria-hidden="true" />
          <span class="truncate">{{ t('auth.quickConnectMenu') }}</span>
        </button>
      </div>

      <button
        v-if="biometricLoginAvailable"
        class="mt-2.5 block w-full text-center text-xs text-flixer-muted underline underline-offset-4 hover:text-flixer-text"
        type="button"
        :disabled="isSubmitting"
        @click="emit('forgetBiometric')"
      >
        {{ t('auth.forgetBiometricLogin') }}
      </button>
    </div>

    <div v-if="!oauthSignIn && !hideModeSwitch" class="mt-5 border-t border-flixer-border/70 pt-4 text-center text-xs text-flixer-muted">
      <span>{{ t('auth.newToFlixer') }}</span>
      <button
        class="ml-1.5 font-semibold text-flixer-accent underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        type="button"
        :disabled="registrationEnabled !== true"
        @click="emit('switchMode')"
      >
        {{ t('auth.createYourAccount') }}
      </button>
    </div>

    <output v-if="!oauthSignIn && !registrationStatusError && registrationEnabled === false" class="mt-3 block text-center text-xs leading-5 text-flixer-muted">
      {{ t('auth.registrationDisabled') }}
    </output>
    <output v-else-if="!oauthSignIn && !registrationStatusError && registrationEnabled === null" class="mt-3 block text-center text-xs leading-5 text-flixer-muted">
      {{ t('auth.checkingRegistration') }}
    </output>
  </div>
</template>
