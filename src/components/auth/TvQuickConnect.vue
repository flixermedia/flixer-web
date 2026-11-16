<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import QRCode from 'qrcode'
import { pollQuickConnect, startQuickConnect, type AuthResult, type QuickConnectStartResult } from '../../api'
import { isNativeApp } from '../../platform/serverConnection'
import { catchError } from '../../utils/catchError'
import { tvQuickConnectUrl } from './tvQuickConnectUrl'

const props = defineProps<{ registration: boolean }>()
const emit = defineEmits<{ authenticated: [result: AuthResult] }>()
const { t } = useI18n()
const request = ref<QuickConnectStartResult | null>(null)
const qrImage = ref('')
const starting = ref(true)
const error = ref('')
const terminal = ref('')
const qrError = ref('')
let timer: ReturnType<typeof setTimeout> | undefined
let generation = 0
let qrGeneration = 0

async function updateQr(active: QuickConnectStartResult) {
  const current = ++qrGeneration
  qrImage.value = ''
  qrError.value = ''
  const appUrl = active.appUrl || (!isNativeApp() ? window.location.origin : '')
  try {
    if (!appUrl) throw new Error('The server application URL is not configured.')
    const image = await QRCode.toDataURL(tvQuickConnectUrl(appUrl, active.userCode, props.registration), { errorCorrectionLevel: 'M', margin: 4, width: 320 })
    if (current === qrGeneration) qrImage.value = image
  } catch (cause) {
    if (current !== qrGeneration) return
    console.error('[tv-auth] Could not create the Quick Connect QR code', cause)
    qrError.value = t('auth.tvQrUnavailable')
  }
}

async function begin() {
  const current = ++generation
  qrGeneration++
  clearTimeout(timer)
  request.value = null
  qrImage.value = ''
  error.value = ''
  terminal.value = ''
  qrError.value = ''
  starting.value = true
  const [startError, result] = await catchError(startQuickConnect())
  if (current !== generation) return
  starting.value = false
  if (startError) {
    console.error('[tv-auth] Could not start Quick Connect', startError)
    error.value = t('auth.quickConnectStartError')
    return
  }
  if (!Number.isFinite(Date.parse(result.expiresAt))) {
    console.error('[tv-auth] Quick Connect returned an invalid expiry')
    error.value = t('auth.quickConnectStartError')
    return
  }
  request.value = result
  void updateQr(result)
  void poll(current, result)
}

async function poll(current: number, active: QuickConnectStartResult) {
  if (current !== generation) return
  if (Date.now() >= Date.parse(active.expiresAt)) {
    terminal.value = t('auth.tvCodeExpired')
    return
  }
  const [pollError, result] = await catchError(pollQuickConnect(active.requestId, active.pollToken))
  if (current !== generation) return
  if (pollError) {
    console.error('[tv-auth] Quick Connect polling failed', pollError)
    const status = axios.isAxiosError(pollError) ? pollError.response?.status : undefined
    if (status === 401 || status === 403 || status === 429) {
      terminal.value = t(status === 401 ? 'auth.tvCodeExpired' : status === 403 ? 'auth.quickConnectDisabled' : 'auth.quickConnectRateLimited')
      return
    }
    error.value = t('auth.quickConnectPollError')
    timer = setTimeout(() => void poll(current, active), 3_000)
    return
  }
  error.value = ''
  if (result.status === 'approved') {
    terminal.value = t('auth.tvApprovalReceived')
    emit('authenticated', result.auth)
  } else if (result.status === 'denied' || result.status === 'expired') {
    terminal.value = t(result.status === 'denied' ? 'auth.quickConnectDenied' : 'auth.tvCodeExpired')
  } else {
    timer = setTimeout(() => void poll(current, active), 2_000)
  }
}

onMounted(() => void begin())
watch(() => props.registration, () => {
  if (request.value) void updateQr(request.value)
})
onBeforeUnmount(() => {
  generation++
  qrGeneration++
  clearTimeout(timer)
})
</script>

<template>
  <div class="flex min-w-0 flex-col items-center text-center">
    <p v-if="starting" role="status" class="py-12 text-lg text-flixer-muted">{{ t('auth.quickConnectStarting') }}</p>
    <template v-else-if="request">
      <img v-if="qrImage && !terminal" :src="qrImage" :alt="t('auth.tvQrAlt')" class="w-56 max-w-full rounded bg-white sm:w-64" />
      <p v-else-if="qrError && !terminal" role="alert" class="max-w-sm text-base text-amber-200">{{ qrError }}</p>
      <p class="mt-4 text-sm uppercase tracking-widest text-flixer-muted">{{ t('auth.quickConnectCodeLabel') }}</p>
      <p class="mt-1 select-all font-mono text-3xl font-bold tracking-[0.18em] text-white">{{ request.userCode }}</p>
      <p v-if="terminal" role="status" class="mt-3 text-base text-flixer-muted">{{ terminal }}</p>
      <p v-else role="status" class="mt-3 text-base text-flixer-muted">{{ error || t('auth.quickConnectWaiting') }}</p>
    </template>
    <p v-else role="alert" class="py-8 text-base text-red-200">{{ error }}</p>
    <button v-if="terminal || (!request && !starting)" type="button" class="mt-4 rounded border border-flixer-border px-5 py-3 text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" @click="begin">{{ t('auth.tvTryAgain') }}</button>
  </div>
</template>
