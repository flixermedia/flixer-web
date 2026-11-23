<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import logo from '../../resources/logo/flixer-logo.svg'
import { verifyEmail, type InviteDestination } from '../api'
import { describeRequestError } from '../composables/useProfile'
import { catchError } from '../utils/catchError'

const { t } = useI18n()
const route = useRoute()
const status = ref<'loading' | 'success' | 'error'>('loading')
const errorMessage = ref('')
const destination = ref<InviteDestination | null>(null)

const isExternalDestination = computed(() => Boolean(destination.value && destination.value.type !== 'flixer'))

const destinationName = computed(() => {
  const target = destination.value
  if (!target || target.type === 'flixer') return t('admin.invites.types.flixer')
  return target.name?.trim() || t(`admin.invites.types.${target.type}`)
})

const destinationUrl = computed(() => {
  const target = destination.value
  if (!target || target.type === 'flixer') return null
  return target.url?.trim() || (target.type === 'plex' ? 'https://app.plex.tv' : null)
})

const plexCloudUrl = computed(() => {
  const target = destination.value
  if (!target || target.type !== 'plex') return null
  const current = destinationUrl.value ?? ''
  return /^https?:\/\/app\.plex\.tv(\/|$)/i.test(current) ? null : 'https://app.plex.tv'
})

onMounted(async () => {
  const token = typeof route.query.token === 'string' ? route.query.token : ''
  if (!token) {
    status.value = 'error'
    errorMessage.value = t('verify.missingToken')
    return
  }

  const [error, result] = await catchError(verifyEmail(token))
  if (error) {
    console.error('[auth] email verification failed', error)
    errorMessage.value = describeRequestError(error, t('verify.failedFallback'))
    status.value = 'error'
    return
  }
  destination.value = result.destination ?? null
  status.value = 'success'
})
</script>

<template>
  <main class="grid min-h-screen place-items-center bg-flixer-background px-6 font-sans text-flixer-text">
    <div class="w-full max-w-md rounded border border-flixer-border/70 bg-flixer-surface/70 p-8 text-center shadow-2xl">
      <img :src="logo" alt="" class="mx-auto size-14 rounded shadow-lg" aria-hidden="true" />

      <template v-if="status === 'loading'">
        <h1 class="mt-6 text-2xl font-semibold tracking-tight">{{ t('verify.verifying') }}</h1>
        <span class="mx-auto mt-6 block size-6 animate-spin rounded-full border-2 border-white/20 border-t-flixer-accent" aria-hidden="true"></span>
      </template>

      <template v-else-if="status === 'success'">
        <h1 class="mt-6 text-2xl font-semibold tracking-tight">
          {{ t('verify.verified') }}
          <span class="text-flixer-accent">.</span>
        </h1>
        <template v-if="isExternalDestination">
          <p class="mt-2 text-sm text-flixer-muted">
            {{ destination?.invitedByEmail ? t('verify.plexInviteReady', { name: destinationName }) : t('verify.inviteAccountReady', { name: destinationName }) }}
          </p>
          <p v-if="destination?.type === 'jellyfin' || destination?.type === 'emby'" class="mt-2 text-xs text-flixer-muted">{{ t('verify.inviteCredentials') }}</p>
          <p v-if="destination?.instructions" class="mt-4 whitespace-pre-wrap rounded border border-flixer-border bg-flixer-background/60 p-3 text-left text-xs leading-5 text-flixer-text">{{ destination.instructions }}</p>
          <a v-if="destinationUrl" :href="destinationUrl" target="_blank" rel="noopener noreferrer" class="mt-8 flex h-12 w-full items-center justify-center rounded bg-gradient-to-r from-flixer-primary to-flixer-secondary text-sm font-semibold text-white shadow-lg shadow-flixer-primary/20 transition hover:brightness-110">
            {{ t('verify.goToDestination', { name: destinationName }) }}
          </a>
          <a v-if="plexCloudUrl" :href="plexCloudUrl" target="_blank" rel="noopener noreferrer" class="mt-3 flex h-11 w-full items-center justify-center rounded border border-flixer-border bg-flixer-surface/50 text-sm font-semibold text-flixer-text transition hover:border-flixer-accent/40">
            {{ t('invite.openPlexCloud') }}
          </a>
          <RouterLink v-else-if="!destinationUrl" :to="{ name: 'login' }" class="mt-8 flex h-12 w-full items-center justify-center rounded bg-gradient-to-r from-flixer-primary to-flixer-secondary text-sm font-semibold text-white shadow-lg shadow-flixer-primary/20 transition hover:brightness-110">{{ t('verify.goToSignIn') }}</RouterLink>
        </template>
        <template v-else>
          <p class="mt-2 text-sm text-flixer-muted">{{ t('verify.accountReady') }}</p>
          <RouterLink :to="{ name: 'login' }" class="mt-8 flex h-12 w-full items-center justify-center rounded bg-gradient-to-r from-flixer-primary to-flixer-secondary text-sm font-semibold text-white shadow-lg shadow-flixer-primary/20 transition hover:brightness-110">{{ t('verify.goToSignIn') }}</RouterLink>
        </template>
      </template>

      <template v-else>
        <h1 class="mt-6 text-2xl font-semibold tracking-tight">{{ t('verify.failed') }}</h1>
        <p class="mt-2 text-sm text-rose-300" role="alert">{{ errorMessage }}</p>
        <p class="mt-2 text-xs text-flixer-muted">{{ t('verify.requestAnotherEmail') }}</p>
        <RouterLink :to="{ name: 'login' }" class="mt-8 flex h-12 w-full items-center justify-center rounded border border-flixer-border bg-flixer-surface/50 text-sm font-semibold text-flixer-text transition hover:border-flixer-accent/40">{{ t('verify.goToSignIn') }}</RouterLink>
      </template>
    </div>
  </main>
</template>
