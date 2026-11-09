<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { pollQuickConnect, startQuickConnect, type QuickConnectStartResult } from '../../api/auth'
import type { AuthResult } from 'flixer-api-client'
import { catchError } from '../../utils/catchError'

const emit = defineEmits<{
  authenticated: [result: AuthResult]
  back: []
}>()

const { t } = useI18n()
const router = useRouter()
const request = ref<QuickConnectStartResult | null>(null)
const isStarting = ref(true)
const errorMessage = ref('')
const terminalMessage = ref('')
let pollTimer: ReturnType<typeof setTimeout> | undefined
let stopped = false

const approvalUrl = computed(() => router.resolve({ name: 'quick-connect' }).href)

onMounted(() => {
  void begin()
})

onBeforeUnmount(() => {
  stopped = true
  if (pollTimer) clearTimeout(pollTimer)
})

async function begin() {
  const [error, result] = await catchError(startQuickConnect())
  if (stopped) return
  isStarting.value = false
  if (error) {
    console.error('[quick-connect] could not start sign-in', error)
    errorMessage.value = t('auth.quickConnectStartError')
    return
  }
  request.value = result
  void poll()
}

async function poll() {
  if (stopped || !request.value) return

  const [error, result] = await catchError(pollQuickConnect(request.value.requestId, request.value.pollToken))
  if (stopped) return
  if (error) {
    errorMessage.value = t('auth.quickConnectPollError')
    pollTimer = setTimeout(() => void poll(), 3_000)
    return
  }

  errorMessage.value = ''
  if (result.status === 'approved') {
    emit('authenticated', result.auth)
  } else if (result.status === 'denied') {
    terminalMessage.value = t('auth.quickConnectDenied')
  } else if (result.status === 'expired') {
    terminalMessage.value = t('auth.quickConnectExpired')
  } else {
    pollTimer = setTimeout(() => void poll(), 2_000)
  }
}
</script>

<template>
  <section class="w-full" aria-labelledby="quick-connect-title">
    <button type="button" class="mb-6 text-sm text-flixer-muted underline underline-offset-4 hover:text-flixer-text" @click="emit('back')">
      {{ t('auth.quickConnectBack') }}
    </button>
    <span class="text-[9px] font-bold tracking-[0.2em] text-flixer-accent">{{ t('auth.loginEyebrow') }}</span>
    <h1 id="quick-connect-title" class="mt-3 text-3xl font-semibold tracking-tight text-flixer-text sm:text-4xl">{{ t('auth.quickConnectTitle') }}</h1>
    <p class="mt-2 text-sm leading-6 text-flixer-muted">{{ t('auth.quickConnectInstructions') }}</p>

    <div v-if="isStarting" class="mt-8 flex items-center gap-3 text-sm text-flixer-muted">
      <span class="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true"></span>
      {{ t('auth.quickConnectStarting') }}
    </div>
    <template v-else-if="request">
      <div class="mt-8 rounded border border-flixer-accent/30 bg-flixer-primary/10 p-5 text-center">
        <p class="text-xs font-semibold uppercase tracking-widest text-flixer-muted">{{ t('auth.quickConnectCodeLabel') }}</p>
        <p class="mt-3 select-all font-mono text-3xl font-bold tracking-[0.2em] text-flixer-text">{{ request.userCode }}</p>
        <p class="mt-3 break-all text-xs text-flixer-muted">{{ t('auth.quickConnectOpenAddress', { url: approvalUrl }) }}</p>
      </div>
      <p v-if="terminalMessage" class="mt-5 rounded border border-flixer-border px-4 py-3 text-sm text-flixer-muted" role="status">{{ terminalMessage }}</p>
      <p v-else class="mt-5 text-sm text-flixer-muted" role="status">{{ t('auth.quickConnectWaiting') }}</p>
    </template>
    <p v-else class="mt-6 rounded border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">{{ errorMessage }}</p>
    <p v-if="errorMessage && request && !terminalMessage" class="mt-3 text-sm text-amber-200" role="status">{{ errorMessage }}</p>
  </section>
</template>
