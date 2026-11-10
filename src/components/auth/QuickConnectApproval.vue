<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useQuickConnectApproval } from './useQuickConnectApproval'

const props = withDefaults(defineProps<{ initialCode?: string }>(), { initialCode: '' })
const { t } = useI18n()
const { userCode, isEnabled, isLoadingStatus, isSubmitting, decisionComplete, message, messageIsError, decide } = useQuickConnectApproval(props.initialCode, t)
</script>

<template>
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
</template>
