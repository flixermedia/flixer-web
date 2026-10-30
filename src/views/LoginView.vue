<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { BiometricAuthError } from '@capgo/capacitor-native-biometric'
import { SavePassword } from '@capgo/capacitor-autofill-save-password'
import logo from '../../resources/logo/flixer-logo.svg'
import LoginForm from '../components/auth/LoginForm.vue'
import RegistrationForm from '../components/auth/RegistrationForm.vue'
import VerificationNotice from '../components/auth/VerificationNotice.vue'
import { notify } from '../composables/notify'
import { useProfile } from '../composables/useProfile'
import PasskeySecondFactor from '../components/auth/PasskeySecondFactor.vue'
import { clearAccessToken, getAccessToken, getRegistrationStatus, login, loginWithPasskey, loginWithPasskeySecondFactor, register, resendVerification, saveAccessToken, validateAccessToken, type AuthResult } from '../api'
import { syncLocaleFromAccount } from '../i18n'
import { isNativeApp } from '../platform/serverConnection'
import { getNativeBiometricCredentials, getNativeBiometricLoginStatus, removeNativeBiometricCredentials, saveNativeAccount, saveNativeBiometricCredentials, restoreNativeAccount } from '../platform/nativeAccount'
import { beginNativePasskeyHandoff } from '../platform/passkeyHandoff'
import { catchError } from '../utils/catchError'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const isSubmitting = ref(false)
const pendingVerificationEmail = ref('')
const passkeyTicket = ref('')
const needsVerification = ref(false)
const isResending = ref(false)
let lastCredentials: { username: string; password: string } | null = null
const registrationEnabled = ref<boolean | null>(null)
const registrationStatusError = ref('')
const loginBanner = ref('')
const nativeUsername = ref('')
const biometricAvailable = ref(false)
const biometricLoginAvailable = ref(false)
const biometricCredentialsForSecondFactor = ref<{ username: string; password: string } | null>(null)
const isRegistration = computed(() => route.name === 'register')
const sessionCheckUnavailable = computed(() => route.query.sessionCheck === 'unavailable')
const SESSION_RECOVERY_INTERVAL_MS = 5_000
let sessionRecoveryTimer: ReturnType<typeof setInterval> | undefined
let sessionRecoveryInFlight = false

function getPostLoginDestination(): string | undefined {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : undefined
}

onMounted(() => {
  void loadRegistrationStatus()
  if (isNativeApp()) void loadNativeSignInOptions()
  startSessionRecovery()
})

onUnmounted(stopSessionRecovery)

watch(sessionCheckUnavailable, (unavailable) => {
  if (unavailable) startSessionRecovery()
  else stopSessionRecovery()
})

function stopSessionRecovery() {
  if (sessionRecoveryTimer) clearInterval(sessionRecoveryTimer)
  sessionRecoveryTimer = undefined
}

function clearSessionCheckWarning() {
  const query = { ...route.query }
  delete query.sessionCheck
  void router.replace({ query })
}

async function recoverSavedSession() {
  if (sessionRecoveryInFlight || !sessionCheckUnavailable.value) return
  if (!getAccessToken()) {
    clearSessionCheckWarning()
    return
  }

  sessionRecoveryInFlight = true
  try {
    const [error, isValid] = await catchError(validateAccessToken())
    if (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        clearAccessToken()
        clearSessionCheckWarning()
      }
      return
    }
    if (!isValid) {
      clearAccessToken()
      clearSessionCheckWarning()
      return
    }

    await router.replace(getPostLoginDestination() ?? '/')
  } finally {
    sessionRecoveryInFlight = false
  }
}

function startSessionRecovery() {
  if (!sessionCheckUnavailable.value || sessionRecoveryTimer) return
  void recoverSavedSession()
  sessionRecoveryTimer = setInterval(() => void recoverSavedSession(), SESSION_RECOVERY_INTERVAL_MS)
}

async function loadNativeSignInOptions() {
  const [accountError, username] = await catchError(restoreNativeAccount())
  if (accountError) {
    console.warn('[native-auth] Could not load native sign-in options', accountError)
    return
  }
  nativeUsername.value = username ?? ''
  const [statusError, status] = await catchError(getNativeBiometricLoginStatus())
  if (statusError) {
    console.warn('[native-auth] Could not load native sign-in options', statusError)
    return
  }
  biometricAvailable.value = status.available
  biometricLoginAvailable.value = status.saved
}

async function loadRegistrationStatus() {
  registrationStatusError.value = ''
  const [error, status] = await catchError(getRegistrationStatus())
  if (error) {
    registrationStatusError.value = t('auth.registrationAvailabilityError')
    return
  }
  registrationEnabled.value = status.registrationEnabled
  loginBanner.value = status.loginBanner ?? ''
}

function switchAuthMode() {
  void router.push({
    name: isRegistration.value ? 'login' : 'register',
    query: route.query,
  })
}

async function promptNativePasswordSave(username: string, password: string) {
  if (!isNativeApp()) return

  const [error] = await catchError(Promise.resolve().then(() => SavePassword.promptDialog({
      username,
      password,
      url: window.location.hostname,
      title: 'Flixer',
    })))
  if (error) {
    console.warn('[native-auth] Password manager save prompt failed', error)
  }
}

async function completeAuthentication(result: AuthResult, biometricCredentials?: { username: string; password: string }) {
  try {
    useProfile().clear()
    saveAccessToken(result.accessToken)
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error))
  }
  if (isNativeApp()) {
    if (!nativeUsername.value) {
      const [error, username] = await catchError(restoreNativeAccount())
      if (error) {
        console.warn('[native-account] Could not check the previously saved account', error)
      } else {
        nativeUsername.value = username ?? ''
      }
    }
    const accountChanged = nativeUsername.value && nativeUsername.value.toLowerCase() !== result.user.username.toLowerCase()
    const [accountError] = await catchError(saveNativeAccount(result.user.username))
    if (!accountError) {
      nativeUsername.value = result.user.username
    } else {
      console.warn('[native-account] Could not save the account for reinstall recovery', accountError)
      notify.error(t('auth.rememberAccountFailed'))
    }
    if (biometricCredentials) {
      const [biometricError] = await catchError(saveNativeBiometricCredentials(biometricCredentials.username, biometricCredentials.password))
      if (biometricError) {
        console.warn('[native-auth] Could not enable biometric sign-in', biometricError)
        notify.error(t('auth.biometricSetupFailed'))
      }
    } else if (accountChanged) {
      const [removeError] = await catchError(removeNativeBiometricCredentials())
      if (!removeError) {
        biometricLoginAvailable.value = false
      } else {
        console.warn('[native-auth] Could not remove credentials for the previous account', removeError)
        notify.error(t('auth.biometricRemoveFailed'))
      }
    }
  }
  const [localeError] = await catchError(syncLocaleFromAccount())
  if (localeError) return localeError

  const redirect = route.query.redirect
  const destination = typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/'

  const [navigationError] = await catchError(router.replace(destination))
  return navigationError
}

function handleLoginError(error: unknown) {
  const message = axios.isAxiosError(error) ? String((error.response?.data as { message?: unknown } | undefined)?.message ?? '') : ''
  // Disabled accounts also answer 403, but resending verification can't help them.
  needsVerification.value = axios.isAxiosError(error) && error.response?.status === 403 && /verify your email/i.test(message)
  notify.error(getRequestErrorMessage(error, false))
}

async function handleLogin(credentials: { username: string; password: string; rememberBiometric: boolean }) {
  needsVerification.value = false
  lastCredentials = credentials
  isSubmitting.value = true

  try {
    const [loginError, result] = await catchError(login(credentials.username, credentials.password))
    if (loginError) {
      handleLoginError(loginError)
      return
    }
    if ('passkeyRequired' in result) {
      passkeyTicket.value = result.ticket
      biometricCredentialsForSecondFactor.value = credentials.rememberBiometric ? { username: credentials.username, password: credentials.password } : null
      return
    }
    await promptNativePasswordSave(credentials.username, credentials.password)
    const authenticationError = await completeAuthentication(result, credentials.rememberBiometric ? { username: credentials.username, password: credentials.password } : undefined)
    if (authenticationError) handleLoginError(authenticationError)
  } finally {
    isSubmitting.value = false
  }
}

function handleSecondFactorError(error: unknown) {
  console.error('[passkey] second factor failed', error)
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    passkeyTicket.value = ''
    notify.error(t('auth.passkeySecondFactorExpired'))
  } else {
    notify.error(error instanceof Error && error.name === 'NotAllowedError' ? t('auth.passkeyCheckCancelled') : getRequestErrorMessage(error, false))
  }
}

async function handleSecondFactor() {
  isSubmitting.value = true

  try {
    if (isNativeApp()) {
      const biometricCredentials = biometricCredentialsForSecondFactor.value
      if (biometricCredentials) {
        const [saveError] = await catchError(saveNativeBiometricCredentials(biometricCredentials.username, biometricCredentials.password))
        if (!saveError) {
          biometricLoginAvailable.value = true
        } else {
          console.warn('[native-auth] Could not enable biometric sign-in', saveError)
          notify.error(t('auth.biometricSetupFailed'))
        }
      }
      const [handoffError] = await catchError(beginNativePasskeyHandoff(passkeyTicket.value, getPostLoginDestination()))
      if (handoffError) handleSecondFactorError(handoffError)
      return
    }

    const [loginError, result] = await catchError(loginWithPasskeySecondFactor(passkeyTicket.value))
    if (loginError) {
      handleSecondFactorError(loginError)
      return
    }
    passkeyTicket.value = ''
    const authenticationError = await completeAuthentication(result, biometricCredentialsForSecondFactor.value ?? undefined)
    if (authenticationError) {
      handleSecondFactorError(authenticationError)
      return
    }
    biometricCredentialsForSecondFactor.value = null
  } finally {
    isSubmitting.value = false
  }
}

function cancelSecondFactor() {
  passkeyTicket.value = ''
}

async function handleResendVerification() {
  if (!lastCredentials) {
    return
  }

  isResending.value = true
  try {
    const [error] = await catchError(resendVerification(lastCredentials.username, lastCredentials.password))
    if (error) {
      console.error('[auth] resend verification failed', error)
      notify.error(getRequestErrorMessage(error, false))
      return
    }
    notify.success(t('auth.verificationEmailSentToast'))
  } finally {
    isResending.value = false
  }
}

function leaveVerificationNotice() {
  pendingVerificationEmail.value = ''
  void router.push({ name: 'login', query: route.query })
}

async function handlePasskeyLogin() {
  isSubmitting.value = true

  try {
    if (isNativeApp()) {
      const [error] = await catchError(beginNativePasskeyHandoff(undefined, getPostLoginDestination()))
      if (error) {
        console.error('[passkey] login failed', error)
        notify.error(error instanceof Error && error.name === 'NotAllowedError' ? t('auth.passkeyLoginCancelled', { message: error.message }) : getRequestErrorMessage(error, false))
      }
      return
    }

    const [loginError, result] = await catchError(loginWithPasskey())
    if (loginError) {
      console.error('[passkey] login failed', loginError)
      notify.error(loginError instanceof Error && loginError.name === 'NotAllowedError' ? t('auth.passkeyLoginCancelled', { message: loginError.message }) : getRequestErrorMessage(loginError, false))
      return
    }
    const authenticationError = await completeAuthentication(result)
    if (authenticationError) {
      console.error('[passkey] login failed', authenticationError)
      notify.error(authenticationError instanceof Error && authenticationError.name === 'NotAllowedError' ? t('auth.passkeyLoginCancelled', { message: authenticationError.message }) : getRequestErrorMessage(authenticationError, false))
    }
  } finally {
    isSubmitting.value = false
  }
}

async function handleBiometricLogin() {
  isSubmitting.value = true
  try {
    const [credentialsError, credentials] = await catchError(getNativeBiometricCredentials())
    if (credentialsError) {
      await handleBiometricLoginError(credentialsError)
      return
    }
    lastCredentials = credentials
    const [loginError, result] = await catchError(login(credentials.username, credentials.password))
    if (loginError) {
      await handleBiometricLoginError(loginError)
      return
    }
    if ('passkeyRequired' in result) {
      biometricCredentialsForSecondFactor.value = credentials
      passkeyTicket.value = result.ticket
      return
    }
    const authenticationError = await completeAuthentication(result)
    if (authenticationError) await handleBiometricLoginError(authenticationError)
  } finally {
    isSubmitting.value = false
  }
}

async function handleBiometricLoginError(error: unknown) {
  const errorCode = typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'number' ? error.code : undefined
  if (errorCode === BiometricAuthError.USER_CANCEL || errorCode === BiometricAuthError.SYSTEM_CANCEL || errorCode === BiometricAuthError.APP_CANCEL) return
  console.error('[native-auth] Biometric sign-in failed', error)
  if (errorCode === BiometricAuthError.NO_PROTECTED_CREDENTIALS_FOUND) {
    biometricLoginAvailable.value = false
    const [removeError] = await catchError(removeNativeBiometricCredentials())
    if (removeError) console.warn('[native-auth] Could not remove stale biometric credentials', removeError)
    notify.error(t('auth.biometricCredentialsUnavailable'))
    return
  }
  notify.error(getRequestErrorMessage(error, false))
}

async function handleForgetBiometricLogin() {
  const [error] = await catchError(removeNativeBiometricCredentials())
  if (error) {
    console.error('[native-auth] Could not remove biometric sign-in', error)
    notify.error(t('auth.biometricRemoveFailed'))
    return
  }
  biometricLoginAvailable.value = false
}

async function handleRegistration(credentials: { username: string; password: string; email: string; displayName: string }) {
  if (registrationEnabled.value !== true) {
    return
  }

  isSubmitting.value = true

  try {
    const [registrationError, result] = await catchError(register(credentials.username, credentials.password, credentials.email, credentials.displayName))
    if (registrationError) {
      notify.error(getRequestErrorMessage(registrationError, true))
      return
    }
    if ('verificationRequired' in result) {
      pendingVerificationEmail.value = result.email
      return
    }
    const authenticationError = await completeAuthentication(result)
    if (authenticationError) notify.error(getRequestErrorMessage(authenticationError, true))
  } finally {
    isSubmitting.value = false
  }
}

function getRequestErrorMessage(error: unknown, registration: boolean): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    const message = error.response?.data?.message
    if (typeof message === 'string' && message) {
      return message
    }

    if (!error.response) {
      return t('auth.networkError')
    }

    return registration ? t('auth.registrationError') : t('auth.signInError')
  }

  return t('auth.genericError')
}
</script>

<template>
  <main class="login-background relative isolate min-h-[100dvh] overflow-hidden font-sans text-flixer-text lg:grid lg:grid-cols-2">
    <section class="relative isolate flex flex-col overflow-hidden px-6 py-6 sm:px-10 lg:h-auto lg:min-h-screen lg:bg-gradient-to-br lg:from-flixer-surface lg:via-flixer-background lg:to-flixer-background lg:px-16 lg:py-11" :aria-label="t('auth.welcomeToFlixer')">
      <!-- Decorative background elements -->
      <div class="pointer-events-none absolute -left-24 top-1/3 -z-10 hidden size-80 rounded-full bg-flixer-primary/20 blur-3xl lg:block" aria-hidden="true"></div>
      <div class="pointer-events-none absolute -right-20 top-0 -z-10 hidden size-72 rounded-full bg-flixer-cyan/10 blur-3xl lg:block" aria-hidden="true"></div>

      <!-- Logo and navigation -->
      <RouterLink class="mx-auto lg:mx-0 relative z-10 inline-flex w-fit items-center lg:gap-3 text-flixer-text no-underline" to="/" :aria-label="t('auth.flixerHome')">
        <img :src="logo" alt="" class="size-20 mt-15 lg:mt-0 lg:size-10 rounded-xl shadow-lg" aria-hidden="true" />
        <span class="hidden lg:inline text-2xl font-bold tracking-tight">{{ t('auth.brandName') }}</span>
      </RouterLink>

      <!-- Welcome message -->
      <div class="relative z-10 mb-8 mt-8 hidden max-w-xl lg:mt-[12vh] lg:block">
        <span class="flex items-center gap-2.5 text-[10px] font-bold tracking-[0.2em] text-flixer-muted">
          <span class="size-2 rounded-full bg-flixer-cyan shadow-[0_0_14px_rgba(75,217,232,0.65)]"></span>
          {{ t('auth.nextFavoriteIsHere') }}
        </span>
        <h2 class="mt-2 text-4xl font-semibold leading-tight tracking-tight text-flixer-text sm:text-5xl lg:text-6xl">
          {{ t('auth.everyStory') }}
          <br />
          {{ t('auth.startsSomewhere') }}
          <span class="text-flixer-accent">{{ t('auth.somewhere') }}</span>
        </h2>
        <p class="mt-4 max-w-sm text-sm leading-5 text-flixer-muted sm:text-base">{{ t('auth.welcomeDescription') }}</p>
      </div>

      <div class="relative z-10 mt-auto hidden items-center gap-3 pt-12 text-[9px] font-bold tracking-[0.18em] text-flixer-muted lg:flex">
        <span class="h-px w-7 bg-gradient-to-r from-flixer-primary to-flixer-cyan"></span>
        {{ t('auth.storiesWorthStayingInFor') }}
      </div>
    </section>

    <section class="relative z-10 flex min-h-[420px] flex-col items-center px-6 pb-8 pt-5 sm:px-10 lg:min-h-screen lg:justify-center lg:bg-flixer-background lg:px-12 lg:py-16" :aria-labelledby="isRegistration ? 'registration-title' : 'login-title'">
      <div class="absolute right-8 top-8 hidden items-center gap-2 text-[9px] font-bold tracking-widest text-flixer-muted lg:flex">
        <Icon icon="lucide:lock-keyhole" class="size-3.5" aria-hidden="true" />
        {{ t('auth.secureMode', { mode: isRegistration ? t('auth.registrationMode') : t('auth.signInMode') }) }}
      </div>

      <p v-if="loginBanner" class="w-full max-w-md whitespace-pre-line rounded-xl border border-flixer-border/70 bg-flixer-surface/50 px-4 py-3 text-center text-sm text-flixer-muted">{{ loginBanner }}</p>

      <div class="w-full mt-0 lg:mt-4 max-w-md rounded-2xl border border-flixer-border/70 bg-flixer-surface/70 p-6 shadow-2xl backdrop-blur-xl sm:p-8 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
        <Transition :name="isRegistration ? 'auth-slide-left' : 'auth-slide-right'" mode="out-in">
          <div :key="pendingVerificationEmail ? 'verification' : passkeyTicket ? 'second-factor' : isRegistration ? 'registration' : 'login'">
            <VerificationNotice v-if="pendingVerificationEmail" :email="pendingVerificationEmail" @back="leaveVerificationNotice" />
            <PasskeySecondFactor v-else-if="passkeyTicket" :is-submitting="isSubmitting" @verify="handleSecondFactor" @back="cancelSecondFactor" />
            <LoginForm v-else-if="!isRegistration" :is-submitting="isSubmitting" :session-check-unavailable="sessionCheckUnavailable" :registration-enabled="registrationEnabled" :registration-status-error="registrationStatusError" :can-resend="needsVerification" :is-resending="isResending" :initial-username="nativeUsername" :biometric-available="biometricAvailable" :biometric-login-available="biometricLoginAvailable" @submit="handleLogin" @passkey="handlePasskeyLogin" @biometric="handleBiometricLogin" @forget-biometric="handleForgetBiometricLogin" @resend="handleResendVerification" @switch-mode="switchAuthMode" />
            <RegistrationForm v-else :is-submitting="isSubmitting" :registration-enabled="registrationEnabled" :registration-status-error="registrationStatusError" @submit="handleRegistration" @switch-mode="switchAuthMode" />
          </div>
        </Transition>
      </div>

      <footer class="mt-auto hidden items-center justify-center gap-2 pt-10 text-[10px] text-flixer-muted/70 lg:flex">
        <span>{{ t('auth.copyright', { year: 2026 }) }}</span>
        <span class="text-flixer-accent">·</span>
        <span>{{ t('auth.madeForMovieNights') }}</span>
      </footer>
      <RouterLink v-if="isNativeApp()" :to="{ name: 'connect' }" class="mt-5 text-sm text-flixer-muted underline hover:text-flixer-text">
        {{ t('native.changeServer') }}
      </RouterLink>
    </section>
  </main>
</template>

<style scoped>
:global(html:has(.login-background)),
:global(body:has(.login-background)),
.login-background {
  background: radial-gradient(ellipse 32rem 28rem at 100% 24%, color-mix(in srgb, var(--color-flixer-cyan) 10%, transparent), transparent), radial-gradient(ellipse 34rem 38rem at 0% 57%, color-mix(in srgb, var(--color-flixer-primary) 20%, transparent), transparent), var(--color-flixer-background);
}

.auth-slide-left-enter-active,
.auth-slide-left-leave-active,
.auth-slide-right-enter-active,
.auth-slide-right-leave-active {
  transition:
    opacity 200ms ease,
    transform 200ms ease;
}

.auth-slide-left-leave-active,
.auth-slide-right-leave-active {
  transition-duration: 150ms;
}

.auth-slide-left-enter-from {
  opacity: 0;
  transform: translateX(2rem);
}

.auth-slide-left-leave-to {
  opacity: 0;
  transform: translateX(-2rem);
}

.auth-slide-right-enter-from {
  opacity: 0;
  transform: translateX(-2rem);
}

.auth-slide-right-leave-to {
  opacity: 0;
  transform: translateX(2rem);
}

@media (prefers-reduced-motion: reduce) {
  .auth-slide-left-enter-active,
  .auth-slide-left-leave-active,
  .auth-slide-right-enter-active,
  .auth-slide-right-leave-active {
    transition: none;
  }
}
</style>
