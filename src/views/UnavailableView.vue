<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import logo from '../../resources/logo/flixer-logo.svg'
import { fetchSetupGate } from '../setup/setupApi'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const checking = ref(false)
const starting = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

function target(): string {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/'
}

// The router guard asks the server again on this navigation, so a recovered server leads straight to the right page.
async function retry(): Promise<void> {
  checking.value = true
  const gate = await fetchSetupGate()
  starting.value = gate.kind === 'unavailable' && gate.reason === 'starting'
  checking.value = false
  if (gate.kind !== 'unavailable') {
    await router.replace(target())
    return
  }
  timer = setTimeout(() => void retry(), 5000)
}

onMounted(() => void retry())
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <main class="fixed inset-0 flex flex-col items-center justify-center gap-6 bg-flixer-background px-6 text-center text-flixer-text">
    <img :src="logo" alt="Flixer" class="h-8 w-auto" />
    <div class="max-w-md">
      <h1 class="text-2xl font-semibold tracking-tight">{{ starting ? t('setup.unavailable.startingTitle') : t('setup.unavailable.title') }}</h1>
      <p class="mt-2 text-sm leading-6 text-flixer-muted" role="status">{{ starting ? t('setup.unavailable.startingDescription') : t('setup.unavailable.description') }}</p>
    </div>
    <button type="button" class="h-11 rounded-lg bg-flixer-primary px-6 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60" :disabled="checking" @click="retry">{{ t('setup.retry') }}</button>
  </main>
</template>
