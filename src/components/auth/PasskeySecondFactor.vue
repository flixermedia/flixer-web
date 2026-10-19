<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
defineProps<{
  isSubmitting: boolean
}>()

const emit = defineEmits<{ verify: []; back: [] }>()
</script>

<template>
  <div class="w-full">
    <span class="text-[9px] font-bold tracking-[0.2em] text-flixer-accent">{{ t('auth.twoStepSignIn') }}</span>
    <h1 id="login-title" class="mt-3 text-3xl font-semibold tracking-tight text-flixer-text sm:text-4xl">
      {{ t('auth.usePasskey') }}
      <span class="text-flixer-accent">.</span>
    </h1>
    <p class="mt-2 text-sm leading-6 text-flixer-muted">{{ t('auth.passkeySecondFactorDescription') }}</p>

    <button class="mt-8 flex h-12 w-full items-center justify-center rounded-lg bg-gradient-to-r from-flixer-primary to-flixer-secondary text-sm font-semibold text-white shadow-lg shadow-flixer-primary/20 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-not-allowed disabled:opacity-60" type="button" :disabled="isSubmitting" @click="emit('verify')">
      {{ isSubmitting ? t('auth.waitingForPasskey') : t('auth.continueWithPasskey') }}
    </button>
    <button class="mt-3 flex h-12 w-full items-center justify-center rounded-lg border border-flixer-border text-sm font-semibold text-flixer-text transition hover:bg-flixer-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" type="button" :disabled="isSubmitting" @click="emit('back')">{{ t('auth.backToSignIn') }}</button>
  </div>
</template>
