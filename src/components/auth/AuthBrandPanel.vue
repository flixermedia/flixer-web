<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import defaultLogo from '../../../resources/logo/flixer-logo.svg'
import { useAppearance } from '../../composables/useAppearance'

const { t } = useI18n()
defineProps<{ compact?: boolean }>()
const appearance = useAppearance()
const loginBackground = computed(() => appearance.activeTheme.value?.config.branding.loginBackground ?? null)
const logo = computed(() => appearance.logoUrl.value ?? defaultLogo)
</script>

<template>
  <section class="relative isolate flex flex-col overflow-hidden px-6 py-6 sm:px-10" :class="{ 'lg:h-auto lg:min-h-screen lg:bg-gradient-to-br lg:from-flixer-surface lg:via-flixer-background lg:to-flixer-background lg:px-16 lg:py-11': !compact }" :aria-label="t('auth.welcomeToFlixer')">
    <template v-if="loginBackground">
      <div class="pointer-events-none absolute inset-0 -z-20 bg-cover bg-center" :style="{ backgroundImage: `url(${loginBackground})` }" aria-hidden="true"></div>
      <div class="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-flixer-background/85 via-flixer-background/60 to-flixer-background/90" aria-hidden="true"></div>
    </template>

    <div class="pointer-events-none absolute -left-24 top-1/3 -z-10 hidden size-80 rounded-full bg-flixer-primary/20 blur-3xl" :class="{ 'lg:block': !compact }" aria-hidden="true"></div>
    <div class="pointer-events-none absolute -right-20 top-0 -z-10 hidden size-72 rounded-full bg-flixer-cyan/10 blur-3xl" :class="{ 'lg:block': !compact }" aria-hidden="true"></div>
    <RouterLink class="mx-auto relative z-10 inline-flex w-fit items-center text-flixer-text no-underline" :class="{ 'lg:mx-0 lg:gap-3': !compact }" to="/" :aria-label="t('auth.flixerHome')">
      <img :src="logo" alt="" class="size-20 mt-15 rounded shadow-lg" :class="{ 'lg:mt-0 lg:size-10': !compact }" aria-hidden="true" />
      <span class="hidden text-2xl font-bold tracking-tight" :class="{ 'lg:inline': !compact }">{{ t('auth.brandName') }}</span>
    </RouterLink>
    <div class="relative z-10 mb-8 mt-8 hidden max-w-xl" :class="{ 'lg:mt-[12vh] lg:block': !compact }">
      <span class="flex items-center gap-2.5 text-[10px] font-bold tracking-[0.2em] text-flixer-muted">
        <span class="size-2 rounded-full bg-flixer-cyan shadow-[0_0_14px_rgba(75,217,232,0.65)]"></span>
        {{ t('auth.nextFavoriteIsHere') }}
      </span>
      <h2 class="mt-2 text-4xl font-semibold leading-tight tracking-tight text-flixer-text sm:text-5xl lg:text-6xl">
        {{ t('auth.everyStory') }}<br />{{ t('auth.startsSomewhere') }}
        <span class="text-flixer-accent">{{ t('auth.somewhere') }}</span>
      </h2>
      <p class="mt-4 max-w-sm text-sm leading-5 text-flixer-muted sm:text-base">{{ t('auth.welcomeDescription') }}</p>
    </div>
    <div class="relative z-10 mt-auto hidden items-center gap-3 pt-12 text-[9px] font-bold tracking-[0.18em] text-flixer-muted" :class="{ 'lg:flex': !compact }">
      <span class="h-px w-7 bg-gradient-to-r from-flixer-primary to-flixer-cyan"></span>
      {{ t('auth.storiesWorthStayingInFor') }}
    </div>
  </section>
</template>

<style>
html:has(.login-background),
body:has(.login-background),
.login-background {
  background: radial-gradient(ellipse 32rem 28rem at 100% 24%, color-mix(in srgb, var(--color-flixer-cyan) 10%, transparent), transparent), radial-gradient(ellipse 34rem 38rem at 0% 57%, color-mix(in srgb, var(--color-flixer-primary) 20%, transparent), transparent), var(--color-flixer-background);
}
</style>
