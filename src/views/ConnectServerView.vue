<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import logo from '../../resources/logo/flixer-logo.svg'
import { configureNativeServer, disconnectNativeServer } from '../api'
import { useProfile } from '../composables/useProfile'
import { getNativeServerUrl, isNativeApp } from '../platform/serverConnection'
import { fetchSetupGate } from '../setup/setupApi'
import { resetSetupGate } from '../setup/setupGate'

const { t } = useI18n()
const router = useRouter()
const serverUrl = ref('')
const isConnecting = ref(false)
const error = ref('')

onMounted(() => {
  if (!isNativeApp()) {
    void router.replace({ name: 'login' })
    return
  }
  serverUrl.value = getNativeServerUrl()
})

async function connect() {
  error.value = ''
  isConnecting.value = true
  try {
    const changed = configureNativeServer(serverUrl.value)
    if (changed) {
      useProfile().clear()
      resetSetupGate()
    }
    const gate = await fetchSetupGate()
    if (gate.kind === 'unavailable') throw new Error('unreachable')
    await router.replace({ name: gate.kind === 'setup' ? 'setup' : 'login' })
  } catch (cause) {
    error.value = cause instanceof Error && cause.message === 'invalid' ? t('native.invalidServerUrl') : t('native.serverUnreachable')
  } finally {
    isConnecting.value = false
  }
}

function resetServer() {
  disconnectNativeServer()
  serverUrl.value = ''
  useProfile().clear()
  resetSetupGate()
}
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-flixer-background px-5 py-10 text-flixer-text">
    <section class="w-full max-w-md rounded-2xl border border-flixer-border bg-flixer-surface/80 p-7 shadow-2xl sm:p-9" aria-labelledby="connect-title">
      <img :src="logo" alt="" class="mx-auto mb-5 size-16 rounded-xl" aria-hidden="true" />
      <h1 id="connect-title" class="text-center text-2xl font-bold">{{ t('native.connectTitle') }}</h1>
      <p class="mt-3 text-center text-sm leading-6 text-flixer-muted">{{ t('native.connectDescription') }}</p>

      <form class="mt-7 space-y-4" @submit.prevent="connect">
        <label for="server-url" class="block text-sm font-medium">{{ t('native.serverUrlLabel') }}</label>
        <input id="server-url" v-model="serverUrl" type="url" inputmode="url" autocomplete="url" autocapitalize="none" spellcheck="false" required placeholder="https://flixer.example.com" class="w-full rounded-xl border border-flixer-border bg-flixer-background px-4 py-3 text-flixer-text outline-none focus:border-flixer-accent" />
        <p class="text-xs leading-5 text-flixer-muted">{{ t('native.serverUrlHelp') }}</p>
        <p v-if="error" class="text-sm text-red-400" role="alert">{{ error }}</p>
        <button type="submit" :disabled="isConnecting" class="w-full rounded-xl bg-flixer-primary px-5 py-3 font-semibold text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60">
          {{ isConnecting ? t('native.connecting') : t('native.connectButton') }}
        </button>
      </form>

      <button v-if="getNativeServerUrl()" type="button" class="mt-5 w-full text-sm text-flixer-muted underline hover:text-flixer-text" @click="resetServer">
        {{ t('native.forgetServer') }}
      </button>
    </section>
  </main>
</template>
