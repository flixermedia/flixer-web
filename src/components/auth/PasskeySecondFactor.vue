<script setup lang="ts">
defineProps<{
  isSubmitting: boolean
}>()

const emit = defineEmits<{ verify: []; back: [] }>()
</script>

<template>
  <div class="w-full">
    <span class="text-[9px] font-bold tracking-[0.2em] text-flixer-accent">TWO-STEP SIGN IN</span>
    <h1 id="login-title" class="mt-3 text-3xl font-semibold tracking-tight text-flixer-text sm:text-4xl">
      Use your passkey
      <span class="text-flixer-accent">.</span>
    </h1>
    <p class="mt-2 text-sm leading-6 text-flixer-muted">Your password was correct. Confirm it’s you with any passkey on your account, such as a security key, your phone, or this device.</p>

    <button class="mt-8 flex h-12 w-full items-center justify-center rounded-lg bg-gradient-to-r from-flixer-primary to-flixer-secondary text-sm font-semibold text-white shadow-lg shadow-flixer-primary/20 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-not-allowed disabled:opacity-60" type="button" :disabled="isSubmitting" @click="emit('verify')">
      {{ isSubmitting ? 'Waiting for passkey…' : 'Continue with passkey' }}
    </button>
    <button class="mt-3 flex h-12 w-full items-center justify-center rounded-lg border border-flixer-border text-sm font-semibold text-flixer-text transition hover:bg-flixer-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" type="button" :disabled="isSubmitting" @click="emit('back')">Back to sign in</button>
  </div>
</template>
