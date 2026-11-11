<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { BiometricAuthError } from '@capgo/capacitor-native-biometric'
import { SavePassword } from '@capgo/capacitor-autofill-save-password'
import AuthBrandPanel from '../components/auth/AuthBrandPanel.vue'
import { useAppearance } from '../composables/useAppearance'
import LoginForm from '../components/auth/LoginForm.vue'
import QuickConnectLogin from '../components/auth/QuickConnectLogin.vue'
import ExternalProviderLogin from '../components/auth/ExternalProviderLogin.vue'
import { completeExternalOAuth } from '../composables/externalOAuth'
import SignupPaymentStep from '../components/payments/SignupPaymentStep.vue'
import RegistrationForm from '../components/auth/RegistrationForm.vue'
import VerificationNotice from '../components/auth/VerificationNotice.vue'
import { notify } from '../composables/notify'
import { ChatMlsDeviceUnavailableError, clearChatMlsHistoryBackupPassword, syncChatMlsHistoryBackup } from '../composables/chatMlsClient'
import { useProfile } from '../composables/useProfile'
import PasskeySecondFactor from '../components/auth/PasskeySecondFactor.vue'
import { clearAccessToken, getAccessToken, getQuickConnectStatus, getRegistrationStatus, login, loginWithPasskey, loginWithPasskeySecondFactor, register, resendVerification, saveAccessToken, validateAccessToken, type AuthResult, type ExternalAuthResult, type VerificationPending } from '../api'
import { syncLocaleFromAccount } from '../i18n'
import { isNativeApp } from '../platform/serverConnection'
import { getNativeBiometricCredentials, getNativeBiometricLoginStatus, removeNativeBiometricCredentials, saveNativeAccount, saveNativeBiometricCredentials, restoreNativeAccount } from '../platform/nativeAccount'
import { beginNativePasskeyHandoff } from '../platform/passkeyHandoff'
import { catchError } from '../utils/catchError'
import { oauthInteractionPath } from '../router/oauthSignIn'
import { getOidcInteractionClient } from '../api/oidc'

const appName = useAppearance().appName

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const isSubmitting = ref(false)
const pendingVerificationEmail = ref('')
const passkeyTicket = ref('')
const callbackLoading = ref(route.name === 'external-auth-callback')
const callbackRedirect = ref<string>()
let processedOAuthCallbackPath = ''
const externalFormOpen = ref(false)
// An account that still has to pay survives reloads; other browsers learn about it when the account signs in.
const PENDING_PAYMENT_KEY = 'flixer.pendingPayment'
const pendingPayment = ref<{ token: string; name: string; email: string } | null>(readPendingPayment())

function readPendingPayment() {
  try {
    const stored = JSON.parse(localStorage.getItem(PENDING_PAYMENT_KEY) ?? 'null')
    return stored && typeof stored.token === 'string' ? { token: stored.token, name: String(stored.name ?? ''), email: String(stored.email ?? '') } : null
  } catch {
    return null
  }
}

function startPayment(token: string, name = '', email = '') {
  pendingPayment.value = { token, name, email }
  localStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(pendingPayment.value))
}

function endPayment() {
  pendingPayment.value = null
  localStorage.removeItem(PENDING_PAYMENT_KEY)
}

function handlePaymentExpired() {
  endPayment()
  notify.error(t('payments.signup.expired'))
  if (isRegistration.value) switchAuthMode()
}

async function handlePaid(result: AuthResult | VerificationPending) {
  endPayment()
  if ('verificationRequired' in result) {
    pendingVerificationEmail.value = result.email
    return
  }
  const authenticationError = await completeAuthentication(result, undefined, lastCredentials?.password)
  if (authenticationError) notify.error(getRequestErrorMessage(authenticationError, true))
}
const needsVerification = ref(false)
const isResending = ref(false)
let lastCredentials: { username: string; password: string } | null = null
const registrationEnabled = ref<boolean | null>(null)
const quickConnectEnabled = ref(false)
const quickConnectMode = ref(false)
const registrationStatusError = ref('')
const loginBanner = ref('')
const nativeUsername = ref('')
const biometricAvailable = ref(false)
const biometricLoginAvailable = ref(false)
const biometricCredentialsForSecondFactor = ref<{ username: string; password: string } | null>(null)
const isRegistration = computed(() => route.name === 'register')
const isOAuthSignIn = computed(() => route.name === 'oauth-sign-in')
const compactOAuthLayout = computed(() => route.name === 'oauth-sign-in' || (isRegistration.value && !!oauthInteractionPath(route.query.redirect)))
const oauthClientName = ref('')
const oauthClientLoading = ref(false)
const oauthClientError = ref('')
let oauthClientRequest = 0

async function loadOAuthClient() {
  const request = ++oauthClientRequest
  oauthClientName.value = ''
  oauthClientError.value = ''
  if (!isOAuthSignIn.value) {
    oauthClientLoading.value = false
    return
  }
  quickConnectMode.value = false
  const path = oauthInteractionPath(route.query.redirect)
  if (!path) {
    oauthClientLoading.value = false
    oauthClientError.value = t('oidc.interactionError')
    return
  }
  oauthClientLoading.value = true
  const [error, result] = await catchError(getOidcInteractionClient(path.slice('/oauth/interaction/'.length)))
  if (request !== oauthClientRequest) return
  oauthClientLoading.value = false
  if (error || !result.clientName) {
    if (error) console.error('[oidc] Could not load the requesting application', error)
    oauthClientError.value = t('oidc.interactionError')
  } else {
    oauthClientName.value = result.clientName
  }
}

watch([isOAuthSignIn, () => route.query.redirect], () => void loadOAuthClient(), { immediate: true })
function processExternalOAuthCallback() {
  if (route.name !== 'external-auth-callback' || route.fullPath === processedOAuthCallbackPath) return
  processedOAuthCallbackPath = route.fullPath
  void finishProviderCallback()
}
watch(() => route.fullPath, processExternalOAuthCallback)
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
  processExternalOAuthCallback()
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
  } else {
    registrationEnabled.value = status.registrationEnabled
    loginBanner.value = status.loginBanner ?? ''
  }
  const [quickConnectError, quickConnectStatus] = await catchError(getQuickConnectStatus())
  if (quickConnectError) {
    console.warn('[quick-connect] could not check availability', quickConnectError)
  } else {
    quickConnectEnabled.value = quickConnectStatus.enabled
  }
}

async function handleQuickConnectAuthentication(result: AuthResult) {
  quickConnectMode.value = false
  const authenticationError = await completeAuthentication(result)
  if (authenticationError) {
    console.error('[quick-connect] sign-in could not be completed', authenticationError)
    notify.error(getRequestErrorMessage(authenticationError, false))
  }
}

function switchAuthMode() {
  void router.push({
    name: isRegistration.value ? (oauthInteractionPath(route.query.redirect) ? 'oauth-sign-in' : 'login') : 'register',
    query: route.query,
  })
}

async function promptNativePasswordSave(username: string, password: string) {
  if (!isNativeApp()) return

  const [error] = await catchError(Promise.resolve().then(() => SavePassword.promptDialog({
    username,
    password,
    url: window.location.hostname,
    title: appName.value,
  })))
  if (error) {
    console.warn('[native-auth] Password manager save prompt failed', error)
  }
}

async function completeAuthentication(
  result: AuthResult,
  biometricCredentials?: { username: string; password: string },
  chatHistoryPassword?: string,
) {
  clearChatMlsHistoryBackupPassword()
  try {
    useProfile().clear()
    saveAccessToken(result.accessToken)
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error))
  }
  if (chatHistoryPassword) {
    const [backupError] = await catchError(syncChatMlsHistoryBackup(result.user.id, chatHistoryPassword))
    if (backupError) {
      console.error('[chat encryption] account history could not be synchronized', backupError)
      const message = backupError instanceof ChatMlsDeviceUnavailableError
        ? t(`settings.chatEncryption.device${backupError.reason === 'revoked' ? 'Revoked' : 'Missing'}`)
        : backupError instanceof Error && !axios.isAxiosError(backupError) ? backupError.message : t('settings.chatEncryption.historySyncFailed')
      notify.error(message, undefined, { clearOnUrlChange: false })
    }
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
      notify.error(t('auth.rememberAccountFailed'), undefined, { clearOnUrlChange: false })
    }
    if (biometricCredentials) {
      const [biometricError] = await catchError(saveNativeBiometricCredentials(biometricCredentials.username, biometricCredentials.password))
      if (biometricError) {
        console.warn('[native-auth] Could not enable biometric sign-in', biometricError)
        notify.error(t('auth.biometricSetupFailed'), undefined, { clearOnUrlChange: false })
      }
    } else if (accountChanged) {
      const [removeError] = await catchError(removeNativeBiometricCredentials())
      if (!removeError) {
        biometricLoginAvailable.value = false
      } else {
        console.warn('[native-auth] Could not remove credentials for the previous account', removeError)
        notify.error(t('auth.biometricRemoveFailed'), undefined, { clearOnUrlChange: false })
      }
    }
  }
  // Language preference is cosmetic; it applies once it arrives instead of delaying sign-in.
  void catchError(syncLocaleFromAccount())

  const redirect = callbackRedirect.value ?? route.query.redirect
  const destination = typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/'

  const [navigationError] = await catchError(router.replace(destination))
  return navigationError
}

async function handleExternalAuthentication(result: ExternalAuthResult) {
  if ('paymentRequired' in result) { externalFormOpen.value = false; startPayment(result.token); return }
  if ('passkeyRequired' in result) { externalFormOpen.value = false; passkeyTicket.value = result.ticket; return }
  const error = await completeAuthentication(result)
  if (error) notify.error(getRequestErrorMessage(error, false))
}

async function finishProviderCallback() {
  callbackLoading.value = true
  const state = typeof route.query.state === 'string' ? route.query.state : ''
  const code = typeof route.query.code === 'string' ? route.query.code : ''
  window.history.replaceState(window.history.state, '', '/auth/provider-callback')
  try {
    const { result, redirect } = await completeExternalOAuth(state, code)
    callbackRedirect.value = redirect
    if ('linked' in result) {
      notify.success(t('externalAuth.linkedSuccess'))
      await router.replace({ name: 'settings', query: { tab: 'profile' } })
    } else await handleExternalAuthentication(result)
  } catch (error) {
    notify.error(getRequestErrorMessage(error, false), undefined, { clearOnUrlChange: false })
    await router.replace({ name: 'login' })
  } finally { callbackLoading.value = false }
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
    if ('paymentRequired' in result) {
      startPayment(result.token, credentials.username)
      return
    }
    if ('passkeyRequired' in result) {
      passkeyTicket.value = result.ticket
      biometricCredentialsForSecondFactor.value = credentials.rememberBiometric ? { username: credentials.username, password: credentials.password } : null
      return
    }
    await promptNativePasswordSave(credentials.username, credentials.password)
    const authenticationError = await completeAuthentication(result, credentials.rememberBiometric ? { username: credentials.username, password: credentials.password } : undefined, credentials.password)
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
    const authenticationError = await completeAuthentication(result, biometricCredentialsForSecondFactor.value ?? undefined, lastCredentials?.password)
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
  void router.push({ name: oauthInteractionPath(route.query.redirect) ? 'oauth-sign-in' : 'login', query: route.query })
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
    if ('paymentRequired' in result) {
      startPayment(result.token, credentials.username)
      return
    }
    if ('passkeyRequired' in result) {
      biometricCredentialsForSecondFactor.value = credentials
      passkeyTicket.value = result.ticket
      return
    }
    const authenticationError = await completeAuthentication(result, undefined, credentials.password)
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
    if ('paymentRequired' in result) {
      lastCredentials = { username: credentials.username, password: credentials.password }
      startPayment(result.token, credentials.displayName || credentials.username, credentials.email)
      return
    }
    if ('verificationRequired' in result) {
      pendingVerificationEmail.value = result.email
      return
    }
    const authenticationError = await completeAuthentication(result, undefined, credentials.password)
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
  <main class="login-background relative isolate min-h-[100dvh] overflow-hidden font-sans text-flixer-text"
    :class="{ 'lg:grid lg:grid-cols-2': !compactOAuthLayout }">
    <AuthBrandPanel :compact="compactOAuthLayout" />

    <section class="relative z-10 flex min-h-[420px] flex-col items-center px-6 pb-8 pt-5 sm:px-10"
      :class="{ 'lg:min-h-screen lg:justify-center lg:bg-flixer-background lg:px-12 lg:py-16': !compactOAuthLayout }"
      :aria-labelledby="isRegistration ? 'registration-title' : 'login-title'">
      <div
        class="absolute right-8 top-8 hidden items-center gap-2 text-[9px] font-bold tracking-widest text-flixer-muted"
        :class="{ 'lg:flex': !compactOAuthLayout }">
        <Icon icon="lucide:lock-keyhole" class="size-3.5" aria-hidden="true" />
        {{ t('auth.secureMode', { mode: isRegistration ? t('auth.registrationMode') : t('auth.signInMode') }) }}
      </div>

      <p v-if="loginBanner"
        class="w-full max-w-md whitespace-pre-line rounded border border-flixer-border/70 bg-flixer-surface/50 px-4 py-3 text-center text-sm text-flixer-muted">
        {{ loginBanner }}</p>

      <div
        class="w-full mt-0 max-w-md rounded border border-flixer-border/70 bg-flixer-surface/70 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
        :class="{ 'lg:mt-4 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none': !compactOAuthLayout }">
        <Transition :name="isRegistration ? 'auth-slide-left' : 'auth-slide-right'" mode="out-in">
          <div
            :key="callbackLoading ? 'callback' : pendingVerificationEmail ? 'verification' : pendingPayment ? 'payment' : passkeyTicket ? 'second-factor' : quickConnectMode ? 'quick-connect' : isRegistration ? 'registration' : 'login'">
            <p v-if="callbackLoading" role="status" class="text-sm text-flixer-muted">{{
              t('externalAuth.callbackLoading') }}</p>
            <VerificationNotice v-else-if="pendingVerificationEmail" :email="pendingVerificationEmail"
              @back="leaveVerificationNotice" />
            <SignupPaymentStep v-else-if="pendingPayment" :token="pendingPayment.token" :name="pendingPayment.name"
              :email="pendingPayment.email" @paid="handlePaid" @expired="handlePaymentExpired" @back="endPayment" />
            <PasskeySecondFactor v-else-if="passkeyTicket" :is-submitting="isSubmitting" @verify="handleSecondFactor"
              @back="cancelSecondFactor" />
            <QuickConnectLogin v-else-if="quickConnectMode" @authenticated="handleQuickConnectAuthentication"
              @back="quickConnectMode = false" />
            <div v-else-if="isOAuthSignIn && !oauthClientName">
              <p v-if="oauthClientLoading" id="login-title" role="status" class="text-sm text-flixer-muted">{{
                t('oidc.loading') }}</p>
              <template v-else>
                <p id="login-title" role="alert" class="text-sm text-red-200">{{ oauthClientError }}</p><button
                  type="button" class="mt-4 rounded border border-flixer-border px-4 py-2 text-sm"
                  @click="loadOAuthClient">{{ t('oidc.retry') }}</button>
              </template>
            </div>
            <template v-else-if="!isRegistration">
              <LoginForm v-if="!externalFormOpen" :oauth-sign-in="isOAuthSignIn" :oauth-client-name="oauthClientName"
                :is-submitting="isSubmitting" :session-check-unavailable="sessionCheckUnavailable"
                :registration-enabled="registrationEnabled" :registration-status-error="registrationStatusError"
                :quick-connect-enabled="quickConnectEnabled" :can-resend="needsVerification" :is-resending="isResending"
                :initial-username="nativeUsername" :biometric-available="biometricAvailable"
                :biometric-login-available="biometricLoginAvailable" @submit="handleLogin" @passkey="handlePasskeyLogin"
                @biometric="handleBiometricLogin" @forget-biometric="handleForgetBiometricLogin"
                @resend="handleResendVerification" @switch-mode="switchAuthMode"
                @quick-connect="quickConnectMode = true" />
              <ExternalProviderLogin :redirect="getPostLoginDestination()" @authenticated="handleExternalAuthentication"
                @selection="externalFormOpen = $event" />
            </template>
            <RegistrationForm v-else :is-submitting="isSubmitting" :registration-enabled="registrationEnabled"
              :registration-status-error="registrationStatusError" @submit="handleRegistration"
              @switch-mode="switchAuthMode" />
          </div>
        </Transition>
      </div>

      <footer class="mt-auto hidden items-center justify-center gap-2 pt-10 text-[10px] text-flixer-muted/70"
        :class="{ 'lg:flex': !compactOAuthLayout }">
        <span>{{ t('auth.copyright', { year: 2026 }) }}</span>
        <span class="text-flixer-accent">·</span>
        <span>{{ t('auth.madeForMovieNights') }}</span>
      </footer>
      <RouterLink v-if="isNativeApp()" :to="{ name: 'connect' }"
        class="mt-5 text-sm text-flixer-muted underline hover:text-flixer-text">
        {{ t('native.changeServer') }}
      </RouterLink>
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
