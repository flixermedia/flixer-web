<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { decideOidcInteraction, getOidcInteraction, type OidcInteraction } from '../api/oidc'
import { describeRequestError } from '../composables/useProfile'
import { catchError } from '../utils/catchError'
import { useSignOut } from '../composables/useSignOut'
import AuthBrandPanel from '../components/auth/AuthBrandPanel.vue'

const { t, te } = useI18n()
const route = useRoute()
const uid = typeof route.params.uid === 'string' ? route.params.uid : ''
const interaction = ref<OidcInteraction | null>(null)
const busy = ref(true)
const errorMessage = ref('')
const { signOut, isSigningOut } = useSignOut()
const scopeLabel = (scope: string) => te(`oidc.scopes.${scope}`, 'en') ? t(`oidc.scopes.${scope}`) : scope

async function decide(action: 'login' | 'approve' | 'deny') {
  busy.value = true
  errorMessage.value = ''
  const [error, result] = await catchError(decideOidcInteraction(uid, action))
  if (error) {
    errorMessage.value = describeRequestError(error, t('oidc.interactionError'))
    busy.value = false
    return
  }
  let target: URL
  try {
    target = new URL(result.redirect, window.location.origin)
  } catch {
    errorMessage.value = t('oidc.invalidReturn')
    busy.value = false
    return
  }
  if (target.origin !== window.location.origin || !target.pathname.startsWith('/api/oidc/')) {
    errorMessage.value = t('oidc.invalidReturn')
    busy.value = false
    return
  }
  window.location.assign(target.href)
}

onMounted(async () => {
  const [error, result] = await catchError(getOidcInteraction(uid))
  if (error) {
    errorMessage.value = describeRequestError(error, t('oidc.interactionError'))
    busy.value = false
    return
  }
  interaction.value = result
  busy.value = false
})
</script>

<template>
  <main class="login-background relative isolate min-h-[100dvh] overflow-hidden font-sans text-flixer-text">
    <AuthBrandPanel compact />
    <section class="relative z-10 flex min-h-[420px] flex-col items-center px-6 pb-8 pt-5 sm:px-10" aria-labelledby="oidc-title">
      <div class="w-full max-w-md rounded border border-flixer-border/70 bg-flixer-surface/70 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
      <span class="text-[9px] font-bold tracking-[0.2em] text-flixer-accent">{{ t('auth.loginEyebrow') }}</span>
      <h1 id="oidc-title" class="mt-3 text-3xl font-semibold tracking-tight text-flixer-text sm:text-4xl">{{ t('oidc.title') }}<span class="text-flixer-accent">.</span></h1>
      <p v-if="busy && !interaction" class="mt-4 text-sm text-flixer-muted" role="status">{{ t('oidc.loading') }}</p>
      <template v-if="interaction?.prompt === 'login'">
        <p class="mt-4 text-sm leading-6 text-flixer-muted">{{ t('oidc.chooseAccount', { client: interaction.clientName }) }}</p>
        <p class="mt-4 rounded border border-flixer-border bg-flixer-background/50 px-4 py-3 text-sm">{{ t('oidc.signedInAs', { user: interaction.username }) }}</p>
        <div class="mt-6 flex flex-col gap-3">
          <button type="button" class="rounded bg-gradient-to-r from-flixer-primary to-flixer-secondary px-4 py-3 text-sm font-semibold text-white disabled:opacity-50" :disabled="busy || isSigningOut" @click="decide('login')">{{ t('oidc.continueAs', { user: interaction.username }) }}</button>
          <button type="button" class="rounded border border-flixer-border px-4 py-3 text-sm font-semibold disabled:opacity-50" :disabled="busy || isSigningOut" @click="signOut(`/oauth/interaction/${uid}`)">{{ t('oidc.switchAccount') }}</button>
        </div>
        <p class="mt-3 text-xs text-flixer-muted">{{ t('oidc.switchAccountHint') }}</p>
      </template>
      <template v-else-if="interaction?.prompt === 'consent'">
        <p class="mt-4 text-sm leading-6 text-flixer-muted">{{ t('oidc.consentDescription', { client: interaction.clientName, user: interaction.username }) }}</p>
        <p class="mt-4 text-sm font-medium">{{ t('oidc.permissions') }}</p>
        <ul class="mt-2 list-inside list-disc text-sm leading-6 text-flixer-muted">
          <li v-for="scope in interaction.scope.split(' ')" :key="scope">{{ scopeLabel(scope) }}</li>
        </ul>
        <div class="mt-6 flex gap-3">
          <button type="button" class="flex-1 rounded bg-gradient-to-r from-flixer-primary to-flixer-secondary px-4 py-3 text-sm font-semibold text-white disabled:opacity-50" :disabled="busy" @click="decide('approve')">{{ t('oidc.allow') }}</button>
          <button type="button" class="rounded border border-flixer-border px-4 py-3 text-sm font-semibold disabled:opacity-50" :disabled="busy" @click="decide('deny')">{{ t('oidc.deny') }}</button>
        </div>
      </template>
      <p v-if="errorMessage" class="mt-5 rounded border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">{{ errorMessage }}</p>
      </div>
    </section>
  </main>
</template>
