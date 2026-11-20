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
import { isTvMode } from '../platform/tvMode'
import TvAuthScreen from '../components/auth/TvAuthScreen.vue'
import PageCanvas from '../components/pageBuilder/PageCanvas.vue'
import CustomAuthField from '../components/pageBuilder/CustomAuthField.vue'
import { getPublishedPage, type PublishedPage } from '../components/pageBuilder/pageBuilder'
import defaultLogo from '../../resources/logo/flixer-logo.svg'
import { useAuthViewportFit } from '../components/auth/useAuthViewportFit'

const appearance = useAppearance()
const appName = appearance.appName
const spotlightLogo = computed(() => appearance.logoUrl.value ?? defaultLogo)
const { element: authPageElement, scale: authScale, top: authTop } = useAuthViewportFit(computed(() => !isTvMode.value))
function setAuthPageElement(value: unknown) { authPageElement.value = value instanceof HTMLElement ? value : null }

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
const quickConnectLoading = ref(true)
const quickConnectStatusError = ref('')
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
const customPage = ref<PublishedPage | null>(null)
const customCredentials = ref({ username: '', password: '', email: '', displayName: '' })
const customValues = ref<Record<string, string>>({})
const requestedLayout = computed(() => isTvMode.value || isNativeApp() || compactOAuthLayout.value ? 'classic' : appearance.loginLayout.value)
const hasIndividualAuth = computed(() => customPage.value?.blocks.some((block) => block.type === 'auth-field') === true)
const browserLayout = computed(() => requestedLayout.value === 'custom' && (!customPage.value || (hasIndividualAuth.value && (pendingPayment.value || pendingVerificationEmail.value || callbackLoading.value || passkeyTicket.value || quickConnectMode.value))) ? 'classic' : requestedLayout.value)
const isCustomFields = computed(() => browserLayout.value === 'custom' && hasIndividualAuth.value)
const customAuthIndex = computed(() => customPage.value?.blocks.findIndex((block) => block.type === 'auth') ?? -1)
const customBefore = computed(() => customPage.value?.blocks.slice(0, customAuthIndex.value) ?? [])
const customAfter = computed(() => customPage.value?.blocks.slice(customAuthIndex.value + 1) ?? [])
watch(requestedLayout, async (layout, _previous, onCleanup) => {
  let active = true
  onCleanup(() => { active = false })
  if (layout !== 'custom') { customPage.value = null; return }
  try {
    const page = await getPublishedPage('login')
    const fields = page.blocks.filter((block) => block.type === 'auth-field').map((block) => block.field)
    const validFields = page.layout === 'free' && ['username', 'password', 'email', 'submit', 'switch'].every((field) => fields.includes(field as typeof fields[number]))
    if (active) customPage.value = page.blocks.filter((block) => block.type === 'auth').length === 1 || validFields ? page : null
  } catch {
    if (active) customPage.value = null
  }
}, { immediate: true })
const loginBackground = computed(() => appearance.activeTheme.value?.config.branding.loginBackground)
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
  quickConnectLoading.value = false
  if (quickConnectError) {
    console.warn('[quick-connect] could not check availability', quickConnectError)
    quickConnectStatusError.value = t('auth.quickConnectStatusError')
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
  if (!isNativeApp() || isTvMode.value) return

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

async function handleRegistration(credentials: { username: string; password: string; email: string; displayName: string; customFields?: Record<string, string> }) {
  if (registrationEnabled.value !== true) {
    return
  }

  isSubmitting.value = true

  try {
    const [registrationError, result] = await catchError(register(credentials.username, credentials.password, credentials.email, credentials.displayName, credentials.customFields))
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

function submitCustomForm() {
  const credentials = customCredentials.value
  if (isRegistration.value) void handleRegistration({ ...credentials, username: credentials.username.trim(), email: credentials.email.trim(), customFields: customValues.value })
  else void handleLogin({ username: credentials.username.trim(), password: credentials.password, rememberBiometric: false })
}

async function runCustomAction(path: string | undefined, allowedFields: string[] | undefined) {
  try {
    if (!path || !/^\/(?![\/\\])/.test(path) || path.includes('\\')) throw new Error('Invalid action')
    const url = new URL(path, window.location.origin)
    if (url.origin !== window.location.origin) throw new Error('Invalid action')
    const configured = new Set(customPage.value?.blocks.filter((block) => block.type === 'auth-custom').map((block) => block.id) ?? [])
    const fields = Object.fromEntries((allowedFields ?? []).filter((id) => configured.has(id) && typeof customValues.value[id] === 'string').map((id) => [id, customValues.value[id]]))
    const response = await fetch(url, { method: 'POST', credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields }) })
    if (!response.ok) throw new Error('Action failed')
    notify.success(t('pageBuilder.actionDone'))
  } catch { notify.error(t('pageBuilder.actionFailed')) }
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
  <TvAuthScreen
    v-if="isTvMode && (route.name === 'login' || route.name === 'register' || (isOAuthSignIn && oauthClientName)) && !pendingPayment && !pendingVerificationEmail && !callbackLoading"
    :app-name="appName" :registration="isRegistration" :registration-enabled="registrationEnabled"
    :registration-status-error="registrationStatusError" :quick-connect-enabled="quickConnectEnabled"
    :quick-connect-loading="quickConnectLoading" :quick-connect-status-error="quickConnectStatusError"
    :is-submitting="isSubmitting" :passkey-required="!!passkeyTicket" :login-banner="loginBanner"
    :oauth-client-name="isOAuthSignIn ? oauthClientName : undefined"
    :session-check-unavailable="sessionCheckUnavailable" :can-resend="needsVerification" :is-resending="isResending"
    :native-app="isNativeApp()" @submit="handleLogin" @authenticated="handleQuickConnectAuthentication"
    @switch-mode="switchAuthMode" @cancel-second-factor="cancelSecondFactor" @resend="handleResendVerification" />
  <main v-else :ref="setAuthPageElement"
    class="login-background auth-page relative isolate min-h-[100dvh] overflow-hidden font-sans text-flixer-text"
    :class="[`auth-page--${browserLayout}`, { 'auth-page--fit': !isTvMode, 'auth-page--registration': isRegistration, 'lg:grid lg:grid-cols-2': !compactOAuthLayout && (browserLayout === 'classic' || browserLayout === 'spotlight'), 'lg:grid': browserLayout === 'cinema' }]"
    :style="[loginBackground && browserLayout !== 'classic' ? { '--auth-background': `url(${loginBackground})` } : {}, !isTvMode ? { '--auth-fit-scale': authScale, '--auth-fit-top': `${authTop}px` } : {}]">
    <AuthBrandPanel v-if="browserLayout !== 'custom'" class="auth-brand" :variant="browserLayout"
      :aria-hidden="browserLayout === 'spotlight' ? 'true' : undefined"
      :compact="compactOAuthLayout || browserLayout === 'centered' || browserLayout === 'studio'" />
    <form v-if="isCustomFields" id="custom-auth-form" @submit.prevent="submitCustomForm"></form>
    <h1 v-if="isCustomFields" class="sr-only">{{ t(isRegistration ? 'auth.createYourAccountTitle' : 'auth.welcomeBack')
    }}</h1>
    <p v-if="isCustomFields && loginBanner" class="whitespace-pre-line px-6 py-3 text-flixer-muted">{{ loginBanner }}
    </p>
    <p v-if="isCustomFields && sessionCheckUnavailable" role="status" class="px-6 py-3 text-flixer-accent">{{
      t('auth.sessionCheckUnavailable') }}</p>
    <p v-if="isCustomFields && isRegistration && registrationStatusError" role="status"
      class="px-6 py-3 text-flixer-muted">{{ registrationStatusError }}</p>
    <p v-else-if="isCustomFields && isRegistration && registrationEnabled !== true" role="status"
      class="px-6 py-3 text-flixer-muted">{{ t(registrationEnabled === null ? 'auth.checkingRegistration' :
        'auth.registrationDisabled') }}</p>
    <PageCanvas v-if="browserLayout === 'custom' && customPage?.layout === 'free'" :blocks="customPage.blocks"
      layout="free"><template #auth>
        <div id="custom-auth-slot"></div>
      </template>
      <template #auth-field="{ block }">
        <label v-if="block.type === 'auth-custom' && isRegistration" class="block text-sm font-semibold">{{ block.text
          }}<input v-model="customValues[block.id]" form="custom-auth-form" type="text" maxlength="500"
            class="mt-2 h-12 w-full rounded border border-flixer-border bg-flixer-background/90 px-4 text-flixer-text outline-none focus:border-flixer-accent" /></label>
        <button v-else-if="block.type === 'auth-action'" type="button"
          class="min-h-12 w-full rounded border border-flixer-border bg-flixer-surface px-4 py-2 text-sm font-semibold"
          @click="runCustomAction(block.href, block.allowedFields)">{{ block.text }}</button>
        <ExternalProviderLogin v-else-if="block.field === 'providers' && !isRegistration"
          :redirect="getPostLoginDestination()" @authenticated="handleExternalAuthentication"
          @selection="externalFormOpen = $event" />
        <CustomAuthField v-else-if="block.field && block.field !== 'providers'" v-model="customCredentials"
          :field="block.field" :registration="isRegistration" :registration-enabled="registrationEnabled"
          :quick-connect-enabled="quickConnectEnabled" :submitting="isSubmitting"
          :needs-verification="needsVerification" :resending="isResending" @switch="switchAuthMode"
          @passkey="handlePasskeyLogin" @quick-connect="quickConnectMode = true" @resend="handleResendVerification" />
      </template>
    </PageCanvas>
    <PageCanvas v-else-if="browserLayout === 'custom' && customBefore.length" :blocks="customBefore" />

    <Teleport v-if="!isCustomFields" to="#custom-auth-slot"
      :disabled="browserLayout !== 'custom' || customPage?.layout !== 'free'">
      <section class="auth-content relative z-10 flex min-h-[420px] flex-col items-center px-6 pb-8 pt-5 sm:px-10"
        :class="{ 'lg:min-h-screen lg:justify-center lg:bg-flixer-background lg:px-12 lg:py-16': !compactOAuthLayout && (browserLayout === 'classic' || browserLayout === 'spotlight') }"
        :aria-labelledby="isRegistration ? 'registration-title' : 'login-title'">
        <img v-if="browserLayout === 'spotlight'" :src="spotlightLogo" class="spotlight-logo" alt=""
          aria-hidden="true" />
        <div v-if="browserLayout !== 'centered'"
          class="auth-security absolute right-8 top-8 hidden items-center gap-2 text-[9px] font-bold tracking-widest text-flixer-muted"
          :class="{ 'lg:flex': !compactOAuthLayout }">
          <Icon icon="lucide:lock-keyhole" class="size-3.5" aria-hidden="true" />
          {{ t('auth.secureMode', { mode: isRegistration ? t('auth.registrationMode') : t('auth.signInMode') }) }}
        </div>

        <p v-if="loginBanner"
          class="w-full max-w-md whitespace-pre-line rounded border border-flixer-border/70 bg-flixer-surface/50 px-4 py-3 text-center text-sm text-flixer-muted">
          {{ loginBanner }}</p>

        <div
          class="auth-form w-full mt-0 max-w-md rounded border border-flixer-border/70 bg-flixer-surface/70 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
          :class="{ 'lg:mt-4 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none': !compactOAuthLayout && (browserLayout === 'classic' || browserLayout === 'spotlight') }">
          <img v-if="browserLayout === 'centered' || browserLayout === 'cinema'" :src="spotlightLogo"
            class="centered-form-logo" alt="" aria-hidden="true" />
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
                  :quick-connect-enabled="quickConnectEnabled" :can-resend="needsVerification"
                  :is-resending="isResending" :initial-username="nativeUsername"
                  :biometric-available="biometricAvailable" :biometric-login-available="biometricLoginAvailable"
                  @submit="handleLogin" @passkey="handlePasskeyLogin" @biometric="handleBiometricLogin"
                  @forget-biometric="handleForgetBiometricLogin" @resend="handleResendVerification"
                  @switch-mode="switchAuthMode" @quick-connect="quickConnectMode = true" />
                <ExternalProviderLogin :redirect="getPostLoginDestination()"
                  @authenticated="handleExternalAuthentication" @selection="externalFormOpen = $event" />
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
    </Teleport>
    <aside v-if="browserLayout === 'studio'" class="studio-feature" aria-hidden="true">
      <div class="studio-feature-inner">
        <div class="studio-feature-icons">
          <Icon icon="lucide:clapperboard" />
          <Icon icon="lucide:tv" />
          <Icon icon="lucide:music-2" />
        </div>
        <p class="studio-feature-label">{{ t('auth.nextFavoriteIsHere') }}</p>
        <p class="studio-feature-title">{{ t(isRegistration ? 'auth.createYourAccountTitle' : 'auth.signInToFlixer') }}
        </p>
        <p class="studio-feature-description">{{ t('auth.welcomeDescription') }}</p>
      </div>
    </aside>
    <PageCanvas v-if="browserLayout === 'custom' && customPage?.layout !== 'free' && customAfter.length"
      :blocks="customAfter" />
  </main>
</template>

<style scoped lang="scss">
.auth-page--fit {
  position: fixed;
  top: var(--auth-fit-top, 0px);
  left: 0;
  width: 100%;
  transform: scale(var(--auth-fit-scale, 1));
  transform-origin: top center;
}

.auth-page--fit.auth-page--classic,
.auth-page--classic .auth-brand {
  background: transparent;
}

.auth-page--classic .auth-brand :deep(.brand-glow) {
  display: none;
}

@media (min-width: 480px) and (max-width: 767px) {
  .auth-page--fit.auth-page--classic .auth-brand :deep(.brand-logo) {
    margin-top: 0;
  }

  .auth-page--fit.auth-page--classic .auth-form {
    max-width: 24rem;
  }
}

.auth-page--studio,
.auth-page--cinema {
  background-image: linear-gradient(color-mix(in srgb, var(--color-flixer-background) 86%, transparent), color-mix(in srgb, var(--color-flixer-background) 94%, transparent)), var(--auth-background, none);
  background-size: cover;
  background-position: center;
}

.auth-page--centered,
.auth-page--studio,
.auth-page--cinema {
  display: flex;
  flex-direction: column;
}

.auth-page--centered .auth-content,
.auth-page--studio .auth-content {
  flex: 1;
  justify-content: center;
  padding-bottom: 4rem;
}

.auth-page--centered .auth-form {
  background: color-mix(in srgb, var(--color-flixer-surface) 94%, transparent);
}

.auth-page--studio .auth-brand {
  border-bottom: 1px solid var(--color-flixer-border);
  background: var(--color-flixer-surface);
}

.auth-page--studio .auth-brand :deep(a) {
  margin: 0;
}

.auth-page--studio .auth-brand :deep(img) {
  width: 2.5rem;
  height: 2.5rem;
  margin: 0;
}

.auth-page--studio .auth-brand :deep(a span) {
  display: inline;
  margin-left: .75rem;
}

.auth-page--studio .auth-form {
  border: 0;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
}

.auth-page--cinema .auth-content {
  justify-content: center;
  padding-block: 2rem 4rem;
}

.auth-page--cinema .auth-form {
  background: color-mix(in srgb, var(--color-flixer-surface) 94%, transparent);
}

.auth-page--custom .auth-content {
  min-height: 0;
  padding-block: 1.5rem;
}

@media (max-width: 1023px) {
  .auth-page--spotlight .auth-brand :deep(a) {
    margin-left: 0;
  }

  .auth-page--spotlight .auth-brand :deep(img) {
    width: 3rem;
    height: 3rem;
    margin-top: 0;
  }

  .auth-page--spotlight .auth-form {
    border: 0;
    background: transparent;
    padding-left: 0;
    padding-right: 0;
    box-shadow: none;
    backdrop-filter: none;
  }

  .auth-page--cinema .auth-brand :deep(a) {
    margin-left: 0;
  }

  .auth-page--cinema .auth-brand :deep(img) {
    width: 3rem;
    height: 3rem;
    margin-top: 0;
  }
}

@media (min-width: 1024px) {
  .auth-page--spotlight .auth-brand {
    order: 2;
  }

  .auth-page--spotlight .auth-content {
    order: 1;
  }

  .auth-page--centered .auth-brand :deep(img) {
    margin-top: 1rem;
  }

  .auth-page--cinema {
    display: grid;
    grid-template-columns: minmax(0, 3fr) minmax(28rem, 2fr);
  }

  .auth-page--cinema .auth-content {
    min-height: 100dvh;
    padding-inline: 3rem;
  }

  .auth-page--cinema .auth-brand {
    background: transparent;
  }
}

.studio-feature {
  display: none;
}

.auth-page--spotlight {
  background: var(--flixer-login-gradient);
}

.auth-page--spotlight .auth-content {
  background: transparent;
}

.auth-page--spotlight .auth-brand {
  background: color-mix(in srgb, #197b79 20%, var(--color-flixer-surface));
}

.auth-page--spotlight .auth-brand :deep(.brand-glow),
.auth-page--cinema .auth-brand :deep(.brand-glow) {
  display: none;
}

.auth-page--spotlight .auth-form {
  border: 0;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
}

.auth-page--centered {
  background: transparent;
}

.auth-page--centered .auth-brand {
  padding-block: 2rem 0;
  background: transparent;
}

.auth-page--centered .auth-brand :deep(.brand-logo) {
  width: 3.5rem;
  height: 3.5rem;
  margin-top: 0;
}

.auth-page--centered .auth-form {
  border-top: 3px solid var(--color-flixer-accent);
  border-radius: 4px;
  background: var(--color-flixer-surface);
  padding: 2rem;
}

.centered-form-logo {
  display: none;
}

@media (max-width: 767px) {
  .auth-page--centered .auth-brand {
    display: none;
  }

  .auth-page--centered .auth-content {
    min-height: 100dvh;
    padding: 0;
  }

  .auth-page--centered .auth-form {
    width: 100%;
    max-width: none;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    border: 0;
    border-radius: 0;
    padding: max(1.5rem, env(safe-area-inset-top)) max(1.5rem, env(safe-area-inset-right)) max(1.5rem, env(safe-area-inset-bottom)) max(1.5rem, env(safe-area-inset-left));
  }

  .centered-form-logo {
    display: block;
    width: 3.5rem;
    height: 3.5rem;
    margin: 0 auto 1.5rem;
    border-radius: .5rem;
  }
}

.auth-page--studio {
  background: var(--color-flixer-background);
}

.auth-page--studio .auth-brand {
  grid-area: brand;
  padding-block: 1rem;
}

.auth-page--studio .auth-content {
  grid-area: content;
}

.studio-feature {
  grid-area: feature;
  align-items: center;
  padding: 3rem;
  color: var(--color-flixer-text);
  background: color-mix(in srgb, #b85b41 13%, var(--color-flixer-surface));
}

.studio-feature-inner {
  max-width: 29rem;
  border-left: 3px solid #d27b61;
  padding-left: 2rem;
}

.studio-feature-icons {
  display: flex;
  gap: 1rem;
  color: #d27b61;
  font-size: 1.5rem;
}

.studio-feature-label {
  margin-top: 2.5rem;
  color: var(--color-flixer-muted);
  font-size: .75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.studio-feature-title {
  margin-top: 1rem;
  font-family: Georgia, serif;
  font-size: 3.5rem;
  line-height: 1.05;
}

.studio-feature-title span {
  color: #d27b61;
  display: block;
  margin-top: 1rem;
  font-family: var(--font-sans);
  font-size: 1.125rem;
  line-height: 1.4;
}

.studio-feature-description {
  margin-top: 1.5rem;
  color: var(--color-flixer-muted);
  line-height: 1.7;
}

.auth-page--cinema {
  background-color: #111;
  background-image: var(--auth-background, none);
  background-position: center;
  background-size: cover;
}

.auth-page--cinema .auth-brand {
  color: #fff;
}

.auth-page--cinema .auth-brand :deep(.brand-link),
.auth-page--cinema .auth-brand :deep(.brand-headline) {
  color: #fff;
}

.auth-page--cinema .auth-brand :deep(.brand-background) {
  display: none;
}

.auth-page--cinema .auth-brand :deep(.brand-story > span),
.auth-page--cinema .auth-brand :deep(.brand-story p) {
  color: #e4e6e5;
}

.auth-page--cinema .auth-brand :deep(.brand-headline span) {
  color: #b9e8dd;
}

.auth-page--cinema .auth-content {
  background: transparent;
}

.auth-page--cinema .auth-security {
  display: none;
}

.auth-page--cinema .auth-form {
  border: 1px solid var(--color-flixer-border);
  border-radius: 4px;
  padding: 2rem;
  background: var(--color-flixer-surface);
}

@media (min-width: 1024px) {
  .auth-page--spotlight {
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    padding: 1.5rem;
    gap: 1.5rem;
  }

  .auth-page--spotlight .auth-brand {
    min-height: calc(100dvh - 3rem);
    border-radius: 4px;
    padding: 3rem;
  }

  .auth-page--spotlight .auth-content {
    min-height: calc(100dvh - 3rem);
    padding: 3rem;
  }

  .auth-page--spotlight .auth-brand :deep(.brand-story) {
    margin-top: auto;
    margin-bottom: auto;
  }

  .auth-page--spotlight .auth-brand :deep(.brand-headline) {
    font-size: 4rem;
  }

  .auth-page--centered .auth-content {
    padding-top: 2rem;
  }

  .auth-page--studio {
    display: grid;
    grid-template-areas: 'brand brand' 'feature content';
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-rows: auto 1fr;
  }

  .auth-page--studio .auth-content {
    justify-content: center;
    padding: 3rem 4rem;
  }

  .studio-feature {
    display: flex;
  }

  .auth-page--cinema .auth-brand :deep(.brand-story) {
    margin-top: auto;
    margin-bottom: auto;
  }
}

@media (max-width: 1023px) {
  .auth-page--spotlight .auth-brand {
    padding: 1.25rem 1.5rem;
  }

  .auth-page--spotlight .auth-content {
    justify-content: center;
    padding-top: 2.5rem;
  }

  .auth-page--studio .auth-content {
    padding-top: 3rem;
  }

  .auth-page--cinema .auth-brand {
    padding: 1.5rem;
  }
}

.spotlight-logo {
  width: 3rem;
  height: 3rem;
  margin-bottom: 1.5rem;
}

.auth-page--spotlight {
  background: var(--color-flixer-background);

  .auth-brand {
    min-height: 7rem;
    background: var(--flixer-login-gradient);

    :deep(.brand-link),
    :deep(.brand-story),
    :deep(.brand-tagline),
    :deep(.brand-background) {
      display: none;
    }
  }

  .auth-content {
    justify-content: center;
    padding-block: 3rem;
  }

  .auth-security,
  footer {
    display: none;
  }

  .auth-form {
    max-width: 25rem;
    padding: 0;
  }

  .auth-form :deep([data-haptic] > span:first-child) {
    display: none;
  }

  .auth-form :deep([data-haptic] > h1),
  .auth-form :deep([data-haptic] > h1 + p) {
    text-align: center;
  }
}

.auth-page--studio {
  display: grid;
  grid-template-areas: 'brand' 'feature' 'content';
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto auto 1fr;
  background: var(--flixer-login-gradient);

  .auth-brand {
    border: 0;
    background: transparent;
    padding: 1.5rem;
  }

  .auth-content {
    padding: 1rem 1.5rem 3rem;
  }

  .auth-security,
  .studio-feature-icons {
    display: none;
  }

  .auth-form {
    border: 1px solid var(--color-flixer-border);
    border-radius: 4px;
    background: var(--color-flixer-surface);
    padding: 1.5rem;
    box-shadow: 0 1rem 3rem rgb(0 0 0 / 15%);
  }

  .studio-feature {
    display: flex;
    padding: 1rem 1.5rem;
    background: transparent;
  }

  .studio-feature-inner {
    border: 0;
    padding: 0;
  }

  .studio-feature-label {
    margin-top: 0;
  }

  .studio-feature-title {
    font-family: var(--font-sans);
    font-size: 2rem;
    font-weight: 700;
    line-height: 1.15;
  }

  .studio-feature-description {
    margin-top: 1rem;
  }
}

.auth-page--cinema {
  background: var(--flixer-login-gradient);

  .auth-brand {
    min-height: 12rem;
    align-items: center;
    justify-content: center;
    background: var(--flixer-login-gradient);
    text-align: center;

    :deep(.brand-link) {
      margin: 0 auto;
    }

    :deep(.brand-story) {
      margin: auto;
    }

    :deep(.brand-tagline),
    :deep(.brand-glow),
    :deep(.brand-background) {
      display: none;
    }
  }

  .auth-content {
    justify-content: center;
    background: var(--color-flixer-surface);
    padding: 2rem 1.5rem;
  }

  .auth-form {
    border: 0;
    background: transparent;
    padding: 0;
    box-shadow: none;
    backdrop-filter: none;
  }

  .auth-form :deep([data-haptic] > h1),
  .auth-form :deep([data-haptic] > h1 + p) {
    text-align: center;
  }

  footer,
  .auth-security {
    display: none;
  }
}

@media (max-width: 767px) {
  .auth-page--fit.auth-page--cinema {
    background: transparent;
  }

  .auth-page--cinema .auth-brand {
    display: none;
  }

  .auth-page--cinema .auth-content {
    min-height: 100dvh;
    padding: 0 1.5rem;
    background: transparent;
  }

  .auth-page--cinema .auth-form {
    width: 100%;
    max-width: 28rem;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    border: 0;
    border-radius: 4px;
    padding: max(1.5rem, env(safe-area-inset-top)) max(1.5rem, env(safe-area-inset-right)) max(1.5rem, env(safe-area-inset-bottom)) max(1.5rem, env(safe-area-inset-left));
    background: var(--color-flixer-surface);
  }

  .auth-page--cinema .centered-form-logo {
    display: block;
    width: 3.5rem;
    height: 3.5rem;
    margin: 0 auto 1.5rem;
    border-radius: .5rem;
  }
}

@media (min-width: 1024px) {
  .auth-page--spotlight {
    grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
    gap: 0;
    padding: 0;

    .auth-brand {
      min-height: 100dvh;
      border-radius: 0;
      padding: 0;
    }

    .auth-content {
      min-height: 100dvh;
      padding: 3rem;
    }
  }

  .auth-page--studio {
    grid-template-areas: 'brand brand' 'feature content';
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-rows: auto 1fr;

    .auth-brand {
      padding: 2.5rem 4rem 0;
    }

    .studio-feature {
      padding: 4rem;
    }

    .studio-feature-title {
      font-size: 3rem;
    }

    .auth-content {
      justify-content: center;
      padding: 3rem 4rem;
    }

    .auth-form {
      max-width: 28rem;
      padding: 2rem;
    }
  }

  .auth-page--cinema {
    display: grid;
    grid-template-columns: minmax(0, 24rem) minmax(0, 38rem);
    align-content: center;
    justify-content: center;
    padding: 3rem;

    .auth-content {
      order: 1;
      min-height: 40rem;
      padding: 3rem;
    }

    .auth-brand {
      order: 2;
      min-height: 40rem;
      padding: 3rem;
    }

    .auth-brand :deep(.brand-headline) {
      font-size: 3.5rem;
    }
  }
}

@media (max-width: 1023px) and (max-height: 600px) {
  .auth-page--fit:not(.auth-page--custom) {
    display: flex;
    flex-direction: column;
    padding: 0;

    .auth-brand,
    .studio-feature,
    .auth-security,
    footer {
      display: none;
    }

    .auth-content {
      min-height: 0;
      justify-content: center;
      padding: .75rem 1rem;
    }

    .auth-form {
      max-width: 32rem;
      border: 0;
      background: transparent;
      padding: 0;
      box-shadow: none;
      backdrop-filter: none;
    }

    .spotlight-logo {
      width: 2rem;
      height: 2rem;
      margin-bottom: .25rem;
    }

    .auth-form :deep([data-haptic] > span:first-child) {
      display: none;
    }

    .auth-form :deep([data-haptic] > h1) {
      margin-top: 0;
      font-size: 1.5rem;
      line-height: 1.2;
    }

    .auth-form :deep([data-haptic] > h1 + p) {
      margin-top: .25rem;
    }

    .auth-form :deep(form) {
      margin-top: .75rem;
    }

    .auth-form :deep(form > .flex.flex-col) {
      margin-top: .5rem;
    }

    .auth-form :deep(form > .flex.flex-col:first-child) {
      margin-top: 0;
    }

    .auth-form :deep(form > .flex.flex-col > label) {
      margin-bottom: .25rem;
    }

    .auth-form :deep(form > .flex.flex-col > .relative) {
      height: 2.5rem;
    }

    .auth-form :deep([data-haptic] > .my-6),
    .auth-form :deep([data-haptic] > .my-7) {
      margin-block: .5rem;
    }
  }
}

@media (min-width: 600px) and (max-width: 1023px) and (max-height: 600px) {
  .auth-page--fit.auth-page--registration:not(.auth-page--custom) {
    .auth-form {
      max-width: 44rem;
    }

    .auth-form :deep([data-haptic] > form) {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: .5rem 1rem;
    }

    .auth-form :deep([data-haptic] > form > .flex.flex-col) {
      margin-top: 0;
    }

    .auth-form :deep([data-haptic] > form > button[type='submit']) {
      grid-column: 1 / -1;
      margin-top: 0;
    }
  }
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
