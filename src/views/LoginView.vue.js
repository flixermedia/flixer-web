import axios from 'axios';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { BiometricAuthError } from '@capgo/capacitor-native-biometric';
import { SavePassword } from '@capgo/capacitor-autofill-save-password';
import logo from '../../resources/logo/flixer-logo.svg';
import LoginForm from '../components/auth/LoginForm.vue';
import RegistrationForm from '../components/auth/RegistrationForm.vue';
import VerificationNotice from '../components/auth/VerificationNotice.vue';
import { notify } from '../composables/notify';
import { useProfile } from '../composables/useProfile';
import PasskeySecondFactor from '../components/auth/PasskeySecondFactor.vue';
import { clearAccessToken, getAccessToken, getRegistrationStatus, login, loginWithPasskey, loginWithPasskeySecondFactor, register, resendVerification, saveAccessToken, validateAccessToken } from '../api';
import { syncLocaleFromAccount } from '../i18n';
import { isNativeApp } from '../platform/serverConnection';
import { getNativeBiometricCredentials, getNativeBiometricLoginStatus, removeNativeBiometricCredentials, saveNativeAccount, saveNativeBiometricCredentials, restoreNativeAccount } from '../platform/nativeAccount';
import { beginNativePasskeyHandoff } from '../platform/passkeyHandoff';
import { catchError } from '../utils/catchError';
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const isSubmitting = ref(false);
const pendingVerificationEmail = ref('');
const passkeyTicket = ref('');
const needsVerification = ref(false);
const isResending = ref(false);
let lastCredentials = null;
const registrationEnabled = ref(null);
const registrationStatusError = ref('');
const loginBanner = ref('');
const nativeUsername = ref('');
const biometricAvailable = ref(false);
const biometricLoginAvailable = ref(false);
const biometricCredentialsForSecondFactor = ref(null);
const isRegistration = computed(() => route.name === 'register');
const sessionCheckUnavailable = computed(() => route.query.sessionCheck === 'unavailable');
const SESSION_RECOVERY_INTERVAL_MS = 5_000;
let sessionRecoveryTimer;
let sessionRecoveryInFlight = false;
function getPostLoginDestination() {
    const redirect = route.query.redirect;
    return typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : undefined;
}
onMounted(() => {
    void loadRegistrationStatus();
    if (isNativeApp())
        void loadNativeSignInOptions();
    startSessionRecovery();
});
onUnmounted(stopSessionRecovery);
watch(sessionCheckUnavailable, (unavailable) => {
    if (unavailable)
        startSessionRecovery();
    else
        stopSessionRecovery();
});
function stopSessionRecovery() {
    if (sessionRecoveryTimer)
        clearInterval(sessionRecoveryTimer);
    sessionRecoveryTimer = undefined;
}
function clearSessionCheckWarning() {
    const query = { ...route.query };
    delete query.sessionCheck;
    void router.replace({ query });
}
async function recoverSavedSession() {
    if (sessionRecoveryInFlight || !sessionCheckUnavailable.value)
        return;
    if (!getAccessToken()) {
        clearSessionCheckWarning();
        return;
    }
    sessionRecoveryInFlight = true;
    try {
        const [error, isValid] = await catchError(validateAccessToken());
        if (error) {
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                clearAccessToken();
                clearSessionCheckWarning();
            }
            return;
        }
        if (!isValid) {
            clearAccessToken();
            clearSessionCheckWarning();
            return;
        }
        await router.replace(getPostLoginDestination() ?? '/');
    }
    finally {
        sessionRecoveryInFlight = false;
    }
}
function startSessionRecovery() {
    if (!sessionCheckUnavailable.value || sessionRecoveryTimer)
        return;
    void recoverSavedSession();
    sessionRecoveryTimer = setInterval(() => void recoverSavedSession(), SESSION_RECOVERY_INTERVAL_MS);
}
async function loadNativeSignInOptions() {
    const [accountError, username] = await catchError(restoreNativeAccount());
    if (accountError) {
        console.warn('[native-auth] Could not load native sign-in options', accountError);
        return;
    }
    nativeUsername.value = username ?? '';
    const [statusError, status] = await catchError(getNativeBiometricLoginStatus());
    if (statusError) {
        console.warn('[native-auth] Could not load native sign-in options', statusError);
        return;
    }
    biometricAvailable.value = status.available;
    biometricLoginAvailable.value = status.saved;
}
async function loadRegistrationStatus() {
    registrationStatusError.value = '';
    const [error, status] = await catchError(getRegistrationStatus());
    if (error) {
        registrationStatusError.value = t('auth.registrationAvailabilityError');
        return;
    }
    registrationEnabled.value = status.registrationEnabled;
    loginBanner.value = status.loginBanner ?? '';
}
function switchAuthMode() {
    void router.push({
        name: isRegistration.value ? 'login' : 'register',
        query: route.query,
    });
}
async function promptNativePasswordSave(username, password) {
    if (!isNativeApp())
        return;
    const [error] = await catchError(Promise.resolve().then(() => SavePassword.promptDialog({
        username,
        password,
        url: window.location.hostname,
        title: 'Flixer',
    })));
    if (error) {
        console.warn('[native-auth] Password manager save prompt failed', error);
    }
}
async function completeAuthentication(result, biometricCredentials) {
    try {
        useProfile().clear();
        saveAccessToken(result.accessToken);
    }
    catch (error) {
        return error instanceof Error ? error : new Error(String(error));
    }
    if (isNativeApp()) {
        if (!nativeUsername.value) {
            const [error, username] = await catchError(restoreNativeAccount());
            if (error) {
                console.warn('[native-account] Could not check the previously saved account', error);
            }
            else {
                nativeUsername.value = username ?? '';
            }
        }
        const accountChanged = nativeUsername.value && nativeUsername.value.toLowerCase() !== result.user.username.toLowerCase();
        const [accountError] = await catchError(saveNativeAccount(result.user.username));
        if (!accountError) {
            nativeUsername.value = result.user.username;
        }
        else {
            console.warn('[native-account] Could not save the account for reinstall recovery', accountError);
            notify.error(t('auth.rememberAccountFailed'));
        }
        if (biometricCredentials) {
            const [biometricError] = await catchError(saveNativeBiometricCredentials(biometricCredentials.username, biometricCredentials.password));
            if (biometricError) {
                console.warn('[native-auth] Could not enable biometric sign-in', biometricError);
                notify.error(t('auth.biometricSetupFailed'));
            }
        }
        else if (accountChanged) {
            const [removeError] = await catchError(removeNativeBiometricCredentials());
            if (!removeError) {
                biometricLoginAvailable.value = false;
            }
            else {
                console.warn('[native-auth] Could not remove credentials for the previous account', removeError);
                notify.error(t('auth.biometricRemoveFailed'));
            }
        }
    }
    const [localeError] = await catchError(syncLocaleFromAccount());
    if (localeError)
        return localeError;
    const redirect = route.query.redirect;
    const destination = typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/';
    const [navigationError] = await catchError(router.replace(destination));
    return navigationError;
}
function handleLoginError(error) {
    const message = axios.isAxiosError(error) ? String(error.response?.data?.message ?? '') : '';
    // Disabled accounts also answer 403, but resending verification can't help them.
    needsVerification.value = axios.isAxiosError(error) && error.response?.status === 403 && /verify your email/i.test(message);
    notify.error(getRequestErrorMessage(error, false));
}
async function handleLogin(credentials) {
    needsVerification.value = false;
    lastCredentials = credentials;
    isSubmitting.value = true;
    try {
        const [loginError, result] = await catchError(login(credentials.username, credentials.password));
        if (loginError) {
            handleLoginError(loginError);
            return;
        }
        if ('passkeyRequired' in result) {
            passkeyTicket.value = result.ticket;
            biometricCredentialsForSecondFactor.value = credentials.rememberBiometric ? { username: credentials.username, password: credentials.password } : null;
            return;
        }
        await promptNativePasswordSave(credentials.username, credentials.password);
        const authenticationError = await completeAuthentication(result, credentials.rememberBiometric ? { username: credentials.username, password: credentials.password } : undefined);
        if (authenticationError)
            handleLoginError(authenticationError);
    }
    finally {
        isSubmitting.value = false;
    }
}
function handleSecondFactorError(error) {
    console.error('[passkey] second factor failed', error);
    if (axios.isAxiosError(error) && error.response?.status === 401) {
        passkeyTicket.value = '';
        notify.error(t('auth.passkeySecondFactorExpired'));
    }
    else {
        notify.error(error instanceof Error && error.name === 'NotAllowedError' ? t('auth.passkeyCheckCancelled') : getRequestErrorMessage(error, false));
    }
}
async function handleSecondFactor() {
    isSubmitting.value = true;
    try {
        if (isNativeApp()) {
            const biometricCredentials = biometricCredentialsForSecondFactor.value;
            if (biometricCredentials) {
                const [saveError] = await catchError(saveNativeBiometricCredentials(biometricCredentials.username, biometricCredentials.password));
                if (!saveError) {
                    biometricLoginAvailable.value = true;
                }
                else {
                    console.warn('[native-auth] Could not enable biometric sign-in', saveError);
                    notify.error(t('auth.biometricSetupFailed'));
                }
            }
            const [handoffError] = await catchError(beginNativePasskeyHandoff(passkeyTicket.value, getPostLoginDestination()));
            if (handoffError)
                handleSecondFactorError(handoffError);
            return;
        }
        const [loginError, result] = await catchError(loginWithPasskeySecondFactor(passkeyTicket.value));
        if (loginError) {
            handleSecondFactorError(loginError);
            return;
        }
        passkeyTicket.value = '';
        const authenticationError = await completeAuthentication(result, biometricCredentialsForSecondFactor.value ?? undefined);
        if (authenticationError) {
            handleSecondFactorError(authenticationError);
            return;
        }
        biometricCredentialsForSecondFactor.value = null;
    }
    finally {
        isSubmitting.value = false;
    }
}
function cancelSecondFactor() {
    passkeyTicket.value = '';
}
async function handleResendVerification() {
    if (!lastCredentials) {
        return;
    }
    isResending.value = true;
    try {
        const [error] = await catchError(resendVerification(lastCredentials.username, lastCredentials.password));
        if (error) {
            console.error('[auth] resend verification failed', error);
            notify.error(getRequestErrorMessage(error, false));
            return;
        }
        notify.success(t('auth.verificationEmailSentToast'));
    }
    finally {
        isResending.value = false;
    }
}
function leaveVerificationNotice() {
    pendingVerificationEmail.value = '';
    void router.push({ name: 'login', query: route.query });
}
async function handlePasskeyLogin() {
    isSubmitting.value = true;
    try {
        if (isNativeApp()) {
            const [error] = await catchError(beginNativePasskeyHandoff(undefined, getPostLoginDestination()));
            if (error) {
                console.error('[passkey] login failed', error);
                notify.error(error instanceof Error && error.name === 'NotAllowedError' ? t('auth.passkeyLoginCancelled', { message: error.message }) : getRequestErrorMessage(error, false));
            }
            return;
        }
        const [loginError, result] = await catchError(loginWithPasskey());
        if (loginError) {
            console.error('[passkey] login failed', loginError);
            notify.error(loginError instanceof Error && loginError.name === 'NotAllowedError' ? t('auth.passkeyLoginCancelled', { message: loginError.message }) : getRequestErrorMessage(loginError, false));
            return;
        }
        const authenticationError = await completeAuthentication(result);
        if (authenticationError) {
            console.error('[passkey] login failed', authenticationError);
            notify.error(authenticationError instanceof Error && authenticationError.name === 'NotAllowedError' ? t('auth.passkeyLoginCancelled', { message: authenticationError.message }) : getRequestErrorMessage(authenticationError, false));
        }
    }
    finally {
        isSubmitting.value = false;
    }
}
async function handleBiometricLogin() {
    isSubmitting.value = true;
    try {
        const [credentialsError, credentials] = await catchError(getNativeBiometricCredentials());
        if (credentialsError) {
            await handleBiometricLoginError(credentialsError);
            return;
        }
        lastCredentials = credentials;
        const [loginError, result] = await catchError(login(credentials.username, credentials.password));
        if (loginError) {
            await handleBiometricLoginError(loginError);
            return;
        }
        if ('passkeyRequired' in result) {
            biometricCredentialsForSecondFactor.value = credentials;
            passkeyTicket.value = result.ticket;
            return;
        }
        const authenticationError = await completeAuthentication(result);
        if (authenticationError)
            await handleBiometricLoginError(authenticationError);
    }
    finally {
        isSubmitting.value = false;
    }
}
async function handleBiometricLoginError(error) {
    const errorCode = typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'number' ? error.code : undefined;
    if (errorCode === BiometricAuthError.USER_CANCEL || errorCode === BiometricAuthError.SYSTEM_CANCEL || errorCode === BiometricAuthError.APP_CANCEL)
        return;
    console.error('[native-auth] Biometric sign-in failed', error);
    if (errorCode === BiometricAuthError.NO_PROTECTED_CREDENTIALS_FOUND) {
        biometricLoginAvailable.value = false;
        const [removeError] = await catchError(removeNativeBiometricCredentials());
        if (removeError)
            console.warn('[native-auth] Could not remove stale biometric credentials', removeError);
        notify.error(t('auth.biometricCredentialsUnavailable'));
        return;
    }
    notify.error(getRequestErrorMessage(error, false));
}
async function handleForgetBiometricLogin() {
    const [error] = await catchError(removeNativeBiometricCredentials());
    if (error) {
        console.error('[native-auth] Could not remove biometric sign-in', error);
        notify.error(t('auth.biometricRemoveFailed'));
        return;
    }
    biometricLoginAvailable.value = false;
}
async function handleRegistration(credentials) {
    if (registrationEnabled.value !== true) {
        return;
    }
    isSubmitting.value = true;
    try {
        const [registrationError, result] = await catchError(register(credentials.username, credentials.password, credentials.email, credentials.displayName));
        if (registrationError) {
            notify.error(getRequestErrorMessage(registrationError, true));
            return;
        }
        if ('verificationRequired' in result) {
            pendingVerificationEmail.value = result.email;
            return;
        }
        const authenticationError = await completeAuthentication(result);
        if (authenticationError)
            notify.error(getRequestErrorMessage(authenticationError, true));
    }
    finally {
        isSubmitting.value = false;
    }
}
function getRequestErrorMessage(error, registration) {
    if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message;
        if (typeof message === 'string' && message) {
            return message;
        }
        if (!error.response) {
            return t('auth.networkError');
        }
        return registration ? t('auth.registrationError') : t('auth.signInError');
    }
    return t('auth.genericError');
}
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(isRegistration, {});
    __VLS_withDotValue(loginBanner, {});
    __VLS_withDotValue(pendingVerificationEmail, {});
    __VLS_withDotValue(passkeyTicket, {});
    void {};
    /** @type {__VLS_StyleScopedClasses['login-background']} */ ;
    /** @type {__VLS_StyleScopedClasses['login-background']} */ ;
    /** @type {__VLS_StyleScopedClasses['auth-slide-left-leave-active']} */ ;
    /** @type {__VLS_StyleScopedClasses['auth-slide-right-leave-active']} */ ;
    /** @type {__VLS_StyleScopedClasses['auth-slide-left-enter-active']} */ ;
    /** @type {__VLS_StyleScopedClasses['auth-slide-left-leave-active']} */ ;
    /** @type {__VLS_StyleScopedClasses['auth-slide-right-enter-active']} */ ;
    /** @type {__VLS_StyleScopedClasses['auth-slide-right-leave-active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({
        ...{ class: "login-background relative isolate min-h-[100dvh] overflow-hidden font-sans text-flixer-text lg:grid lg:grid-cols-2" },
    });
    /** @type {__VLS_StyleScopedClasses['login-background']} */ ;
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['isolate']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-h-[100dvh]']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-sans']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:grid-cols-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "relative isolate flex flex-col overflow-hidden px-6 py-6 sm:px-10 lg:h-auto lg:min-h-screen lg:bg-gradient-to-br lg:from-flixer-surface lg:via-flixer-background lg:to-flixer-background lg:px-16 lg:py-11" },
        'aria-label': (__VLS_unwrap(t, {})('auth.welcomeToFlixer')),
    });
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['isolate']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:px-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:h-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:min-h-screen']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:bg-gradient-to-br']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:from-flixer-surface']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:via-flixer-background']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:to-flixer-background']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:px-16']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:py-11']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "pointer-events-none absolute -left-24 top-1/3 -z-10 hidden size-80 rounded-full bg-flixer-primary/20 blur-3xl lg:block" },
        'aria-hidden': "true",
    });
    /** @type {__VLS_StyleScopedClasses['pointer-events-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['-left-24']} */ ;
    /** @type {__VLS_StyleScopedClasses['top-1/3']} */ ;
    /** @type {__VLS_StyleScopedClasses['-z-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['size-80']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-primary/20']} */ ;
    /** @type {__VLS_StyleScopedClasses['blur-3xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:block']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "pointer-events-none absolute -right-20 top-0 -z-10 hidden size-72 rounded-full bg-flixer-cyan/10 blur-3xl lg:block" },
        'aria-hidden': "true",
    });
    /** @type {__VLS_StyleScopedClasses['pointer-events-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['-right-20']} */ ;
    /** @type {__VLS_StyleScopedClasses['top-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['-z-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['size-72']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-cyan/10']} */ ;
    /** @type {__VLS_StyleScopedClasses['blur-3xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:block']} */ ;
    let __VLS_0;
    /** @ts-ignore @type { | typeof __VLS_components.RouterLink | typeof __VLS_components.RouterLink} */
    RouterLink;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        ...{ class: "mx-auto lg:mx-0 relative z-10 inline-flex w-fit items-center lg:gap-3 text-flixer-text no-underline" }, to: "/", 'aria-label': (__VLS_unwrap(t, {})('auth.flixerHome')),
    }));
    const __VLS_2 = __VLS_1({
        ...{ class: "mx-auto lg:mx-0 relative z-10 inline-flex w-fit items-center lg:gap-3 text-flixer-text no-underline" },
        to: "/",
        'aria-label': (__VLS_unwrap(t, {})('auth.flixerHome')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:mx-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-fit']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
    /** @type {__VLS_StyleScopedClasses['no-underline']} */ ;
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
        src: (__VLS_unwrap(logo, {})),
        alt: "",
        ...{ class: "size-20 mt-15 lg:mt-0 lg:size-10 rounded shadow-lg" },
        'aria-hidden': "true",
    });
    /** @type {__VLS_StyleScopedClasses['size-20']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-15']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:mt-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:size-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "hidden lg:inline text-2xl font-bold tracking-tight" },
    });
    /** @type {__VLS_StyleScopedClasses['hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:inline']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-tight']} */ ;
    (__VLS_unwrap(t, {})('auth.brandName'));
    // @ts-ignore
    [t, t, t, logo,];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "relative z-10 mb-8 mt-8 hidden max-w-xl lg:mt-[12vh] lg:block" },
    });
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:mt-[12vh]']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:block']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "flex items-center gap-2.5 text-[10px] font-bold tracking-[0.2em] text-flixer-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-[0.2em]']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "size-2 rounded-full bg-flixer-cyan shadow-[0_0_14px_rgba(75,217,232,0.65)]" },
    });
    /** @type {__VLS_StyleScopedClasses['size-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-cyan']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-[0_0_14px_rgba(75,217,232,0.65)]']} */ ;
    (__VLS_unwrap(t, {})('auth.nextFavoriteIsHere'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
        ...{ class: "mt-2 text-4xl font-semibold leading-tight tracking-tight text-flixer-text sm:text-5xl lg:text-6xl" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-4xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['leading-tight']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-tight']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:text-5xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:text-6xl']} */ ;
    (__VLS_unwrap(t, {})('auth.everyStory'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.br)({});
    (__VLS_unwrap(t, {})('auth.startsSomewhere'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "text-flixer-accent" },
    });
    /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
    (__VLS_unwrap(t, {})('auth.somewhere'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-4 max-w-sm text-sm leading-5 text-flixer-muted sm:text-base" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['leading-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:text-base']} */ ;
    (__VLS_unwrap(t, {})('auth.welcomeDescription'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "relative z-10 mt-auto hidden items-center gap-3 pt-12 text-[9px] font-bold tracking-[0.18em] text-flixer-muted lg:flex" },
    });
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-[9px]']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-[0.18em]']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:flex']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "h-px w-7 bg-gradient-to-r from-flixer-primary to-flixer-cyan" },
    });
    /** @type {__VLS_StyleScopedClasses['h-px']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-7']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-gradient-to-r']} */ ;
    /** @type {__VLS_StyleScopedClasses['from-flixer-primary']} */ ;
    /** @type {__VLS_StyleScopedClasses['to-flixer-cyan']} */ ;
    (__VLS_unwrap(t, {})('auth.storiesWorthStayingInFor'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "relative z-10 flex min-h-[420px] flex-col items-center px-6 pb-8 pt-5 sm:px-10 lg:min-h-screen lg:justify-center lg:bg-flixer-background lg:px-12 lg:py-16" },
        'aria-labelledby': (isRegistration.value ? 'registration-title' : 'login-title'),
    });
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-h-[420px]']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['pb-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:px-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:min-h-screen']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:bg-flixer-background']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:px-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:py-16']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "absolute right-8 top-8 hidden items-center gap-2 text-[9px] font-bold tracking-widest text-flixer-muted lg:flex" },
    });
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['right-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['top-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-[9px]']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-widest']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:flex']} */ ;
    let __VLS_6;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
        // @ts-ignore
        icon: "lucide:lock-keyhole", ...{ class: "size-3.5" }, 'aria-hidden': "true",
    }));
    const __VLS_8 = __VLS_7({
        icon: "lucide:lock-keyhole",
        ...{ class: "size-3.5" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    /** @type {__VLS_StyleScopedClasses['size-3.5']} */ ;
    (__VLS_unwrap(t, {})('auth.secureMode', { mode: isRegistration.value ? __VLS_unwrap(t, {})('auth.registrationMode') : __VLS_unwrap(t, {})('auth.signInMode') }));
    if (loginBanner.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "w-full max-w-md whitespace-pre-line rounded border border-flixer-border/70 bg-flixer-surface/50 px-4 py-3 text-center text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['max-w-md']} */ ;
        /** @type {__VLS_StyleScopedClasses['whitespace-pre-line']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border/70']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/50']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (loginBanner.value);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "w-full mt-0 lg:mt-4 max-w-md rounded border border-flixer-border/70 bg-flixer-surface/70 p-6 shadow-2xl backdrop-blur-xl sm:p-8 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:mt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-flixer-border/70']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/70']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['backdrop-blur-xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:p-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:border-transparent']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:bg-transparent']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:p-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:shadow-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:backdrop-blur-none']} */ ;
    let __VLS_11;
    /** @ts-ignore @type { | typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
    Transition;
    // @ts-ignore
    const __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11({
        // @ts-ignore
        name: (isRegistration.value ? 'auth-slide-left' : 'auth-slide-right'), mode: "out-in",
    }));
    const __VLS_13 = __VLS_12({
        name: (isRegistration.value ? 'auth-slide-left' : 'auth-slide-right'),
        mode: "out-in",
    }, ...__VLS_functionalComponentArgsRest(__VLS_12));
    var __VLS_14;
    const { default: __VLS_16 } = __VLS_nonNull(__VLS_14.slots);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (pendingVerificationEmail.value ? 'verification' : passkeyTicket.value ? 'second-factor' : isRegistration.value ? 'registration' : 'login'),
    });
    if (pendingVerificationEmail.value) {
        const __VLS_17 = VerificationNotice;
        // @ts-ignore
        const __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({
            // @ts-ignore
            ...{ 'onBack': {} }, email: (pendingVerificationEmail.value),
        }));
        const __VLS_19 = __VLS_18({
            ...{ 'onBack': {} },
            email: (pendingVerificationEmail.value),
        }, ...__VLS_functionalComponentArgsRest(__VLS_18));
        let __VLS_22;
        const __VLS_23 = {
            /** @type {typeof __VLS_22.back} */
            onBack: (leaveVerificationNotice),
        };
        void __VLS_23;
        var __VLS_20;
        var __VLS_21;
    }
    else if (passkeyTicket.value) {
        const __VLS_24 = PasskeySecondFactor;
        // @ts-ignore
        const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
            // @ts-ignore
            ...{ 'onVerify': {} }, ...{ 'onBack': {} }, isSubmitting: (__VLS_unwrap(isSubmitting, {})),
        }));
        const __VLS_26 = __VLS_25({
            ...{ 'onVerify': {} },
            ...{ 'onBack': {} },
            isSubmitting: (__VLS_unwrap(isSubmitting, {})),
        }, ...__VLS_functionalComponentArgsRest(__VLS_25));
        let __VLS_29;
        const __VLS_30 = {
            /** @type {typeof __VLS_29.verify} */
            onVerify: (handleSecondFactor),
        };
        void __VLS_30;
        const __VLS_31 = {
            /** @type {typeof __VLS_29.back} */
            onBack: (cancelSecondFactor),
        };
        void __VLS_31;
        var __VLS_27;
        var __VLS_28;
    }
    else if (!isRegistration.value) {
        const __VLS_32 = LoginForm;
        // @ts-ignore
        const __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({
            // @ts-ignore
            ...{ 'onSubmit': {} }, ...{ 'onPasskey': {} }, ...{ 'onBiometric': {} }, ...{ 'onForgetBiometric': {} }, ...{ 'onResend': {} }, ...{ 'onSwitchMode': {} }, isSubmitting: (__VLS_unwrap(isSubmitting, {})), sessionCheckUnavailable: (__VLS_unwrap(sessionCheckUnavailable, {})), registrationEnabled: (__VLS_unwrap(registrationEnabled, {})), registrationStatusError: (__VLS_unwrap(registrationStatusError, {})), canResend: (__VLS_unwrap(needsVerification, {})), isResending: (__VLS_unwrap(isResending, {})), initialUsername: (__VLS_unwrap(nativeUsername, {})), biometricAvailable: (__VLS_unwrap(biometricAvailable, {})), biometricLoginAvailable: (__VLS_unwrap(biometricLoginAvailable, {})),
        }));
        const __VLS_34 = __VLS_33({
            ...{ 'onSubmit': {} },
            ...{ 'onPasskey': {} },
            ...{ 'onBiometric': {} },
            ...{ 'onForgetBiometric': {} },
            ...{ 'onResend': {} },
            ...{ 'onSwitchMode': {} },
            isSubmitting: (__VLS_unwrap(isSubmitting, {})),
            sessionCheckUnavailable: (__VLS_unwrap(sessionCheckUnavailable, {})),
            registrationEnabled: (__VLS_unwrap(registrationEnabled, {})),
            registrationStatusError: (__VLS_unwrap(registrationStatusError, {})),
            canResend: (__VLS_unwrap(needsVerification, {})),
            isResending: (__VLS_unwrap(isResending, {})),
            initialUsername: (__VLS_unwrap(nativeUsername, {})),
            biometricAvailable: (__VLS_unwrap(biometricAvailable, {})),
            biometricLoginAvailable: (__VLS_unwrap(biometricLoginAvailable, {})),
        }, ...__VLS_functionalComponentArgsRest(__VLS_33));
        let __VLS_37;
        const __VLS_38 = {
            /** @type {typeof __VLS_37.submit} */
            onSubmit: (handleLogin),
        };
        void __VLS_38;
        const __VLS_39 = {
            /** @type {typeof __VLS_37.passkey} */
            onPasskey: (handlePasskeyLogin),
        };
        void __VLS_39;
        const __VLS_40 = {
            /** @type {typeof __VLS_37.biometric} */
            onBiometric: (handleBiometricLogin),
        };
        void __VLS_40;
        const __VLS_41 = {
            /** @type {typeof __VLS_37.forgetBiometric} */
            onForgetBiometric: (handleForgetBiometricLogin),
        };
        void __VLS_41;
        const __VLS_42 = {
            /** @type {typeof __VLS_37.resend} */
            onResend: (handleResendVerification),
        };
        void __VLS_42;
        const __VLS_43 = {
            /** @type {typeof __VLS_37.switchMode} */
            onSwitchMode: (switchAuthMode),
        };
        void __VLS_43;
        var __VLS_35;
        var __VLS_36;
    }
    else {
        const __VLS_44 = RegistrationForm;
        // @ts-ignore
        const __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44({
            // @ts-ignore
            ...{ 'onSubmit': {} }, ...{ 'onSwitchMode': {} }, isSubmitting: (__VLS_unwrap(isSubmitting, {})), registrationEnabled: (__VLS_unwrap(registrationEnabled, {})), registrationStatusError: (__VLS_unwrap(registrationStatusError, {})),
        }));
        const __VLS_46 = __VLS_45({
            ...{ 'onSubmit': {} },
            ...{ 'onSwitchMode': {} },
            isSubmitting: (__VLS_unwrap(isSubmitting, {})),
            registrationEnabled: (__VLS_unwrap(registrationEnabled, {})),
            registrationStatusError: (__VLS_unwrap(registrationStatusError, {})),
        }, ...__VLS_functionalComponentArgsRest(__VLS_45));
        let __VLS_49;
        const __VLS_50 = {
            /** @type {typeof __VLS_49.submit} */
            onSubmit: (handleRegistration),
        };
        void __VLS_50;
        const __VLS_51 = {
            /** @type {typeof __VLS_49.switchMode} */
            onSwitchMode: (switchAuthMode),
        };
        void __VLS_51;
        var __VLS_47;
        var __VLS_48;
    }
    // @ts-ignore
    [t, t, t, t, t, t, t, t, t, isRegistration, isRegistration, isRegistration, isRegistration, isRegistration, loginBanner, loginBanner, pendingVerificationEmail, pendingVerificationEmail, pendingVerificationEmail, passkeyTicket, passkeyTicket, isSubmitting, isSubmitting, isSubmitting, sessionCheckUnavailable, registrationEnabled, registrationEnabled, registrationStatusError, registrationStatusError, needsVerification, isResending, nativeUsername, biometricAvailable, biometricLoginAvailable,];
    __VLS_asFunctionalElement1(__VLS_intrinsics.footer, __VLS_intrinsics.footer)({
        ...{ class: "mt-auto hidden items-center justify-center gap-2 pt-10 text-[10px] text-flixer-muted/70 lg:flex" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-muted/70']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:flex']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_unwrap(t, {})('auth.copyright', { year: 2026 }));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "text-flixer-accent" },
    });
    /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_unwrap(t, {})('auth.madeForMovieNights'));
    if (__VLS_unwrap(isNativeApp, {})()) {
        let __VLS_52;
        /** @ts-ignore @type { | typeof __VLS_components.RouterLink | typeof __VLS_components.RouterLink} */
        RouterLink;
        // @ts-ignore
        const __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52({
            // @ts-ignore
            to: ({ name: 'connect' }), ...{ class: "mt-5 text-sm text-flixer-muted underline hover:text-flixer-text" },
        }));
        const __VLS_54 = __VLS_53({
            to: ({ name: 'connect' }),
            ...{ class: "mt-5 text-sm text-flixer-muted underline hover:text-flixer-text" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_53));
        /** @type {__VLS_StyleScopedClasses['mt-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        /** @type {__VLS_StyleScopedClasses['underline']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-flixer-text']} */ ;
        var __VLS_55;
        const { default: __VLS_57 } = __VLS_nonNull(__VLS_55.slots);
        (__VLS_unwrap(t, {})('native.changeServer'));
        // @ts-ignore
        [t, t, t, isNativeApp,];
    }
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
