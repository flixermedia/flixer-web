<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import AuthBrandPanel from '../components/auth/AuthBrandPanel.vue'

const { t } = useI18n()
const route = useRoute()
</script>

<template>
  <main class="login-background relative isolate min-h-[100dvh] overflow-hidden font-sans text-flixer-text">
    <AuthBrandPanel compact />
    <section class="relative z-10 flex min-h-[420px] flex-col items-center px-6 pb-8 pt-5 sm:px-10" aria-labelledby="oidc-error-title">
      <div class="w-full max-w-md rounded border border-flixer-border/70 bg-flixer-surface/70 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <span class="text-[9px] font-bold tracking-[0.2em] text-flixer-accent">{{ t('auth.loginEyebrow') }}</span>
        <h1 id="oidc-error-title" class="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{{ t('oidc.errorTitle') }}<span class="text-flixer-accent">.</span></h1>
        <p class="mt-4 text-sm leading-6 text-flixer-muted" role="alert">{{ route.query.error === 'invalid_redirect_uri' ? t('oidc.invalidRedirect') : t('oidc.authorizationError') }}</p>
        <RouterLink to="/" class="mt-6 inline-flex rounded bg-gradient-to-r from-flixer-primary to-flixer-secondary px-5 py-3 text-sm font-semibold text-white">{{ t('oidc.backToFlixer') }}</RouterLink>
      </div>
    </section>
  </main>
</template>
