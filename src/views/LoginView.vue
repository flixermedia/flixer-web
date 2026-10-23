<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import logo from '../../resources/logo/flixer-logo.svg'
import LoginForm from '../components/auth/LoginForm.vue'
import RegistrationForm from '../components/auth/RegistrationForm.vue'
import VerificationNotice from '../components/auth/VerificationNotice.vue'
import { notify } from '../composables/notify'
import { useProfile } from '../composables/useProfile'
import PasskeySecondFactor from '../components/auth/PasskeySecondFactor.vue'
import { getRegistrationStatus, login, loginWithPasskey, loginWithPasskeySecondFactor, register, resendVerification, saveAccessToken } from '../api'
import { syncLocaleFromAccount } from '../i18n'

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
const isRegistration = computed(() => route.name === 'register')
const sessionCheckUnavailable = computed(() => route.query.sessionCheck === 'unavailable')

onMounted(() => {
  void loadRegistrationStatus()
})

async function loadRegistrationStatus() {
  registrationStatusError.value = ''
  try {
    const status = await getRegistrationStatus()
    registrationEnabled.value = status.registrationEnabled
    loginBanner.value = status.loginBanner ?? ''
  } catch {
    registrationStatusError.value = t('auth.registrationAvailabilityError')
  }
}

function switchAuthMode() {
  void router.push({
    name: isRegistration.value ? 'login' : 'register',
    query: route.query,
  })
}

async function completeAuthentication(accessToken: string) {
  useProfile().clear()
  saveAccessToken(accessToken)
  await syncLocaleFromAccount()

  const redirect = route.query.redirect
  const destination = typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/'

  await router.replace(destination)
}

async function handleLogin(credentials: { username: string; password: string }) {
  needsVerification.value = false
  lastCredentials = credentials
  isSubmitting.value = true

  try {
    const result = await login(credentials.username, credentials.password)
    if ('passkeyRequired' in result) {
      passkeyTicket.value = result.ticket
      return
    }
    await completeAuthentication(result.accessToken)
  } catch (error: unknown) {
    const message = axios.isAxiosError(error) ? String((error.response?.data as { message?: unknown } | undefined)?.message ?? '') : ''
    // Disabled accounts also answer 403, but resending verification can't help them.
    needsVerification.value = axios.isAxiosError(error) && error.response?.status === 403 && /verify your email/i.test(message)
    notify.error(getRequestErrorMessage(error, false))
  } finally {
    isSubmitting.value = false
  }
}

async function handleSecondFactor() {
  isSubmitting.value = true

  try {
    const result = await loginWithPasskeySecondFactor(passkeyTicket.value)
    passkeyTicket.value = ''
    await completeAuthentication(result.accessToken)
  } catch (error: unknown) {
    console.error('[passkey] second factor failed', error)
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      passkeyTicket.value = ''
      notify.error(t('auth.passkeySecondFactorExpired'))
    } else {
      notify.error(error instanceof Error && error.name === 'NotAllowedError' ? t('auth.passkeyCheckCancelled') : getRequestErrorMessage(error, false))
    }
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
    await resendVerification(lastCredentials.username, lastCredentials.password)
    notify.success(t('auth.verificationEmailSentToast'))
  } catch (error: unknown) {
    console.error('[auth] resend verification failed', error)
    notify.error(getRequestErrorMessage(error, false))
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
    const result = await loginWithPasskey()
    await completeAuthentication(result.accessToken)
  } catch (error: unknown) {
    console.error('[passkey] login failed', error)
    notify.error(error instanceof Error && error.name === 'NotAllowedError' ? t('auth.passkeyLoginCancelled', { message: error.message }) : getRequestErrorMessage(error, false))
  } finally {
    isSubmitting.value = false
  }
}

async function handleRegistration(credentials: { username: string; password: string; email: string; displayName: string }) {
  if (registrationEnabled.value !== true) {
    return
  }

  isSubmitting.value = true

  try {
    const result = await register(credentials.username, credentials.password, credentials.email, credentials.displayName)
    if ('verificationRequired' in result) {
      pendingVerificationEmail.value = result.email
      return
    }
    await completeAuthentication(result.accessToken)
  } catch (error: unknown) {
    notify.error(getRequestErrorMessage(error, true))
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
  <main class="relative isolate min-h-screen overflow-hidden bg-flixer-background font-sans text-flixer-text lg:grid lg:grid-cols-2">
    <!-- Full-page decorative background on mobile and tablet -->
    <div class="pointer-events-none fixed inset-0 -z-10 overflow-hidden lg:hidden" aria-hidden="true">
      <div class="absolute -left-24 top-1/3 size-80 rounded-full bg-flixer-primary/20 blur-3xl"></div>
      <div class="absolute -right-20 top-0 size-72 rounded-full bg-flixer-cyan/10 blur-3xl"></div>
    </div>

    <section class="relative isolate flex flex-col overflow-hidden px-6 py-6 sm:px-10 lg:h-auto lg:min-h-screen lg:bg-gradient-to-br lg:from-flixer-surface lg:via-flixer-background lg:to-flixer-background lg:px-16 lg:py-11" :aria-label="t('auth.welcomeToFlixer')">
      <!-- Decorative background elements -->
      <div class="pointer-events-none absolute -left-24 top-1/3 -z-10 hidden size-80 rounded-full bg-flixer-primary/20 blur-3xl lg:block" aria-hidden="true"></div>
      <div class="pointer-events-none absolute -right-20 top-0 -z-10 hidden size-72 rounded-full bg-flixer-cyan/10 blur-3xl lg:block" aria-hidden="true"></div>

      <!-- Logo and navigation -->
      <RouterLink class="mx-auto lg:mx-0 relative z-10 inline-flex w-fit items-center lg:gap-3 text-flixer-text no-underline" to="/" :aria-label="t('auth.flixerHome')">
        <img :src="logo" alt="" class="size-20 mt-4 lg:mt-0 lg:size-10 rounded-xl shadow-lg" aria-hidden="true" />
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
        <svg class="size-3.5 fill-none stroke-current" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4.5 7V5a3.5 3.5 0 0 1 7 0v2M3.5 7h9v7h-9z" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.4" />
        </svg>
        {{ t('auth.secureMode', { mode: isRegistration ? t('auth.registrationMode') : t('auth.signInMode') }) }}
      </div>

      <p v-if="loginBanner" class="w-full max-w-md whitespace-pre-line rounded-xl border border-flixer-border/70 bg-flixer-surface/50 px-4 py-3 text-center text-sm text-flixer-muted">{{ loginBanner }}</p>

      <div class="w-full mt-0 lg:mt-4 max-w-md rounded-2xl border border-flixer-border/70 bg-flixer-surface/70 p-6 shadow-2xl backdrop-blur-xl sm:p-8 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
        <Transition :name="isRegistration ? 'auth-slide-left' : 'auth-slide-right'" mode="out-in">
          <div :key="pendingVerificationEmail ? 'verification' : passkeyTicket ? 'second-factor' : isRegistration ? 'registration' : 'login'">
            <VerificationNotice v-if="pendingVerificationEmail" :email="pendingVerificationEmail" @back="leaveVerificationNotice" />
            <PasskeySecondFactor v-else-if="passkeyTicket" :is-submitting="isSubmitting" @verify="handleSecondFactor" @back="cancelSecondFactor" />
            <LoginForm v-else-if="!isRegistration" :is-submitting="isSubmitting" :session-check-unavailable="sessionCheckUnavailable" :registration-enabled="registrationEnabled" :registration-status-error="registrationStatusError" :can-resend="needsVerification" :is-resending="isResending" @submit="handleLogin" @passkey="handlePasskeyLogin" @resend="handleResendVerification" @switch-mode="switchAuthMode" />
            <RegistrationForm v-else :is-submitting="isSubmitting" :registration-enabled="registrationEnabled" :registration-status-error="registrationStatusError" @submit="handleRegistration" @switch-mode="switchAuthMode" />
          </div>
        </Transition>
      </div>

      <footer class="mt-auto hidden items-center justify-center gap-2 pt-10 text-[10px] text-flixer-muted/70 lg:flex">
        <span>{{ t('auth.copyright', { year: 2026 }) }}</span>
        <span class="text-flixer-accent">·</span>
        <span>{{ t('auth.madeForMovieNights') }}</span>
      </footer>
    </section>
  </main>
</template>

<style scoped>
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
