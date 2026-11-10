<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import QuickConnectApproval from '../components/auth/QuickConnectApproval.vue'

const { t } = useI18n()
const route = useRoute()
</script>

<template>
  <main class="login-background flex min-h-[100dvh] items-center justify-center px-5 py-10 text-flixer-text">
    <section class="w-full max-w-md rounded border border-flixer-border/70 bg-flixer-surface/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8" aria-labelledby="quick-connect-approval-title">
      <span class="text-[9px] font-bold tracking-[0.2em] text-flixer-accent">{{ t('auth.loginEyebrow') }}</span>
      <h1 id="quick-connect-approval-title" class="mt-3 text-3xl font-semibold tracking-tight">{{ t('auth.quickConnectApprovalTitle') }}</h1>
      <p class="mt-3 text-sm leading-6 text-flixer-muted">{{ t('auth.quickConnectApprovalInstructions') }}</p>

      <QuickConnectApproval :initial-code="typeof route.query.code === 'string' ? route.query.code : ''" />
    </section>
  </main>
</template>
