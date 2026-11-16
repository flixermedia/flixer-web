<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import QrScanner from '../components/ui/QrScanner.vue'
import { getApiBaseUrl } from '../platform/serverConnection'
import { getServerUrlFromApiBase, parseLocalQuickSetupPairingUrl } from '../platform/quickSetupPairing'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const pairingUrl = ref('')
const serverUrl = ref('')
const error = ref('')
const sending = ref(false)
const paired = computed(() => route.query.paired === '1')

function handleScan(value: string) {
  const target = parseLocalQuickSetupPairingUrl(value)
  if (!target) {
    error.value = t('native.quickSetupInvalidCode')
    return
  }
  try {
    serverUrl.value = getServerUrlFromApiBase(getApiBaseUrl(), window.location.origin)
    pairingUrl.value = target.toString()
  } catch (cause) {
    console.error('[quick-setup] Could not determine the current Flixer server URL', cause)
    error.value = t('native.invalidServerUrl')
  }
}

function sendServerUrl() {
  if (!pairingUrl.value || !serverUrl.value || sending.value) return
  try {
    const form = document.createElement('form')
    form.method = 'post'
    form.action = pairingUrl.value
    form.hidden = true
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = 'server'
    input.value = serverUrl.value
    form.append(input)
    document.body.append(form)
    sending.value = true
    form.submit()
  } catch (cause) {
    console.error('[quick-setup] Could not send the Flixer server URL to the TV', cause)
    error.value = t('native.quickSetupSendError')
  }
}

onMounted(async () => {
  if (!paired.value) return
  try {
    const failure = await router.replace({ name: 'quick-connect', query: { scan: '1' } })
    if (failure) throw failure
  } catch (cause) {
    console.error('[quick-setup] Could not open Quick Connect', cause)
    error.value = t('native.quickSetupLoginNavigationError')
  }
})
</script>

<template>
  <main class="login-background flex min-h-[100dvh] items-center justify-center overflow-y-auto px-5 py-10 font-sans text-flixer-text">
    <section class="w-full max-w-xl rounded border border-flixer-border bg-flixer-surface/80 p-7 shadow-2xl sm:p-9" aria-labelledby="quick-setup-title">
      <p class="text-sm font-bold uppercase tracking-[0.2em] text-flixer-accent">{{ t('auth.loginEyebrow') }}</p>
      <h1 id="quick-setup-title" class="mt-4 text-3xl font-bold text-white">{{ t('native.quickSetupPageTitle') }}</h1>
      <p class="mt-4 text-base leading-relaxed text-flixer-muted">{{ t('native.quickSetupPageDescription') }}</p>

      <p v-if="paired" role="status" class="mt-7 rounded border border-flixer-accent/25 bg-flixer-primary/10 px-4 py-3 text-base text-flixer-accent">
        {{ t('native.quickSetupSuccess') }}
      </p>
      <p v-if="error" role="alert" class="mt-4 text-sm text-red-200">{{ error }}</p>
      <div v-if="!paired">
        <QrScanner v-if="!pairingUrl" :start-label="t('native.quickSetupStartScanner')" @start="error = ''" @scanned="handleScan" />
        <p v-if="pairingUrl" class="mt-6 text-base leading-relaxed text-flixer-text">
          {{ t('native.quickSetupReview', { server: serverUrl }) }}
        </p>
        <div v-if="pairingUrl" class="mt-7 flex flex-wrap gap-3">
          <button
            type="button"
            :disabled="sending"
            class="rounded bg-flixer-primary px-5 py-3 text-base font-bold text-white transition hover:bg-flixer-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:opacity-60"
            @click="sendServerUrl"
          >
            {{ sending ? t('native.quickSetupSent') : t('native.quickSetupSend') }}
          </button>
        </div>
      </div>
    </section>
  </main>
</template>
