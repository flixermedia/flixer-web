<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import defaultLogo from '../../../resources/logo/flixer-logo.svg'
import { useAppearance } from '../../composables/useAppearance'

const { t } = useI18n()
defineProps<{ compact?: boolean; variant?: string }>()
const appearance = useAppearance()
const loginBackground = computed(() => appearance.activeTheme.value?.config.branding.loginBackground ?? null)
const logo = computed(() => appearance.logoUrl.value ?? defaultLogo)
</script>

<template>
  <section
    class="relative isolate flex flex-col justify-between overflow-hidden px-5 py-4 sm:px-8 sm:py-5"
    :class="{
      'lg:min-h-full lg:border-flixer-border/70 lg:bg-flixer-surface/40 lg:px-14 lg:py-12': !compact,
      'lg:border-r': !compact && variant === 'classic',
      'lg:border-l': !compact && (variant === 'spotlight' || variant === 'cinema'),
    }"
    :aria-label="t('auth.welcomeToFlixer')"
  >
    <template v-if="loginBackground">
      <div
        class="brand-background pointer-events-none absolute inset-0 -z-20 bg-cover bg-center"
        :style="{ backgroundImage: `url(${loginBackground})` }"
        aria-hidden="true"
      ></div>
      <div
        class="brand-background pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-flixer-background/90 via-flixer-background/70 to-flixer-background/95"
        aria-hidden="true"
      ></div>
    </template>

    <div
      class="brand-glow pointer-events-none absolute -left-24 top-1/3 -z-10 hidden size-80 rounded-full bg-flixer-primary/15 blur-3xl"
      :class="{ 'lg:block': !compact }"
      aria-hidden="true"
    ></div>

    <RouterLink
      class="brand-link relative z-10 inline-flex w-fit items-center gap-2.5 text-flixer-text no-underline"
      :class="{ 'lg:gap-3': !compact }"
      to="/"
      :aria-label="t('auth.flixerHome')"
    >
      <img
        :src="logo"
        alt=""
        class="brand-logo size-8 rounded object-contain shadow-sm"
        :class="{ 'lg:size-9': !compact }"
        aria-hidden="true"
      />
      <span class="brand-wordmark text-lg font-semibold tracking-tight" :class="{ 'lg:text-xl': !compact }">
        {{ t('auth.brandName') }}
      </span>
    </RouterLink>

    <div
      class="brand-story relative z-10 my-auto hidden max-w-lg py-10"
      :class="{ 'lg:block': !compact }"
    >
      <span class="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-flixer-muted">
        <span class="size-1.5 rounded-full bg-flixer-accent"></span>
        {{ t('auth.nextFavoriteIsHere') }}
      </span>
      <h2
        v-if="variant === 'spotlight' || variant === 'cinema'"
        class="brand-headline mt-3 text-4xl font-semibold leading-[1.1] tracking-tight text-flixer-text xl:text-5xl"
      >
        {{ t('auth.brandName') }}
      </h2>
      <h2
        v-else
        class="brand-headline mt-3 text-4xl font-semibold leading-[1.1] tracking-tight text-flixer-text xl:text-5xl"
      >
        {{ t('auth.everyStory') }}<br />{{ t('auth.startsSomewhere') }}
        <span class="text-flixer-accent">{{ t('auth.somewhere') }}</span>
      </h2>
      <p class="mt-4 max-w-sm text-sm leading-relaxed text-flixer-muted">
        {{ t('auth.welcomeDescription') }}
      </p>
    </div>

    <div
      class="brand-tagline relative z-10 hidden items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-flixer-muted/80"
      :class="{ 'lg:flex': !compact }"
    >
      <span class="h-px w-6 bg-flixer-border"></span>
      {{ t('auth.storiesWorthStayingInFor') }}
    </div>
  </section>
</template>
