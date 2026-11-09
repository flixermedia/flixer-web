<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { decideQuickConnect, getQuickConnectStatus } from '../api/auth'
import { catchError } from '../utils/catchError'

const { t } = useI18n()
const route = useRoute()
const userCode = ref(typeof route.query.code === 'string' ? route.query.code.toUpperCase() : '')
const isEnabled = ref<boolean | null>(null)
const isLoadingStatus = ref(true)
const isSubmitting = ref(false)
const decisionComplete = ref(false)
const message = ref('')
const messageIsError = ref(false)

void loadStatus()

async function loadStatus() {
  const [error, status] = await catchError(getQuickConnectStatus())
  if (error) {
    console.error('[quick-connect] could not load availability', error)
    messageIsError.value = true
    message.value = t('auth.quickConnectStatusError')
    isLoadingStatus.value = false
    return
  }
  isEnabled.value = status.enabled
  isLoadingStatus.value = false
}

async function decide(decision: 'approve' | 'deny') {
  isSubmitting.value = true
  message.value = ''
  const [error] = await catchError(decideQuickConnect(userCode.value, decision))
  isSubmitting.value = false
  if (error) {
    console.error(`[quick-connect] could not ${decision} request`, error)
    messageIsError.value = true
    message.value = t('auth.quickConnectDecisionError')
    return
  }
  messageIsError.value = false
  decisionComplete.value = true
  message.value = decision === 'approve' ? t('auth.quickConnectApproved') : t('auth.quickConnectDenied')
}
</script>

<template>
  <main class="login-background flex min-h-[100dvh] items-center justify-center px-5 py-10 text-flixer-text">
    <section class="w-full max-w-md rounded border border-flixer-border/70 bg-flixer-surface/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8" aria-labelledby="quick-connect-approval-title">
      <span class="text-[9px] font-bold tracking-[0.2em] text-flixer-accent">{{ t('auth.loginEyebrow') }}</span>
      <h1 id="quick-connect-approval-title" class="mt-3 text-3xl font-semibold tracking-tight">{{ t('auth.quickConnectApprovalTitle') }}</h1>
      <p class="mt-3 text-sm leading-6 text-flixer-muted">{{ t('auth.quickConnectApprovalInstructions') }}</p>

      <p v-if="isLoadingStatus" class="mt-6 text-sm text-flixer-muted" role="status">{{ t('auth.quickConnectStarting') }}</p>
      <p v-else-if="isEnabled === false" class="mt-6 rounded border border-flixer-border px-4 py-3 text-sm text-flixer-muted" role="status">{{ t('auth.quickConnectDisabled') }}</p>
      <form v-else-if="isEnabled === true" class="mt-6" @submit.prevent="decide('approve')">
        <label for="quick-connect-code" class="mb-2 block text-sm font-medium">{{ t('auth.quickConnectCodeLabel') }}</label>
        <input id="quick-connect-code" v-model.trim="userCode" type="text" autocomplete="one-time-code" autocapitalize="characters" maxlength="9" :placeholder="t('auth.quickConnectCodePlaceholder')" class="h-12 w-full rounded border border-flixer-border bg-flixer-background px-4 font-mono text-lg tracking-[0.15em] text-flixer-text outline-none placeholder:text-flixer-muted/70 focus:border-flixer-accent disabled:opacity-60" :disabled="decisionComplete" required />
        <p class="mt-3 text-xs leading-5 text-flixer-muted">{{ t('auth.quickConnectSafetyNote') }}</p>
        <div class="mt-6 flex gap-3">
          <button type="submit" class="flex-1 rounded bg-flixer-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-flixer-primary/80 disabled:cursor-wait disabled:opacity-60" :disabled="isSubmitting || decisionComplete || !userCode.trim()">{{ isSubmitting ? t('auth.quickConnectWorking') : t('auth.quickConnectApprove') }}</button>
          <button type="button" class="rounded border border-flixer-border px-4 py-3 text-sm font-semibold transition hover:bg-white/5 disabled:cursor-wait disabled:opacity-60" :disabled="isSubmitting || decisionComplete || !userCode.trim()" @click="decide('deny')">{{ t('auth.quickConnectDeny') }}</button>
        </div>
      </form>

      <p v-if="message" class="mt-5 rounded border px-4 py-3 text-sm" :class="messageIsError ? 'border-red-400/30 bg-red-500/10 text-red-200' : 'border-flixer-accent/20 bg-flixer-primary/10 text-flixer-accent'" :role="messageIsError ? 'alert' : 'status'">{{ message }}</p>
    </section>
  </main>
</template>
