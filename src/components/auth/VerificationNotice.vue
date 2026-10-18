<script setup lang="ts">
defineProps<{
  email: string
}>()

const emit = defineEmits<{ back: [] }>()
</script>

<template>
  <div class="w-full">
    <span class="text-[9px] font-bold tracking-[0.2em] text-flixer-accent">ONE LAST STEP</span>
    <h1 class="mt-3 text-3xl font-semibold tracking-tight text-flixer-text sm:text-4xl">
      Check your email
      <span class="text-flixer-accent">.</span>
    </h1>
    <p class="mt-2 text-sm leading-6 text-flixer-muted">
      We sent a verification link to
      <strong class="font-semibold text-flixer-text">{{ email }}</strong>
      . Open it to activate your account, then sign in. The link expires in 24 hours.
    </p>
    <p class="mt-4 text-xs text-flixer-muted">Can’t find it? Check your spam folder, or try signing in to get the option to send it again.</p>

    <button class="mt-8 flex h-12 w-full items-center justify-center rounded-lg bg-gradient-to-r from-flixer-primary to-flixer-secondary text-sm font-semibold text-white shadow-lg shadow-flixer-primary/20 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" type="button" @click="emit('back')">Go to sign in</button>
  </div>
</template>
