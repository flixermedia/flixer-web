<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { PluginListenerHandle } from '@capacitor/core'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import QRCode from 'qrcode'
import logo from '../../resources/logo/flixer-logo.svg'
import { configureNativeServer, disconnectNativeServer } from '../api'
import { useAppearance } from '../composables/useAppearance'
import { useProfile } from '../composables/useProfile'
import { getNativeServerUrl, isNativeApp } from '../platform/serverConnection'
import { isTvMode } from '../platform/tvMode'
import { isTvSetupPairingAvailable, listenForTvQuickSetup, startTvQuickSetup, stopTvQuickSetup } from '../platform/tvSetupPairing'
import { fetchSetupGate } from '../setup/setupApi'
import { resetSetupGate } from '../setup/setupGate'
import { catchError } from '../utils/catchError'

const { t } = useI18n()
const router = useRouter()
const appName = useAppearance().appName
const serverUrl = ref('')
const isConnecting = ref(false)
const error = ref('')
const pairingQr = ref('')
const pairingStarting = ref(false)
const pairingError = ref('')
const pairingStatus = ref('')
let pairingListener: PluginListenerHandle | undefined
let pairingExpiryTimer: ReturnType<typeof setTimeout> | undefined

onMounted(() => {
  if (!isNativeApp()) {
    void router.replace({ name: 'login' })
    return
  }
  serverUrl.value = getNativeServerUrl()
  if (isTvMode.value) void startPhoneSetup()
})

async function startPhoneSetup() {
  if (!isTvSetupPairingAvailable()) {
    pairingError.value = t('native.quickSetupUnavailable')
    return
  }

  pairingStarting.value = true
  pairingError.value = ''
  pairingStatus.value = ''
  pairingQr.value = ''
  try {
    if (pairingExpiryTimer) clearTimeout(pairingExpiryTimer)
    if (pairingListener) {
      await pairingListener.remove()
      pairingListener = undefined
    }
    pairingListener = await listenForTvQuickSetup(({ serverUrl: receivedServerUrl }) => {
      if (pairingExpiryTimer) clearTimeout(pairingExpiryTimer)
      pairingQr.value = ''
      pairingStatus.value = t('native.quickSetupReceived')
      serverUrl.value = receivedServerUrl
      void connect()
    })
    const pairing = await startTvQuickSetup()
    pairingQr.value = await QRCode.toDataURL(pairing.pairingUrl, {
      errorCorrectionLevel: 'M',
      margin: 4,
      width: 320,
    })
    if (pairingExpiryTimer) clearTimeout(pairingExpiryTimer)
    pairingExpiryTimer = setTimeout(
      () => {
        pairingQr.value = ''
        pairingError.value = t('native.quickSetupExpired')
      },
      Math.max(0, pairing.expiresAt - Date.now()),
    )
  } catch (cause) {
    console.error('[tv-setup] Could not start phone setup', cause)
    pairingError.value = t('native.quickSetupUnavailable')
    try {
      await stopTvQuickSetup()
    } catch (stopError) {
      console.error('[tv-setup] Could not clean up a failed phone setup attempt', stopError)
    }
  } finally {
    pairingStarting.value = false
  }
}

async function connect() {
  error.value = ''
  isConnecting.value = true
  try {
    let changed: boolean
    try {
      changed = configureNativeServer(serverUrl.value)
    } catch (cause) {
      error.value = cause instanceof Error && cause.message === 'invalid' ? t('native.invalidServerUrl') : t('native.serverUnreachable')
      return
    }
    if (changed) {
      useProfile().clear()
      resetSetupGate()
    }
    const [gateError, gate] = await catchError(fetchSetupGate())
    if (gateError || gate.kind === 'unavailable') {
      const cause = gateError ?? new Error('unreachable')
      error.value = cause instanceof Error && cause.message === 'invalid' ? t('native.invalidServerUrl') : t('native.serverUnreachable')
      return
    }
    const [navigationError] = await catchError(router.replace({ name: gate.kind === 'setup' ? 'setup' : 'login' }))
    if (navigationError) {
      const cause = navigationError
      error.value = cause instanceof Error && cause.message === 'invalid' ? t('native.invalidServerUrl') : t('native.serverUnreachable')
    }
  } finally {
    isConnecting.value = false
  }
}

function resetServer() {
  disconnectNativeServer()
  serverUrl.value = ''
  useProfile().clear()
  resetSetupGate()
}

onBeforeUnmount(() => {
  if (pairingExpiryTimer) clearTimeout(pairingExpiryTimer)
  if (pairingListener) {
    void pairingListener.remove().catch((cause: unknown) => {
      console.error('[tv-setup] Could not remove the phone setup listener', cause)
    })
  }
  if (isTvSetupPairingAvailable()) {
    void stopTvQuickSetup().catch((cause: unknown) => {
      console.error('[tv-setup] Could not stop phone setup', cause)
    })
  }
})
</script>

<template>
  <main :class="isTvMode ? 'login-background flex h-[100dvh] min-h-0 flex-col overflow-y-auto px-12 py-8 font-sans text-flixer-text' : 'flex min-h-screen items-center justify-center bg-flixer-background px-5 py-10 text-flixer-text'">
    <template v-if="isTvMode">
      <header class="mx-auto flex w-full max-w-6xl items-center">
        <p class="text-xl font-bold tracking-wide text-white">{{ appName }}</p>
      </header>
      <div class="mx-auto flex w-full max-w-6xl flex-1 items-center py-6">
        <div class="grid w-full grid-cols-2 items-center gap-16">
          <section class="min-w-0" aria-labelledby="connect-title">
            <p class="text-sm font-bold uppercase tracking-[0.2em] text-flixer-accent">{{ t('auth.loginEyebrow') }}</p>
            <h1 id="connect-title" class="mt-4 text-4xl font-bold text-white">{{ t('native.connectTitle') }}</h1>
            <p class="mt-4 max-w-xl text-lg leading-relaxed text-flixer-muted">{{ t('native.connectDescription') }}</p>

            <form class="mt-7 max-w-xl space-y-4" @submit.prevent="connect">
              <label for="server-url-tv" class="block text-base font-semibold"
                >{{ t('native.serverUrlLabel') }}
                <input
                  id="server-url-tv"
                  v-model="serverUrl"
                  type="url"
                  inputmode="url"
                  autocomplete="url"
                  autocapitalize="none"
                  spellcheck="false"
                  required
                  placeholder="https://flixer.example.com"
                  class="mt-2 h-12 w-full rounded border border-flixer-border bg-flixer-background/80 px-4 text-base font-normal text-flixer-text outline-none focus:border-flixer-accent focus-visible:outline-2 focus-visible:outline-flixer-accent"
                />
              </label>
              <p v-if="error" class="text-base text-red-200" role="alert">{{ error }}</p>
              <button
                type="submit"
                :disabled="isConnecting"
                class="w-full rounded bg-flixer-primary px-5 py-3 text-base font-bold text-white transition hover:bg-flixer-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-wait disabled:opacity-60"
              >
                {{ isConnecting ? t('native.connecting') : t('native.connectButton') }}
              </button>
            </form>
            <button
              v-if="getNativeServerUrl()"
              type="button"
              class="mt-5 rounded px-2 py-2 text-base text-flixer-muted underline hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent"
              @click="resetServer"
            >
              {{ t('native.forgetServer') }}
            </button>
          </section>

          <section class="flex min-w-0 flex-col items-center text-center" aria-labelledby="phone-setup-title">
            <h2 id="phone-setup-title" class="text-2xl font-bold text-white">{{ t('native.quickSetupTitle') }}</h2>
            <p class="mb-5 mt-2 max-w-md text-base leading-relaxed text-flixer-muted multiline-text">{{ t('native.quickSetupInstructions') }}</p>
            <p v-if="pairingStarting" role="status" class="py-12 text-base text-flixer-muted">{{ t('native.quickSetupStarting') }}</p>
            <img v-else-if="pairingQr" :src="pairingQr" :alt="t('native.quickSetupQrAlt')" class="w-80 max-w-full rounded bg-white [image-rendering:pixelated]" />
            <p v-else-if="pairingError" role="alert" class="max-w-sm text-base text-amber-200">{{ pairingError }}</p>
            <p v-if="pairingStatus" role="status" class="mt-4 text-base text-flixer-accent">{{ pairingStatus }}</p>
            <button
              v-if="!pairingStarting && !pairingQr"
              type="button"
              class="mt-4 rounded border border-flixer-border px-5 py-3 text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent"
              @click="startPhoneSetup"
            >
              {{ t('native.quickSetupTryAgain') }}
            </button>
          </section>
        </div>
      </div>
    </template>

    <section v-else class="w-full max-w-md rounded border border-flixer-border bg-flixer-surface/80 p-7 shadow-2xl sm:p-9" aria-labelledby="connect-title">
      <img :src="logo" alt="" class="mx-auto mb-5 size-16 rounded" aria-hidden="true" />
      <h1 id="connect-title" class="text-center text-2xl font-bold">{{ t('native.connectTitle') }}</h1>
      <p class="mt-3 text-center text-sm leading-6 text-flixer-muted">{{ t('native.connectDescription') }}</p>

      <form class="mt-7 space-y-4" @submit.prevent="connect">
        <label for="server-url" class="block text-sm font-medium">{{ t('native.serverUrlLabel') }}</label>
        <input
          id="server-url"
          v-model="serverUrl"
          type="url"
          inputmode="url"
          autocomplete="url"
          autocapitalize="none"
          spellcheck="false"
          required
          placeholder="https://flixer.example.com"
          class="w-full rounded border border-flixer-border bg-flixer-background px-4 py-3 text-flixer-text outline-none focus:border-flixer-accent"
        />
        <p v-if="error" class="text-sm text-red-400" role="alert">{{ error }}</p>
        <button type="submit" :disabled="isConnecting" class="w-full rounded bg-flixer-primary px-5 py-3 font-semibold text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60">
          {{ isConnecting ? t('native.connecting') : t('native.connectButton') }}
        </button>
      </form>

      <button v-if="getNativeServerUrl()" type="button" class="mt-5 w-full text-sm text-flixer-muted underline hover:text-flixer-text" @click="resetServer">
        {{ t('native.forgetServer') }}
      </button>
    </section>
  </main>
</template>
